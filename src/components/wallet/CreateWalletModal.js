'use client';

import { useState, useEffect, useCallback } from 'react';
import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';

// Security: Generate wallet entirely client-side
// The private key / seed phrase NEVER leaves the browser
// Only the PUBLIC key is sent to the server

function LoadingSpinner() {
  return (
    <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function CreateWalletModal({
  isOpen,
  onClose,
  onWalletCreated
}) {
  const [step, setStep] = useState(1); // 1: intro, 2: show seed, 3: confirm seed, 4: saving
  const [seedPhrase, setSeedPhrase] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKeyBytes, setPrivateKeyBytes] = useState(null);

  // Confirmation state
  const [confirmWords, setConfirmWords] = useState({});
  const [wordIndices, setWordIndices] = useState([]);
  const [confirmError, setConfirmError] = useState('');

  // Security acknowledgments
  const [ackNoRecover, setAckNoRecover] = useState(false);
  const [ackNeverShare, setAckNeverShare] = useState(false);
  const [ackSavedSecurely, setAckSavedSecurely] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Generate wallet on mount (client-side only)
  useEffect(() => {
    if (isOpen && !seedPhrase) {
      generateWallet();
    }
  }, [isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      // Clear sensitive data from memory
      setSeedPhrase('');
      setPublicKey('');
      setPrivateKeyBytes(null);
      setStep(1);
      setConfirmWords({});
      setWordIndices([]);
      setConfirmError('');
      setAckNoRecover(false);
      setAckNeverShare(false);
      setAckSavedSecurely(false);
      setCopied(false);
      setError('');
    }
  }, [isOpen]);

  const generateWallet = useCallback(async () => {
    try {
      // Generate a new mnemonic (seed phrase) - 12 words
      const mnemonic = bip39.generateMnemonic();
      setSeedPhrase(mnemonic);

      // Derive seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);

      // Create Solana keypair from first 32 bytes of seed
      const seedBytes = seed.slice(0, 32);
      const keypair = Keypair.fromSeed(seedBytes);

      setPublicKey(keypair.publicKey.toBase58());
      setPrivateKeyBytes(Array.from(keypair.secretKey));

      // Select 3 random word indices for confirmation
      const indices = [];
      while (indices.length < 3) {
        const idx = Math.floor(Math.random() * 12);
        if (!indices.includes(idx)) indices.push(idx);
      }
      setWordIndices(indices.sort((a, b) => a - b));

    } catch (err) {
      console.error('Wallet generation failed:', err);
      setError('Failed to generate wallet. Please try again.');
    }
  }, []);

  const handleCopySeedPhrase = async () => {
    try {
      await navigator.clipboard.writeText(seedPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = seedPhrase;
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

  const handleDownloadSeedPhrase = () => {
    const content = `GAMBINO GOLD WALLET RECOVERY PHRASE
=====================================
KEEP THIS FILE SECURE AND PRIVATE!

Your 12-word recovery phrase:
${seedPhrase}

Public Address:
${publicKey}

=====================================
WARNING: Anyone with access to this
recovery phrase can steal your funds.
Never share it with anyone.
=====================================
Generated: ${new Date().toISOString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gambino-wallet-backup-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVerifyWords = () => {
    setConfirmError('');
    const words = seedPhrase.split(' ');

    for (const idx of wordIndices) {
      const userWord = (confirmWords[idx] || '').toLowerCase().trim();
      const correctWord = words[idx].toLowerCase();

      if (userWord !== correctWord) {
        setConfirmError(`Word #${idx + 1} is incorrect. Please check your seed phrase and try again.`);
        return;
      }
    }

    // All words correct, proceed to save
    setStep(4);
    handleSaveWallet();
  };

  const handleSaveWallet = async () => {
    setSaving(true);
    setError('');

    try {
      // Import api dynamically to avoid SSR issues
      const { default: api } = await import('@/lib/api');

      // IMPORTANT: Only send the PUBLIC KEY to the server
      // The private key / seed phrase stays in the browser
      const res = await api.post('/api/wallet/attach', {
        publicKey: publicKey
      });

      if (res.data?.success) {
        // Clear sensitive data from memory immediately
        setSeedPhrase('');
        setPrivateKeyBytes(null);

        // Notify parent component
        onWalletCreated(publicKey);
        onClose();
      } else {
        throw new Error(res.data?.error || 'Failed to save wallet');
      }
    } catch (err) {
      console.error('Save wallet error:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to save wallet to account');
      setStep(3); // Go back to confirmation step
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const words = seedPhrase.split(' ');

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Step 1: Security Introduction */}
        {step === 1 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Wallet</h2>
                <p className="text-sm text-neutral-400">Secure, non-custodial wallet</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Self-Custody Wallet</p>
                    <p className="text-yellow-300/80">
                      Your wallet keys are generated locally in your browser. We never have access to your private keys or recovery phrase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-red-200">
                    <p className="font-semibold mb-1">Critical Security Warning</p>
                    <ul className="text-red-300/80 space-y-1 text-xs">
                      <li>• You will be shown a 12-word recovery phrase</li>
                      <li>• This is the ONLY way to recover your wallet</li>
                      <li>• If you lose it, your funds are gone FOREVER</li>
                      <li>• We cannot help you recover lost phrases</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ackNoRecover}
                  onChange={(e) => setAckNoRecover(e.target.checked)}
                  className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                  I understand that if I lose my recovery phrase, my funds cannot be recovered by anyone
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ackNeverShare}
                  onChange={(e) => setAckNeverShare(e.target.checked)}
                  className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                  I will never share my recovery phrase with anyone, including Gambino Gold support
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!ackNoRecover || !ackNeverShare || !seedPhrase}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all"
              >
                {!seedPhrase ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    Generating...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Show Seed Phrase */}
        {step === 2 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Your Recovery Phrase</h2>
                <p className="text-sm text-red-400">Write this down and store it safely!</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-300 text-sm mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">DO NOT take a screenshot!</span>
              </div>
              <p className="text-red-200/80 text-xs">
                Screenshots can be accessed by malicious apps. Write it down on paper or use a password manager.
              </p>
            </div>

            {/* Seed Phrase Grid */}
            <div className="bg-neutral-800 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-neutral-900 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-neutral-500 w-4">{index + 1}.</span>
                    <span className="text-white font-mono text-sm">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={handleCopySeedPhrase}
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
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadSeedPhrase}
                className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Backup
              </button>
            </div>

            {/* Public Key Display */}
            <div className="mb-6">
              <p className="text-xs text-neutral-400 mb-2">Your Wallet Address (Public Key)</p>
              <div className="bg-neutral-800 rounded-lg p-3 font-mono text-xs text-yellow-400 break-all">
                {publicKey}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mb-6">
              <input
                type="checkbox"
                checked={ackSavedSecurely}
                onChange={(e) => setAckSavedSecurely(e.target.checked)}
                className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50"
              />
              <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                I have saved my recovery phrase securely and understand I will need it to recover my wallet
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!ackSavedSecurely}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all"
              >
                Verify Phrase
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Seed Phrase */}
        {step === 3 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Verify Your Phrase</h2>
                <p className="text-sm text-neutral-400">Confirm you saved it correctly</p>
              </div>
            </div>

            <p className="text-neutral-300 text-sm mb-6">
              Enter the following words from your recovery phrase to verify you saved it correctly:
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {confirmError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm">{confirmError}</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {wordIndices.map((idx) => (
                <div key={idx}>
                  <label className="text-sm text-neutral-400 mb-2 block">
                    Word #{idx + 1}
                  </label>
                  <input
                    type="text"
                    value={confirmWords[idx] || ''}
                    onChange={(e) => setConfirmWords(prev => ({ ...prev, [idx]: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                    placeholder={`Enter word #${idx + 1}`}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmWords({});
                  setConfirmError('');
                  setStep(2);
                }}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerifyWords}
                disabled={wordIndices.some(idx => !confirmWords[idx]?.trim())}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all"
              >
                Verify & Create Wallet
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Saving */}
        {step === 4 && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
              {saving ? (
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {saving ? 'Creating Your Wallet...' : 'Wallet Created!'}
            </h2>
            <p className="text-neutral-400 text-sm">
              {saving
                ? 'Securely linking your wallet to your account...'
                : 'Your wallet is ready to use!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
