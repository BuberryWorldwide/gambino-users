// src/app/login/page.js - Gambino Gold professional login page
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  
  const { 
    login, 
    loading, 
    error, 
    isAuthenticated, 
    clearError 
  } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      return;
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      return;
    }

    try {
      clearError();
      await login(email.trim(), password, remember);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 border border-yellow-600/10 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full space-y-8">
          
          {/* Professional Header */}
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-2xl p-2">
                  <img 
                    src="/logo.png" 
                    alt="Gambino Gold Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
              </div>
            </div>
            
            {/* Brand Identity */}
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                GAMBINO GOLD
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-2">Mining Infrastructure Platform</p>
            <p className="text-gray-400 text-sm">Access Network Dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <p className="text-red-200 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleInputChange();
                    }}
                    className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleInputChange();
                    }}
                    className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 text-yellow-400 bg-gray-700/50 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
                    disabled={loading}
                  />
                  <label htmlFor="remember" className="ml-3 text-sm text-gray-300">
                    Stay signed in
                  </label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Reset password
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                    Accessing Network...
                  </div>
                ) : (
                  'Access Network'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <div className="border-t border-gray-700/50 pt-6">
                <p className="text-gray-400 text-sm mb-4">
                  Need network access?
                </p>
                <Link 
                  href="/register" 
                  className="inline-flex items-center px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-yellow-400 hover:text-yellow-300 font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-yellow-400/30"
                >
                  Request Access
                </Link>
              </div>
            </div>
          </div>

          {/* Professional Footer */}
          <div className="text-center text-gray-500 text-xs space-y-1">
            <p>© 2025 Gambino Gold. Mining infrastructure platform.</p>
            <p>Building sustainable community wealth through transparent technology.</p>
          </div>
        </div>
      </div>
    </div>
  );
}