'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Server,
  Monitor,
  Trophy,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap
} from 'lucide-react';

export default function NetworkPage() {
  const [networkStats, setNetworkStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNetworkStats();
    const interval = setInterval(loadNetworkStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNetworkStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.gambino.gold';

      const res = await fetch(`${apiUrl}/api/network/status`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setNetworkStats({
        status: data.status,
        uptime: data.uptime,
        lastUpdated: new Date(),
        locations: data.network.locations,
        hubs: data.network.hubs,
        machines: data.network.machines,
        activity: data.activity
      });

      setError('');
    } catch (err) {
      console.error('Failed to load network stats:', err);
      setError('Unable to connect to network');
      setNetworkStats({
        status: 'offline',
        uptime: 0,
        lastUpdated: new Date(),
        locations: { total: 0, active: 0 },
        hubs: { total: 0, online: 0 },
        machines: { total: 0, online: 0 },
        activity: { jackpotsLast24h: 0, jackpotsAllTime: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return 'Unknown';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen text-white relative">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>

          <h1 className="text-3xl font-bold mb-2">Network Status</h1>
          <p className="text-neutral-400">Real-time Gambino network monitoring</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-500">Loading network status...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Status Banner */}
            <div className={`p-4 rounded-xl border ${
              networkStats?.status === 'online'
                ? 'bg-green-500/10 border-green-500/30'
                : networkStats?.status === 'degraded'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {networkStats?.status === 'online' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : networkStats?.status === 'degraded' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    networkStats?.status === 'online' ? 'text-green-400' :
                    networkStats?.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {networkStats?.status === 'online' ? 'All Systems Operational' :
                     networkStats?.status === 'degraded' ? 'Degraded Performance' : 'System Offline'}
                  </span>
                </div>
                <button
                  onClick={loadNetworkStats}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Locations */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">Locations</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {networkStats?.locations?.active || 0}
                  <span className="text-sm text-neutral-500 font-normal ml-1">active</span>
                </div>
              </div>

              {/* Hubs */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Server className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">Hubs</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {networkStats?.hubs?.online || 0}
                  <span className="text-sm text-neutral-500 font-normal ml-1">/ {networkStats?.hubs?.total || 0}</span>
                </div>
              </div>

              {/* Machines */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">Machines</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {networkStats?.machines?.online || 0}
                  <span className="text-sm text-neutral-500 font-normal ml-1">/ {networkStats?.machines?.total || 0}</span>
                </div>
              </div>

              {/* Jackpots 24h */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">Jackpots (24h)</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {networkStats?.activity?.jackpotsLast24h || 0}
                </div>
              </div>
            </div>

            {/* Activity Section */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Network Activity
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">System Uptime</div>
                  <div className="text-lg font-semibold text-white">{formatUptime(networkStats?.uptime)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Total Jackpots</div>
                  <div className="text-lg font-semibold text-white">{networkStats?.activity?.jackpotsAllTime?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Network Coverage</div>
                  <div className="text-lg font-semibold text-white">
                    {networkStats?.locations?.active || 0} locations
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-neutral-500 text-sm">
              Last updated: {networkStats?.lastUpdated?.toLocaleString()}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
