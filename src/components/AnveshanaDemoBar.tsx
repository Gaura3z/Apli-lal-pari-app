import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransit } from '../context/TransitContext';
import { 
  FlaskConical, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Users, 
  ShieldCheck, 
  Compass,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AnveshanaDemoBar: React.FC = () => {
  const { buses, isSimulationRunning, toggleSimulation, simulationSpeed, setSimulationSpeed, injectDelay, injectPassengerSpike, resetDemoData } = useTransit();
  const { userProfile, loginAsRoleDemo, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const demoBus = buses[0];

  return (
    <div className="bg-slate-950 border-b border-red-900/60 sticky top-0 z-40 shadow-xl">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[11px] tracking-wider uppercase shadow-md shadow-red-900/40">
            <FlaskConical className="w-3.5 h-3.5" />
            Anveshana Prototype Mode
          </div>

          <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Simulated Corridor: Pune &rarr; Talegaon &rarr; Induri &rarr; Kamshet &rarr; Lonavala
          </span>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pause / Play simulation */}
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
              isSimulationRunning
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/50'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isSimulationRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isSimulationRunning ? 'Pause GPS' : 'Resume GPS'}</span>
          </button>

          {/* Speed multiplier */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                  simulationSpeed === speed
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Expand toggles */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <span>Live Scenarios</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Simulation Panel */}
      {isOpen && (
        <div className="bg-slate-900/95 border-t border-slate-800 p-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 text-xs animate-in slide-in-from-top-2 duration-150">
          {/* Quick Scenario 1: Inject Traffic Delay */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              1. Inject Traffic Delay
            </div>
            <p className="text-slate-400 text-[11px]">
              Instantly simulates Khandala / Talegaon highway bottleneck on Bus #{demoBus.registrationNumber.slice(-4)}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => injectDelay(demoBus.busId, 6)}
                className="flex-1 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 font-bold text-[11px] cursor-pointer"
              >
                +6 min Delay
              </button>
              <button
                onClick={() => injectDelay(demoBus.busId, 15)}
                className="flex-1 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold text-[11px] cursor-pointer"
              >
                +15 min Delay
              </button>
            </div>
          </div>

          {/* Quick Scenario 2: Passenger Boarding Spike */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              2. Passenger Surge Spike
            </div>
            <p className="text-slate-400 text-[11px]">
              Simulate sudden tourist crowd boarding at Induri / Talegaon to trigger "HIGH OCCUPANCY" alert.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => injectPassengerSpike(demoBus.busId, 6)}
                className="flex-1 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-[11px] cursor-pointer"
              >
                +6 Passengers
              </button>
              <button
                onClick={() => injectPassengerSpike(demoBus.busId, 14)}
                className="flex-1 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold text-[11px] cursor-pointer"
              >
                Fill Bus (98%)
              </button>
            </div>
          </div>

          {/* Quick Scenario 3: Persona Switcher for Exhibition */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              3. Exhibition Role Evaluator
            </div>
            <p className="text-slate-400 text-[11px]">
              Current Role: <span className="font-mono text-emerald-400 font-bold">{userProfile?.role || 'PUBLIC / PASSENGER'}</span>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => loginAsRoleDemo('driver-demo')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                title="Driver 1 (Assigned: BUS-101)"
              >
                Driver 1 (Bus 101)
              </button>
              <button
                onClick={() => loginAsRoleDemo('driver-demo-2' as any)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                title="Driver 2 (Assigned: BUS-105)"
              >
                Driver 2 (Bus 105)
              </button>
              <button
                onClick={() => loginAsRoleDemo('depot-demo')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
              >
                Depot Mgr
              </button>
              <button
                onClick={() => loginAsRoleDemo('authority-demo')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
              >
                Authority
              </button>
              <button
                onClick={() => loginAsRoleDemo('analyst-demo')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
              >
                Analyst
              </button>
              <button
                onClick={() => loginAsRoleDemo('admin-demo')}
                className="p-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200 text-[10px] font-mono cursor-pointer"
              >
                Super Admin
              </button>
            </div>
          </div>

          {/* Reset Demo State */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                4. Reset State
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Restores baseline timetable, initial bus positions, on-time status and clears transient spikes.
              </p>
            </div>
            <button
              onClick={resetDemoData}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
            >
              Reset Baseline Telemetry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
