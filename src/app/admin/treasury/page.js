'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';
import StandardizedAdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminLoadingSpinner 
} from '@/components/layout/StandardizedAdminLayout';

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

  const loadWallets = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/admin/treasury/balances', {
        headers: {
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'your-admin-api-key-change-this'
        }
      });

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load treasury data');
      }

      setTreasuryData(data.data);
      
      const convertedWallets = data.data.accounts.map(account => ({
        id: account.accountType,
        label: account.label,
        purpose: account.accountType,
        publicKey: account.publicKey,
        source: 'blockchain',
        securityLevel: account.securityLevel,
        status: account.status,
        balances: {
          SOL: account.solBalance,
          GG: account.tokenBalance,
          USDC: 0
        },
        network: account.network,
        lastChecked: account.lastChecked,
        tokenAccount: account.tokenAccount,
        percentage: account.percentage
      }));

      setWallets(convertedWallets);
      console.log(`Loaded ${convertedWallets.length} treasury wallets from blockchain`);
      
    } catch (e) {
      console.error('Treasury wallets load error:', e);
      setError(e?.response?.data?.error || e.message || 'Failed to load treasury wallets');
      
      if (e?.response?.status === 401) {
        setError('Admin authentication failed. Please check your admin key configuration.');
      } else if (e?.response?.status === 403) {
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

  const handleAddWallet = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post('/api/admin/treasury', form);
      setSuccess('Wallet added successfully');
      setForm({ label: '', purpose: 'other', publicKey: '', privateKeyBase64: '' });
      await loadWallets();
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

  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return '0';
    return Number(balance).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'admin-badge-active',
      inactive: 'admin-badge-inactive',
      maintenance: 'admin-badge-maintenance'
    };
    
    return (
      <span className={`admin-badge ${badges[status] || 'admin-badge-inactive'}`}>
        {status}
      </span>
    );
  };

  const getPurposeColor = (purpose) => {
    const colors = {
      treasury: 'bg-yellow-500',
      jackpot: 'bg-purple-500',
      operations: 'bg-blue-500',
      community: 'bg-green-500',
      staking: 'bg-orange-500',
      development: 'bg-red-500'
    };
    return colors[purpose] || 'bg-gray-500';
  };

  if (!mounted) return null;

  // Page Actions for the header
  const pageActions = (
    <>
      <AdminButton
        onClick={refreshBalances}
        disabled={loadingBalances}
        variant="secondary"
        className="flex items-center gap-2"
      >
        {loadingBalances ? (
          <>
            <AdminLoadingSpinner size="sm" />
            Refreshing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Balances
          </>
        )}
      </AdminButton>
    </>
  );

  return (
    <StandardizedAdminLayout
      pageTitle="Treasury Management"
      pageDescription="Monitor and manage Gambino Gold treasury wallets and balances"
      pageActions={pageActions}
    >
      {/* Status Messages */}
      {error && (
        <div className="admin-error mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-200 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="admin-success mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-200 font-medium">{success}</span>
          </div>
        </div>
      )}

      {loading ? (
        <AdminCard className="text-center py-12">
          <AdminLoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading treasury data...</p>
        </AdminCard>
      ) : (
        <div className="space-y-8">
          {/* Treasury Summary */}
          {treasuryData?.summary && (
            <AdminCard>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold">💰</span>
                </div>
                Treasury Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="admin-metric-card admin-metric-yellow">
                  <div className="admin-metric-icon bg-yellow-400/20">
                    <span className="text-2xl">🪙</span>
                  </div>
                  <div className="admin-metric-value">
                    {formatBalance(treasuryData.summary.totalTokenBalance / 1000000)}M
                  </div>
                  <div className="admin-metric-label">Total GG Tokens</div>
                  <div className="admin-metric-subtitle">Across all accounts</div>
                </div>

                <div className="admin-metric-card admin-metric-blue">
                  <div className="admin-metric-icon bg-blue-400/20">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="admin-metric-value">
                    {formatBalance(treasuryData.summary.totalSolBalance)}
                  </div>
                  <div className="admin-metric-label">Total SOL</div>
                  <div className="admin-metric-subtitle">Network fees</div>
                </div>

                <div className="admin-metric-card admin-metric-green">
                  <div className="admin-metric-icon bg-green-400/20">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <div className="admin-metric-value">
                    {treasuryData.summary.activeAccounts}
                  </div>
                  <div className="admin-metric-label">Active Accounts</div>
                  <div className="admin-metric-subtitle">Operational wallets</div>
                </div>

                <div className="admin-metric-card admin-metric-orange">
                  <div className="admin-metric-icon bg-orange-400/20">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <div className="admin-metric-value">
                    {treasuryData.summary.network}
                  </div>
                  <div className="admin-metric-label">Network</div>
                  <div className="admin-metric-subtitle">Blockchain environment</div>
                </div>
              </div>
            </AdminCard>
          )}

          {/* Add New Wallet Form */}
          <AdminCard>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Treasury Wallet
            </h2>
            
            <form onSubmit={handleAddWallet} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Label
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="e.g., Main Treasury Wallet"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Purpose
                </label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Public Key
                </label>
                <input
                  type="text"
                  value={form.publicKey}
                  onChange={(e) => setForm(prev => ({ ...prev, publicKey: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono text-sm"
                  placeholder="Enter Solana public key"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Private Key (Base64)
                </label>
                <input
                  type="password"
                  value={form.privateKeyBase64}
                  onChange={(e) => setForm(prev => ({ ...prev, privateKeyBase64: e.target.value }))}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono text-sm"
                  placeholder="Enter private key in base64 format"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <AdminButton
                  type="submit"
                  disabled={adding}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  {adding ? (
                    <>
                      <AdminLoadingSpinner size="sm" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Wallet
                    </>
                  )}
                </AdminButton>
              </div>
            </form>
          </AdminCard>

          {/* Wallets List */}
          <AdminCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Treasury Wallets ({wallets.length})
              </h2>
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <p className="text-lg font-medium">No treasury wallets found</p>
                <p className="text-sm">Add your first wallet using the form above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <div key={wallet.publicKey} className="admin-card bg-gray-800/30">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left Section - Account Info */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-4 h-4 ${getPurposeColor(wallet.purpose)} rounded-full`}></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{wallet.label}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                            <span className="bg-gray-700/50 px-3 py-1 rounded-lg text-gray-300 capitalize font-medium">
                              {wallet.purpose}
                            </span>
                            <span className="text-gray-400">
                              Security: <span className="text-white font-medium">{wallet.securityLevel}</span>
                            </span>
                            {wallet.percentage > 0 && (
                              <span className="text-blue-400 font-medium">
                                {wallet.percentage}% allocation
                              </span>
                            )}
                            {getStatusBadge(wallet.status)}
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1 font-medium">Public Key</div>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-gray-900/50 px-3 py-2 rounded-lg text-gray-300 font-mono border border-gray-700/50">
                                {wallet.publicKey ? 
                                  `${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-8)}` :
                                  'Not available'
                                }
                              </code>
                              {wallet.publicKey && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(wallet.publicKey)}
                                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                                  title="Copy public key"
                                >
                                  <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Center Section - Balances */}
                      <div className="grid grid-cols-2 gap-4 min-w-[200px]">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {formatBalance(wallet.balances.GG / 1000000)}M
                          </div>
                          <div className="text-sm text-gray-400">GG Tokens</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {formatBalance(wallet.balances.SOL)}
                          </div>
                          <div className="text-sm text-gray-400">SOL</div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <AdminButton
                          onClick={() => handleRotateKey(wallet.id)}
                          disabled={rotatingId === wallet.id}
                          variant="secondary"
                          size="sm"
                          className="w-full"
                        >
                          {rotatingId === wallet.id ? (
                            <>
                              <AdminLoadingSpinner size="sm" />
                              <span className="ml-2">Rotating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="ml-2">Rotate Key</span>
                            </>
                          )}
                        </AdminButton>
                        
                        {wallet.lastChecked && (
                          <div className="text-xs text-gray-500 text-center">
                            Last checked: {new Date(wallet.lastChecked).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      )}
    </StandardizedAdminLayout>
  );
}