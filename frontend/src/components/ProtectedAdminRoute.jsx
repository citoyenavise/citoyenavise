/**
 * ProtectedAdminRoute.jsx
 * Wrapper pour les routes protégées admin
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function ProtectedAdminRoute({ children }) {
  const user = useAuthStore(s => s.user);

  if (!user) {
    // Pas authentifié - rediriger vers login
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    // Authentifié mais pas admin - rediriger vers home
    return <Navigate to="/" replace />;
  }

  // Admin - laisser accéder
  return children;
}
