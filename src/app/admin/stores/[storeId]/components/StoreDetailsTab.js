import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { MachineDetailModal } from './MachineDetailModal';
import AnalyticsTabContent from './AnalyticsTabContent';


export const StoreDetailsTab = ({
  activeTab, store, storeId, edit, setEdit, saving, err, saveStore, setFromStore,
  StatusBadge, ownerText, CAN_EDIT, CAN_WALLET, showSubmitForm, setShowSubmitForm,
  setShowAddMachine, setShowBulkModal, SOLSCAN, onMachineStatsUpdate,
  userRole
}) => {

  const [machines, setMachines] = useState([]);
  const [machineStats, setMachineStats] = useState({ total: 0, active: 0, inactive: 0, maintenance: 0 });
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [machinesError, setMachinesError] = useState('');
  const [showMachineDetail, setShowMachineDetail] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);

  const [wallet, setWallet] = useState({ exists: false, publicKey: null, balances: null });
  const [wLoading, setWLoading] = useState(false);
  const [wErr, setWErr] = useState('');
  const [wMsg, setWMsg] = useState('');

  const [reconciliations, setReconciliations] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [selectedMachines, setSelectedMachines] = useState([]);

  const [fledglingNumber, setFledglingNumber] = useState('');


  // Check if user is admin
  const isAdmin = userRole === 'super_admin' || userRole === 'gambino_ops';
  console.log('User role:', userRole, 'Is admin?:', isAdmin);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [tokenMachineId, setTokenMachineId] = useState(null);
  const [copied, setCopied] = useState(false);

  const [piReports, setPiReports] = useState([]);
const [piReportsLoading, setPiReportsLoading] = useState(false);
const [piReportsError, setPiReportsError] = useState('');
const [showPiData, setShowPiData] = useState(true); // Default to showing Pi data
const [dataComparison, setDataComparison] = useState(null);

