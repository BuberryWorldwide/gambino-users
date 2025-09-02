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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-yellow-500">🎲 Gambino Admin</h1>
              <nav className="flex space-x-4">
                <a href="/admin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <span className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                  Stores
                </span>
                <a href="/admin/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Users
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Store Management</h2>
            <p className="text-gray-400 mt-1">Manage store locations and settings</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            + Add New Store
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search stores by name, ID, city, or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-gray-400 flex items-center">
                {filteredStores.length} of {stores.length} stores
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Stores List */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading stores...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🏪</div>
              <p className="text-gray-400">
                {searchTerm ? 'No stores match your search' : 'No stores found'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-yellow-400 hover:text-yellow-300"
                >
                  Create your first store
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Store Info</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Fee %</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredStores.map((store) => (
                    <tr key={store._id || store.storeId} className="hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-white">{store.storeName}</div>
                          <div className="text-sm text-gray-400">ID: {store.storeId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        <div>{store.address}</div>
                        <div>{store.city}, {store.state} {store.zipCode}</div>
                        {store.phone && <div>📞 {store.phone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          store.status === 'active' 
                            ? 'bg-green-900/20 text-green-300 border border-green-500/30'
                            : store.status === 'inactive'
                            ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-red-900/20 text-red-300 border border-red-500/30'
                        }`}>
                          {store.status || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {store.feePercentage || 0}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(store)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <a
                            href={`/admin/stores/${store.storeId}`}
                            className="text-yellow-400 hover:text-yellow-300 text-sm"
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
          )}
        </div>
      </div>

      {/* Create Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Create New Store</h3>
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Store ID *</label>
                  <input
                    type="text"
                    required
                    value={storeForm.storeId}
                    onChange={(e) => setStoreForm({...storeForm, storeId: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    placeholder="e.g., STORE001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({...storeForm, storeName: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    placeholder="Store name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={storeForm.city}
                      onChange={(e) => setStoreForm({...storeForm, city: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={storeForm.state}
                      onChange={(e) => setStoreForm({...storeForm, state: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                      placeholder="CA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={storeForm.zipCode}
                      onChange={(e) => setStoreForm({...storeForm, zipCode: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fee %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={storeForm.feePercentage}
                      onChange={(e) => setStoreForm({...storeForm, feePercentage: Number(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {creating ? 'Creating...' : 'Create Store'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Edit Store</h3>
              <form onSubmit={handleEditStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({...storeForm, storeName: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={storeForm.city}
                      onChange={(e) => setStoreForm({...storeForm, city: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={storeForm.state}
                      onChange={(e) => setStoreForm({...storeForm, state: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={storeForm.zipCode}
                      onChange={(e) => setStoreForm({...storeForm, zipCode: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={storeForm.phone}
                      onChange={(e) => setStoreForm({...storeForm, phone: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fee Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={storeForm.feePercentage}
                    onChange={(e) => setStoreForm({...storeForm, feePercentage: Number(e.target.value)})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm font-medium"
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