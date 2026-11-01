import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Login } from './Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  onRedirectToAllowed?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onRedirectToAllowed,
}) => {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-[#D81A28] border border-red-200 mb-4 shadow-xs">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Role Access Restricted
        </h2>
        <p className="mt-2 text-xs text-slate-600 max-w-md">
          Your current authenticated profile (<strong>{currentUser.role}</strong> - {currentUser.name}) does not have permission to access this module.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
          <span>Required Role Clearance:</span>
          <span className="font-bold text-slate-900">{allowedRoles.join(' or ')}</span>
        </div>
        {onRedirectToAllowed && (
          <button
            onClick={onRedirectToAllowed}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#D81A28] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#B91220] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Your Dashboard</span>
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
