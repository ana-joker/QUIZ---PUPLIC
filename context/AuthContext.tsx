import { create } from 'zustand';
import { User, AuthState as AuthStateType } from '../types'; // Import User and AuthState from types.ts

interface AuthState extends AuthStateType {
  isAuthenticated: boolean;
  // دوال تحكم
  init: () => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  fetchMe: () => Promise<void>;
  // دوال مساعدة
  isTeacher: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isPaid: boolean;
  acceptInvite: (inviteToken: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  token: undefined,
  deviceId: localStorage.getItem('qt_deviceId') || '', // Read deviceId from localStorage
  isAuthenticated: false,

  init: () => {
    const token = localStorage.getItem('qt_token') || undefined;
    const userJson = localStorage.getItem('qt_user');
    let user: User | undefined = undefined;
    if (userJson) {
      try {
        user = JSON.parse(userJson);
      } catch (error) {
        user = undefined;
      }
    }
    set({ user, token, isAuthenticated: !!(token && user) });
  },

  login: (user, token) => {
    localStorage.setItem('qt_token', token);
    localStorage.setItem('qt_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('qt_token');
    localStorage.removeItem('qt_user');
    set({ user: undefined, token: undefined, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('qt_user', JSON.stringify(user));
    set({ user });
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
        localStorage.setItem('qt_user', JSON.stringify(data.user));
      } else if (res.status === 401) {
        get().logout();
      }
    } catch {
      // تجاهل الخطأ
    }
  },

  get isTeacher() {
    return get().user?.role === 'teacher';
  },
  get isAdmin() {
    return get().user?.role === 'admin';
  },
  get isOwner() {
    return get().user?.role === 'owner';
  },
  get isPaid() {
    return get().user?.plan === 'paid';
  },

  acceptInvite: async (inviteToken: string) => {
    const { token, fetchMe } = get();
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/invites/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: inviteToken }),
      });
      if (res.ok) {
        await fetchMe(); // Refresh user data after successful invite acceptance
        return true;
      } else {
        // Handle error, e.g., invite not found or expired
        console.error('Failed to accept invite', await res.json());
        return false;
      }
    } catch (error) {
      console.error('Error accepting invite', error);
      return false;
    }
  },
}));

// Initialize the store on application load
useAuthStore.getState().init();