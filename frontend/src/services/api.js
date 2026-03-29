import axios from 'axios';

// Base URL from .env.local (falls back to localhost in dev)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Axios instance — pre-configured with base URL.
 * Auth token is auto-attached via request interceptor.
 */
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trackflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: Handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('trackflow_token');
      localStorage.removeItem('trackflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
