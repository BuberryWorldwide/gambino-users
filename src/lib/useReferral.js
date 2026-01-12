'use client';

import { useState, useEffect, useCallback } from 'react';
import { referralAPI } from './api';

/**
 * Custom hook for managing referral data
 * @param {string} referralCode - User's referral code
 * @returns {Object} Referral data and utilities
 */
export function useReferral(referralCode) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!referralCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch stats and history in parallel
      const [statsRes, historyRes] = await Promise.all([
        referralAPI.getStats().catch(err => {
          console.warn('Failed to fetch referral stats:', err);
          return null;
        }),
        referralAPI.getHistory().catch(err => {
          console.warn('Failed to fetch referral history:', err);
          return { referrals: [] };
        })
      ]);

      if (statsRes) {
        setStats(statsRes);
      }
      setHistory(historyRes?.referrals || []);
    } catch (err) {
      console.error('Referral data fetch error:', err);
      setError(err.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, [referralCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    history,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Get tier-based rewards configuration
 * @param {string} tier - User tier (gold, silver, bronze, none)
 * @returns {Object} Reward amounts for referrer, newUser, venue
 */
export function getTierRewards(tier) {
  const tiers = {
    'gold': { referrer: 350, newUser: 100, venue: 50, total: 500 },
    'silver': { referrer: 300, newUser: 100, venue: 50, total: 450 },
    'bronze': { referrer: 250, newUser: 100, venue: 50, total: 400 },
    'none': { referrer: 150, newUser: 100, venue: 50, total: 300 }
  };
  return tiers[tier?.toLowerCase()] || tiers.none;
}

/**
 * Generate referral URL with optional tracking source
 * @param {string} code - Referral code
 * @param {string} source - Optional tracking source (qr, link, social)
 * @returns {string} Full referral URL
 */
export function getReferralUrl(code, source = null) {
  if (!code) return null;
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register`
    : 'https://gambino.gold/register';

  const params = new URLSearchParams({ ref: code });
  if (source) {
    params.append('src', source);
  }

  return `${baseUrl}?${params.toString()}`;
}

export default useReferral;
