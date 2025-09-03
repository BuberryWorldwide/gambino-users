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
      const response = await api.post('/api/machine/validate-binding', { token });
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

      const response = await api.post('/api/machine/bind', { 
        token,
        machineId: machineInfo.machineId,
        storeId: machineInfo.storeId
      });

      if (response.data.success) {
        setBound(true);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Machine already in use
        setExistingSession(err.response.data.session);
        setError('This machine is currently in use by another player');
      } else {
        setError(err.response?.data?.error || 'Failed to bind to machine');
      }
    } finally {
      setBinding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Validating machine...</p>
        </div>
      </div>
    );
  }

  if (error && !machineInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-white mb-2">Invalid QR Code</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <Link 
              href="/dashboard"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg inline-block"
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎰</div>
            <h1 className="text-xl font-bold text-white mb-2">Successfully Bound!</h1>
            <p className="text-gray-400 mb-4">
              You're now connected to <strong className="text-white">{machineInfo?.name || machineInfo?.machineId}</strong>
            </p>
            <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg mb-4">
              <p className="text-green-300 text-sm">
                Your gaming session has started. You can now play on this machine.
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/dashboard"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-center"
              >
                Dashboard
              </Link>
              <Link 
                href="/account"
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-center"
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎰</div>
              <h1 className="text-xl font-bold text-white mb-2">Machine Access</h1>
              {machineInfo && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h2 className="font-medium text-white">{machineInfo.name || machineInfo.machineId}</h2>
                  <p className="text-sm text-gray-400">{machineInfo.location || 'Gaming machine'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {machineInfo.storeName} • {machineInfo.gameType || 'Game'}
                  </p>
                </div>
              )}
              <p className="text-gray-400 mb-4">
                Please log in to bind to this machine and start playing.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-medium mb-3"
            >
              Log In to Play
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Don't have an account?</p>
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⏳</div>
              <h1 className="text-xl font-bold text-white mb-2">Machine In Use</h1>
              {machineInfo && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h2 className="font-medium text-white">{machineInfo.name || machineInfo.machineId}</h2>
                  <p className="text-sm text-gray-400">{machineInfo.location || 'Gaming machine'}</p>
                </div>
              )}
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mb-4">
                <p className="text-yellow-300 text-sm">
                  This machine is currently being used by another player.
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
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-center"
              >
                Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎮</div>
            <h1 className="text-xl font-bold text-white mb-2">Ready to Play!</h1>
            <p className="text-sm text-gray-400 mb-4">Welcome back, {user?.firstName || user?.email}</p>
            
            {machineInfo && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h2 className="font-medium text-white">{machineInfo.name || machineInfo.machineId}</h2>
                <p className="text-sm text-gray-400">{machineInfo.location || 'Gaming machine'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {machineInfo.storeName} • {machineInfo.gameType || 'Game'}
                </p>
                <div className="flex items-center justify-center mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    machineInfo.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
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
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium mb-3"
          >
            {binding ? 'Connecting...' : 'Connect to Machine'}
          </button>

          <div className="flex gap-3 text-sm">
            <Link 
              href="/dashboard"
              className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Dashboard
            </Link>
            <Link 
              href="/leaderboard"
              className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <MachineBinder />
    </Suspense>
  );
}