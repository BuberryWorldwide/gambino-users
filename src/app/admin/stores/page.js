// src/app/admin/stores/page.js - Standardized Stores Management
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import StandardizedAdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminStatusBadge, 
  AdminLoadingSpinner 
} from '@/components/layout/StandardizedAdminLayout';

export default function AdminStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/admin/stores');
      setStores(response.data.stores || []);
    } catch (err) {
      setError('Failed to load stores');
      console.error('Load stores error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store => {
  const matchesSearch = store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       store.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       store.storeId?.toLowerCase().includes(searchTerm.toLowerCase());
  
  let matchesStatus;
  if (statusFilter === 'all') {
    // 'all' means active stores (exclude deleted)
    matchesStatus = store.status !== 'deleted';
  } else if (statusFilter === 'truly-all') {
    // Show everything including deleted
    matchesStatus = true;
  } else {
    // Specific status filter
    matchesStatus = store.status === statusFilter;
  }
  
  return matchesSearch && matchesStatus;
});

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-400',
      inactive: 'text-red-400',
      maintenance: 'text-yellow-400',
      pending: 'text-orange-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const pageActions = (
    <>
      <AdminButton 
        variant="secondary" 
        onClick={loadStores}
        disabled={loading}
      >
        {loading ? <AdminLoadingSpinner size="sm" color="white" /> : 'Refresh'}
      </AdminButton>
      <AdminButton onClick={() => setShowCreateModal(true)}>
        + Add New Store
      </AdminButton>
    </>
  );

  return (
    <StandardizedAdminLayout
      pageTitle="Infrastructure Nodes"
      pageDescription="Manage store locations and settings across the network"
      pageActions={pageActions}
    >
      {/* Error Display */}
      {error && (
        <AdminCard className="mb-8 bg-red-900/30 border-red-500/30">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </AdminCard>
      )}

      {/* Search and Filters */}
      <AdminCard className="mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Stores
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, location, or ID..."
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
            >
              <option value="all">All Active Stores</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted (Recoverable)</option>
              <option value="truly-all">Show All (Including Deleted)</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-600/30">
          <p className="text-gray-400 text-sm">
            Showing {filteredStores.length} of {stores.length} stores
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </p>
        </div>
      </AdminCard>

      {/* Stores Grid */}
      {loading ? (
        <AdminCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AdminLoadingSpinner size="lg" />
              <div className="text-white text-lg mt-4">Loading stores...</div>
            </div>
          </div>
        </AdminCard>
      ) : filteredStores.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏪</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {stores.length === 0 ? 'No stores found' : 'No matching stores'}
            </h3>
            <p className="text-gray-400 mb-6">
              {stores.length === 0 
                ? 'Get started by adding your first store location'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {stores.length === 0 && (
              <AdminButton onClick={() => setShowCreateModal(true)}>
                Add First Store
              </AdminButton>
            )}
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <StoreCard key={store.storeId} store={store} />
          ))}
        </div>
      )}

      {/* Create Store Modal */}
      {showCreateModal && (
        <CreateStoreModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadStores();
          }}
        />
      )}
    </StandardizedAdminLayout>
  );
}

