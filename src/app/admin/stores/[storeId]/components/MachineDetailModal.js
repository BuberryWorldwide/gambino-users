'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

const STATUS_STYLES = {
  active:       'border-emerald-600/30 text-emerald-300 bg-emerald-500/15 dot-emerald',
  inactive:     'border-gray-600/30 text-gray-300 bg-gray-500/15 dot-gray',
  maintenance:  'border-amber-600/30 text-amber-300 bg-amber-500/15 dot-amber',
};

const dotClass = (s) =>
  s === 'active' ? 'bg-emerald-400' :
  s === 'maintenance' ? 'bg-amber-400' : 'bg-gray-400';

function StatusBadge({ status = 'inactive' }) {
  const s = (status || '').toLowerCase();
  const cls = STATUS_STYLES[s] || STATUS_STYLES.inactive;
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass(s)}`} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

export const MachineDetailModal = ({ 
  isOpen, 
  onClose, 
  machine, 
  onUpdate,
  onGenerateToken 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [currentMachine, setCurrentMachine] = useState(machine);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Update currentMachine when machine prop changes
  useEffect(() => {
    setCurrentMachine(machine);
  }, [machine]);

  // Initialize form data with proper defaults
  useEffect(() => {
    if (currentMachine) {
      setFormData({
        machineId: currentMachine.machineId || '',
        name: currentMachine.name || '',
        location: currentMachine.location || '',
        gameType: currentMachine.gameType || 'slot',
        status: currentMachine.status || 'inactive',
        serialNumber: currentMachine.serialNumber || '',
        hubId: currentMachine.hubId || '',
      });
    } else {
      setFormData({
        machineId: '',
        name: '',
        location: '',
        gameType: 'slot',
        status: 'inactive',
        serialNumber: '',
        hubId: '',
      });
    }
  }, [currentMachine]);

  const handleSave = async () => {
    if (!currentMachine?._id) return;

    setSaving(true);
    try {
      const response = await api.put(`/api/machines/${currentMachine._id}`, formData);
      console.log('Save response:', response.data);
      
      if (response.data.success) {
        const updatedMachine = response.data.machine;
        setCurrentMachine(updatedMachine);
        
        if (onUpdate) {
          onUpdate(updatedMachine);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update machine:', error);
      alert('Failed to update machine: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!currentMachine?.machineId) return;

    try {
      console.log('Generating token for machine:', currentMachine.machineId);
      const response = await api.post(`/api/machines/${currentMachine.machineId}/generate-token`);
      
      console.log('Generate token response:', response.data);
      
      if (response.data.success && response.data.token) {
        setGeneratedToken(response.data.token);
        setShowToken(true);
        setTokenCopied(false);
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert('Failed to generate token: ' + (error.response?.data?.error || error.message));
    }
  };

  const copyToken = async () => {
    if (generatedToken) {
      try {
        await navigator.clipboard.writeText(generatedToken);
        setTokenCopied(true);
        setTimeout(() => setTokenCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
        // Fallback: select the text
        const tokenElement = document.getElementById('generated-token');
        if (tokenElement) {
          tokenElement.select();
        }
      }
    }
  };

  const handleGenerateSerial = async () => {
    if (!currentMachine?.machineId) return;

    try {
      console.log('Generating serial for machine:', currentMachine.machineId);
      const response = await api.post(`/api/machines/${currentMachine.machineId}/generate-serial`);
      
      console.log('Generate serial response:', response.data);
      
      if (response.data.success) {
        const newSerialNumber = response.data.serialNumber;
        
        const updatedMachine = {
          ...currentMachine,
          serialNumber: newSerialNumber,
          serialGeneratedAt: new Date().toISOString()
        };
        
        setCurrentMachine(updatedMachine);
        
        if (isEditing) {
          setFormData(prev => ({...prev, serialNumber: newSerialNumber}));
        }
        
        if (onUpdate) {
          onUpdate(updatedMachine);
        }
      }
    } catch (error) {
      console.error('Failed to generate serial:', error);
      alert('Failed to generate serial: ' + (error.response?.data?.error || error.message));
    }
  };

  if (!isOpen || !currentMachine) return null;

  const isEdgeDevice = currentMachine.gameType === 'edge' || currentMachine.machineId.startsWith('pi-') || currentMachine.machineId.includes('gambino-pi');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-3xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Machine Details</h2>
            <p className="text-gray-400 mt-1">{currentMachine.machineId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Token Display Section */}
        {showToken && generatedToken && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-purple-400 font-semibold">Generated Machine Token</h3>
              <button
                onClick={() => setShowToken(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-900/50 rounded p-3 mb-3">
              <textarea
                id="generated-token"
                value={generatedToken}
                readOnly
                className="w-full bg-transparent text-white font-mono text-sm resize-none border-none focus:outline-none"
                rows={4}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Copy this token to your Pi configuration</span>
              <button
                onClick={copyToken}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tokenCopied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {tokenCopied ? 'Copied!' : 'Copy Token'}
              </button>
            </div>
          </div>
        )}

        {/* Machine Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Machine ID</label>
            <div className="text-white font-mono mt-1">{currentMachine.machineId}</div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Type</label>
            {isEditing ? (
              <select
                value={formData.gameType}
                onChange={(e) => setFormData({...formData, gameType: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white mt-1"
              >
                <option value="slot">Slot Machine</option>
                <option value="video_poker">Video Poker</option>
                <option value="edge">Pi Edge Device</option>
              </select>
            ) : (
              <div className="text-white mt-1">{currentMachine.gameType || 'slot'}</div>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white mt-1"
              />
            ) : (
              <div className="text-white mt-1">{currentMachine.name || '—'}</div>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Location</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white mt-1"
              />
            ) : (
              <div className="text-white mt-1">{currentMachine.location || '—'}</div>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Serial Number</label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white mt-1"
                />
                {!formData.serialNumber && (
                  <button
                    onClick={handleGenerateSerial}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Generate Serial
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-white font-mono text-sm">
                  {currentMachine.serialNumber || '—'}
                </span>
                {!currentMachine.serialNumber && (
                  <button
                    onClick={handleGenerateSerial}
                    className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Generate
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            ) : (
              <div className="mt-1">
                <StatusBadge status={currentMachine.status} />
              </div>
            )}
          </div>
        </div>

        {/* Hub ID for Edge Devices */}
        {isEdgeDevice && (
          <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Hub ID</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.hubId}
                onChange={(e) => setFormData({...formData, hubId: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white mt-1"
                placeholder="Enter Hub ID for this edge device"
              />
            ) : (
              <div className="text-white font-mono mt-1">{currentMachine.hubId || '—'}</div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Created</label>
            <div className="text-white mt-1 text-sm">
              {currentMachine.createdAt ? new Date(currentMachine.createdAt).toLocaleString() : '—'}
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Last Seen</label>
            <div className="text-white mt-1 text-sm">
              {currentMachine.lastSeen ? new Date(currentMachine.lastSeen).toLocaleString() : '—'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Edit Machine
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      machineId: currentMachine.machineId || '',
                      name: currentMachine.name || '',
                      location: currentMachine.location || '',
                      gameType: currentMachine.gameType || 'slot',
                      status: currentMachine.status || 'inactive',
                      serialNumber: currentMachine.serialNumber || '',
                      hubId: currentMachine.hubId || '',
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {isEdgeDevice && (
              <button
                onClick={handleGenerateToken}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Generate Token
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};