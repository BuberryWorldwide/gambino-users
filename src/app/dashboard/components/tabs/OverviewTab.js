import { useState, useEffect } from 'react';
import { useEntropy, useEntropyPool } from '@/lib/useEntropy';
import { miningAPI } from '@/lib/api';

function StatCard({ label, value, sub, highlight = false }) {
  return (
    <div className={`bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 ${highlight ? 'ring-1 ring-yellow-500/30' : ''}`}>
      <span className="text-xs text-neutral-500 uppercase tracking-wider">{label}</span>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function OverviewTab({
  profile,
  balances,
  currentSession,
  setError,
  setSuccess,
  refreshSession,
  refreshBalances,
  refreshProfile
}) {
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [launchingSession, setLaunchingSession] = useState(null);
  const [miningInterfaces, setMiningInterfaces] = useState([]);
  const [loadingInterfaces, setLoadingInterfaces] = useState(true);

  // Fetch mining interfaces on mount
  useEffect(() => {
    const fetchInterfaces = async () => {
      try {
        const interfaces = await miningAPI.getInterfaces();
        setMiningInterfaces(interfaces);
      } catch (error) {
        console.error('Failed to fetch mining interfaces:', error);
      } finally {
        setLoadingInterfaces(false);
      }
    };
    fetchInterfaces();
  }, []);

  // Launch a mining session with authenticated session
  const handleLaunchMining = async (gameUrl) => {
    try {
      setLaunchingSession(gameUrl);
      const sessionUrl = await miningAPI.launchSession(gameUrl);
      window.open(sessionUrl, '_blank');
    } catch (error) {
      console.error('Failed to launch mining session:', error);
      setError?.(error.message || 'Failed to launch mining session');
    } finally {
      setLaunchingSession(null);
    }
  };

  // Fetch entropy stats using wallet address as supplier_id
  const { stats: entropyStats, loading: entropyLoading, refresh: refreshEntropy } = useEntropy(profile?.walletAddress);

  // Fetch global pool stats
  const { pool: entropyPool, recentDraws, loading: poolLoading, refresh: refreshPool } = useEntropyPool();

  // Balance values
  const cachedGambinoBalance = profile?.cachedGambinoBalance || 0;
  const cachedSolBalance = profile?.cachedSolBalance || 0;
  const cachedUsdcBalance = profile?.cachedUsdcBalance || 0;

  // Use live balances if available, otherwise cached
  const ggBalance = balances?.GG !== undefined ? Number(balances.GG || 0) : cachedGambinoBalance;
  const solBalance = balances?.SOL !== undefined ? Number(balances.SOL) : cachedSolBalance;
  const usdcBalance = balances?.USDC !== undefined ? Number(balances.USDC || 0) : cachedUsdcBalance;

  // Stats from profile
  const gluck = profile?.gluckScore || 0;
  const tier = profile?.tier || 'none';
  const majorEvents = profile?.majorMiningEvents || profile?.majorJackpots || 0;
  const minorEvents = profile?.minorMiningEvents || profile?.minorJackpots || 0;
  const totalEvents = majorEvents + minorEvents;

  const handleEndSession = async () => {
    try {
      const api = (await import('@/lib/api')).default;
      await api.post('/api/users/end-session');
      await refreshSession();
      setSuccess('Session ended');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to end session');
    }
  };

  const handleRefreshBalance = async () => {
    if (!profile?.walletAddress || refreshingBalance) return;

    setRefreshingBalance(true);
    try {
      await refreshBalances();
      await refreshProfile();
      setSuccess('Balances refreshed!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to refresh balances');
    } finally {
      setRefreshingBalance(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Session */}
      {currentSession && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-white font-medium">{currentSession.machineName || currentSession.machineId}</p>
                <p className="text-sm text-green-400">{currentSession.storeName}</p>
              </div>
            </div>
            <button
              onClick={handleEndSession}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Balances Section */}
      {profile?.walletAddress ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Your Balances</h3>
            <button
              onClick={handleRefreshBalance}
              disabled={refreshingBalance}
              className="text-xs text-yellow-400 hover:text-yellow-300 disabled:text-neutral-500 transition-colors flex items-center gap-2"
            >
              {refreshingBalance ? (
                <><LoadingSpinner /> Syncing...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">SOL</p>
              <p className="text-2xl font-bold text-white">{solBalance.toFixed(4)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">GAMBINO</p>
              <p className="text-2xl font-bold text-yellow-400">{ggBalance.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">USDC</p>
              <p className="text-2xl font-bold text-white">${usdcBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">No Wallet Connected</p>
          <p className="text-neutral-400 text-sm">Set up your wallet in the Wallet tab to see your balances</p>
        </div>
      )}

      {/* Entropy Stats Section */}
      {profile?.walletAddress && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Entropy Contributions
            </h3>
            <button
              onClick={refreshEntropy}
              disabled={entropyLoading}
              className="text-xs text-gold hover:text-yellow-300 disabled:text-neutral-500 transition-colors flex items-center gap-2"
            >
              {entropyLoading ? (
                <><LoadingSpinner /> Loading...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          {entropyStats?.totalPackets > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Bits</p>
                <p className="text-xl font-bold text-gold">{(entropyStats.totalBitsClaimed || entropyStats.totalBitsVerified || 0).toFixed(0)}</p>
              </div>
              <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Packets</p>
                <p className="text-xl font-bold text-white">{entropyStats.totalPackets || 0}</p>
              </div>
              <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Quality</p>
                <p className="text-xl font-bold text-green-400">{((entropyStats.avgQuality || 0) * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Anchored</p>
                <p className="text-xl font-bold text-blue-400">{entropyStats.anchoredPackets || 0}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gold/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">No Entropy Yet</p>
              <p className="text-neutral-400 text-sm">Start mining sessions to contribute entropy and receive distributions!</p>
            </div>
          )}

          {entropyStats?.lastPacketAt && (
            <div className="mt-3 pt-3 border-t border-neutral-700 text-xs text-neutral-500 text-center">
              Last contribution: {new Date(entropyStats.lastPacketAt).toLocaleDateString()} at {new Date(entropyStats.lastPacketAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Mining Sessions Section */}
      <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-gold/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Mine & Contribute Entropy</h3>
        </div>
        <p className="text-neutral-400 text-sm mb-4">
          Start mining sessions to contribute entropy to the Arca Protocol network and receive distributions!
        </p>
        {loadingInterfaces ? (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner />
            <span className="ml-2 text-neutral-400">Loading interfaces...</span>
          </div>
        ) : (
          <div className={`grid gap-3 ${miningInterfaces.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {miningInterfaces.map((iface) => (
              <button
                key={iface.slug}
                onClick={() => handleLaunchMining(iface.game_url)}
                disabled={launchingSession}
                className="flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 text-black font-semibold py-3 px-4 rounded-lg transition-all bg-gradient-to-r from-yellow-500 to-amber-400"
              >
                {launchingSession === iface.game_url ? (
                  <LoadingSpinner />
                ) : (
                  <span>{iface.icon}</span>
                )}
                {iface.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Network Entropy Pool Section */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Arca Network Pool
          </h3>
          <button
            onClick={refreshPool}
            disabled={poolLoading}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:text-neutral-500 transition-colors flex items-center gap-2"
          >
            {poolLoading ? (
              <><LoadingSpinner /> Loading...</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {entropyPool ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Available</p>
                <p className="text-xl font-bold text-green-400">{entropyPool.available?.bits?.toFixed(1) || 0}</p>
                <p className="text-xs text-neutral-500">{entropyPool.available?.packets || 0} packets</p>
              </div>
              <div className="text-center p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Consumed</p>
                <p className="text-xl font-bold text-amber-400">{entropyPool.consumed?.bits?.toFixed(1) || 0}</p>
                <p className="text-xs text-neutral-500">{entropyPool.consumed?.packets || 0} packets</p>
              </div>
              <div className="text-center p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">Total</p>
                <p className="text-xl font-bold text-blue-400">{entropyPool.total?.bits?.toFixed(1) || 0}</p>
                <p className="text-xs text-neutral-500">{entropyPool.total?.suppliers || 0} suppliers</p>
              </div>
            </div>

            {/* Progress bar showing available vs consumed */}
            {entropyPool.total?.packets > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Pool Utilization</span>
                  <span>{((entropyPool.consumed?.packets || 0) / entropyPool.total.packets * 100).toFixed(1)}% consumed</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, ((entropyPool.consumed?.packets || 0) / entropyPool.total.packets * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recent Draws */}
            {recentDraws?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-700">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Recent Entropy Draws</p>
                <div className="space-y-2">
                  {recentDraws.slice(0, 3).map((draw, i) => (
                    <div key={draw.drawId || i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-neutral-400">{draw.bits} bits drawn</span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(draw.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <LoadingSpinner />
            <p className="text-neutral-400 text-sm mt-2">Loading pool stats...</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Glück Score"
          value={gluck.toLocaleString()}
          sub={`Tier: ${tier.toUpperCase()}`}
          highlight={gluck > 1000}
        />
        <StatCard
          label="Mining Events"
          value={totalEvents}
          sub={`${majorEvents} major • ${minorEvents} minor`}
          highlight={totalEvents > 0}
        />
        <StatCard
          label="Status"
          value={currentSession ? 'Active' : 'Idle'}
          sub={currentSession ? 'In session' : 'Not mining'}
        />
        <StatCard
          label="Member Since"
          value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
        />
      </div>

      {/* Quick Info */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{profile?.firstName} {profile?.lastName}</p>
            <p className="text-sm text-neutral-400">{profile?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Account</p>
            <p className="text-sm text-green-400">{profile?.isActive === false ? 'Inactive' : 'Active'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
