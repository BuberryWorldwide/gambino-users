'use client';

import { useState, useEffect } from 'react';
import { useReferral, getTierRewards, getReferralUrl } from '@/lib/useReferral';
import { referralAPI } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

function StatCard({ label, value, sub, highlight = false, icon }) {
  return (
    <div className={`bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 ${highlight ? 'ring-1 ring-yellow-500/30' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-yellow-400">{icon}</span>}
        <span className="text-xs text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function ReferralTab({
  profile,
  setProfile,
  setError,
  setSuccess
}) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Get referral data using custom hook
  const { stats, history, loading, refresh } = useReferral(profile?.referralCode);

  // Regenerate referral code
  const handleRegenerate = async () => {
    setRegenerating(true);
    setError?.('');

    try {
      const result = await referralAPI.regenerate();
      if (result.success) {
        // Update the profile with new code
        if (setProfile) {
          setProfile(prev => ({ ...prev, referralCode: result.code }));
        }
        setSuccess?.(`Referral code updated to ${result.code}`);
        setShowRegenerateConfirm(false);
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to regenerate code';
      setError?.(message);
    } finally {
      setRegenerating(false);
    }
  };

  // Generate referral URL
  const referralUrl = getReferralUrl(profile?.referralCode, 'link');
  const qrUrl = getReferralUrl(profile?.referralCode, 'qr');

  // Get tier-based rewards
  const rewards = getTierRewards(profile?.tier);

  // Copy referral link to clipboard
  const handleCopyLink = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setSuccess?.('Referral link copied!');
      setTimeout(() => {
        setCopied(false);
        setSuccess?.('');
      }, 3000);

      // Track share event
      referralAPI.trackShare('copy').catch(() => {});
    } catch (err) {
      setError?.('Failed to copy link');
    }
  };

  // Share via native share API or fallback
  const handleShare = async (platform) => {
    const shareText = `Join Gambino Gold and start mining! Use my referral code: ${profile?.referralCode}`;

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Gambino Gold',
          text: shareText,
          url: referralUrl
        });
        referralAPI.trackShare('native').catch(() => {});
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`;
      window.open(twitterUrl, '_blank');
      referralAPI.trackShare('twitter').catch(() => {});
    } else if (platform === 'telegram') {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(telegramUrl, '_blank');
      referralAPI.trackShare('telegram').catch(() => {});
    }

    setShowShareOptions(false);
  };

  // Tier badge color
  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'silver': return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 'bronze': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-neutral-700/50 text-neutral-400 border-neutral-600/30';
    }
  };

  // If no referral code yet
  if (!profile?.referralCode) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">Referral Code Pending</h3>
        <p className="text-neutral-400 max-w-md mx-auto">
          Your referral code will be generated once your account is fully verified.
          Complete your profile and first mining session to unlock referrals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code & QR Section */}
      <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Your Referral Code
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm border ${getTierColor(profile?.tier)}`}>
            {(profile?.tier || 'none').toUpperCase()} Tier
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG
                value={qrUrl || ''}
                size={160}
                level="M"
                fgColor="#171717"
                bgColor="#ffffff"
              />
            </div>
            <p className="mt-4 font-mono text-2xl text-yellow-400 tracking-widest font-bold">
              {profile?.referralCode}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-neutral-500 text-xs">Scan or share this code</p>
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="text-xs text-neutral-500 hover:text-yellow-400 transition-colors underline"
              >
                regenerate
              </button>
            </div>
          </div>

          {/* Share Actions */}
          <div className="flex flex-col justify-center space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Referral Link
                </>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share & Invite Friends
              </button>

              {/* Share dropdown */}
              {showShareOptions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden z-10">
                  {navigator.share && (
                    <button
                      onClick={() => handleShare('native')}
                      className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Share via Device
                    </button>
                  )}
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Share on Telegram
                  </button>
                </div>
              )}
            </div>

            <p className="text-neutral-500 text-xs text-center mt-2">
              Friends who sign up get {rewards.newUser} GG welcome bonus
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Referral Rewards ({profile?.tier?.toUpperCase() || 'NONE'} Tier)
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase mb-1">You Receive</p>
            <p className="text-2xl font-bold text-yellow-400">{rewards.referrer}</p>
            <p className="text-xs text-neutral-500">GG tokens</p>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase mb-1">Friend Gets</p>
            <p className="text-2xl font-bold text-green-400">{rewards.newUser}</p>
            <p className="text-xs text-neutral-500">GG tokens</p>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg">
            <p className="text-xs text-neutral-500 uppercase mb-1">Venue Gets</p>
            <p className="text-2xl font-bold text-blue-400">{rewards.venue}</p>
            <p className="text-xs text-neutral-500">GG tokens</p>
          </div>
        </div>
        <p className="text-neutral-500 text-xs text-center mt-4">
          Rewards distributed after your friend completes their first mining session
        </p>
      </div>

      {/* Stats Section */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Your Referral Stats
          </h3>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs text-gold hover:text-yellow-300 disabled:text-neutral-500 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <><LoadingSpinner /> Loading...</>
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

        {loading && !stats ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-neutral-400">Loading stats...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Referrals"
              value={stats?.totalReferrals || 0}
              highlight={stats?.totalReferrals > 0}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <StatCard
              label="Pending"
              value={stats?.pendingReferrals || 0}
              sub="Awaiting first session"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Verified"
              value={stats?.verifiedReferrals || 0}
              sub="Rewards distributed"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Total Earned"
              value={`${(stats?.totalRewards || 0).toLocaleString()} GG`}
              highlight={stats?.totalRewards > 0}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        )}
      </div>

      {/* Referral History */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Referral History
        </h3>

        {loading && history.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-neutral-400">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-neutral-400">No referrals yet</p>
            <p className="text-neutral-500 text-sm mt-1">Share your code to start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((referral, index) => (
              <div
                key={referral.id || index}
                className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    referral.status === 'distributed' ? 'bg-green-500/20' :
                    referral.status === 'pending' ? 'bg-yellow-500/20' :
                    referral.status === 'pending_budget' ? 'bg-blue-500/20' :
                    'bg-neutral-700'
                  }`}>
                    <span className={`text-lg font-semibold ${
                      referral.status === 'distributed' ? 'text-green-400' :
                      referral.status === 'pending' ? 'text-yellow-400' :
                      referral.status === 'pending_budget' ? 'text-blue-400' :
                      'text-neutral-400'
                    }`}>
                      {referral.newUserName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{referral.newUserName || 'Anonymous'}</p>
                    <p className="text-xs text-neutral-500">
                      {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    referral.status === 'distributed' ? 'bg-green-500/20 text-green-400' :
                    referral.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    referral.status === 'pending_budget' ? 'bg-blue-500/20 text-blue-400' :
                    referral.status === 'clawed_back' ? 'bg-red-500/20 text-red-400' :
                    'bg-neutral-700 text-neutral-400'
                  }`}>
                    {referral.status === 'distributed' ? 'Completed' :
                     referral.status === 'pending' ? 'Pending' :
                     referral.status === 'pending_budget' ? 'Queued' :
                     referral.status === 'clawed_back' ? 'Expired' :
                     referral.status}
                  </span>
                  {referral.rewardAmount > 0 && (
                    <p className="text-yellow-400 text-sm mt-1">+{referral.rewardAmount} GG</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <p className="text-blue-300 font-medium">How Referrals Work</p>
            <ul className="text-blue-300/70 mt-1 space-y-1">
              <li>1. Share your code or QR with friends</li>
              <li>2. They sign up using your referral link</li>
              <li>3. Once they complete their first mining session, you both receive tokens</li>
              <li>4. Higher tiers earn more per referral</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-3">Regenerate Referral Code?</h3>
            <p className="text-neutral-400 text-sm mb-4">
              This will create a new referral code. Your old code <span className="font-mono text-yellow-400">{profile?.referralCode}</span> will stop working immediately.
            </p>
            <p className="text-neutral-500 text-xs mb-6">
              Note: You can only regenerate your code once per week.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                disabled={regenerating}
                className="flex-1 py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {regenerating ? (
                  <>
                    <LoadingSpinner />
                    Regenerating...
                  </>
                ) : (
                  'Regenerate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
