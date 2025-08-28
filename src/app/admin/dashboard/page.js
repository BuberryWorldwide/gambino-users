'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';

function StatBox({ label, value, sub }) {
  return (
    <div className="stat-box">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();

  // refs
  const pollerRef = useRef(null);
  const abortRef = useRef(null);
  const tokenRef = useRef(null);
  const privateKeyRef = useRef(''); // ← hold sensitive key outside React state

  // state
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [balances, setBalances] = useState(null);
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // private key modal
  const [pkOpen, setPkOpen] = useState(false);

  // mount gate + token check
  useEffect(() => {
    setMounted(true);
    const token = getToken();
    tokenRef.current = token;
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [router]);

  // polling helpers
  const clearPoller = () => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  };

  const stopAll = () => {
    clearPoller();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  // fetch profile + balances + qr (with abort + 401 bounce)
  const fetchAll = async () => {
    if (!tokenRef.current) return;
    try {
      setError('');
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const profileRes = await api.get('/api/users/profile', { signal: abortRef.current.signal });
      const profileData = profileRes.data?.user;
      setProfile(profileData);

      const addr = profileData?.walletAddress;
      if (!addr) {
        setBalances(null);
        setQr(null);
        return;
      }

      const [balRes, qrRes] = await Promise.allSettled([
        api.get(`/api/wallet/balance/${addr}`, { signal: abortRef.current.signal }),
        api.get(`/api/wallet/qrcode/${addr}`, { signal: abortRef.current.signal })
      ]);

      setBalances(balRes.status === 'fulfilled' ? (balRes.value.data?.balances ?? null) : null);
      setQr(qrRes.status === 'fulfilled' ? (qrRes.value.data?.qr ?? null) : null);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        // token expired / not authorized → force re-login
        stopAll();
        router.replace('/login');
        return;
      }
      // Ignore abort errors
      if (e?.name !== 'CanceledError' && e?.name !== 'AbortError') {
        setError(e?.response?.data?.error || 'Failed to load profile');
      }
    }
  };

  // set up polling, pause when hidden, resume on focus
  useEffect(() => {
    if (!mounted || !tokenRef.current) return;

    const start = () => {
      clearPoller();
      fetchAll(); // initial
      pollerRef.current = setInterval(fetchAll, 30000);
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearPoller();
      } else {
        start();
      }
    };
    const onFocus = () => start();

    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // actions
  const handleGenerateWallet = async () => {
    try {
      setError('');
      await api.post('/api/wallet/generate');
      await fetchAll();
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

  // SAFER: one-time private key reveal (no state)
  const handleRevealPrivateKey = async () => {
    try {
      setError('');
      // Consider requiring re-auth (password) here on the API
      const { data } = await api.get('/api/wallet/private-key');
      privateKeyRef.current = data?.privateKey || '';
      setPkOpen(true);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to retrieve private key');
    }
  };

  const closePkModal = () => {
    setPkOpen(false);
    // scrub sensitive data immediately
    privateKeyRef.current = '';
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback (rarely needed)
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner text-yellow-400"></div>
      </div>
    );
  }

  // normalize balances
  const gBal = Number(profile?.gambinoBalance ?? 0);
  const gluck = Number(profile?.gluckScore ?? 0);
  const tier = gluck < 100 ? 'Bronze' : gluck < 500 ? 'Silver' : gluck < 1000 ? 'Gold' : 'Diamond';

  const jackMajor = Number(profile?.jackpotsMajor ?? 0);
  const jackMinor = Number(profile?.jackpotsMinor ?? 0);
  const jackTotal = jackMajor + jackMinor;

  const sol = Number(balances?.SOL ?? 0);
  // accept either GG or GAMB from backend
  const gg = Number((balances?.GG ?? balances?.GAMB) ?? 0);
  const usdc = Number(balances?.USDC ?? 0);

  return (
    <div className="min-h-screen relative">
      {/* subtle background */}
      <div className="hidden md:block fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-3 h-3 bg-yellow-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-yellow-300/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-yellow-500/20 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse delay-500"></div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 md:opacity-60">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-yellow-500/8 to-amber-600/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16 md:translate-x-32 md:-translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-tr from-amber-600/10 to-yellow-500/5 rounded-full blur-3xl transform -translate-x-12 translate-y-12 md:-translate-x-24 md:translate-y-24"></div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 md:py-8 relative z-10">
        {/* header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-gradient-gold">{profile?.email || 'Member'}</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Manage your account, track your progress, and monitor your wallet.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 md:p-4 rounded-lg mb-4 md:mb-6 backdrop-blur-sm text-sm">
            {error}
          </div>
        )}

        {/* account settings */}
        <div className="card mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
            <h2 className="text-lg md:text-xl font-bold text-white">Account Settings</h2>
            <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-400">
              <div className="status-live h-2 w-2"></div>
              Account Active
            </div>
          </div>
          
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            <div>
              <div className="label mb-2">Email Address</div>
              <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 text-sm md:text-base break-all">
                {profile?.email || 'Loading...'}
              </div>
            </div>
            <div>
              <div className="label mb-2">Account Actions</div>
              <button
                onClick={() => setShowChangePassword(v => !v)}
                className="btn btn-ghost w-full text-sm"
              >
                Change Password
              </button>
            </div>
          </div>

          {showChangePassword && (
            <div className="mt-4 md:mt-6 p-4 border border-neutral-700 rounded-lg bg-neutral-900/50">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-white">Change Password</h3>

              {passwordError && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 rounded mb-4 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    className="input mt-1"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input mt-1"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input mt-1"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
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

        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatBox label="GAMBINO Balance" value={gBal.toLocaleString()} sub={profile?.walletAddress ? 'Wallet Connected' : 'No Wallet Yet'} />
          <StatBox label="Glück Score" value={gluck.toLocaleString()} sub={`Tier: ${tier}`} />
          <StatBox label="Jackpots Won" value={jackTotal} sub={`Major ${jackMajor} • Minor ${jackMinor}`} />
        </div>

        {/* machines played */}
        <div className="card mb-6 md:mb-8">
          <div className="text-neutral-400 text-sm mb-3">Machines Played</div>
          <div className="flex flex-wrap gap-2">
            {profile?.machinesPlayed?.length
              ? profile.machinesPlayed.map((m) => (
                  <span key={m} className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
                    {m}
                  </span>
                ))
              : <span className="text-neutral-500 text-sm">No machines played yet</span>}
          </div>
        </div>

        {/* wallet section */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
            <h2 className="text-lg md:text-xl font-bold text-white">Wallet Management</h2>
            {profile?.walletAddress && (
              <div className="flex items-center gap-2 text-xs md:text-sm text-green-400">
                <div className="status-live h-2 w-2"></div>
                Wallet Active
              </div>
            )}
          </div>

          {!profile?.walletAddress ? (
            <div className="text-center py-8 md:py-12">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-yellow-500/50"></div>
              </div>
              <p className="text-neutral-400 mb-4 md:mb-6 text-sm md:text-base">No wallet generated yet</p>
              <button onClick={handleGenerateWallet} className="btn btn-gold">
                Generate Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <p className="label">Wallet Address</p>
                  <button
                    onClick={() => copyToClipboard(profile.walletAddress)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors self-start sm:self-auto"
                  >
                    Copy Address
                  </button>
                </div>
                <p className="wallet-address text-xs md:text-sm">{profile.walletAddress}</p>
              </div>

              {/* private key (one-time reveal modal) */}
              <div className="private-key-warning">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <p className="text-sm text-red-400 font-semibold">⚠️ Private Key (Keep Secret!)</p>
                  <button
                    onClick={handleRevealPrivateKey}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors self-start sm:self-auto"
                  >
                    Reveal Private Key
                  </button>
                </div>
                <p className="text-neutral-500 text-sm">
                  For your security, the key is shown once per request and not stored in the browser.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6">
                {qr && (
                  <div className="text-center w-full lg:w-auto">
                    <p className="label mb-3">Wallet QR Code</p>
                    <div className="p-2 bg-white rounded-lg inline-block">
                      <img src={qr} alt="Wallet QR" className="w-24 h-24 md:w-32 md:h-32" />
                    </div>
                  </div>
                )}
                <div className="flex-1 w-full">
                  <p className="label mb-3 md:mb-4">Current Balances</p>
                  <div className="balance-grid">
                    <div className="balance-item">
                      <p className="text-xs text-neutral-400 uppercase tracking-wider">SOL</p>
                      <p className="text-lg md:text-2xl font-bold text-white mt-1">{sol.toLocaleString()}</p>
                    </div>
                    <div className="balance-item">
                      <p className="text-xs text-neutral-400 uppercase tracking-wider">GAMBINO</p>
                      <p className="text-lg md:text-2xl font-bold text-yellow-500 mt-1">{gg.toLocaleString()}</p>
                    </div>
                    <div className="balance-item">
                      <p className="text-xs text-neutral-400 uppercase tracking-wider">USDC</p>
                      <p className="text-lg md:text-2xl font-bold text-white mt-1">{usdc.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-4 md:pt-6 border-t border-neutral-700">
                <button className="btn btn-ghost flex-1 sm:flex-none">Send Tokens</button>
                <button className="btn btn-ghost flex-1 sm:flex-none">Transaction History</button>
                <button className="btn btn-ghost flex-1 sm:flex-none">Export Wallet</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Private Key Modal (no React state stores the key) */}
      {pkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="font-semibold">Private Key</div>
              <button className="text-neutral-500 hover:text-neutral-300" onClick={closePkModal}>✕</button>
            </div>
            <div className="p-4">
              {privateKeyRef.current ? (
                <>
                  <p className="font-mono text-xs md:text-sm break-all text-red-300 bg-neutral-900/70 p-3 rounded border border-red-600/50">
                    {privateKeyRef.current}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => copyToClipboard(privateKeyRef.current)}
                    >
                      Copy
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={closePkModal}>
                      Hide
                    </button>
                  </div>
                  <p className="text-xs text-red-400 mt-3">
                    Never share this with anyone. Anyone with this key can access your wallet.
                  </p>
                </>
              ) : (
                <p className="text-neutral-400 text-sm">No key available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
