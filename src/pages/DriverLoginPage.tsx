import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { 
  Bus, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  IdCard,
  UserCheck,
  Radio
} from 'lucide-react';

interface DriverLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const DriverLoginPage: React.FC<DriverLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome
}) => {
  const { loginWithCredentials, loginAsRoleDemo, userProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAccessDeniedMsg(null);
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your driver badge and password.');
        setIsLoading(false);
        return;
      }

      // Check role
      if (userProfile && userProfile.role !== 'DRIVER' && userProfile.role !== 'SUPER_ADMIN') {
        setAccessDeniedMsg(`Access Denied: User role is ${userProfile.role}. Only authorized DRIVERS can enter the driver console.`);
        setIsLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDriverLogin = async (demoKey: 'driver-demo' | 'driver-demo-2' | 'depot-demo') => {
    setErrorMsg(null);
    setAccessDeniedMsg(null);
    setIsLoading(true);

    try {
      await loginAsRoleDemo(demoKey as any);
      
      // If user selected non-driver profile to test security
      if (demoKey === 'depot-demo') {
        setAccessDeniedMsg('Access Denied: You authenticated with DEPOT_MANAGER role. Only authorized DRIVERS are permitted to access this portal.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg('Failed to initialize demo driver profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6 px-4">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-500 mb-2">
          <Bus className="w-8 h-8" />
        </div>
        <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
          MSRTC Crew Telemetry Terminal
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Driver Portal Login
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Secure terminal access for authorized Maharashtra State Road Transport Corporation bus operators.
        </p>
      </div>

      {/* Access Denied Warning Banner */}
      {accessDeniedMsg && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700/80 text-red-200 text-xs flex items-start gap-3 shadow-xl animate-shake">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-red-100 font-bold block text-sm">ACCESS DENIED</strong>
            <div>{accessDeniedMsg}</div>
            <div className="text-[11px] text-red-400 font-mono">Security violation logged in system audit trail.</div>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-500" />
            Operator Credentials
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Route: /staff/driver/login
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCredentialSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-slate-400" />
              Driver Email or Badge ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. driver.santosh@msrtc.maharashtra.gov.in"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Terminal Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-slate-300">Security Rule:</strong> You cannot self-select a role. After authentication, the server inspects your verified record to validate driver status and assign your designated bus.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-red-950 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Driver Cockpit'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Driver Profiles for Demonstration */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>One-Click Test Operator Profiles:</span>
            <span className="text-[10px] text-amber-400 font-mono">DEMO DATA</span>
          </div>

          <div className="space-y-2">
            {/* Driver 1 */}
            <div
              onClick={() => handleQuickDriverLogin('driver-demo')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/60 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-xs">
                  D1
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-red-400 transition">
                    Driver Santosh Patil
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Badge: <strong className="text-slate-300 font-mono">#402</strong> &bull; Assigned: <strong className="text-amber-400 font-mono">BUS-101 (MH 14 BT 8841)</strong>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE DRIVER
              </span>
            </div>

            {/* Driver 2 */}
            <div
              onClick={() => handleQuickDriverLogin('driver-demo-2')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/60 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  D2
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                    Driver Sanjay Patil
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Badge: <strong className="text-slate-300 font-mono">#109</strong> &bull; Assigned: <strong className="text-blue-400 font-mono">BUS-105 (MH 12 CH 4219)</strong>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE DRIVER
              </span>
            </div>

            {/* Non-Driver Test (To verify Access Denied) */}
            <div
              onClick={() => handleQuickDriverLogin('depot-demo')}
              className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-amber-500/60 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  M1
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300 group-hover:text-amber-400 transition">
                    Arun Deshmukh (Depot Manager)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Role: <strong className="text-amber-400 font-mono">DEPOT_MANAGER</strong> (Test Unauthorized Rejection)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                TEST NON-DRIVER
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onNavigateHome}
          className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          &larr; Return to Public Homepage
        </button>
      </div>
    </div>
  );
};
