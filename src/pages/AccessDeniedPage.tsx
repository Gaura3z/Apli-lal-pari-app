import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../types';

interface AccessDeniedPageProps {
  requiredRole?: UserRole;
  portalTitle?: string;
  onNavigateHome: () => void;
  onOpenLogin: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredRole,
  portalTitle = 'Protected Operational Portal',
  onNavigateHome,
  onOpenLogin
}) => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle red background glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-700/80 mx-auto flex items-center justify-center text-red-500 shadow-xl shadow-red-950">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-950 text-red-400 border border-red-800">
            HTTP 403 &bull; SECURITY CLEARANCE REQUIRED
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Access Denied
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            You do not possess the required clearance to access <span className="text-white font-semibold">{portalTitle}</span>.
          </p>
        </div>

        {/* Security Audit Details Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-2 font-mono">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Current User:</span>
            <span className="text-slate-300 font-bold">{userProfile ? userProfile.email : 'Unauthenticated Visitor'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Current Role:</span>
            <span className="text-amber-400 font-bold">{userProfile ? userProfile.role : 'PUBLIC_GUEST'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Required Role:</span>
            <span className="text-red-400 font-bold">{requiredRole || 'STAFF_AUTHORIZED'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Enforcement:</span>
            <span className="text-emerald-400">Zero-Trust Firestore Rules & Backend Auth</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Homepage
          </button>

          <button
            onClick={() => {
              logout();
              onOpenLogin();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-950 cursor-pointer transition"
          >
            <LogIn className="w-4 h-4" />
            Switch Account / Login
          </button>
        </div>
      </div>
    </div>
  );
};
