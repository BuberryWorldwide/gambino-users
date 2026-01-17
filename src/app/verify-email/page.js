// src/app/verify-email/page.js
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'already-verified'
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendError('Please enter a valid email address');
      return;
    }
    setResending(true);
    setResendError('');
    try {
      await api.post('/api/users/resend-verification', { email: resendEmail });
      setResendSuccess(true);
    } catch (err) {
      setResendError(err.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided. Please check your email link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const { data } = await api.post('/api/users/verify-email', { token });

        if (data.alreadyVerified) {
          setStatus('already-verified');
        } else if (data.success) {
          setStatus('success');
          // Store the token for auto-login
          if (data.accessToken) {
            setToken(data.accessToken);
          }
        }
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed. Please try again or request a new link.');
      }
    };

    verifyEmail();
  }, [token]);

  // Countdown for redirect
  useEffect(() => {
    if (status === 'success' || status === 'already-verified') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="mx-auto max-w-md px-4 py-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl p-2">
                <span className="text-2xl font-bold text-black">G</span>
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="text-center backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="w-full h-full border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verifying Your Email</h2>
            <p className="text-neutral-400">Please wait a moment...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-3">
              Email Verified!
            </h2>
            <p className="text-neutral-300 mb-6">
              Your account is now active. Welcome to Gambino Gold!
            </p>
            <div className="bg-neutral-800/50 rounded-xl p-4 mb-6 border border-neutral-700/50">
              <p className="text-neutral-400 text-sm">
                Redirecting to dashboard in {countdown} seconds...
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:from-yellow-500 hover:to-amber-600 transition-all duration-300"
            >
              Go to Dashboard Now
            </button>
          </div>
        )}

        {/* Already Verified State */}
        {status === 'already-verified' && (
          <div className="text-center backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-3">
              Already Verified
            </h2>
            <p className="text-neutral-300 mb-6">
              Your email has already been verified. You can log in to your account.
            </p>
            <div className="bg-neutral-800/50 rounded-xl p-4 mb-6 border border-neutral-700/50">
              <p className="text-neutral-400 text-sm">
                Redirecting to dashboard in {countdown} seconds...
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:from-yellow-500 hover:to-amber-600 transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-400 to-rose-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent mb-3">
              Verification Failed
            </h2>
            <p className="text-neutral-300 mb-4">{error}</p>

            {/* Resend Verification Form */}
            {resendSuccess ? (
              <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 mb-6">
                <p className="text-green-300 text-sm">
                  Verification email sent! Check your inbox (and spam folder).
                </p>
              </div>
            ) : (
              <form onSubmit={handleResendVerification} className="mb-6">
                <p className="text-neutral-400 text-sm mb-3">
                  Enter your email to receive a new verification link:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 disabled:opacity-50"
                  >
                    {resending ? '...' : 'Send'}
                  </button>
                </div>
                {resendError && (
                  <p className="text-red-400 text-sm mt-2">{resendError}</p>
                )}
              </form>
            )}

            <div className="space-y-3">
              <a
                href="/login"
                className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 text-center"
              >
                Go to Login
              </a>
              <a
                href="/onboard"
                className="block w-full px-6 py-3 rounded-xl border border-neutral-600 text-neutral-300 hover:bg-neutral-800 transition-all duration-300 text-center"
              >
                Create New Account
              </a>
            </div>
          </div>
        )}

        {/* Back to home */}
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
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          <div className="w-full h-full border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
        </div>
        <p className="text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
