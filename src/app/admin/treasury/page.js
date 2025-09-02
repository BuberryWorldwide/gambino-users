'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';

export default function AdminTreasuryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [rotatingId, setRotatingId] = useState(null);
  const [balances, setBalances] = useState({}); // { publicKey: {SOL, GG, USDC} }
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [form, setForm] = useState({
    label: '',
    purpose: 'other',
    publicKey: '',
    privateKeyBase64: ''
  });

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  const loadWallets = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/admin/treasury');
      const list = data?.wallets || [];
      setWallets(list);
      
      // For now, initialize empty balances since backend doesn't have cached balances yet
      const emptyBalances = {};
      list.forEach(wallet => {
        if (wallet.publicKey) {
          emptyBalances[wallet.publicKey] = { SOL: null, GG: null, USDC: null };
        }
      });
      setBalances(emptyBalances);
      
      console.log('Loaded', list.length, 'treasury wallets');
    } catch (e) {
      console.error('Treasury wallets load error:', e);
      setError(e?.response?.data?.error || 'Failed to load treasury wallets');
      if (e?.response?.status === 403 || e?.response?.status === 401) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
  setLoadingBalances(true);
  setError('');
  setSuccess('');
  
  try {
    const response = await api.post('/api/admin/treasury/refresh-balances');
    
    if (response.data?.success) {
      // Reload wallets to get fresh cached data
      await loadWallets();
      
      const successCount = response.data.results.filter(r => r.success).length;
      const errorCount = response.data.results.filter(r => !r.success).length;
      
      setSuccess(`Balances refreshed: ${successCount} successful, ${errorCount} failed`);
      setTimeout(() => setSuccess(''), 4000);
    }
  } catch (e) {
    setError(e?.response?.data?.error || 'Failed to refresh balances');
  } finally {
    setLoadingBalances(false);
  }
};

  useEffect(() => {
    if (!mounted || !getToken()) return;
    loadWallets();
  }, [mounted, router]);

  // Remove automatic balance loading - only load on button click

  const handleAddWallet = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post('/api/admin/treasury', form);
      setSuccess('Wallet added successfully');
      setForm({ label: '', purpose: 'other', publicKey: '', privateKeyBase64: '' });
      await loadWallets(); // Reload wallets
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add wallet');
    } finally {
      setAdding(false);
    }
  };

  const handleRotateKey = async (id) => {
    const newKey = prompt('Enter new private key (base64) for rotation:');
    if (!newKey || !newKey.trim()) return;
    
    setRotatingId(id);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/api/admin/treasury/${id}/rotate`, { privateKeyBase64: newKey.trim() });
      setSuccess('Private key rotated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to rotate key');
    } finally {
      setRotatingId(null);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  if (!mounted || !getToken()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <div className="loading-spinner w-5 h-5 text-yellow-500"></div>
          <span>Loading treasury wallets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Treasury Management
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Manage system treasury wallets and keys
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={refreshBalances} 
            disabled={loadingBalances}
            className="btn btn-ghost text-sm"
          >
            {loadingBalances ? 'Refreshing...' : 'Refresh Balances'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 md:p-4 rounded-lg mb-6 backdrop-blur-sm text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 md:p-4 rounded-lg mb-6 backdrop-blur-sm text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Add Wallet Form */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Add Treasury Wallet</h2>
        
        <form onSubmit={handleAddWallet} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Wallet Label</label>
              <input 
                className="input mt-1" 
                value={form.label} 
                onChange={e => setForm({ ...form, label: e.target.value })} 
                placeholder="e.g., Main Treasury"
                required 
              />
            </div>
            
            <div>
              <label className="label">Purpose</label>
              <select 
                className="input mt-1" 
                value={form.purpose} 
                onChange={e => setForm({ ...form, purpose: e.target.value })}
              >
                <option value="main">Main Treasury</option>
                <option value="jackpot">Jackpot Pool</option>
                <option value="ops">Operations</option>
                <option value="team">Team</option>
                <option value="community">Community</option>
                <option value="store_float">Store Float</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="label">Public Key (Solana Address)</label>
            <input 
              className="input mt-1 font-mono text-sm" 
              value={form.publicKey} 
              onChange={e => setForm({ ...form, publicKey: e.target.value })} 
              placeholder="Enter Solana wallet public key"
              required 
            />
          </div>
          
          <div>
            <label className="label">Private Key (Base64 Encoded)</label>
            <input 
              type="password"
              className="input mt-1 font-mono text-sm" 
              value={form.privateKeyBase64} 
              onChange={e => setForm({ ...form, privateKeyBase64: e.target.value })} 
              placeholder="Enter base64-encoded private key"
              required 
            />
            <p className="text-xs text-neutral-400 mt-1">
              ⚠️ Private keys are encrypted before storage
            </p>
          </div>
          
          <button 
            type="submit"
            className="btn btn-gold" 
            disabled={adding}
          >
            {adding ? (
              <div className="flex items-center gap-2">
                <div className="loading-spinner w-4 h-4"></div>
                Adding Wallet...
              </div>
            ) : (
              'Add Wallet'
            )}
          </button>
        </form>
      </div>

      {/* Wallets List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Treasury Wallets</h2>
          <div className="text-sm text-neutral-400">
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
            {loadingBalances && (
              <span className="ml-2 text-yellow-400">• Loading balances...</span>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-neutral-800/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {Object.values(balances).reduce((sum, bal) => 
                sum + (typeof bal?.SOL === 'number' ? bal.SOL : 0), 0
              ).toFixed(3)}
            </div>
            <div className="text-xs text-neutral-400">Total SOL</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {Object.values(balances).reduce((sum, bal) => 
                sum + (typeof bal?.GG === 'number' ? bal.GG : 0), 0
              ).toLocaleString()}
            </div>
            <div className="text-xs text-neutral-400">Total GAMBINO</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ${Object.values(balances).reduce((sum, bal) => 
                sum + (typeof bal?.USDC === 'number' ? bal.USDC : 0), 0
              ).toFixed(2)}
            </div>
            <div className="text-xs text-neutral-400">Total USDC</div>
          </div>
        </div>
        
        {wallets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Treasury Wallets</h3>
            <p className="text-neutral-400 text-sm">
              Add your first treasury wallet to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400 border-b border-neutral-700">
                <tr>
                  <th className="p-3">Label</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Public Key</th>
                  <th className="p-3">Balances</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet, index) => {
                  const balance = balances[wallet.publicKey] || {};
                  const isRotating = rotatingId === wallet._id;
                  
                  return (
                    <tr 
                      key={wallet._id || wallet.publicKey || index} 
                      className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium text-white">{wallet.label}</div>
                      </td>
                      
                      <td className="p-3">
                        <span className="px-2 py-1 bg-neutral-700 rounded text-xs capitalize">
                          {wallet.purpose || 'other'}
                        </span>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-mono text-xs text-neutral-300 max-w-32">
                          {wallet.publicKey}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(wallet.publicKey)}
                          className="text-xs text-yellow-400 hover:text-yellow-300 mt-1"
                        >
                          Copy
                        </button>
                      </td>
                      
                      <td className="p-3">
                        <div className="text-xs space-y-2">
                          {/* SOL Balance */}
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">SOL:</span>
                            <div className="flex items-center gap-2">
                              {loadingBalances && balance.SOL === null ? (
                                <div className="loading-spinner w-3 h-3"></div>
                              ) : (
                                <>
                                  <span className={`font-mono text-right min-w-[60px] ${
                                    balance.SOL === 'Failed' || balance.SOL === 'Error' ? 'text-red-400' :
                                    balance.SOL === null ? 'text-neutral-500' : 'text-white'
                                  }`}>
                                    {balance.SOL === null ? 'Not loaded' : 
                                     balance.SOL === 'Failed' || balance.SOL === 'Error' ? 'Failed' :
                                     typeof balance.SOL === 'number' ? balance.SOL.toFixed(6) : balance.SOL}
                                  </span>
                                  {typeof balance.SOL === 'number' && balance.SOL > 0 && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* GG Balance */}
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">GG:</span>
                            <div className="flex items-center gap-2">
                              {loadingBalances && balance.GG === null ? (
                                <div className="loading-spinner w-3 h-3"></div>
                              ) : (
                                <>
                                  <span className={`font-mono text-right min-w-[60px] ${
                                    balance.GG === 'Failed' || balance.GG === 'Error' ? 'text-red-400' :
                                    balance.GG === null ? 'text-neutral-500' : 'text-yellow-400'
                                  }`}>
                                    {balance.GG === null ? 'Not loaded' : 
                                     balance.GG === 'Failed' || balance.GG === 'Error' ? 'Failed' :
                                     typeof balance.GG === 'number' ? balance.GG.toLocaleString() : balance.GG}
                                  </span>
                                  {typeof balance.GG === 'number' && balance.GG > 0 && (
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* USDC Balance */}
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-400">USDC:</span>
                            <div className="flex items-center gap-2">
                              {loadingBalances && balance.USDC === null ? (
                                <div className="loading-spinner w-3 h-3"></div>
                              ) : (
                                <>
                                  <span className={`font-mono text-right min-w-[60px] ${
                                    balance.USDC === 'Failed' || balance.USDC === 'Error' ? 'text-red-400' :
                                    balance.USDC === null ? 'text-neutral-500' : 'text-green-400'
                                  }`}>
                                    {balance.USDC === null ? 'Not loaded' : 
                                     balance.USDC === 'Failed' || balance.USDC === 'Error' ? 'Failed' :
                                     typeof balance.USDC === 'number' ? `${balance.USDC.toFixed(2)}` : balance.USDC}
                                  </span>
                                  {typeof balance.USDC === 'number' && balance.USDC > 0 && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Loading indicator or prompt */}
                          {!loadingBalances && balance.SOL === null && balance.GG === null && balance.USDC === null && (
                            <div className="text-xs text-yellow-400 mt-2 text-center italic">
                              Click "Refresh Balances" to load
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          wallet.source === 'env' 
                            ? 'bg-blue-900/30 text-blue-400' 
                            : 'bg-green-900/30 text-green-400'
                        }`}>
                          {wallet.source || 'db'}
                        </span>
                      </td>
                      
                      <td className="p-3">
                        {wallet._id ? (
                          <button
                            className="btn btn-ghost text-xs"
                            disabled={isRotating}
                            onClick={() => handleRotateKey(wallet._id)}
                          >
                            {isRotating ? (
                              <div className="flex items-center gap-1">
                                <div className="loading-spinner w-3 h-3"></div>
                                Rotating...
                              </div>
                            ) : (
                              'Rotate Key'
                            )}
                          </button>
                        ) : (
                          <span className="text-neutral-500 text-xs">Environment</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}