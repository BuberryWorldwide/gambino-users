'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call your password reset endpoint
      const response = await api.post('/api/auth/forgot-password', { email });
      
      if (response.data.success) {
        setMessage('If an account exists with this email, you will receive password reset instructions.');
        setTimeout(() => router.push('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-gray-700/50">
        <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-gray-400 mb-6">Enter your email to receive reset instructions</p>
        
        {message && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
            <p className="text-green-400">{message}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}