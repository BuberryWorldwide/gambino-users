// src/app/admin/users/[userId]/page.js
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function AdminUserDetailPage({ params }) {
  const resolvedParams = use(params);
  const userId = resolvedParams?.userId;
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [sessions, setSessions] = useState([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
    tier: 'bronze',
    gambinoBalance: 0,
    gluckScore: 0,
    isActive: true
  });

  useEffect(() => {
    const userData = getUser();
    setCurrentUser(userData);
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user details
      const { data } = await api.get(`/api/admin/users/${userId}`);
      const userData = data.user || data;
      
      setUser(userData);
      setEditForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'user',
        tier: userData.tier || 'bronze',
        gambinoBalance: userData.gambinoBalance || 0,
        gluckScore: userData.gluckScore || 0,
        isActive: userData.isActive !== false
      });
      
      // Try to load sessions but don't fail if endpoint doesn't exist
      loadUserSessions();
      
    } catch (err) {
      console.error('Failed to load user:', err);
      setError(err?.response?.data?.error || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSessions = async () => {
    try {
      const { data } = await api.get(`/api/admin/sessions/user/${userId}`);
      setSessions(data.sessions || []);
    } catch (err) {
      console.log('Could not load sessions');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      const updates = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        tier: editForm.tier,
        isActive: editForm.isActive
      };
      
      // Only super admins can update balance and scores
      if (currentUser?.role === 'super_admin') {
        updates.gambinoBalance = parseFloat(editForm.gambinoBalance) || 0;
        updates.gluckScore = parseInt(editForm.gluckScore) || 0;
      }
      
      await api.put(`/api/admin/users/${userId}`, updates);
      await loadUserData();
      alert('User updated successfully');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Send password reset email to this user?')) return;
    
    try {
      await api.post(`/api/admin/users/${userId}/reset-password`);
      alert('Password reset email sent');
    } catch (err) {
      alert('Failed to send reset email');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete ${user.email}? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/api/admin/users/${userId}`);
      router.push('/admin/users');
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const StatusBadge = ({ status }) => {
    const isActive = status !== false;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
        isActive 
          ? 'bg-green-900/20 border-green-500/30 text-green-300'
          : 'bg-red-900/20 border-red-500/30 text-red-300'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const TierBadge = ({ tier }) => {
    const colors = {
      bronze: 'bg-orange-900/20 border-orange-500/30 text-orange-300',
      silver: 'bg-gray-900/20 border-gray-400/30 text-gray-300',
      gold: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
      platinum: 'bg-purple-900/20 border-purple-500/30 text-purple-300',
      diamond: 'bg-cyan-900/20 border-cyan-500/30 text-cyan-300'
    };
    
    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${colors[tier] || colors.bronze}`}>
        {tier?.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl text-white font-medium">Loading user details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-8 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
            <p className="text-red-200 mb-6">{error || 'The requested user could not be found.'}</p>
            <Link href="/admin/users" className="inline-flex px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
              ← Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin/users" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl flex items-center justify-center border border-gray-600/30">
                  ←
                </div>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <StatusBadge status={user.isActive} />
                  <TierBadge tier={user.tier} />
                  <span className="text-gray-400 text-sm">Role: {user.role}</span>
                  {currentUser?.role === 'super_admin' && (
                    <span className="text-yellow-400 text-sm font-medium">• Super Admin Mode</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
              >
                Reset Password
              </button>
              
              {currentUser?.role === 'super_admin' && (
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                  Delete User
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-6 border-b border-gray-700/50">
              {[
                { id: 'details', label: 'User Details', icon: '👤' },
                { id: 'wallet', label: 'Wallet & Balance', icon: '💰' },
                { id: 'sessions', label: 'Game Sessions', icon: '🎮' },
                { id: 'activity', label: 'Activity Log', icon: '📊' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-yellow-400 border-yellow-400'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Edit Form */}
              <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
                <h2 className="text-2xl font-bold text-white mb-6">Edit User Details</h2>
                
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">First Name</label>
                      <input 
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">Last Name</label>
                      <input 
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">Email</label>
                      <input 
                        type="email"
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">Phone</label>
                      <input 
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">Role</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        disabled={currentUser?.role !== 'super_admin'}
                      >
                        <option value="user">User</option>
                        <option value="venue_staff">Venue Staff</option>
                        <option value="venue_manager">Venue Manager</option>
                        <option value="gambino_ops">Gambino Ops</option>
                        {currentUser?.role === 'super_admin' && (
                          <option value="super_admin">Super Admin</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">Tier</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.tier}
                        onChange={(e) => setEditForm({...editForm, tier: e.target.value})}
                      >
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="platinum">Platinum</option>
                        <option value="diamond">Diamond</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">Status</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                        value={editForm.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'active'})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {currentUser?.role === 'super_admin' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-3">Gambino Balance</label>
                          <input 
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                            value={editForm.gambinoBalance}
                            onChange={(e) => setEditForm({...editForm, gambinoBalance: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-3">Gluck Score</label>
                          <input 
                            type="number"
                            className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                            value={editForm.gluckScore}
                            onChange={(e) => setEditForm({...editForm, gluckScore: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button 
                      type="button"
                      onClick={loadUserData}
                      className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 font-medium rounded-xl"
                      disabled={saving}
                    >
                      Reset
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-200">{error}</p>
                  </div>
                )}
              </div>

              {/* User Info Panel */}
              <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
                <h2 className="text-2xl font-bold text-white mb-6">User Information</h2>
                <div className="space-y-6">
                  <div>
                    <div className="text-gray-400 text-sm font-medium mb-2">User ID</div>
                    <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 text-xs">
                      {user._id || user.id}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm font-medium mb-2">Created</div>
                    <div className="text-white">
                      {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm font-medium mb-2">Last Activity</div>
                    <div className="text-white">
                      {user.lastActivity 
                        ? `${new Date(user.lastActivity).toLocaleDateString()} at ${new Date(user.lastActivity).toLocaleTimeString()}`
                        : 'Never'
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-sm font-medium mb-2">Stats</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Jackpots:</span>
                        <span className="text-white">{user.totalJackpots || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Major Jackpots:</span>
                        <span className="text-white">{user.majorJackpots || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Machines Played:</span>
                        <span className="text-white">{user.machinesPlayed || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">Wallet & Balance Information</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-2">Wallet Address</div>
                  {user.walletAddress ? (
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 text-sm flex-1">
                        {user.walletAddress}
                      </div>
                      <a
                        href={`https://solscan.io/account/${user.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-medium rounded-lg"
                      >
                        View on Solscan
                      </a>
                    </div>
                  ) : (
                    <div className="text-gray-500">No wallet connected</div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                    <div className="text-gray-400 text-sm mb-2">Gambino Balance</div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {Number(user.cachedGambinoBalance || user.gambinoBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">GG Tokens</div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                    <div className="text-gray-400 text-sm mb-2">SOL Balance</div>
                    <div className="text-3xl font-bold text-blue-400">
                      {Number(user.cachedSolBalance || 0).toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Solana</div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
                    <div className="text-gray-400 text-sm mb-2">USDC Balance</div>
                    <div className="text-3xl font-bold text-green-400">
                      {Number(user.cachedUsdcBalance || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">USD Coin</div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                  <div className="text-sm text-gray-400">
                    Last Updated: {user.balanceLastUpdated 
                      ? new Date(user.balanceLastUpdated).toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50">
                <h2 className="text-2xl font-bold text-white">Recent Game Sessions</h2>
              </div>
              
              {sessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left py-4 px-6 text-gray-300">Session ID</th>
                        <th className="text-left py-4 px-6 text-gray-300">Machine</th>
                        <th className="text-left py-4 px-6 text-gray-300">Store</th>
                        <th className="text-left py-4 px-6 text-gray-300">Duration</th>
                        <th className="text-left py-4 px-6 text-gray-300">Status</th>
                        <th className="text-left py-4 px-6 text-gray-300">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session._id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                          <td className="py-4 px-6 font-mono text-yellow-400 text-sm">
                            {session.sessionId}
                          </td>
                          <td className="py-4 px-6 text-white">{session.machineName}</td>
                          <td className="py-4 px-6 text-gray-300">{session.storeName}</td>
                          <td className="py-4 px-6 text-gray-300">
                            {session.duration ? `${Math.round(session.duration / 60)} min` : 'Active'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              session.status === 'active' 
                                ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                                : 'bg-gray-900/30 border border-gray-500/30 text-gray-300'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-300 text-sm">
                            {new Date(session.startedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">🎮</div>
                  <p className="text-gray-400">No game sessions found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-12 border border-gray-700/50 text-center">
              <div className="text-gray-400 text-8xl mb-6">📊</div>
              <h2 className="text-3xl font-bold text-white mb-4">Activity Log</h2>
              <p className="text-gray-400 text-lg">
                Detailed activity tracking coming soon. This will include login history, 
                gameplay patterns, and transaction logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}