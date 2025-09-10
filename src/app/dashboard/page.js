'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';

// Import tab components
import OverviewTab from './components/tabs/OverviewTab';
import WalletTab from './components/tabs/WalletTab';
import GamingTab from './components/tabs/GamingTab';
import SettingsTab from './components/tabs/SettingsTab';

// Tab configuration - updated for professional terminology
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'wallet', label: 'Infrastructure', icon: '⚡' },
  { id: 'gaming', label: 'Network Access', icon: '🔗' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function UserDashboard() {
  const router = useRouter();
  const pollerRef = useRef(null);
  
  // Core state
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['overview']));
  
  // Shared data state (available to all tabs)
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mount gate + token check
  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [router]);

  // Fetch shared data on mount
  useEffect(() => {
    if (!mounted) return;
    
    let cancelled = false;
    
    const fetchSharedData = async () => {
      try {
        setError('');
        console.log('🔍 Loading dashboard data...');
        
        // Fetch profile (always needed)
        const profileRes = await api.get('/api/users/profile');
        if (cancelled) return;
        
        const profileData = profileRes.data?.user;
        setProfile(profileData);
        console.log('✅ Profile loaded:', profileData?.email);

        // Fetch current session
        const sessionRes = await api.get('/api/users/current-session');
        if (cancelled) return;
        setCurrentSession(sessionRes.data.session);
        console.log('✅ Current session loaded:', sessionRes.data.session ? 'Active session found' : 'No active session');

        // Fetch session history
        try {
          console.log('🔍 Loading session history...');
          const historyRes = await api.get('/api/users/session-history?limit=10');
          if (cancelled) return;
          const sessions = historyRes.data?.sessions || [];
          setSessionHistory(sessions);
          console.log('✅ Session history loaded:', sessions.length, 'sessions');
        } catch (historyErr) {
          console.error('❌ Session history failed:', historyErr);
          console.error('Session history error response:', historyErr?.response?.data);
          setSessionHistory([]);
        }

        // Fetch balances if wallet exists
        if (profileData?.walletAddress) {
          console.log('🔍 Loading balances for wallet:', profileData.walletAddress.slice(0, 8) + '...');
          const balRes = await api.get(`/api/wallet/balance/${profileData.walletAddress}?updateDB=true`);
          if (cancelled) return;
          setBalances(balRes.data?.balances);
          console.log('✅ Balances loaded:', balRes.data?.balances);
          
          // If balance fetch succeeded, refresh profile to get updated DB values
          if (balRes.data?.balances) {
            setTimeout(async () => {
              try {
                const updatedProfileRes = await api.get('/api/users/profile');
                if (!cancelled) {
                  setProfile(updatedProfileRes.data?.user);
                  console.log('✅ Profile refreshed after balance update');
                }
              } catch (err) {
                console.error('Failed to refresh profile after balance update:', err);
              }
            }, 1000);
          }
        }
        
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Dashboard data loading failed:', err);
          setError(err?.response?.data?.error || 'Failed to load dashboard data');
        }
      }
    };

    fetchSharedData();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  // Separate effect for polling that depends on profile
  useEffect(() => {
    if (!profile?.walletAddress) return;

    console.log('🔄 Starting polling for wallet:', profile.walletAddress.slice(0, 8) + '...');

    const pollingInterval = setInterval(async () => {
      try {
        // Poll session status
        const sessionRes = await api.get('/api/users/current-session');
        setCurrentSession(sessionRes.data.session);

        // Poll balances if wallet exists
        const balRes = await api.get(`/api/wallet/balance/${profile.walletAddress}`);
        setBalances(balRes.data?.balances);
        
        console.log('🔄 Polling update completed');
      } catch (err) {
        // Silent fail for background polling
        console.warn('⚠️ Polling failed:', err.message);
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      console.log('🛑 Stopping polling');
      clearInterval(pollingInterval);
    };
  }, [profile?.walletAddress]);

  // Handle tab change with lazy loading
  const handleTabChange = (tabId) => {
    console.log('🔄 Switching to tab:', tabId);
    setActiveTab(tabId);
    setLoadedTabs(prev => new Set([...prev, tabId]));
  };

  // Shared functions that tabs can use
  const refreshProfile = async () => {
    try {
      console.log('🔄 Refreshing profile...');
      const res = await api.get('/api/users/profile');
      setProfile(res.data?.user);
      console.log('✅ Profile refreshed');
    } catch (err) {
      console.error('❌ Profile refresh failed:', err);
      setError('Failed to refresh profile');
    }
  };

  const refreshBalances = async () => {
    if (!profile?.walletAddress) return;
    try {
      console.log('🔄 Refreshing balances...');
      const res = await api.get(`/api/wallet/balance/${profile.walletAddress}?updateDB=true`);
      setBalances(res.data?.balances);
      console.log('✅ Balances refreshed');
    } catch (err) {
      console.error('❌ Balance refresh failed:', err);
      setError('Failed to refresh balances');
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session...');
      const res = await api.get('/api/users/current-session');
      setCurrentSession(res.data.session);
      console.log('✅ Session refreshed');
    } catch (err) {
      console.error('❌ Session refresh failed:', err);
      setError('Failed to refresh session');
    }
  };

  const refreshSessionHistory = async () => {
    try {
      console.log('🔄 Refreshing session history...');
      const res = await api.get('/api/users/session-history?limit=10');
      setSessionHistory(res.data?.sessions || []);
      console.log('✅ Session history refreshed:', res.data?.sessions?.length || 0, 'sessions');
    } catch (err) {
      console.error('❌ Session history refresh failed:', err);
      setSessionHistory([]);
    }
  };

  // Shared context object
  const sharedContext = {
    profile,
    balances,
    currentSession,
    sessionHistory,
    error,
    success,
    setError,
    setSuccess,
    refreshProfile,
    refreshBalances,
    refreshSession,
    refreshSessionHistory
  };

  // Don't render on server or if not authenticated
  if (!mounted || !getToken()) return null;

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <LoadingSpinner />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Effects - Same as login */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 border border-yellow-600/10 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            {/* Logo and Brand */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-2xl p-2">
                    <img 
                      src="/logo.png" 
                      alt="Gambino Gold Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-lg"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      GAMBINO GOLD
                    </span>
                  </h1>
                  <p className="text-gray-400 text-sm">Network Dashboard</p>
                </div>
              </div>
              
              {/* User Info */}
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {profile?.firstName} {profile?.lastName}
                </div>
                <div className="text-xs text-gray-400">
                  Network Participant
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Infrastructure Dashboard
              </h2>
              <p className="text-gray-300 text-sm">
                Welcome back, {profile?.firstName || 'User'}. Monitor your network participation and infrastructure access.
              </p>
            </div>
          </div>

          {/* Global Messages */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm mb-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                <p className="text-red-200 text-sm font-medium">{error}</p>
                <button 
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm mb-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <p className="text-green-200 text-sm font-medium">{success}</p>
                <button 
                  onClick={() => setSuccess('')}
                  className="ml-auto text-green-400 hover:text-green-300"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl mb-8">
            <nav className="flex space-x-1 p-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm">{tab.icon}</span>
                    {tab.label}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-6">
            {activeTab === 'overview' && (
              <OverviewTab {...sharedContext} />
            )}
            
            {activeTab === 'wallet' && loadedTabs.has('wallet') && (
              <WalletTab {...sharedContext} />
            )}
            
            {activeTab === 'gaming' && loadedTabs.has('gaming') && (
              <GamingTab {...sharedContext} />
            )}
            
            {activeTab === 'settings' && loadedTabs.has('settings') && (
              <SettingsTab {...sharedContext} />
            )}

            {/* Show loading for unloaded tabs */}
            {!loadedTabs.has(activeTab) && activeTab !== 'overview' && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-400">
                  <LoadingSpinner />
                  <span>Loading {TABS.find(t => t.id === activeTab)?.label}...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-xs space-y-1">
            <p>© 2025 Gambino Gold. Mining infrastructure platform.</p>
            <p>Building sustainable community wealth through transparent technology.</p>
          </div>
        </div>
      </div>
    </div>
  );
}