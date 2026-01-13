import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { clearToken } from '@/lib/auth';

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

export default function AccountTab({
  profile,
  setError,
  setSuccess,
  refreshProfile
}) {
  const router = useRouter();

  // Profile editing
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: ''
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Account deletion
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: ''
  });
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await api.put('/api/users/profile', profileForm);
      if (res.data?.success) {
        setSuccess('Profile updated successfully!');
        await refreshProfile();
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

    if (passwordForm.newPassword.length < 12) {
      setPasswordError('New password must be at least 12 characters');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)) {
      setPasswordError('New password must contain at least one special character');
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

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteForm.confirmation !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm');
      return;
    }

    if (!deleteForm.password) {
      setDeleteError('Password is required');
      return;
    }

    try {
      setDeletingAccount(true);
      const res = await api.post('/api/users/delete-account', {
        password: deleteForm.password,
        confirmation: deleteForm.confirmation
      });

      if (res.data?.success) {
        // Clear auth and redirect to login with message
        clearToken();
        router.push('/login?deleted=true');
      }
    } catch (err) {
      setDeleteError(err?.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profile</h2>
              <p className="text-xs text-neutral-400">Your account information</p>
            </div>
          </div>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Name</p>
              <p className="text-white">{profile?.firstName} {profile?.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Email</p>
              <p className="text-white break-all">{profile?.email}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Phone</p>
              <p className="text-white">{profile?.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Date of Birth</p>
              <p className={`${profile?.dateOfBirth ? 'text-white' : 'text-amber-400'}`}>
                {profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', { timeZone: 'UTC' })
                  : 'Not set - Required for age verification'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Member Since</p>
              <p className="text-white">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {profile?.ageVerified && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Age Verification</p>
                <p className="text-green-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">First Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({...prev, firstName: e.target.value}))}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Last Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({...prev, lastName: e.target.value}))}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({...prev, phone: e.target.value}))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">
                  Date of Birth {!profile?.dateOfBirth && <span className="text-amber-400">(Required)</span>}
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  value={profileForm.dateOfBirth}
                  onChange={(e) => setProfileForm(prev => ({...prev, dateOfBirth: e.target.value}))}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  required={!profile?.dateOfBirth}
                />
                <p className="text-xs text-neutral-500 mt-1">Must be 18 years or older</p>
              </div>
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
                    phone: profile?.phone || '',
                    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
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

      {/* KYC Verification Status */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            profile?.kycStatus === 'verified'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : profile?.kycStatus === 'rejected'
                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">KYC Verification</h2>
            <p className="text-xs text-neutral-400">Identity verification status</p>
          </div>
        </div>

        {profile?.kycStatus === 'verified' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-green-300 font-semibold">Identity Verified</p>
                <p className="text-green-400/70 text-sm">
                  Verified on {profile?.kycVerifiedAt ? new Date(profile.kycVerifiedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-neutral-400 text-sm">
              Your identity has been verified. You have full access to all platform features.
            </p>
          </div>
        ) : profile?.kycStatus === 'rejected' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-300 font-semibold">Verification Rejected</p>
                <p className="text-red-400/70 text-sm">Please contact support for assistance.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-300 font-semibold">Verification Pending</p>
                <p className="text-blue-400/70 text-sm">Visit a venue to complete verification</p>
              </div>
            </div>

            <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-medium">How to Verify</h3>
              <ol className="text-neutral-300 text-sm space-y-2 list-decimal list-inside">
                <li>Visit any participating Gambino venue</li>
                <li>Bring a valid government-issued ID</li>
                <li>Ask staff to verify your account</li>
                <li>Receive <span className="text-yellow-400 font-semibold">25 GG tokens</span> instantly!</li>
              </ol>
              {profile?.referredBy && (
                <p className="text-cyan-400 text-sm mt-2">
                  <span className="font-semibold">Bonus:</span> You were referred! Completing KYC will also unlock your referral rewards.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Security</h2>
            <p className="text-xs text-neutral-400">Password and account security</p>
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
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">New Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                placeholder="Min 12 chars, include special character"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                required
                minLength={12}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">Confirm New Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
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

      {/* Delete Account - Danger Zone */}
      <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-400">Danger Zone</h2>
            <p className="text-xs text-red-300/60">Irreversible account actions</p>
          </div>
        </div>

        {!showDeleteAccount ? (
          <div>
            <p className="text-sm text-neutral-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="px-4 py-2 bg-red-900/50 border border-red-800 hover:bg-red-900 text-red-300 rounded-xl transition-colors"
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warning Box */}
            <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Warning: This action is permanent
              </h4>
              <ul className="text-sm text-red-300/80 space-y-1 ml-7">
                <li>Your profile and personal data will be deleted</li>
                <li>Your wallet and token balance will be inaccessible</li>
                <li>Your referral history and rewards will be lost</li>
                <li>Your transaction history will be removed</li>
                <li>This cannot be undone or recovered</li>
              </ul>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {deleteError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Enter your password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-red-800/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  value={deleteForm.password}
                  onChange={(e) => setDeleteForm(prev => ({...prev, password: e.target.value}))}
                  placeholder="Your current password"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1 block">
                  Type <span className="text-red-400 font-mono">DELETE MY ACCOUNT</span> to confirm
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-red-800/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono"
                  value={deleteForm.confirmation}
                  onChange={(e) => setDeleteForm(prev => ({...prev, confirmation: e.target.value}))}
                  placeholder="DELETE MY ACCOUNT"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={deletingAccount || deleteForm.confirmation !== 'DELETE MY ACCOUNT'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  {deletingAccount ? (
                    <>
                      <LoadingSpinner />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Permanently Delete Account
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteForm({ password: '', confirmation: '' });
                    setDeleteError('');
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Sign Out</h3>
            <p className="text-xs text-neutral-400">Log out of your account</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
