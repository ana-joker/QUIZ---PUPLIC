import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type User = {
  _id: string;
  email: string;
  name?: string;
  type: 'student' | 'teacher' | 'admin' | 'owner';
  plan: 'free' | 'paid';
};

export type UsageToday = {
  usedGeneral: number;
  remainingGeneral: number;
  capGeneral: number;
  usedCourse?: number;
  remainingCourse?: number;
  capCourse?: number;
};

interface AuthStoreType {
  deviceId: string;
  token: string | null;
  user: User | null;
  usageToday: UsageToday | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setUsageToday: (usage: UsageToday | null) => void;
  logout: () => void;
}

const DEVICE_KEY = 'qt_deviceId';
const TOKEN_KEY = 'qt_token';
const USER_KEY = 'qt_user';

const AuthStoreContext = createContext<AuthStoreType | undefined>(undefined);

export const useAuthStore = () => {
  const ctx = useContext(AuthStoreContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthStoreProvider');
  return ctx;
};

export const AuthStoreProvider = ({ children }: { children: ReactNode }) => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usageToday, setUsageToday] = useState<UsageToday | null>(null);

  // Initialize deviceId on first mount
  useEffect(() => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    setDeviceId(id);
  }, []);

  // Load token/user from localStorage
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    setToken(t);
    const u = localStorage.getItem(USER_KEY);
    setUser(u ? JSON.parse(u) : null);
  }, []);

  // Persist token/user
  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);
  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const logout = () => {
    setToken(null);
    setUser(null);
    setUsageToday(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthStoreContext.Provider value={{ deviceId, token, user, usageToday, setToken, setUser, setUsageToday, logout }}>
      {children}
    </AuthStoreContext.Provider>
  );
};
