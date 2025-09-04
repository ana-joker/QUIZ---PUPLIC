import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Device } from '../types';
import { useAuthStore } from '../context/AuthContext';

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceRemoved: () => void;
}

const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  isOpen, onClose, onDeviceRemoved
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { deviceId: currentDeviceId } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ devices: Device[] }>('/api/auth/devices');
      setDevices(res.data.devices);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch devices.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceIdToRemove: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/auth/devices/${deviceIdToRemove}`);
      onDeviceRemoved(); // Notify parent component
      onClose(); // Close modal after successful removal
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove device.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Device Limit Reached</h2>
        <p className="text-slate-300 mb-4">
          You have reached the maximum number of active devices. Please remove one device to log in.
        </p>

        {loading && <p className="text-slate-400">Loading devices...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && devices.length > 0 && (
          <ul className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
            {devices.map((device) => (
              <li key={device.deviceId} className="flex justify-between items-center bg-slate-700 p-3 rounded-md">
                <div>
                  <p className="text-white font-medium">{device.deviceName || 'Unknown Device'}</p>
                  <p className="text-sm text-slate-400">Last seen: {new Date(device.lastLogin).toLocaleString()}</p>
                  {device.deviceId === currentDeviceId && (
                    <span className="text-xs text-purple-400"> (This device)</span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveDevice(device.deviceId)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
                  disabled={loading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && devices.length === 0 && !error && (
          <p className="text-slate-400">No devices found.</p>
        )}

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-2 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceManagementModal;