// Store Card Component
const StoreCard = ({ store }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-400',
      inactive: 'text-red-400',
      maintenance: 'text-yellow-400',
      pending: 'text-orange-400'
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <AdminCard className="hover:transform hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
      <a href={`/admin/stores/${store.storeId}`} className="block">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors duration-200">
              {store.storeName || 'Unnamed Store'}  
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {store.location || 'Location not set'}
            </p>
          </div>
          <AdminStatusBadge status={store.status} />
        </div>

        {/* Store ID */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Store ID</div>
          <div className="font-mono text-yellow-400 text-sm bg-gray-700/30 rounded px-2 py-1 border border-gray-600/30">
            {store.storeId}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500">Owner</div>
            <div className="text-white font-medium text-sm">
              {store.owner?.email || store.ownerUserId || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Created</div>
            <div className="text-white font-medium text-sm">
              {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-600/30">
          <div className="flex items-center text-gray-400 text-sm">
            <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(store.status)}`}></span>
            {store.status?.charAt(0).toUpperCase() + store.status?.slice(1) || 'Unknown'}
          </div>
          <div className="text-yellow-400 group-hover:text-yellow-300 text-sm font-medium">
            Manage →
          </div>
        </div>
      </a>
    </AdminCard>
  );
};

// Enhanced Create Store Modal with Standardized ID Convention
const CreateStoreModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    storeId: '',
    storeName: '',
    city: '',
    state: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idGenerationMode, setIdGenerationMode] = useState('auto'); // 'auto' or 'manual'
  const [isValidId, setIsValidId] = useState(true);

  // Store ID naming convention and validation
  const STORE_ID_CONVENTION = {
    pattern: /^[a-z]+_[a-z]+_\d{3}$/,
    format: "city_businessname_###",
    examples: [
      "austin_tacobell_001",
      "miami_starbucks_042", 
      "denver_subway_003",
      "seattle_mcdonalds_017"
    ],
    rules: [
      "Use lowercase letters only",
      "Separate with underscores (_)",
      "End with 3-digit number (001-999)",
      "City name first, business name second",
      "No spaces, special characters, or capitals"
    ]
  };

  // Auto-generate store ID based on form inputs
  const generateStoreId = (city, storeName) => {
    if (!city?.trim() || !storeName?.trim()) return '';
    
    const cleanCity = city.toLowerCase()
      .replace(/[^a-z]/g, '') // Remove non-letters
      .substring(0, 12); // Limit length
    
    const cleanName = storeName.toLowerCase()
      .replace(/[^a-z]/g, '') // Remove non-letters  
      .substring(0, 15); // Limit length
    
    // Generate a random 3-digit number (you might want to check for uniqueness)
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const paddedNum = randomNum.toString().padStart(3, '0');
    
    return `${cleanCity}_${cleanName}_${paddedNum}`;
  };

  // Validate store ID format
  const validateStoreId = (id) => {
    if (!id) return false;
    return STORE_ID_CONVENTION.pattern.test(id);
  };

  // Auto-generate ID when city or store name changes (if in auto mode)
  useEffect(() => {
    if (idGenerationMode === 'auto' && formData.city && formData.storeName) {
      const generatedId = generateStoreId(formData.city, formData.storeName);
      setFormData(prev => ({ ...prev, storeId: generatedId }));
    }
  }, [formData.city, formData.storeName, idGenerationMode]);

  // Validate ID when it changes
  useEffect(() => {
    if (formData.storeId) {
      setIsValidId(validateStoreId(formData.storeId));
    } else {
      setIsValidId(true); // Empty is valid initially
    }
  }, [formData.storeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.storeId.trim()) {
      setError('Store ID is required');
      return;
    }
    if (!isValidId) {
      setError('Store ID must follow the naming convention');
      return;
    }
    if (!formData.storeName.trim()) {
      setError('Store name is required');
      return;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return;
    }
    if (!formData.state.trim()) {
      setError('State is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.post('/api/admin/stores/create', {
        storeId: formData.storeId.trim(),
        storeName: formData.storeName.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.location.trim(),
        description: formData.description.trim()
      });
      
      onSuccess();
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Store ID already exists. Please use a different number.');
      } else {
        setError(err.response?.data?.error || 'Failed to create store');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateId = () => {
    if (formData.city && formData.storeName) {
      const newId = generateStoreId(formData.city, formData.storeName);
      setFormData(prev => ({ ...prev, storeId: newId }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Add New Store</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store ID Section with Convention Help */}
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Store ID</h4>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="radio"
                      name="idMode"
                      checked={idGenerationMode === 'auto'}
                      onChange={() => setIdGenerationMode('auto')}
                      className="mr-2"
                    />
                    Auto-generate
                  </label>
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="radio"
                      name="idMode"
                      checked={idGenerationMode === 'manual'}
                      onChange={() => setIdGenerationMode('manual')}
                      className="mr-2"
                    />
                    Manual
                  </label>
                </div>
              </div>

              {/* Store ID Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store ID * 
                  <span className="text-yellow-400 ml-1">({STORE_ID_CONVENTION.format})</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.storeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value.toLowerCase() }))}
                    placeholder={STORE_ID_CONVENTION.examples[0]}
                    disabled={idGenerationMode === 'auto'}
                    className={`flex-1 bg-gray-700/50 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      !isValidId && formData.storeId 
                        ? 'border-red-500/50 focus:ring-red-400/50' 
                        : 'border-gray-600/50 focus:ring-yellow-400/50 focus:border-yellow-400/50'
                    } ${idGenerationMode === 'auto' ? 'opacity-70' : ''}`}
                    required
                  />
                  {idGenerationMode === 'auto' && formData.city && formData.storeName && (
                    <button
                      type="button"
                      onClick={handleRegenerateId}
                      className="px-4 py-3 bg-yellow-600/80 hover:bg-yellow-600 text-black font-medium rounded-xl transition-colors"
                    >
                      🎲 New
                    </button>
                  )}
                </div>
                
                {/* Validation Message */}
                {!isValidId && formData.storeId && (
                  <p className="text-red-400 text-sm mt-2">
                    ❌ ID must follow format: {STORE_ID_CONVENTION.format}
                  </p>
                )}
                {isValidId && formData.storeId && (
                  <p className="text-green-400 text-sm mt-2">
                    ✅ Valid store ID format
                  </p>
                )}
              </div>

              {/* Convention Help */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <h5 className="text-sm font-semibold text-yellow-400 mb-2">📋 Naming Convention</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-300 font-medium mb-2">Rules:</p>
                    <ul className="text-gray-400 space-y-1">
                      {STORE_ID_CONVENTION.rules.map((rule, i) => (
                        <li key={i}>• {rule}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium mb-2">Examples:</p>
                    <ul className="text-yellow-400 space-y-1 font-mono text-xs">
                      {STORE_ID_CONVENTION.examples.map((example, i) => (
                        <li key={i}>• {example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                placeholder="Enter store name (e.g., Taco Bell, Starbucks)"
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
                required
              />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Full address (optional)"
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description or notes"
                rows={3}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 resize-none"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isValidId}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Store'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};