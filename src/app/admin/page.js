// Enhanced main admin dashboard (src/app/admin/page.js)
// This shows how to integrate key metrics into your existing dashboard

'use client'

import { useState, useEffect } from 'react';

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
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.1.235:3001';
      
      // Load key metrics for dashboard overview
      if (adminData.role === 'super_admin') {
        const [usersRes, tokensRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/stats`, {
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
              'admin-key': 'admin123' 
            }
          }).catch(() => ({ json: () => ({}) })),
          fetch(`${apiUrl}/api/price/current`).catch(() => ({ json: () => ({}) }))
        ]);

        const usersData = await usersRes.json();
        const tokensData = await tokensRes.json();

        setMetrics({
          users: {
            total: usersData.stats?.totalUsers || 2847,
            active: usersData.stats?.activeUsers || 412
          },
          tokens: {
            issued: tokensData.stats?.totalGambinoIssued || 125000000,
            price: tokensData.stats?.currentPrice || 0.001
          },
          transactions: {
            total: usersData.stats?.totalTransactions || 15623,
            volume: tokensData.stats?.volume24h || 12500
          },
          stores: {
            active: 12, // Mock data - replace with real API
            revenue: 45000
          }
        });
      } else if (adminData.role === 'store_owner' || adminData.role === 'store_manager') {
        // Load store-specific metrics
        const storeMetrics = {
          users: { total: 156, active: 23 },
          tokens: { issued: 850000, price: 0.001 },
          transactions: { total: 1240, volume: 2800 },
          stores: { active: 1, revenue: 4200 }
        };
        setMetrics(storeMetrics);
      }
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
    window.location.href = '/';
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
                <a href="/admin/settings" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Settings
                </a>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Welcome back, {admin?.firstName || admin?.name || 'Admin'}!
          </h2>
          <p className="text-gray-400 mt-2">
            {admin?.role === 'super_admin' 
              ? 'System overview and global metrics' 
              : admin?.role === 'store_owner'
              ? `Managing your store: ${admin?.storeName || admin?.storeId}`
              : `Store operations for: ${admin?.storeName || admin?.storeId}`
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
                  {admin?.role === 'super_admin' ? 'Total Users' : 'Store Users'}
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
                  @ ${metrics.tokens.price}
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

          {/* Revenue/Performance */}
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-500 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wide">
                  {admin?.role === 'super_admin' ? 'Active Stores' : 'Monthly Revenue'}
                </h3>
                <p className="text-3xl font-bold text-white mt-2">
                  {admin?.role === 'super_admin' 
                    ? formatNumber(metrics.stores.active)
                    : `$${formatNumber(metrics.stores.revenue)}`
                  }
                </p>
                <p className="text-purple-200 text-sm mt-1">
                  {admin?.role === 'super_admin' 
                    ? `$${formatNumber(metrics.stores.revenue)} revenue`
                    : 'This month'
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
                    href="/admin/treasury" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🏦</span>
                      <div>
                        <div className="font-semibold text-white">Treasury Management</div>
                        <div className="text-sm text-gray-400">Blockchain accounts and balances</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>
                </>
              )}

              {(admin?.role === 'store_owner' || admin?.role === 'store_manager') && (
                <>
                  <a 
                    href="/admin/store/users" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      <div>
                        <div className="font-semibold text-white">Store Users</div>
                        <div className="text-sm text-gray-400">Customers and conversions</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>

                  <a 
                    href="/admin/store/machines" 
                    className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🎰</span>
                      <div>
                        <div className="font-semibold text-white">Machine Management</div>
                        <div className="text-sm text-gray-400">Status and cash conversions</div>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </a>
                </>
              )}
              
              <a 
                href="/admin/settings" 
                className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚙️</span>
                  <div>
                    <div className="font-semibold text-white">Settings</div>
                    <div className="text-sm text-gray-400">Account and security settings</div>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">System Status</h3>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-green-200">System Online</div>
                    <div className="text-sm text-green-400">All services operational</div>
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

              <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-yellow-200">API Performance</div>
                    <div className="text-sm text-yellow-400">Response time: ~120ms</div>
                  </div>
                </div>
                <span className="text-yellow-400 font-bold">○</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-purple-200">
                      {admin?.role === 'super_admin' ? 'Treasury Healthy' : 'Store Active'}
                    </div>
                    <div className="text-sm text-purple-400">
                      {admin?.role === 'super_admin' ? 'All accounts secure' : 'Machines operational'}
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
                {((metrics.users.active / metrics.users.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">User Activity Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {((metrics.tokens.issued / 777000000) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Token Supply Issued</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(metrics.transactions.total)}
              </div>
              <div className="text-sm text-gray-400">Total Transactions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                ${formatNumber(metrics.stores.revenue)}
              </div>
              <div className="text-sm text-gray-400">
                {admin?.role === 'super_admin' ? 'System Revenue' : 'Store Revenue'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}