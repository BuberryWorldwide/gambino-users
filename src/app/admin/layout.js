// src/app/admin/layout.js - Updated for RBAC system
'use client';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }) {
  const { 
    user, 
    loading, 
    canAccessAdmin, 
    isAuthenticated 
  } = useAuth({
    requireAuth: true,
    requireAdmin: true
  });

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAuthenticated || !canAccessAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.17 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6">
            You don't have permission to access the admin area.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show role-based welcome message
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'super_admin': return 'Super Administrator';
      case 'gambino_ops': return 'Operations Manager';
      case 'venue_manager': return 'Venue Manager';
      case 'venue_staff': return 'Venue Staff';
      default: return 'Admin User';
    }
  };

  const getAccessLevel = (role) => {
    switch (role) {
      case 'super_admin': return 'Full System Access';
      case 'gambino_ops': return 'Operations Access';
      case 'venue_manager': return `Managing ${user?.assignedVenues?.length || 0} venue(s)`;
      case 'venue_staff': return `Access to ${user?.assignedVenues?.length || 0} venue(s)`;
      default: return 'Limited Access';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gambino Admin</h1>
              <p className="text-gray-400 text-sm">{getRoleDisplay(user?.role)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Access Level Badge */}
            <div className="bg-gray-700 px-3 py-1 rounded-full">
              <span className="text-sm text-gray-300">{getAccessLevel(user?.role)}</span>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}