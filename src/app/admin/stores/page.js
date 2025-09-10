'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Store creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [storeForm, setStoreForm] = useState({
    storeId: '',
    storeName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    feePercentage: 5
  });

  // Store editing
  const [editingStore, setEditingStore] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/api/admin/stores');
      setStores(data.stores || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load stores');
      console.error('Stores load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (creating) return;

    try {
      setCreating(true);
      setError('');

      const { data } = await api.post('/api/admin/stores/create', storeForm);
      
      if (data.success) {
        setStores(prev => [data.store, ...prev]);
        setStoreForm({
          storeId: '',
          storeName: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          feePercentage: 5
        });
        setShowCreateModal(false);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create store');
    } finally {
      setCreating(false);
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    if (!editingStore || saving) return;

    try {
      setSaving(true);
      setError('');

      const { data } = await api.put(`/api/admin/stores/${editingStore.storeId}`, storeForm);
      
      if (data.success) {
        setStores(prev => prev.map(store => 
          store.storeId === editingStore.storeId 
            ? { ...store, ...storeForm }
            : store
        ));
        setEditingStore(null);
        setStoreForm({
          storeId: '',
          storeName: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          feePercentage: 5
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update store');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (store) => {
    setEditingStore(store);
    setStoreForm({
      storeId: store.storeId || '',
      storeName: store.storeName || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      zipCode: store.zipCode || '',
      phone: store.phone || '',
      feePercentage: store.feePercentage || 5
    });
  };

  const cancelEdit = () => {
    setEditingStore(null);
    setStoreForm({
      storeId: '',
      storeName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      feePercentage: 5
    });
  };

  // Filter stores based on search
  const filteredStores = stores.filter(store => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (store.storeName || '').toLowerCase().includes(searchLower) ||
      (store.storeId || '').toLowerCase().includes(searchLower) ||
      (store.city || '').toLowerCase().includes(searchLower) ||
      (store.state || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 border border-yellow-600/10 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-black font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Gambino Admin
                </h1>
              </div>
              <nav className="flex space-x-1">
                <a href="/admin" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/30 rounded-xl transition-all duration-200 text-sm font-medium">
                  Dashboard
                </a>
                <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-xl text-sm font-semibold">
                  Stores
                </span>
                <a href="/admin/users" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/30 rounded-xl transition-all duration-200 text-sm font-medium">
                  Users
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
              Store Management
            </h2>
            <p className="text-gray-300 text-lg">Manage store locations and settings across the network</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            + Add New Store
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stores by name, ID, city, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="px-4 py-2 bg-gray-700/30 rounded-xl border border-gray-600/30">
                <span className="text-sm text-gray-300 font-medium">
                  {filteredStores.length} of {stores.length} stores
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              <span className="text-red-200 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Stores List */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">Loading stores...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-6">🏪</div>
              <p className="text-gray-400 text-lg mb-4">
                {searchTerm ? 'No stores match your search' : 'No stores found'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                >
                  Create your first store →
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 overflow-hidden m-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-600/30 border-b border-gray-600/50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-200">Store Info</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-200">Location</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-200">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-200">Fee %</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600/30">
                    {filteredStores.map((store) => (
                      <tr key={store._id || store.storeId} className="hover:bg-gray-600/20 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-semibold text-white text-lg">{store.storeName}</div>
                            <div className="text-sm text-gray-400">ID: {store.storeId}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          <div className="space-y-1">
                            <div>{store.address}</div>
                            <div>{store.city}, {store.state} {store.zipCode}</div>
                            {store.phone && <div className="text-blue-400">{store.phone}</div>}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                            store.status === 'active' 
                              ? 'bg-green-900/20 text-green-300 border-green-500/30'
                              : store.status === 'inactive'
                              ? 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30'
                              : 'bg-red-900/20 text-red-300 border-red-500/30'
                          }`}>
                            {store.status || 'unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300 font-mono">
                          {store.feePercentage || 0}%
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(store)}
                              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-medium rounded-lg transition-all duration-200 border border-blue-500/30 text-sm"
                            >
                              Edit
                            </button>
                            <a
                              href={`/admin/stores/${store.storeId}`}
                              className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 hover:text-yellow-300 font-medium rounded-lg transition-all duration-200 border border-yellow-500/30 text-sm"
                            >
                              View
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-md">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Create New Store</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateStore} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Store ID *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={storeForm.storeId}
                      onChange={(e) => setStoreForm({...storeForm, storeId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      placeholder="e.g., STORE001"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Store Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={storeForm.storeName}
                      onChange={(e) => setStoreForm({...storeForm, storeName: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Store name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">City *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={storeForm.city}
                        onChange={(e) => setStoreForm({...storeForm, city: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="City"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">State *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={storeForm.state}
                        onChange={(e) => setStoreForm({...storeForm, state: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="CA"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeForm.address}
                      onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Street address"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">ZIP Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={storeForm.zipCode}
                        onChange={(e) => setStoreForm({...storeForm, zipCode: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="12345"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">Fee %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={storeForm.feePercentage}
                        onChange={(e) => setStoreForm({...storeForm, feePercentage: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="5.0"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  >
                    {creating ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Store'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {editingStore && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-md">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Edit Store</h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditStore} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Store Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={storeForm.storeName}
                      onChange={(e) => setStoreForm({...storeForm, storeName: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Store name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">City *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={storeForm.city}
                        onChange={(e) => setStoreForm({...storeForm, city: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="City"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">State *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={storeForm.state}
                        onChange={(e) => setStoreForm({...storeForm, state: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="CA"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeForm.address}
                      onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      placeholder="Street address"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">ZIP Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={storeForm.zipCode}
                        onChange={(e) => setStoreForm({...storeForm, zipCode: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="12345"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">Phone</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={storeForm.phone}
                        onChange={(e) => setStoreForm({...storeForm, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="(555) 123-4567"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Fee Percentage</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={storeForm.feePercentage}
                      onChange={(e) => setStoreForm({...storeForm, feePercentage: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      placeholder="5.0"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
                  >
                    Cancel
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