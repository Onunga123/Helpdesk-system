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
        return config;
      }
    }

    const applicantToken = localStorage.getItem('applicantToken');
    if (applicantToken) {
      config.headers.Authorization = `Bearer ${applicantToken}`;
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
    const requestUrl = error.config?.url || "";
    const isAuthLoginRequest = requestUrl.includes("/auth/login");
    const isApplicantLoginRequest = requestUrl.includes("/recruitment/applicants/login");
    const isApplicantSession = Boolean(localStorage.getItem("applicantToken"));

    if (error.response?.status === 401 && !isAuthLoginRequest && !isApplicantLoginRequest) {
      if (isApplicantSession) {
        localStorage.removeItem("applicantToken");
        localStorage.removeItem("applicantId");
        window.location.href = "/recruitment/auth";
      } else {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;