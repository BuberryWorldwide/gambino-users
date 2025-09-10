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
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [treasuryData, setTreasuryData] = useState(null);

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

  // Updated function to use the correct blockchain treasury endpoint
  const loadWallets = async () => {
    setLoading(true);
    setError('');
    try {
      // Use the correct endpoint from your backend
      const { data } = await api.get('/api/admin/treasury/balances', {
        headers: {
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'your-admin-api-key-change-this'
        }
      });

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load treasury data');
      }

      // Store the full treasury data
      setTreasuryData(data.data);
      
      // Convert the blockchain response to wallet format for the UI
      const convertedWallets = data.data.accounts.map(account => ({
        id: account.accountType, // Use accountType as ID
        label: account.label,
        purpose: account.accountType,
        publicKey: account.publicKey,
        source: 'blockchain',
        securityLevel: account.securityLevel,
        status: account.status,
        balances: {
          SOL: account.solBalance,
          GG: account.tokenBalance,
          USDC: 0 // Add if you track USDC
        },
        network: account.network,
        lastChecked: account.lastChecked,
        tokenAccount: account.tokenAccount,
        percentage: account.percentage
      }));

      setWallets(convertedWallets);
      
      console.log(`Loaded ${convertedWallets.length} treasury wallets from blockchain`);
      console.log('Treasury summary:', data.data.summary);
      
    } catch (e) {
      console.error('Treasury wallets load error:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to load treasury wallets');
      
      // Handle authentication errors
      if (e?.response?.status === 401) {
        setError('Admin authentication failed. Please check your admin key configuration.');
      } else if (e?.response?.status === 403) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh function - blockchain endpoint always fetches live data
  const refreshBalances = async () => {
    setLoadingBalances(true);
    setError('');
    setSuccess('');
    
    try {
      // Just reload the wallets since the blockchain endpoint fetches live data
      await loadWallets();
      
      setSuccess(`Balances refreshed for ${wallets.length} wallets from blockchain`);
      setTimeout(() => setSuccess(''), 4000);
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

  // Note: Add wallet functionality may need to be updated to work with your credential manager
  const handleAddWallet = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');
    
    try {
      // This might need to be updated to use your credential manager endpoint
      // Check if you have an endpoint for adding new treasury accounts
      await api.post('/api/admin/treasury', form);
      setSuccess('Wallet added successfully');
      setForm({ label: '', purpose: 'other', publicKey: '', privateKeyBase64: '' });
      await loadWallets(); // Reload wallets
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to add wallet. This may need credential manager integration.');
    } finally {
      setAdding(false);
    }
  };

  const handleRotateKey = async (accountType) => {
    const newKey = prompt('Enter new private key (base64) for rotation:');
    if (!newKey || !newKey.trim()) return;
    
    setRotatingId(accountType);
    setError('');
    setSuccess('');
    
    try {
      // This endpoint may need to be updated for your credential manager
      await api.post(`/api/admin/treasury/${accountType}/rotate`, { 
        privateKeyBase64: newKey.trim() 
      });
      setSuccess('Private key rotated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to rotate key. This may need credential manager integration.');
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

  // Format balance display
  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return 'N/A';
    if (balance === 0) return '0';
    return Number(balance).toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  // Format status display
  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <span className="badge bg-green-600 text-white">Healthy</span>;
      case 'ERROR':
        return <span className="badge bg-red-600 text-white">Error</span>;
      default:
        return <span className="badge bg-gray-600 text-white">Unknown</span>;
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
          <span>Loading treasury wallets from blockchain...</span>
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
            Blockchain treasury wallets and balances
          </p>
          {treasuryData?.summary && (
            <div className="mt-2 space-y-1">
              <div className="text-sm text-neutral-300">
                <strong>Total:</strong> {formatBalance(treasuryData.summary.totalSolBalance)} SOL, {formatBalance(treasuryData.summary.totalTokenBalance)} {treasuryData.summary.tokenSymbol}
              </div>
              <div className="text-xs text-neutral-400">
                Network: <span className="capitalize font-medium">{treasuryData.summary.network}</span> | 
                Accounts: {treasuryData.summary.healthyAccounts}/{treasuryData.summary.totalAccounts} healthy |
                Last updated: {new Date(treasuryData.summary.lastUpdated).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={refreshBalances} 
            disabled={loadingBalances}
            className="btn btn-ghost text-sm"
          >
            {loadingBalances ? 'Refreshing...' : 'Refresh Balances'}
          </button>
          <button 
            onClick={() => {
              console.log('Current treasury data:', treasuryData);
              console.log('Current wallets:', wallets);
            }}
            className="btn btn-ghost text-sm bg-blue-600 hover:bg-blue-700"
          >
            Debug Log
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

      {/* Add Wallet Form - Note: May need credential manager integration */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Add Treasury Wallet</h2>
        <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-300 p-3 rounded-lg mb-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Note: Adding wallets may require credential manager integration
          </div>
        </div>
        
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
              <label className="label">Account Type</label>
              <select 
                className="input mt-1" 
                value={form.purpose} 
                onChange={e => setForm({ ...form, purpose: e.target.value })}
              >
                <option value="treasury">Treasury</option>
                <option value="jackpot">Jackpot</option>
                <option value="operations">Operations</option>
                <option value="community">Community</option>
                <option value="staking">Staking</option>
                <option value="development">Development</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Public Key</label>
            <input 
              className="input mt-1" 
              value={form.publicKey} 
              onChange={e => setForm({ ...form, publicKey: e.target.value })} 
              placeholder="Solana public key address"
              required 
            />
          </div>

          <div>
            <label className="label">Private Key (Base64)</label>
            <textarea 
              className="input mt-1 min-h-[100px]" 
              value={form.privateKeyBase64} 
              onChange={e => setForm({ ...form, privateKeyBase64: e.target.value })} 
              placeholder="Base64 encoded private key"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={adding}
            className="btn btn-primary"
          >
            {adding ? 'Adding...' : 'Add Wallet'}
          </button>
        </form>
      </div>

      {/* Wallets List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Treasury Wallets ({wallets.length})</h2>
        </div>

        {wallets.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <p>No treasury wallets found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div key={wallet.publicKey} className="bg-neutral-800/50 rounded-lg p-6 border border-neutral-700">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section - Account Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {wallet.purpose === 'treasury' && <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>}
                      {wallet.purpose === 'jackpot' && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
                      {wallet.purpose === 'operations' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                      {wallet.purpose === 'community' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                      {wallet.purpose === 'staking' && <div className="w-3 h-3 bg-orange-500 rounded-full"></div>}
                      {wallet.purpose === 'development' && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
                      {!['treasury', 'jackpot', 'operations', 'community', 'staking', 'development'].includes(wallet.purpose) && <div className="w-3 h-3 bg-gray-500 rounded-full"></div>}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{wallet.label}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="bg-neutral-700 px-2 py-1 rounded text-neutral-300 capitalize">
                          {wallet.purpose}
                        </span>
                        <span className="text-neutral-400">
                          Security: <span className="text-white font-medium">{wallet.securityLevel}</span>
                        </span>
                        {wallet.percentage > 0 && (
                          <span className="text-blue-400">
                            {wallet.percentage}% allocation
                          </span>
                        )}
                        {getStatusBadge(wallet.status)}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-neutral-400 mb-1">Public Key</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-neutral-900 px-2 py-1 rounded text-neutral-300 font-mono">
                            {wallet.publicKey ? 
                              `${wallet.publicKey.slice(0, 12)}...${wallet.publicKey.slice(-12)}` : 
                              'N/A'
                            }
                          </code>
                          {wallet.publicKey && (
                            <button
                              onClick={() => copyToClipboard(wallet.publicKey)}
                              className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 hover:bg-blue-900/20 rounded transition-colors"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Balances & Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Balances */}
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-xs text-neutral-400 mb-1">SOL Balance</div>
                        <div className="text-xl font-mono font-semibold text-white">
                          {formatBalance(wallet.balances?.SOL)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-neutral-400 mb-1">Token Balance</div>
                        <div className="text-xl font-mono font-semibold text-white">
                          {formatBalance(wallet.balances?.GG)}
                        </div>
                        {wallet.tokenAccount && (
                          <div className="text-xs text-green-400 mt-1">
                            ✓ Token Account
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleRotateKey(wallet.id)}
                        disabled={rotatingId === wallet.id}
                        className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white border-none"
                      >
                        {rotatingId === wallet.id ? 'Rotating...' : 'Rotate Key'}
                      </button>
                      {wallet.lastChecked && (
                        <div className="text-xs text-neutral-400 text-center">
                          Updated: {new Date(wallet.lastChecked).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}