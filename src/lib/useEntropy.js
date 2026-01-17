/**
 * useEntropy - Hook to fetch entropy stats from Arca Router
 *
 * Fetches the user's entropy contribution stats by wallet address.
 * The wallet address serves as the supplier_id in the Arca system.
 */

import { useState, useEffect, useCallback } from 'react';

// Use same API URL as api.js for consistency (trim to remove any trailing newlines)
const ARCA_API_URL = (process.env.NEXT_PUBLIC_ARCA_API_URL || 'https://api.arca-protocol.com').trim();

/**
 * Fetch entropy stats for a wallet address
 * @param {string} walletAddress - The Solana wallet address (used as supplier_id)
 * @returns {Object} stats, recentPackets, loading, error, refresh
 */
export function useEntropy(walletAddress) {
  const [stats, setStats] = useState(null);
  const [recentPackets, setRecentPackets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!walletAddress) {
      setStats(null);
      setRecentPackets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch aggregate stats
      const statsRes = await fetch(`${ARCA_API_URL}/v1/stats/supplier/${walletAddress}`);

      if (statsRes.status === 404) {
        // No entropy yet - that's ok
        setStats({
          supplierId: walletAddress,
          totalPackets: 0,
          totalBitsClaimed: 0,
          totalBitsVerified: 0,
          avgQuality: 0,
          firstPacketAt: null,
          lastPacketAt: null,
          anchoredPackets: 0
        });
        setRecentPackets([]);
        setLoading(false);
        return;
      }

      if (!statsRes.ok) {
        throw new Error(`Failed to fetch stats: ${statsRes.status}`);
      }

      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch recent packets
      const recentRes = await fetch(`${ARCA_API_URL}/v1/stats/supplier/${walletAddress}/recent?limit=5`);

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentPackets(recentData.packets || []);
      }

    } catch (err) {
      console.error('Failed to fetch entropy stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    recentPackets,
    loading,
    error,
    refresh: fetchStats
  };
}

/**
 * Fetch global leaderboard
 * @param {number} limit - Number of top contributors to fetch
 * @returns {Object} leaderboard, loading, error, refresh
 */
export function useEntropyLeaderboard(limit = 10) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${ARCA_API_URL}/v1/stats/leaderboard?limit=${limit}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch leaderboard: ${res.status}`);
      }

      const data = await res.json();
      setLeaderboard(data.leaderboard || []);

    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refresh: fetchLeaderboard
  };
}

/**
 * Fetch global pool statistics
 * @returns {Object} pool, recentDraws, loading, error, refresh
 */
export function useEntropyPool() {
  const [pool, setPool] = useState(null);
  const [recentDraws, setRecentDraws] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPool = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch pool stats
      const poolRes = await fetch(`${ARCA_API_URL}/v1/entropy/pool`);

      if (!poolRes.ok) {
        throw new Error(`Failed to fetch pool stats: ${poolRes.status}`);
      }

      const poolData = await poolRes.json();
      setPool(poolData.pool);

      // Fetch recent draws
      const drawsRes = await fetch(`${ARCA_API_URL}/v1/entropy/draws?limit=5`);

      if (drawsRes.ok) {
        const drawsData = await drawsRes.json();
        setRecentDraws(drawsData.draws || []);
      }

    } catch (err) {
      console.error('Failed to fetch pool stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  return {
    pool,
    recentDraws,
    loading,
    error,
    refresh: fetchPool
  };
}

export default useEntropy;