// Add this function to fetch Pi reports
const fetchPiReports = useCallback(async () => {
  try {
    setPiReportsLoading(true);
    setPiReportsError('');

    // Get available dates with Pi data
    const datesResponse = await api.get(`/api/admin/reports/pi-data/${encodeURIComponent(store.storeId || store._id)}?days=30`);
    const availableDates = datesResponse.data.availableDates.filter(d => d.hasData);

    // Get reports for each date
    const piReportsData = [];
    for (const dateInfo of availableDates.slice(0, 10)) { // Limit to last 10 days
      try {
        const reportResponse = await api.get(`/api/admin/reports/pi-data/${encodeURIComponent(store.storeId || store._id)}?date=${dateInfo.date}`);
        piReportsData.push(reportResponse.data.report);
      } catch (error) {
        console.warn(`Failed to get Pi report for ${dateInfo.date}:`, error);
      }
    }

    setPiReports(piReportsData);
  } catch (err) {
    setPiReportsError(err?.response?.data?.error || 'Failed to load Pi data reports');
  } finally {
    setPiReportsLoading(false);
  }
}, [store]);
  
  const regenerateQR = async (machineId) => {
  try {
    const response = await api.post(`/api/machines/${machineId}/regenerate-qr`);
    if (response.data.success) {
      setQRCodeData({
        qrCodeUrl: response.data.qrCode,
        machineId: response.data.machineId,
        bindUrl: response.data.bindUrl
      });
      alert('QR code regenerated successfully');
    }
  } catch (error) {
    alert('Failed to regenerate QR code');
  }
};

  // Pi Token handlers
  const generatePiToken = async (machineId) => {
    try {
      const response = await api.post(`/api/machines/${machineId}/generate-token`);
      
      if (response.data.success) {
        setGeneratedToken(response.data.token);
        setTokenMachineId(machineId);
        setShowTokenModal(true);
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert('Failed to generate token: ' + (error.response?.data?.error || error.message));
    }
  };

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

// Machine handlers
  const fetchMachines = useCallback(async () => {
    try {
      setMachinesLoading(true);
      setMachinesError('');

      const { data } = await api.get(`/api/machines/stores/${encodeURIComponent(store.storeId || store._id)}`);
      const machineList = data.machines || [];
      
      console.log('🔍 Fetched machines:', machineList.map(m => ({id: m._id, machineId: m.machineId, serial: m.serialNumber})));
      setMachines(machineList);

      const stats = {
        total: machineList.length,
        active: machineList.filter(m => m.status === 'active').length,
        inactive: machineList.filter(m => m.status === 'inactive').length,
        maintenance: machineList.filter(m => m.status === 'maintenance').length
      };
      setMachineStats(stats);
      
      if (onMachineStatsUpdate) {
        onMachineStatsUpdate(stats);
      }
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to load machines');
    } finally {
      setMachinesLoading(false);
    }
  }, [store, onMachineStatsUpdate]);

    const updateMachineInState = useCallback((updatedMachine) => {
    console.log('🔍 updateMachineInState called with:', updatedMachine);
    console.log('🔍 Current machines before update:', machines.map(m => ({id: m._id, machineId: m.machineId, serial: m.serialNumber})));
    
    setMachines(prevMachines => {
      const updatedMachines = prevMachines.map(m => {
        // Try multiple ways to match the machine
        const isMatch = 
          m._id === updatedMachine._id ||                    // Match by database _id
          m.machineId === updatedMachine.machineId ||        // Match by machineId
          (m._id === updatedMachine.id) ||                   // Sometimes backend returns 'id' instead of '_id'
          (m.id === updatedMachine._id);                     // Sometimes frontend uses 'id'
        
        if (isMatch) {
          console.log('🔍 Found match! Updating machine:', m.machineId, 'new serial:', updatedMachine.serialNumber);
          return { ...m, ...updatedMachine };
        }
        return m;
      });
      
      console.log('🔍 Machines after update:', updatedMachines.map(m => ({id: m._id, machineId: m.machineId, serial: m.serialNumber})));
      return updatedMachines;
    });
    
    // Update selected machine if it's the one being updated
    if (selectedMachine) {
      const isSelectedMatch = 
        selectedMachine._id === updatedMachine._id ||
        selectedMachine.machineId === updatedMachine.machineId;
      
      if (isSelectedMatch) {
        console.log('🔍 Updating selectedMachine with new data:', updatedMachine.serialNumber);
        setSelectedMachine({ ...selectedMachine, ...updatedMachine });
      }
    }
  }, [machines, selectedMachine]);

  const deleteMachine = async (machineId) => {
    const machine = machines.find(m => m._id === machineId);
    if (!machine) return;

    if (!confirm(`Are you sure you want to delete machine "${machine.machineId}"?`)) return;

    try {
      await api.delete(`/api/machines/${encodeURIComponent(machine._id)}`);
      await fetchMachines();
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to delete machine');
    }
  };

  const handleMachineClick = (machine) => {
    console.log('🔍 Machine clicked:', machine.machineId, 'serial:', machine.serialNumber);
    setSelectedMachine(machine);
    setShowMachineDetail(true);
  };
  const updateMachineStatus = async (machineId, newStatus) => {
  try {
    await api.put(`/api/machines/${encodeURIComponent(machineId)}`, {
      status: newStatus
    });
    
    // Update local state
    setMachines(prevMachines => 
      prevMachines.map(machine => 
        machine._id === machineId 
          ? { ...machine, status: newStatus }
          : machine
      )
    );
    
    // Recalculate stats
    const updatedMachines = machines.map(machine => 
      machine._id === machineId 
        ? { ...machine, status: newStatus }
        : machine
    );
    
    const newStats = {
      total: updatedMachines.length,
      active: updatedMachines.filter(m => m.status === 'active').length,
      inactive: updatedMachines.filter(m => m.status === 'inactive').length,
      maintenance: updatedMachines.filter(m => m.status === 'maintenance').length
    };
    
    setMachineStats(newStats);
    
    if (onMachineStatsUpdate) {
      onMachineStatsUpdate(newStats);
    }
    
  } catch (err) {
    console.error('Failed to update machine status:', err);
    setMachinesError(err?.response?.data?.error || 'Failed to update machine status');
    // Optionally show a toast notification instead of setting error
    alert('Failed to update machine status: ' + (err?.response?.data?.error || err.message));
  }
};

  // Load machines on component mount and when store changes
  useEffect(() => {
    if (activeTab === 'machines' && store?.storeId) {
      fetchMachines();
    }
  }, [activeTab, store?.storeId, fetchMachines]);

  // Report handlers
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

      const { data } = await api.post(`/api/admin/reconciliation/${encodeURIComponent(store.storeId || store._id)}`, reportData);
      
      if (data.success) {
        setShowSubmitForm(false);
        await fetchReports();
      }
    } catch (err) {
      setReportsError(err?.response?.data?.error || 'Failed to submit report');
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      setReportsError('');

      const { data } = await api.get(`/api/admin/reconciliation/${encodeURIComponent(store.storeId || store._id)}`);
      setReconciliations(data.reconciliations || []);
    } catch (err) {
      setReportsError(err?.response?.data?.error || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }, [store]);

  // Payment handlers for reports
  const handleMarkPaymentSent = async (reportId, amount) => {
    try {
      await api.put(`/api/admin/reconciliation/${store.storeId}/${reportId}/payment-sent`, {
        amountSent: amount,
        sentAt: new Date().toISOString(),
        method: 'pending'
      });
      await fetchReports();
      alert(`Payment of $${amount.toFixed(2)} marked as sent`);
    } catch (err) {
      console.error('Failed to mark payment as sent:', err);
      setReportsError('Failed to update payment status');
    }
  };

  const handleConfirmPayment = async (reportId, amount) => {
    try {
      await api.put(`/api/admin/reconciliation/${store.storeId}/${reportId}/confirm-payment`, {
        amountReceived: amount,
        receivedAt: new Date().toISOString(),
        confirmationNotes: 'Payment confirmed by admin'
      });
      await fetchReports();
      alert(`Payment of $${amount.toFixed(2)} confirmed and settled`);
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      setReportsError('Failed to confirm payment');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'wallet' && store) {
      fetchWallet(store);
    } else if (activeTab === 'machines' && store) {
      fetchMachines();
    } else if (activeTab === 'reports' && store) {
      fetchReports();
    }
  }, [activeTab, store, fetchWallet, fetchMachines, fetchReports]);

  // DETAILS TAB
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
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Status</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">City</label>
                <input 
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                  value={edit.city} 
                  onChange={(e) => setEdit(v => ({ ...v, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">State</label>
                <input 
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                  value={edit.state} 
                  onChange={(e) => setEdit(v => ({ ...v, state: e.target.value }))}
                  placeholder="Enter state"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-3">Address</label>
                <input 
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                  value={edit.address} 
                  onChange={(e) => setEdit(v => ({ ...v, address: e.target.value }))}
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">ZIP Code</label>
                <input 
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                  value={edit.zipCode} 
                  onChange={(e) => setEdit(v => ({ ...v, zipCode: e.target.value }))}
                  placeholder="Enter ZIP code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Phone</label>
                <input 
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                  value={edit.phone} 
                  onChange={(e) => setEdit(v => ({ ...v, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Fee Percentage</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Owner User ID</label>
                <input 
                  className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm" 
                  value={edit.ownerUserId} 
                  onChange={(e) => setEdit(v => ({ ...v, ownerUserId: e.target.value }))}
                  placeholder="Enter owner user ID"
                />
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
                    {saving ? 'Saving...' : 'Save Changes'}
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
            {isAdmin && (
              <div className="pt-4 border-t border-gray-700/50">
                <div className="text-yellow-400 text-sm font-medium">Admin Mode Active</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // WALLET TAB
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

  // MACHINES TAB
  if (activeTab === 'machines') {
    return (
      <div className="space-y-6">
        {/* Machine Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Machines', value: machineStats.total, color: 'blue' },
            { label: 'Active', value: machineStats.active, color: 'green' },
            { label: 'Inactive', value: machineStats.inactive, color: 'red' },
            { label: 'Maintenance', value: machineStats.maintenance, color: 'yellow' }
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
              <div className="text-gray-400 text-sm font-medium mb-2">{stat.label}</div>
              <div className={`text-3xl font-bold text-${stat.color}-400`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Machine Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddMachine(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Add Machine
            </button>
            {selectedMachines.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-6 py-3 bg-purple-600/80 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors"
              >
                Bulk Actions ({selectedMachines.length})
              </button>
            )}
          </div>
          <button
            onClick={fetchMachines}
            disabled={machinesLoading}
            className="px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium rounded-xl transition-colors border border-gray-600/30"
          >
            {machinesLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Machines Table */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
          {machinesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-white">Loading machines...</div>
              </div>
            </div>
          ) : machinesError ? (
            <div className="p-8 text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <div className="text-red-200 font-medium">{machinesError}</div>
            </div>
          ) : machines.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🎰</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Machines Found</h3>
              <p className="text-gray-400 mb-6">This store doesn't have any machines yet.</p>
              <button
                onClick={() => setShowAddMachine(true)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Add First Machine
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedMachines.length === machines.length}
                        onChange={() => {
                          if (selectedMachines.length === machines.length) {
                            setSelectedMachines([]);
                          } else {
                            setSelectedMachines(machines.map(m => m._id));
                          }
                        }}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Machine ID</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Name</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Location</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Type</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Serial Number</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Last Seen</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr 
                      key={machine._id} 
                      className="border-b border-gray-700/30 hover:bg-gray-700/20 cursor-pointer"
                      onClick={(e) => {
                        // Don't open modal if clicking on buttons/inputs/selects
                        if (e.target.tagName === 'BUTTON' || 
                            e.target.tagName === 'SELECT' || 
                            e.target.tagName === 'INPUT' ||
                            e.target.tagName === 'OPTION') {
                          return;
                        }
                        setSelectedMachine(machine);
                        setShowMachineDetail(true);
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {/* QR Code button */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await api.get(`/api/machines/${machine._id}/qr-code`);
                                if (response.data.qrCode) {
                                  setQRCodeData({
                                    qrCodeUrl: response.data.qrCode,
                                    machineId: machine.machineId,
                                    bindUrl: response.data.bindUrl
                                  });
                                  setShowQRModal(true);
                                } else {
                                  alert('No QR code exists. Generating new QR code...');
                                  const genResponse = await api.post(`/api/machines/${machine._id}/regenerate-qr`);
                                  if (genResponse.data.qrCode) {
                                    setQRCodeData({
                                      qrCodeUrl: genResponse.data.qrCode,
                                      machineId: machine.machineId,
                                      bindUrl: genResponse.data.bindUrl
                                    });
                                    setShowQRModal(true);
                                  }
                                }
                              } catch (error) {
                                console.error('QR error:', error);
                                alert('Failed to get QR code');
                              }
                            }}
                            className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
                            title="QR Code"
                          >
                            QR
                          </button>
                          
                          {/* Show Pi Token button for edge devices */}
                          {(machine.gameType === 'edge' || machine.machineId.startsWith('pi-')) && (
                            <button
                              onClick={() => generatePiToken(machine.machineId)}
                              className="text-xs bg-purple-600/80 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-colors"
                              title="Generate Pi Token"
                            >
                              Pi Token
                            </button>
                          )}

                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-yellow-400">{machine.machineId}</td>
                      <td className="py-4 px-6 text-white">{machine.name}</td>
                      <td className="py-4 px-6 text-gray-300">{machine.location || '—'}</td>
                      <td className="py-4 px-6 text-gray-300">{machine.gameType || 'slot'}</td>
                      <td className="py-4 px-6 font-mono text-xs text-blue-400">{machine.serialNumber || '—'}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={machine.status} />
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        {machine.lastSeen ? new Date(machine.lastSeen).toLocaleString() : 'Never'}
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
                            onClick={() => deleteMachine(machine._id)}
                            className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded-lg transition-colors"
                          >
                            Delete
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

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Machine QR Code & Mapping Info
              </h2>
              
              {/* QR Code Image */}
              <div className="bg-white rounded-lg p-4 mb-6 flex justify-center">
                <img 
                  src={qrCodeData.qrCodeUrl} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              
              {/* Machine Mapping Information */}
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Mapping Information</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Machine ID:</span>
                    <span className="text-yellow-400 font-mono">{qrCodeData.machineId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fledgling Number:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="63" 
                      placeholder="Enter 1-63"
                      className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 w-20"
                      value={fledglingNumber}
                      onChange={(e) => setFledglingNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Store ID:</span>
                    <span className="text-blue-400 font-mono">{store.storeId}</span>
                  </div>
                </div>
                
                {/* Copy-Paste Command */}
                <div className="mt-4 p-3 bg-black/50 rounded">
                  <p className="text-xs text-gray-400 mb-2">Pi Mapping Command:</p>
                  <div className="font-mono text-xs text-green-400 break-all">
                    ./map-machine.sh {fledglingNumber || 'XX'} {qrCodeData.machineId}
                  </div>
                  <button
                    onClick={() => {
                      if (fledglingNumber) {
                        const command = `./map-machine.sh ${fledglingNumber.padStart(2, '0')} ${qrCodeData.machineId}`;
                        navigator.clipboard.writeText(command);
                        alert('Command copied! Run this on your Pi.');
                      } else {
                        alert('Please enter the Fledgling number first');
                      }
                    }}
                    className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                  >
                    Copy Pi Command
                  </button>
                </div>
              </div>
                  
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeData.qrCodeUrl;
                    link.download = `machine-${qrCodeData.machineId}-qr.png`;
                    link.click();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Download QR
                </button>
                
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQRCodeData(null);
                    setFledglingNumber('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pi Token Modal */}
        {showTokenModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">
                Pi Edge Device Token
              </h2>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Machine ID: {tokenMachineId}</p>
                <p className="text-xs text-gray-500 mb-4">This token is valid for 365 days</p>
                
                <div className="bg-black/50 rounded p-3 font-mono text-xs text-green-400 break-all">
                  {generatedToken}
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg w-full"
                >
                  {copied ? '✓ Copied!' : 'Copy Token'}
                </button>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
                <h3 className="text-blue-400 font-semibold mb-2">Pi Setup Instructions:</h3>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>SSH into Pi: <code className="bg-gray-900 px-2 py-1 rounded text-xs">ssh pi@[ip]</code></li>
                  <li>Navigate: <code className="bg-gray-900 px-2 py-1 rounded text-xs">cd /home/pi/gambino</code></li>
                  <li>Run setup: <code className="bg-gray-900 px-2 py-1 rounded text-xs">./setup.sh</code></li>
                  <li>Paste this token when prompted</li>
                </ol>
              </div>

              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setGeneratedToken(null);
                  setTokenMachineId(null);
                  setCopied(false);
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Machine Detail Modal */}
        {/* Machine Detail Modal - FIXED */}
        <MachineDetailModal
          isOpen={showMachineDetail}
          onClose={() => {
            console.log('🔍 Closing modal');
            setShowMachineDetail(false);
            setSelectedMachine(null);
          }}
          machine={selectedMachine}
          onUpdate={updateMachineInState} // Use the improved update handler
          onGenerateToken={async (machineId) => {
            try {
              const response = await api.post(`/api/machines/${machineId}/generate-token`);
              if (response.data.success) {
                alert(`Token generated: ${response.data.token}`);
              }
            } catch (error) {
              alert('Failed to generate token');
            }
          }}
        />
      </div>
    );
  }

// REPORTS TAB WITH PI DATA INTEGRATION
if (activeTab === 'reports') {
  return (
    <div className="space-y-6">
      {/* Header with data source toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Daily Revenue Reports {isAdmin && <span className="text-yellow-400 text-lg">(Admin View)</span>}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setShowPiData(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                showPiData 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Pi Data (Automatic)
            </button>
            <button
              onClick={() => setShowPiData(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !showPiData 
                  ? 'bg-yellow-500 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Manual Reports
            </button>
          </div>
          <button
            onClick={showPiData ? fetchPiReports : fetchReports}
            disabled={showPiData ? piReportsLoading : reportsLoading}
            className="px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium rounded-xl transition-colors border border-gray-600/30"
          >
            {(showPiData ? piReportsLoading : reportsLoading) ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {showPiData ? (
        // PI DATA VIEW
        <div className="space-y-6">
          {/* Pi Data Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Total from Pi Devices</div>
              <div className="text-2xl font-semibold text-white">
                ${piReports.reduce((sum, r) => sum + (r.piData?.grossRevenue || 0), 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Real-time machine data</div>
            </div>
            
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                Gambino Fee ({store.feePercentage || 5}%)
              </div>
              <div className="text-2xl font-semibold text-blue-400">
                ${piReports.reduce((sum, r) => sum + (r.calculatedSoftwareFee || 0), 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Automated calculation</div>
            </div>
            
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Data Quality</div>
              <div className="text-2xl font-semibold text-green-400">
                {piReports.length > 0 
                  ? Math.round(piReports.reduce((sum, r) => sum + (r.piData?.dataQuality?.score || 0), 0) / piReports.length)
                  : 0}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Avg across all reports</div>
            </div>
            
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Pi Events</div>
              <div className="text-2xl font-semibold text-purple-400">
                {piReports.reduce((sum, r) => sum + (r.piData?.eventCount || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total transactions</div>
            </div>
          </div>

          {/* Pi Data Table */}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
            {piReportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-white">Loading Pi device data...</div>
                </div>
              </div>
            ) : piReportsError ? (
              <div className="p-8 text-center">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <div className="text-red-200 font-medium mb-4">{piReportsError}</div>
                <div className="text-gray-400 text-sm mb-4">
                  Make sure your Pi devices are connected and sending data.
                </div>
                <button
                  onClick={fetchPiReports}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-medium rounded-xl transition-colors"
                >
                  Retry Loading Pi Data
                </button>
              </div>
            ) : piReports.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📡</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Pi Data Found</h3>
                <p className="text-gray-400 mb-6">No revenue data has been received from Pi devices yet.</p>
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="text-blue-400 font-medium mb-2">Troubleshooting:</h4>
                  <ul className="text-sm text-gray-300 text-left space-y-1">
                    <li>• Check if Pi devices are online</li>
                    <li>• Verify machines are connected and active</li>
                    <li>• Ensure Pi tokens are not expired</li>
                    <li>• Check serial connections to Mutha Goose hubs</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Date</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Revenue (Pi Data)</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Gambino Fee</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Venue Keeps</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Events</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Quality</th>
                      <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {piReports.map((report, index) => {
                      const revenue = report.piData.grossRevenue || 0;
                      const fee = report.calculatedSoftwareFee || 0;
                      const venueKeeps = revenue - fee;
                      const quality = report.piData.dataQuality || { score: 0, issues: [] };
                      
                      return (
                        <tr key={index} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                          <td className="py-4 px-6 text-white">
                            {new Date(report.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-white font-mono">
                            ${revenue.toFixed(2)}
                            <div className="text-xs text-gray-400">
                              {report.piData.eventCount} transactions
                            </div>
                          </td>
                          <td className="py-4 px-6 text-blue-400 font-mono">
                            ${fee.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-yellow-400 font-mono">
                            ${venueKeeps.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-gray-300 text-center">
                            {report.piData.eventCount}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                quality.score >= 90 ? 'bg-green-400' :
                                quality.score >= 70 ? 'bg-yellow-400' :
                                'bg-red-400'
                              }`}></div>
                              <span className="text-sm">{quality.score}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  // Show detailed breakdown
                                  alert(`Data Quality Issues:\n${quality.issues.join('\n')}\n\nMachine Breakdown:\n${JSON.stringify(report.piData.machineBreakdown, null, 2)}`);
                                }}
                                className="text-xs bg-gray-600/80 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
                              >
                                Details
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    // Auto-confirm this Pi data as settled
                                    alert(`Auto-settle $${fee.toFixed(2)} from Pi data for ${new Date(report.date).toLocaleDateString()}`);
                                  }}
                                  className="text-xs bg-green-600/80 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors"
                                >
                                  Auto-Settle
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pi Data Info Panel */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="text-blue-400 text-2xl">ℹ️</div>
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Automated Pi Device Reporting</h3>
                <p className="text-gray-300 text-sm mb-3">
                  This data comes directly from your Pi devices monitoring machine transactions in real-time. 
                  No manual entry required - revenue is calculated automatically from MONEY IN and COLLECT events.
                </p>
                <div className="text-xs text-gray-400">
                  <strong>Data Source:</strong> Raspberry Pi devices via serial connection to Mutha Goose hubs<br/>
                  <strong>Update Frequency:</strong> Real-time as transactions occur<br/>
                  <strong>Fee Calculation:</strong> Automatic based on store settings ({store.feePercentage || 5}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // MANUAL REPORTS VIEW (your existing code)
        <div className="space-y-6">
          {/* Your existing manual reports code goes here */}
          {/* ... existing financial overview cards ... */}
          {/* ... existing reports table ... */}
          {/* ... existing submit form ... */}
        </div>
      )}
    </div>
  );
}

  // ANALYTICS TAB
if (activeTab === 'analytics') {
  return (
    <AnalyticsTabContent 
      storeId={storeId || store?.storeId} 
      store={store}
      isAdmin={userRole === 'super_admin' || userRole === 'gambino_ops'} 
    />
  );
}


  return null;
};