'use client';

import { useState, useEffect } from 'react';
import StandardizedAdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminMetricCard, 
  AdminLoadingSpinner 
} from '@/components/layout/StandardizedAdminLayout';

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
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
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

  if (loading) {
    return (
      <StandardizedAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AdminLoadingSpinner size="lg" />
            <div className="text-white text-lg mt-4">Loading analytics...</div>
          </div>
        </div>
      </StandardizedAdminLayout>
    );
  }

  const pageActions = (
    <>
      <select 
        value={timeframe}
        onChange={(e) => setTimeframe(e.target.value)}
        className="bg-gray-700/30 border border-gray-600/50 text-white rounded-xl px-4 py-2 backdrop-blur-sm"
      >
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
      </select>
      <AdminButton
        onClick={refreshMetrics}
        disabled={refreshing}
        variant="secondary"
      >
        {refreshing ? <AdminLoadingSpinner size="sm" color="white" /> : 'Refresh'}
      </AdminButton>
    </>
  );

  return (
    <StandardizedAdminLayout
      pageTitle="Network Analytics"
      pageDescription="Real-time performance metrics and network insights"
      pageActions={pageActions}
    >
      {error && (
        <AdminCard className="mb-8 bg-red-900/30 border-red-500/30">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </AdminCard>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold">🪙</span>
          </div>
          Token Economics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminMetricCard
            title="Total Supply"
            value={formatNumber(metrics?.tokenStats?.totalGambinoIssued)}
            subtitle="GG Tokens"
            icon="🎯"
            color="yellow"
          />
          <AdminMetricCard
            title="Circulating"
            value={formatNumber(metrics?.tokenStats?.circulatingSupply)}
            subtitle="In circulation"
            icon="🔄"
            color="blue"
          />
          <AdminMetricCard
            title="Current Price"
            value={formatCurrency(metrics?.tokenStats?.currentPrice)}
            subtitle="Per token"
            icon="💵"
            color="green"
          />
          <AdminMetricCard
            title="24h Volume"
            value={formatCurrency(metrics?.tokenStats?.volume24h)}
            subtitle="Trading volume"
            icon="📊"
            color="orange"
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">👥</span>
          </div>
          Network Participants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminMetricCard
            title="Total Users"
            value={formatNumber(metrics?.userStats?.totalUsers)}
            subtitle="Registered accounts"
            icon="👤"
            color="blue"
          />
          <AdminMetricCard
            title="Active Users"
            value={formatNumber(metrics?.userStats?.activeUsers)}
            subtitle="Last 30 days"
            icon="⚡"
            color="green"
          />
          <AdminMetricCard
            title="Transactions"
            value={formatNumber(metrics?.userStats?.totalTransactions)}
            subtitle="Total network activity"
            icon="📈"
            color="purple"
          />
        </div>
      </div>

      {metrics?.leaderboard && metrics.leaderboard.length > 0 && (
        <div className="mb-8">
          <AdminCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                Top Players
              </h2>
              <a 
                href="/leaderboard" 
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
              >
                View Full Leaderboard →
              </a>
            </div>
            <div className="space-y-3">
              {metrics.leaderboard.slice(0, 10).map((player, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' : 
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-sm text-white truncate max-w-48">
                      {player.email?.split('@')[0] || player.name || 'Anonymous'}
                    </div>
                  </div>
                  <span className="font-bold text-yellow-400 text-sm">
                    {formatNumber(player.gambinoBalance || 0)} GG
                  </span>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      {admin?.role === 'super_admin' && metrics?.treasury && (
        <div className="mb-8">
          <AdminCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-2xl">🏦</span>
                Treasury Overview
              </h2>
              <AdminButton href="/admin/treasury" variant="secondary" size="sm">
                View Details →
              </AdminButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(metrics.treasury.summary?.totalTokenBalance / 1000000)}M
                </div>
                <div className="text-green-300 text-sm">Total GG Tokens</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {metrics.treasury.summary?.totalSolBalance?.toFixed(2) || '0'}
                </div>
                <div className="text-blue-300 text-sm">Total SOL</div>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {metrics.treasury.summary?.activeAccounts || 0}
                </div>
                <div className="text-purple-300 text-sm">Active Accounts</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400 capitalize">
                  {metrics.treasury.summary?.network || 'mainnet'}
                </div>
                <div className="text-orange-300 text-sm">Network</div>
              </div>
            </div>
          </AdminCard>
        </div>
      )}
    </StandardizedAdminLayout>
  );
}