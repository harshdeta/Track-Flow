import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { countries } from '../data/dummyData';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Signup() {
  const { signup, loading, error, setError, user } = useAuth();
  const [form, setForm] = useState({
    companyName: '', country: '', baseCurrency: 'INR',
    name: '', email: '', password: '', confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Already logged in → redirect
  if (user) return <Navigate to="/admin" replace />;

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setValidationErrors((er) => ({ ...er, [e.target.name]: '' }));
    if (error) setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required.';
    if (!form.country)            e.country     = 'Country is required.';
    if (!form.name.trim())        e.name        = 'Your name is required.';
    if (!form.email.includes('@'))e.email       = 'Enter a valid email.';
    if (form.password.length < 6) e.password    = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setValidationErrors(errs); return; }
    signup({
      companyName:  form.companyName,
      country:      form.country,
      baseCurrency: form.baseCurrency,
      name:         form.name,
      email:        form.email,
      password:     form.password,
    });
  };

  const FieldError = ({ name }) =>
    validationErrors[name] ? (
      <p className="text-xs text-red-500 mt-1">{validationErrors[name]}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your company on TrackFlow</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          {/* API Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="label">Company Name <span className="text-red-500">*</span></label>
            <input name="companyName" value={form.companyName} onChange={change}
              className="input" placeholder="Acme Corporation" />
            <FieldError name="companyName" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Country */}
            <div>
              <label className="label">Country <span className="text-red-500">*</span></label>
              <select name="country" value={form.country} onChange={change} className="input">
                <option value="">Select country</option>
                {countries.map((c) => <option key={c}>{c}</option>)}
              </select>
              <FieldError name="country" />
            </div>
            {/* Base Currency */}
            <div>
              <label className="label">Base Currency</label>
              <select name="baseCurrency" value={form.baseCurrency} onChange={change} className="input">
                {['INR','USD','EUR','GBP','AED','SGD'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Admin Name */}
          <div>
            <label className="label">Your Name (Admin) <span className="text-red-500">*</span></label>
            <input name="name" value={form.name} onChange={change}
              className="input" placeholder="John Smith" />
            <FieldError name="name" />
          </div>

          {/* Email */}
          <div>
            <label className="label">Email Address <span className="text-red-500">*</span></label>
            <input name="email" type="email" value={form.email} onChange={change}
              className="input" placeholder="admin@company.com" />
            <FieldError name="email" />
          </div>

          {/* Password */}
          <div>
            <label className="label">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={change} className="input pr-10" placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError name="password" />
          </div>

          {/* Confirm */}
          <div>
            <label className="label">Confirm Password <span className="text-red-500">*</span></label>
            <input name="confirm" type="password" value={form.confirm} onChange={change}
              className="input" placeholder="Repeat password" />
            <FieldError name="confirm" />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
