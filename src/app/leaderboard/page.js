'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('balance'); // 'balance', 'jackpots', 'recent'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      
      let endpoint = '/api/leaderboard';
      if (activeTab === 'jackpots') endpoint = '/api/leaderboard/jackpots';
      if (activeTab === 'recent') endpoint = '/api/leaderboard/recent-winners';
      
      const { data } = await api.get(endpoint);
      setLeaderboardData(data.leaderboard || data.winners || []);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400'; // Gold
    if (rank === 2) return 'text-gray-300';   // Silver
    if (rank === 3) return 'text-orange-400'; // Bronze
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
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-neutral-400">Top network participants and recent activity</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">
                {activeTab === 'balance' ? 'Total Players' : 
                 activeTab === 'jackpots' ? 'Total Winners' : 'Recent Wins'}
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.totalPlayers || stats.totalWinners || stats.totalWins)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">
                {activeTab === 'balance' ? 'Total GAMBINO' : 
                 activeTab === 'jackpots' ? 'Total Jackpots' : 'Total Payout'}
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.totalCirculating || stats.totalJackpots || stats.totalPayout)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">
                {activeTab === 'balance' ? 'Top 10 Share' : 
                 activeTab === 'jackpots' ? 'Major Jackpots' : 'Major Wins'}
              </div>
              <div className="text-2xl font-bold text-white">
                {activeTab === 'balance' ? `${stats.top10SharePct}%` :
                 formatNumber(stats.totalMajorJackpots || stats.majorWins)}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-800 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'balance'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            By Balance
          </button>
          <button
            onClick={() => setActiveTab('jackpots')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'jackpots'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            By Jackpots
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-yellow-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Recent Winners
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Player</th>
                    {activeTab === 'balance' && (
                      <>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">GAMBINO Balance</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-300">Verified</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">Jackpots Won</th>
                      </>
                    )}
                    {activeTab === 'jackpots' && (
                      <>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">Total Jackpots</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">Major</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">Minor</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">Current Balance</th>
                      </>
                    )}
                    {activeTab === 'recent' && (
                      <>
                        <th className="text-right py-3 px-4 font-medium text-gray-300">Amount Won</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-300">Type</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-300">When</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-300">Machine</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leaderboardData.map((player, index) => (
                    <tr key={index} className="hover:bg-gray-750">
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
                          <div className="text-sm text-gray-400">{player.email}</div>
                          {player.wallet && (
                            <div className="text-xs text-gray-500 font-mono">{player.wallet}</div>
                          )}
                        </div>
                      </td>

                      {/* Balance Tab Columns */}
                      {activeTab === 'balance' && (
                        <>
                          <td className="py-3 px-4 text-right">
                            <div className="font-bold text-yellow-400">
                              {formatNumber(player.balance)} GAMB
                            </div>
                            {player.onChainBalance !== null && (
                              <div className="text-xs text-gray-500">
                                On-chain: {formatNumber(player.onChainBalance)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {player.verified === true && <span className="text-green-400">✓</span>}
                            {player.verified === false && <span className="text-red-400">✗</span>}
                            {player.verified === null && <span className="text-gray-500">-</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="text-white">{player.totalJackpots || 0}</div>
                            <div className="text-xs text-gray-400">
                              {player.majorJackpots || 0}M / {player.minorJackpots || 0}m
                            </div>
                          </td>
                        </>
                      )}

                      {/* Jackpots Tab Columns */}
                      {activeTab === 'jackpots' && (
                        <>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            {player.totalJackpots}
                          </td>
                          <td className="py-3 px-4 text-right text-yellow-400">
                            {player.majorJackpots}
                          </td>
                          <td className="py-3 px-4 text-right text-blue-400">
                            {player.minorJackpots}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            {formatNumber(player.currentBalance)} GAMB
                          </td>
                        </>
                      )}

                      {/* Recent Winners Tab Columns */}
                      {activeTab === 'recent' && (
                        <>
                          <td className="py-3 px-4 text-right font-bold text-yellow-400">
                            {formatNumber(player.amount)} GAMB
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              player.jackpotType === 'Major' 
                                ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-blue-900/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {player.jackpotType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {formatDate(player.wonAt)}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-400 font-mono text-xs">
                            {player.machineId}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {activeTab === 'balance' && 'Rankings based on GAMBINO token holdings'}
          {activeTab === 'jackpots' && 'Rankings based on total jackpot wins'}
          {activeTab === 'recent' && 'Most recent jackpot winners (last 7 days)'}
        </div>
      </div>
    </div>
  );
}