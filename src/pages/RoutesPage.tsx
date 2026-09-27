import React from 'react';
import { useTransit } from '../context/TransitContext';
import { Route, MapPin, Clock, Bus, ArrowRight } from 'lucide-react';

interface RoutesPageProps {
  onSelectRouteSearch?: (origin: string, dest: string) => void;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ onSelectRouteSearch }) => {
  const { routes, buses } = useTransit();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
            <Route className="w-4 h-4 text-sky-400" />
            Active MSRTC Service Corridors
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Corridors & Timetables
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered transport lines connecting Pune, Pimpri-Chinchwad, Talegaon, and the Western Ghats
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          Corridors Active: <strong className="text-white">{routes.length}</strong>
        </div>
      </div>

      {/* Routes Cards */}
      <div className="space-y-4">
        {routes.map((route) => {
          const activeFleet = buses.filter((b) => b.routeId === route.routeId);

          return (
            <div
              key={route.routeId}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 font-mono font-bold text-xs">
                    {route.routeCode}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {route.routeName}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">Total Distance:</span>
                  <span className="font-bold text-emerald-400">{route.distanceKm} km</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">Est. Duration:</span>
                  <span className="font-bold text-white">{route.estimatedMinutes} min</span>
                </div>
              </div>

              {/* Waypoints flow */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Stop Sequence:</div>
                <div className="flex flex-wrap items-center gap-2">
                  {route.stops.map((stop, idx) => (
                    <React.Fragment key={stop.stopId}>
                      <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono text-slate-400">
                          {idx + 1}
                        </span>
                        {stop.name}
                      </span>
                      {idx < route.stops.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Active Fleet summary */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400">
                  <Bus className="w-4 h-4 text-emerald-400" />
                  <span>
                    Currently Operating: <strong className="text-white font-mono">{activeFleet.length} active buses</strong> transmitting live GPS
                  </span>
                </div>

                {onSelectRouteSearch && (
                  <button
                    onClick={() => onSelectRouteSearch(route.origin, route.destination)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition w-fit"
                  >
                    <span>Find Buses for this Corridor</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
