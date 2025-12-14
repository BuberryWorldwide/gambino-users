// src/app/login/page.js - Gambino Gold professional login page
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    login,
    loading,
    error,
    isAuthenticated,
    clearError,
    errorCode
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
      setUnverifiedEmail(null);
      setResendSuccess(false);
      const result = await login(email.trim(), password, remember);

      // Check if login returned an unverified email error
      if (result?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(result.email || email.trim());
      }
    } catch (err) {
      console.error('Login failed:', err);
      // Check if the error response contains email not verified code
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(err.response.data.email || email.trim());
      }
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setResending(true);
    setResendSuccess(false);

    try {
      await api.post('/api/users/resend-verification', { email: unverifiedEmail });
      setResendSuccess(true);
    } catch (err) {
      console.error('Failed to resend verification:', err);
    } finally {
      setResending(false);
    }
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
    }
    setUnverifiedEmail(null);
    setResendSuccess(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-8">
      {/* Background is in layout.js */}

      <div className="w-full max-w-md mx-auto px-4 relative z-10">
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
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
              <span className="text-white">Sign in to </span>
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Gambino Gold
              </span>
            </h1>
            <p className="text-neutral-400 text-sm">Access your dashboard and wallet</p>
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

                  {/* Resend verification option for unverified emails */}
                  {unverifiedEmail && (
                    <div className="mt-3 pt-3 border-t border-red-500/20">
                      {resendSuccess ? (
                        <p className="text-green-300 text-sm">Verification email sent! Check your inbox.</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resending}
                          className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {resending ? 'Sending...' : 'Resend verification email'}
                        </button>
                      )}
                    </div>
                  )}
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

          {/* Footer Links */}
          <div className="text-center mt-6 space-y-4">
            <p className="text-sm text-neutral-400">
              Don't have an account?{' '}
              <Link href="/onboard" className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                Create one here
              </Link>
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
              <Link href="https://gambino.gold/legal/terms" className="hover:text-neutral-400 transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link href="https://gambino.gold/legal/privacy" className="hover:text-neutral-400 transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link href="https://gambino.gold/support" className="hover:text-neutral-400 transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}