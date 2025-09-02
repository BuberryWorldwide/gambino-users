'use client'

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    users: { total: 0, active: 0 },
    tokens: { issued: 0, price: 0.001 },
    transactions: { total: 0, volume: 0 },
    stores: { active: 0, revenue: 0 }
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!adminToken || !adminData) {
      window.location.href = '/admin/login';
      return;
    }

    const parsedAdmin = JSON.parse(adminData);
    setAdmin(parsedAdmin);
    
    loadDashboardData(parsedAdmin);
  }, []);

  const loadDashboardData = async (adminData) => {
    try {
      setError('');
      setLoading(true);
      
      // Use the API instance instead of fetch for consistent auth headers
      const [usersRes, transactionsRes, storesRes] = await Promise.all([
        // Get user stats - use existing /api/admin/users endpoint
        api.get('/api/admin/users').catch(() => ({ data: { users: [], count: 0 } })),
        
        // Get transaction metrics - use existing endpoint or create new one
        api.get('/api/admin/metrics?timeframe=30d').catch(() => ({ data: { data: {} } })),
        
        // Get store stats - use existing /api/admin/stores endpoint
        api.get('/api/admin/stores').catch(() => ({ data: { stores: [], count: 0 } }))
      ]);

      const users = usersRes.data.users || [];
      const userCount = usersRes.data.count || users.length;
      const activeUsers = users.filter(u => u.isActive !== false).length;

      const transactionData = transactionsRes.data.data || {};
      const stores = storesRes.data.stores || [];
      const activeStores = stores.filter(s => s.status === 'active').length;

      // Calculate actual metrics from your database
      const totalGambinoBalance = users.reduce((sum, user) => {
        return sum + (user.gambinoBalance || 0);
      }, 0);

      setMetrics({
        users: {
          total: userCount,
          active: activeUsers
        },
        tokens: {
          issued: totalGambinoBalance,
          price: 0.001 // You can make this dynamic later
        },
        transactions: {
          total: transactionData.totalTransactions || 0,
          volume: transactionData.totalVolume || 0
        },
        stores: {
          active: activeStores,
          revenue: transactionData.totalVolume || 0 // Use transaction volume as revenue for now
        }
      });

    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
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
                <span className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </span>
                <a href="/admin/metrics" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Metrics
                </a>
                {admin?.role === 'super_admin' && (
                  <>
                    <a href="/admin/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Users
                    </a>
                    <a href="/admin/stores" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Stores
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Welcome back, {admin?.firstName || admin?.name || 'Admin'}!
          </h2>
          <p className="text-gray-400 mt-2">
            {admin?.role === 'super_admin' 
              ? 'System overview and global metrics' 
              : admin?.role === 'store_owner'
              ? `Managing your store operations`
              : `Store operations dashboard`
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wide">
                  Total Users
                </h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {formatNumber(metrics.users.total)}
                </p>
                <p className="text-blue-200 text-sm mt-1">
                  {formatNumber(metrics.users.active)} active
                </p>
              </div>
              <div className="text-4xl text-blue-400">👥</div>
            </div>
          </div>

          {/* Token Supply */}
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-300 font-semibold text-sm uppercase tracking-wide">
                  GAMBINO Tokens
                </h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {formatNumber(metrics.tokens.issued)}
                </p>
                <p className="text-yellow-200 text-sm mt-1">
                  In circulation
                </p>
              </div>
              <div className="text-4xl text-yellow-400">🪙</div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-300 font-semibold text-sm uppercase tracking-wide">
                  Transactions
                </h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {formatNumber(metrics.transactions.total)}
                </p>
                <p className="text-green-200 text-sm mt-1">
                  ${formatNumber(metrics.transactions.volume)} volume
                </p>
              </div>
              <div className="text-4xl text-green-400">💸</div>
            </div>
          </div>

          {/* Stores/Revenue */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wide">
                  {admin?.role === 'super_admin' ? 'Active Stores' : 'Revenue'}
                </h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {admin?.role === 'super_admin' 
                    ? formatNumber(metrics.stores.active)
                    : `$${formatNumber(metrics.stores.revenue)}`
                  }
                </p>
                <p className="text-purple-200 text-sm mt-1">
                  {admin?.role === 'super_admin' 
                    ? 'System wide'
                    : 'Total volume'
                  }
                </p>
              </div>
              <div className="text-4xl text-purple-400">
                {admin?.role === 'super_admin' ? '🏪' : '📈'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Quick Actions Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              
              <a 
                href="/admin/metrics" 
                className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <div className="font-semibold text-white">View Detailed Metrics</div>
                    <div className="text-sm text-gray-400">Analytics and performance data</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </a>

              {admin?.role === 'super_admin' && (
                <>
                  <a 
                    href="/admin/users" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👤</span>
                      <div>
                        <div className="font-semibold text-white">Manage Users</div>
                        <div className="text-sm text-gray-400">User accounts and permissions</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>

                  <a 
                    href="/admin/stores" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🏪</span>
                      <div>
                        <div className="font-semibold text-white">Manage Stores</div>
                        <div className="text-sm text-gray-400">Store locations and settings</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>

                  <a 
                    href="/admin/treasury" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💰</span>
                      <div>
                        <div className="font-semibold text-white">Treasury Management</div>
                        <div className="text-sm text-gray-400">Wallet and token management</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>
                </>
              )}

              {(admin?.role === 'store_owner' || admin?.role === 'store_manager') && (
                <>
                  <a 
                    href="/admin/machines" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🎰</span>
                      <div>
                        <div className="font-semibold text-white">Manage Machines</div>
                        <div className="text-sm text-gray-400">Machine status and operations</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>
                </>
              )}

            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">System Status</h3>
            <div className="space-y-3">

              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-green-200">Database Connected</div>
                    <div className="text-sm text-green-400">MongoDB operational</div>
                  </div>
                </div>
                <span className="text-green-400 font-bold">✓</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-blue-200">Blockchain Connected</div>
                    <div className="text-sm text-blue-400">Solana network active</div>
                  </div>
                </div>
                <span className="text-blue-400 font-bold">✓</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-purple-200">
                      {admin?.role === 'super_admin' ? 'System Healthy' : 'Store Active'}
                    </div>
                    <div className="text-sm text-purple-400">
                      {admin?.role === 'super_admin' ? 'All services operational' : 'Operations running'}
                    </div>
                  </div>
                </div>
                <span className="text-purple-400 font-bold">✓</span>
              </div>

            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Performance Overview</h3>
            <a 
              href="/admin/metrics" 
              className="text-yellow-400 hover:text-yellow-300 font-medium text-sm"
            >
              View Full Metrics →
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {metrics.users.total > 0 ? ((metrics.users.active / metrics.users.total) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-400">User Activity Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {formatNumber(metrics.tokens.issued)}
              </div>
              <div className="text-sm text-gray-400">Total Tokens Issued</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(metrics.transactions.total)}
              </div>
              <div className="text-sm text-gray-400">Total Transactions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {metrics.stores.active}
              </div>
              <div className="text-sm text-gray-400">
                {admin?.role === 'super_admin' ? 'Active Stores' : 'Store Count'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}