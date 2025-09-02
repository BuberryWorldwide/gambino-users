'use client'

import { useState, useEffect } from 'react';

export default function AdminMetricsPage() {
  const [admin, setAdmin] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      window.location.href = '/admin';
      return;
    }
    
    setAdmin(JSON.parse(adminData));
    loadMetrics();
  }, [timeframe]);

  const loadMetrics = async () => {
    try {
      setError('');
      setLoading(true);
      
      const adminToken = localStorage.getItem('adminToken');
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.1.235:3001';
      
      // Fetch comprehensive metrics data
      const [statsRes, usersRes, transactionsRes, leaderboardRes, treasuryRes] = await Promise.all([
        fetch(`${apiUrl}/api/price/current`).catch(() => ({ json: () => ({}) })),
        fetch(`${apiUrl}/api/admin/stats`, { 
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'admin-key': 'admin123' 
          } 
        }).catch(() => ({ json: () => ({}) })),
        fetch(`${apiUrl}/api/admin/metrics?timeframe=${timeframe}`, {
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'admin-key': 'admin123' 
          }
        }).catch(() => ({ json: () => ({}) })),
        fetch(`${apiUrl}/api/leaderboard`).catch(() => ({ json: () => ({}) })),
        fetch(`${apiUrl}/api/blockchain-treasury/balances`, {
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'x-admin-key': 'your-admin-api-key-change-this' 
          }
        }).catch(() => ({ json: () => ({}) }))
      ]);

      const [stats, users, transactions, leaderboard, treasury] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        transactionsRes.json(),
        leaderboardRes.json(),
        treasuryRes.json()
      ]);

      setMetrics({
        tokenStats: stats.stats || {
          totalGambinoIssued: 125000000,
          circulatingSupply: 125000000,
          currentPrice: 0.001,
          volume24h: 12500,
          jackpotsHitToday: 145
        },
        userStats: users.stats || {
          totalUsers: 2847,
          activeUsers: 412,
          totalTransactions: 15623
        },
        transactionData: transactions.data || {},
        leaderboard: leaderboard.leaderboard || [],
        treasury: treasury.data || null
      });

    } catch (error) {
      setError('Failed to load metrics data');
      console.error('Metrics error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    await loadMetrics();
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num || 0);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          Loading Metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-yellow-500">🎲 Gambino Admin</h1>
              <nav className="flex space-x-4">
                <a href="/admin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/admin/settings" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Settings
                </a>
                <span className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Metrics
                </span>
                {admin?.role === 'super_admin' && (
                  <>
                    <a href="/admin/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Users
                    </a>
                    <a href="/admin/treasury" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Treasury
                    </a>
                  </>
                )}
                {(admin?.role === 'store_owner' || admin?.role === 'store_manager') && (
                  <>
                    <a href="/admin/store/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Store Users
                    </a>
                    <a href="/admin/store/machines" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Machines
                    </a>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {admin?.firstName || admin?.name} ({admin?.role?.replace('_', ' ')})
              </span>
              <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">📊 System Metrics</h2>
            <p className="text-gray-400 mt-2">Real-time analytics and performance data</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            
            <button
              onClick={refreshMetrics}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold disabled:opacity-50 transition-colors"
            >
              <span className={`mr-2 ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">👥</div>
              <span className="text-sm text-blue-300 uppercase tracking-wide">Users</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatNumber(metrics?.userStats?.totalUsers)}
            </div>
            <div className="text-blue-200 text-sm mt-1">
              {formatNumber(metrics?.userStats?.activeUsers)} active
            </div>
          </div>

          {/* Total GAMBINO */}
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">🪙</div>
              <span className="text-sm text-yellow-300 uppercase tracking-wide">Supply</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatNumber(metrics?.tokenStats?.totalGambinoIssued)}
            </div>
            <div className="text-yellow-200 text-sm mt-1">
              GAMBINO issued
            </div>
          </div>

          {/* Market Value */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">💰</div>
              <span className="text-sm text-green-300 uppercase tracking-wide">Value</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency((metrics?.tokenStats?.totalGambinoIssued || 0) * (metrics?.tokenStats?.currentPrice || 0.001))}
            </div>
            <div className="text-green-200 text-sm mt-1">
              @ ${metrics?.tokenStats?.currentPrice || '0.001'}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">⚡</div>
              <span className="text-sm text-purple-300 uppercase tracking-wide">Activity</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatNumber(metrics?.userStats?.totalTransactions)}
            </div>
            <div className="text-purple-200 text-sm mt-1">
              Total transactions
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Token Economics */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="mr-2">🎯</span>
              Token Economics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Current Price</span>
                <span className="font-bold text-green-400">
                  ${metrics?.tokenStats?.currentPrice || '0.001'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Circulating Supply</span>
                <span className="font-bold text-white">
                  {formatNumber(metrics?.tokenStats?.circulatingSupply)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Total Supply Cap</span>
                <span className="font-bold text-white">
                  777M GAMBINO
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Supply Issued</span>
                <span className="font-bold text-yellow-400">
                  {((metrics?.tokenStats?.totalGambinoIssued || 0) / 777000000 * 100).toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">24h Volume</span>
                <span className="font-bold text-white">
                  {formatCurrency(metrics?.tokenStats?.volume24h || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Jackpots Hit Today</span>
                <span className="font-bold text-red-400">
                  {formatNumber(metrics?.tokenStats?.jackpotsHitToday || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* User Analytics */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="mr-2">👤</span>
              User Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Total Registered</span>
                <span className="font-bold text-blue-400">
                  {formatNumber(metrics?.userStats?.totalUsers)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Active Users (7d)</span>
                <span className="font-bold text-white">
                  {formatNumber(metrics?.userStats?.activeUsers)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">User Retention Rate</span>
                <span className="font-bold text-green-400">
                  {((metrics?.userStats?.activeUsers || 0) / (metrics?.userStats?.totalUsers || 1) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Avg. Tokens per User</span>
                <span className="font-bold text-white">
                  {formatNumber((metrics?.tokenStats?.totalGambinoIssued || 0) / (metrics?.userStats?.totalUsers || 1))}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Premium Members</span>
                <span className="font-bold text-purple-400">
                  {metrics?.leaderboard?.filter(p => p.tier === 'tier1' || p.tier === 'tier2').length || 0}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Volume per Active User</span>
                <span className="font-bold text-white">
                  {formatCurrency((metrics?.tokenStats?.volume24h || 0) / (metrics?.userStats?.activeUsers || 1))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        {metrics?.leaderboard?.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="mr-2">📈</span>
              Top Performers
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Highest Glück Score */}
              <div>
                <h4 className="font-semibold text-purple-400 mb-4">Highest Glück Score</h4>
                <div className="space-y-2">
                  {metrics.leaderboard.slice(0, 5).map((player, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-sm text-white truncate max-w-32">
                          {player.email?.split('@')[0] || 'Anonymous'}
                        </div>
                      </div>
                      <span className="font-bold text-purple-400">{player.gluckScore}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Active */}
              <div>
                <h4 className="font-semibold text-blue-400 mb-4">Most Active Players</h4>
                <div className="space-y-2">
                  {metrics.leaderboard
                    .sort((a, b) => (b.uniqueMachines || 0) - (a.uniqueMachines || 0))
                    .slice(0, 5)
                    .map((player, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-sm text-white truncate max-w-32">
                          {player.email?.split('@')[0] || 'Anonymous'}
                        </div>
                      </div>
                      <span className="font-bold text-blue-400">{player.uniqueMachines || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Earners */}
              <div>
                <h4 className="font-semibold text-yellow-400 mb-4">Top Balance Holders</h4>
                <div className="space-y-2">
                  {metrics.leaderboard
                    .sort((a, b) => (b.gambinoBalance || 0) - (a.gambinoBalance || 0))
                    .slice(0, 5)
                    .map((player, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-sm text-white truncate max-w-24">
                          {player.email?.split('@')[0] || 'Anonymous'}
                        </div>
                      </div>
                      <span className="font-bold text-yellow-400 text-xs">
                        {formatNumber(player.gambinoBalance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Treasury Integration (for super admin) */}
        {admin?.role === 'super_admin' && metrics?.treasury && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="mr-2">🏦</span>
              Treasury Overview
              <a href="/admin/treasury" className="ml-auto text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                View Details
              </a>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(metrics.treasury.summary?.totalTokenBalance / 1000000)}M
                </div>
                <div className="text-green-300 text-sm">Total GAMBINO</div>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {metrics.treasury.summary?.totalSolBalance?.toFixed(2) || '0.00'}
                </div>
                <div className="text-blue-300 text-sm">Total SOL</div>
              </div>
              
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {metrics.treasury.summary?.healthyAccounts || 0}
                </div>
                <div className="text-purple-300 text-sm">Active Accounts</div>
              </div>
              
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400">
                  {metrics.treasury.summary?.network?.toUpperCase() || 'SOLANA'}
                </div>
                <div className="text-orange-300 text-sm">Network</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Performance Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {((metrics?.userStats?.activeUsers || 0) / (metrics?.userStats?.totalUsers || 1) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">User Retention</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {((metrics?.tokenStats?.totalGambinoIssued || 0) / 777000000 * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Supply Issued</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {formatNumber((metrics?.tokenStats?.totalGambinoIssued || 0) / (metrics?.userStats?.totalUsers || 1))}
              </div>
              <div className="text-sm text-gray-400">Tokens/User</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(metrics?.userStats?.totalTransactions || 0)}
              </div>
              <div className="text-sm text-gray-400">Total Transactions</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {formatNumber(metrics?.tokenStats?.jackpotsHitToday || 0)}
              </div>
              <div className="text-sm text-gray-400">Jackpots Hit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}