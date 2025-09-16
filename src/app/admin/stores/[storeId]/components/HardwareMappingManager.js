import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function MuthaGooseMappingManager({ storeId }) {
  const [machines, setMachines] = useState([]);
  const [mappingStats, setMappingStats] = useState({});
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Assignment states
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [selectedHub, setSelectedHub] = useState('gambino-pi-001');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadMuthaGooseMappings();
    }
  }, [storeId]);

  const loadMuthaGooseMappings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/api/machines/stores/${storeId}/mutha-mappings`);
      
      if (response.data.success) {
        setMachines(response.data.machines);
        setMappingStats(response.data.mappingStats);
        setAvailableNumbers(response.data.availableNumbers);
      }
    } catch (err) {
      setError('Failed to load Mutha Goose mappings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assignMuthaGoose = async (machineId, muthaGooseNumber, hubMachineId) => {
    try {
      const response = await api.post(`/api/machines/${machineId}/assign-mutha`, {
        muthaGooseNumber: parseInt(muthaGooseNumber),
        hubMachineId
      });
      
      if (response.data.success) {
        await loadMuthaGooseMappings(); // Refresh data
        setShowAssignModal(false);
        setSelectedMachine(null);
        setSelectedNumber('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign Mutha Goose number');
    }
  };

  const removeMapping = async (machineId) => {
    if (!confirm('Remove Mutha Goose mapping? This will disconnect the machine from the Pi.')) {
      return;
    }
    
    try {
      await api.delete(`/api/machines/${machineId}/mutha-mapping`);
      await loadMuthaGooseMappings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove mapping');
    }
  };

  const openAssignModal = (machine) => {
    setSelectedMachine(machine);
    setSelectedNumber('');
    setShowAssignModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'mapped': return 'text-green-400 bg-green-900/20';
      case 'unmapped': return 'text-yellow-400 bg-yellow-900/20';
      case 'conflict': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white">Loading Mutha Goose mappings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-red-300 hover:text-red-100 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Machines</div>
          <div className="text-2xl font-bold text-white">{mappingStats.totalMachines}</div>
        </div>
        <div className="bg-green-900/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Mapped</div>
          <div className="text-2xl font-bold text-green-400">{mappingStats.mapped}</div>
        </div>
        <div className="bg-yellow-900/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Unmapped</div>
          <div className="text-2xl font-bold text-yellow-400">{mappingStats.unmapped}</div>
        </div>
        <div className="bg-red-900/30 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Conflicts</div>
          <div className="text-2xl font-bold text-red-400">{mappingStats.conflicts}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Mutha Goose Mappings</h3>
        <div className="flex gap-3">
          <button
            onClick={loadMuthaGooseMappings}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">About Mutha Goose Mapping</h4>
        <p className="text-blue-200 text-sm">
          Map your machines to Mutha Goose numbers (1-99) for Pi connectivity. The Mutha Goose number 
          corresponds to the DIP switch setting on your physical gaming machines.
        </p>
      </div>

      {/* Machines Table */}
      <div className="bg-gray-800/30 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="text-left py-3 px-4 text-gray-300">Machine ID</th>
              <th className="text-left py-3 px-4 text-gray-300">Name</th>
              <th className="text-left py-3 px-4 text-gray-300">Mutha Goose #</th>
              <th className="text-left py-3 px-4 text-gray-300">Mutha ID</th>
              <th className="text-left py-3 px-4 text-gray-300">Hub</th>
              <th className="text-left py-3 px-4 text-gray-300">Status</th>
              <th className="text-left py-3 px-4 text-gray-300">Game Type</th>
              <th className="text-left py-3 px-4 text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {machines.map((machine) => (
              <tr key={machine._id} className="hover:bg-gray-700/20">
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-white">{machine.machineId}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-white">{machine.name || machine.machineId}</span>
                </td>
                <td className="py-3 px-4">
                  {machine.muthaGooseNumber ? (
                    <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm font-mono">
                      MG{machine.muthaGooseNumber.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">Not assigned</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {machine.muthaGooseId ? (
                    <span className="text-gray-300 font-mono text-sm">{machine.muthaGooseId}</span>
                  ) : (
                    <span className="text-gray-500 text-sm">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {machine.hubMachineId ? (
                    <span className="text-blue-300 font-mono text-sm">{machine.hubMachineId}</span>
                  ) : (
                    <span className="text-gray-500 text-sm">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(machine.mappingStatus)}`}>
                    {machine.mappingStatus || 'unmapped'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-300 text-sm">{machine.gameType}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {machine.muthaGooseNumber ? (
                      <button
                        onClick={() => removeMapping(machine.machineId)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssignModal(machine)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Available Numbers */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h4 className="font-medium text-white mb-3">Available Mutha Goose Numbers</h4>
        <div className="flex flex-wrap gap-2">
          {availableNumbers.slice(0, 20).map(id => (
            <span key={id} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm font-mono">
              MG{id.toString().padStart(2, '0')}
            </span>
          ))}
          {availableNumbers.length > 20 && (
            <span className="text-gray-400 text-sm">
              +{availableNumbers.length - 20} more
            </span>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Assign Mutha Goose to {selectedMachine.machineId}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mutha Goose Number (1-99)
              </label>
              <select
                value={selectedNumber}
                onChange={(e) => setSelectedNumber(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">Select Number</option>
                {availableNumbers.map(id => (
                  <option key={id} value={id}>MG{id.toString().padStart(2, '0')} ({id})</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hub Machine ID
              </label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="gambino-pi-001">gambino-pi-001</option>
                <option value="gambino-pi-002">gambino-pi-002</option>
                <option value="gambino-pi-003">gambino-pi-003</option>
              </select>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-4">
              <p className="text-blue-200 text-sm">
                This will map DIP switch setting {selectedNumber} to machine {selectedMachine.machineId}.
                Make sure the physical gaming machine has the correct DIP switch configuration.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => assignMuthaGoose(selectedMachine.machineId, selectedNumber, selectedHub)}
                disabled={!selectedNumber || !selectedHub}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}