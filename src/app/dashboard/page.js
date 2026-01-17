'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';

// Import tab components
import OverviewTab from './components/tabs/OverviewTab';
import WalletTab from './components/tabs/WalletTab';
import ReferralTab from './components/tabs/ReferralTab';
import AccountTab from './components/tabs/AccountTab';

// Tab configuration - simplified for clarity
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'referral', label: 'Referrals' },
  { id: 'account', label: 'Account' }
];

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollerRef = useRef(null);

  // Get initial tab from URL query parameter
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && ['overview', 'wallet', 'referral', 'account'].includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Core state
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loadedTabs, setLoadedTabs] = useState(new Set([initialTab]));
  
  // Shared data state (available to all tabs)
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [arcaPendingStats, setArcaPendingStats] = useState(null);
  const [claimingEntropy, setClaimingEntropy] = useState(false);

  // Mount gate + token check
  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [router]);

  // Update active tab when URL changes
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['overview', 'wallet', 'referral', 'account'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setLoadedTabs(prev => new Set([...prev, urlTab]));
    }
  }, [searchParams]);

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

  // Fetch Arca pending entropy stats if user has linkedArcaIds but no wallet
  useEffect(() => {
    if (!profile?.linkedArcaIds?.length || profile?.walletAddress) {
      setArcaPendingStats(null);
      return;
    }

    const fetchArcaStats = async () => {
      try {
        const ARCA_API = process.env.NEXT_PUBLIC_ARCA_API_URL || 'https://api.arca-protocol.com';
        let totalPackets = 0;
        let totalBits = 0;

        for (const arcaId of profile.linkedArcaIds) {
          const res = await fetch(`${ARCA_API}/v1/entropy/supplier/${arcaId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.supplier) {
              totalPackets += data.supplier.packetCount || 0;
              totalBits += data.supplier.totalBits || 0;
            }
          }
        }

        setArcaPendingStats({ totalPackets, totalBits });
      } catch (err) {
        console.error('Failed to fetch Arca pending stats:', err);
      }
    };

    fetchArcaStats();
  }, [profile?.linkedArcaIds, profile?.walletAddress]);

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

  // Claim entropy from linked Arca IDs to wallet
  const handleClaimEntropy = async () => {
    if (!profile?.linkedArcaIds?.length || !profile?.walletAddress) return;

    setClaimingEntropy(true);
    setError('');

    try {
      const ARCA_API = process.env.NEXT_PUBLIC_ARCA_API_URL || 'https://api.arca-protocol.com';
      let totalClaimed = 0;

      for (const arcaId of profile.linkedArcaIds) {
        try {
          const res = await fetch(`${ARCA_API}/v1/entropy/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromSupplierId: arcaId,
              toSupplierId: profile.walletAddress
            })
          });

          if (res.ok) {
            const data = await res.json();
            totalClaimed += data.claimed?.packetsTransferred || 0;
            console.log(`✅ Claimed entropy from ${arcaId}:`, data);
          } else {
            console.warn(`⚠️ Failed to claim from ${arcaId}:`, res.status);
          }
        } catch (err) {
          console.error(`❌ Error claiming from ${arcaId}:`, err);
        }
      }

      if (totalClaimed > 0) {
        setSuccess(`Successfully claimed ${totalClaimed} entropy packets to your wallet!`);
        // Clear the pending stats since we claimed them
        setArcaPendingStats(null);
      } else {
        setSuccess('Entropy claim processed. Check your wallet stats.');
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('❌ Entropy claim failed:', err);
      setError('Failed to claim entropy. Please try again.');
    } finally {
      setClaimingEntropy(false);
    }
  };

  // Shared context object
  const sharedContext = {
    profile,
    setProfile,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <LoadingSpinner />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background is in layout.js */}

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
                    <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                      Gambino Gold
                    </span>
                  </h1>
                  <p className="text-neutral-400 text-sm">Network Dashboard</p>
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

            {/* DOB Required Banner */}
            {profile && !profile.dateOfBirth && (
              <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-4 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-amber-200 font-medium">Date of Birth Required</p>
                      <p className="text-amber-300/70 text-sm">Please update your profile with your date of birth for age verification.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('account')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors text-sm"
                  >
                    Update Now
                  </button>
                </div>
              </div>
            )}

            {/* Pending Referral Bonus Banner - show if referred but no wallet yet */}
            {profile?.referredBy && !profile?.walletAddress && (
              <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/50 rounded-xl p-4 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-200 font-medium">
                        Referral Bonus Awaiting!
                      </p>
                      <p className="text-green-300/70 text-sm">
                        You were referred by a friend! Set up your wallet to receive your <span className="font-bold text-green-300">welcome bonus</span>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('wallet')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Set Up Wallet
                  </button>
                </div>
              </div>
            )}

            {/* Arca Entropy Pending Banner - show if user has linked Arca IDs but no wallet */}
            {profile?.linkedArcaIds?.length > 0 && !profile?.walletAddress && (
              <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 border border-violet-500/50 rounded-xl p-4 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-violet-200 font-medium">
                        Pending Entropy Contributions
                      </p>
                      <p className="text-violet-300/70 text-sm">
                        {arcaPendingStats?.totalPackets > 0 ? (
                          <>
                            <span className="font-bold text-violet-300">{arcaPendingStats.totalPackets} packets</span>
                            {arcaPendingStats.totalBits > 0 && <span> ({arcaPendingStats.totalBits.toFixed(1)} bits)</span>}
                            {' '}from <span className="font-bold text-violet-300">Arca Protocol</span> waiting to be collected.
                          </>
                        ) : (
                          <>Entropy contributions from <span className="font-bold text-violet-300">Arca Protocol</span> waiting to be collected.</>
                        )}
                        {' '}Create a wallet to claim them.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('wallet')}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Create Wallet
                  </button>
                </div>
              </div>
            )}

            {/* Arca Entropy Claim Banner - show if user has linked Arca IDs AND a wallet */}
            {profile?.linkedArcaIds?.length > 0 && profile?.walletAddress && (
              <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 border border-violet-500/50 rounded-xl p-4 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-violet-200 font-medium">
                        Claim Your Entropy
                      </p>
                      <p className="text-violet-300/70 text-sm">
                        You have entropy contributions from <span className="font-bold text-violet-300">Arca Protocol</span> ready to claim to your wallet.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClaimEntropy}
                    disabled={claimingEntropy}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    {claimingEntropy ? 'Claiming...' : 'Claim Entropy'}
                  </button>
                </div>
              </div>
            )}

            {/* KYC Verification Banner - show if not verified */}
            {profile && profile.kycStatus !== 'verified' && (
              <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/50 rounded-xl p-4 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-200 font-medium">
                        Verify Your Identity - Earn 25 GG!
                      </p>
                      <p className="text-blue-300/70 text-sm">
                        Visit any participating venue with your ID to complete KYC verification and receive <span className="font-bold text-blue-300">25 GG tokens</span>.
                        {profile?.referredBy && <span className="text-cyan-300"> Plus unlock your referral bonus!</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('account')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            )}
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
  {tab.label}
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

            {activeTab === 'referral' && loadedTabs.has('referral') && (
              <ReferralTab {...sharedContext} />
            )}

            {activeTab === 'account' && loadedTabs.has('account') && (
              <AccountTab {...sharedContext} />
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

export default function UserDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <LoadingSpinner />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}