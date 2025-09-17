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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-400 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-neutral-100 relative overflow-hidden">
      
      {/* Enhanced background effects - optimized for mobile */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Mobile-optimized floating particles */}
        <div className="absolute top-16 left-[8%] w-2 h-2 md:w-3 md:h-3 bg-yellow-400/30 md:bg-yellow-400/50 rounded-full animate-pulse delay-0"></div>
        <div className="absolute top-32 right-[12%] w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-300/40 md:bg-amber-300/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[25%] left-[15%] w-2.5 h-2.5 md:w-4 md:h-4 bg-yellow-500/25 md:bg-yellow-500/40 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-[45%] right-[20%] w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-300/30 md:bg-yellow-300/50 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-[65%] left-[25%] w-2 h-2 md:w-3 md:h-3 bg-amber-400/35 md:bg-amber-400/55 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-32 right-[10%] w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-500/30 md:bg-yellow-500/45 rounded-full animate-pulse delay-2500"></div>
        <div className="absolute bottom-16 left-[18%] w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-amber-500/30 md:bg-amber-500/40 rounded-full animate-pulse delay-4000"></div>
        
        {/* Micro sparkles - visible on mobile */}
        <div className="absolute top-[20%] left-[50%] w-1 h-1 bg-yellow-200/50 md:bg-yellow-200/70 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-[60%] right-[40%] w-1 h-1 bg-amber-200/50 md:bg-amber-200/70 rounded-full animate-ping" style={{animationDuration: '2.5s', animationDelay: '1.2s'}}></div>
        <div className="absolute bottom-[25%] left-[60%] w-1 h-1 bg-yellow-100/60 md:bg-yellow-100/80 rounded-full animate-ping" style={{animationDuration: '3.5s', animationDelay: '2.1s'}}></div>
      </div>

      {/* Enhanced gradient backgrounds - mobile visible */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-yellow-500/15 md:from-yellow-500/20 to-amber-600/8 md:to-amber-600/12 rounded-full blur-2xl md:blur-3xl transform translate-x-20 -translate-y-20 md:translate-x-32 md:-translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-tr from-amber-600/18 md:from-amber-600/25 to-yellow-500/10 md:to-yellow-500/15 rounded-full blur-2xl md:blur-3xl transform -translate-x-16 translate-y-16 md:-translate-x-24 md:translate-y-24"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-yellow-400/12 md:from-yellow-400/18 to-transparent rounded-full blur-xl md:blur-2xl"></div>
        <div className="absolute top-1/4 left-1/4 w-40 h-40 md:w-48 md:h-48 bg-gradient-to-tr from-amber-500/15 md:from-amber-500/20 to-transparent rounded-full blur-lg md:blur-xl"></div>
        
        {/* Mobile-visible grid pattern */}
        <div className="absolute inset-0 opacity-[0.08] md:opacity-[0.15]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(234, 179, 8, 0.3) 1px, transparent 0)',
            backgroundSize: '50px 50px md:80px 80px'
          }}></div>
        </div>
        
        {/* Mobile-visible geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 md:w-32 md:h-32 border border-yellow-500/15 md:border-yellow-500/25 rounded-lg rotate-45 animate-spin" style={{animationDuration: '25s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-20 h-20 md:w-24 md:h-24 border border-amber-400/20 md:border-amber-400/30 rounded-full animate-ping" style={{animationDuration: '5s'}}></div>
        <div className="absolute top-3/4 left-2/3 w-16 h-16 md:w-20 md:h-20 border-2 border-yellow-300/18 md:border-yellow-300/25 rounded-lg rotate-12 animate-pulse" style={{animationDuration: '6s'}}></div>
      </div>
      
      <div className="mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Enhanced Hero with better mobile styling */}
        <div className="text-center py-12 md:py-16">
          {/* Logo area with glow effect */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl p-2">
                <span className="text-2xl md:text-3xl font-bold text-black">G</span>
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              GAMBINO
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-md mx-auto">
            Farm Luck. Mine Destiny.
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

        {/* Enhanced Status Bar */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm px-6 py-3 text-sm text-neutral-300 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="font-medium">Network Online</span>
            <span className="text-neutral-500">•</span>
            <span>Ready to Use</span>
          </div>
        </div>
      </div>
    </div>
  );
}