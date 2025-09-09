'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = async () => {
  if (loading) return;

  setLoading(true);
  setError('');
  setSuccess(false);
  setIsAdmin(false);

  try {
    // User login
    const userRes = await api.post('/api/users/login', { email, password });
    const userData = userRes?.data;
    
    if (!userData?.success || !userData?.token) {
      setError(userData?.error || 'Login failed');
      return;
    }

    // Try admin login regardless of user login success
    let isAdminUser = false;
    try {
      const adminRes = await api.post('/api/admin/login', { email, password });
      if (adminRes?.data?.success && adminRes?.data?.token) {
        setToken(adminRes.data.token, { remember: true, isAdmin: true });
        localStorage.setItem('role', 'admin');
        localStorage.setItem('adminData', JSON.stringify(adminRes.data.admin || {}));
        setIsAdmin(true);
        setSuccess(true);
        isAdminUser = true;
        
        // Admin login successful - check role for redirect
        const adminUser = adminRes.data.admin || {};
        const userRole = adminUser.role;

        console.log('Admin login data:', adminRes.data);
        console.log('User role:', userRole);

        if (userRole === 'venue_manager') {
          console.log('Venue manager detected, fetching profile...');
          try {
            const profileRes = await api.get('/api/users/profile');
            const assignedVenues = profileRes.data?.user?.assignedVenues || [];
            
            console.log('Assigned venues:', assignedVenues);
            
            if (assignedVenues.length > 0) {
              console.log('Redirecting to store:', assignedVenues[0]);
              setTimeout(() => {
                window.location.href = '/admin/venue';  // Changed this line
              }, 100);
              return;
            }
          } catch (err) {
            console.log('Could not fetch profile for venue redirect:', err);
          }
        }

        // Default admin redirect for other roles
        setTimeout(() => {
          window.location.href = '/admin';
        }, 100);
      }
    } catch (adminError) {
      // Admin login failed, continue with user login
      console.log('Admin login failed, using regular user login');
    }

    // Regular user login (only if not admin)
    if (!isAdminUser) {
      setToken(userData.token, { remember: true, isAdmin: false });
      localStorage.setItem('role', 'user');
      localStorage.setItem('gambino_user', JSON.stringify(userData.user || {}));
      setSuccess(true);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    }

  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Network error. Please try again.';
    setError(msg);
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-8">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-amber-300/40 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-10 w-2 h-2 bg-yellow-500/30 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-yellow-400/40 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-500/8 to-amber-600/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-600/10 to-yellow-500/5 rounded-full blur-3xl transform -translate-x-24 translate-y-24"></div>
      </div>

      <div className="w-full max-w-md mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm text-neutral-300 mb-6">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Member Login
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              GAMBINO
            </span>
          </h1>
          <p className="text-neutral-400 text-sm">Sign in to access your dashboard and wallet</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-900/20 border border-green-500 text-green-300 p-3 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium">
                  {isAdmin ? 'Admin login successful' : 'Login successful'}
                </div>
                <div className="text-xs opacity-90">
                  Redirecting to {isAdmin ? 'admin' : 'dashboard'}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Login Card - NO FORM */}
        <div className="card space-y-6">
          <div className="space-y-4">
            <div>
              <label className="label block mb-2" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <label className="label block mb-2" htmlFor="password">Password</label>
              <input
                id="password" 
                name="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <button 
            disabled={loading || !email || !password} 
            className="btn btn-gold w-full"
            onClick={handleLogin}
            type="button"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-r-transparent" />
                Signing In...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </div>
            )}
          </button>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-4">
          <p className="text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
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
  );
}