import { useState } from 'react';

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
  const jackMajor = profile?.majorJackpots || 0;
  const jackMinor = profile?.minorJackpots || 0;
  const jackTotal = jackMajor + jackMinor;

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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Glück Score"
          value={gluck.toLocaleString()}
          sub={`Tier: ${tier.toUpperCase()}`}
          highlight={gluck > 1000}
        />
        <StatCard
          label="Total Jackpots"
          value={jackTotal}
          sub={`${jackMajor} major • ${jackMinor} minor`}
          highlight={jackTotal > 0}
        />
        <StatCard
          label="Status"
          value={currentSession ? 'Active' : 'Idle'}
          sub={currentSession ? 'In session' : 'Not playing'}
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
