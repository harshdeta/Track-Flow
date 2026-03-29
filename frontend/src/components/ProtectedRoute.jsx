import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — wraps a route so only authenticated users can access it.
 * If a `role` prop is provided, also checks the user's role matches.
 *
 * Usage:
 *   <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('trackflow_token');
  const user  = (() => {
    try { return JSON.parse(localStorage.getItem('trackflow_user')); }
    catch { return null; }
  })();

  // Not logged in → go to login
  if (!token || !user) return <Navigate to="/login" replace />;

  // Wrong role → go to login
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}
