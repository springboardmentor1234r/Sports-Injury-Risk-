import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Verifying Credentials & Permissions...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Redirect to Login
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but unauthorized role -> Render 403 Forbidden Page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const getRolePath = (role) => {
      switch (role) {
        case 'Athlete':
          return '/dashboard/athlete';
        case 'Coach':
          return '/dashboard/coach';
        case 'Physiotherapist':
          return '/dashboard/physio';
        case 'Sports Scientist':
          return '/dashboard/sports-scientist';
        case 'Administrator':
          return '/dashboard/admin';
        default:
          return '/dashboard/athlete';
      }
    };

    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 p-8 rounded-2xl shadow-2xl shadow-rose-950/30 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded">
              HTTP 403 FORBIDDEN
            </span>
            <h2 className="text-xl font-extrabold text-white mt-2">Unauthorized Access</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your logged-in account role is <span className="font-semibold text-rose-400">'{user.role}'</span>.
              Access to this dashboard is strictly restricted to <span className="font-semibold text-slate-200">[{allowedRoles.join(', ')}]</span>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate(getRolePath(user.role), { replace: true })}
              className="w-full py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go to My Authorized ({user.role}) Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
