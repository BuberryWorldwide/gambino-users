// app/admin/stores/page.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';


const DEFAULT_LIMIT = 20;
const ADMIN_CAN_EDIT = true; // toggle if you want to gate later

export default function AdminStoresPage() {
  // list state
  const [stores, setStores] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // query/pagination
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = DEFAULT_LIMIT;

  // create form
  const [form, setForm] = useState({
    storeId: '',
    storeName: '',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    phone: '',
    feePercentage: 5,
    ownerUserId: '' // optional
  });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    storeId: '',
    storeName: '',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    phone: '',
    feePercentage: 5,
    ownerUserId: '',
    status: 'active',
  });

  // helpers
  const debounceRef = useRef(null);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((count || 0) / limit)),
    [count, limit]
  );
  const slugify = (s) =>
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const clampFee = (n) => {
    const v = Number(n);
    if (Number.isNaN(v)) return 0;
    return Math.min(100, Math.max(0, v));
  };

  // fetch
  const fetchStores = async ({ query = q, pageNum = page } = {}) => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get('/api/admin/stores', {
        params: { q: query, page: pageNum, limit }
      });
      setStores(data?.stores || data?.data || []);
      setCount(
        data?.count ??
          (typeof data?.total === 'number' ? data.total : (data?.stores?.length || 0))
      );
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load stores');
      setStores([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  // init
  useEffect(() => { fetchStores({ query: '', pageNum: 1 }); }, []);

  // debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchStores({ query: q, pageNum: 1 });
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // create
  const onCreate = async (e) => {
    e.preventDefault();
    if (creating) return;

    setCreating(true);
    setErr('');
    setCreateMsg('');

    const payload = {
      ...form,
      storeId: slugify(form.storeId),
      feePercentage: clampFee(form.feePercentage)
    };

    if (!payload.storeId || !payload.storeName || !payload.city || !payload.state) {
      setErr('Please fill Store ID, Store Name, City, and State.');
      setCreating(false);
      return;
    }

    try {
      await api.post('/api/admin/stores', payload);
      setCreateMsg('Store created successfully.');
      setForm({
        storeId: '',
        storeName: '',
        city: '',
        state: '',
        address: '',
        zipCode: '',
        phone: '',
        feePercentage: 5,
        ownerUserId: ''
      });
      setPage(1);
      await fetchStores({ query: q, pageNum: 1 });
    } catch (inner) {
      if (inner?.response?.status === 409) {
        setErr('A store with that ID already exists.');
      } else if (inner?.response?.status === 404) {
        // optional fallback
        try {
          await api.post('/api/admin/create-store', {
            storeId: payload.storeId,
            storeName: payload.storeName,
            city: payload.city,
            state: payload.state,
            address: payload.address,
            zipCode: payload.zipCode,
            phone: payload.phone
          });
          setCreateMsg('Store created successfully.');
          setForm({
            storeId: '',
            storeName: '',
            city: '',
            state: '',
            address: '',
            zipCode: '',
            phone: '',
            feePercentage: 5,
            ownerUserId: ''
          });
          setPage(1);
          await fetchStores({ query: q, pageNum: 1 });
        } catch (fallbackErr) {
          setErr(fallbackErr?.response?.data?.error || 'Failed to create store (fallback).');
        }
      } else {
        setErr(inner?.response?.data?.error || 'Failed to create store');
      }
    } finally {
      setCreating(false);
      if (!err) setTimeout(() => setCreateMsg(''), 2500);
    }
  };

  // edit controls
  const openEdit = (store) => {
    if (!ADMIN_CAN_EDIT) return;
    setEditErr('');
    setEditMsg('');
    setEditTarget(store);
    setEditForm({
      storeId: store.storeId || '',
      storeName: store.storeName || '',
      city: store.city || '',
      state: store.state || '',
      address: store.address || '',
      zipCode: store.zipCode || '',
      phone: store.phone || '',
      feePercentage: store.feePercentage ?? 0,
      ownerUserId: store.ownerUserId || store.owner?._id || '',
      status: store.status || 'active',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editTarget || editSaving) return;

    setEditSaving(true);
    setEditErr('');
    setEditMsg('');

    const id = editTarget.storeId || editTarget._id;
    if (!id) {
      setEditErr('Missing store identifier.');
      setEditSaving(false);
      return;
    }

    // Normalize & validate
    const payload = {
      storeName: String(editForm.storeName || '').trim(),
      city: String(editForm.city || '').trim(),
      state: String(editForm.state || '').trim(),
      address: String(editForm.address || '').trim(),
      zipCode: String(editForm.zipCode || '').trim(),
      phone: String(editForm.phone || '').trim(),
      feePercentage: clampFee(editForm.feePercentage),
      ownerUserId: String(editForm.ownerUserId || '').trim() || undefined,
      status: (editForm.status || 'active').toLowerCase(),
    };

    if (!payload.storeName || !payload.city || !payload.state) {
      setEditErr('Please fill Store Name, City, and State.');
      setEditSaving(false);
      return;
    }
    if (!['active','inactive','suspended'].includes(payload.status)) {
      payload.status = 'active';
    }

    // Optimistic UI update
    const prev = stores;
    const next = prev.map(s =>
      (s.storeId === editTarget.storeId || s._id === editTarget._id)
        ? { ...s, ...payload }
        : s
    );
    setStores(next);

    try {
      // Prefer PATCH /api/admin/stores/:idOrSlug
      try {
        await api.patch(`/api/admin/stores/${encodeURIComponent(id)}`, payload);
      } catch (inner) {
        if (inner?.response?.status === 404) {
          // Fallback legacy route
          await api.post('/api/admin/update-store', { id, ...payload });
        } else {
          throw inner;
        }
      }

      setEditMsg('Store updated.');
      setTimeout(() => setEditMsg(''), 1800);
      // refresh this page silently to get canonical data
      await fetchStores({ query: q, pageNum: page });
      setEditOpen(false);
    } catch (e2) {
      // Revert optimistic update
      setStores(prev);
      setEditErr(e2?.response?.data?.error || 'Failed to update store');
    } finally {
      setEditSaving(false);
    }
  };

  const go = async (p) => {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next === page) return;
    setPage(next);
    await fetchStores({ query: q, pageNum: next });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stores</h1>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Search by id/name/city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-ghost" type="button" onClick={() => fetchStores({ query: q, pageNum: 1 })}>
            Search
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4">
          {err}
        </div>
      )}
      {createMsg && (
        <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 rounded-lg text-sm mb-4">
          {createMsg}
        </div>
      )}

      {/* Create Store */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-4">Add a new store</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Store ID (slug)</label>
            <input
              className="input"
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: slugify(e.target.value) })}
              placeholder="e.g. vegas-strip-01"
              required
            />
          </div>
          <div>
            <label className="label">Store Name</label>
            <input className="input" value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} required />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Zip</label>
            <input className="input" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-555-5555" />
          </div>
          <div>
            <label className="label">Fee %</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="input"
              value={form.feePercentage}
              onChange={(e) => setForm({ ...form, feePercentage: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Owner User ID (optional)</label>
            <input className="input" value={form.ownerUserId} onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })} placeholder="mongo id or UUID" />
          </div>

          <div className="md:col-span-3">
            <button className="btn btn-gold" disabled={creating}>
              {creating ? 'Creating…' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>

      {/* Stores Table */}
      <div className="card overflow-x-auto">
        <div className="p-4 text-sm text-neutral-400">
          Total: {count} {loading && <span className="ml-2">· Loading…</span>}
        </div>

        {loading ? (
          <div className="p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-r-transparent" />
            <div className="text-neutral-400 text-sm">Loading stores…</div>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-3">Store</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Fee %</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">ID</th>
                  <th className="p-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td className="p-4 text-neutral-500" colSpan={8}>
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  stores.map((s) => (
                    <tr key={s._id || s.storeId} className="border-b border-neutral-900 hover:bg-neutral-900/30">
                      {/* NAME → LINK TO DETAILS */}
                      <td className="p-3">
                        <div className="font-medium">
                          <Link
                            href={`/admin/stores/${encodeURIComponent(s.storeId || s._id)}`}
                            className="hover:text-yellow-400"
                          >
                            {s.storeName || s.storeId}
                          </Link>
                        </div>
                        <div className="text-neutral-500 text-xs">{s.address || '—'}</div>
                      </td>
                  
                      <td className="p-3">{[s.city, s.state].filter(Boolean).join(', ')}</td>
                      <td className="p-3">{s.feePercentage ?? 0}%</td>
                      <td className="p-3 capitalize">{s.status || 'active'}</td>
                      <td className="p-3 text-xs">{s.owner?.email || s.ownerUserId || '—'}</td>
                      <td className="p-3">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="p-3"><Copyable mono text={s.storeId || s._id} /></td>
                      <td className="p-3">
                        {ADMIN_CAN_EDIT ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                            Edit
                          </button>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 text-sm">
              <div className="text-neutral-500">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" disabled={page <= 1} onClick={() => go(page - 1)}>
                  ← Prev
                </button>
                <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => go(page + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-neutral-800 bg-neutral-950">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div>
                <div className="font-semibold">Edit Store</div>
                <div className="text-xs text-neutral-500 mt-0.5">{editForm.storeId}</div>
              </div>
              <button
                className="text-neutral-500 hover:text-neutral-300"
                onClick={() => { setEditOpen(false); setEditErr(''); setEditMsg(''); }}
                disabled={editSaving}
              >
                ✕
              </button>
            </div>

            {editErr && (
              <div className="mx-4 mt-4 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
                {editErr}
              </div>
            )}
            {editMsg && (
              <div className="mx-4 mt-4 bg-green-900/20 border border-green-500 text-green-300 p-3 rounded-lg text-sm">
                {editMsg}
              </div>
            )}

            <form onSubmit={saveEdit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Store Name</label>
                <input className="input" value={editForm.storeName} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} required />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input className="input" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div>
                <label className="label">Zip</label>
                <input className="input" value={editForm.zipCode} onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Fee %</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="input"
                  value={editForm.feePercentage}
                  onChange={(e) => setEditForm({ ...editForm, feePercentage: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Owner User ID</label>
                <input className="input" value={editForm.ownerUserId} onChange={(e) => setEditForm({ ...editForm, ownerUserId: e.target.value })} />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setEditOpen(false); setEditErr(''); setEditMsg(''); }}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button className="btn btn-gold" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* small helpers */
function Copyable({ text, mono }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(String(text || ''));
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className="inline-flex items-center gap-2 px-2 py-1 rounded border border-neutral-800 hover:bg-neutral-900/50"
      title="Copy to clipboard"
    >
      <span className={mono ? 'font-mono text-xs' : ''}>{text || '—'}</span>
      <svg className={`w-3.5 h-3.5 ${copied ? 'text-green-400' : 'text-neutral-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {copied ? (
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7h8a2 2 0 012 2v8m-6 0H8a2 2 0 01-2-2V7m6 12l6-6" />
        )}
      </svg>
    </button>
  );
}
