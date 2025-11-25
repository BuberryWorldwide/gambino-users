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
      gambino_ops: 'Gambino Ops',
      venue_manager: 'Venue Manager',
      venue_staff: 'Venue Staff'
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-yellow-400/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-400 animate-spin"></div>
          </div>
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <span className="text-black font-bold">G</span>
            </div>
            <div>
              <span className="text-white font-medium">Gambino Gold</span>
              <span className="text-neutral-600 text-sm ml-2">Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-neutral-500 hover:text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">
            Welcome, {profile?.firstName || user?.email?.split('@')[0]}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {getRoleDisplay(user?.role)} • {profile?.email}
          </p>
        </div>

        {/* Admin Panel CTA */}
        <a
          href="https://admin.gambino.gold/admin/dashboard"
          className="block mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-xl hover:border-yellow-500/40 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-medium mb-1">Open Admin Panel</h2>
              <p className="text-neutral-500 text-sm">
                Manage users, stores, hubs, and machines
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </a>

        {/* Account Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Account</h2>

          {/* Profile */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Profile</h3>
              {!showEditProfile && (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {!showEditProfile ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-neutral-500 mb-0.5">Name</p>
                  <p className="text-white">{profile?.firstName} {profile?.lastName || ''}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-0.5">Email</p>
                  <p className="text-white break-all">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-0.5">Phone</p>
                  <p className="text-neutral-400">{profile?.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-0.5">Role</p>
                  <p className="text-white">{getRoleDisplay(user?.role)}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">First Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 mb-1 block">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {savingProfile ? <><LoadingSpinner /> Saving...</> : 'Save'}
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
                    className="px-3 py-1.5 text-neutral-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <h3 className="text-white font-medium mb-3">Security</h3>

            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Change password →
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3">
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">New Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {changingPassword ? <><LoadingSpinner /> Updating...</> : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="px-3 py-1.5 text-neutral-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-8 pt-4 border-t border-neutral-800 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
          >
            View user dashboard →
          </button>
        </div>
      </main>
    </div>
  );
}
