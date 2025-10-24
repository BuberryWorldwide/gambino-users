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
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    isActive: true,
    assignedVenues: []
  });

  useEffect(() => {
    const userData = getUser();
    setCurrentUser(userData);
    if (userId) {
      loadUserData();
      loadStores();
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
        isActive: userData.isActive !== false,
        assignedVenues: userData.assignedVenues || []
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

  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const { data } = await api.get('/api/admin/stores');
      setStores(data.stores || []);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoadingStores(false);
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
    setSuccess('');
    
    try {
      const updates = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        tier: editForm.tier,
        isActive: editForm.isActive,
        assignedVenues: editForm.assignedVenues // Include assigned venues
      };
      
      // Only super admins can update balance and scores
      if (currentUser?.role === 'super_admin') {
        updates.gambinoBalance = parseFloat(editForm.gambinoBalance) || 0;
        updates.gluckScore = parseInt(editForm.gluckScore) || 0;
      }
      
      await api.put(`/api/admin/users/${userId}`, updates);
      await loadUserData();
      setSuccess('User updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
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

  // Store assignment functions
  const isStoreAssigned = (storeId) => {
    return editForm.assignedVenues.includes(storeId);
  };

  const toggleStoreAssignment = (storeId) => {
    setEditForm(prev => ({
      ...prev,
      assignedVenues: isStoreAssigned(storeId)
        ? prev.assignedVenues.filter(id => id !== storeId)
        : [...prev.assignedVenues, storeId]
    }));
  };

  const selectAllStores = () => {
    setEditForm(prev => ({
      ...prev,
      assignedVenues: stores.map(s => s.storeId)
    }));
  };

  const clearAllStores = () => {
    setEditForm(prev => ({
      ...prev,
      assignedVenues: []
    }));
  };

  // Filter stores based on search
  const filteredStores = stores.filter(store => 
    store.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6 max-w-md">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => router.push('/admin/users')}
            className="mt-4 text-yellow-400 hover:text-yellow-300"
          >
            ← Back to Users
          </button>
        </div>
      </div>
    );
  }

  const showStoreAssignment = ['venue_manager', 'venue_staff'].includes(editForm.role);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/users"
            className="text-yellow-400 hover:text-yellow-300 mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit User</h1>
          <p className="text-gray-400 mt-1">
            {user?.email}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Details
            </button>
            {showStoreAssignment && (
              <button
                onClick={() => setActiveTab('stores')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'stores'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Store Access ({editForm.assignedVenues.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">First Name</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Last Name</label>
                  <input 
                    type="text"
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
            </div>
          )}

          {/* Store Assignment Tab */}
          {activeTab === 'stores' && showStoreAssignment && (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50">
              {/* Header with Actions */}
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Assigned Stores</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {editForm.assignedVenues.length} of {stores.length} stores selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllStores}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllStores}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search stores by name, ID, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-400"
                  />
                  <svg 
                    className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Store List */}
              <div className="p-6">
                {loadingStores ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading stores...</p>
                  </div>
                ) : filteredStores.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No stores found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStores.map((store) => (
                      <label
                        key={store.storeId}
                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                          isStoreAssigned(store.storeId)
                            ? 'bg-yellow-900/20 border-yellow-600/50'
                            : 'bg-gray-700/20 border-gray-600/30 hover:border-gray-600/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isStoreAssigned(store.storeId)}
                          onChange={() => toggleStoreAssignment(store.storeId)}
                          className="w-5 h-5 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{store.storeName}</p>
                              <p className="text-sm text-gray-400 mt-0.5">
                                {store.storeId} • {store.city}, {store.state}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              store.status === 'active'
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-red-900/30 text-red-300'
                            }`}>
                              {store.status}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
              {sessions.length === 0 ? (
                <p className="text-gray-400">No sessions found</p>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((session, idx) => (
                    <div key={idx} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <p className="text-white">Session {session.sessionId || session._id}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(session.startedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-3">
              {currentUser?.role === 'super_admin' && (
                <>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete User
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}