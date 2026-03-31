import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useDataContext } from '../../DataContext';
import { LockIcon } from 'lucide-react';

interface RequireAuthProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { user, loading: authLoading } = useAuth();
  const { profiles, loading: dataLoading } = useDataContext();
  const location = useLocation();

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    const to = adminOnly ? '/admin/login' : '/login';
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  const userProfile = profiles.find(p => p.id === user.uid);
  if (userProfile?.is_blocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-red-600 rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-red-600/20">
          <LockIcon size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Account Restricted</h1>
        <p className="text-gray-600 max-w-md mb-10 font-bold">Your access has been temporarily restricted by the administration.</p>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 max-w-md mb-10">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Reason</p>
          <p className="text-sm font-bold text-red-900 italic">"{userProfile.block_reason || 'Administrative restriction'}"</p>
        </div>
        <a href="mailto:hamtic.als@deped.gov.ph" className="text-sm font-black text-red-600 hover:underline uppercase tracking-widest">Contact Coordinator</a>
      </div>
    );
  }

  if (adminOnly && user.role?.role !== 'admin') {
    return <Navigate to="/enrollment" replace />;
  }

  return children;
}
