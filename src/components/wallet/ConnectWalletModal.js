'use client';

import { useState, useEffect } from 'react';

// Connect an existing Phantom/Solana wallet
// Non-custodial - we only store the public key

function LoadingSpinner() {
  return (
    <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function ConnectWalletModal({
  isOpen,
  onClose,
  onWalletConnected
}) {
  const [step, setStep] = useState('select'); // select, connecting, confirm
  const [publicKey, setPublicKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setPublicKey('');
      setConnecting(false);
      setSaving(false);
      setError('');
    }
  }, [isOpen]);

  const isMobile = () => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  const getPhantom = () => {
    if (typeof window === 'undefined') return null;
    return (
      (window.phantom?.solana?.isPhantom && window.phantom.solana) ||
      (window.solana?.isPhantom && window.solana) ||
      null
    );
  };

  const handleConnectPhantom = async () => {
    setError('');
    setConnecting(true);

    try {
      const phantom = getPhantom();

      if (!phantom) {
        // Phantom not installed
        if (isMobile()) {
          // Deep link to open in Phantom's in-app browser
          const currentUrl = encodeURIComponent(window.location.href);
          window.location.href = `https://phantom.app/ul/browse/${currentUrl}`;
        } else {
          // Open Phantom website
          window.open('https://phantom.app/', '_blank');
          setError('Please install Phantom wallet and refresh this page');
        }
        return;
      }

      // Request connection
      const resp = await phantom.connect({ onlyIfTrusted: false });
      const key = resp?.publicKey?.toBase58?.() || resp?.publicKey?.toString?.();

      if (!key) {
        throw new Error('No public key returned from wallet');
      }

      setPublicKey(key);
      setStep('confirm');
    } catch (err) {
      console.error('Phantom connect error:', err);
      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection in Phantom.');
      } else {
        setError(err?.message || 'Failed to connect wallet');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveWallet = async () => {
    setSaving(true);
    setError('');

    try {
      const { default: api } = await import('@/lib/api');

      const res = await api.post('/api/wallet/attach', {
        publicKey: publicKey
      });

      if (res.data?.success) {
        onWalletConnected(publicKey);
        onClose();
      } else {
        throw new Error(res.data?.error || 'Failed to save wallet');
      }
    } catch (err) {
      console.error('Save wallet error:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to link wallet to account');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const phantom = getPhantom();
      if (phantom) {
        await phantom.disconnect();
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    setPublicKey('');
    setStep('select');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full">

        {/* Select Wallet */}
        {step === 'select' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                  <p className="text-sm text-neutral-400">Link your Solana wallet</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Secure Connection</p>
                  <p className="text-blue-300/80 text-xs">
                    We only request read access to your public address. We cannot access your funds or make transactions without your approval.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Wallet Options */}
            <div className="space-y-3">
              <button
                onClick={handleConnectPhantom}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-purple-500/50 rounded-xl transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  {/* Phantom Logo */}
                  <svg className="w-7 h-7 text-white" viewBox="0 0 128 128" fill="currentColor">
                    <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 115.2c-28.3 0-51.2-22.9-51.2-51.2S35.7 12.8 64 12.8s51.2 22.9 51.2 51.2-22.9 51.2-51.2 51.2z"/>
                    <circle cx="44" cy="56" r="8"/>
                    <circle cx="84" cy="56" r="8"/>
                    <path d="M64 82c-11 0-20-4-20-9s9-9 20-9 20 4 20 9-9 9-20 9z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold group-hover:text-purple-300 transition-colors">Phantom</p>
                  <p className="text-neutral-400 text-sm">Popular Solana wallet</p>
                </div>
                {connecting ? (
                  <LoadingSpinner />
                ) : (
                  <svg className="w-5 h-5 text-neutral-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Solflare - Coming Soon */}
              <button
                disabled
                className="w-full flex items-center gap-4 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-xl opacity-60 cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-neutral-400 font-semibold">Solflare</p>
                  <p className="text-neutral-500 text-sm">Coming soon</p>
                </div>
              </button>
            </div>

            {isMobile() && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Mobile Tip</p>
                    <p className="text-yellow-300/80 text-xs">
                      For the best experience, open this page inside the Phantom app's browser.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirm Connection */}
        {step === 'confirm' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Wallet Connected</h2>
                <p className="text-sm text-green-400">Ready to link to your account</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-neutral-800 rounded-xl p-4 mb-6">
              <p className="text-xs text-neutral-400 mb-2">Connected Wallet Address</p>
              <p className="font-mono text-sm text-yellow-400 break-all">{publicKey}</p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-sm text-green-200">
                  <p className="font-semibold mb-1">Self-Custody</p>
                  <p className="text-green-300/80 text-xs">
                    You maintain full control of your wallet. We only store your public address to display your balances and track rewards.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDisconnect}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              >
                Disconnect
              </button>
              <button
                onClick={handleSaveWallet}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    Linking...
                  </>
                ) : (
                  'Link to Account'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
