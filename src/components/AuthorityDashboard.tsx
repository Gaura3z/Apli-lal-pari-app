import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransit } from '../context/TransitContext';
import { LiveBusMap } from './LiveBusMap';
import { 
  Landmark, 
  Bus, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  ShieldCheck, 
  Users,
  Compass
} from 'lucide-react';

export const AuthorityDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { buses, routes, stops, alerts } = useTransit();

  const totalBuses = buses.length;
  const delayedBuses = buses.filter((b) => b.delayMinutes > 5).length;
  const highOccupancyBuses = buses.filter((b) => b.occupancyPercentage >= 85).length;
  const avgOccupancy = Math.round(
    buses.reduce((acc, b) => acc + b.occupancyPercentage, 0) / (buses.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* State Transport Authority Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
            <Landmark className="w-4 h-4 text-sky-400" />
            Maharashtra State Road Transport Corporation (MSRTC) HQ
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            State-Level Transit Command & Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized Authority: <strong className="text-slate-200">{userProfile?.name || 'MSRTC State Commissioner'}</strong> &bull; Region: Maharashtra State Wide
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold font-mono">
            COMMAND ACTIVE
          </span>
        </div>
      </div>

      {/* State-Wide KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active State Fleet</div>
          <div className="text-3xl font-black text-white font-mono mt-1">{totalBuses}</div>
          <div className="text-[11px] text-slate-500 mt-1">All telemetry transmitting</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Fleet Avg Occupancy</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{avgOccupancy}%</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Passenger utilization rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Corridor Delays</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">{delayedBuses}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Impacted by ghat traffic</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Capacity Shortage Risk</div>
          <div className="text-3xl font-black text-red-400 font-mono mt-1">{highOccupancyBuses}</div>
          <div className="text-[11px] text-red-500/80 mt-1">High crowd threshold reached</div>
        </div>
      </div>

      {/* Live State Tactical Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            Live Maharashtra State GPS Telemetry Stream
          </h2>
          <span className="text-xs text-slate-400 font-mono">PUNE &ndash; LONAVALA CORRIDOR</span>
        </div>
        <LiveBusMap buses={buses} stops={stops} />
      </div>

      {/* Corridor Demand and Bottlenecks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            High Demand Corridors (MSRTC Priority)
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Pune Swargate &harr; Lonavala Express</div>
                <div className="text-slate-400 text-[11px]">3 active buses &bull; 68.5 km</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-bold font-mono">
                87% Avg Load
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Talegaon &harr; Induri &harr; Kamshet Rural Link</div>
                <div className="text-slate-400 text-[11px]">2 active buses &bull; 34.2 km</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                68% Avg Load
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Operational Directives & Contingency
          </h3>
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 space-y-2">
            <div className="font-bold text-white">Recommended Actions for Pune Division:</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>Deploy 2 standby Lalpari ordinary units from Swargate Depot to mitigate Lonavala weekend rush.</li>
              <li>Coordinate with Highway Police near Khandala Ghat for heavy commercial lane discipline.</li>
              <li>Maintain regular telemetry sensor ping rate (currently operating nominally at 2.5s).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
