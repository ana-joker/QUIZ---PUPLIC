import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types"; // Import the User interface
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  token: string | null;
  deviceId: string | null;
  login: (jwt: string, userData: User, deviceId: string) => void;
  logout: () => void;
  register: (name: string, email: string, password: string, deviceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [deviceId, setDeviceId] = useState<string | null>(() => {
    let storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem("deviceId", storedDeviceId);
    }
    return storedDeviceId;
  });

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: User | { message: string }) => { // Can be User or an error object
          if ('id' in data) { // Check for a property that exists on User but not the error
            setUser(data);
          } else {
            logout(); // Token might be invalid or another error occurred
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (jwt: string, userData: User, deviceId: string) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("deviceId", deviceId);
    setToken(jwt);
    setDeviceId(deviceId);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("deviceId");
    setToken(null);
    setDeviceId(null);
    setUser(null);
  };

  const register = async (name: string, email: string, password: string, deviceId: string) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, deviceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed.');
    }
    if (data.token) {
      login(data.token, data.user, deviceId);
    } else {
      throw new Error('No token received after registration.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, deviceId, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
