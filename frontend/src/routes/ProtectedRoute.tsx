import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL, type UserRole } from '../api/api';
import { Shield, Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-1">
            Required role: <span className="font-bold text-slate-700">{roles.map(r => ROLE_LABEL[r]).join(' or ')}</span>
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Your role: <span className="font-semibold text-slate-600">{ROLE_LABEL[currentUser.role]}</span>
          </p>
          <a href="/panel" className="inline-block bg-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-800 transition">
            Back to panel
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
