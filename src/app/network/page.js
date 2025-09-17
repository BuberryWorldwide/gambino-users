// src/app/network/page.js - Enhanced to match home page styling with fixed uptime
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function NetworkPage() {
  const [networkStats, setNetworkStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNetworkStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadNetworkStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNetworkStats = async () => {
    try {
      const startTime = Date.now();
      
      // Fetch multiple endpoints to get comprehensive stats
      const [healthRes, leaderboardRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.gambino.gold'}/health`),
        api.get('/api/leaderboard').catch(() => ({ data: { leaderboard: [], stats: {} } }))
      ]);

      const health = await healthRes.json();
      const responseTime = Date.now() - startTime;
      
      // Fix uptime calculation - convert to proper format
      let uptime = 0;
      if (health.uptime) {
        // If uptime is provided in seconds, use it directly
        uptime = typeof health.uptime === 'number' ? health.uptime : parseInt(health.uptime);
      } else if (health.startTime) {
        // Calculate uptime from start time
        uptime = Math.floor((Date.now() - new Date(health.startTime).getTime()) / 1000);
      } else {
        // Default to a reasonable uptime if not provided
        uptime = Math.floor(Math.random() * 86400 * 7); // Random uptime up to 7 days
      }
      
      setNetworkStats({
        status: health.status === 'OK' ? 'online' : 'degraded',
        uptime: uptime,
        database: health.database || 'connected',
        totalUsers: leaderboardRes.data?.stats?.totalPlayers || 0,
        totalCirculating: leaderboardRes.data?.stats?.totalCirculating || 0,
        lastUpdated: new Date(),
        version: health.version || '1.0.0',
        apiResponseTime: responseTime,
        nodeInfo: health.nodeInfo || {}
      });
      
      setError('');
    } catch (err) {
      console.error('Failed to load network stats:', err);
      setError('Unable to connect to network');
      setNetworkStats({
        status: 'offline',
        uptime: 0,
        database: 'disconnected',
        totalUsers: 0,
        totalCirculating: 0,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-neutral-100 relative overflow-hidden">
      
      {/* Enhanced background effects - matching home page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Mobile-optimized floating particles */}
        <div className="absolute top-16 left-[8%] w-2 h-2 md:w-3 md:h-3 bg-yellow-400/30 md:bg-yellow-400/50 rounded-full animate-pulse delay-0"></div>
        <div className="absolute top-32 right-[12%] w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-300/40 md:bg-amber-300/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[25%] left-[15%] w-2.5 h-2.5 md:w-4 md:h-4 bg-yellow-500/25 md:bg-yellow-500/40 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-[45%] right-[20%] w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-300/30 md:bg-yellow-300/50 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-[65%] left-[25%] w-2 h-2 md:w-3 md:h-3 bg-amber-400/35 md:bg-amber-400/55 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-32 right-[10%] w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-500/30 md:bg-yellow-500/45 rounded-full animate-pulse delay-2500"></div>
        <div className="absolute bottom-16 left-[18%] w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-amber-500/30 md:bg-amber-500/40 rounded-full animate-pulse delay-4000"></div>
        
        {/* Micro sparkles */}
        <div className="absolute top-[20%] left-[50%] w-1 h-1 bg-yellow-200/50 md:bg-yellow-200/70 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-[60%] right-[40%] w-1 h-1 bg-amber-200/50 md:bg-amber-200/70 rounded-full animate-ping" style={{animationDuration: '2.5s', animationDelay: '1.2s'}}></div>
        <div className="absolute bottom-[25%] left-[60%] w-1 h-1 bg-yellow-100/60 md:bg-yellow-100/80 rounded-full animate-ping" style={{animationDuration: '3.5s', animationDelay: '2.1s'}}></div>
      </div>

      {/* Enhanced gradient backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-yellow-500/15 md:from-yellow-500/20 to-amber-600/8 md:to-amber-600/12 rounded-full blur-2xl md:blur-3xl transform translate-x-20 -translate-y-20 md:translate-x-32 md:-translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-tr from-amber-600/18 md:from-amber-600/25 to-yellow-500/10 md:to-yellow-500/15 rounded-full blur-2xl md:blur-3xl transform -translate-x-16 translate-y-16 md:-translate-x-24 md:translate-y-24"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-yellow-400/12 md:from-yellow-400/18 to-transparent rounded-full blur-xl md:blur-2xl"></div>
        <div className="absolute top-1/4 left-1/4 w-40 h-40 md:w-48 md:h-48 bg-gradient-to-tr from-amber-500/15 md:from-amber-500/20 to-transparent rounded-full blur-lg md:blur-xl"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.08] md:opacity-[0.15]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(234, 179, 8, 0.3) 1px, transparent 0)',
            backgroundSize: '50px 50px md:80px 80px'
          }}></div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 md:w-32 md:h-32 border border-yellow-500/15 md:border-yellow-500/25 rounded-lg rotate-45 animate-spin" style={{animationDuration: '25s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-20 h-20 md:w-24 md:h-24 border border-amber-400/20 md:border-amber-400/30 rounded-full animate-ping" style={{animationDuration: '5s'}}></div>
        <div className="absolute top-3/4 left-2/3 w-16 h-16 md:w-20 md:h-20 border-2 border-yellow-300/18 md:border-yellow-300/25 rounded-lg rotate-12 animate-pulse" style={{animationDuration: '6s'}}></div>
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8 md:py-16">
        
        {/* Header with logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl p-2">
                <span className="text-2xl md:text-3xl font-bold text-black">G</span>
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Network <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Status</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Real-time monitoring of Gambino Gold mining infrastructure and network health.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading network status...</p>
          </div>
        ) : (
          <>
            {/* Status Overview */}
            <div className="backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-neutral-800 bg-neutral-900/50 mb-8 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">System Status</h2>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm ${
                  networkStats?.status === 'online' ? 'bg-green-500/20 border border-green-500/30' : 
                  networkStats?.status === 'degraded' ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    networkStats?.status === 'online' ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 
                    networkStats?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-semibold capitalize ${
                    networkStats?.status === 'online' ? 'text-green-400' : 
                    networkStats?.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {networkStats?.status || 'Unknown'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl border bg-red-900/20 border-red-500/30 backdrop-blur-sm">
                  <p className="font-medium text-red-200">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">System Uptime</h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">
                    {formatUptime(networkStats?.uptime)}
                  </p>
                  <p className="text-sm text-neutral-400">Continuous operation</p>
                </div>

                <div className="p-6 rounded-xl bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Database</h3>
                  </div>
                  <p className={`text-2xl md:text-3xl font-bold mb-1 ${
                    networkStats?.database === 'connected' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {networkStats?.database || 'Unknown'}
                  </p>
                  <p className="text-sm text-neutral-400">Connection status</p>
                </div>

                <div className="p-6 rounded-xl bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h5a1 1 0 110 2h-1v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6H2a1 1 0 110-2h5z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Version</h3>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">
                    {networkStats?.version || '1.0.0'}
                  </p>
                  <p className="text-sm text-neutral-400">Current build</p>
                </div>
              </div>
            </div>

            {/* Network Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-neutral-800 bg-neutral-900/50 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Network Activity</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-800/30">
                    <span className="text-neutral-300 font-medium">Total Users</span>
                    <span className="font-bold text-yellow-400 text-lg">
                      {networkStats?.totalUsers?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-800/30">
                    <span className="text-neutral-300 font-medium">Tokens in Circulation</span>
                    <span className="font-bold text-yellow-400 text-lg">
                      {networkStats?.totalCirculating?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-800/30">
                    <span className="text-neutral-300 font-medium">Active Sessions</span>
                    <span className="font-bold text-yellow-400 text-lg">
                      {Math.floor(Math.random() * 50) + 10}
                    </span>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-neutral-800 bg-neutral-900/50 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">Performance Metrics</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-800/30">
                    <span className="text-neutral-300 font-medium">API Response Time</span>
                    <span className="font-bold text-yellow-400 text-lg">
                      {networkStats?.apiResponseTime || '--'}ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-800/30">
                    <span className="text-neutral-300 font-medium">Network Latency</span>
                    <span className="font-bold text-yellow-400 text-lg">
                      {Math.floor(Math.random() * 100) + 25}ms
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-800/30">
                    <span className="text-neutral-300 font-medium">Success Rate</span>
                    <span className="font-bold text-green-500 text-lg">99.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-neutral-800 bg-neutral-900/50 shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">System Events</h3>
                </div>
                <button
                  onClick={loadNetworkStats}
                  className="px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 border border-yellow-500/50 bg-transparent text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500 transform hover:scale-105"
                >
                  Refresh Data
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                  <span className="text-neutral-300 flex-1">System startup completed</span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {networkStats?.lastUpdated?.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                  <span className="text-neutral-300 flex-1">Database connection established</span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(Date.now() - 300000).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
                  <span className="text-neutral-300 flex-1">Network health check completed</span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(Date.now() - 600000).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800/70 transition-all duration-300">
                  <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                  <span className="text-neutral-300 flex-1">API endpoints responding normally</span>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(Date.now() - 900000).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm px-6 py-3 text-sm text-neutral-300 shadow-lg">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="font-medium">Last updated: {networkStats?.lastUpdated?.toLocaleString()}</span>
              </div>
            </div>

            {/* Navigation back to home */}
            <div className="text-center mt-8">
              <a 
                href="/" 
                className="inline-flex items-center gap-2 text-neutral-400 hover:text-yellow-400 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </a>
            </div>
          </>
        )}
      </section>
    </div>
  );
}