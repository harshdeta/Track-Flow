import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

// ─── Role → Route map ─────────────────────────────────────────────────────────
const ROLE_ROUTES = { admin: '/admin', manager: '/manager', employee: '/employee' };

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('trackflow_user')); }
  catch { return null; }
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser]       = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const persist = (token, userData) => {
    localStorage.setItem('trackflow_token', token);
    localStorage.setItem('trackflow_user', JSON.stringify(userData));
    setUser(userData);
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.token, data.user);
      navigate(ROLE_ROUTES[data.user.role] || '/employee');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Signup ───────────────────────────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/signup', formData);
      persist(data.token, data.user);
      navigate('/admin');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('trackflow_token');
    localStorage.removeItem('trackflow_user');
    setUser(null);
    setError('');
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
