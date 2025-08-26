'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [walletAccount, setWalletAccount] = useState('');
const [walletError, setWalletError] = useState('');
const [walletLoading, setWalletLoading] = useState(false);

const connectWallet = async () => {
  setWalletLoading(true);
  setWalletError('');
  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAccount(accounts?.[0] || '');
    } else if (typeof window !== 'undefined' && window.solana?.isPhantom) {
      const resp = await window.solana.connect();
      setWalletAccount(resp?.publicKey?.toString() || '');
    } else {
      setWalletError('No wallet detected. Use MetaMask/Phantom or open this in the wallet’s in‑app browser.');
    }
  } catch (e) {
    setWalletError(e?.message || 'Wallet connection failed');
  } finally {
    setWalletLoading(false);
  }
};

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
    const { data } = await api.post('/api/users/login', { email, password });
      setToken(data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="btn btn-gold w-full">{loading ? 'Signing in…' : 'Sign In'}</button>
        <div className="my-6">
          <button onClick={connectWallet} disabled={walletLoading} className="btn btn-gold w-full">
            {walletLoading ? 'Connecting…' : 'Connect Wallet (MetaMask / Phantom)'}
          </button>
          {walletAccount && <p className="text-emerald-400 text-sm mt-2 break-all">Connected: {walletAccount}</p>}
          {walletError && <p className="text-red-400 text-sm mt-2">{walletError}</p>}
        </div>
          
      </form>
      <p className="text-sm text-zinc-400 mt-3">No account? <a className="text-gold" href="/onboard">Create one</a>.</p>
    </div>
    
  );
}
