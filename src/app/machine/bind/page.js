'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function MachineBinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [machineInfo, setMachineInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [binding, setBinding] = useState(false);
  const [bound, setBound] = useState(false);
  const [existingSession, setExistingSession] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid QR code - missing binding token');
      setLoading(false);
      return;
    }
    
    validateTokenAndLoadMachine();
    checkUserAuth();
  }, [token]);

  const validateTokenAndLoadMachine = async () => {
    try {
      // Decode and validate the binding token to get machine info
      const response = await api.post('/api/machines/validate-binding', { token });
      setMachineInfo(response.data.machine);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid or expired QR code');
      } else {
        setError(err.response?.data?.error || 'Failed to validate machine');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setUser(response.data.user);
    } catch (err) {
      // User not logged in - we'll handle this in the UI
      setUser(null);
    }
  };

  const handleLogin = () => {
    const returnUrl = `/machine/bind?token=${encodeURIComponent(token)}`;
    router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
  };

  const handleBind = async () => {
    if (!user || !machineInfo || binding) return;

    try {
      setBinding(true);
      setError('');

      const response = await api.post('/api/machines/bind', { 
        token,
        machineId: machineInfo.machineId,
        storeId: machineInfo.storeId
      });

      if (response.data.success) {
        setBound(true);
        // Store session info for success display
        setSessionInfo(response.data.session);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Machine already in use or user has active session
        if (err.response.data.currentSession) {
          // User has active session elsewhere
          setError(`You already have an active session on machine ${err.response.data.currentSession.machineId}. Please end that session first.`);
        } else if (err.response.data.session) {
          // Machine in use by someone else
          setExistingSession(err.response.data.session);
          setError('This machine is currently in use by another user');
        } else {
          setError(err.response.data.error || 'Machine or user conflict');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to bind to machine');
      }
    } finally {
      setBinding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Validating machine...</p>
        </div>
      </div>
    );
  }

  if (error && !machineInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="max-w-md w-full">
          <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6 text-center">
            <h1 className="text-xl font-bold text-white mb-2">Invalid QR Code</h1>
            <p className="text-neutral-400 mb-4">{error}</p>
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold px-4 py-2 rounded-lg inline-block transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (bound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="max-w-md w-full">
          <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6 text-center">
            <h1 className="text-xl font-bold text-green-400 mb-2">Successfully Connected!</h1>
            <p className="text-neutral-400 mb-4">
              You're now bound to <strong className="text-white">{machineInfo?.name || machineInfo?.machineId}</strong>
            </p>

            {sessionInfo && (
              <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-4">
                <div className="text-left">
                  <p className="text-green-300 text-sm font-medium mb-2">Session Details:</p>
                  <div className="space-y-1 text-xs text-green-400">
                    <p>Machine: {sessionInfo.machineName}</p>
                    <p>Location: {sessionInfo.storeName}</p>
                    <p>Started: {new Date(sessionInfo.startedAt).toLocaleTimeString()}</p>
                    <p>Session ID: {sessionInfo.sessionId}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-4">
              <p className="text-blue-300 text-sm">
                Your session is now active. The machine is reserved for you.
                You can view your session status anytime from your dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold px-4 py-2 rounded-lg text-center transition-all"
              >
                View Dashboard
              </Link>
              <Link
                href="/dashboard?tab=account"
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 rounded-lg text-center transition-all"
              >
                My Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="max-w-md w-full">
          <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white mb-2">Machine Access</h1>
              {machineInfo && (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-4">
                  <h2 className="font-medium text-white">{machineInfo.name || machineInfo.machineId}</h2>
                  <p className="text-sm text-neutral-400">{machineInfo.location || 'Mining station'}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {machineInfo.storeName} • {machineInfo.sessionType || machineInfo.gameType || 'Mining'}
                  </p>
                </div>
              )}
              <p className="text-neutral-400 mb-4">
                Please log in to bind to this machine and start mining.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold py-3 px-4 rounded-lg mb-3 transition-all"
            >
              Log In to Mine
            </button>

            <div className="text-center">
              <p className="text-sm text-neutral-400 mb-2">Don't have an account?</p>
              <Link
                href="/onboard"
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (existingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="max-w-md w-full">
          <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white mb-2">Machine In Use</h1>
              {machineInfo && (
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-4">
                  <h2 className="font-medium text-white">{machineInfo.name || machineInfo.machineId}</h2>
                  <p className="text-sm text-neutral-400">{machineInfo.location || 'Mining station'}</p>
                </div>
              )}
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-4">
                <p className="text-yellow-300 text-sm">
                  This machine is currently being used by another user.
                </p>
                {existingSession?.estimatedWaitTime && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Estimated wait time: {existingSession.estimatedWaitTime}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 rounded-lg text-center transition-all"
              >
                Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="max-w-md w-full">
        <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white mb-2">Ready to Mine!</h1>
            <p className="text-sm text-neutral-400 mb-4">Welcome back, {user?.firstName || user?.email}</p>

            {machineInfo && (
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mb-4">
                <h2 className="font-medium text-white">{machineInfo.name || machineInfo.machineId}</h2>
                <p className="text-sm text-neutral-400">{machineInfo.location || 'Mining station'}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {machineInfo.storeName} • {machineInfo.sessionType || machineInfo.gameType || 'Mining'}
                </p>
                <div className="flex items-center justify-center mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    machineInfo.status === 'active'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {machineInfo.status}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleBind}
            disabled={binding || machineInfo?.status !== 'active'}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-black disabled:text-neutral-400 font-semibold py-3 px-4 rounded-lg mb-3 transition-all"
          >
            {binding ? 'Connecting...' : 'Connect to Machine'}
          </button>

          <div className="flex gap-3 text-sm">
            <Link
              href="/dashboard"
              className="flex-1 text-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className="flex-1 text-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MachineBindPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <MachineBinder />
    </Suspense>
  );
}