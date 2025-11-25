// src/app/page.js - Enhanced with mobile background effects
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-400 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background is now in layout.js */}

      <div className="mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Enhanced Hero with better mobile styling */}
        <div className="text-center py-12 md:py-16">
          {/* Logo area with glow effect */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center shadow-2xl">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="text-white">Access the </span>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Gambino Gold
            </span>
            <span className="text-white"> Network</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            Manage your utility tokens, track your participation, and access mining infrastructure tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboard" className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25">
              Get Started
            </Link>
            <Link href="/network" className="inline-flex items-center justify-center rounded-xl border border-yellow-500/50 bg-transparent px-8 py-4 text-lg font-semibold text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500 transition-all duration-300">
              Network Status
            </Link>
          </div>
        </div>

        {/* Enhanced Navigation Cards with better mobile effects */}
        <div className="grid gap-6 md:grid-cols-3 mt-12">
          <Link href="/dashboard" className="group block p-6 rounded-2xl backdrop-blur-sm border border-neutral-800 hover:border-yellow-500/30 bg-neutral-900/50 hover:bg-neutral-900/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-yellow-500/20 group-hover:bg-yellow-500/30 flex items-center justify-center transition-all duration-300">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">Dashboard</h3>
              <p className="text-neutral-400 text-sm group-hover:text-neutral-300 transition-colors">
                Track your balance and wallet activity
              </p>
            </div>
          </Link>
          
          <Link href="/network" className="group block p-6 rounded-2xl backdrop-blur-sm border border-neutral-800 hover:border-yellow-500/30 bg-neutral-900/50 hover:bg-neutral-900/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-yellow-500/20 group-hover:bg-yellow-500/30 flex items-center justify-center transition-all duration-300">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">Network Status</h3>
              <p className="text-neutral-400 text-sm group-hover:text-neutral-300 transition-colors">
                Real-time infrastructure monitoring
              </p>
            </div>
          </Link>
          
          <Link href="/help" className="group block p-6 rounded-2xl backdrop-blur-sm border border-neutral-800 hover:border-yellow-500/30 bg-neutral-900/50 hover:bg-neutral-900/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-yellow-500/20 group-hover:bg-yellow-500/30 flex items-center justify-center transition-all duration-300">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">Help & Support</h3>
              <p className="text-neutral-400 text-sm group-hover:text-neutral-300 transition-colors">
                Documentation and troubleshooting
              </p>
            </div>
          </Link>
        </div>

        {/* Status Bar */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-300 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            Network Online
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center text-xs text-neutral-500">
          <p>18+ only at licensed partner venues. <a href="https://gambino.gold/legal/terms" className="text-yellow-500/70 hover:text-yellow-400">Terms</a> apply.</p>
        </div>
      </div>
    </div>
  );
}