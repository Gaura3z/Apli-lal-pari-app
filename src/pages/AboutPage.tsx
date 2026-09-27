import React from 'react';
import { Bus, Landmark, ShieldCheck, Cpu, Code2, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Anveshana Engineering Prototype
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          About Where Is My Lalpari?
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          <strong>Intelligent Real-Time Maharashtra Public Bus Tracking, ETA & Passenger Capacity Management System</strong>
        </p>
      </div>

      {/* Core Mission */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bus className="w-5 h-5 text-red-500" />
          The Lalpari Modernization Vision
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The iconic red Maharashtra State Road Transport Corporation (MSRTC) bus, affectionately known across Maharashtra as <strong>"Lalpari" (लालपरी)</strong>, has been the lifeline of rural, semi-urban, and metropolitan transit for over seven decades.
        </p>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Despite extensive network connectivity, passengers frequently face three critical challenges:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-300">
          <li><strong>Uncertain Arrival Times:</strong> Lack of real-time GPS telemetry leading to unpredictable wait times at rural and highway stands.</li>
          <li><strong>Lack of Capacity Transparency:</strong> Passengers board overcrowded buses or wait fruitlessly for full buses without knowing available seating in advance.</li>
          <li><strong>Complex Bus Number Dependencies:</strong> Commuters are forced to memorize depot schedules and vehicle identifiers instead of simply querying origin and destination.</li>
        </ul>
      </div>

      {/* Engineering Architecture Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Modular ETA Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calculates dynamic arrivals considering real-time telemetry, ghat road grades, peak hour traffic multipliers, and historical variance.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero-Trust Role Security</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            RBAC permissions enforced at the backend through Firebase Authentication and Firestore Security Rules. User clearance is verified server-side.
          </p>
        </div>
      </div>
    </div>
  );
};
