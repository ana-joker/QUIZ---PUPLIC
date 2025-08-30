import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Register = () => {
  const { register } = useAuth(); // Assuming register function exists in AuthContext
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      // Placeholder for API call
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.token) {
        register(data.token, data); // Assuming register also logs in the user
      } else {
        console.error("Registration failed:", data.message);
      }
    } catch (error) {
      console.error("An error occurred during registration:", error);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    try {
      // Placeholder for API call
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/google-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.token) {
        register(data.token, data);
      } else {
        console.error("Google registration failed:", data.message);
      }
    } catch (error) {
      console.error("An error occurred during Google registration:", error);
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
          >
            Register
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-slate-600"></div>
          <span className="mx-4 text-slate-400">OR</span>
          <div className="flex-grow border-t border-slate-600"></div>
        </div>

        <div className="w-full">
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => console.log("Registration Failed")}
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