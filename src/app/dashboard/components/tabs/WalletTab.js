'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import CreateWalletModal from '@/components/wallet/CreateWalletModal';
import ConnectWalletModal from '@/components/wallet/ConnectWalletModal';
import WalletMigrationBanner from '@/components/wallet/WalletMigrationBanner';

function LoadingSpinner() {
  return (
    <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
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
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // QR code
  const [qr, setQr] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Copy functionality
  const [copySuccess, setCopySuccess] = useState('');

  // Refresh balance state
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // Load QR code when wallet exists
  useEffect(() => {
    if (profile?.walletAddress) {
      loadQRCode();
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

  const handleWalletCreated = async (publicKey) => {
    setSuccess('Wallet created successfully! You now have full control of your keys.');
    await refreshProfile();
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleWalletConnected = async (publicKey) => {
    setSuccess('Wallet connected successfully!');
    await refreshProfile();
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleMigrationComplete = async () => {
    setSuccess('Migration complete! Your wallet is now self-custody.');
    await refreshProfile();
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleCopyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${label} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(`${label} copied!`);
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const handleRefreshBalance = async () => {
    if (!profile?.walletAddress || refreshingBalance) return;

    setRefreshingBalance(true);
    setError('');
    try {
      await refreshBalances();
      await refreshProfile();
      setSuccess('Balances refreshed!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to refresh balances');
    } finally {
      setRefreshingBalance(false);
    }
  };

  // Get balance values with fallback to cached
  const sol = balances?.SOL !== undefined ? Number(balances.SOL) : (profile?.cachedSolBalance || 0);
  const gg = balances?.GG !== undefined ? Number(balances.GG || 0) : (profile?.cachedGambinoBalance || 0);
  const usdc = balances?.USDC !== undefined ? Number(balances.USDC || 0) : (profile?.cachedUsdcBalance || 0);

  // Check if we're using cached data
  const usingCachedData = balances?.SOL === undefined || balances?.GG === undefined;

  // Check if user needs migration (has wallet but it was server-generated)
  const needsMigration = profile?.walletAddress && !profile?.walletMigrationComplete && profile?.walletType === 'generated';

  // Can change wallet if: migrated OR wallet was externally connected (not server-generated)
  const canChangeWallet = profile?.walletAddress && (profile?.walletMigrationComplete || profile?.walletType === 'connected');

  // State for change wallet confirmation
  const [showChangeWalletConfirm, setShowChangeWalletConfirm] = useState(false);

  const handleChangeWallet = () => {
    setShowChangeWalletConfirm(true);
  };

  const confirmChangeWallet = () => {
    setShowChangeWalletConfirm(false);
    setShowConnectModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Migration Banner for existing custodial wallets */}
      {needsMigration && (
        <WalletMigrationBanner
          profile={profile}
          onMigrationComplete={handleMigrationComplete}
        />
      )}

      {/* Wallet Setup or Wallet Info */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Wallet</h2>
              <p className="text-xs text-neutral-400">
                {profile?.walletAddress ? 'Self-custody wallet' : 'Set up your wallet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${profile?.walletAddress ? 'bg-green-500' : 'bg-neutral-500'}`}></div>
            <span className="text-xs text-neutral-400">
              {profile?.walletAddress ? 'Connected' : 'Not Set Up'}
            </span>
          </div>
        </div>

        {!profile?.walletAddress ? (
          /* No Wallet - Show Setup Options */
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Self-Custody Only</p>
                  <p className="text-yellow-300/80 text-xs">
                    All wallets are non-custodial. You control your private keys - we never have access to them.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Connect Existing Wallet */}
              <button
                onClick={() => setShowConnectModal(true)}
                className="group p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-purple-500/50 rounded-xl transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                  Connect Wallet
                </h3>
                <p className="text-neutral-400 text-sm">
                  Already have a Phantom wallet? Connect it to your account.
                </p>
                <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm">
                  <span>Recommended</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Create New Wallet */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="group p-6 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-yellow-500/50 rounded-xl transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-yellow-300 transition-colors">
                  Create New Wallet
                </h3>
                <p className="text-neutral-400 text-sm">
                  Generate a new Solana wallet with a recovery phrase.
                </p>
                <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
                  <span>New to crypto?</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Has Wallet - Show Wallet Info */
          <div className="space-y-6">
            {/* Wallet Address */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-neutral-400">Wallet Address</p>
                <button
                  onClick={() => handleCopyToClipboard(profile.walletAddress, 'Address')}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className="bg-neutral-800/50 p-3 rounded-lg border border-neutral-700 font-mono text-xs text-yellow-400 break-all">
                {profile.walletAddress}
              </div>
              {copySuccess && (
                <p className="text-xs text-green-400 mt-2">{copySuccess}</p>
              )}
            </div>

            {/* Balance Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-400">Balances</p>
                <button
                  onClick={handleRefreshBalance}
                  disabled={refreshingBalance}
                  className="text-xs text-yellow-400 hover:text-yellow-300 disabled:text-neutral-500 transition-colors flex items-center gap-2"
                >
                  {refreshingBalance ? (
                    <>
                      <LoadingSpinner />
                      Syncing...
                    </>
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
                <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">SOL</p>
                  <p className="text-xl font-bold text-white">{sol.toFixed(4)}</p>
                </div>
                <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">GAMBINO</p>
                  <p className="text-xl font-bold text-yellow-400">{gg.toLocaleString()}</p>
                </div>
                <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">USDC</p>
                  <p className="text-xl font-bold text-white">${usdc.toFixed(2)}</p>
                </div>
              </div>

              {usingCachedData && (
                <p className="text-xs text-neutral-500 mt-3 text-center">
                  Showing cached balances
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowQRModal(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h1M6 16H5m13-9V6a2 2 0 00-2-2H8a2 2 0 00-2 2v1" />
                </svg>
                Receive (QR)
              </button>
              <button
                onClick={() => handleCopyToClipboard(profile.walletAddress, 'Address')}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Address
              </button>
              {canChangeWallet && (
                <button
                  onClick={handleChangeWallet}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Link Different Wallet
                </button>
              )}
            </div>

            {/* Self-custody notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Self-Custody Wallet</p>
                  <p className="text-blue-300/80 text-xs">
                    To send tokens, use your Phantom wallet app. We only display your balances - you have full control of your keys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWalletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWalletCreated={handleWalletCreated}
      />

      <ConnectWalletModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onWalletConnected={handleWalletConnected}
      />

      {/* Change Wallet Confirmation Modal */}
      {showChangeWalletConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Change Wallet?</h2>
                <p className="text-sm text-neutral-400">This will link a different wallet</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <p className="text-yellow-200 text-sm font-semibold mb-2">Important:</p>
              <ul className="text-yellow-200/80 text-xs space-y-1">
                <li>• Any tokens in your current wallet will stay there</li>
                <li>• You'll need to use Phantom to transfer them to your new wallet</li>
                <li>• Your account will be linked to the new wallet address</li>
                <li>• Future rewards will go to the new wallet</li>
              </ul>
            </div>

            <div className="bg-neutral-800 rounded-xl p-4 mb-6">
              <p className="text-xs text-neutral-400 mb-2">Current Wallet</p>
              <p className="font-mono text-xs text-yellow-400 break-all">{profile?.walletAddress}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowChangeWalletConfirm(false)}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmChangeWallet}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all"
              >
                Connect New Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Receive Tokens</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-4 text-center">
              Scan this QR code to send tokens to your wallet
            </p>

            {qr ? (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl">
                  <img
                    src={qr}
                    alt="Wallet QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8 mb-4">
                <LoadingSpinner />
              </div>
            )}

            <div className="bg-neutral-800 p-3 rounded-lg font-mono text-xs text-yellow-400 break-all mb-4">
              {profile.walletAddress}
            </div>

            <button
              onClick={() => handleCopyToClipboard(profile.walletAddress, 'Address')}
              className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all"
            >
              Copy Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
