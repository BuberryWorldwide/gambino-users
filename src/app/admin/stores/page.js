'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';


export default function AdminStoresPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [adminRole, setAdminRole] = useState('');

  // Create/Edit form state
  const [storeForm, setStoreForm] = useState({
    storeId: '',
    storeName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    feePercentage: 5,
    status: 'active'
  });

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setAdminRole(localStorage.getItem('adminRole') || 'admin');
  }, [router]);

  useEffect(() => {
    if (!mounted || !getToken()) return;

    const fetchStores = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use GET request to fetch stores list - this should prevent the infinite loop
        const response = await api.get('/api/admin/stores');
        
        // Handle the response properly
        if (response.data?.success && Array.isArray(response.data.stores)) {
          setStores(response.data.stores);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error('Stores fetch error:', err);
        setError(err?.response?.data?.error || 'Failed to load stores');
        
        // Handle auth errors
        if (err?.response?.status === 403 || err?.response?.status === 401) {
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [mounted, router]);

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Use POST to a different endpoint for creating stores
      const response = await api.post('/api/admin/stores/create', storeForm);
      
      if (response.data?.success) {
        // Refresh the stores list
        const updatedStores = await api.get('/api/admin/stores');
        if (updatedStores.data?.success && Array.isArray(updatedStores.data.stores)) {
          setStores(updatedStores.data.stores);
        }
        
        // Reset form and close modal
        setStoreForm({
          storeId: '',
          storeName: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          feePercentage: 5,
          status: 'active'
        });
        setShowCreateModal(false);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create store');
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    if (!editingStore) return;
    
    setError('');
    try {
      const response = await api.put(`/api/admin/stores/${editingStore.storeId}`, storeForm);
      
      if (response.data?.success) {
        // Update the store in our local state
        setStores(prev => prev.map(store => 
          store.storeId === editingStore.storeId 
            ? { ...store, ...storeForm }
            : store
        ));
        
        // Reset form and close modal
        setEditingStore(null);
        setStoreForm({
          storeId: '',
          storeName: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
          feePercentage: 5,
          status: 'active'
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update store');
    }
  };

  const startEdit = (store) => {
    setEditingStore(store);
    setStoreForm({
      storeId: store.storeId || '',
      storeName: store.storeName || store.name || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      zipCode: store.zipCode || '',
      phone: store.phone || '',
      feePercentage: store.feePercentage || 5,
      status: store.status || 'active'
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
      feePercentage: 5,
      status: 'active'
    });
  };

  // Filter stores based on search term
  const filteredStores = stores.filter(store => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (store.storeName || store.name || '').toLowerCase().includes(searchLower) ||
      (store.storeId || '').toLowerCase().includes(searchLower) ||
      (store.city || '').toLowerCase().includes(searchLower) ||
      (store.state || '').toLowerCase().includes(searchLower)
    );
  });

  if (!mounted || !getToken()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <div className="loading-spinner w-5 h-5 text-yellow-500"></div>
          <span>Loading stores...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Store Management
          </h1>
          <p className="text-neutral-400 text-sm md:text-base">
            Manage all stores in the Gambino network
          </p>
        </div>
        {(adminRole === 'super_admin' || adminRole === 'store_owner') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-gold"
          >
            Create New Store
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 md:p-4 rounded-lg mb-6 backdrop-blur-sm text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search stores by name, ID, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>{filteredStores.length} of {stores.length} stores</span>
          </div>
        </div>
      </div>

      {/* Stores List */}
      <div className="card">
        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Stores Found</h3>
            <p className="text-neutral-400 text-sm mb-6">
              {searchTerm ? 'No stores match your search criteria.' : 'No stores have been created yet.'}
            </p>
            {!searchTerm && (adminRole === 'super_admin' || adminRole === 'store_owner') && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn btn-gold"
              >
                Create First Store
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStores.map((store) => (
              <div key={store._id || store.storeId} className="p-4 rounded-lg border border-neutral-700 bg-neutral-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {store.storeName || store.name || 'Unnamed Store'}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        store.status === 'active' 
                          ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                          : 'bg-red-900/30 text-red-400 border border-red-500/30'
                      }`}>
                        {store.status || 'unknown'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-400">
                      <div>Store ID: {store.storeId || 'N/A'}</div>
                      <div>Location: {store.city}, {store.state}</div>
                      <div>Address: {store.address || 'N/A'}</div>
                      <div>Phone: {store.phone || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Link href={`/admin/stores/${encodeURIComponent(store.storeId)}`} className="btn btn-ghost text-sm">
                        Open
                      </Link>
                    <button 
                      onClick={() => startEdit(store)}
                      className="btn btn-ghost text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Store Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900/95 border border-neutral-700 rounded-xl p-6 max-w-md w-full backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Store</h3>
            
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="label">Store ID</label>
                <input 
                  type="text" 
                  className="input mt-1"
                  value={storeForm.storeId}
                  onChange={(e) => setStoreForm(prev => ({...prev, storeId: e.target.value}))}
                  required
                  placeholder="ST001"
                />
              </div>
              
              <div>
                <label className="label">Store Name</label>
                <input 
                  type="text" 
                  className="input mt-1"
                  value={storeForm.storeName}
                  onChange={(e) => setStoreForm(prev => ({...prev, storeName: e.target.value}))}
                  required
                  placeholder="Downtown Gaming"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input 
                    type="text" 
                    className="input mt-1"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm(prev => ({...prev, city: e.target.value}))}
                    required
                    placeholder="Nashville"
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input 
                    type="text" 
                    className="input mt-1"
                    value={storeForm.state}
                    onChange={(e) => setStoreForm(prev => ({...prev, state: e.target.value}))}
                    required
                    placeholder="TN"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Address (Optional)</label>
                <input 
                  type="text" 
                  className="input mt-1"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm(prev => ({...prev, address: e.target.value}))}
                  placeholder="123 Main St"
                />
              </div>
              
              <div className="flex gap-2">
                <button type="submit" className="btn btn-gold flex-1">Create Store</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {editingStore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900/95 border border-neutral-700 rounded-xl p-6 max-w-md w-full backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Store</h3>
            
            <form onSubmit={handleEditStore} className="space-y-4">
              <div>
                <label className="label">Store Name</label>
                <input 
                  type="text" 
                  className="input mt-1"
                  value={storeForm.storeName}
                  onChange={(e) => setStoreForm(prev => ({...prev, storeName: e.target.value}))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input 
                    type="text" 
                    className="input mt-1"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm(prev => ({...prev, city: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input 
                    type="text" 
                    className="input mt-1"
                    value={storeForm.state}
                    onChange={(e) => setStoreForm(prev => ({...prev, state: e.target.value}))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Status</label>
                <select 
                  className="input mt-1"
                  value={storeForm.status}
                  onChange={(e) => setStoreForm(prev => ({...prev, status: e.target.value}))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button type="submit" className="btn btn-gold flex-1">Update Store</button>
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}