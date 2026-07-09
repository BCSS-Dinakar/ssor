import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RoleProtectedRoute({ allowedRoles }) {
  const { auth, loading } = useAuth();

  if (loading) {
    return null; // The AuthContext provider already shows a loading spinner
  }

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(auth.role)) {
    // If user tries to access a route they don't have permission for, redirect to portal root
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}

export default RoleProtectedRoute;
