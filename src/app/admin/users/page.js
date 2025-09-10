// src/app/admin/users/page.js - Complete Users Management with Super Admin Features
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
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const USERS_PER_PAGE = 20;

  useEffect(() => {
    // Get current user info to check permissions
    const userData = getUser();
    setCurrentUser(userData);
    console.log('Current user data:', userData);
    console.log('Current user ID:', userData?.id || userData?._id || userData?.userId);
    loadUsers();
  }, [currentPage]);

  const isSuperAdmin = () => {
    const result = currentUser?.role === 'super_admin';
    console.log('Is super admin check:', { role: currentUser?.role, result });
    return result;
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

  const getRoleInfo = (role) => {
    const roleData = {
      super_admin: { color: 'bg-red-900/20 border-red-500/30 text-red-300', label: 'System Admin', icon: '🔐' },
      gambino_ops: { color: 'bg-purple-900/20 border-purple-500/30 text-purple-300', label: 'Operations', icon: '⚙️' },
      venue_manager: { color: 'bg-blue-900/20 border-blue-500/30 text-blue-300', label: 'Venue Manager', icon: '👨‍💼' },
      venue_staff: { color: 'bg-green-900/20 border-green-500/30 text-green-300', label: 'Venue Staff', icon: '👩‍💻' },
      user: { color: 'bg-gray-900/20 border-gray-500/30 text-gray-300', label: 'Participant', icon: '👤' }
    };
    return roleData[role] || roleData.user;
  };

  // Calculate user statistics
  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive !== false).length,
    admins: users.filter(u => ['super_admin', 'gambino_ops'].includes(u.role)).length,
    staff: users.filter(u => ['venue_manager', 'venue_staff'].includes(u.role)).length,
    totalBalance: users.reduce((sum, user) => sum + (user.cachedGambinoBalance || user.gambinoBalance || 0), 0)
  };

  const pageActions = (
    <>
      <div className="flex items-center space-x-2 mr-4">
        <button
          onClick={() => setViewMode('table')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'table' 
              ? 'bg-yellow-500 text-black' 
              : 'bg-gray-700/50 text-gray-300 hover:text-white'
          }`}
        >
          📊
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'cards' 
              ? 'bg-yellow-500 text-black' 
              : 'bg-gray-700/50 text-gray-300 hover:text-white'
          }`}
        >
          🃏
        </button>
      </div>
      <AdminButton 
        variant="secondary" 
        onClick={loadUsers}
        disabled={loading}
      >
        {loading ? <AdminLoadingSpinner size="sm" color="white" /> : 'Refresh'}
      </AdminButton>
      <AdminButton onClick={() => setShowInviteModal(true)}>
        + Invite Participant
      </AdminButton>
    </>
  );

  return (
    <StandardizedAdminLayout
      pageTitle="Network Participants"
      pageDescription="Manage user accounts and access control across the platform"
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

      {/* User Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <AdminCard className="text-center">
          <div className="text-2xl font-bold text-white">{userStats.total}</div>
          <div className="text-gray-400 text-sm">Total Users</div>
        </AdminCard>
        <AdminCard className="text-center">
          <div className="text-2xl font-bold text-green-400">{userStats.active}</div>
          <div className="text-gray-400 text-sm">Active</div>
        </AdminCard>
        <AdminCard className="text-center">
          <div className="text-2xl font-bold text-red-400">{userStats.admins}</div>
          <div className="text-gray-400 text-sm">Admins</div>
        </AdminCard>
        <AdminCard className="text-center">
          <div className="text-2xl font-bold text-blue-400">{userStats.staff}</div>
          <div className="text-gray-400 text-sm">Staff</div>
        </AdminCard>
        <AdminCard className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{formatBalance(userStats.totalBalance)}</div>
          <div className="text-gray-400 text-sm">Total Balance</div>
        </AdminCard>
      </div>

      {/* Advanced Search and Filters */}
      <AdminCard className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Search Bar - Takes more space */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Participants
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or user ID..."
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
              <AdminButton onClick={handleSearch} disabled={loading}>
                Search
              </AdminButton>
            </div>
          </div>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
            >
              <option value="all">All Roles</option>
              <option value="user">Participants</option>
              <option value="venue_staff">Venue Staff</option>
              <option value="venue_manager">Venue Managers</option>
              <option value="gambino_ops">Operations</option>
              <option value="super_admin">System Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Results and Bulk Actions */}
        <div className="mt-6 pt-4 border-t border-gray-600/30 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {users.length} participants • Page {currentPage} of {totalPages}
          </p>
          
          {selectedUsers.length > 0 && isSuperAdmin() && (
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 text-sm font-medium">
                {selectedUsers.length} selected
              </span>
              <div className="flex space-x-2">
                <AdminButton 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    const csvContent = users
                      .filter(user => selectedUsers.includes(user.id || user._id))
                      .map(user => `${user.firstName || ''} ${user.lastName || ''},${user.email},${user.role}`)
                      .join('\n');
                    const blob = new Blob([`Name,Email,Role\n${csvContent}`], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'selected_users.csv';
                    a.click();
                  }}
                >
                  Export Selected
                </AdminButton>
                <AdminButton 
                  variant="danger" 
                  size="sm"
                  onClick={() => setShowBulkActionModal(true)}
                >
                  Bulk Actions
                </AdminButton>
              </div>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Users Display */}
      {loading ? (
        <AdminCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AdminLoadingSpinner size="lg" />
              <div className="text-white text-lg mt-4">Loading network participants...</div>
            </div>
          </div>
        </AdminCard>
      ) : users.length === 0 ? (
        <AdminCard>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No participants found</h3>
            <p className="text-gray-400 mb-6">
              No participants match your current search and filter criteria
            </p>
            <AdminButton onClick={() => {
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
          {viewMode === 'table' ? (
            <UserTable 
              users={users}
              selectedUsers={selectedUsers}
              onToggleSelect={handleUserToggle}
              onSelectAll={handleSelectAll}
              onDeleteUser={(user) => {
                setUserToDelete(user);
                setShowDeleteModal(true);
              }}
              onToggleStatus={handleToggleUserStatus}
              formatBalance={formatBalance}
              formatDate={formatDate}
              getRoleInfo={getRoleInfo}
              isSuperAdmin={isSuperAdmin()}
              currentUserId={currentUser?.id || currentUser?._id || currentUser?.userId}
            />
          ) : (
            <UserCardsGrid 
              users={users}
              onDeleteUser={(user) => {
                setUserToDelete(user);
                setShowDeleteModal(true);
              }}
              onToggleStatus={handleToggleUserStatus}
              formatBalance={formatBalance}
              formatDate={formatDate}
              getRoleInfo={getRoleInfo}
              isSuperAdmin={isSuperAdmin()}
              currentUserId={currentUser?.id || currentUser?._id || currentUser?.userId}
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <AdminCard className="mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </AdminButton>
                  
                  <span className="text-gray-400 text-sm px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </AdminButton>
                </div>
                
                <div className="text-gray-400 text-sm">
                  {USERS_PER_PAGE} participants per page
                </div>
              </div>
            </AdminCard>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
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

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <BulkActionModal
          selectedCount={selectedUsers.length}
          onClose={() => setShowBulkActionModal(false)}
          onAction={handleBulkAction}
        />
      )}

      {/* Invite Modal */}
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

// Supporting Components for Users Page

// User Table Component with Super Admin Features
const UserTable = ({ 
  users, 
  selectedUsers, 
  onToggleSelect, 
  onSelectAll, 
  onDeleteUser,
  onToggleStatus,
  formatBalance, 
  formatDate, 
  getRoleInfo,
  isSuperAdmin,
  currentUserId
}) => {
  return (
    <AdminCard>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600/30">
              {isSuperAdmin && (
                <th className="text-left py-4 px-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={onSelectAll}
                    className="h-4 w-4 text-yellow-400 bg-gray-700/50 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
                  />
                </th>
              )}
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Participant</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Role</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">GAMBINO Balance</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Last Activity</th>
              <th className="text-left py-4 px-4 text-gray-300 font-medium">Status</th>
              <th className="text-right py-4 px-4 text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <UserRow
                key={user.id || user._id || user.email || `user-${index}`}
                user={user}
                isSelected={selectedUsers.includes(user.id || user._id)}
                onToggleSelect={() => onToggleSelect(user.id || user._id)}
                onDeleteUser={onDeleteUser}
                onToggleStatus={onToggleStatus}
                formatBalance={formatBalance}
                formatDate={formatDate}
                getRoleInfo={getRoleInfo}
                isSuperAdmin={isSuperAdmin}
                currentUserId={currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
};

// Enhanced User Row Component with Super Admin Controls
const UserRow = ({ 
  user, 
  isSelected, 
  onToggleSelect, 
  onDeleteUser,
  onToggleStatus,
  formatBalance, 
  formatDate, 
  getRoleInfo,
  isSuperAdmin,
  currentUserId
}) => {
  const roleInfo = getRoleInfo(user.role);
  const userId = user.id || user._id;
  const isCurrentUser = userId === currentUserId;
  
  return (
    <tr className="border-b border-gray-600/20 hover:bg-gray-700/20 transition-colors duration-200">
      {isSuperAdmin && (
        <td className="py-4 px-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            disabled={isCurrentUser}
            className="h-4 w-4 text-yellow-400 bg-gray-700/50 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2 disabled:opacity-50"
          />
        </td>
      )}
      
      <td className="py-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
            {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-white font-medium flex items-center">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email?.split('@')[0] || 'Unknown User'
              }
              {isCurrentUser && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="text-gray-400 text-sm">
              {user.email || '—'}
            </div>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{roleInfo.icon}</span>
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
      </td>
      
      <td className="py-4 px-4">
        <div className="text-yellow-400 font-mono font-bold text-lg">
          {formatBalance(user.cachedGambinoBalance || user.gambinoBalance)}
        </div>
        <div className="text-gray-500 text-xs">GAMBINO</div>
      </td>
      
      <td className="py-4 px-4">
        <div className="text-white">
          {formatDate(user.lastLoginAt || user.updatedAt)}
        </div>
      </td>
      
      <td className="py-4 px-4">
        <div className="flex items-center space-x-2">
          <AdminStatusBadge 
            status={user.isActive === false ? 'inactive' : 'active'} 
          />
          {isSuperAdmin && !isCurrentUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(userId, user.isActive);
              }}
              className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
              title={user.isActive === false ? 'Activate user' : 'Deactivate user'}
            >
              {user.isActive === false ? '🔓' : '🔒'}
            </button>
          )}
        </div>
      </td>
      
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/admin/users/${userId}`;
            }}
          >
            View Profile
          </AdminButton>
          
          {isSuperAdmin && !isCurrentUser && (
            <AdminButton
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteUser(user);
              }}
            >
              Delete
            </AdminButton>
          )}
        </div>
      </td>
    </tr>
  );
};

// User Cards Grid with Super Admin Features
const UserCardsGrid = ({ 
  users, 
  onDeleteUser,
  onToggleStatus,
  formatBalance, 
  formatDate, 
  getRoleInfo,
  isSuperAdmin,
  currentUserId
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {users.map((user, index) => (
        <UserCard 
          key={user.id || user._id || user.email || `user-card-${index}`}
          user={user} 
          onDeleteUser={onDeleteUser}
          onToggleStatus={onToggleStatus}
          formatBalance={formatBalance}
          formatDate={formatDate}
          getRoleInfo={getRoleInfo}
          isSuperAdmin={isSuperAdmin}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};

// Enhanced User Card with Super Admin Controls
const UserCard = ({ 
  user, 
  onDeleteUser,
  onToggleStatus,
  formatBalance, 
  formatDate, 
  getRoleInfo,
  isSuperAdmin,
  currentUserId
}) => {
  const roleInfo = getRoleInfo(user.role);
  const userId = user.id || user._id;
  const isCurrentUser = userId === currentUserId;
  
  return (
    <AdminCard className="hover:transform hover:scale-[1.02] transition-all duration-300 group">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black font-bold text-xl">
          {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
        </div>
        
        <h3 className="text-lg font-bold text-white mb-1 flex items-center justify-center">
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email?.split('@')[0] || 'Unknown User'
          }
          {isCurrentUser && (
            <span className="ml-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">
              You
            </span>
          )}
        </h3>
        
        <p className="text-gray-400 text-sm mb-3 truncate">
          {user.email || '—'}
        </p>
        
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-lg">{roleInfo.icon}</span>
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="text-yellow-400 font-mono font-bold text-xl">
            {formatBalance(user.cachedGambinoBalance || user.gambinoBalance)}
          </div>
          <div className="text-gray-500 text-xs">GAMBINO</div>
        </div>
        
        <div className="text-gray-400 text-sm mb-4">
          Last seen: {formatDate(user.lastLoginAt || user.updatedAt)}
        </div>
        
        <div className="mb-4 flex items-center justify-center space-x-2">
          <AdminStatusBadge 
            status={user.isActive === false ? 'inactive' : 'active'} 
          />
          {isSuperAdmin && !isCurrentUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(userId, user.isActive);
              }}
              className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
              title={user.isActive === false ? 'Activate user' : 'Deactivate user'}
            >
              {user.isActive === false ? '🔓' : '🔒'}
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/admin/users/${userId}`;
            }}
            className="w-full"
          >
            View Profile
          </AdminButton>
          
          {isSuperAdmin && !isCurrentUser && (
            <AdminButton
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteUser(user);
              }}
              className="w-full"
            >
              Delete User
            </AdminButton>
          )}
        </div>
      </div>
    </AdminCard>
  );
};

