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
    
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    
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
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="pending">Pending</option>
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
              {store.name || 'Unnamed Store'}
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

// Create Store Modal Component
const CreateStoreModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Store name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.post('/api/admin/stores', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <AdminCard className="w-full max-w-md">
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
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter store name"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State or Address"
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
              placeholder="Optional description"
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
            <AdminButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <AdminLoadingSpinner size="sm" color="black" />
                  <span className="ml-2">Creating...</span>
                </div>
              ) : (
                'Create Store'
              )}
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </div>
  );
};