// StoreDetailsTab.js - Tab content components
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export const StoreDetailsTab = ({
  activeTab, store, edit, setEdit, saving, err, saveStore, setFromStore,
  StatusBadge, ownerText, CAN_EDIT, CAN_WALLET, wallet, wLoading, wErr, wMsg,
  machines, machineStats, machinesLoading, machinesError, selectedMachines, setSelectedMachines,
  reconciliations, reportsLoading, reportsError, showSubmitForm, setShowSubmitForm,
  currentMiningRevenue, setCurrentMiningRevenue, setShowAddMachine, setShowBulkModal, SOLSCAN
}) => {
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
  }, [store]);

  const refreshWallet = () => fetchWallet(store);

  // Machine handlers
  const fetchMachines = useCallback(async () => {
    try {
      setMachinesLoading(true);
      setMachinesError('');

      const { data } = await api.get(`/api/machines/stores/${encodeURIComponent(store.storeId || store._id)}`);
      const machineList = data.machines || [];
      setMachines(machineList);

      const stats = {
        total: machineList.length,
        active: machineList.filter(m => m.status === 'active').length,
        inactive: machineList.filter(m => m.status === 'inactive').length,
        maintenance: machineList.filter(m => m.status === 'maintenance').length
      };
      setMachineStats(stats);
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to load machines');
    } finally {
      setMachinesLoading(false);
    }
  }, [store]);

  const updateMachineStatus = async (machineId, newStatus) => {
    try {
      const machine = machines.find(m => m._id === machineId);
      if (!machine) return;

      const { data } = await api.put(`/api/machines/${encodeURIComponent(machine._id)}/status`, {
        status: newStatus,
        reason: 'Admin status change'
      });

      if (data.success) {
        await fetchMachines();
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
      await fetchMachines();
    } catch (err) {
      setMachinesError(err?.response?.data?.error || 'Failed to delete machine');
    }
  };

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
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Last Seen</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine._id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedMachines.includes(machine._id)}
                          onChange={() => {
                            if (selectedMachines.includes(machine._id)) {
                              setSelectedMachines(prev => prev.filter(id => id !== machine._id));
                            } else {
                              setSelectedMachines(prev => [...prev, machine._id]);
                            }
                          }}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td className="py-4 px-6 font-mono text-yellow-400">{machine.machineId}</td>
                      <td className="py-4 px-6 text-white">{machine.name}</td>
                      <td className="py-4 px-6 text-gray-300">{machine.location || '—'}</td>
                      <td className="py-4 px-6 text-gray-300">{machine.gameType || 'slot'}</td>
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
      </div>
    );
  }

  if (activeTab === 'reports') {
    return (
      <div className="space-y-6">
        {/* Reports Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Reconciliation Reports</h2>
          <button
            onClick={() => setShowSubmitForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Submit Report
          </button>
        </div>

        {/* Submit Form */}
        {showSubmitForm && (
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Submit Reconciliation Report</h3>
            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-3">Gaming Revenue</label>
                  <input
                    type="number"
                    name="miningRevenue"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Optional notes..."
                  className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={reportsLoading}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-black font-semibold rounded-xl transition-all duration-300"
                >
                  {reportsLoading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
          {reportsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-white">Loading reports...</div>
              </div>
            </div>
          ) : reportsError ? (
            <div className="p-8 text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <div className="text-red-200 font-medium">{reportsError}</div>
            </div>
          ) : reconciliations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Reports Found</h3>
              <p className="text-gray-400 mb-6">No reconciliation reports have been submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Date</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Gaming Revenue</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Notes</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((report, index) => (
                    <tr key={index} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                      <td className="py-4 px-6 text-white">
                        {new Date(report.reconciliationDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-green-400 font-medium">
                        ${Number(report.venueGamingRevenue || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {report.notes || '—'}
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-sm">
                        {report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="space-y-6">
        {/* Coming Soon */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-12 border border-gray-700/50 text-center">
          <div className="text-gray-400 text-8xl mb-6">📈</div>
          <h2 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h2>
          <p className="text-gray-400 text-lg mb-8">
            Advanced analytics and reporting features are coming soon. This will include revenue trends, 
            machine performance metrics, and comparative analytics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-yellow-400 text-3xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">Revenue Trends</h3>
              <p className="text-gray-400 text-sm">Track revenue performance over time</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-green-400 text-3xl mb-3">🎰</div>
              <h3 className="text-white font-semibold mb-2">Machine Performance</h3>
              <p className="text-gray-400 text-sm">Analyze individual machine metrics</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-blue-400 text-3xl mb-3">📈</div>
              <h3 className="text-white font-semibold mb-2">Comparative Analysis</h3>
              <p className="text-gray-400 text-sm">Compare performance across stores</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};