// Delete User Confirmation Modal
const DeleteUserModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <AdminCard className="w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Delete User Account</h3>
          <p className="text-gray-400 mb-6">
            Are you sure you want to permanently delete{' '}
            <span className="text-white font-medium">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email?.split('@')[0] || 'this user'
              }
            </span>?
            <br />
            <span className="text-red-400 text-sm">This action cannot be undone.</span>
          </p>

          <div className="flex items-center justify-center space-x-4">
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
              {loading ? (
                <div className="flex items-center">
                  <AdminLoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Deleting...</span>
                </div>
              ) : (
                'Delete User'
              )}
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

// Bulk Action Modal
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <AdminCard className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Bulk Actions</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 mb-4">
            Select an action to perform on {selectedCount} selected users:
          </p>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="bulkAction"
                value="activate"
                checked={action === 'activate'}
                onChange={(e) => setAction(e.target.value)}
                className="h-4 w-4 text-yellow-400 bg-gray-700/50 border-gray-600 focus:ring-yellow-400 focus:ring-2"
              />
              <span className="text-white">Activate Users</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="bulkAction"
                value="deactivate"
                checked={action === 'deactivate'}
                onChange={(e) => setAction(e.target.value)}
                className="h-4 w-4 text-yellow-400 bg-gray-700/50 border-gray-600 focus:ring-yellow-400 focus:ring-2"
              />
              <span className="text-white">Deactivate Users</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="bulkAction"
                value="delete"
                checked={action === 'delete'}
                onChange={(e) => setAction(e.target.value)}
                className="h-4 w-4 text-yellow-400 bg-gray-700/50 border-gray-600 focus:ring-yellow-400 focus:ring-2"
              />
              <span className="text-red-400">Delete Users (Permanent)</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
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
            {loading ? (
              <div className="flex items-center">
                <AdminLoadingSpinner size="sm" color={action === 'delete' ? 'white' : 'black'} />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              `${action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Delete'} ${selectedCount} Users`
            )}
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
};

// Invite User Modal
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <AdminCard className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Invite New Participant</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
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
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
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
                placeholder="First name"
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
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
                placeholder="Last name"
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

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
                  <span className="ml-2">Sending...</span>
                </div>
              ) : (
                'Send Invitation'
              )}
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </div>
  );
};