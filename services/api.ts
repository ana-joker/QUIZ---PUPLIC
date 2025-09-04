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
import { useAuthStore } from '../context/AuthStore';

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
    const { token, deviceId } = require('../context/AuthStore').useAuthStore.getState();
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
        try { require('../context/AuthStore').useAuthStore.getState().logout(); } catch {}
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
};

export const coursesApi = {
  joinCourse: (code: string) => api.post('/api/courses/join', { code }),
};
