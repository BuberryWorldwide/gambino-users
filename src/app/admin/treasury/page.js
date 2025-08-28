'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminTreasuryPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const [rotatingId, setRotatingId] = useState(null);
  const [balances, setBalances] = useState({}); // { publicKey: {SOL, GG, USDC} }

  const [form, setForm] = useState({
    label: '',
    purpose: 'other', // main|jackpot|ops|team|community|store_float|other
    publicKey: '',
    privateKeyBase64: ''
  });

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get('/api/admin/treasury');
      const list = data?.wallets || [];
      setWallets(list);
      // fetch balances for each wallet via existing public endpoint
      const map = {};
      await Promise.all(list.map(async (w) => {
        const pk = w.publicKey;
        if (!pk) return;
        try {
          const b = await api.get(`/api/wallet/balance/${pk}`);
          map[pk] = b?.data?.balances || {};
        } catch (_) {
          map[pk] = { SOL: null, GG: null, USDC: null };
        }
      }));
      setBalances(map);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load treasury wallets');
      setWallets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    setErr(''); setMsg('');
    try {
      await api.post('/api/admin/treasury', form);
      setMsg('Wallet added.');
      setForm({ label: '', purpose: 'other', publicKey: '', privateKeyBase64: '' });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to add wallet');
    } finally {
      setAdding(false);
      setTimeout(() => setMsg(''), 2500);
    }
  };

  const onRotate = async (id) => {
    const newKey = prompt('Paste new privateKey (base64) for rotation:');
    if (!newKey) return;
    setRotatingId(id);
    setErr(''); setMsg('');
    try {
      await api.post(`/api/admin/treasury/${id}/rotate`, { privateKeyBase64: newKey });
      setMsg('Key rotated.');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to rotate key');
    } finally {
      setRotatingId(null);
      setTimeout(() => setMsg(''), 2500);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Treasury Wallets</h1>
      </div>

      {err && <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4">{err}</div>}
      {msg && <div className="bg-green-900/20 border border-green-500 text-green-300 p-3 rounded-lg text-sm mb-4">{msg}</div>}

      {/* Add wallet */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold mb-4">Add a wallet</h2>
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Label</label>
            <input className="input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div>
            <label className="label">Purpose</label>
            <select className="input" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
              {['main','jackpot','ops','team','community','store_float','other'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Public Key</label>
            <input className="input" value={form.publicKey} onChange={e => setForm({ ...form, publicKey: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Private Key (base64)</label>
            <input className="input" value={form.privateKeyBase64} onChange={e => setForm({ ...form, privateKeyBase64: e.target.value })} required />
          </div>
          <div className="md:col-span-3">
            <button className="btn btn-gold" disabled={adding}>{adding ? 'Adding…' : 'Add Wallet'}</button>
          </div>
        </form>
      </div>

      {/* Wallets table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-r-transparent" />
            <div className="text-neutral-400 text-sm">Loading wallets…</div>
          </div>
        ) : wallets.length === 0 ? (
          <div className="p-4 text-neutral-500 text-sm">No wallets yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-3">Label</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Public Key</th>
                <th className="p-3">Balances</th>
                <th className="p-3">Source</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w, i) => {
                const b = balances[w.publicKey] || {};
                return (
                  <tr key={(w._id || w.publicKey || i) + '-row'} className="border-b border-neutral-900 hover:bg-neutral-900/30">
                    <td className="p-3 font-medium">{w.label}</td>
                    <td className="p-3">{w.purpose || '—'}</td>
                    <td className="p-3 break-all text-xs">{w.publicKey}</td>
                    <td className="p-3 text-xs">
                      SOL: {b.SOL ?? '—'} &nbsp;|&nbsp; GG: {b.GG ?? '—'} &nbsp;|&nbsp; USDC: {b.USDC ?? '—'}
                    </td>
                    <td className="p-3 text-xs">{w.source || 'db'}</td>
                    <td className="p-3">
                      {w._id ? (
                        <button
                          className="btn btn-ghost"
                          disabled={rotatingId === w._id}
                          onClick={() => onRotate(w._id)}
                        >
                          {rotatingId === w._id ? 'Rotating…' : 'Rotate Key'}
                        </button>
                      ) : (
                        <span className="text-neutral-500 text-xs">env</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
