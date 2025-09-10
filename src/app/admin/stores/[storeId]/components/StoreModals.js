// StoreModals.js - Modal components for store management
import { useState } from 'react';
import api from '@/lib/api';

export const StoreModals = ({
  showDeleteModal, setShowDeleteModal, showAddMachine, setShowAddMachine,
  showBulkModal, setShowBulkModal, showConnectionInfo, setShowConnectionInfo,
  showQRModal, setShowQRModal, store, newMachine, setNewMachine, addingMachine,
  selectedMachines, bulkAction, setBulkAction, connectionInfo, qrCodeData,
  generatingQR, actionLoading, handleStoreAction, setSelectedMachines
}) => {

  // Add machine handler
  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (addingMachine) return;

    try {
      setAddingMachine(true);
      setMachinesError('');

      const { data } = await api.post(`/api/machines/stores/${encodeURIComponent(store.storeId || store._id)}`, {
        ...newMachine,
        machineId: newMachine.machineId.trim(),
        name: newMachine.name.trim() || `Machine ${newMachine.machineId.trim()}`,
        location: newMachine.location.trim()
      });

      if (data.success) {
        await fetchMachines();
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

  // Bulk action handler
  const handleBulkAction = async () => {
    if (!bulkAction || selectedMachines.length === 0) return;

    try {
      setMachinesLoading(true);
      
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

  return (
    <>
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
                      if (confirm(`Are you sure you want to permanently delete "${store.storeName}"? This action cannot be undone.`)) {
                        handleStoreAction('delete');
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-red-600/80 hover:bg-red-600 disabled:bg-red-800 text-white font-medium rounded-xl transition-colors text-left"
                  >
                    🗑️ Delete Store (Permanent)
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

      {/* Add Machine Modal */}
      {showAddMachine && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-2xl">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">Machine ID *</label>
                    <div className="relative">
                      <input
                        required
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        value={newMachine.machineId}
                        onChange={(e) => setNewMachine(v => ({ ...v, machineId: e.target.value }))}
                        placeholder="Enter unique machine ID"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">Machine Name</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        value={newMachine.name}
                        onChange={(e) => setNewMachine(v => ({ ...v, name: e.target.value }))}
                        placeholder="Enter machine name (optional)"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">Location</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        value={newMachine.location}
                        onChange={(e) => setNewMachine(v => ({ ...v, location: e.target.value }))}
                        placeholder="Enter machine location"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-3">Game Type</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        value={newMachine.gameType}
                        onChange={(e) => setNewMachine(v => ({ ...v, gameType: e.target.value }))}
                      >
                        <option value="slot">Slot Machine</option>
                        <option value="poker">Poker</option>
                        <option value="blackjack">Blackjack</option>
                        <option value="roulette">Roulette</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-3">Hub ID (Optional)</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-4 bg-gray-700/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200 backdrop-blur-sm"
                        value={newMachine.hubId}
                        onChange={(e) => setNewMachine(v => ({ ...v, hubId: e.target.value }))}
                        placeholder="Enter hub ID if applicable"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMachine(false)}
                    disabled={addingMachine}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMachine || !newMachine.machineId.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
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
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/5 to-amber-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                </div>

                {bulkAction === 'delete' && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="text-red-400 text-2xl mr-3">⚠️</div>
                      <div>
                        <div className="text-red-200 font-medium">Warning</div>
                        <div className="text-red-300 text-sm">This will permanently delete {selectedMachines.length} machines.</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkAction('');
                    }}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className={`px-6 py-3 font-medium rounded-xl transition-all duration-200 ${
                      bulkAction === 'delete'
                        ? 'bg-red-600/80 hover:bg-red-600 disabled:bg-red-800 text-white'
                        : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-black'
                    } disabled:cursor-not-allowed`}
                  >
                    {bulkAction === 'delete' ? 'Delete Machines' : 'Apply Action'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Info Modal */}
      {showConnectionInfo && connectionInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 w-full max-w-lg">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Connection Info</h3>
                <button
                  onClick={() => setShowConnectionInfo(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">WebSocket URL</label>
                  <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 border border-gray-600/30 break-all">
                    {connectionInfo.websocketUrl}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">API Key</label>
                  <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 border border-gray-600/30 break-all">
                    {connectionInfo.apiKey}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Machine ID</label>
                  <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 border border-gray-600/30">
                    {connectionInfo.machineId}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4">
                  <button
                    onClick={() => setShowConnectionInfo(false)}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
                  >
                    Close
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
                <h3 className="text-2xl font-bold text-white">Machine QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="text-center space-y-6">
                <div className="bg-white p-4 rounded-xl inline-block">
                  <img
                    src={qrCodeData.qrCodeUrl}
                    alt="Machine QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div>
                  <div className="text-gray-400 text-sm mb-2">Machine ID</div>
                  <div className="bg-gray-700/30 rounded-lg p-3 font-mono text-yellow-400 border border-gray-600/30">
                    {qrCodeData.machineId}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeData.qrCodeUrl;
                      link.download = `machine-${qrCodeData.machineId}-qr.png`;
                      link.click();
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Download QR Code
                  </button>
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="px-6 py-3 bg-gray-700/30 hover:bg-gray-600/30 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 border border-gray-600/50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};