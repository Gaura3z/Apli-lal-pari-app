import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Target, 
  Route, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  // Analytical metrics for MSRTC corridors
  const hourlyOccupancy = [
    { hour: '06:00', load: 45 },
    { hour: '08:00', load: 88 },
    { hour: '10:00', load: 92 },
    { hour: '12:00', load: 64 },
    { hour: '14:00', load: 58 },
    { hour: '16:00', load: 79 },
    { hour: '18:00', load: 94 },
    { hour: '20:00', load: 82 },
    { hour: '22:00', load: 50 },
  ];

  const stopDemand = [
    { stop: 'Pune Swargate', dailyPassengers: 14200, delayAvgMin: 4.2 },
    { stop: 'Shivajinagar Depot', dailyPassengers: 11800, delayAvgMin: 5.1 },
    { stop: 'Wakad Bridge', dailyPassengers: 8400, delayAvgMin: 7.8 },
    { stop: 'Talegaon Dabhade', dailyPassengers: 6900, delayAvgMin: 3.4 },
    { stop: 'Induri Phata', dailyPassengers: 3200, delayAvgMin: 2.1 },
    { stop: 'Kamshet Central', dailyPassengers: 5100, delayAvgMin: 4.0 },
    { stop: 'Lonavala ST Stand', dailyPassengers: 12900, delayAvgMin: 6.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Operations & Analytics Intelligence (Read-Only)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            MSRTC Fleet Performance & Demand Trends
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing passenger boarding curves, ETA confidence, route bottlenecks & fleet efficiency
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
          AGGREGATE METRICS &bull; LIVE STREAM
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Delay</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">+4.8 min</div>
          <div className="text-[11px] text-slate-500 mt-1">Down 14% vs last week</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ETA Model Accuracy</div>
          <div className="text-3xl font-black text-sky-400 font-mono mt-1">94.2%</div>
          <div className="text-[11px] text-slate-500 mt-1">Within &plusmn;3 min window</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Peak Hour Load</div>
          <div className="text-3xl font-black text-red-400 font-mono mt-1">94%</div>
          <div className="text-[11px] text-slate-500 mt-1">17:00 &ndash; 19:30 IST</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Daily Passenger Trips</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">62,500</div>
          <div className="text-[11px] text-slate-500 mt-1">Across monitored corridor</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Passenger Load Graph */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Diurnal Occupancy Profile (% Capacity)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Pune &harr; Lonavala</span>
          </div>

          <div className="h-60 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
            {hourlyOccupancy.map((item) => (
              <div key={item.hour} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {item.load}%
                </div>
                <div
                  style={{ height: `${item.load}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    item.load >= 85
                      ? 'bg-gradient-to-t from-red-600 to-rose-400 group-hover:brightness-125'
                      : item.load >= 70
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:brightness-125'
                      : 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:brightness-125'
                  }`}
                />
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-white">
                  {item.hour.slice(0, 2)}h
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>Morning Peak: 08:00 - 10:30 AM</span>
            <span>Evening Peak: 17:30 - 20:00 PM</span>
          </div>
        </div>

        {/* Bus Stop Demand and Delay Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-400" />
              Stop Density & Delay Hotspots
            </h3>
            <span className="text-xs text-slate-400">Boarding Volume</span>
          </div>

          <div className="space-y-3">
            {stopDemand.map((s) => (
              <div key={s.stop} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{s.stop}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-400">{s.dailyPassengers.toLocaleString()} pass/day</span>
                    <span className={s.delayAvgMin > 5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      +{s.delayAvgMin}m avg delay
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                    style={{ width: `${(s.dailyPassengers / 15000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
