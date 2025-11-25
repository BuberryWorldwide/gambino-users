'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, clearToken, canAccessAdmin } from '@/lib/auth';
import api from '@/lib/api';

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Account management state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = getToken();
    const userData = getUser();

    if (!token || !userData) {
      router.replace('/login');
      return;
    }

    if (!canAccessAdmin(userData)) {
      router.replace('/dashboard');
      return;
    }

    setUser(userData);
    loadProfile();
  }, [router]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/api/users/profile');
      const profileData = res.data?.user;
      setProfile(profileData);
      setProfileForm({
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        phone: profileData?.phone || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');

    try {
      const res = await api.put('/api/users/profile', profileForm);
      if (res.data?.success) {
        setSuccess('Profile updated successfully!');
        await loadProfile();
        setShowEditProfile(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.post('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.data?.success) {
        setSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setPasswordError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleDisplay = (role) => {
    const roleNames = {
      super_admin: 'Super Admin',
      gambino_ops: 'Gambino Operations',
      venue_manager: 'Venue Manager',
      venue_staff: 'Venue Staff'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      super_admin: 'from-red-500 to-orange-500',
      gambino_ops: 'from-purple-500 to-pink-500',
      venue_manager: 'from-blue-500 to-cyan-500',
      venue_staff: 'from-green-500 to-emerald-500'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/10 blur-sm"></div>
          </div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-500/10 to-amber-600/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-600/10 to-yellow-500/5 rounded-full blur-3xl transform -translate-x-24 translate-y-24"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-yellow-400/5 to-transparent rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <span className="text-black font-bold text-lg">G</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-xl blur-sm -z-10"></div>
            </div>
            <div>
              <span className="text-white font-semibold text-lg">Gambino Gold</span>
              <p className="text-xs text-neutral-500">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-neutral-400 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800/50"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRoleColor(user?.role)} flex items-center justify-center shadow-lg relative`}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className={`absolute -inset-1 bg-gradient-to-br ${getRoleColor(user?.role)} rounded-xl blur-sm opacity-30 -z-10`}></div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                Welcome back, {profile?.firstName || user?.email?.split('@')[0] || 'Admin'}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(user?.role)} text-white shadow-lg`}>
                  {getRoleDisplay(user?.role)}
                </span>
                <span className="text-neutral-500 text-sm">•</span>
                <span className="text-neutral-400 text-sm">{profile?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Panel CTA */}
        <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl"></div>
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl shadow-yellow-500/30 relative">
              <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="absolute -inset-2 bg-gradient-to-br from-yellow-400/30 to-amber-500/30 rounded-2xl blur-lg -z-10"></div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Admin Control Panel</h2>
              <p className="text-neutral-400 mb-4">
                Manage users, stores, hubs, machines, and view analytics in the full admin dashboard.
              </p>
              <a
                href="https://admin.gambino.gold/admin/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] transform"
              >
                <span>Open Admin Panel</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <a
            href="https://admin.gambino.gold/admin/users"
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-purple-300 transition-colors">Users</p>
                <p className="text-xs text-neutral-500">Manage accounts</p>
              </div>
            </div>
          </a>

          <a
            href="https://admin.gambino.gold/admin/stores"
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">Stores</p>
                <p className="text-xs text-neutral-500">View locations</p>
              </div>
            </div>
          </a>

          <a
            href="https://admin.gambino.gold/admin/machines"
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-orange-300 transition-colors">Machines</p>
                <p className="text-xs text-neutral-500">Monitor status</p>
              </div>
            </div>
          </a>
        </div>

        {/* Account Management Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Account Management
          </h2>

          {/* Profile Section */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Profile Information</h3>
                  <p className="text-xs text-neutral-500">Update your personal details</p>
                </div>
              </div>
              {!showEditProfile && (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors px-3 py-1 rounded-lg hover:bg-yellow-400/10"
                >
                  Edit
                </button>
              )}
            </div>

            {!showEditProfile ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">Name</p>
                  <p className="text-white">{profile?.firstName} {profile?.lastName || ''}</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">Email</p>
                  <p className="text-white break-all">{profile?.email}</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">Phone</p>
                  <p className="text-white">{profile?.phone || 'Not set'}</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 mb-1">Role</p>
                  <p className="text-white">{getRoleDisplay(user?.role)}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 mb-1 block">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 text-black font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    {savingProfile ? <><LoadingSpinner /> Saving...</> : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfile(false);
                      setProfileForm({
                        firstName: profile?.firstName || '',
                        lastName: profile?.lastName || '',
                        phone: profile?.phone || ''
                      });
                    }}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security Section */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Security</h3>
                <p className="text-xs text-neutral-500">Password and account security</p>
              </div>
            </div>

            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-neutral-600 disabled:to-neutral-700 text-black font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    {changingPassword ? <><LoadingSpinner /> Updating...</> : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* User App Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-neutral-500 hover:text-yellow-400 text-sm transition-colors"
          >
            View as regular user →
          </button>
        </div>
      </main>
    </div>
  );
}
