'use client';

import { useState } from 'react';
import api from '@/lib/api';

// This banner appears for users who have a custodial wallet (generated server-side)
// They need to export their private key and migrate to self-custody

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function WalletMigrationBanner({
  profile,
  onDismiss,
  onMigrationComplete
}) {
  const [step, setStep] = useState('banner'); // banner, confirm, reveal, import, complete
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Confirmation typing
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // Acknowledgments
  const [ackSaved, setAckSaved] = useState(false);
  const [ackImported, setAckImported] = useState(false);

  const handleRevealKey = async () => {
    if (confirmText !== 'I understand the risks') {
      setConfirmError('Please type exactly: "I understand the risks"');
      return;
    }

    setLoading(true);
    setError('');
    setConfirmError('');

    try {
      const res = await api.get('/api/wallet/private-key');
      setPrivateKey(res.data?.privateKey || '');
      setStep('reveal');
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Failed to retrieve private key';
      // Check if this is a decryption failure (key is unrecoverable)
      if (err?.response?.status === 500) {
        setStep('unrecoverable');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = privateKey;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = `GAMBINO GOLD WALLET - PRIVATE KEY BACKUP
==========================================
KEEP THIS FILE SECURE AND PRIVATE!

Wallet Address:
${profile?.walletAddress}

Private Key:
${privateKey}

==========================================
WARNING: Anyone with access to this
private key can steal your funds.
Never share it with anyone.

IMPORTANT: Import this key into Phantom
or another Solana wallet app, then you
can safely delete this file.
==========================================
Generated: ${new Date().toISOString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gambino-wallet-PRIVATE-KEY-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleComplete = async () => {
    // Mark migration as complete in user profile
    // This could update a flag in the database
    try {
      await api.post('/api/users/profile/migration-complete');
    } catch (err) {
      // Non-critical, just log
      console.error('Failed to mark migration complete:', err);
    }

    // Clear sensitive data
    setPrivateKey('');
    onMigrationComplete?.();
  };

  // Don't show if no wallet or if already migrated
  if (!profile?.walletAddress) return null;

  // Check if this is a custodial wallet (server-generated)
  // You might have a flag like profile.walletType === 'custodial' or profile.needsMigration
  // For now, we'll show it if they have a wallet and haven't completed migration
  if (profile.walletMigrationComplete) return null;

  return (
    <>
      {/* Compact Banner */}
      {step === 'banner' && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Action Required: Export Your Wallet</h3>
                <p className="text-red-200/80 text-xs mt-1">
                  Your wallet was created on our servers. For your security, you need to export your private key and import it into a wallet app like Phantom. We will no longer store private keys.
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-13 md:ml-0">
              <button
                onClick={() => setStep('confirm')}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Export Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Modal for Migration Steps */}
      {step !== 'banner' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

            {/* Step: Confirm */}
            {step === 'confirm' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Export Private Key</h2>
                    <p className="text-sm text-red-400">Critical security operation</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-200 text-sm font-semibold mb-2">Why is this required?</p>
                    <ul className="text-red-200/80 text-xs space-y-1">
                      <li>• We previously stored your private key for convenience</li>
                      <li>• This creates regulatory and security risks for everyone</li>
                      <li>• You need to take custody of your own keys</li>
                      <li>• After this, only YOU can access your funds</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-200 text-sm font-semibold mb-2">What you need to do:</p>
                    <ol className="text-yellow-200/80 text-xs space-y-1 list-decimal list-inside">
                      <li>Copy or download your private key</li>
                      <li>Import it into Phantom wallet (or another Solana wallet)</li>
                      <li>Verify your balance appears correctly</li>
                      <li>Delete any files containing your private key</li>
                    </ol>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-white text-sm font-medium mb-3">
                    Type "I understand the risks" to continue:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => {
                      setConfirmText(e.target.value);
                      setConfirmError('');
                    }}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 font-mono text-sm"
                    placeholder="Type confirmation here..."
                  />
                  {confirmError && (
                    <p className="text-red-400 text-xs mt-2">{confirmError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('banner');
                      setConfirmText('');
                      setConfirmError('');
                    }}
                    className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRevealKey}
                    disabled={loading || !confirmText.trim()}
                    className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        Retrieving...
                      </>
                    ) : (
                      'Reveal Private Key'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Reveal Key */}
            {step === 'reveal' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Your Private Key</h2>
                    <p className="text-sm text-red-400">Save this securely!</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-300 text-sm mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold">DO NOT share this with anyone!</span>
                  </div>
                  <p className="text-red-200/80 text-xs">
                    Anyone with this key can steal all your funds. Never share it, even with Gambino support.
                  </p>
                </div>

                {/* Wallet Address */}
                <div className="mb-4">
                  <p className="text-xs text-neutral-400 mb-2">Wallet Address</p>
                  <div className="bg-neutral-800 rounded-lg p-3 font-mono text-xs text-yellow-400 break-all">
                    {profile?.walletAddress}
                  </div>
                </div>

                {/* Private Key */}
                <div className="mb-4">
                  <p className="text-xs text-red-400 mb-2">Private Key</p>
                  <div className="bg-black border border-red-500/30 rounded-lg p-3 font-mono text-xs text-yellow-400 break-all select-all">
                    {privateKey}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Key
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {downloaded ? (
                      <>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Downloaded
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <p className="text-blue-200 text-sm font-semibold mb-2">Next Step: Import into Phantom</p>
                  <ol className="text-blue-200/80 text-xs space-y-1 list-decimal list-inside">
                    <li>Open Phantom wallet app or extension</li>
                    <li>Go to Settings {'>'} Manage Accounts {'>'} Add/Connect Wallet</li>
                    <li>Select "Import Private Key"</li>
                    <li>Paste your private key</li>
                    <li>Verify your GAMBINO balance appears</li>
                  </ol>
                </div>

                <button
                  onClick={() => setStep('import')}
                  disabled={!copied && !downloaded}
                  className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all"
                >
                  I've Saved My Key - Continue
                </button>
              </div>
            )}

            {/* Step: Import Confirmation */}
            {step === 'import' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Confirm Import</h2>
                    <p className="text-sm text-neutral-400">Verify everything is working</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer group p-4 bg-neutral-800 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={ackSaved}
                      onChange={(e) => setAckSaved(e.target.checked)}
                      className="mt-1 w-5 h-5 text-green-500 bg-neutral-700 border-neutral-600 rounded focus:ring-green-500/50"
                    />
                    <div>
                      <span className="text-sm text-white font-medium block">I have saved my private key securely</span>
                      <span className="text-xs text-neutral-400">Either copied to a password manager or downloaded the backup file</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group p-4 bg-neutral-800 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={ackImported}
                      onChange={(e) => setAckImported(e.target.checked)}
                      className="mt-1 w-5 h-5 text-green-500 bg-neutral-700 border-neutral-600 rounded focus:ring-green-500/50"
                    />
                    <div>
                      <span className="text-sm text-white font-medium block">I have imported my key into Phantom (or another wallet)</span>
                      <span className="text-xs text-neutral-400">And verified my balance appears correctly</span>
                    </div>
                  </label>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-yellow-200">
                      <p className="font-semibold mb-1">Important</p>
                      <p className="text-yellow-300/80 text-xs">
                        After completing this migration, you will use Phantom (or your wallet app) to sign transactions. Your private key will no longer be stored on our servers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('reveal')}
                    className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!ackSaved || !ackImported}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                  >
                    Complete Migration
                  </button>
                </div>
              </div>
            )}

            {/* Step: Unrecoverable Key */}
            {step === 'unrecoverable' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Key Unrecoverable</h2>
                    <p className="text-sm text-red-400">Unable to decrypt stored key</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-200 text-sm font-semibold mb-2">What happened?</p>
                  <p className="text-red-200/80 text-xs">
                    The private key stored for your wallet cannot be decrypted. This may be due to a system configuration change. Unfortunately, this means we cannot provide you with the private key for this wallet.
                  </p>
                </div>

                <div className="bg-neutral-800 rounded-xl p-4 mb-6">
                  <p className="text-xs text-neutral-400 mb-2">Affected Wallet Address</p>
                  <p className="font-mono text-xs text-yellow-400 break-all">{profile?.walletAddress}</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <p className="text-yellow-200 text-sm font-semibold mb-2">Your Options:</p>
                  <ul className="text-yellow-200/80 text-xs space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">1.</span>
                      <span>If you have any tokens in this wallet, they remain on the blockchain. If you previously exported or saved the private key/seed phrase, you can still access them.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">2.</span>
                      <span>You can connect a different Phantom wallet to your account. Future rewards will go to the new wallet.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('banner')}
                    className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Mark migration as complete so they can connect a new wallet
                      handleComplete();
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Connect Different Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
