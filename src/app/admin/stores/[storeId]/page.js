'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const CAN_EDIT = true;            // gate if you need to
const CAN_WALLET = true;          // gate wallet features
const SOLSCAN = (addr) => `https://solscan.io/account/${addr}`;

export default function StoreDetailsPage() {
  const { storeId } = useParams();          // catches slug or _id from the URL
  const router = useRouter();

  // abort/polling refs
  const abortRef = useRef(null);

  // store state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [store, setStore] = useState(null);

  // edit state
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [edit, setEdit] = useState({
    storeName: '',
    city: '',
    state: '',
    address: '',
    zipCode: '',
    phone: '',
    feePercentage: 0,
    ownerUserId: '',
    status: 'active',
  });

  // wallet state
  const [wLoading, setWLoading] = useState(false);
  const [wErr, setWErr] = useState('');
  const [wMsg, setWMsg] = useState('');
  const [wallet, setWallet] = useState(null);

  // transfer modal
  const [txOpen, setTxOpen] = useState(false);
  const [txErr, setTxErr] = useState('');
  const [txSaving, setTxSaving] = useState(false);
  const [tx, setTx] = useState({ token: 'USDC', amount: '', to: '' });

  const clampFee = (n) => {
    const v = Number(n);
    if (Number.isNaN(v)) return 0;
    return Math.min(100, Math.max(0, v));
  };

  const setFromStore = (s) => {
    setEdit({
      storeName: s?.storeName || '',
      city: s?.city || '',
      state: s?.state || '',
      address: s?.address || '',
      zipCode: s?.zipCode || '',
      phone: s?.phone || '',
      feePercentage: s?.feePercentage ?? 0,
      ownerUserId: s?.ownerUserId || s?.owner?._id || '',
      status: s?.status || 'active',
    });
  };

  // ----- fetch store -----
  const fetchStore = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      // prefer RESTful show route
      let res = null;
      try {
        res = await api.get(`/api/admin/stores/${encodeURIComponent(storeId)}`, { signal: abortRef.current.signal });
      } catch (e) {
        // fallback legacy: /api/admin/stores?q=...
        if (e?.response?.status === 404) {
          const list = await api.get(`/api/admin/stores`, { params: { q: storeId }, signal: abortRef.current.signal });
          const hit =
            list?.data?.stores?.find?.(x => x.storeId === storeId || x._id === storeId) ||
            list?.data?.data?.find?.(x => x.storeId === storeId || x._id === storeId) ||
            null;
          res = { data: { store: hit } };
        } else {
          throw e;
        }
      }

      const s = res?.data?.store || res?.data || null;
      if (!s) {
        setErr('Store not found');
        setStore(null);
        return null;
      }
      setStore(s);
      setFromStore(s);
      return s;
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        router.replace('/login?next=' + encodeURIComponent(`/admin/stores/${storeId}`));
        return null;
      }
      if (e?.name !== 'AbortError' && e?.name !== 'CanceledError') {
        setErr(e?.response?.data?.error || 'Failed to load store');
      }
    } finally {
      setLoading(false);
    }
  }, [router, storeId]);

  // ----- fetch wallet -----
