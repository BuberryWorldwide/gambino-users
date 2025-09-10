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

  // Store management states
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [edit, setEdit] = useState({
    storeName: '', city: '', state: '', address: '', zipCode: '', phone: '',
    feePercentage: 5, ownerUserId: '', status: 'active'
  });

  // Wallet states
  const [wallet, setWallet] = useState({ exists: false, publicKey: null, balances: null });
  const [wLoading, setWLoading] = useState(false);
  const [wErr, setWErr] = useState('');
  const [wMsg, setWMsg] = useState('');

  // Tab and machine management states
  const [activeTab, setActiveTab] = useState('details');
  const [machines, setMachines] = useState([]);
  const [machineStats, setMachineStats] = useState({ total: 0, active: 0, inactive: 0, maintenance: 0 });
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [machinesError, setMachinesError] = useState('');
  
  // Reports/reconciliation states
  const [reconciliations, setReconciliations] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Machine modal states
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [newMachine, setNewMachine] = useState({
    machineId: '', name: '', location: '', gameType: 'slot', hubId: ''
  });
  const [addingMachine, setAddingMachine] = useState(false);

  // Bulk operations
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Store action states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const CAN_EDIT = true;
  const CAN_WALLET = true;
  const CAN_DELETE = true;

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

  // Fetch store function
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

  // Wallet handlers
  const generateWallet = async () => {
    try {
      setWLoading(true);
      setWErr('');
      setWMsg('');
      await api.post(`/api/admin/wallet/${encodeURIComponent(store.storeId || store._id)}/generate`);
      setWMsg('Wallet generated.');
      await fetchWallet(store);
    } catch (e) {
      setWErr(e?.response?.data?.error || 'Failed to generate wallet');
    } finally {
      setWLoading(false);
      setTimeout(() => setWMsg(''), 1800);
    }
  };

  const fetchWallet = useCallback(async (s) => {
    if (!CAN_WALLET) return;
    try {
      setWLoading(true);
      setWErr('');

      let data;
      try {
        const r = await api.get(`/api/admin/wallet/${encodeURIComponent(store.storeId || store._id)}`);
        data = r?.data;
      } catch (e) {
        if (e?.response?.status === 404) {
          try {
            const alt = await api.get(`/api/admin/stores/${encodeURIComponent(store.storeId || store._id)}/wallet`);
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
      if (e?.name !== 'AbortError' && e?.name !== 'CanceledError') {
        setWErr(e?.response?.data?.error || 'Failed to load wallet');
      }
    } finally {
      setWLoading(false);
    }
  }, [store, CAN_WALLET]);

  const refreshWallet = () => fetchWallet(store);

  // ===== STORE ACTION HANDLERS - NO DELETE METHODS =====
  const performStoreUpdate = async (updatePayload) => {
    const storeIdentifier = store.storeId || store._id;
    console.log(`🔄 UPDATING store ${storeIdentifier} with PUT method:`, updatePayload);
    
    try {
      // Primary endpoint - always use PUT, never DELETE
      await api.put(`/api/admin/stores/${encodeURIComponent(storeIdentifier)}`, updatePayload);
      console.log(`✅ Store ${storeIdentifier} updated successfully via PUT`);
      return true;
    } catch (putError) {
      console.log(`⚠️ PUT failed, trying fallback endpoint:`, putError.response?.status);
      if (putError?.response?.status === 404) {
        // Fallback endpoint
        await api.post('/api/admin/update-store', { 
          id: storeIdentifier, 
          ...updatePayload 
        });
        console.log(`✅ Store ${storeIdentifier} updated via fallback POST endpoint`);
        return true;
      } else {
        throw putError;
      }
    }
  };

  const handleStoreAction = async (action) => {
    if (!store) return;
    
    setActionLoading(true);
    setErr('');
    
    try {
      let payload, successMessage;
      
      // ALL actions use status updates - NO DELETE METHOD EVER
      switch (action) {
        case 'deactivate':
          payload = { status: 'inactive' };
          successMessage = 'Store deactivated successfully';
          break;
        case 'activate':
          payload = { status: 'active' };
          successMessage = 'Store activated successfully';
          break;
        case 'suspend':
          payload = { status: 'suspended' };
          successMessage = 'Store suspended successfully';
          break;
        case 'archive':
          payload = { status: 'archived' };
          successMessage = 'Store archived successfully';
          break;
        case 'delete':
          // CRITICAL: Use status change, not DELETE method
          payload = { 
            status: 'deleted',
            deletedAt: new Date().toISOString(),
            deletedBy: 'admin'
          };
          successMessage = 'Store marked as deleted successfully';
          break;
        default:
          throw new Error('Invalid action: ' + action);
      }

      // Perform the update using PUT method only
      await performStoreUpdate(payload);
      
      // Update local state
      setStore(prev => ({ ...prev, ...payload }));
      setFromStore({ ...store, ...payload });
      setSaveMsg(successMessage);
      setTimeout(() => setSaveMsg(''), 2000);
      
      // Redirect if marked as deleted
      if (action === 'delete') {
        setTimeout(() => {
          router.push('/admin/stores');
        }, 1500);
      }
      
    } catch (error) {
      console.error(`❌ Failed to ${action} store:`, error);
      setErr(error?.response?.data?.error || `Failed to ${action} store: ${error.message}`);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };
  // ===== END STORE ACTION HANDLERS =====

  // Save store changes
  const saveStore = async (e) => {
    e.preventDefault();
    if (saving || !store) return;

    setSaving(true);
    setErr('');
    setSaveMsg('');

    const payload = {
      storeName: edit.storeName?.trim() || store.storeName,
      city: edit.city?.trim() || store.city,
      state: edit.state?.trim() || store.state,
      address: edit.address?.trim() || store.address,
      zipCode: edit.zipCode?.trim() || store.zipCode,
      phone: edit.phone?.trim() || store.phone,
      feePercentage: clampFee(edit.feePercentage),
      ownerUserId: edit.ownerUserId?.trim() || store.ownerUserId,
      status: edit.status || store.status,
    };

    if (Object.keys(payload).every(k => payload[k] === store[k])) {
      setSaveMsg('No changes to save.');
      setSaving(false);
      return;
    }

    const prev = store;
    const next = { ...store, ...payload };
    setStore(next);

    try {
      await performStoreUpdate(payload);
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

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-900/20 border-green-500/30 text-green-300',
      inactive: 'bg-red-900/20 border-red-500/30 text-red-300',
      maintenance: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
      pending: 'bg-orange-900/20 border-orange-500/30 text-orange-300',
      suspended: 'bg-purple-900/20 border-purple-500/30 text-purple-300',
      archived: 'bg-gray-900/20 border-gray-500/30 text-gray-300',
      deleted: 'bg-red-900/20 border-red-500/30 text-red-300'
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

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'wallet' && store) {
      fetchWallet(store);
    }
  }, [activeTab, store, fetchWallet]);

  // Load initial data
  useEffect(() => {
    if (storeId) {
      fetchStore();
    }
  }, [storeId, fetchStore]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
          <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl text-white font-medium">Loading store details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-8 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Store Not Found</h1>
            <p className="text-red-200 mb-6">{err || 'The requested store could not be found.'}</p>
            <Link href="/admin/stores" className="inline-flex px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
              ← Back to Stores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to render tab content
  const renderTabContent = () => {
    if (activeTab === 'details') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Edit Form */}
          <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Store Details</h2>
            
            <form onSubmit={saveStore} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Store Name</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.storeName} 
                      onChange={(e) => setEdit(v => ({ ...v, storeName: e.target.value }))}
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
                      <option value="maintenance">Maintenance</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="archived">Archived</option>
                    </select>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">City</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.city} 
                      onChange={(e) => setEdit(v => ({ ...v, city: e.target.value }))}
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
                  <label className="block text-sm font-medium text-gray-200 mb-3">ZIP Code</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                      value={edit.zipCode} 
                      onChange={(e) => setEdit(v => ({ ...v, zipCode: e.target.value }))}
                      placeholder="Enter ZIP code"
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
                      min="0" 
                      max="100" 
                      step="0.1" 
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
              </div>
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
      );
    }

    if (activeTab === 'wallet') {
      return (
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
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-white">Loading wallet information...</div>
              </div>
            </div>
          ) : wErr ? (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6">
              <div className="text-center">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <div className="text-red-200 font-medium mb-4">{wErr}</div>
                {CAN_WALLET && (
                  <button
                    onClick={generateWallet}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-medium rounded-xl transition-colors"
                  >
                    Generate Wallet
                  </button>
                )}
              </div>
            </div>
          ) : !wallet.exists ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Wallet Found</h3>
              <p className="text-gray-400 mb-6">This store doesn't have a wallet yet.</p>
              {CAN_WALLET && (
                <button
                  onClick={generateWallet}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Generate Wallet
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Address */}
              <div>
                <div className="text-gray-400 text-sm font-medium mb-2">Wallet Address</div>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 border border-gray-600/30 flex-1">
                    {wallet.publicKey}
                  </div>
                  <a
                    href={SOLSCAN(wallet.publicKey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    View on Solscan
                  </a>
                </div>
              </div>

              {/* Balances */}
              {wallet.balances && (
                <div>
                  <div className="text-gray-400 text-sm font-medium mb-4">Token Balances</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(wallet.balances).map(([token, balance]) => (
                      <div key={token} className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
                        <div className="text-gray-400 text-sm mb-1">{token}</div>
                        <div className="text-white text-xl font-bold">
                          {Number(balance).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={refreshWallet}
                  disabled={wLoading}
                  className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium rounded-xl transition-colors border border-gray-600/30"
                >
                  Refresh Balances
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Add other tab content here as needed...
    return (
      <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-12 border border-gray-700/50 text-center">
        <div className="text-gray-400 text-8xl mb-6">🚧</div>
        <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-gray-400 text-lg">
          This tab content is under development.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        <div className="absolute top-20 left-10 w-32 h-32 border border-yellow-500/10 rounded-xl rotate-12 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 border border-orange-500/10 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: '4s' }}></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin/stores" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50 transition-all">
                  ←
                </div>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">{store.storeName || 'Store Details'}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <StatusBadge status={store.status} />
                  <span className="text-gray-400 text-sm">ID: {store.storeId}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              {store.status === 'active' && CAN_EDIT && (
                <button
                  onClick={() => handleStoreAction('deactivate')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-orange-600/80 hover:bg-orange-600 disabled:bg-orange-800 text-white font-medium rounded-xl transition-colors"
                >
                  {actionLoading ? 'Processing...' : 'Deactivate'}
                </button>
              )}
              
              {store.status === 'inactive' && CAN_EDIT && (
                <button
                  onClick={() => handleStoreAction('activate')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:bg-green-800 text-white font-medium rounded-xl transition-colors"
                >
                  {actionLoading ? 'Processing...' : 'Activate'}
                </button>
              )}

              {CAN_DELETE && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                >
                  More Actions
                </button>
              )}
            </div>
          </div>

          {/* Save Message */}
          {saveMsg && (
            <div className="mb-6 bg-green-900/30 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <p className="text-green-200 font-medium">{saveMsg}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-6 border-b border-gray-700/50">
              {[
                { id: 'details', label: 'Store Details', icon: '🏪' },
                { id: 'wallet', label: 'Wallet', icon: '💰' },
                { id: 'machines', label: 'Machines', icon: '🎰', count: machineStats.total },
                { id: 'reports', label: 'Reports', icon: '📊' },
                { id: 'analytics', label: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-yellow-400 border-yellow-400'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-gray-600/50 text-gray-300 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>

      {/* Store Delete/Action Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-md">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Store Actions</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300 mb-6">
                  Choose an action to perform on <span className="font-semibold text-white">{store.storeName}</span>:
                </p>

                <div className="space-y-3">
                  {store.status === 'active' && (
                    <button
                      onClick={() => handleStoreAction('deactivate')}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-orange-600/80 hover:bg-orange-600 disabled:bg-orange-800 text-white font-medium rounded-xl transition-colors text-left"
                    >
                      🔒 Deactivate Store
                    </button>
                  )}

                  {store.status === 'inactive' && (
                    <button
                      onClick={() => handleStoreAction('activate')}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-green-600/80 hover:bg-green-600 disabled:bg-green-800 text-white font-medium rounded-xl transition-colors text-left"
                    >
                      ✅ Activate Store
                    </button>
                  )}

                  {store.status !== 'suspended' && (
                    <button
                      onClick={() => handleStoreAction('suspend')}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-purple-600/80 hover:bg-purple-600 disabled:bg-purple-800 text-white font-medium rounded-xl transition-colors text-left"
                    >
                      ⏸️ Suspend Store
                    </button>
                  )}

                  {store.status !== 'archived' && (
                    <button
                      onClick={() => handleStoreAction('archive')}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-gray-600/80 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium rounded-xl transition-colors text-left"
                    >
                      📦 Archive Store
                    </button>
                  )}

                  <hr className="border-gray-700/50 my-4" />

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to mark "${store.storeName}" as deleted? This will preserve the data for recovery.`)) {
                        handleStoreAction('delete');
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-red-600/80 hover:bg-red-600 disabled:bg-red-800 text-white font-medium rounded-xl transition-colors text-left"
                  >
                    🗑️ Mark as Deleted (Recoverable)
                  </button>
                </div>

                {actionLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-white">Processing...</span>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}