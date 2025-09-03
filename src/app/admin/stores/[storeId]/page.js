'use client';

import { useEffect, useState, useCallback, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const SOLSCAN = (addr) => `https://solscan.io/account/${addr}`;

export default function StoreDetailPage({ params }) {
  const resolvedParams = use(params);
  const storeId = resolvedParams?.storeId;
  const router = useRouter();

  // Existing store management states
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [edit, setEdit] = useState({
    storeName: '', city: '', state: '', address: '', zipCode: '', phone: '',
    feePercentage: 5, ownerUserId: '', status: 'active'
  });

  // Existing wallet states
  const [wallet, setWallet] = useState({ exists: false, publicKey: null, balances: null });
  const [wLoading, setWLoading] = useState(false);
  const [wErr, setWErr] = useState('');
  const [wMsg, setWMsg] = useState('');
  const [txOpen, setTxOpen] = useState(false);
  const [tx, setTx] = useState({ token: 'USDC', amount: '', to: '' });
  const [txSaving, setTxSaving] = useState(false);
  const [txErr, setTxErr] = useState('');

  // New tab and machine management states
  const [activeTab, setActiveTab] = useState('details');
  const [machines, setMachines] = useState([]);
  const [machineStats, setMachineStats] = useState({ total: 0, active: 0, inactive: 0, maintenance: 0 });
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [machinesError, setMachinesError] = useState('');
  
  // QR code modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  // Add machine modal states
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachine, setNewMachine] = useState({
    machineId: '',
    name: '',
    location: '',
    gameType: 'slot',
    hubId: ''
  });
  const [addingMachine, setAddingMachine] = useState(false);

  // Bulk operations
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Connection info modal
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);

  const CAN_EDIT = true; // Update based on your admin logic
  const CAN_WALLET = true; // Update based on your admin logic

  // Helper functions
  const clampFee = (val) => Math.max(0, Math.min(100, Number(val) || 0));
  const abortRef = useRef();

  // Set edit form from store data
  const setFromStore = useCallback((s) => {
    if (!s) return;
    setEdit({
      storeName: s.storeName || '',
      city: s.city || '',
      state: s.state || '',
      address: s.address || '',
      zipCode: s.zipCode || '',
      phone: s.phone || '',
      feePercentage: s.feePercentage ?? 5,
      ownerUserId: s.ownerUserId || '',
      status: s.status || 'active',
    });
  }, []);

  // Your existing fetchStore function (keeping the same logic)
  const fetchStore = useCallback(async () => {
    setLoading(true);
    setErr('');
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      let res;
      try {
        res = await api.get(`/api/admin/stores/${encodeURIComponent(storeId)}`, {
          signal: abortRef.current.signal
        });
      } catch (e) {
        if (e?.response?.status === 404) {
          const list = await api.get('/api/admin/stores');
          const hit = list?.data?.stores?.find?.(x => x.storeId === storeId || x._id === storeId) ||
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
  }, [router, storeId, setFromStore]);

  // Your existing fetchWallet function (keeping the same logic)
  const fetchWallet = useCallback(async (s) => {
    if (!CAN_WALLET) return;
    try {
      setWLoading(true);
      setWErr('');

      let data;
      try {
        const r = await api.get(`/api/admin/wallet/${encodeURIComponent(storeId)}`);
        data = r?.data;
      } catch (e) {
        if (e?.response?.status === 404) {
          try {
            const alt = await api.get(`/api/admin/stores/${encodeURIComponent(storeId)}/wallet`);
            data = alt?.data;
          } catch {/* ignore, we'll fallback */}
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

      let balances = node.balances || node.tokens || null;

      if (!balances) {
        try {
          const br = await api.get(`/api/wallet/balance/${encodeURIComponent(finalKey)}`);
          const b = br?.data?.balances || {};
          balances = {
            SOL: b.SOL ?? 0,
            USDC: b.USDC ?? 0,
            GAMB: (b.GAMB ?? b.GAMBINO ?? b.GG ?? 0),
          };
        } catch {
          balances = null;
        }
      } else {
        balances = {
          SOL: balances.SOL ?? balances.sol ?? 0,
          USDC: balances.USDC ?? balances.usdc ?? 0,
          GAMB: balances.GAMB ?? balances.GAMBINO ?? balances.GG ?? balances.gamb ?? 0,
        };
      }

      setWallet({ exists: true, publicKey: finalKey, balances });
    } catch (e) {
      const pk = s?.walletAddress || s?.publicKey || null;
      setWallet({ exists: Boolean(pk), publicKey: pk, balances: null });
      if (!pk) setWErr(e?.response?.data?.error || 'Failed to load wallet');
    } finally {
      setWLoading(false);
    }
  }, [storeId]);

  // New function to fetch machines for this store
  const fetchMachines = useCallback(async () => {
    try {
      setMachinesLoading(true);
      setMachinesError('');
      const { data } = await api.get(`/api/machines/stores/${encodeURIComponent(storeId)}`);
      setMachines(data.machines || []);
      setMachineStats(data.stats || { total: 0, active: 0, inactive: 0, maintenance: 0 });
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to load machines');
    } finally {
      setMachinesLoading(false);
    }
  }, [storeId]);

  const generateMachineQR = async (machineId) => {
  try {
    setGeneratingQR(true);
    const machine = machines.find(m => m._id === machineId);
    if (!machine) return;

    const { data } = await api.get(`/api/machines/${encodeURIComponent(machine._id)}/qr-code`);
    setQRCodeData({
      machine,
      qrCode: data.qrCode,
      bindUrl: data.bindUrl,
      instructions: data.instructions
    });
    setShowQRModal(true);
  } catch (err) {
    setMachinesError(err?.response?.data?.error || 'Failed to generate QR code');
  } finally {
    setGeneratingQR(false);
  }

};

const regenerateMachineQR = async (machineId) => {
  try {
    setGeneratingQR(true);
    const machine = machines.find(m => m._id === machineId);
    if (!machine) return;

    const { data } = await api.post(`/api/machines/${encodeURIComponent(machine._id)}/regenerate-qr`);
    setQRCodeData({
      machine,
      qrCode: data.qrCode,
      bindUrl: data.bindUrl,
      instructions: data.instructions || [
        'Print and attach QR code to machine',
        'Users scan to bind account to machine',
        'One user per machine at a time'
      ],
      generated: data.generated
    });
  } catch (err) {
    setMachinesError(err?.response?.data?.error || 'Failed to regenerate QR code');
  } finally {
    setGeneratingQR(false);
  }
};



  // Load initial data
  useEffect(() => {
    (async () => {
      const s = await fetchStore();
      if (s) await fetchWallet(s);
    })();
    return () => { abortRef.current?.abort(); };
  }, [fetchStore, fetchWallet]);

  // Load machines when machines tab is active
  useEffect(() => {
    if (activeTab === 'machines') {
      fetchMachines();
    }
  }, [activeTab, fetchMachines]);

  // Your existing save function (keeping the same logic)
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

    const prev = store;
    const next = { ...store, ...payload };
    setStore(next);

    try {
      try {
        await api.put(`/api/admin/stores/${encodeURIComponent(store.storeId || store._id)}`, payload);
      } catch (inner) {
        if (inner?.response?.status === 404) {
          await api.post('/api/admin/update-store', { id: store.storeId || store._id, ...payload });
        } else {
          throw inner;
        }
      }
      setSaveMsg('Saved.');
      setTimeout(() => setSaveMsg(''), 1500);
      await fetchStore();
    } catch (e2) {
      setStore(prev);
      setErr(e2?.response?.data?.error || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  // Machine management functions
  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (addingMachine) return;

    try {
      setAddingMachine(true);
      setMachinesError('');

      const { data } = await api.post(`/api/machines/stores/${encodeURIComponent(storeId)}`, {
        ...newMachine,
        machineId: newMachine.machineId.trim(),
        name: newMachine.name.trim() || `Machine ${newMachine.machineId.trim()}`,
        location: newMachine.location.trim()
      });

      if (data.success) {
        await fetchMachines(); // Refresh the list
        setNewMachine({
          machineId: '',
          name: '',
          location: '',
          gameType: 'slot',
          hubId: ''
        });
        setShowAddMachine(false);
      }
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to add machine');
    } finally {
      setAddingMachine(false);
    }
  };

  const updateMachineStatus = async (machineId, newStatus) => {
    try {
      const machine = machines.find(m => m._id === machineId);
      if (!machine) return;

      const { data } = await api.put(`/api/machines/${encodeURIComponent(machine._id)}/status`, {
        status: newStatus,
        reason: 'Admin status change'
      });

      if (data.success) {
        await fetchMachines(); // Refresh to get updated stats
      }
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to update machine status');
    }
  };

  const deleteMachine = async (machineId) => {
    const machine = machines.find(m => m._id === machineId);
    if (!machine) return;

    if (!confirm(`Are you sure you want to delete machine "${machine.machineId}"?`)) return;

    try {
      await api.delete(`/api/machines/${encodeURIComponent(machine._id)}`);
      await fetchMachines(); // Refresh the list
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to delete machine');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedMachines.length === 0) return;

    try {
      setMachinesLoading(true);
      
      // Since your API doesn't have bulk endpoints, we'll do individual calls
      const promises = selectedMachines.map(machineId => {
        const machine = machines.find(m => m._id === machineId);
        if (!machine) return null;

        if (bulkAction === 'delete') {
          return api.delete(`/api/machines/${encodeURIComponent(machine._id)}`);
        } else {
          return api.put(`/api/machines/${encodeURIComponent(machine._id)}/status`, {
            status: bulkAction,
            reason: 'Bulk action'
          });
        }
      }).filter(Boolean);

      await Promise.all(promises);
      await fetchMachines();
      setSelectedMachines([]);
      setBulkAction('');
      setShowBulkModal(false);
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Bulk action failed');
    } finally {
      setMachinesLoading(false);
    }
  };

  const showMachineConnectionInfo = async (machineId) => {
    try {
      const machine = machines.find(m => m._id === machineId);
      if (!machine) return;

      const { data } = await api.get(`/api/machines/${encodeURIComponent(machine._id)}/connection-info`);
      setConnectionInfo(data.connectionInfo);
      setShowConnectionInfo(true);
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to get connection info');
    }
  };

  // Your existing wallet functions (keeping the same)
  const generateWallet = async () => {
    try {
      setWLoading(true);
      setWErr('');
      setWMsg('');
      await api.post(`/api/admin/wallet/${encodeURIComponent(storeId)}/generate`);
      setWMsg('Wallet generated.');
      await fetchWallet(store);
    } catch (e) {
      setWErr(e?.response?.data?.error || 'Failed to generate wallet');
    } finally {
      setWLoading(false);
      setTimeout(() => setWMsg(''), 1800);
    }
  };

  const refreshWallet = () => fetchWallet(store);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-900/20 border-green-500/30 text-green-300',
      inactive: 'bg-red-900/20 border-red-500/30 text-red-300',
      maintenance: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${colors[status] || colors.inactive}`}>
        {status}
      </span>
    );
  };

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
      {/* Header */}
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

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {['details', 'wallet', 'machines'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'machines' && machineStats.total > 0 && (
                <span className="ml-2 bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {machineStats.total}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Details</h2>
              {saveMsg && <div className="text-green-400 text-sm">{saveMsg}</div>}
            </div>

            <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Store Name</label>
                <input 
                  className="input" 
                  value={edit.storeName} 
                  onChange={(e) => setEdit(v => ({ ...v, storeName: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select 
                  className="input" 
                  value={edit.status} 
                  onChange={(e) => setEdit(v => ({ ...v, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="label">City</label>
                <input 
                  className="input" 
                  value={edit.city} 
                  onChange={(e) => setEdit(v => ({ ...v, city: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className="label">State</label>
                <input 
                  className="input" 
                  value={edit.state} 
                  onChange={(e) => setEdit(v => ({ ...v, state: e.target.value }))} 
                  required 
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input 
                  className="input" 
                  value={edit.address} 
                  onChange={(e) => setEdit(v => ({ ...v, address: e.target.value }))} 
                />
              </div>

              <div>
                <label className="label">Zip</label>
                <input 
                  className="input" 
                  value={edit.zipCode} 
                  onChange={(e) => setEdit(v => ({ ...v, zipCode: e.target.value }))} 
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input 
                  className="input" 
                  value={edit.phone} 
                  onChange={(e) => setEdit(v => ({ ...v, phone: e.target.value }))} 
                />
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
                <input 
                  className="input" 
                  value={edit.ownerUserId} 
                  onChange={(e) => setEdit(v => ({ ...v, ownerUserId: e.target.value }))} 
                />
              </div>

              {CAN_EDIT && (
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setFromStore(store)} 
                    disabled={saving}
                  >
                    Reset
                  </button>
                  <button className="btn btn-gold" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>

            {err && (
              <div className="mt-4 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
                {err}
              </div>
            )}
          </div>

          {/* Store Info Panel */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Info</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-neutral-400">Store ID</div>
                <div className="font-mono">{store.storeId}</div>
              </div>
              <div>
                <div className="text-neutral-400">Owner</div>
                <div>{ownerText}</div>
              </div>
              <div>
                <div className="text-neutral-400">Created</div>
                <div>{store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallet' && (
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
                <a 
                  className="btn btn-ghost btn-sm" 
                  target="_blank" 
                  rel="noreferrer" 
                  href={SOLSCAN(wallet.publicKey)}
                >
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
                  <button className="btn btn-ghost btn-sm" onClick={refreshWallet}>
                    Refresh
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-neutral-400 text-sm mb-3">
                No wallet generated yet for this store.
              </div>
              {CAN_WALLET && (
                <button className="btn btn-gold" onClick={generateWallet}>
                  Generate Wallet
                </button>
              )}
            </>
          )}

          {wErr && (
            <div className="mt-3 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
              {wErr}
            </div>
          )}
        </div>
      )}

      {activeTab === 'machines' && (
        <div className="space-y-6">
          {/* Machine Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-500 rounded-xl p-4">
              <div className="text-blue-300 font-semibold text-sm uppercase tracking-wide">Total Machines</div>
              <div className="text-2xl font-bold text-white mt-1">{machineStats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-500 rounded-xl p-4">
              <div className="text-green-300 font-semibold text-sm uppercase tracking-wide">Active</div>
              <div className="text-2xl font-bold text-white mt-1">{machineStats.active}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-500 rounded-xl p-4">
              <div className="text-yellow-300 font-semibold text-sm uppercase tracking-wide">Maintenance</div>
              <div className="text-2xl font-bold text-white mt-1">{machineStats.maintenance}</div>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-red-800 border border-red-500 rounded-xl p-4">
              <div className="text-red-300 font-semibold text-sm uppercase tracking-wide">Inactive</div>
              <div className="text-2xl font-bold text-white mt-1">{machineStats.inactive}</div>
            </div>
          </div>

          {/* Machines Management */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Machines</h2>
              <div className="flex gap-2">
                {selectedMachines.length > 0 && (
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="btn btn-ghost btn-sm"
                  >
                    Bulk Actions ({selectedMachines.length})
                  </button>
                )}
                <button
                  onClick={() => setShowAddMachine(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-white font-medium text-sm"
                >
                  Add Machine
                </button>
              </div>
            </div>

            {machinesError && (
              <div className="mb-4 bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
                {machinesError}
              </div>
            )}

            {machinesLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading machines...</p>
              </div>
            ) : machines.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">🎰</div>
                <p className="text-gray-400 mb-4">No machines registered for this store</p>
                <button
                  onClick={() => setShowAddMachine(true)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  Add your first machine
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 border-b border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4 w-8">
                        <input
                          type="checkbox"
                          checked={selectedMachines.length === machines.length && machines.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMachines(machines.map(m => m._id));
                            } else {
                              setSelectedMachines([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Machine</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Game Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Last Seen</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {machines.map((machine) => (
                      <tr key={machine._id} className="hover:bg-gray-750">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedMachines.includes(machine._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMachines([...selectedMachines, machine._id]);
                              } else {
                                setSelectedMachines(selectedMachines.filter(id => id !== machine._id));
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-white">
                              {machine.name || `Machine ${machine.machineId}`}
                            </div>
                            <div className="text-sm text-gray-400">ID: {machine.machineId}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {machine.location || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300 capitalize">
                          {machine.gameType}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={machine.status} />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-300">
                          {machine.lastSeen 
                            ? new Date(machine.lastSeen).toLocaleString()
                            : 'Never'
                          }
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <select
                              value={machine.status}
                              onChange={(e) => updateMachineStatus(machine._id, e.target.value)}
                              className="text-xs bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="maintenance">Maintenance</option>
                            </select>
                            <button
                              onClick={() => generateMachineQR(machine._id)}
                              disabled={generatingQR}
                              className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-2 py-1 rounded"
                              title="Generate QR Code"
                            >
                              QR
                            </button>
                            <button
                              onClick={() => showMachineConnectionInfo(machine._id)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                              title="Pi Setup"
                            >
                              Pi
                            </button>
                            <button
                              onClick={() => deleteMachine(machine._id)}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Machine</h3>
              <button
                onClick={() => setShowAddMachine(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMachine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Machine ID *
                </label>
                <input
                  type="text"
                  value={newMachine.machineId}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, machineId: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., SLOT-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newMachine.name}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., Lucky Slots #1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newMachine.location}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., Near entrance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Game Type
                </label>
                <select
                  value={newMachine.gameType}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, gameType: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="slot">Slot Machine</option>
                  <option value="poker">Poker</option>
                  <option value="blackjack">Blackjack</option>
                  <option value="roulette">Roulette</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hub ID (Optional)
                </label>
                <input
                  type="text"
                  value={newMachine.hubId}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, hubId: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="Raspberry Pi identifier"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMachine(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMachine}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-2 px-4 rounded-lg font-medium"
                >
                  {addingMachine ? 'Adding...' : 'Add Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Bulk Action ({selectedMachines.length} machines)
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Action
                </label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Choose action...</option>
                  <option value="active">Set to Active</option>
                  <option value="inactive">Set to Inactive</option>
                  <option value="maintenance">Set to Maintenance</option>
                  <option value="delete">Delete Machines</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || machinesLoading}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-2 px-4 rounded-lg font-medium"
                >
                  {machinesLoading ? 'Processing...' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Machine QR Code - {qrCodeData.machine.machineId}
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-center">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={qrCodeData.qrCode} 
                  alt="Machine QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="text-sm text-gray-300">
                <div className="font-medium mb-2">
                  {qrCodeData.machine.name || `Machine ${qrCodeData.machine.machineId}`}
                </div>
                <div className="text-xs text-gray-400">
                  Location: {qrCodeData.machine.location || 'Not specified'}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg text-left">
                <h4 className="font-medium text-blue-300 mb-2 text-sm">Instructions</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Print this QR code and attach to machine</li>
                  <li>• Users scan to bind their account to machine</li>
                  <li>• Only one user can be bound at a time</li>
                  <li>• Sessions auto-expire after play ends</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                >
                  Print QR Code
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeData.qrCode;
                    link.download = `machine-${qrCodeData.machine.machineId}-qr.png`;
                    link.click();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                >
                  Download
                </button>
              </div>
              <button
                onClick={() => regenerateMachineQR(qrCodeData.machine._id)}
                disabled={generatingQR}
                className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white py-2 px-4 rounded-lg font-medium text-sm"
              >
                {generatingQR ? 'Regenerating...' : 'Regenerate QR Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Info Modal */}
      {showConnectionInfo && connectionInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Pi Connection Setup - {connectionInfo.machineId}
              </h3>
              <button
                onClick={() => setShowConnectionInfo(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Machine Token
                </label>
                <div className="bg-gray-900 p-3 rounded font-mono text-xs text-green-400 break-all">
                  {connectionInfo.machineToken}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(connectionInfo.machineToken)}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  Copy Token
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  API Endpoint
                </label>
                <div className="bg-gray-900 p-3 rounded font-mono text-xs text-blue-400 break-all">
                  {connectionInfo.apiEndpoint}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Webhook URL
                </label>
                <div className="bg-gray-900 p-3 rounded font-mono text-xs text-blue-400 break-all">
                  {connectionInfo.webhookUrl}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-blue-200 space-y-1">
                  <li>1. Copy the machine token above</li>
                  <li>2. Install token in your Raspberry Pi configuration</li>
                  <li>3. Pi will authenticate using this token</li>
                  <li>4. Machine status will update when Pi connects</li>
                </ol>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowConnectionInfo(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}