import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setDevices(data.devices || []);
        } else {
          setError(data.message || 'Failed to fetch devices.');
        }
      } catch (err) {
        setError('An error occurred while fetching devices.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDevices();
    }
  }, [token]);

  const handleRemoveDevice = async (deviceId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setDevices(devices.filter((device) => device.id !== deviceId));
        // If the current device was removed, the backend should have invalidated the token.
        // The user will be logged out automatically by the AuthProvider's effect.
        if (data.logout) {
            logout();
            navigate('/login');
        }
      } else {
        alert(data.message || 'Failed to remove device.');
      }
    } catch (err) {
      alert('An error occurred while removing the device.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Devices</h1>
      <ul className="space-y-4">
        {devices.map((device) => (
          <li key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">{device.deviceName || `Device ID: ${device.id}`}</p>
              <p className="text-sm text-gray-500">Last login: {new Date(device.lastLogin).toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleRemoveDevice(device.id)}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageDevices;
