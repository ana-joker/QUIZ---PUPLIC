import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // 💡 AZIZ: استخدام axios

const ManageDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token, logout, deviceId: currentDeviceId } = useAuth(); // 💡 AZIZ: جلب currentDeviceId
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/me`, { // 💡 AZIZ: استخدام axios
          headers: {
            Authorization: `Bearer ${token}`,
            'x-device-id': currentDeviceId // 💡 AZIZ: إرسال deviceId هنا
          },
        });
        const data = response.data; // axios يضع الـ data مباشرة في .data
        if (response.status === 200) { // 💡 AZIZ: التحقق من status axios
          setDevices(data.devices || []);
        } else {
          setError(data.message || 'Failed to fetch devices.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching devices.');
      } finally {
        setLoading(false);
      }
    };

    if (token && currentDeviceId) { // 💡 AZIZ: التأكد من وجود currentDeviceId
      fetchDevices();
    }
  }, [token, currentDeviceId]); // 💡 AZIZ: إضافة currentDeviceId كـ dependency

  const handleRemoveDevice = async (deviceIdToRemove: string) => { // 💡 AZIZ: تغيير اسم المتغير
    try {
      const response = await axios.delete(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/devices/${deviceIdToRemove}`, { // 💡 AZIZ: استخدام axios
        headers: {
          Authorization: `Bearer ${token}`,
          'x-device-id': currentDeviceId // 💡 AZIZ: إرسال deviceId هنا
        },
      });
      const data = response.data;
      if (response.status === 200) { // 💡 AZIZ: التحقق من status axios
        setDevices(devices.filter((device: any) => device.deviceId !== deviceIdToRemove)); // 💡 AZIZ: استخدام deviceId
        if (data.logout) { // إذا كان الـ Backend يطلب تسجيل الخروج
            logout();
            navigate('/login');
        }
      } else {
        alert(data.message || 'Failed to remove device.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'An error occurred while removing the device.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-purple-600">Manage Devices</h1>
      {devices.length === 0 ? (
          <p className="text-slate-400">No devices found.</p>
      ) : (
        <ul className="space-y-4">
            {devices.map((device: any) => ( // 💡 AZIZ: تحديد نوع device كـ any
            <li key={device.deviceId} className="flex items-center justify-between p-4 border rounded-lg bg-slate-800 border-slate-700">
                <div>
                <p className="font-semibold">{device.deviceName || `Device ID: ${device.deviceId}`}</p>
                <p className="text-sm text-gray-400">Last login: {new Date(device.lastLogin).toLocaleString()}</p>
                </div>
                {device.deviceId === currentDeviceId ? (
                    <span className="text-green-500 text-sm">Current Device</span>
                ) : (
                    <button
                    onClick={() => handleRemoveDevice(device.deviceId)}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                    Remove
                    </button>
                )}
            </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default ManageDevices;
