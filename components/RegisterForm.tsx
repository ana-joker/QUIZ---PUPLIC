import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import { api } from '../services/api';
import DeviceManagementModal from './DeviceManagementModal'; // Import the new modal

// This should be moved to a shared utils file
const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  let browserName = "Unknown Browser";
  let osName = "Unknown OS";
  if (ua.indexOf("Win") !== -1) osName = "Windows";
  if (ua.indexOf("Mac") !== -1) osName = "MacOS";
  if (ua.indexOf("Linux") !== -1) osName = "Linux";
  if (ua.indexOf("Android") !== -1) osName = "Android";
  if (ua.indexOf("like Mac") !== -1) osName = "iOS";
  if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1) browserName = "Chrome";
  else if (ua.indexOf("Firefox") !== -1) browserName = "Firefox";
  else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browserName = "Safari";
  else if (ua.indexOf("Edg") !== -1) browserName = "Edge";
  return `${browserName} on ${osName}`;
};

export const Register = () => {
  const { login, deviceId } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeviceManagementModal, setShowDeviceManagementModal] = useState(false); // State for modal

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name || undefined,
        email: form.email,
        password: form.password,
        deviceId: deviceId,
        deviceName: getDeviceName(),
      });
      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        
        navigate('/dashboard');
      } else {
        throw new Error(res.data.message || 'No token received after registration.');
      }
    } catch (err: any) {
      console.error("Registration Failed:", err);
      if (err.response?.status === 403 && err.response?.data?.message === 'Device limit reached') {
        setShowDeviceManagementModal(true);
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/google', {
        idToken: credentialResponse.credential,
        deviceId: deviceId,
        deviceName: getDeviceName(),
      });

      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      } else {
        throw new Error(res.data.message || 'No token received after Google login.');
      }
    } catch (err: any) {
      console.error("Google Login Failed:", err);
      if (err.response?.status === 403 && err.response?.data?.message === 'Device limit reached') {
        setShowDeviceManagementModal(true);
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Google login failed. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceRemoved = () => {
    setShowDeviceManagementModal(false);
    // Optionally re-attempt registration or show a success message
    // For now, just close the modal and let the user try again
  };

  return (
    <>
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-400">Create Your Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
           <input
            type="text"
            placeholder="Name (Optional)"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password (8+ characters, a number, a symbol)"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-slate-600"></div>
          <span className="mx-4 text-slate-400">OR</span>
          <div className="flex-grow border-t border-slate-600"></div>
        </div>

        <div className={`w-full flex justify-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => {
              console.log("Registration Failed");
              setError('Google registration failed. Please try again.');
            }}
            theme="filled_blue"
            size="large"
            text="signup_with"
            width="300"
          />
        </div>

        <DeviceManagementModal
          isOpen={showDeviceManagementModal}
          onClose={() => setShowDeviceManagementModal(false)}
          onDeviceRemoved={handleDeviceRemoved}
        />
    </>
  );
};
