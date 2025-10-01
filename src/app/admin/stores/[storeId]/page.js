'use client';

import { useEffect, useState, useCallback, useMemo, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { StoreDetailsTab } from './components/StoreDetailsTab';
import { StoreModals } from './components/StoreModals';
import { getUser } from '@/lib/auth';
import HardwareMappingManager from './components/HardwareMappingManager';

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
  
  // NEW: Daily Reports States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyReports, setDailyReports] = useState([]);
  const [reportsSummary, setReportsSummary] = useState({
    total: 0,
    included: 0,
    totalRevenue: 0
  });
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  
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
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      active: 'bg-green-900/20 border-green-500/30 text-green-300',
      inactive: 'bg-red-900/20 border-red-500/30 text-red-300',
      maintenance: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
      pending: 'bg-orange-900/20 border-orange-500/30 text-orange-300',
      included: 'bg-green-900/20 border-green-500/30 text-green-300',
      excluded: 'bg-red-900/20 border-red-500/30 text-red-300',
      duplicate: 'bg-orange-900/20 border-orange-500/30 text-orange-300',
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

  // NEW: Fetch daily reports for selected date
  const fetchDailyReports = useCallback(async (date) => {
    try {
      setReportsLoading(true);
      setReportsError('');
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await api.get(
        `/api/admin/reports/daily/${encodeURIComponent(storeId)}?date=${dateStr}`
      );
      
      const reports = data.reports || [];
      setDailyReports(reports);
      
      // Calculate summary - FIXED: use reconciliationStatus === 'included'
      const included = reports.filter(r => r.reconciliationStatus === 'included');
      setReportsSummary({
        total: reports.length,
        included: included.length,
        totalRevenue: included.reduce((sum, r) => sum + (r.totalRevenue || 0), 0)
      });
    } catch (err) {
      setReportsError(err?.response?.data?.error || 'Failed to load daily reports');
      setDailyReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, [storeId]);

  // NEW: Toggle report reconciliation status
  const handleToggleReconciliation = async (reportId, include) => {
    try {
      setReportsLoading(true);
      await api.post(`/api/admin/reports/${reportId}/reconciliation`, {
        include,
        notes: include ? 'Included by user' : 'Excluded by user'
      });
      
      // Refresh reports for current date
      await fetchDailyReports(selectedDate);
      
      setSaveMsg(`Report ${include ? 'included' : 'excluded'} successfully`);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setReportsError(err?.response?.data?.error || 'Failed to update report');
    } finally {
      setReportsLoading(false);
    }
  };

  // NEW: Date navigation helpers
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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
      
      const updatedStore = { ...store, ...payload };
      setStore(updatedStore);
      setFromStore(updatedStore);
      
      localStorage.setItem('storeListRefreshNeeded', 'true');
      
      setSaveMsg(successMessage);
      setTimeout(() => setSaveMsg(''), 2000);
      
      if (action === 'delete') {
        setTimeout(() => {
          router.push('/admin/stores?refresh=true');
        }, 1500);
      }
      
    } catch (error) {
      setErr(error?.response?.data?.error || `Failed to ${action} store: ${error.message}`);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleBackToStores = () => {
    localStorage.setItem('storeListRefreshNeeded', 'true');
    router.push('/admin/stores');
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

  // NEW: Load daily reports when reports tab is active or date changes
  useEffect(() => {
    if (activeTab === 'reports' && storeId) {
      fetchDailyReports(selectedDate);
    }
  }, [activeTab, selectedDate, storeId, fetchDailyReports]);

  // Callback to update machine stats from child component
  const updateMachineStats = useCallback((stats) => {
    setMachineStats(stats);
  }, []);

  const refreshMachines = () => {
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
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
            <button
              onClick={handleBackToStores}
              className="inline-flex px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              ← Back to Stores
            </button>
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
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBackToStores}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl flex items-center justify-center border border-gray-600/30 hover:border-gray-500/50 transition-all">
                  ←
                </div>
              </button>
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

          {/* Error Message */}
          {err && (
            <div className="mb-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                <p className="text-red-200 font-medium">{err}</p>
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
                { id: 'analytics', label: 'Analytics', icon: '📈' },
                { id: 'hardware', label: 'Hardware Mapping', icon: '🔌' }
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
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-gray-600/50 text-gray-300 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content - Reports Tab with NEW Daily Reports UI */}
          {activeTab === 'reports' ? (
            <div className="space-y-6">
              {/* Date Navigator */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={goToPrevDay} 
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    ← Previous Day
                  </button>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h2>
                    {!isToday(selectedDate) && (
                      <button 
                        onClick={goToToday} 
                        className="text-sm text-blue-400 hover:underline mt-1"
                      >
                        Jump to Today
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={goToNextDay} 
                    disabled={isToday(selectedDate)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    Next Day →
                  </button>
                </div>
              </div>

              {/* Reports Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="text-blue-300 text-sm font-medium">Total Reports</div>
                  <div className="text-3xl font-bold text-white mt-1">{reportsSummary.total}</div>
                </div>
                
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                  <div className="text-green-300 text-sm font-medium">Included in Reconciliation</div>
                  <div className="text-3xl font-bold text-white mt-1">{reportsSummary.included}</div>
                </div>
                
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                  <div className="text-yellow-300 text-sm font-medium">Total Revenue (Included)</div>
                  <div className="text-3xl font-bold text-white mt-1">
                    ${reportsSummary.totalRevenue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {reportsError && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-200">{reportsError}</p>
                </div>
              )}

              {/* Reports List */}
              {reportsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : dailyReports.length === 0 ? (
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
                  <div className="text-gray-400 text-lg">No reports found for this date</div>
                  <p className="text-gray-500 text-sm mt-2">
                    Reports are automatically created when the Pi sends daily summary data
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dailyReports.map((report, index) => (
                    <div 
                      key={report._id}
                      className={`bg-gray-800/50 border rounded-xl p-6 transition-all ${
                        report.reconciliationStatus === 'included' 
                          ? 'border-green-500/50'
                          : report.reconciliationStatus === 'excluded'
                          ? 'border-red-500/50'
                          : report.reconciliationStatus === 'duplicate'
                          ? 'border-orange-500/50'
                          : 'border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-white">
                              Report #{index + 1}
                            </h3>
                            <StatusBadge status={report.reconciliationStatus || 'pending'} />
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-400">Printed At</div>
                              <div className="text-white font-medium">
                                {new Date(report.printedAt).toLocaleTimeString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Revenue</div>
                              <div className="text-white font-bold text-lg">
                                ${(report.totalRevenue || 0).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Machines</div>
                              <div className="text-white font-medium">
                                {report.machineData?.length || 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Quality Score</div>
                              <div className="text-white font-medium">
                                {report.qualityScore || 0}/100
                              </div>
                            </div>
                          </div>

                          {report.anomalyReasons && report.anomalyReasons.length > 0 && (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                              <div className="text-yellow-300 text-sm font-medium mb-1">
                                ⚠️ Data Quality Issues:
                              </div>
                              <div className="text-yellow-200 text-sm">
                                {report.anomalyReasons.join(', ')}
                              </div>
                            </div>
                          )}

                          {/* Machine Breakdown - FIXED field names */}
                          {report.machineData && report.machineData.length > 0 && (
                            <details className="mt-4">
                              <summary className="text-blue-400 hover:text-blue-300 cursor-pointer text-sm font-medium">
                                View Machine Breakdown ({report.machineData.length} machines)
                              </summary>
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {report.machineData.map((machine, idx) => (
                                  <div key={idx} className="bg-gray-900/50 rounded-lg p-2">
                                    <div className="text-xs text-gray-400">{machine.machineId}</div>
                                    <div className="text-white font-medium">
                                      ${(machine.netRevenue || 0).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>

                        {/* Action Buttons - FIXED logic */}
                        <div className="flex flex-col gap-2 ml-4">
                          {(report.reconciliationStatus === 'pending' || report.reconciliationStatus === 'excluded') && (
                            <button
                              onClick={() => handleToggleReconciliation(report._id, true)}
                              disabled={reportsLoading}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium rounded-lg text-sm transition-colors"
                            >
                              Include
                            </button>
                          )}
                          {(report.reconciliationStatus === 'pending' || report.reconciliationStatus === 'included') && (
                            <button
                              onClick={() => handleToggleReconciliation(report._id, false)}
                              disabled={reportsLoading}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium rounded-lg text-sm transition-colors"
                            >
                              Exclude
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* ALL MODALS */}
      <StoreModals
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
        store={store}
        machines={[]}
        selectedMachines={[]}
        setSelectedMachines={() => {}}
        connectionInfo={connectionInfo}
        qrCodeData={qrCodeData}
        onMachinesUpdate={refreshMachines}
        actionLoading={actionLoading}
        handleStoreAction={handleStoreAction}
        userRole={userRole}
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