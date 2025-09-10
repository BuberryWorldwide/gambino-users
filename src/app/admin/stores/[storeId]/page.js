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
  
  // Reports/reconciliation states
  const [reconciliations, setReconciliations] = useState([]);
  const [reconciliationStats, setReconciliationStats] = useState({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Fee Calculation
  const [currentMiningRevenue, setCurrentMiningRevenue] = useState(0);

  
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

  // New function to fetch reconciliation data for this store
const fetchReports = useCallback(async () => {
  try {
    setReportsLoading(true);
    setReportsError('');
    const { data } = await api.get(`/api/admin/reconciliation/${encodeURIComponent(storeId)}`);
    setReconciliations(data.reconciliations || []);
    setReconciliationStats(data.stats || {});
  } catch (err) {
    setReportsError(err?.response?.data?.error || 'Failed to load reports');
  } finally {
    setReportsLoading(false);
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

  // Load reports when reports tab is active
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

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

  // Handle reconciliation report submission
const handleSubmitReport = async (e) => {
  e.preventDefault();
  
  try {
    setReportsLoading(true);
    setReportsError('');
    
    const formData = new FormData(e.target);
    const reportData = {
      reconciliationDate: formData.get('date') || new Date().toISOString().split('T')[0],
      venueGamingRevenue: parseFloat(formData.get('miningRevenue')) || 0,
      notes: formData.get('notes') || ''
    };

    const { data } = await api.post(`/api/admin/reconciliation/${encodeURIComponent(storeId)}`, reportData);
    
    if (data.success) {
      setShowSubmitForm(false);
      await fetchReports(); // Refresh the reports list
      // Could add a success message here
    }
  } catch (err) {
    setReportsError(err?.response?.data?.error || 'Failed to submit report');
  } finally {
    setReportsLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-300 text-lg">Loading store details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        </div>
        <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Store Details
            </h1>
            <Link 
              className="px-4 py-2 bg-gray-700/30 hover:bg-gray-600/30 text-yellow-400 hover:text-yellow-300 font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-yellow-400/30" 
              href="/admin/stores"
            >
              ← Back to Stores
            </Link>
          </div>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-4"></div>
              <p className="text-red-200 font-medium">{err}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        </div>
        <div className="relative z-10 p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Store Details
            </h1>
            <Link 
              className="px-4 py-2 bg-gray-700/30 hover:bg-gray-600/30 text-yellow-400 hover:text-yellow-300 font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-yellow-400/30" 
              href="/admin/stores"
            >
              ← Back
            </Link>
          </div>
          <div className="text-gray-400 text-lg">Store not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 border border-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 border border-yellow-600/10 rounded-lg -rotate-12 animate-bounce" style={{ animationDuration: '5s' }}></div>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-2">
              <Link href="/admin/stores" className="hover:text-yellow-300 transition-colors">Stores</Link> 
              <span className="mx-2">/</span> 
              <span className="text-yellow-400">{store.storeId}</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
              {store.storeName || store.storeId}
            </h1>
            <div className="text-gray-300 text-lg">
              {[store.city, store.state].filter(Boolean).join(', ') || '—'}
            </div>
          </div>
          <Link 
            className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-yellow-400 hover:text-yellow-300 font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-yellow-400/30 backdrop-blur-sm" 
            href="/admin/stores"
          >
            ← Back to Stores
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50">
          <nav className="flex space-x-1 p-2">
            {['details', 'wallet', 'machines', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 font-medium text-sm capitalize rounded-xl transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/30'
                }`}
              >
                {tab}
                {tab === 'machines' && machineStats.total > 0 && (
                  <span className={`ml-2 py-1 px-2 rounded-full text-xs ${
                    activeTab === tab 
                      ? 'bg-black/20 text-black' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {machineStats.total}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Store Details</h2>
                {saveMsg && (
                  <div className="text-green-400 font-medium flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    {saveMsg}
                  </div>
                )}
              </div>

              <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Store Name</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.storeName} 
                      onChange={(e) => setEdit(v => ({ ...v, storeName: e.target.value }))} 
                      required
                      placeholder="Enter store name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Status</label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.status} 
                      onChange={(e) => setEdit(v => ({ ...v, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">City</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.city} 
                      onChange={(e) => setEdit(v => ({ ...v, city: e.target.value }))} 
                      required
                      placeholder="Enter city"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">State</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.state} 
                      onChange={(e) => setEdit(v => ({ ...v, state: e.target.value }))} 
                      required
                      placeholder="Enter state"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-200 mb-3">Address</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.address} 
                      onChange={(e) => setEdit(v => ({ ...v, address: e.target.value }))}
                      placeholder="Enter full address"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Zip Code</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.zipCode} 
                      onChange={(e) => setEdit(v => ({ ...v, zipCode: e.target.value }))}
                      placeholder="Enter zip code"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Phone</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.phone} 
                      onChange={(e) => setEdit(v => ({ ...v, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Fee Percentage</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      value={edit.feePercentage}
                      onChange={(e) => setEdit(v => ({ ...v, feePercentage: e.target.value }))}
                      placeholder="5.0"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Owner User ID</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.ownerUserId} 
                      onChange={(e) => setEdit(v => ({ ...v, ownerUserId: e.target.value }))}
                      placeholder="Enter owner user ID"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                {CAN_EDIT && (
                  <div className="md:col-span-2 flex items-center justify-end gap-4 pt-4">
                    <button 
                      type="button" 
                      className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50" 
                      onClick={() => setFromStore(store)} 
                      disabled={saving}
                    >
                      Reset Changes
                    </button>
                    <button 
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg" 
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </form>

              {err && (
                <div className="mt-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <p className="text-red-200 font-medium">{err}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Store Info Panel */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">Store Information</h2>
              <div className="space-y-6">
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-2">Store ID</div>
                  <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 border border-gray-600/30">
                    {store.storeId}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-2">Owner</div>
                  <div className="text-white font-medium">{ownerText}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-2">Created</div>
                  <div className="text-white">{store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-2">Current Status</div>
                  <StatusBadge status={store.status} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Wallet Management</h2>
              {wMsg && (
                <div className="text-green-400 font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  {wMsg}
                </div>
              )}
            </div>

            {wLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-gray-300">Loading wallet information...</div>
              </div>
            ) : wallet?.exists ? (
              <div className="space-y-6">
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-3">Public Key</div>
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                    <div className="font-mono text-sm text-yellow-400 break-all mb-3">{wallet.publicKey}</div>
                    <div className="flex gap-3">
                      <a 
                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-medium rounded-lg transition-all duration-200 border border-blue-500/30" 
                        target="_blank" 
                        rel="noreferrer" 
                        href={SOLSCAN(wallet.publicKey)}
                      >
                        View on Solscan →
                      </a>
                      <button
                        className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 border border-gray-500/30"
                        onClick={async () => navigator.clipboard.writeText(wallet.publicKey || '')}
                      >
                        Copy Address
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 text-sm font-medium mb-3">Token Balances</div>
                  <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 overflow-hidden">
                    {[
                      { token: 'SOL', balance: wallet?.balances?.SOL ?? 0, color: 'text-purple-400' },
                      { token: 'USDC', balance: wallet?.balances?.USDC ?? 0, color: 'text-blue-400' },
                      { token: 'GAMB', balance: wallet?.balances?.GAMB ?? 0, color: 'text-yellow-400' }
                    ].map((item, index) => (
                      <div key={item.token} className={`px-6 py-4 flex items-center justify-between ${index !== 2 ? 'border-b border-gray-600/30' : ''}`}>
                        <span className={`font-semibold ${item.color}`}>{item.token}</span>
                        <span className="text-white font-mono">{item.balance}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {CAN_WALLET && (
                  <div className="flex gap-3">
                    <button 
                      className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50" 
                      onClick={refreshWallet}
                    >
                      Refresh Balances
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-gray-400 text-lg mb-6">
                  No wallet generated for this store yet.
                </div>
                {CAN_WALLET && (
                  <button 
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg" 
                    onClick={generateWallet}
                  >
                    Generate Wallet
                  </button>
                )}
              </div>
            )}

            {wErr && (
              <div className="mt-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <p className="text-red-200 font-medium">{wErr}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'machines' && (
          <div className="space-y-8">
            {/* Machine Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Machines', value: machineStats.total, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                { label: 'Active', value: machineStats.active, color: 'from-green-500 to-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
                { label: 'Maintenance', value: machineStats.maintenance, color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
                { label: 'Inactive', value: machineStats.inactive, color: 'from-red-500 to-red-600', bg: 'bg-red-500/10', border: 'border-red-500/30' }
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} backdrop-blur-xl rounded-2xl p-6 border ${stat.border}`}>
                  <div className="text-gray-300 font-medium text-sm uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Machines Management */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Machine Management</h2>
                <div className="flex gap-3">
                  {selectedMachines.length > 0 && (
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 font-medium rounded-xl transition-all duration-200 border border-purple-500/30"
                    >
                      Bulk Actions ({selectedMachines.length})
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddMachine(true)}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Add Machine
                  </button>
                </div>
              </div>

              {machinesError && (
                <div className="mb-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <p className="text-red-200 font-medium">{machinesError}</p>
                  </div>
                </div>
              )}

              {machinesLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-gray-300">Loading machines...</div>
                </div>
              ) : machines.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎰</div>
                  <div className="text-gray-400 text-lg mb-6">No machines registered for this store</div>
                  <button
                    onClick={() => setShowAddMachine(true)}
                    className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                  >
                    Add your first machine →
                  </button>
                </div>
              ) : (
                <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600/30 border-b border-gray-600/50">
                        <tr>
                          <th className="text-left py-4 px-6 w-12">
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
                              className="rounded border-gray-500 bg-gray-600 text-yellow-400 focus:ring-yellow-400"
                            />
                          </th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Machine</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Location</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Game Type</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Status</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Last Seen</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600/30">
                        {machines.map((machine) => (
                          <tr key={machine._id} className="hover:bg-gray-600/20 transition-colors">
                            <td className="py-4 px-6">
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
                                className="rounded border-gray-500 bg-gray-600 text-yellow-400 focus:ring-yellow-400"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <div className="font-semibold text-white">
                                  {machine.name || `Machine ${machine.machineId}`}
                                </div>
                                <div className="text-sm text-gray-400">ID: {machine.machineId}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {machine.location || '—'}
                            </td>
                            <td className="py-4 px-6 text-gray-300 capitalize">
                              {machine.gameType}
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={machine.status} />
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-300">
                              {machine.lastSeen 
                                ? new Date(machine.lastSeen).toLocaleString()
                                : 'Never'
                              }
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2">
                                <select
                                  value={machine.status}
                                  onChange={(e) => updateMachineStatus(machine._id, e.target.value)}
                                  className="text-xs bg-gray-600/50 text-white border border-gray-500/50 rounded-lg px-2 py-1 focus:ring-2 focus:ring-yellow-400/50"
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="maintenance">Maintenance</option>
                                </select>
                                <button
                                  onClick={() => generateMachineQR(machine._id)}
                                  disabled={generatingQR}
                                  className="text-xs bg-green-600/80 hover:bg-green-600 disabled:bg-green-800 text-white px-2 py-1 rounded-lg transition-colors"
                                  title="Generate QR Code"
                                >
                                  QR
                                </button>
                                <button
                                  onClick={() => showMachineConnectionInfo(machine._id)}
                                  className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-2 py-1 rounded-lg transition-colors"
                                  title="Pi Setup"
                                >
                                  Pi
                                </button>
                                <button
                                  onClick={() => deleteMachine(machine._id)}
                                  className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded-lg transition-colors"
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
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Reports Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  label: 'Total Expected Fees', 
                  value: `$${(reconciliationStats.totalExpectedFees || 0).toLocaleString()}`, 
                  color: 'from-green-500 to-green-600', 
                  bg: 'bg-green-500/10', 
                  border: 'border-green-500/30' 
                },
                { 
                  label: 'Total Reports', 
                  value: reconciliationStats.totalReconciliations || 0, 
                  color: 'from-blue-500 to-blue-600', 
                  bg: 'bg-blue-500/10', 
                  border: 'border-blue-500/30' 
                },
                { 
                  label: 'Flagged Reports', 
                  value: reconciliationStats.flaggedCount || 0, 
                  color: 'from-yellow-500 to-yellow-600', 
                  bg: 'bg-yellow-500/10', 
                  border: 'border-yellow-500/30' 
                }
              ].map((stat) => (
                <div key={stat.label} className={`${stat.bg} backdrop-blur-xl rounded-2xl p-6 border ${stat.border}`}>
                  <div className="text-gray-300 font-medium text-sm uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Submit New Report */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Submit Daily Report</h2>
                <button 
                  onClick={() => setShowSubmitForm(!showSubmitForm)}
                  className={`px-6 py-3 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    showSubmitForm 
                      ? 'bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white border border-gray-600/50'
                      : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black'
                  }`}
                >
                  {showSubmitForm ? 'Cancel' : 'New Report'}
                </button>
              </div>

              {showSubmitForm && (
                <form onSubmit={handleSubmitReport} className="bg-gray-700/20 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">
                        Date *
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="date"
                          required
                          className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                          defaultValue={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-3">
                        Mining Revenue (Daily Total) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-400 text-lg">$</span>
                        <input
                          type="number"
                          name="miningRevenue"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          value={currentMiningRevenue}
                          onChange={(e) => setCurrentMiningRevenue(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Total revenue generated from all mining activities today
                      </div>
                    </div>
                  </div>
                        
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Notes (Optional)
                    </label>
                    <div className="relative">
                      <textarea
                        name="notes"
                        rows="4"
                        placeholder="Additional notes about today's operations..."
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm resize-none"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                        
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-sm font-semibold text-blue-300 mb-2">
                      Software Fee Calculation
                    </div>
                    <div className="text-xs text-blue-200">
                      Fee Percentage: {store?.feePercentage || 5}% • Expected Fee: ${((currentMiningRevenue * (store?.feePercentage || 5)) / 100).toFixed(2)}
                    </div>
                  </div>
                        
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitForm(false)}
                      className="flex-1 px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            {/* Reports History */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Reports</h2>

              {reportsLoading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-gray-300">Loading reports...</div>
                </div>
              ) : reportsError ? (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <p className="text-red-200 font-medium">{reportsError}</p>
                  </div>
                </div>
              ) : reconciliations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg">No reports submitted yet.</div>
                </div>
              ) : (
                <div className="bg-gray-700/30 rounded-xl border border-gray-600/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600/30 border-b border-gray-600/50">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Date</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Mining Revenue</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Software Fee</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Status</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-200">Submitted By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600/30">
                        {reconciliations.map((report, index) => (
                          <tr key={report._id || index} className="hover:bg-gray-600/20 transition-colors">
                            <td className="py-4 px-6 text-white font-medium">
                              {new Date(report.reconciliationDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-white font-mono">
                              ${(report.venueGamingRevenue || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-white font-mono">
                              ${(report.expectedSoftwareFee || 0).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                report.reconciliationStatus === 'approved' 
                                  ? 'bg-green-900/20 border-green-500/30 text-green-300'
                                  : report.reconciliationStatus === 'flagged'
                                  ? 'bg-red-900/20 border-red-500/30 text-red-300'
                                  : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                              }`}>
                                {report.reconciliationStatus || 'pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {report.submittedBy?.email || report.submittedBy || 'Unknown'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Machine Modal */}
        {showAddMachine && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-md">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Add New Machine</h3>
                  <button
                    onClick={() => setShowAddMachine(false)}
                    className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddMachine} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Machine ID *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newMachine.machineId}
                        onChange={(e) => setNewMachine(prev => ({ ...prev, machineId: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="e.g., SLOT-001"
                        required
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Display Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newMachine.name}
                        onChange={(e) => setNewMachine(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="e.g., Lucky Slots #1"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Location
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newMachine.location}
                        onChange={(e) => setNewMachine(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="e.g., Near entrance"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Game Type
                    </label>
                    <div className="relative">
                      <select
                        value={newMachine.gameType}
                        onChange={(e) => setNewMachine(prev => ({ ...prev, gameType: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      >
                        <option value="slot">Slot Machine</option>
                        <option value="poker">Poker</option>
                        <option value="blackjack">Blackjack</option>
                        <option value="roulette">Roulette</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Hub ID (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newMachine.hubId}
                        onChange={(e) => setNewMachine(prev => ({ ...prev, hubId: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Raspberry Pi identifier"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddMachine(false)}
                      className="flex-1 px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingMachine}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                    >
                      {addingMachine ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Adding...
                        </div>
                      ) : (
                        'Add Machine'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Action Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-md">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Bulk Action ({selectedMachines.length} machines)
                  </h3>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Select Action
                    </label>
                    <div className="relative">
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                      >
                        <option value="">Choose action...</option>
                        <option value="active">Set to Active</option>
                        <option value="inactive">Set to Inactive</option>
                        <option value="maintenance">Set to Maintenance</option>
                        <option value="delete">Delete Machines</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowBulkModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || machinesLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                    >
                      {machinesLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQRModal && qrCodeData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-md">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Machine QR Code
                  </h3>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6 text-center">
                  <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl inline-block shadow-2xl">
                    <img 
                      src={qrCodeData.qrCode} 
                      alt="Machine QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>

                  <div className="text-center">
                    <div className="font-semibold text-white text-lg mb-2">
                      {qrCodeData.machine.name || `Machine ${qrCodeData.machine.machineId}`}
                    </div>
                    <div className="text-sm text-gray-400">
                      ID: {qrCodeData.machine.machineId}
                    </div>
                    <div className="text-sm text-gray-400">
                      Location: {qrCodeData.machine.location || 'Not specified'}
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-left backdrop-blur-sm">
                    <h4 className="font-semibold text-blue-300 mb-3 text-sm">Setup Instructions</h4>
                    <ul className="text-xs text-blue-200 space-y-2">
                      <li>• Print this QR code and attach to machine</li>
                      <li>• Users scan to bind their account to machine</li>
                      <li>• Only one user can be bound at a time</li>
                      <li>• Sessions auto-expire after play ends</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200"
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
                      className="px-4 py-3 bg-green-600/80 hover:bg-green-600 text-white font-medium rounded-xl transition-all duration-200"
                    >
                      Download
                    </button>
                  </div>
                  
                  <button
                    onClick={() => regenerateMachineQR(qrCodeData.machine._id)}
                    disabled={generatingQR}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  >
                    {generatingQR ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                        Regenerating...
                      </div>
                    ) : (
                      'Regenerate QR Code'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Info Modal */}
        {showConnectionInfo && connectionInfo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Pi Connection Setup
                  </h3>
                  <button
                    onClick={() => setShowConnectionInfo(false)}
                    className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Machine Token
                    </label>
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
                      <div className="font-mono text-sm text-green-400 break-all mb-3">
                        {connectionInfo.machineToken}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(connectionInfo.machineToken)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Copy Token
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      API Endpoint
                    </label>
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
                      <div className="font-mono text-sm text-blue-400 break-all">
                        {connectionInfo.apiEndpoint}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">
                      Webhook URL
                    </label>
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
                      <div className="font-mono text-sm text-blue-400 break-all">
                        {connectionInfo.webhookUrl}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
                    <h4 className="font-semibold text-blue-300 mb-4">Setup Instructions</h4>
                    <ol className="text-sm text-blue-200 space-y-2">
                      <li>1. Copy the machine token above</li>
                      <li>2. Install token in your Raspberry Pi configuration</li>
                      <li>3. Pi will authenticate using this token</li>
                      <li>4. Machine status will update when Pi connects</li>
                    </ol>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setShowConnectionInfo(false)}
                      className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

