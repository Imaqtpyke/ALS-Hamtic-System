import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

interface RequireAuthProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login, preserving intended destination
    const to = adminOnly ? '/admin/login' : '/login';
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  if (adminOnly && user.role?.role !== 'admin') {
    // Logged-in non-admin attempting admin route: send to student area
    return <Navigate to="/enrollment" replace />;
  }

  return children;
}
