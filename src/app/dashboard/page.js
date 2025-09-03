'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';

// StatBox component matching your existing style
function StatBox({ label, value, sub }) {
  return (
    <div className="stat-box">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

// LoadingSpinner component
function LoadingSpinner() {
  return (
    <div className="loading-spinner w-5 h-5 text-yellow-500"></div>
  );
}

export default function UserDashboard() {
  const router = useRouter();
  const pollerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentSession, setCurrentSession] = useState(null);

  // Profile editing state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Wallet state
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [generatingWallet, setGeneratingWallet] = useState(false);
  const [revealingKey, setRevealingKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  


  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!mounted || !getToken()) return;

    let cancelled = false;
    const fetchAll = async () => {
      try {
        const profileRes = await api.get('/api/users/profile');
        const profileData = profileRes.data?.user;
        
        
        if (!cancelled) {
          setProfile(profileData);
          setProfileForm({
            firstName: profileData?.firstName || '',
            lastName: profileData?.lastName || '',
            email: profileData?.email || '',
            phone: profileData?.phone || ''
          });
          setError('');

          const addr = profileData?.walletAddress;
          if (addr) {
            const [balRes, qrRes] = await Promise.allSettled([
              api.get(`/api/wallet/balance/${addr}`),
              api.get(`/api/wallet/qrcode/${addr}`)
            ]);

            if (balRes.status === 'fulfilled') {
              setBalances(balRes.value.data?.balances ?? null);
            }

            if (qrRes.status === 'fulfilled') {
              setQr(qrRes.value.data?.qr ?? null);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.error || 'Failed to load profile');
        }
      }
    };

       const checkActiveSession = async () => {
      try {
        const sessionRes = await api.get('/api/users/current-session');
        if (!cancelled) {
          setCurrentSession(sessionRes.data.session);
        }
      } catch (err) {
        // No active session is fine, don't set error
        if (!cancelled) {
          setCurrentSession(null);
        }
      }
    };
  
    fetchAll();
    checkActiveSession(); 

    
    // Set up polling for balance updates
    if (pollerRef.current) clearInterval(pollerRef.current);
    pollerRef.current = setInterval(() => {
      if (profile?.walletAddress) {
        api.get(`/api/wallet/balance/${profile.walletAddress}`)
          .then(res => setBalances(res.data?.balances))
          .catch(() => {}); // Silent fail for background polling
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      cancelled = true;
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [mounted, profile?.walletAddress]);

  const handleGenerateWallet = async () => {
    setGeneratingWallet(true);
    setError('');
    try {
      const res = await api.post('/api/wallet/generate');
      if (res.data?.success) {
        setSuccess('Wallet generated successfully! Refreshing profile...');
        // Refresh profile to show new wallet
        const profileRes = await api.get('/api/users/profile');
        setProfile(profileRes.data?.user);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate wallet');
    } finally {
      setGeneratingWallet(false);
    }
  };

  const handleRevealPrivateKey = async () => {
    if (!profile?.walletAddress) return;
    
    setRevealingKey(true);
    setError('');
    try {
      const res = await api.get('/api/wallet/private-key');
      if (res.data?.success) {
        setPrivateKey(res.data.privateKey);
        setShowPrivateKey(true);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reveal private key');
    } finally {
      setRevealingKey(false);
    }
  };

  const handleCopyToClipboard = async (text, type = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied to clipboard!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(`${type} copied to clipboard!`);
        setTimeout(() => setCopySuccess(''), 2000);
      } catch (err) {
        setError('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await api.put('/api/users/profile', profileForm);
      if (res.data?.success) {
        // Refetch the profile to ensure we have the latest server data
        const profileRes = await api.get('/api/users/profile');
        const updatedProfile = profileRes.data?.user;
        
        if (updatedProfile) {
          setProfile(updatedProfile);
          // Update form with server data to stay in sync
          setProfileForm({
            firstName: updatedProfile.firstName || '',
            lastName: updatedProfile.lastName || '',
            email: updatedProfile.email || '',
            phone: updatedProfile.phone || ''
          });
        }
        
        setProfileSuccess('Profile updated successfully!');
        setShowEditProfile(false);
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      setProfileError(err?.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      const res = await api.post('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      setPasswordError(err?.response?.data?.error || 'Failed to change password');
    }
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

  // Calculate stats
  const gBal = profile?.gambinoBalance || 0;
  const gluck = profile?.gluckScore || 0;
  const tier = profile?.tier || 'none';
  const jackMajor = profile?.majorJackpots || 0;
  const jackMinor = profile?.minorJackpots || 0;
  const jackTotal = (jackMajor + jackMinor).toLocaleString();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-neutral-400 text-sm md:text-base">
              Welcome back, {profile?.firstName || 'Player'}! Manage your account and track your progress.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-400">
            <div className="status-live h-2 w-2"></div>
            Account Active
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 md:p-4 rounded-lg mb-4 md:mb-6 backdrop-blur-sm text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 md:p-4 rounded-lg mb-4 md:mb-6 backdrop-blur-sm text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {profileSuccess && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 md:p-4 rounded-lg mb-4 md:mb-6 backdrop-blur-sm text-sm">
          {profileSuccess}
        </div>
      )}

      {passwordSuccess && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 md:p-4 rounded-lg mb-4 md:mb-6 backdrop-blur-sm text-sm">
          {passwordSuccess}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatBox 
          label="GAMBINO Balance" 
          value={gBal.toLocaleString()} 
          sub={profile?.walletAddress ? 'Wallet Connected' : 'No Wallet Yet'} 
        />
        <StatBox 
          label="Glück Score" 
          value={gluck.toLocaleString()} 
          sub={`Tier: ${tier.toUpperCase()}`} 
        />
        <StatBox 
          label="Jackpots Won" 
          value={jackTotal} 
          sub={`Major ${jackMajor} • Minor ${jackMinor}`} 
        />
      </div>

      {/* Current Machine Session */}
      {currentSession && (
        <div className="card mb-6 md:mb-8">
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
                <p className="text-xs text-green-400 mt-1">
                  Started: {new Date(currentSession.startedAt).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await api.post('/api/users/end-session');
                    setCurrentSession(null);
                    setSuccess('Session ended successfully');
                  } catch (err) {
                    setError('Failed to end session');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management */}
      <div className="card mb-6 md:mb-8">
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
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
            <div>
              <div className="label mb-2">Full Name</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 text-sm md:text-base">
                {`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Not set'}
              </div>
            </div>
            <div>
              <div className="label mb-2">Email Address</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 text-sm md:text-base break-all">
                {profile?.email || 'Loading...'}
              </div>
            </div>
            <div>
              <div className="label mb-2">Phone Number</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 text-sm md:text-base">
                {profile?.phone || 'Not set'}
              </div>
            </div>
            <div>
              <div className="label mb-2">Member Since</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 text-sm md:text-base">
                {new Date(profile?.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {profileError && (
              <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded text-sm">
                {profileError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">First Name</label>
                <input 
                  type="text" 
                  className="input mt-1"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
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
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input 
                  type="email" 
                  className="input mt-1"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({...prev, email: e.target.value}))}
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
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="btn btn-gold">Update Profile</button>
              <button type="button" onClick={() => setShowEditProfile(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Settings */}
      <div className="card mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Security Settings</h2>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="btn btn-ghost w-full sm:w-auto text-sm"
          >
            {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
          </button>

          {/* Password Change Form */}
          {showChangePassword && (
            <div className="mt-4 p-4 border border-neutral-700 rounded-lg bg-neutral-900/50">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-white">Change Password</h3>
              
              {passwordError && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    className="input mt-1"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input 
                    type="password" 
                    className="input mt-1"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                    required
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input mt-1"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                    required
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" className="btn btn-gold">Update Password</button>
                  <button type="button" onClick={() => setShowChangePassword(false)} className="btn btn-ghost">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Management */}
      <div className="card mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Wallet Management</h2>
          <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-400">
            <div className={`h-2 w-2 rounded-full ${profile?.walletAddress ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            {profile?.walletAddress ? 'Wallet Connected' : 'No Wallet'}
          </div>
        </div>

        {!profile?.walletAddress ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Wallet Detected</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">
              Generate a secure wallet to start receiving and managing your GAMBINO tokens.
            </p>
            <button 
              onClick={handleGenerateWallet}
              disabled={generatingWallet}
              className="btn btn-gold"
            >
              {generatingWallet ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  Generating Wallet...
                </div>
              ) : (
                'Generate Wallet'
              )}
            </button>
          </div>
        ) : (
          <div>
            {/* Wallet Address */}
            <div className="mb-6">
              <div className="label mb-2">Wallet Address</div>
              <div className="wallet-address text-xs md:text-sm">
                {profile.walletAddress}
              </div>
            </div>

            {/* Balances */}
            {balances && (
              <div className="mb-6">
                <div className="label mb-3">Current Balances</div>
                <div className="balance-grid">
                  <div className="balance-item">
                    <div className="text-xs text-neutral-400 mb-1">SOL</div>
                    <div className="text-lg font-semibold text-white">
                      {balances.SOL?.toFixed(4) || '0.0000'}
                    </div>
                  </div>
                  <div className="balance-item">
                    <div className="text-xs text-neutral-400 mb-1">GAMBINO</div>
                    <div className="text-lg font-semibold text-yellow-500">
                      {balances.GG?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="balance-item">
                    <div className="text-xs text-neutral-400 mb-1">USDC</div>
                    <div className="text-lg font-semibold text-white">
                      ${balances.USDC?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleRevealPrivateKey}
                disabled={revealingKey}
                className="btn btn-ghost text-sm"
              >
                {revealingKey ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    Retrieving Key...
                  </div>
                ) : (
                  'Reveal Private Key'
                )}
              </button>
              
              <button 
                onClick={() => setShowQRModal(true)}
                className="btn btn-ghost text-sm"
              >
                Show QR Code
              </button>

              <button 
                onClick={() => handleCopyToClipboard(profile.walletAddress, 'Wallet address')}
                className="btn btn-ghost text-sm"
              >
                Copy Address
              </button>
            </div>

            {/* Copy Success Message */}
            {copySuccess && (
              <div className="mt-3 text-sm text-green-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {copySuccess}
              </div>
            )}

            {/* Private Key Reveal Modal */}
            {showPrivateKey && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="private-key-warning max-w-md w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-red-300">Private Key Warning</h3>
                  </div>
                  <p className="text-red-200 text-sm mb-4">
                    Never share your private key with anyone. Anyone with access to this key can control your wallet and steal your funds.
                  </p>
                  <div className="bg-black p-3 rounded font-mono text-xs break-all text-yellow-400 mb-4 border border-red-500/30">
                    {privateKey}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => handleCopyToClipboard(privateKey, 'Private key')}
                      className="btn btn-ghost text-sm"
                    >
                      Copy to Clipboard
                    </button>
                    <button 
                      onClick={() => {
                        setShowPrivateKey(false);
                        setPrivateKey('');
                      }}
                      className="btn btn-gold text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-neutral-900/95 border border-neutral-700 rounded-xl p-6 max-w-sm w-full backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h1M6 16H5m9-9h.01M9 21v-1m3-4a2 2 0 11-4 0 2 2 0 014 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">Wallet QR Code</h3>
                  </div>
                  <p className="text-neutral-300 text-sm mb-4">
                    Scan this QR code to share your wallet address or import it into other applications.
                  </p>
                  
                  {qr ? (
                    <div className="text-center mb-4">
                      <img 
                        src={qr} 
                        alt="Wallet QR Code" 
                        className="mx-auto rounded-lg border border-neutral-700 bg-white p-2"
                        style={{ maxWidth: '200px', height: 'auto' }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 mb-4">
                      <LoadingSpinner />
                      <p className="text-neutral-400 text-sm mt-2">Loading QR code...</p>
                    </div>
                  )}
                  
                  <div className="bg-neutral-800 p-3 rounded font-mono text-xs break-all text-yellow-400 mb-4 border border-neutral-700">
                    {profile.walletAddress}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => handleCopyToClipboard(profile.walletAddress, 'Wallet address')}
                      className="btn btn-ghost text-sm"
                    >
                      Copy Address
                    </button>
                    <button 
                      onClick={() => setShowQRModal(false)}
                      className="btn btn-gold text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Statistics */}
      <div className="card">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Game Statistics</h2>
        
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="label mb-2">Current Tier</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700">
              <div className="text-lg font-semibold text-yellow-500 capitalize">
                {tier === 'none' ? 'Unranked' : tier}
              </div>
            </div>
          </div>
          
          <div>
            <div className="label mb-2">Total Machines Played</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700">
              <div className="text-lg font-semibold text-white">
                {new Set(profile?.machinesPlayed || []).size}
              </div>
            </div>
          </div>
          
          <div>
            <div className="label mb-2">Last Activity</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700">
              <div className="text-sm text-neutral-300">
                {profile?.lastActivity 
                  ? new Date(profile.lastActivity).toLocaleDateString()
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Machines Played */}
        {profile?.machinesPlayed?.length > 0 && (
          <div className="mt-6">
            <div className="label mb-3">Machines Played</div>
            <div className="flex flex-wrap gap-2">
              {profile.machinesPlayed.map((machineId, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 bg-neutral-800 rounded-full text-xs text-neutral-300 border border-neutral-700"
                >
                  {machineId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}