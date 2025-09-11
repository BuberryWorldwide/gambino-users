// src/app/admin/users/page.js - Part 1: State Management & Logic
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import StandardizedAdminLayout, { 
  AdminCard, 
  AdminButton, 
  AdminStatusBadge, 
  AdminLoadingSpinner 
} from '@/components/layout/StandardizedAdminLayout';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const USERS_PER_PAGE = 20;

  useEffect(() => {
    const userData = getUser();
    setCurrentUser(userData);
    loadUsers();
  }, [currentPage]);

  const isSuperAdmin = () => {
    return currentUser?.role === 'super_admin';
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: USERS_PER_PAGE,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await api.get(`/api/admin/users?${params}`);
      setUsers(response.data.users || []);
      setTotalPages(Math.ceil((response.data.total || 0) / USERS_PER_PAGE));
    } catch (err) {
      setError('Failed to load network participants');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === users.length 
        ? [] 
        : users.map(user => user.id || user._id)
    );
  };

  const handleDeleteUser = async (userId) => {
    if (!isSuperAdmin()) {
      setError('Only super admins can delete users');
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers(prev => prev.filter(user => (user.id || user._id) !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!isSuperAdmin()) {
      setError('Only super admins can modify user status');
      return;
    }

    try {
      const newStatus = currentStatus === false ? true : false;
      await api.patch(`/api/admin/users/${userId}/status`, { isActive: newStatus });
      
      setUsers(prev => prev.map(user => 
        (user.id || user._id) === userId 
          ? { ...user, isActive: newStatus }
          : user
      ));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleBulkAction = async (action) => {
    if (!isSuperAdmin()) {
      setError('Only super admins can perform bulk actions');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('No users selected');
      return;
    }

    try {
      if (action === 'delete') {
        await api.post('/api/admin/users/bulk-delete', { userIds: selectedUsers });
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id || user._id)));
      } else if (action === 'activate') {
        await api.post('/api/admin/users/bulk-activate', { userIds: selectedUsers });
        setUsers(prev => prev.map(user => 
          selectedUsers.includes(user.id || user._id) 
            ? { ...user, isActive: true }
            : user
        ));
      } else if (action === 'deactivate') {
        await api.post('/api/admin/users/bulk-deactivate', { userIds: selectedUsers });
        setUsers(prev => prev.map(user => 
          selectedUsers.includes(user.id || user._id) 
            ? { ...user, isActive: false }
            : user
        ));
      }
      
      setSelectedUsers([]);
      setShowBulkActionModal(false);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} users`);
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return Number(balance).toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      super_admin: 'System Admin',
      gambino_ops: 'Operations',
      venue_manager: 'Venue Manager',
      venue_staff: 'Venue Staff',
      user: 'Participant'
    };
    return roleLabels[role] || 'Participant';
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive !== false).length,
    admins: users.filter(u => ['super_admin', 'gambino_ops'].includes(u.role)).length,
    staff: users.filter(u => ['venue_manager', 'venue_staff'].includes(u.role)).length,
    totalBalance: users.reduce((sum, user) => sum + (user.cachedGambinoBalance || user.gambinoBalance || 0), 0)
  };

  // src/app/admin/users/page.js - Part 2: Return Statement & UI Components

  // Page Actions (simplified)
  const pageActions = (
    <>
      <AdminButton 
        variant="secondary" 
        onClick={loadUsers}
        disabled={loading}
      >
        {loading ? <AdminLoadingSpinner size="sm" color="white" /> : 'Refresh'}
      </AdminButton>
      <AdminButton onClick={() => setShowInviteModal(true)}>
        Invite User
      </AdminButton>
    </>
  );

  return (
    <StandardizedAdminLayout
      pageTitle="Network Participants"
      pageDescription="Manage user accounts and access control"
      pageActions={pageActions}
    >
      {/* Error Display */}
      {error && (
        <AdminCard className="mb-6 bg-red-900/10 border-red-600/20">
          <div className="flex items-center text-red-400">
            <span className="mr-2">•</span>
            <p>{error}</p>
          </div>
        </AdminCard>
      )}

      {/* User Statistics - Simplified */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="text-3xl font-bold text-white mb-1">{userStats.total}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wider">Total Users</div>
        </AdminCard>
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="text-3xl font-bold text-white mb-1">{userStats.active}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wider">Active</div>
        </AdminCard>
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="text-3xl font-bold text-white mb-1">{userStats.admins}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wider">Admins</div>
        </AdminCard>
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="text-3xl font-bold text-white mb-1">{userStats.staff}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wider">Staff</div>
        </AdminCard>
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="text-3xl font-bold text-yellow-400 mb-1">{formatBalance(userStats.totalBalance)}</div>
          <div className="text-gray-500 text-sm uppercase tracking-wider">Total Balance</div>
        </AdminCard>
      </div>

      {/* Search and Filters - Cleaner */}
      <AdminCard className="mb-6 bg-gray-800/40 border-gray-700/30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/40 transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">Participants</option>
            <option value="venue_staff">Venue Staff</option>
            <option value="venue_manager">Managers</option>
            <option value="gambino_ops">Operations</option>
            <option value="super_admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <AdminButton onClick={handleSearch} disabled={loading}>
            Search
          </AdminButton>
        </div>

        {/* Results info */}
        <div className="mt-4 pt-4 border-t border-gray-700/30 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            {users.length} results • Page {currentPage} of {totalPages}
          </p>
          
          {selectedUsers.length > 0 && isSuperAdmin() && (
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">
                {selectedUsers.length} selected
              </span>
              <AdminButton 
                variant="danger" 
                size="sm"
                onClick={() => setShowBulkActionModal(true)}
              >
                Bulk Actions
              </AdminButton>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Users Table */}
      {loading ? (
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <AdminLoadingSpinner size="lg" />
              <div className="text-gray-400 mt-4">Loading participants...</div>
            </div>
          </div>
        </AdminCard>
      ) : users.length === 0 ? (
        <AdminCard className="bg-gray-800/40 border-gray-700/30">
          <div className="text-center py-16">
            <div className="text-gray-600 text-5xl mb-4">∅</div>
            <h3 className="text-xl font-semibold text-white mb-2">No participants found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search filters
            </p>
            <AdminButton variant="secondary" onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setStatusFilter('all');
              loadUsers();
            }}>
              Clear Filters
            </AdminButton>
          </div>
        </AdminCard>
      ) : (
        <>
          <AdminCard className="bg-gray-800/40 border-gray-700/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    {isSuperAdmin() && (
                      <th className="text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 bg-gray-900/50 border-gray-600 rounded focus:ring-yellow-400/50 focus:ring-2"
                        />
                      </th>
                    )}
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Balance</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Last Active</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userId = user.id || user._id;
                    const isCurrentUser = userId === (currentUser?.id || currentUser?._id || currentUser?.userId);
                    
                    return (
                      <tr key={userId} className="border-b border-gray-700/20 hover:bg-gray-700/10 transition-colors">
                        {isSuperAdmin() && (
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(userId)}
                              onChange={() => handleUserToggle(userId)}
                              disabled={isCurrentUser}
                              className="h-4 w-4 bg-gray-900/50 border-gray-600 rounded focus:ring-yellow-400/50 focus:ring-2 disabled:opacity-30"
                            />
                          </td>
                        )}
                        
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-medium">
                              {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email?.split('@')[0] || 'Unknown User'
                                }
                                {isCurrentUser && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-400/10 text-yellow-400 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-sm">
                                {user.email || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <span className="text-gray-300 text-sm">
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="text-yellow-400 font-medium">
                            {formatBalance(user.cachedGambinoBalance || user.gambinoBalance)}
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="text-gray-400 text-sm">
                            {formatDate(user.lastLoginAt || user.updatedAt)}
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            user.isActive === false 
                              ? 'bg-red-900/20 text-red-400' 
                              : 'bg-emerald-900/20 text-emerald-400'
                          }`}>
                            {user.isActive === false ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AdminButton
                              variant="secondary"
                              size="sm"
                              onClick={() => window.location.href = `/admin/users/${userId}`}
                            >
                              View
                            </AdminButton>
                            
                            {isSuperAdmin() && !isCurrentUser && (
                              <>
                                <AdminButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(userId, user.isActive)}
                                >
                                  {user.isActive === false ? 'Enable' : 'Disable'}
                                </AdminButton>
                                <AdminButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  Delete
                                </AdminButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AdminCard>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </AdminButton>
              
              <span className="text-gray-400 px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </AdminButton>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showDeleteModal && userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={() => handleDeleteUser(userToDelete.id || userToDelete._id)}
        />
      )}

      {showBulkActionModal && (
        <BulkActionModal
          selectedCount={selectedUsers.length}
          onClose={() => setShowBulkActionModal(false)}
          onAction={handleBulkAction}
        />
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadUsers();
          }}
        />
      )}
    </StandardizedAdminLayout>
  );
}

