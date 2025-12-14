'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ArrowLeft, Trophy, Users, Coins } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/leaderboard');
      setLeaderboardData(data.leaderboard || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-white';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-black';
    if (rank === 2) return 'bg-gray-300 text-black';
    if (rank === 3) return 'bg-orange-400 text-black';
    return null;
  };

  return (
    <div className="min-h-screen relative p-4 md:p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-neutral-400">Top GAMBINO token holders</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-neutral-400">Total Users</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.totalPlayers)}
              </div>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-sm text-neutral-400">Total GAMBINO</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.totalCirculating)}
              </div>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm text-neutral-400">Top 10 Share</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.top10SharePct}%
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-neutral-400">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-400">No data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800/50 border-b border-neutral-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-neutral-400">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-400">User</th>
                    <th className="text-right py-3 px-4 font-medium text-neutral-400">GAMBINO Balance</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-400">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {leaderboardData.map((player, index) => (
                    <tr key={index} className="hover:bg-neutral-800/30">
                      <td className="py-3 px-4">
                        {getRankBadge(player.rank || index + 1) ? (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankBadge(player.rank || index + 1)}`}>
                            {player.rank || index + 1}
                          </span>
                        ) : (
                          <span className={`font-bold ${getRankColor(player.rank || index + 1)}`}>
                            #{player.rank || index + 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          {player.wallet && (
                            <div className="text-xs text-neutral-500 font-mono">
                              {player.wallet.slice(0, 4)}...{player.wallet.slice(-4)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-yellow-400">
                          {formatNumber(player.balance)} GAMB
                        </div>
                        {player.onChainBalance !== null && player.onChainBalance !== undefined && (
                          <div className="text-xs text-neutral-500">
                            On-chain: {formatNumber(player.onChainBalance)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {player.verified === true && <span className="text-green-400">✓</span>}
                        {player.verified === false && <span className="text-red-400">✗</span>}
                        {player.verified === null && <span className="text-neutral-500">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          Rankings based on GAMBINO token holdings
        </div>
      </div>
    </div>
  );
}
