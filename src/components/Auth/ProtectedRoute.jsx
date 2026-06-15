// ============================================================
// ProtectedRoute — Auth gate + optional role-based access guard
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { status, user } = useAuth();

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
