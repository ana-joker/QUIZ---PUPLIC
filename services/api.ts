import axios from 'axios';

// Create an Axios instance that will be used for all API calls
const api = axios.create({
  // Rely solely on the environment variable set in Vercel.
  // Vite replaces `import.meta.env.VITE_BACKEND_API_URL` with the actual URL during the build process.
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
});

// This function retrieves auth details from localStorage.
// It's assumed that the AuthContext saves these values to localStorage upon login/state change.
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const deviceId = localStorage.getItem('deviceId');
  
  const headers: { [key: string]: string } = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (deviceId) {
    headers['x-device-id'] = deviceId;
  }
  return headers;
};

// Request Interceptor: This function runs before each request is sent.
// It dynamically adds the latest auth headers to the request.
api.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    // Merge the auth headers into the request's headers
    config.headers = { ...config.headers, ...authHeaders };
    return config;
  },
  (error) => {
    // Handle any request errors
    return Promise.reject(error);
  }
);

export default api;