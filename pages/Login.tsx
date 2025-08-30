import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let currentDeviceId = localStorage.getItem('deviceId');
    if (!currentDeviceId) {
      currentDeviceId = uuidv4();
      localStorage.setItem('deviceId', currentDeviceId);
    }
    setDeviceId(currentDeviceId);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      if (data.token) {
        login(data.token, data.user, deviceId as string);
      } else {
        throw new Error('No token received after login.');
      }
    } catch (err: any) {
      console.error("Login Failed:", err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      if (!deviceId) {
        throw new Error('Device ID not generated. Please try again.');
      }

      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          deviceId: deviceId
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google login failed.');
      }

      if (data.token) {
        login(data.token, data.user, deviceId as string);
      } else {
        throw new Error('No token received after Google login.');
      }
    } catch (err: any) {
      console.error("Google Login Failed:", err);
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-50 p-4"
    >
      <div className="bg-slate-700 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-400">Welcome Back 👋</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
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
              console.log("Login Failed");
              setError('Google login failed. Please try again.');
            }}
            theme="filled_blue"
            size="large"
            text="continue_with"
            width="300"
          />
        </div>

        <p className="text-center text-slate-400 mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-purple-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;
