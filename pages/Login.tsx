import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.token) {
        login(data.token, data);
      } else {
        console.error("Login failed:", data.message);
      }
    } catch (error) {
      console.error("An error occurred during login:", error);
    }
  };

  const handleGoogle = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.token) {
        login(data.token, data);
      } else {
        console.error("Google login failed:", data.message);
      }
    } catch (error) {
      console.error("An error occurred during Google login:", error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Login</button>
      </form>

      <GoogleLogin
        onSuccess={handleGoogle}
        onError={() => console.log("Login Failed")}
      />
    </div>
  );
};

export default Login;
