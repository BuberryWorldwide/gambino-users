'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

const ROLE_OPTIONS = ['user', 'venue_staff', 'venue_manager', 'gambino_ops', 'super_admin'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', active: 'any' });
  const [savingId, setSavingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    role: 'user', assignedVenues: []
  });

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'user', 
    assignedVenues: [], isActive: true
  });
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.role) params.role = filters.role;
      if (filters.active === 'true' || filters.active === 'false') params.active = filters.active;

      const { data } = await api.get('/api/admin/users', { params });
      setUsers(data?.users || data?.data || []);
      setCount(data?.count ?? (data?.users?.length || 0));
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load users');
      setUsers([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const onSearch = async (e) => { e.preventDefault(); await load(); };

  const updateUser = async (id, patch) => {
    setSavingId(id);
    setErr('');
    try {
      await api.put(`/api/admin/users/${id}`, patch);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to update user');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateUser = async (e) => {
  e.preventDefault();
  setCreating(true);
  setErr('');

  console.log('Form data being sent:', createForm); // ADD THIS LINE

  try {
    const { data } = await api.post('/api/admin/users/create', createForm);
    
    if (data.success) {
      setShowCreateModal(false);
      setCreateForm({
        firstName: '', lastName: '', email: '', phone: '', password: '',
        role: 'user', assignedVenues: []
      });
      await load(); // Refresh the users list
    }
  } catch (error) {
    setErr(error?.response?.data?.error || 'Failed to create user');
  } finally {
    setCreating(false);
  }
};

const loadStores = async () => {
  try {
    setLoadingStores(true);
    const { data } = await api.get('/api/admin/stores');
    setStores(data.stores || []);
  } catch (error) {
    console.error('Failed to load stores:', error);
  } finally {
    setLoadingStores(false);
  }
};

const startEdit = (user) => {
  setEditingUser(user);
  setEditForm({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'user',
    assignedVenues: user.assignedVenues || [],
    isActive: user.isActive !== false
  });
  setShowEditModal(true);
  loadStores();
};

const [saving, setSaving] = useState(false);


const handleEditUser = async (e) => {
  e.preventDefault();
  if (!editingUser) return;

  try {
    setSaving(true);
    setErr('');

    const { data } = await api.put(`/api/admin/users/${editingUser._id}`, editForm);
    
    if (data.success) {
      setShowEditModal(false);
      setEditingUser(null);
      await load(); // Refresh users list
    }
  } catch (error) {
    setErr(error?.response?.data?.error || 'Failed to update user');
  } finally {
    setSaving(false);
  }
};

const toggleVenueAssignment = (storeId) => {
  setEditForm(prev => ({
    ...prev,
    assignedVenues: prev.assignedVenues.includes(storeId)
      ? prev.assignedVenues.filter(id => id !== storeId)
      : [...prev.assignedVenues, storeId]
  }));
};

  return (
  <div className="p-6 max-w-7xl mx-auto">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-gold"
        >
          Create User
        </button>
        <form onSubmit={onSearch} className="flex flex-wrap gap-2">
          <input
            className="input"
            placeholder="Search name/email…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <select
            className="input"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="input"
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
          >
            <option value="any">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn btn-ghost" type="submit">Filter</button>
        </form>
      </div>
    </div>
      {err && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4">
          {err}
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="p-4 text-sm text-neutral-400">Total: {count}</div>
        {loading ? (
          <div className="p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-r-transparent" />
            <div className="text-neutral-400 text-sm">Loading users…</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Wallet</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Venues</th>
                <th className="p-3">Active</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                    <td className="p-3">
                      <div className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-neutral-400">{user.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-mono text-neutral-300">
                        {user.walletAddress ? 
                          `${user.walletAddress.slice(0, 8)}...` : 
                          '—'
                        }
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-red-900/20 text-red-300 border border-red-500/30' :
                        user.role === 'gambino_ops' ? 'bg-purple-900/20 text-purple-300 border border-purple-500/30' :
                        user.role === 'venue_manager' ? 'bg-blue-900/20 text-blue-300 border border-blue-500/30' :
                        user.role === 'venue_staff' ? 'bg-green-900/20 text-green-300 border border-green-500/30' :
                        'bg-gray-900/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        {(user.role || 'user').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-xs text-neutral-300">
                        {user.assignedVenues && user.assignedVenues.length > 0 ? (
                          <div className="space-y-1">
                            {user.assignedVenues.slice(0, 2).map((venueId) => (
                              <div key={venueId} className="bg-yellow-900/20 text-yellow-300 px-2 py-1 rounded text-xs">
                                {venueId}
                              </div>
                            ))}
                            {user.assignedVenues.length > 2 && (
                              <div className="text-xs text-neutral-500">
                                +{user.assignedVenues.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => updateUser(user._id, { isActive: !user.isActive })}
                        disabled={savingId === user._id}
                        className={`text-xs px-2 py-1 rounded ${
                          user.isActive 
                            ? 'bg-green-900/20 text-green-300' 
                            : 'bg-red-900/20 text-red-300'
                        }`}
                      >
                        {savingId === user._id ? '...' : user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3 text-xs text-neutral-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => startEdit(user)}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Edit User: {editingUser.firstName} {editingUser.lastName}
              </h3>
              
              <form onSubmit={handleEditUser} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                      value={editForm.isActive}
                      onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Venue Assignment Section */}
                {['venue_staff', 'venue_manager'].includes(editForm.role) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Assigned Venues {editForm.role === 'venue_staff' && '*'}
                    </label>
                    
                    {loadingStores ? (
                      <div className="text-gray-400 text-sm">Loading stores...</div>
                    ) : stores.length === 0 ? (
                      <div className="text-gray-400 text-sm">No stores available</div>
                    ) : (
                      <div className="bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {stores.map((store) => (
                            <label key={store.storeId} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editForm.assignedVenues.includes(store.storeId)}
                                onChange={() => toggleVenueAssignment(store.storeId)}
                                className="w-4 h-4 text-yellow-600 bg-gray-600 border-gray-500 rounded focus:ring-yellow-500 focus:ring-2"
                              />
                              <div className="flex-1">
                                <div className="text-white text-sm font-medium">{store.storeName}</div>
                                <div className="text-gray-400 text-xs">
                                  {store.storeId} • {store.city}, {store.state}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {editForm.assignedVenues.length > 0 && (
                      <div className="mt-2 text-sm text-gray-400">
                        Selected: {editForm.assignedVenues.length} venue{editForm.assignedVenues.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    {saving ? 'Saving...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Create New User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    {ROLE_OPTIONS.map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    {creating ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
