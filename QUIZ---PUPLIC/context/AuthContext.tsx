import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'; // 💡 AZIZ: استخدام axios

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
      // 💡 AZIZ: استخدام axios وإرسال deviceId في الهيدر
      axios.get(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'x-device-id': deviceId // 💡 AZIZ: إرسال deviceId هنا
        },
      })
        .then((res) => {
          if (res.status === 200) { // 💡 AZIZ: التحقق من status axios
            setUser(res.data); // axios يضع الـ data مباشرة في .data
          } else {
            logout(); // Token might be invalid or another error occurred
          }
        })
        .catch((err) => {
            console.error("Failed to fetch user data:", err);
            logout(); // Token might be invalid or another error occurred
        });
    }
  }, [token, deviceId]); // 💡 AZIZ: إضافة deviceId كـ dependency

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
    // 💡 AZIZ: استخدام axios وإرسال deviceId في الـ body
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/register`, {
      name, email, password, deviceId
    });
    const data = res.data;
    if (res.status === 201 && data.token) { // 💡 AZIZ: التحقق من status axios
      login(data.token, data.user, deviceId);
    } else {
      throw new Error(data.message || 'No token received after registration.');
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

