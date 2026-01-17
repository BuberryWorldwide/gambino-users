'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  Users,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Gamepad2,
  Database,
  Globe
} from 'lucide-react';

export default function NetworkPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    const results = {
      arca: { status: 'checking', latency: null },
      games: { status: 'checking', latency: null },
      entropy: { packets: 0, bits: 0 },
      lastUpdated: new Date()
    };

    // Check Arca Protocol API
    try {
      const start = Date.now();
      const res = await fetch('https://api.arca-protocol.com/health');
      const data = await res.json();
      results.arca = {
        status: data.status === 'ok' ? 'online' : 'degraded',
        latency: Date.now() - start,
        storage: data.storage
      };
    } catch {
      results.arca = { status: 'offline', latency: null };
    }

    // Check Games Portal
    try {
      const start = Date.now();
      const res = await fetch('https://play.gambino.gold/', { method: 'HEAD' });
      results.games = {
        status: res.ok ? 'online' : 'degraded',
        latency: Date.now() - start
      };
    } catch {
      results.games = { status: 'offline', latency: null };
    }

    // Get entropy stats from Arca
    try {
      const res = await fetch('https://api.arca-protocol.com/v1/entropy/stats');
      const data = await res.json();
      if (data.success) {
        results.entropy = {
          packets: data.stats?.totalPackets || 0,
          bits: data.stats?.totalBits || 0
        };
      }
    } catch {
      // Stats not available
    }

    setStatus(results);
    setLoading(false);
  };

  const getOverallStatus = () => {
    if (!status) return 'offline';
    if (status.arca.status === 'online' && status.games.status === 'online') return 'online';
    if (status.arca.status === 'offline' && status.games.status === 'offline') return 'offline';
    return 'degraded';
  };

  const StatusBadge = ({ serviceStatus }) => {
    const colors = {
      online: 'bg-green-500',
      degraded: 'bg-yellow-500',
      offline: 'bg-red-500',
      checking: 'bg-neutral-500 animate-pulse'
    };
    return (
      <span className={`w-2 h-2 rounded-full ${colors[serviceStatus] || colors.offline}`} />
    );
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

          <h1 className="text-3xl font-bold mb-2">System Status</h1>
          <p className="text-neutral-400">Real-time monitoring of Gambino Gold infrastructure</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-500">Checking services...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Overall Status Banner */}
            <div className={`p-5 rounded-xl border ${
              getOverallStatus() === 'online'
                ? 'bg-green-500/10 border-green-500/30'
                : getOverallStatus() === 'degraded'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getOverallStatus() === 'online' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : getOverallStatus() === 'degraded' ? (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <span className={`font-semibold text-lg ${
                      getOverallStatus() === 'online' ? 'text-green-400' :
                      getOverallStatus() === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {getOverallStatus() === 'online' ? 'All Systems Operational' :
                       getOverallStatus() === 'degraded' ? 'Partial Outage' : 'Major Outage'}
                    </span>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      Last checked: {status?.lastUpdated?.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadStatus}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Services</h2>

              {/* Arca Protocol */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                      <Database className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Arca Protocol</div>
                      <div className="text-sm text-neutral-500">Entropy verification & anchoring</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {status?.arca.latency && (
                      <span className="text-xs text-neutral-500">{status.arca.latency}ms</span>
                    )}
                    <div className="flex items-center gap-2">
                      <StatusBadge serviceStatus={status?.arca.status} />
                      <span className={`text-sm font-medium ${
                        status?.arca.status === 'online' ? 'text-green-400' :
                        status?.arca.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {status?.arca.status === 'online' ? 'Operational' :
                         status?.arca.status === 'degraded' ? 'Degraded' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Games Portal */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Games Portal</div>
                      <div className="text-sm text-neutral-500">Entropy mining interfaces</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {status?.games.latency && (
                      <span className="text-xs text-neutral-500">{status.games.latency}ms</span>
                    )}
                    <div className="flex items-center gap-2">
                      <StatusBadge serviceStatus={status?.games.status} />
                      <span className={`text-sm font-medium ${
                        status?.games.status === 'online' ? 'text-green-400' :
                        status?.games.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {status?.games.status === 'online' ? 'Operational' :
                         status?.games.status === 'degraded' ? 'Degraded' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gambino API */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                      <Server className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Gambino API</div>
                      <div className="text-sm text-neutral-500">User accounts & authentication</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge serviceStatus="online" />
                    <span className="text-sm font-medium text-green-400">Operational</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Stats */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Network</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gold">{status?.entropy.packets?.toLocaleString() || '—'}</div>
                  <div className="text-xs text-neutral-500 mt-1">Entropy Packets</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{status?.entropy.bits ? Math.floor(status.entropy.bits).toLocaleString() : '—'}</div>
                  <div className="text-xs text-neutral-500 mt-1">Total Bits</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">5</div>
                  <div className="text-xs text-neutral-500 mt-1">TN Locations</div>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">6</div>
                  <div className="text-xs text-neutral-500 mt-1">Mining Games</div>
                </div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Infrastructure</h2>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-gold" />
                      <span className="text-sm font-medium text-white">Hosting</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Frontend</span>
                        <span className="text-neutral-300">Vercel Edge</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Arca Router</span>
                        <span className="text-neutral-300">Fly.io</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Database</span>
                        <span className="text-neutral-300">PostgreSQL</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-gold" />
                      <span className="text-sm font-medium text-white">Anchoring</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Consensus</span>
                        <span className="text-neutral-300">Hedera HCS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Token</span>
                        <span className="text-neutral-300">Solana ($GG)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Proofs</span>
                        <span className="text-neutral-300">Merkle Trees</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
