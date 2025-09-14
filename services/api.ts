// --- AZIZ: Guest Usage Logic ---
const GUEST_QUOTA = 10;
const GUEST_KEY = 'qt_guest_usage';
const GUEST_IP_KEY = 'qt_guest_ip';

export function getGuestUsage() {
  let usage = 0;
  try {
    usage = parseInt(localStorage.getItem(GUEST_KEY) || '0', 10);
  } catch {}
  return usage;
}

export function incGuestUsage(count = 1) {
  let usage = getGuestUsage() + count;
  localStorage.setItem(GUEST_KEY, usage.toString());
}

export function resetGuestUsage() {
  localStorage.setItem(GUEST_KEY, '0');
}

export function getGuestIp() {
  return localStorage.getItem(GUEST_IP_KEY) || '';
}

export function setGuestIp(ip: string) {
  localStorage.setItem(GUEST_IP_KEY, ip);
}

export async function fetchGuestIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    setGuestIp(data.ip);
    return data.ip;
  } catch {
    return '';
  }
}

export function checkGuestQuota(requested: number = 1) {
  const usage = getGuestUsage();
  if (usage + requested > GUEST_QUOTA) {
    if (addToast) addToast('لقد وصلت الحد اليومي للضيف (10 أسئلة)', 'warning');
    return false;
  }
  return true;
}
import axios from 'axios';
import { useAuthStore } from '../context/AuthContext';

// Toast function setter
let addToast = null;
export const setToastFunction = (toastFn) => { addToast = toastFn; };

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
  withCredentials: false
});

// Request Interceptor: add token & deviceId from AuthStore
api.interceptors.request.use(config => {
  try {
    // Use AuthStore directly (not hook)
    const { token, deviceId } = require('../context/AuthContext').useAuthStore.getState();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (deviceId) config.headers['X-Device-Id'] = deviceId;
  } catch {}
  // fallback: try localStorage
  if (!config.headers['X-Device-Id']) {
    const deviceId = localStorage.getItem('qt_deviceId');
    if (deviceId) config.headers['X-Device-Id'] = deviceId;
  }
  return config;
});

// Response Interceptor: handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // Unauthorized: logout
        try { require('../context/AuthContext').useAuthStore.getState().logout(); } catch {}
        if (addToast) addToast('انتهت الجلسة، يرجى تسجيل الدخول مجددًا', 'error');
      } else if (status === 402) {
        // Quota exceeded
        if (addToast) addToast(data.message || 'وصلت الحد اليومي', 'warning');
      } else if (status === 403) {
        // Device limit or forbidden
        if (addToast) addToast(data.message || 'تم تجاوز حد الأجهزة', 'error');
      } else if (status === 400) {
        if (addToast) addToast(data.message || 'إعدادات غير صحيحة', 'error');
      } else if (status >= 500) {
        if (addToast) addToast('حدث خطأ في الخادم، حاول لاحقًا', 'error');
      }
    } else {
      if (addToast) addToast('Network error', 'error');
    }
    return Promise.reject(error);
  }
);

// API Functions
export const authApi = {
  login: (email: string, password: string, deviceName: string) => api.post('/api/auth/login', { email, password, deviceName }),
  register: (name: string, email: string, password: string, deviceName: string) => api.post('/api/auth/register', { name, email, password, deviceName }),
  loginWithCode: (code: string, deviceName: string) => api.post('/api/auth/login-with-code', { code, deviceName }),
  logout: () => api.post('/api/auth/logout'),
  changePassword: (oldPassword: string, newPassword: string) => api.post('/api/auth/change-password', { oldPassword, newPassword }),
  getDevices: () => api.get('/api/auth/devices'),
  removeDevice: (deviceId: string) => api.delete(`/api/auth/devices/${deviceId}`),
  refreshToken: () => api.post('/api/auth/refresh'),
};

export const userApi = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data: any) => api.put('/api/user/profile', data),
  getUsage: () => api.get('/api/user/usage'),
  getBillingHistory: () => api.get('/api/user/billing'),
  uploadPaymentReceipt: (file: File, plan: string) => {
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('plan', plan);
    return api.post('/api/user/billing/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  upgradePlan: (plan: string) => api.post('/api/user/upgrade', { plan }),
};

export const quizApi = {
  generateFromText: (settings: any, text: string) => api.post('/api/quiz/text', { settings, text }),
  generateFromPdf: (settings: any, pdfFile: File) => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('settings', JSON.stringify(settings));
    return api.post('/api/quiz/pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  generateFromMaterial: (settings: any, courseId: string, materialId: string) => api.post('/api/quiz/material', { settings, courseId, materialId }),
  getHistory: () => api.get('/api/quiz/history'),
  deleteQuiz: (quizId: string) => api.delete(`/api/quiz/${quizId}`),
};

export const coursesApi = {
  getMyCourses: () => api.get('/api/courses/my'),
  joinCourse: (code: string) => api.post('/api/courses/join', { code }),
  getCourseDetails: (courseId: string) => api.get(`/api/courses/${courseId}`),
  getMaterials: (courseId: string) => api.get(`/api/courses/${courseId}/materials`),
  createCourse: (data: any) => api.post('/api/courses', data),
  updateCourse: (courseId: string, data: any) => api.put(`/api/courses/${courseId}`, data),
  deleteCourse: (courseId: string) => api.delete(`/api/courses/${courseId}`),
};

export const adminApi = {
  getUsers: (page?: number, limit?: number) => api.get('/api/admin/users', { params: { page, limit } }),
  getUserDetails: (userId: string) => api.get(`/api/admin/users/${userId}`),
  updateUser: (userId: string, data: any) => api.put(`/api/admin/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete(`/api/admin/users/${userId}`),
  getStatistics: () => api.get('/api/admin/statistics'),
  getSystemLogs: (page?: number, limit?: number) => api.get('/api/admin/logs', { params: { page, limit } }),
};
