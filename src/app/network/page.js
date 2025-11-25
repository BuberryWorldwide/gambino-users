'use client';

import { useState, useEffect } from 'react';

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
      const startTime = Date.now();
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.gambino.gold';

      const healthRes = await fetch(`${apiUrl}/health`);
      const health = await healthRes.json();
      const responseTime = Date.now() - startTime;

      let uptime = 0;
      if (health.uptime) {
        uptime = typeof health.uptime === 'number' ? health.uptime : parseInt(health.uptime);
      } else if (health.startTime) {
        uptime = Math.floor((Date.now() - new Date(health.startTime).getTime()) / 1000);
      }

      setNetworkStats({
        status: health.status === 'OK' ? 'online' : 'degraded',
        uptime: uptime,
        database: health.database || 'connected',
        lastUpdated: new Date(),
        version: health.version || '1.0.0',
        apiResponseTime: responseTime
      });

      setError('');
    } catch (err) {
      console.error('Failed to load network stats:', err);
      setError('Unable to connect to network');
      setNetworkStats({
        status: 'offline',
        uptime: 0,
        database: 'disconnected',
        lastUpdated: new Date(),
        version: 'unknown',
        apiResponseTime: 0
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </a>

          <h1 className="text-3xl font-bold mb-2">Network Status</h1>
          <p className="text-neutral-400">Real-time infrastructure monitoring</p>
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
                  <div className={`w-3 h-3 rounded-full ${
                    networkStats?.status === 'online' ? 'bg-green-500 animate-pulse' :
                    networkStats?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium capitalize ${
                    networkStats?.status === 'online' ? 'text-green-400' :
                    networkStats?.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {networkStats?.status === 'online' ? 'All Systems Operational' :
                     networkStats?.status === 'degraded' ? 'Degraded Performance' : 'System Offline'}
                  </span>
                </div>
                <button
                  onClick={loadNetworkStats}
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Uptime</div>
                <div className="text-xl font-bold text-white">{formatUptime(networkStats?.uptime)}</div>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Database</div>
                <div className={`text-xl font-bold ${networkStats?.database === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                  {networkStats?.database === 'connected' ? 'Connected' : 'Disconnected'}
                </div>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Response Time</div>
                <div className="text-xl font-bold text-white">{networkStats?.apiResponseTime || '--'}ms</div>
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Version</div>
                <div className="text-xl font-bold text-white">{networkStats?.version || '--'}</div>
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
