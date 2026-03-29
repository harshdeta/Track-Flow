import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, loading, error, setError, user } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  // Already logged in → redirect to their dashboard
  if (user) {
    const routes = { admin: '/admin', manager: '/manager', employee: '/employee' };
    return <Navigate to={routes[user.role] || '/employee'} replace />;
  }

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    login(form.email, form.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to TrackFlow</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Demo hint */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">Demo Accounts</p>
            <div className="space-y-0.5 text-xs text-blue-600">
              <p>👑 admin@trackflow.com / admin1234</p>
              <p>👔 sarah@trackflow.com / manager1234</p>
              <p>👤 bob@trackflow.com / employee1234</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email Address</label>
            <input name="email" type="email" value={form.email} onChange={change}
              className="input" placeholder="you@company.com"
              autoComplete="email" required />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Password</label>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">Forgot password?</span>
            </div>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={change} className="input pr-10" placeholder="••••••••"
                autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
