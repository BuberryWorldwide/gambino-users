import { useState } from 'react';
import api from '@/lib/api';

export default function SettingsTab({ 
  profile, 
  currentSession, 
  setError, 
  setSuccess, 
  refreshSession 
}) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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

  const handleEndSession = async () => {
    try {
      await api.post('/api/users/end-session');
      await refreshSession();
      setSuccess('Session ended successfully');
    } catch (err) {
      setError('Failed to end session');
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Account Information</h2>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            Account Active
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="label mb-2">Name</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300">
              {profile?.firstName} {profile?.lastName}
            </div>
          </div>
          <div>
            <div className="label mb-2">Email Address</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300 break-all">
              {profile?.email || 'Loading...'}
            </div>
          </div>
          <div>
            <div className="label mb-2">Phone</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300">
              {profile?.phone || 'Not set'}
            </div>
          </div>
          <div>
            <div className="label mb-2">Member Since</div>
            <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 text-neutral-300">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4">Security Settings</h2>
        
        <div className="space-y-4">
          <button 
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="btn btn-ghost w-full sm:w-auto"
          >
            {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
          </button>

          {showChangePassword && (
            <div className="mt-4 p-4 border border-neutral-700 rounded-lg bg-neutral-900/50">
              <h3 className="text-base font-semibold mb-4 text-white">Change Password</h3>
              
              {passwordError && (
                <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    className="input mt-1"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input 
                    type="password" 
                    className="input mt-1"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                    required
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input mt-1"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                    required
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    type="submit" 
                    disabled={changingPassword}
                    className="btn btn-primary"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowChangePassword(false)} 
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Active Session Management */}
      {currentSession && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Active Session</h2>
          
          <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white font-medium">{currentSession.machineName || currentSession.machineId}</div>
                <div className="text-sm text-green-400">{currentSession.storeName}</div>
                <div className="text-xs text-green-500 mt-1">
                  Started: {new Date(currentSession.startedAt).toLocaleTimeString()}
                  {currentSession.duration && ` • ${currentSession.duration} min`}
                </div>
              </div>
              <button
                onClick={handleEndSession}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4">Account Status</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Account Status:</span>
            <span className="text-green-400 font-medium">
              {profile?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">User Role:</span>
            <span className="text-white font-medium">
              {(profile?.role || 'user').replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Tier Level:</span>
            <span className={`font-medium ${
              profile?.tier === 'tier1' ? 'text-yellow-400' :
              profile?.tier === 'tier2' ? 'text-blue-400' :
              profile?.tier === 'tier3' ? 'text-green-400' :
              'text-neutral-400'
            }`}>
              {(profile?.tier || 'none').toUpperCase()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Last Activity:</span>
            <span className="text-white">
              {profile?.lastActivity ? 
                new Date(profile.lastActivity).toLocaleDateString() : 
                'Never'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}