const fetchWallet = useCallback(async (s) => {
  if (!CAN_WALLET) return;
  try {
    setWLoading(true);
    setWErr('');

    // Try admin endpoints first (optional)
    let data;
    try {
      const r = await api.get(`/api/admin/wallet/${encodeURIComponent(storeId)}`);
      data = r?.data;
    } catch (e) {
      if (e?.response?.status === 404) {
        try {
          const alt = await api.get(`/api/admin/stores/${encodeURIComponent(storeId)}/wallet`);
          data = alt?.data;
        } catch {/* ignore, we’ll fallback */}
      } else {
        throw e;
      }
    }

    const node = data?.wallet || data || {};
    const apiKey = node.publicKey || node.walletAddress || node.address || null;
    const fallbackKey = s?.walletAddress || s?.publicKey || null;
    const finalKey = apiKey || fallbackKey;

    if (!finalKey) {
      setWallet({ exists: false, publicKey: null, balances: null });
      setWErr('No wallet on file for this store');
      return;
    }

    // Start with balances from admin endpoint if any
    let balances = node.balances || node.tokens || null;

    // If we don't have balances yet, fetch from public balance endpoint
    if (!balances) {
      try {
        const br = await api.get(`/api/wallet/balance/${encodeURIComponent(finalKey)}`);
        const b = br?.data?.balances || {};
        // Normalize keys (server sends GG; UI expects GAMB)
        balances = {
          SOL:  b.SOL ?? 0,
          USDC: b.USDC ?? 0,
          GAMB: (b.GAMB ?? b.GAMBINO ?? b.GG ?? 0),
        };
      } catch {
        // no balances found; leave null
        balances = null;
      }
    } else {
      // Normalize any shape from admin route too
      balances = {
        SOL:  balances.SOL ?? balances.sol ?? 0,
        USDC: balances.USDC ?? balances.usdc ?? 0,
        GAMB: balances.GAMB ?? balances.GAMBINO ?? balances.GG ?? balances.gamb ?? 0,
      };
    }

    setWallet({ exists: true, publicKey: finalKey, balances });
  } catch (e) {
    const pk = s?.walletAddress || s?.publicKey || null;
    setWallet({ exists: Boolean(pk), publicKey: pk, balances: null });
    // Only show error if we truly have nothing to show
    if (!pk) setWErr(e?.response?.data?.error || 'Failed to load wallet');
  } finally {
    setWLoading(false);
  }
}, [storeId]);



  // initial load
  useEffect(() => {
  (async () => {
    const s = await fetchStore();
    if (s) await fetchWallet(s);
  })();
  return () => { abortRef.current?.abort(); };
  }, [fetchStore, fetchWallet]);


  // ----- save edits -----
  const save = async (e) => {
    e?.preventDefault?.();
    if (!store || !CAN_EDIT || saving) return;

    setSaving(true);
    setErr('');
    setSaveMsg('');

    const payload = {
      storeName: edit.storeName.trim(),
      city: edit.city.trim(),
      state: edit.state.trim(),
      address: edit.address.trim(),
      zipCode: edit.zipCode.trim(),
      phone: edit.phone.trim(),
      feePercentage: clampFee(edit.feePercentage),
      ownerUserId: edit.ownerUserId.trim() || undefined,
      status: (edit.status || 'active').toLowerCase(),
    };
    if (!payload.storeName || !payload.city || !payload.state) {
      setErr('Please fill Store Name, City, and State.');
      setSaving(false);
      return;
    }
    if (!['active','inactive','suspended'].includes(payload.status)) {
      payload.status = 'active';
    }

    // optimistic update
    const prev = store;
    const next = { ...store, ...payload };
    setStore(next);

    try {
      try {
        await api.patch(`/api/admin/stores/${encodeURIComponent(store.storeId || store._id)}`, payload);
      } catch (inner) {
        if (inner?.response?.status === 404) {
          await api.post('/api/admin/update-store', { id: store.storeId || store._id, ...payload });
        } else {
          throw inner;
        }
      }
      setSaveMsg('Saved.');
      setTimeout(() => setSaveMsg(''), 1500);
      // re-fetch canonical (keeps relations fresh)
      await fetchStore();
    } catch (e2) {
      setStore(prev);
      setErr(e2?.response?.data?.error || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  // ----- wallet actions -----
  const generateWallet = async () => {
    try {
      setWLoading(true);
      setWErr('');
      setWMsg('');
      await api.post(`/api/admin/wallet/${encodeURIComponent(storeId)}/generate`);
      setWMsg('Wallet generated.');
      await fetchWallet();
    } catch (e) {
      setWErr(e?.response?.data?.error || 'Failed to generate wallet');
    } finally {
      setWLoading(false);
      setTimeout(() => setWMsg(''), 1800);
    }
  };

  const refreshWallet = () => fetchWallet(store);

  const submitTransfer = async (e) => {
    e.preventDefault();
    if (txSaving) return;
    setTxErr('');
    const payload = {
      token: tx.token,
      amount: Number(tx.amount),
      to: tx.to.trim()
    };
    if (!payload.amount || payload.amount <= 0 || !payload.to) {
      setTxErr('Enter a valid destination and amount.');
      return;
    }
    try {
      setTxSaving(true);
      await api.post(`/api/admin/wallet/${encodeURIComponent(storeId)}/transfer`, payload);
      setTxOpen(false);
      setTx({ token: 'USDC', amount: '', to: '' });
      setWMsg('Transfer submitted.');
      await fetchWallet();
    } catch (e2) {
      setTxErr(e2?.response?.data?.error || 'Transfer failed');
    } finally {
      setTxSaving(false);
      setTimeout(() => setWMsg(''), 2000);
    }
  };

  // derived
  const ownerText = useMemo(() => {
    return store?.owner?.email || store?.ownerUserId || '—';
  }, [store]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-neutral-400">Loading store…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Store</h1>
          <Link className="btn btn-ghost" href="/admin/stores">← Back to Stores</Link>
        </div>
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
          {err}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Store</h1>
          <Link className="btn btn-ghost" href="/admin/stores">← Back</Link>
        </div>
        <div className="text-neutral-500">Not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header / breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">
            <Link href="/admin/stores" className="hover:text-neutral-300">Stores</Link> / {store.storeId}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{store.storeName || store.storeId}</h1>
          <div className="text-neutral-400">
            {[store.city, store.state].filter(Boolean).join(', ') || '—'}
          </div>
        </div>
        <Link className="btn btn-ghost" href="/admin/stores">← Back</Link>
      </div>

      {/* Info + Edit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Details</h2>
            {saveMsg && <div className="text-green-400 text-sm">{saveMsg}</div>}
          </div>

          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Store Name</label>
              <input className="input" value={edit.storeName} onChange={(e) => setEdit(v => ({ ...v, storeName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={edit.status} onChange={(e) => setEdit(v => ({ ...v, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="label">City</label>
              <input className="input" value={edit.city} onChange={(e) => setEdit(v => ({ ...v, city: e.target.value }))} required />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={edit.state} onChange={(e) => setEdit(v => ({ ...v, state: e.target.value }))} required />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={edit.address} onChange={(e) => setEdit(v => ({ ...v, address: e.target.value }))} />
            </div>

            <div>
              <label className="label">Zip</label>
              <input className="input" value={edit.zipCode} onChange={(e) => setEdit(v => ({ ...v, zipCode: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={edit.phone} onChange={(e) => setEdit(v => ({ ...v, phone: e.target.value }))} />
            </div>

            <div>
              <label className="label">Fee %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="input"
                value={edit.feePercentage}
                onChange={(e) => setEdit(v => ({ ...v, feePercentage: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Owner User ID</label>
              <input className="input" value={edit.ownerUserId} onChange={(e) => setEdit(v => ({ ...v, ownerUserId: e.target.value }))} />
            </div>

            {CAN_EDIT ? (
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setFromStore(store)} disabled={saving}>
                  Reset
                </button>
                <button className="btn btn-gold" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            ) : null}
          </form>

          {err && (
            <div className="mt-4 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
              {err}
            </div>
          )}
        </div>

        {/* Wallet panel */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Wallet</h2>
            {wMsg && <div className="text-green-400 text-sm">{wMsg}</div>}
          </div>

          {wLoading ? (
            <div className="text-neutral-400 text-sm flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-r-transparent" />
              Loading wallet…
            </div>
          ) : wallet?.exists ? (
            <>
              <div className="text-sm text-neutral-400">Public Key</div>
              <div className="font-mono text-xs break-all mt-1">{wallet.publicKey}</div>
              <div className="mt-2 flex gap-2">
                <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={SOLSCAN(wallet.publicKey)}>
                  View on Solscan →
                </a>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => navigator.clipboard.writeText(wallet.publicKey || '')}
                >
                  Copy
                </button>
              </div>

              <div className="mt-4">
                <div className="font-semibold mb-2">Balances</div>
                <ul className="text-sm divide-y divide-neutral-800">
                  <li className="py-2 flex items-center justify-between">
                    <span>SOL</span><span>{wallet?.balances?.SOL ?? 0}</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span>USDC</span><span>{wallet?.balances?.USDC ?? 0}</span>
                  </li>
                  <li className="py-2 flex items-center justify-between">
                    <span>GAMB</span><span>{wallet?.balances?.GAMB ?? 0}</span>
                  </li>
                            
                </ul>
              </div>

              {CAN_WALLET && (
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={refreshWallet}>Refresh</button>
                  <button className="btn btn-gold btn-sm" onClick={() => setTxOpen(true)}>Transfer</button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-neutral-400 text-sm mb-3">No wallet generated yet for this store.</div>
              {CAN_WALLET && (
                <button className="btn btn-gold" onClick={generateWallet}>Generate Wallet</button>
              )}
            </>
          )}

          {wErr && (
            <div className="mt-3 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
              {wErr}
            </div>
          )}
        </div>
      </div>

      {/* Activity (placeholder, wire to your endpoint when ready) */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
          <span className="text-xs text-neutral-500">Coming soon</span>
        </div>
        <div className="text-neutral-500 text-sm">
          Hook this to something like <code>/api/admin/stores/{'{storeId}'}/activity?limit=20</code> when you expose it.
        </div>
      </div>

      {/* Transfer Modal */}
      {txOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-950">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="font-semibold">Transfer from Store Wallet</div>
              <button className="text-neutral-500 hover:text-neutral-300" onClick={() => { setTxOpen(false); setTxErr(''); }}>✕</button>
            </div>

            {txErr && (
              <div className="mx-4 mt-4 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
                {txErr}
              </div>
            )}

            <form onSubmit={submitTransfer} className="p-4 space-y-4">
              <div>
                <label className="label">Token</label>
                <select className="input" value={tx.token} onChange={(e) => setTx(v => ({ ...v, token: e.target.value }))}>
                  <option value="USDC">USDC</option>
                  <option value="GAMB">GAMB</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  className="input"
                  value={tx.amount}
                  onChange={(e) => setTx(v => ({ ...v, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Destination Address</label>
                <input
                  className="input font-mono text-xs"
                  value={tx.to}
                  onChange={(e) => setTx(v => ({ ...v, to: e.target.value }))}
                  placeholder="Recipient public key"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" className="btn btn-ghost" onClick={() => setTxOpen(false)} disabled={txSaving}>
                  Cancel
                </button>
                <button className="btn btn-gold" disabled={txSaving}>
                  {txSaving ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
