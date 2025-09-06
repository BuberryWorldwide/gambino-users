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

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'wallet', label: 'Wallet', icon: '💰' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

function LoadingSpinner() {
  return (
    <div className="loading-spinner w-5 h-5 text-yellow-500"></div>
  );
}

export default function UserDashboard() {
  const router = useRouter();
  const pollerRef = useRef(null);
  
  // Core state
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['overview'])); // Track which tabs have been loaded
  
  // Shared data state (available to all tabs)
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]); // ADD: Session history
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

        // Fetch session history (ADD THIS)
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
            }, 1000); // Small delay to allow DB update
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

  // ADD: Refresh session history function
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
    sessionHistory, // ADD: Session history to context
    error,
    success,
    setError,
    setSuccess,
    refreshProfile,
    refreshBalances,
    refreshSession,
    refreshSessionHistory // ADD: Session history refresh function
  };

  // Don't render on server or if not authenticated
  if (!mounted || !getToken()) return null;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <LoadingSpinner />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Dashboard
        </h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Welcome back, {profile?.firstName || 'Player'}! Manage your account and track your progress.
        </p>
      </div>

      {/* Global Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-6 backdrop-blur-sm text-sm">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-400 hover:text-red-300 ml-4"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500/30 text-green-300 p-3 rounded-lg mb-6 backdrop-blur-sm text-sm">
          {success}
          <button 
            onClick={() => setSuccess('')}
            className="float-right text-green-400 hover:text-green-300 ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-neutral-700 mb-6">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300 hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
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
            <div className="flex items-center gap-3 text-neutral-400">
              <LoadingSpinner />
              <span>Loading {TABS.find(t => t.id === activeTab)?.label}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}