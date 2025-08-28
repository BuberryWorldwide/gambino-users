'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

const ROLE_OPTIONS = ['user', 'store_manager', 'store_owner', 'super_admin'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', active: 'any' });
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.role) params.role = filters.role;
      if (filters.active === 'true' || filters.active === 'false') params.active = filters.active;

      const { data } = await api.get('/api/admin/users', { params });
      setUsers(data?.users || data?.data || []);
      setCount(data?.count ?? (data?.users?.length || 0));
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load users');
      setUsers([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const onSearch = async (e) => { e.preventDefault(); await load(); };

  const updateUser = async (id, patch) => {
    setSavingId(id);
    setErr('');
    try {
      await api.put(`/api/admin/users/${id}`, patch);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to update user');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <form onSubmit={onSearch} className="flex flex-wrap gap-2">
          <input
            className="input"
            placeholder="Search name/email…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <select
            className="input"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="input"
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
          >
            <option value="any">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn btn-ghost" type="submit">Filter</button>
        </form>
      </div>

      {err && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4">
          {err}
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="p-4 text-sm text-neutral-400">Total: {count}</div>
        {loading ? (
          <div className="p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-r-transparent" />
            <div className="text-neutral-400 text-sm">Loading users…</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Wallet</th>
                <th className="p-3">Role</th>
                <th className="p-3">Active</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td className="p-4 text-neutral-500" colSpan={6}>No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="border-b border-neutral-900 hover:bg-neutral-900/30">
                  <td className="p-3">
                    <div className="font-medium">{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}</div>
                    <div className="text-neutral-500 text-xs">{u.email}</div>
                  </td>
                  <td className="p-3 break-all text-xs">{u.walletAddress || '—'}</td>
                  <td className="p-3">
                    <select
                      className="input"
                      value={u.role || 'user'}
                      onChange={(e) => updateUser(u._id, { role: e.target.value })}
                      disabled={savingId === u._id}
                    >
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      className={`btn ${u.isActive ? 'btn-ghost' : 'btn-gold'}`}
                      onClick={() => updateUser(u._id, { isActive: !u.isActive })}
                      disabled={savingId === u._id}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                  <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="p-3">
                    {savingId === u._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-r-transparent" />
                    ) : (
                      <span className="text-neutral-500 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
