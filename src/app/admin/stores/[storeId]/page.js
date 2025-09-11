'use client';

import { useEffect, useState, useCallback, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { StoreDetailsTab } from './components/StoreDetailsTab';
import { StoreModals } from './components/StoreModals';
import { getUser } from '@/lib/auth';



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

  // User role state
  const [userRole, setUserRole] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('details');
  
  // Machine stats for tab counter
  const [machineStats, setMachineStats] = useState({ total: 0, active: 0, inactive: 0, maintenance: 0 });
  
  const refreshMachines = () => {
    // This should trigger the machines to refresh in StoreDetailsTab
    // You might need to add a ref or callback to StoreDetailsTab
    window.location.reload(); // Simple solution for now
  };

  // Modal states
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const CAN_EDIT = true;
  const CAN_WALLET = true;
  const CAN_DELETE = true;

  // Helper functions
  const clampFee = (val) => Math.max(0, Math.min(100, Number(val) || 0));
  const abortRef = useRef();


  const [showConnectionInfo, setShowConnectionInfo] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Get user role on mount
  useEffect(() => {
  const currentUser = getUser();
  const role = currentUser?.role || 'venue_manager';
  setUserRole(role);
  
  console.log('User role detected:', role);
}, []);

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
      await api.put(`/api/admin/stores/${encodeURIComponent(store.storeId || store._id)}`, payload);
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

  // Store action handler
  const handleStoreAction = async (action) => {
    if (!store) return;
    
    setActionLoading(true);
    setErr('');
    
    try {
      let payload, successMessage;
      
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
          payload = { 
            status: 'deleted',
            deletedAt: new Date().toISOString(),
            deletedBy: userRole || 'admin'
          };
          successMessage = 'Store marked as deleted successfully';
          break;
        default:
          throw new Error('Invalid action: ' + action);
      }

      await api.put(`/api/admin/stores/${encodeURIComponent(store.storeId || store._id)}`, payload);
      
      setStore(prev => ({ ...prev, ...payload }));
      setFromStore({ ...store, ...payload });
      setSaveMsg(successMessage);
      setTimeout(() => setSaveMsg(''), 2000);
      
      if (action === 'delete') {
        setTimeout(() => {
          router.push('/admin/stores');
        }, 1500);
      }
      
    } catch (error) {
      console.error(`Failed to ${action} store:`, error);
      setErr(error?.response?.data?.error || `Failed to ${action} store: ${error.message}`);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const ownerText = useMemo(() => {
    return store?.owner?.email || store?.ownerUserId || '—';
  }, [store]);

  // Load initial data
  useEffect(() => {
    if (storeId) {
      fetchStore();
    }
  }, [storeId, fetchStore]);

  // Callback to update machine stats from child component
  const updateMachineStats = useCallback((stats) => {
    setMachineStats(stats);
  }, []);

  // Loading state
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

  // Error state - Store not found
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

  // Main render
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
                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <span className="text-yellow-400 text-sm font-medium">• Admin Mode</span>
                  )}
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

          {/* Tab Content - Using the StoreDetailsTab Component with userRole */}
          <StoreDetailsTab
            activeTab={activeTab}
            store={store}
            edit={edit}
            setEdit={setEdit}
            saving={saving}
            err={err}
            saveStore={saveStore}
            setFromStore={setFromStore}
            StatusBadge={StatusBadge}
            ownerText={ownerText}
            CAN_EDIT={CAN_EDIT}
            CAN_WALLET={CAN_WALLET}
            showSubmitForm={showSubmitForm}
            setShowSubmitForm={setShowSubmitForm}
            setShowAddMachine={setShowAddMachine}
            setShowBulkModal={setShowBulkModal}
            SOLSCAN={SOLSCAN}
            onMachineStatsUpdate={updateMachineStats}
            userRole={userRole}
          />
        </div>
      </div>

      {/* ALL MODALS HANDLED BY StoreModals COMPONENT - NO DUPLICATE MODAL CODE */}
      <StoreModals
        // Modal visibility states
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        showAddMachine={showAddMachine}
        setShowAddMachine={setShowAddMachine}
        showBulkModal={showBulkModal}
        setShowBulkModal={setShowBulkModal}
        showConnectionInfo={showConnectionInfo}
        setShowConnectionInfo={setShowConnectionInfo}
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}

        // Store data
        store={store}

        // Machine-related props  
        machines={[]}
        selectedMachines={[]}
        setSelectedMachines={() => {}}

        // Additional data
        connectionInfo={connectionInfo}
        qrCodeData={qrCodeData}

        // Callbacks
        onMachinesUpdate={refreshMachines}
        actionLoading={actionLoading}
        handleStoreAction={handleStoreAction}
        userRole={userRole}

        // These are referenced in the original StoreModals but not used in the fixed version
        // If needed, add these states too:
        newMachine={null}
        setNewMachine={() => {}}
        addingMachine={false}
        bulkAction=""
        setBulkAction={() => {}}
        generatingQR={false}
      />
    </div>
  );
}