import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  user: any; // You might want to replace 'any' with a proper user type
  token: string | null;
  login: (jwt: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.message) {
            setUser(data);
          } else {
            logout(); // Token might be invalid
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (jwt: string, userData: any) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
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
