import { useState, useEffect } from 'react';
import api from '@/lib/api';

function StatBox({ label, value, sub, highlight = false }) {
  return (
    <div className={`stat-box ${highlight ? 'ring-2 ring-yellow-500/30' : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner w-5 h-5 text-yellow-500"></div>
  );
}

export default function OverviewTab({ 
  profile, 
  balances,
  currentSession, 
  setError, 
  setSuccess, 
  refreshSession,
  refreshProfile 
}) {
  // Profile editing
  const [profileForm, setProfileForm] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || ''
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Wallet generation
  const [generatingWallet, setGeneratingWallet] = useState(false);

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  // Calculate stats from the actual profile data
  const cachedGambinoBalance = profile?.cachedGambinoBalance || 0;
  const cachedSolBalance = profile?.cachedSolBalance || 0;
  const cachedUsdcBalance = profile?.cachedUsdcBalance || 0;
  const gluck = profile?.gluckScore || 0;
  const tier = profile?.tier || 'none';
  const jackMajor = profile?.majorJackpots || 0;
  const jackMinor = profile?.minorJackpots || 0;
  const jackTotal = (jackMajor + jackMinor);
  const uniqueMachines = new Set(profile?.machinesPlayed || []).size;

  // Check when balances were last updated
  const balanceLastUpdated = profile?.balanceLastUpdated;
  const isBalanceStale = !balanceLastUpdated || 
    (Date.now() - new Date(balanceLastUpdated).getTime() > 5 * 60 * 1000);

  const walletStatus = profile?.walletAddress ? 
    (isBalanceStale ? 'Syncing...' : 'Connected') : 
    'No Wallet Yet';

  const handleEndSession = async () => {
    try {
      await api.post('/api/users/end-session');
      await refreshSession();
      setSuccess('Session ended successfully');
    } catch (err) {
      setError('Failed to end session');
    }
  };

  const handleEditProfile = () => {
    setProfileForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    setShowEditProfile(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await api.put('/api/users/profile', profileForm);
      
      if (res.data?.success) {
        setProfileSuccess('Profile updated successfully!');
        await refreshProfile();
        setShowEditProfile(false);
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      setProfileError(err?.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleGenerateWallet = async () => {
    setGeneratingWallet(true);
    setError('');
    try {
      const res = await api.post('/api/wallet/generate');
      if (res.data?.success) {
        await refreshProfile();
        setSuccess('Wallet generated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate wallet');
    } finally {
      setGeneratingWallet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Success Message */}
      {profileSuccess && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 rounded-lg backdrop-blur-sm text-sm">
          {profileSuccess}
        </div>
      )}

      {/* Stats Grid - Using actual database values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatBox 
          label="GAMBINO Balance" 
          value={cachedGambinoBalance.toLocaleString()} 
          sub={walletStatus}
          highlight={!profile?.walletAddress}
        />
        <StatBox 
          label="SOL Balance" 
          value={cachedSolBalance.toFixed(4)} 
          sub={walletStatus}
        />
        <StatBox 
          label="USDC Balance" 
          value={`$${cachedUsdcBalance.toFixed(2)}`} 
          sub={walletStatus}
        />
        <StatBox 
          label="Glück Score" 
          value={gluck.toLocaleString()} 
          sub={`Tier: ${tier.toUpperCase()}`} 
          highlight={gluck > 1000}
        />
        <StatBox 
          label="Jackpots Won" 
          value={jackTotal.toLocaleString()} 
          sub={`Major ${jackMajor} • Minor ${jackMinor}`} 
          highlight={jackTotal > 0}
        />
        <StatBox 
          label="Machines Played" 
          value={uniqueMachines} 
          sub="Total unique machines" 
        />
      </div>

      {/* Current Machine Session */}
      {currentSession && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Currently Playing</h2>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              Active Session
            </div>
          </div>
          <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-white">{currentSession.machineName || currentSession.machineId}</h3>
                <p className="text-sm text-green-300">{currentSession.storeName}</p>
                <p className="text-xs text-green-500 mt-1">
                  Started: {new Date(currentSession.startedAt).toLocaleTimeString()}
                  {currentSession.duration && ` • ${currentSession.duration} min`}
                </p>
              </div>
              <button
                onClick={handleEndSession}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Profile Information</h2>
          <button 
            onClick={() => setShowEditProfile(!showEditProfile)}
            className="btn btn-ghost text-sm"
          >
            {showEditProfile ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
        
        {!showEditProfile ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="label mb-2">Full Name</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300">
                {profile?.firstName} {profile?.lastName}
              </div>
            </div>
            <div>
              <div className="label mb-2">Email Address</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 break-all">
                {profile?.email || 'Loading...'}
              </div>
            </div>
            <div>
              <div className="label mb-2">Phone Number</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300">
                {profile?.phone || 'Not set'}
              </div>
            </div>
            <div>
              <div className="label mb-2">Member Since</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profileError && (
              <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded text-sm">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">First Name</label>
                  <input 
                    type="text" 
                    className="input mt-1"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                    required
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input 
                    type="text" 
                    className="input mt-1"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                    required
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <input 
                  type="email" 
                  className="input mt-1"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({...prev, email: e.target.value}))}
                  required
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input 
                  type="tel" 
                  className="input mt-1"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="submit" className="btn btn-primary">Update Profile</button>
                <button type="button" onClick={() => setShowEditProfile(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Wallet Management Quick Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Wallet Management</h2>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className={`h-2 w-2 rounded-full ${profile?.walletAddress ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {profile?.walletAddress ? 'Connected' : 'No Wallet'}
          </div>
        </div>

        {!profile?.walletAddress ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-yellow-500/50"></div>
            </div>
            <p className="text-neutral-400 mb-6">No wallet generated yet</p>
            <button 
              onClick={handleGenerateWallet}
              disabled={generatingWallet}
              className="btn btn-primary"
            >
              {generatingWallet ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  Generating...
                </div>
              ) : (
                '🔥 Generate Wallet'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="label mb-2">Wallet Address</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 break-all font-mono text-sm">
                {profile.walletAddress}
              </div>
            </div>

            {/* Enhanced Balance Display */}
            <div>
              <div className="label mb-3">Current Balances</div>
              <div className="balance-grid grid grid-cols-3 gap-4">
                <div className="balance-item bg-neutral-800/50 p-3 rounded border border-neutral-700">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">SOL</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {balances?.SOL !== undefined ? 
                      Number(balances.SOL).toFixed(4) : 
                      cachedSolBalance.toFixed(4)
                    }
                  </p>
                  {balances?.SOL === undefined && (
                    <p className="text-xs text-yellow-400">Cached</p>
                  )}
                </div>
                <div className="balance-item bg-neutral-800/50 p-3 rounded border border-neutral-700">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">GAMBINO</p>
                  <p className="text-lg font-bold text-yellow-500 mt-1">
                    {balances?.GG !== undefined ? 
                      Number(balances.GG || 0).toLocaleString() : 
                      cachedGambinoBalance.toLocaleString()
                    }
                  </p>
                  {balances?.GG === undefined && (
                    <p className="text-xs text-yellow-400">Cached</p>
                  )}
                </div>
                <div className="balance-item bg-neutral-800/50 p-3 rounded border border-neutral-700">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">USDC</p>
                  <p className="text-lg font-bold text-white mt-1">
                    ${balances?.USDC !== undefined ? 
                      Number(balances.USDC || 0).toFixed(2) : 
                      cachedUsdcBalance.toFixed(2)
                    }
                  </p>
                  {balances?.USDC === undefined && (
                    <p className="text-xs text-yellow-400">Cached</p>
                  )}
                </div>
              </div>
              {isBalanceStale && (
                <p className="text-xs text-yellow-400 mt-2 text-center">
                  ⚠️ Live balances temporarily unavailable - showing cached data
                </p>
              )}
            </div>

            <div className="bg-neutral-800/30 p-4 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-300 mb-3">
                Manage your wallet, view transaction history, and transfer tokens in the <strong>Wallet</strong> tab.
              </p>
              <div className="flex gap-2 text-sm">
                <span className="text-neutral-400">Quick actions:</span>
                <span className="text-yellow-400">Send • Receive • History</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}