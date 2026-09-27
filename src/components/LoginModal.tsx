import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  KeyRound, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { DEMO_USER_PROFILES } from '../lib/mockData';

interface LoginModalProps {
  initialPortalName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  initialPortalName,
  onClose,
  onSuccess
}) => {
  const { loginAsRoleDemo, loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide valid official credentials.');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await loginWithCredentials(email, password);
    setLoading(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Authentication rejected by security provider.');
    }
  };

  const handleRoleQuickDemo = async (roleKey: keyof typeof DEMO_USER_PROFILES) => {
    setLoading(true);
    await loginAsRoleDemo(roleKey);
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Official Staff Authentication</h2>
              <p className="text-xs text-slate-400">
                {initialPortalName ? `Target: ${initialPortalName}` : 'Role retrieved securely from database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Security Notice: Roles are NEVER chosen manually */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Zero-Trust Authorization:</strong> Users cannot select a role during sign-in. Your verified clearance level is queried from backend Firestore records upon credential validation.
          </span>
        </div>

        {/* Standard Email / Password Form */}
        <form onSubmit={handleStandardLogin} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Official Email ID
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. driver.eknath@msrtc.maharashtra.gov.in"
              className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Security Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide cursor-pointer transition shadow-lg shadow-red-950"
          >
            {loading ? 'Authenticating...' : 'Sign In via Firebase Auth'}
          </button>
        </form>

        {/* Authorized Demo Credentials for Evaluation / Exhibition */}
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Evaluation One-Click Demo Profiles</span>
            <span className="text-[10px] text-amber-400 font-mono">AUTHORIZED ONLY</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleRoleQuickDemo('driver-demo')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer"
            >
              <div className="font-bold text-white text-xs">Driver Portal</div>
              <div className="text-[10px] text-slate-400">Eknath Shinde (#402)</div>
            </button>

            <button
              onClick={() => handleRoleQuickDemo('depot-demo')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer"
            >
              <div className="font-bold text-white text-xs">Depot Manager</div>
              <div className="text-[10px] text-slate-400">Shivajinagar Depot</div>
            </button>

            <button
              onClick={() => handleRoleQuickDemo('authority-demo')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer"
            >
              <div className="font-bold text-white text-xs">Authority Portal</div>
              <div className="text-[10px] text-slate-400">State Commissioner</div>
            </button>

            <button
              onClick={() => handleRoleQuickDemo('analyst-demo')}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition cursor-pointer"
            >
              <div className="font-bold text-white text-xs">Analytics Portal</div>
              <div className="text-[10px] text-slate-400">Read-Only Analyst</div>
            </button>

            <button
              onClick={() => handleRoleQuickDemo('admin-demo')}
              className="col-span-2 p-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-left transition cursor-pointer"
            >
              <div className="font-bold text-red-300 text-xs">Super Admin Portal</div>
              <div className="text-[10px] text-slate-400">Full Fleet, Security & System Administration</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
