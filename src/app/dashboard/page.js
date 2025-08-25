'use client';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import StatBox from '@/components/StatBox';


export default function Dashboard() {
  const router = useRouter();
  

  // Keep hook order stable
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showKeyConfirmModal, setShowKeyConfirmModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const pollerRef = useRef(null);

  // mark mounted to avoid SSR/client mismatch
  useEffect(() => { setMounted(true); }, []);

  // main data loader + poller
  useEffect(() => {
    if (!mounted) return;

    const token = getToken();
    if (!token) {
      // do redirects only in effects, not during render
      router.replace('/login');
      return;
    }

    let cancelled = false;

    const fetchAll = async () => {
      try {
        setError('');
        const { data } = await api.get('/api/users/profile');
        if (cancelled) return;

        const user = data?.user ?? {};
        setProfile(user);

        const addr = user.walletAddress;
        if (addr) {
          // fetch balances + QR in parallel
          const [balRes, qrRes] = await Promise.allSettled([
            api.get(`/api/wallet/balance/${addr}`),
            api.get(`/api/wallet/qrcode/${addr}`)
          ]);

          if (cancelled) return;

          if (balRes.status === 'fulfilled') {
            const newBalances = balRes.value.data?.balances ?? null;
            setBalances(newBalances);

            // Sync GAMBINO balance to database if it exists and differs from profile
            if (newBalances?.GG && user?.gambinoBalance !== newBalances.GG) {
              try {
                await api.post('/api/wallet/sync-balance', { 
                  gambinoBalance: newBalances.GG 
                });
                // Update local profile state to reflect new balance
                setProfile(prev => ({ ...prev, gambinoBalance: newBalances.GG }));
              } catch (syncError) {
                console.log('Balance sync failed:', syncError);
                // Don't show error to user - balance will sync next time
              }
            }
          } else {
            setBalances(null);
          }

          if (qrRes.status === 'fulfilled') {
            setQr(qrRes.value.data?.qr ?? null);
          } else {
            setQr(null);
          }
        } else {
          setBalances(null);
          setQr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.error || 'Failed to load profile');
        }
      }
    };

    // initial fetch + poll
    fetchAll();
    pollerRef.current = setInterval(fetchAll, 300000); // 5 minutes instead of 30 seconds


    return () => {
      cancelled = true;
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [mounted, router]);

  const handleGenerateWallet = async () => {
    try {
      setError('');
      const { data } = await api.post('/api/wallet/generate');
      const addr = data?.walletAddress;

      setProfile((prev) => ({ ...(prev || {}), walletAddress: addr }));

      if (addr) {
        const [balRes, qrRes] = await Promise.allSettled([
          api.get(`/api/wallet/balance/${addr}`),
          api.get(`/api/wallet/qrcode/${addr}`)
        ]);
        if (balRes.status === 'fulfilled') setBalances(balRes.value.data?.balances ?? null);
        if (qrRes.status === 'fulfilled') setQr(qrRes.value.data?.qr ?? null);
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate wallet');
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
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (e) {
      setPasswordError(e?.response?.data?.error || 'Failed to change password');
    }
  };

  const handleRevealPrivateKey = async () => {
    try {
      setError('');
      const { data } = await api.get('/api/wallet/private-key');
      setProfile((prev) => ({ ...prev, privateKey: data.privateKey }));
      setShowPrivateKey(true);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to retrieve private key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // avoid hydration flashes
  if (!mounted) return <div className="text-zinc-400">Loading…</div>;

  const gBal = Number(profile?.gambinoBalance ?? 0);
  const gluck = Number(profile?.gluckScore ?? 0);
  const tier = profile?.tier ?? 'none';
  const jackTotal = Number(profile?.totalJackpots ?? 0);
  const jackMajor = Number(profile?.majorJackpots ?? 0);
  const jackMinor = Number(profile?.minorJackpots ?? 0);

  const sol = Number(balances?.SOL ?? 0);
  const gg = Number(balances?.GG ?? 0);
  const usdc = Number(balances?.USDC ?? 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {passwordSuccess && <p className="text-green-400 text-sm mb-4">{passwordSuccess}</p>}

      {!profile ? (
        <div className="text-zinc-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Account Info Section */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-400">Full Name</p>
                <p className="font-semibold">
                  {profile?.firstName && profile?.lastName 
                    ? `${profile.firstName} ${profile.lastName}` 
                    : 'Not set'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Email</p>
                <p className="font-semibold">{profile?.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Phone</p>
                <p className="font-semibold">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Member Since</p>
                <p className="font-semibold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">User ID</p>
                <p className="font-mono text-sm text-zinc-300">{profile?.id || profile?._id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Account Status</p>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  profile?.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {profile?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="btn-ghost mr-3"
              >
                Change Password
              </button>
              <button
                onClick={() => window.location.href = '/profile/edit'}
                className="btn-ghost"
              >
                Edit Profile
              </button>
            </div>

            {/* Change Password Form */}
            {showChangePassword && (
              <div className="mt-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <h3 className="text-lg font-semibold mb-3">Change Password</h3>
                {passwordError && <p className="text-red-400 text-sm mb-3">{passwordError}</p>}
                
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <input
                      type="password"
                      placeholder="Current Password"
                      className="input"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="New Password"
                      className="input"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      className="input"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-gold">Update Password</button>
                    <button type="button" onClick={() => setShowChangePassword(false)} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <StatBox label="GAMBINO Balance" value={gBal.toLocaleString()} sub={profile?.walletAddress || 'No Wallet Yet'} />
            <StatBox label="Glück Score" value={gluck.toLocaleString()} sub={`Tier: ${tier}`} />
            <StatBox label="Jackpots" value={jackTotal} sub={`Major ${jackMajor} • Minor ${jackMinor}`} />
          </div>

          {/* Machines */}
          <div className="card">
            <div className="text-zinc-400 text-sm mb-2">Machines Played</div>
            <div className="flex flex-wrap gap-2">
              {profile?.machinesPlayed?.length
                ? profile.machinesPlayed.map((m) => (
                    <span key={m} className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-xs">{m}</span>
                  ))
                : <span className="text-zinc-500">No data yet</span>}
            </div>
          </div>

          {/* Wallet Section */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Wallet Management</h2>
            
            {!profile?.walletAddress ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">No wallet generated yet</p>
                <button onClick={handleGenerateWallet} className="btn-gold">Generate Wallet</button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Wallet Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-zinc-400">Wallet Address</p>
                    <p className="text-xs text-zinc-400">Tap to select</p>
                  </div>
                  <p className="font-mono break-all text-yellow-400 bg-zinc-800 p-3 rounded border">
                    {profile.walletAddress}
                  </p>
                </div>

                {/* Private Key Section */}
                <div className="border border-red-600/30 rounded-lg p-4 bg-red-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-red-400 font-semibold">⚠️ Private Key (Keep Secret!)</p>
                    <div className="flex gap-2">
                      {!showPrivateKey ? (
                        <button 
                          onClick={() => setShowKeyConfirmModal(true)}
                          className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                        >
                          Reveal Private Key
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowPrivateKey(false)}
                          className="text-xs bg-zinc-600 hover:bg-zinc-700 px-3 py-1 rounded"
                        >
                          Hide Key
                        </button>
                      )}
                    </div>
                  </div>
                    
                  {showPrivateKey && profile.privateKey ? (
                    <div>
                      <p className="font-mono text-sm break-all text-red-300 bg-zinc-900 p-3 rounded border border-red-600/50">
                        {profile.privateKey}
                      </p>
                      <p className="text-xs text-red-400 mt-2">
                        Never share this with anyone! Anyone with this key can access your wallet.
                      </p>
                    </div>
                  ) : showPrivateKey ? (
                    <p className="text-red-400 text-sm">Private key not available</p>
                  ) : (
                    <p className="text-zinc-500 text-sm">Click "Reveal Private Key" to show your wallet's private key</p>
                  )}
                </div>
                
                {/* Confirmation Modal */}
                {showKeyConfirmModal && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-red-600/50 rounded-lg p-6 max-w-md mx-4">
                      <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Security Warning</h3>
                      <div className="text-sm text-zinc-300 mb-6 space-y-2">
                        <p>You're about to reveal your private key. This gives complete access to your wallet.</p>
                        <p className="text-red-300 font-semibold">• Never share this key with anyone</p>
                        <p className="text-red-300 font-semibold">• Never enter it on suspicious websites</p>
                        <p className="text-red-300 font-semibold">• Anyone with this key can steal your funds</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            setShowKeyConfirmModal(false);
                            await handleRevealPrivateKey();
                          }}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
                        >
                          I Understand, Reveal Key
                        </button>
                        <button
                          onClick={() => setShowKeyConfirmModal(false)}
                          className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Balances and QR */}
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {qr && (
                    <div className="text-center">
                      <p className="text-sm text-zinc-400 mb-2">Wallet QR Code</p>
                      <img src={qr} alt="Wallet QR" className="w-32 h-32 border border-zinc-700 rounded" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-sm text-zinc-400 mb-3">Current Balances</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
                        <p className="text-xs text-zinc-400">SOL</p>
                        <p className="text-lg font-semibold">{sol.toLocaleString()}</p>
                      </div>
                      <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
                        <p className="text-xs text-zinc-400">GAMBINO</p>
                        <p className="text-lg font-semibold">{gg.toLocaleString()}</p>
                      </div>
                      <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
                        <p className="text-xs text-zinc-400">USDC</p>
                        <p className="text-lg font-semibold">{usdc.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Actions */}
                <div className="flex gap-3 pt-4 border-t border-zinc-700">
                  <button className="btn-ghost">Send Tokens</button>
                  <a 
                    href={`https://solscan.io/account/${profile.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost inline-block text-center"
                  >
                    Transaction History
                  </a>
                  <button className="btn-ghost">Export Wallet</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}