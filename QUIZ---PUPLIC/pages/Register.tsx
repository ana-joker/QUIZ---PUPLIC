// src/pages/Register.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom"; // 💡 AZIZ: استيراد useNavigate
import { motion } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const Register = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate(); // 💡 AZIZ: استخدام useNavigate
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }
    try {
      await register(form.name, form.email, form.password, deviceId as string);
      navigate('/dashboard'); // 💡 AZIZ: التوجيه بعد التسجيل الناجح
    } catch (err: any) {
      console.error("Registration Failed:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
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

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/google-login`, {
        idToken: credentialResponse.credential,
        deviceId: deviceId
      });
      
      const data = res.data;

      if (res.status === 200 && data.token) { // 💡 AZIZ: التحقق من status axios
        login(data.token, data.user, deviceId as string);
        navigate('/dashboard'); // 💡 AZIZ: التوجيه بعد تسجيل الدخول بـ Google
      } else {
        throw new Error(data.message || 'No token received after Google registration.');
      }
    } catch (err: any) {
      console.error("Google Registration Failed:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Google registration failed. Please try again.';
      setError(errorMessage);
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
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-400">Create Your Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="w-full p-3 rounded-md bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
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
            placeholder="Password"
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
            {loading ? 'Registering...' : 'Register'}
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
            text="continue_with"
            width="300"
          />
        </div>

        <p className="text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;
