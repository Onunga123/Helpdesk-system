import axios from 'axios';
import API_URL from '../config/api';

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────
// Automatically attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const { token } = JSON.parse(user);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────
// Handle token expiry globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthLoginRequest = (error.config?.url || "").includes("/auth/login");
    if (error.response?.status === 401 && !isAuthLoginRequest) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;