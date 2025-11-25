// src/app/admin/page.js - Standardized Admin Dashboard
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getToken, getUser, clearToken } from '@/lib/auth';
import StandardizedAdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminMetricCard, 
  AdminLoadingSpinner 
} from '@/components/layout/StandardizedAdminLayout';

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
    const token = getToken();
    const userData = getUser();

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

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

      const [usersRes, metricsRes, storesRes] = await Promise.all([
        api.get('/api/admin/users').catch(() => ({ data: { users: [], count: 0 } })),
        api.get('/api/admin/metrics?timeframe=30d').catch(() => ({ data: { metrics: {} } })),
        api.get('/api/admin/stores').catch(() => ({ data: { stores: [], count: 0 } }))
      ]);

      const users = usersRes.data.users || [];
      const userCount = usersRes.data.count || users.length;
      const activeUsers = users.filter(u => u.isActive !== false).length;
      const metricsData = metricsRes.data.metrics || {};
      const stores = storesRes.data.stores || [];
      const activeStores = stores.filter(s => s.status === 'active').length;

      const totalGambinoBalance = users.reduce((sum, user) => {
        return sum + (user.cachedGambinoBalance || user.gambinoBalance || 0);
      }, 0);

      setMetrics({
        users: { total: userCount, active: activeUsers },
        tokens: { issued: totalGambinoBalance, price: 0.001 },
        transactions: { total: metricsData.transfers?.total || 0, volume: metricsData.transfers?.total * 0.001 || 0 },
        stores: { active: activeStores, revenue: metricsData.transfers?.total * 0.001 || 0 }
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

  const getRoleTitle = (role) => {
    const titles = {
      super_admin: 'System Administrator',
      gambino_ops: 'Operations Manager',
      venue_manager: 'Venue Manager',
      venue_staff: 'Venue Staff'
    };
    return titles[role] || 'Administrator';
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      super_admin: 'Complete infrastructure oversight and network control',
      gambino_ops: 'Operations monitoring and management platform',
      venue_manager: 'Venue oversight and participant management',
      venue_staff: 'Daily operations and customer support'
    };
    return descriptions[role] || 'Administrative access';
  };

  if (loading) {
    return (
      <StandardizedAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AdminLoadingSpinner size="lg" />
            <div className="text-white text-lg mt-4">Loading dashboard...</div>
          </div>
        </div>
      </StandardizedAdminLayout>
    );
  }

  const pageActions = (
    <>
      <AdminButton 
        variant="secondary" 
        onClick={() => loadDashboardData(admin)}
        disabled={loading}
      >
        {loading ? <AdminLoadingSpinner size="sm" color="white" /> : 'Refresh Data'}
      </AdminButton>
      <AdminButton href="/admin/metrics">
        View Analytics
      </AdminButton>
    </>
  );

  return (
    <StandardizedAdminLayout
      pageTitle={`Welcome back, ${admin?.firstName || 'Administrator'}`}
      pageDescription={getRoleDescription(admin?.role)}
      pageActions={pageActions}
    >
      {/* Error Display */}
      {error && (
        <AdminCard className="mb-8 bg-red-900/30 border-red-500/30">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </AdminCard>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <AdminMetricCard
          title="Network Participants"
          value={formatNumber(metrics.users.total)}
          subtitle={`${formatNumber(metrics.users.active)} active`}
          color="green"
          href="/admin/users"
        />

        <AdminMetricCard
          title="Token Supply"
          value={formatNumber(metrics.tokens.issued)}
          subtitle="Total issued"
          color="yellow"
        />

        <AdminMetricCard
          title="Stores"
          value={formatNumber(metrics.stores.active)}
          subtitle="Active locations"
          color="orange"
          href="/admin/stores"
        />

        <AdminMetricCard
          title="Network Volume"
          value={`$${formatNumber(metrics.transactions.volume)}`}
          subtitle={`${formatNumber(metrics.transactions.total)} transfers`}
          color="blue"
          href="/admin/metrics"
        />
      </div>

      {/* Role-Based Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primary Actions */}
        <AdminCard>
          <h3 className="text-2xl font-bold text-white mb-6">Primary Actions</h3>
          <div className="space-y-4">
            {(admin?.role === 'super_admin' || admin?.role === 'gambino_ops') && (
              <>
                <AdminActionCard
                  href="/admin/users"
                  title="Participants"
                  description="User accounts and access control"
                  color="green"
                />
                <AdminActionCard
                  href="/admin/stores"
                  title="Stores"
                  description="Locations and configuration"
                  color="orange"
                />
                <AdminActionCard
                  href="/admin/treasury"
                  title="Treasury"
                  description="Token operations and liquidity"
                  color="yellow"
                />
              </>
            )}

            {(admin?.role === 'venue_manager' || admin?.role === 'venue_staff') && (
              <>
                <AdminActionCard
                  href="/admin/venues"
                  title="My Venues"
                  description="Venue oversight and management"
                  color="blue"
                />
                <AdminActionCard
                  href="/admin/reports"
                  title="Reports"
                  description="Performance and analytics"
                  color="green"
                />
              </>
            )}
          </div>
        </AdminCard>

        {/* Quick Stats */}
        <AdminCard>
          <h3 className="text-2xl font-bold text-white mb-6">System Status</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Network Health</div>
                <div className="text-gray-400 text-sm">All systems operational</div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-green-400 font-medium">Online</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Token Price</div>
                <div className="text-gray-400 text-sm">Current market rate</div>
              </div>
              <div className="text-yellow-400 font-bold">
                ${metrics.tokens.price.toFixed(3)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Your Access Level</div>
                <div className="text-gray-400 text-sm">{getRoleTitle(admin?.role)}</div>
              </div>
              <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                <span className="text-yellow-300 text-sm font-medium">
                  {admin?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Recent Activity */}
      <AdminCard className="mt-8">
        <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
        <div className="text-gray-400 text-center py-8">
          <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <p>Activity tracking will be displayed here</p>
          <p className="text-sm mt-2">Connect to your backend to see real-time updates</p>
        </div>
      </AdminCard>
    </StandardizedAdminLayout>
  );
}

// Action Card Component
const AdminActionCard = ({ href, title, description, color }) => {
  const colors = {
    green: 'hover:bg-green-700/30 hover:border-green-500/50',
    orange: 'hover:bg-orange-700/30 hover:border-orange-500/50',
    yellow: 'hover:bg-yellow-700/30 hover:border-yellow-500/50',
    blue: 'hover:bg-blue-700/30 hover:border-blue-500/50'
  };

  const colorClasses = colors[color] || colors.yellow;

  return (
    <a
      href={href}
      className={`group bg-gray-700/30 border border-gray-600/50 rounded-xl p-4 transition-all duration-300 backdrop-blur-sm block hover:transform hover:scale-[1.02] ${colorClasses}`}
    >
      <div>
        <div className="font-semibold text-white transition-colors duration-300">
          {title}
        </div>
        <div className="text-sm text-gray-400 transition-colors duration-300">
          {description}
        </div>
      </div>
    </a>
  );
};