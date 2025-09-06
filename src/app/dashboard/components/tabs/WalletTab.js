import { useState, useEffect } from 'react';
import api from '@/lib/api';

function LoadingSpinner() {
  return (
    <div className="loading-spinner w-5 h-5 text-yellow-500"></div>
  );
}

export default function WalletTab({ 
  profile, 
  balances, 
  setError, 
  setSuccess, 
  refreshProfile,
  refreshBalances 
}) {
  // Wallet generation
  const [generatingWallet, setGeneratingWallet] = useState(false);
  
  // QR and Private Key modals
  const [qr, setQr] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [revealingKey, setRevealingKey] = useState(false);
  
  // Transfer functionality
  const [transferForm, setTransferForm] = useState({
    toAddress: '',
    amount: '',
    memo: ''
  });
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(false);

  // Copy functionality
  const [copySuccess, setCopySuccess] = useState('');

  // Load QR code and transfers when wallet exists
  useEffect(() => {
    if (profile?.walletAddress) {
      loadQRCode();
      loadRecentTransfers();
    }
  }, [profile?.walletAddress]);

  const loadQRCode = async () => {
    try {
      const res = await api.get(`/api/wallet/qrcode/${profile.walletAddress}`);
      setQr(res.data?.qr);
    } catch (err) {
      console.error('Failed to load QR code:', err);
    }
  };

  const loadRecentTransfers = async () => {
    try {
      setTransfersLoading(true);
      const res = await api.get('/api/wallet/transfers/history');
      setRecentTransfers(res.data?.transfers || []);
    } catch (err) {
      console.error('Failed to load transfer history:', err);
      setRecentTransfers([]);
    } finally {
      setTransfersLoading(false);
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

  const handleCopyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${label} copied to clipboard!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(`${label} copied to clipboard!`);
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const handleRevealPrivateKey = async () => {
    setRevealingKey(true);
    try {
      const res = await api.get('/api/wallet/private-key');
      setPrivateKey(res.data?.privateKey || '');
      setShowPrivateKey(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reveal private key');
    } finally {
      setRevealingKey(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!transferForm.toAddress || !transferForm.amount) {
      setTransferError('Recipient address and amount are required');
      return;
    }

    if (parseFloat(transferForm.amount) <= 0) {
      setTransferError('Amount must be greater than 0');
      return;
    }

    try {
      setTransferring(true);
      
      const res = await api.post('/api/wallet/transfer', {
        toAddress: transferForm.toAddress,
        amount: parseFloat(transferForm.amount),
        memo: transferForm.memo || undefined
      });

      if (res.data?.success) {
        setTransferSuccess(`Transfer of ${transferForm.amount} GAMBINO initiated successfully!`);
        setTransferForm({ toAddress: '', amount: '', memo: '' });
        
        // Refresh balances and transfers
        await refreshBalances();
        await loadRecentTransfers();
        
        setTimeout(() => setTransferSuccess(''), 5000);
      }
    } catch (err) {
      setTransferError(err?.response?.data?.error || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  // Get balance values with fallback to cached
  const sol = balances?.SOL !== undefined ? Number(balances.SOL) : (profile?.cachedSolBalance || 0);
  const gg = balances?.GG !== undefined ? Number(balances.GG || 0) : (profile?.cachedGambinoBalance || 0);
  const usdc = balances?.USDC !== undefined ? Number(balances.USDC || 0) : (profile?.cachedUsdcBalance || 0);

  // Check if we're using cached data
  const usingCachedData = balances?.SOL === undefined || balances?.GG === undefined;

  return (
    <div className="space-y-6">
      {/* Wallet Generation or Wallet Info */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Wallet Management</h2>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className={`h-2 w-2 rounded-full ${profile?.walletAddress ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {profile?.walletAddress ? 'Connected' : 'No Wallet'}
          </div>
        </div>

        {!profile?.walletAddress ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-yellow-500/50"></div>
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
                'Generate Wallet'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Address */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="label">Wallet Address</p>
                <button
                  onClick={() => handleCopyToClipboard(profile.walletAddress, 'Wallet address')}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Copy Address
                </button>
              </div>
              <p className="wallet-address text-xs bg-neutral-800/50 p-3 rounded border border-neutral-700 break-all">
                {profile.walletAddress}
              </p>
            </div>

            {/* Private Key Section */}
            <div className="private-key-warning">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-red-400 font-semibold">⚠️ Private Key (Keep Secret!)</p>
                <button
                  onClick={handleRevealPrivateKey}
                  disabled={revealingKey}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
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
              </div>
              <p className="text-neutral-500 text-sm">
                For your security, the key is shown once per request and not stored in the browser.
              </p>
            </div>

            {/* Wallet Actions */}
            <div className="flex flex-wrap gap-3">
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
              <button 
                onClick={refreshBalances}
                className="btn btn-ghost text-sm"
              >
                🔄 Refresh Balances
              </button>
            </div>

            {/* Copy Success Message */}
            {copySuccess && (
              <div className="text-sm text-green-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {copySuccess}
              </div>
            )}

            {/* Enhanced Balance Display */}
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {qr && (
                <div className="text-center w-full lg:w-auto">
                  <p className="label mb-3">Wallet QR Code</p>
                  <div className="p-2 bg-white rounded-lg inline-block">
                    <img src={qr} alt="Wallet QR" className="w-32 h-32" />
                  </div>
                </div>
              )}
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="label">Current Balances</p>
                  {usingCachedData && (
                    <span className="text-xs text-yellow-400">Using cached data</span>
                  )}
                </div>
                <div className="balance-grid grid grid-cols-3 gap-4">
                  <div className="balance-item bg-neutral-800/50 p-4 rounded border border-neutral-700">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">SOL</p>
                    <p className="text-2xl font-bold text-white mt-1">{sol.toFixed(4)}</p>
                    {balances?.SOL === undefined && (
                      <p className="text-xs text-yellow-400">Cached</p>
                    )}
                  </div>
                  <div className="balance-item bg-neutral-800/50 p-4 rounded border border-neutral-700">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">GAMBINO</p>
                    <p className="text-2xl font-bold text-yellow-500 mt-1">{gg.toLocaleString()}</p>
                    {balances?.GG === undefined && (
                      <p className="text-xs text-yellow-400">Cached</p>
                    )}
                  </div>
                  <div className="balance-item bg-neutral-800/50 p-4 rounded border border-neutral-700">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">USDC</p>
                    <p className="text-2xl font-bold text-white mt-1">${usdc.toFixed(2)}</p>
                    {balances?.USDC === undefined && (
                      <p className="text-xs text-yellow-400">Cached</p>
                    )}
                  </div>
                </div>
                {usingCachedData && (
                  <p className="text-xs text-yellow-400 mt-2">⚠️ Live balances temporarily unavailable</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Token Transfer Section */}
      {profile?.walletAddress && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Transfer Tokens</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              Send GAMBINO
            </div>
          </div>

          <form onSubmit={handleTransfer} className="space-y-4">
            {transferError && (
              <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded text-sm">
                {transferError}
              </div>
            )}
            
            {transferSuccess && (
              <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 rounded text-sm">
                {transferSuccess}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Recipient Address</label>
                <input 
                  type="text" 
                  className="input mt-1"
                  value={transferForm.toAddress}
                  onChange={(e) => setTransferForm(prev => ({...prev, toAddress: e.target.value}))}
                  placeholder="Enter wallet address"
                  required
                />
              </div>
              <div>
                <label className="label">Amount (GAMBINO)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  className="input mt-1"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({...prev, amount: e.target.value}))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="label">Memo (Optional)</label>
              <input 
                type="text" 
                className="input mt-1"
                value={transferForm.memo}
                onChange={(e) => setTransferForm(prev => ({...prev, memo: e.target.value}))}
                placeholder="Add a note..."
                maxLength={100}
              />
              <div className="text-xs text-neutral-500 mt-1">
                {transferForm.memo.length}/100 characters
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded text-sm text-yellow-200">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <strong>Important:</strong> Transfers are permanent and cannot be reversed. 
                  Double-check the recipient address before sending.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                type="submit" 
                disabled={transferring || !transferForm.toAddress || !transferForm.amount}
                className="btn btn-primary"
              >
                {transferring ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    Processing Transfer...
                  </div>
                ) : (
                  'Send Tokens'
                )}
              </button>
              <button 
                type="button" 
                onClick={() => setTransferForm({ toAddress: '', amount: '', memo: '' })}
                className="btn btn-ghost"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Transfers */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Recent Transfers</h3>
          <button 
            onClick={loadRecentTransfers}
            disabled={transfersLoading}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {transfersLoading ? <LoadingSpinner /> : '🔄 Refresh'}
          </button>
        </div>
        
        {transfersLoading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-3 text-neutral-400">
              <LoadingSpinner />
              <span>Loading transfers...</span>
            </div>
          </div>
        ) : recentTransfers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-neutral-400">No transfers yet</div>
            <div className="text-sm text-neutral-500 mt-2">Your transfer history will appear here</div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransfers.slice(0, 10).map((transfer) => (
              <div key={transfer._id} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded border border-neutral-700">
                <div className="flex-1">
                  <div className="text-sm text-white">
                    To: {transfer.toAddress.slice(0, 8)}...{transfer.toAddress.slice(-6)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {new Date(transfer.createdAt).toLocaleString()}
                  </div>
                  {transfer.memo && (
                    <div className="text-xs text-neutral-500 mt-1">"{transfer.memo}"</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-yellow-500">
                    -{transfer.amount} GAMBINO
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    transfer.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                    transfer.status === 'failed' ? 'bg-red-900/50 text-red-300' :
                    'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {transfer.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Private Key Modal */}
      {showPrivateKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="private-key-warning max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-lg p-6">
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
                className="btn btn-primary text-sm"
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
                className="btn btn-primary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}