// Modal Components - Simplified Styling

const DeleteUserModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Delete User</h3>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete{' '}
          <span className="text-white font-medium">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.email}
          </span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <AdminLoadingSpinner size="sm" color="white" /> : 'Delete User'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
};

const BulkActionModal = ({ selectedCount, onClose, onAction }) => {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');

  const handleAction = async () => {
    if (!action) return;
    setLoading(true);
    await onAction(action);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Bulk Actions</h3>
        <p className="text-gray-300 mb-4">
          Apply action to {selectedCount} selected users:
        </p>

        <div className="space-y-2 mb-6">
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-700/30">
            <input
              type="radio"
              name="bulkAction"
              value="activate"
              checked={action === 'activate'}
              onChange={(e) => setAction(e.target.value)}
              className="text-yellow-400"
            />
            <span className="text-white">Activate Users</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-700/30">
            <input
              type="radio"
              name="bulkAction"
              value="deactivate"
              checked={action === 'deactivate'}
              onChange={(e) => setAction(e.target.value)}
              className="text-yellow-400"
            />
            <span className="text-white">Deactivate Users</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-700/30">
            <input
              type="radio"
              name="bulkAction"
              value="delete"
              checked={action === 'delete'}
              onChange={(e) => setAction(e.target.value)}
              className="text-yellow-400"
            />
            <span className="text-red-400">Delete Users</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant={action === 'delete' ? 'danger' : 'primary'}
            onClick={handleAction}
            disabled={loading || !action}
          >
            {loading ? <AdminLoadingSpinner size="sm" /> : 'Apply'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
};

const InviteUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await api.post('/api/admin/users/invite', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700/50 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-4">Invite User</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/40 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400/40 transition-colors"
            >
              <option value="user">Participant</option>
              <option value="venue_staff">Venue Staff</option>
              <option value="venue_manager">Venue Manager</option>
              <option value="gambino_ops">Operations</option>
              <option value="super_admin">System Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="First"
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last"
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/40 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
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
              {loading ? <AdminLoadingSpinner size="sm" color="black" /> : 'Send Invite'}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
};