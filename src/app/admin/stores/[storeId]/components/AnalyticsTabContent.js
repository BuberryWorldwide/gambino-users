// Fixed AnalyticsTabContent.js
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const AnalyticsTabContent = ({ storeId, store, isAdmin = false }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storeId || store?.storeId) {
      loadAnalyticsData();
    } else {
      setError('Store ID is required for analytics');
      setLoading(false);
    }
  }, [storeId, store?.storeId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError('');
    
    const targetStoreId = storeId || store?.storeId;
    
    try {
      console.log('Loading analytics for store:', targetStoreId);
      
      // Use the new analytics endpoint
      const response = await api.get(`/api/admin/stores/${encodeURIComponent(targetStoreId)}/analytics`);
      
      if (response.data.success) {
        setAnalyticsData(response.data);
        console.log('Analytics data loaded:', response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      
      // Provide fallback data structure
      setAnalyticsData({
        success: true,
        store: {
          storeId: targetStoreId,
          storeName: store?.storeName || 'Unknown Store'
        },
        stats: {
          totalMachines: 0,
          activeMachines: 0,
          inactiveMachines: 0,
          maintenanceMachines: 0,
          totalEvents: 0,
          totalRevenue: 0,
          totalBets: 0,
          uniquePlayers: 0,
          recentActivity: []
        },
        machines: [],
        events: []
      });
      
      setError('Unable to load analytics data. Using fallback data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <div className="text-red-200 font-medium mb-4">{error}</div>
            <button 
              onClick={loadAnalyticsData}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, machines, events } = analyticsData;

  return (
    <div className="p-6 space-y-6">
      {/* Error banner if using fallback data */}
      {error && (
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-400 mr-3">⚠️</div>
            <div className="text-yellow-200 text-sm">{error}</div>
            <button 
              onClick={loadAnalyticsData}
              className="ml-auto px-3 py-1 bg-yellow-600 text-black text-sm rounded hover:bg-yellow-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total Machines</h3>
          <p className="text-2xl font-bold text-white">{stats.totalMachines}</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Active Machines</h3>
          <p className="text-2xl font-bold text-green-400">{stats.activeMachines}</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total Revenue (30d)</h3>
          <p className="text-2xl font-bold text-yellow-400">
            ${stats.totalRevenue?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Unique Players</h3>
          <p className="text-2xl font-bold text-blue-400">{stats.uniquePlayers || 0}</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total Bets (30d)</h3>
          <p className="text-xl font-bold text-purple-400">
            ${stats.totalBets?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total Events</h3>
          <p className="text-xl font-bold text-cyan-400">{stats.totalEvents || 0}</p>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-1">Win Rate</h3>
          <p className="text-xl font-bold text-orange-400">
            {stats.totalBets > 0 
              ? `${((stats.totalRevenue / stats.totalBets) * 100).toFixed(1)}%`
              : '0%'
            }
          </p>
        </div>
      </div>

      {/* Machines Status */}
      <div className="bg-slate-800/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Machine Status Overview</h3>
        
        {machines.length === 0 ? (
          <p className="text-gray-400">No machines configured for this store.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {machines.map((machine) => (
              <div key={machine._id} className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{machine.name || machine.machineId}</h4>
                    <p className="text-sm text-gray-400">{machine.location || 'No location'}</p>
                    <p className="text-xs text-gray-500">{machine.gameType || 'slot'}</p>
                    {machine.lastSeen && (
                      <p className="text-xs text-gray-500">
                        Last seen: {new Date(machine.lastSeen).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    machine.status === 'active' 
                      ? 'bg-green-900/30 text-green-300' 
                      : machine.status === 'maintenance'
                      ? 'bg-yellow-900/30 text-yellow-300'
                      : 'bg-red-900/30 text-red-300'
                  }`}>
                    {machine.status || 'unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Events */}
      <div className="bg-slate-800/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        
        {events.length === 0 ? (
          <p className="text-gray-400">No recent events for this store.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((event, index) => (
              <div key={event._id || index} className="flex justify-between items-center py-2 border-b border-slate-600/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.eventType === 'voucher' ? 'bg-green-900/30 text-green-300' :
                      event.eventType === 'money_in' ? 'bg-blue-900/30 text-blue-300' :
                      event.eventType === 'collect' ? 'bg-purple-900/30 text-purple-300' :
                      'bg-gray-900/30 text-gray-300'
                    }`}>
                      {event.eventType}
                    </span>
                    <span className="text-white font-medium">
                      {event.machineId || 'Unknown Machine'}
                    </span>
                    {event.isUserBound && (
                      <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded">
                        User Bound
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {event.amount && (
                    <span className={`font-medium ${
                      event.eventType === 'voucher' ? 'text-green-400' :
                      event.eventType === 'money_in' ? 'text-blue-400' :
                      'text-white'
                    }`}>
                      ${event.amount.toFixed(2)}
                    </span>
                  )}
                  <div className="text-xs text-gray-400">
                    {event.timestamp 
                      ? new Date(event.timestamp).toLocaleString()
                      : 'No timestamp'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Debug Information */}
      {isAdmin && process.env.NODE_ENV === 'development' && (
        <details className="bg-slate-900/50 rounded-lg p-4">
          <summary className="text-white cursor-pointer">Admin Debug Information</summary>
          <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-40">
            Store ID: {storeId || store?.storeId || 'undefined'}
            {'\n'}Loaded: {analyticsData ? 'Yes' : 'No'}
            {'\n'}Error: {error || 'None'}
            {'\n'}Machines: {machines.length}
            {'\n'}Events: {events.length}
            {'\n'}Stats: {JSON.stringify(stats, null, 2)}
          </pre>
        </details>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadAnalyticsData}
          disabled={loading}
          className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default AnalyticsTabContent;