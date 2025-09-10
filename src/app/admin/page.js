// src/app/admin/page.js - Updated with sophisticated glassmorphism styling
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getToken, getUser, clearToken } from '@/lib/auth';

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
    // Use unified auth system
    const token = getToken();
    const userData = getUser();

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    // Check if user can access admin area
    if (!['super_admin', 'gambino_ops', 'venue_manager', 'venue_staff'].includes(userData.role)) {
      window.location.href = '/dashboard';
      return;
    }

    setAdmin(userData);
    loadDashboardData(userData);
  }, []);

  const loadDashboardData = async (adminData) => {
    try {
      setError('');
      setLoading(true);

      // Use the API instance for consistent auth headers
      const [usersRes, metricsRes, storesRes] = await Promise.all([
        // Get user stats
        api.get('/api/admin/users').catch(() => ({ data: { users: [], count: 0 } })),

        // Get transaction metrics
        api.get('/api/admin/metrics?timeframe=30d').catch(() => ({ data: { metrics: {} } })),

        // Get store stats
        api.get('/api/admin/stores').catch(() => ({ data: { stores: [], count: 0 } }))
      ]);

      const users = usersRes.data.users || [];
      const userCount = usersRes.data.count || users.length;
      const activeUsers = users.filter(u => u.isActive !== false).length;

      const metricsData = metricsRes.data.metrics || {};
      const stores = storesRes.data.stores || [];
      const activeStores = stores.filter(s => s.status === 'active').length;

      // Calculate actual metrics from your database
      const totalGambinoBalance = users.reduce((sum, user) => {
        return sum + (user.cachedGambinoBalance || user.gambinoBalance || 0);
      }, 0);

      setMetrics({
        users: {
          total: userCount,
          active: activeUsers
        },
        tokens: {
          issued: totalGambinoBalance,
          price: 0.001
        },
        transactions: {
          total: metricsData.transfers?.total || 0,
          volume: metricsData.transfers?.total * 0.001 || 0
        },
        stores: {
          active: activeStores,
          revenue: metricsData.transfers?.total * 0.001 || 0
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
    clearToken();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 border border-yellow-600/10 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
      </div>

      {/* Navigation Header */}
      <div className="relative z-10 bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center p-1.5">
                  <img 
                    src="/logo.png" 
                    alt="Gambino Gold Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  GAMBINO GOLD
                </h1>
              </div>
              <nav className="flex space-x-1">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                  Admin Dashboard
                </span>
                <a href="/admin/metrics" className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                  Analytics
                </a>
                {['super_admin', 'gambino_ops'].includes(admin?.role) && (
                  <>
                    <a href="/admin/users" className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                      Network Users
                    </a>
                    <a href="/admin/stores" className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                      Infrastructure
                    </a>
                    <a href="/admin/treasury" className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                      Treasury
                    </a>
                  </>
                )}
                {['venue_manager', 'venue_staff'].includes(admin?.role) && (
                  <>
                    <a href="/admin/venues" className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                      My Network
                    </a>
                    <a href="/admin/reports" className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                      Reports
                    </a>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {admin?.firstName} {admin?.lastName}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {admin?.role?.replace('_', ' ')}
                </div>
              </div>
              <button 
                onClick={logout} 
                className="bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Welcome back, {admin?.firstName || 'Administrator'}
                </h2>
                <p className="text-lg text-gray-300">
                  {admin?.role === 'super_admin'
                    ? 'Complete infrastructure oversight and network control'
                    : admin?.role === 'gambino_ops'
                    ? 'Operations monitoring and management platform'
                    : admin?.role === 'venue_manager'
                    ? 'Venue infrastructure and network analytics'
                    : 'Infrastructure management dashboard'
                  }
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Network Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          
          {/* Network Participants Card */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 bg-blue-400 rounded-sm"></div>
                </div>
                <div className="text-blue-400 text-xs font-medium bg-blue-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  Active Network
                </div>
              </div>
              <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider mb-2">
                Network Participants
              </h3>
              <p className="text-3xl font-bold text-white mb-1">
                {formatNumber(metrics.users.total)}
              </p>
              <p className="text-blue-200 text-sm">
                {formatNumber(metrics.users.active)} active participants
              </p>
            </div>
          </div>

          {/* Infrastructure Tokens Card */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 bg-yellow-400 rounded-sm"></div>
                </div>
                <div className="text-yellow-400 text-xs font-medium bg-yellow-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  $0.001 each
                </div>
              </div>
              <h3 className="text-yellow-300 font-semibold text-sm uppercase tracking-wider mb-2">
                Infrastructure Tokens
              </h3>
              <p className="text-3xl font-bold text-white mb-1">
                {formatNumber(metrics.tokens.issued)}
              </p>
              <p className="text-yellow-200 text-sm">
                In network circulation
              </p>
            </div>
          </div>

          {/* Network Operations Card */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 bg-green-400 rounded-sm"></div>
                </div>
                <div className="text-green-400 text-xs font-medium bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  Network Activity
                </div>
              </div>
              <h3 className="text-green-300 font-semibold text-sm uppercase tracking-wider mb-2">
                Network Operations
              </h3>
              <p className="text-3xl font-bold text-white mb-1">
                {formatNumber(metrics.transactions.total)}
              </p>
              <p className="text-green-200 text-sm">
                ${formatNumber(metrics.transactions.volume)} total volume
              </p>
            </div>
          </div>

          {/* Infrastructure Nodes Card */}
          <div className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 bg-purple-400 rounded-sm"></div>
                </div>
                <div className="text-purple-400 text-xs font-medium bg-purple-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                  Live Status
                </div>
              </div>
              <h3 className="text-purple-300 font-semibold text-sm uppercase tracking-wider mb-2">
                {['super_admin', 'gambino_ops'].includes(admin?.role) ? 'Infrastructure Nodes' : 'Network Revenue'}
              </h3>
              <p className="text-3xl font-bold text-white mb-1">
                {['super_admin', 'gambino_ops'].includes(admin?.role)
                  ? formatNumber(metrics.stores.active)
                  : `$${formatNumber(metrics.stores.revenue)}`
                }
              </p>
              <p className="text-purple-200 text-sm">
                {['super_admin', 'gambino_ops'].includes(admin?.role)
                  ? 'Network-wide infrastructure'
                  : 'Total infrastructure revenue'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Infrastructure Management - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">Infrastructure Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <a 
                  href="/admin/metrics" 
                  className="group bg-gray-700/30 hover:bg-blue-700/30 border border-gray-600/50 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500/20 group-hover:bg-blue-500/30 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
                      <div className="w-6 h-6 bg-blue-400 rounded-sm"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-blue-200 transition-colors duration-300">
                        Network Analytics
                      </div>
                      <div className="text-sm text-gray-400 group-hover:text-blue-300 transition-colors duration-300">
                        Performance metrics and insights
                      </div>
                    </div>
                  </div>
                </a>

                {admin?.role === 'super_admin' && (
                  <>
                    <a 
                      href="/admin/users" 
                      className="group bg-gray-700/30 hover:bg-green-700/30 border border-gray-600/50 hover:border-green-500/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-500/20 group-hover:bg-green-500/30 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
                          <div className="w-6 h-6 bg-green-400 rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-green-200 transition-colors duration-300">
                            Network Participants
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-green-300 transition-colors duration-300">
                            User accounts and access control
                          </div>
                        </div>
                      </div>
                    </a>

                    <a 
                      href="/admin/stores" 
                      className="group bg-gray-700/30 hover:bg-orange-700/30 border border-gray-600/50 hover:border-orange-500/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-500/20 group-hover:bg-orange-500/30 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
                          <div className="w-6 h-6 bg-orange-400 rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-orange-200 transition-colors duration-300">
                            Infrastructure Nodes
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-orange-300 transition-colors duration-300">
                            Network locations and configuration
                          </div>
                        </div>
                      </div>
                    </a>

                    <a 
                      href="/admin/treasury" 
                      className="group bg-gray-700/30 hover:bg-yellow-700/30 border border-gray-600/50 hover:border-yellow-500/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-yellow-500/20 group-hover:bg-yellow-500/30 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
                          <div className="w-6 h-6 bg-yellow-400 rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-yellow-200 transition-colors duration-300">
                            Treasury Management
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-yellow-300 transition-colors duration-300">
                            Token operations and liquidity
                          </div>
                        </div>
                      </div>
                    </a>
                  </>
                )}

                {['venue_manager', 'venue_staff'].includes(admin?.role) && (
                  <>
                    <a 
                      href="/admin/venues" 
                      className="group bg-gray-700/30 hover:bg-indigo-700/30 border border-gray-600/50 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-indigo-500/20 group-hover:bg-indigo-500/30 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
                          <div className="w-6 h-6 bg-indigo-400 rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-indigo-200 transition-colors duration-300">
                            My Infrastructure
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-indigo-300 transition-colors duration-300">
                            Assigned network locations
                          </div>
                        </div>
                      </div>
                    </a>

                    <a 
                      href="/admin/reports" 
                      className="group bg-gray-700/30 hover:bg-teal-700/30 border border-gray-600/50 hover:border-teal-500/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-teal-500/20 group-hover:bg-teal-500/30 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300">
                          <div className="w-6 h-6 bg-teal-400 rounded-sm"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-teal-200 transition-colors duration-300">
                            Network Reports
                          </div>
                          <div className="text-sm text-gray-400 group-hover:text-teal-300 transition-colors duration-300">
                            Infrastructure analytics
                          </div>
                        </div>
                      </div>
                    </a>
                  </>
                )}

              </div>
            </div>
          </div>

          {/* System Status Sidebar */}
          <div className="space-y-6">
            {/* Network Health */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Network Health</h3>
              <div className="space-y-4">

                <div className="flex items-center justify-between p-3 bg-green-900/30 border border-green-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <div className="font-medium text-green-200 text-sm">Infrastructure</div>
                      <div className="text-xs text-green-400">All systems operational</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <div className="font-medium text-blue-200 text-sm">Network Layer</div>
                      <div className="text-xs text-blue-400">Blockchain connectivity active</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <div className="font-medium text-purple-200 text-sm">
                        {['super_admin', 'gambino_ops'].includes(admin?.role) ? 'Global Network' : 'Access Level'}
                      </div>
                      <div className="text-xs text-purple-400">
                        {['super_admin', 'gambino_ops'].includes(admin?.role) ? 'All infrastructure online' : 'Operational permissions'}
                      </div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>

              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Performance</h3>
                <a 
                  href="/admin/metrics" 
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
                >
                  View Analytics →
                </a>
              </div>
              
              <div className="space-y-4">
                <div className="text-center p-3 bg-green-900/20 rounded-xl backdrop-blur-sm">
                  <div className="text-xl font-bold text-green-400">
                    {metrics.users.total > 0 ? ((metrics.users.active / metrics.users.total) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-green-300">Network Activity Rate</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-900/20 rounded-xl backdrop-blur-sm">
                  <div className="text-xl font-bold text-yellow-400">
                    {formatNumber(metrics.tokens.issued)}
                  </div>
                  <div className="text-xs text-yellow-300">Tokens Distributed</div>
                </div>
                
                <div className="text-center p-3 bg-blue-900/20 rounded-xl backdrop-blur-sm">
                  <div className="text-xl font-bold text-blue-400">
                    {formatNumber(metrics.transactions.total)}
                  </div>
                  <div className="text-xs text-blue-300">Network Operations</div>
                </div>
                
                <div className="text-center p-3 bg-purple-900/20 rounded-xl backdrop-blur-sm">
                  <div className="text-xl font-bold text-purple-400">
                    {metrics.stores.active}
                  </div>
                  <div className="text-xs text-purple-300">
                    {['super_admin', 'gambino_ops'].includes(admin?.role) ? 'Infrastructure Nodes' : 'Node Count'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-xs space-y-1">
          <p>© 2025 Gambino Gold. Mining infrastructure platform.</p>
          <p>Building sustainable community wealth through transparent technology.</p>
        </div>
      </div>
    </div>
  );
}