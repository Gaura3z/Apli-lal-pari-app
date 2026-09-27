import React, { useState, useMemo, useEffect } from 'react';
import { useTransit } from '../context/TransitContext';
import { BusStop, BusState } from '../types';
import { BusStandInterface } from '../components/BusStandInterface';
import { 
  MapPin, 
  Search, 
  Bus, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Radio, 
  X,
  Compass,
  Building2,
  ChevronRight
} from 'lucide-react';

interface BusStopsPageProps {
  initialStopName?: string;
  onTrackBus?: (bus: BusState) => void;
  onSelectStopToSearch?: (origin: string, destination: string) => void;
}

export const BusStopsPage: React.FC<BusStopsPageProps> = ({ 
  initialStopName,
  onTrackBus,
  onSelectStopToSearch 
}) => {
  const { stops, buses, routes } = useTransit();

  // Search input state for typing "any bus stand name"
  const [searchInput, setSearchInput] = useState(() => {
    // Check URL search params for ?stand=...
    const urlParams = new URLSearchParams(window.location.search);
    const queryStand = urlParams.get('stand');
    return queryStand || initialStopName || '';
  });

  // Selected stop to render ONLY its interface
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryStand = urlParams.get('stand');
    const target = queryStand || initialStopName;
    if (target) {
      const match = stops.find(s => 
        s.name.toLowerCase().includes(target.toLowerCase()) ||
        s.stopId.toLowerCase() === target.toLowerCase() ||
        (s.aliases && s.aliases.some(a => a.toLowerCase().includes(target.toLowerCase())))
      );
      if (match) return match;
    }
    return null;
  });

  // Whenever user types in the search box, if it matches any bus stand name, select it so ONLY this interface comes!
  useEffect(() => {
    const clean = searchInput.trim().toLowerCase();
    if (!clean) {
      return;
    }
    const match = stops.find(s => 
      s.name.toLowerCase().includes(clean) ||
      (s.marathiName && s.marathiName.toLowerCase().includes(clean)) ||
      (s.aliases && s.aliases.some(a => a.toLowerCase().includes(clean))) ||
      s.city.toLowerCase() === clean
    );
    if (match) {
      setSelectedStop(match);
    }
  }, [searchInput, stops]);

  const handleSelectStand = (stop: BusStop) => {
    setSelectedStop(stop);
    setSearchInput(stop.name);
    // Update URL query param without full reload
    const url = new URL(window.location.href);
    url.searchParams.set('stand', stop.name);
    window.history.replaceState({}, '', url.toString());
  };

  const handleClearSelection = () => {
    setSelectedStop(null);
    setSearchInput('');
    const url = new URL(window.location.href);
    url.searchParams.delete('stand');
    window.history.replaceState({}, '', url.toString());
  };

  // If a stand is selected (or typed), ONLY THIS INTERFACE COMES!
  if (selectedStop) {
    return (
      <BusStandInterface
        stop={selectedStop}
        allStops={stops}
        allBuses={buses}
        allRoutes={routes}
        onSelectAnotherStand={handleSelectStand}
        onTrackBus={(bus) => {
          if (onTrackBus) {
            onTrackBus(bus);
          } else {
            window.location.href = `/live-tracking?bus=${bus.busId}`;
          }
        }}
        onSearchRouteFromStand={(origin, destination) => {
          if (onSelectStopToSearch) {
            onSelectStopToSearch(origin, destination);
          } else {
            window.location.href = `/find-bus?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`;
          }
        }}
        onBackToDirectory={handleClearSelection}
      />
    );
  }

  // Otherwise, show Directory with prominent instant search
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Instant Search Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              <MapPin className="w-4 h-4 text-red-500" />
              MSRTC Station & Stand Directory
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-1">
              Corridor Bus Stops & Terminals
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Write any bus stand name below to instantly view its live electronic departure board, approaching buses, and platform details.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 self-start md:self-auto">
            Monitored Stands: <strong className="text-emerald-400 text-sm">{stops.length}</strong>
          </div>
        </div>

        {/* PROMINENT SEARCH: Write any bus stand name */}
        <div className="bg-slate-950/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-inner space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-red-400" />
            Write Any Bus Stand Name (e.g., Swargate, Talegaon, Induri, Kamshet, Lonavala):
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Type any bus stand name here (e.g. Swargate, Induri, Talegaon, Lonavala, Wakad)..."
              className="w-full py-3.5 pl-4 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              autoFocus
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stand Selection Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-500">Quick Select:</span>
            {stops.map((s) => (
              <button
                key={s.stopId}
                onClick={() => handleSelectStand(s)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium cursor-pointer transition hover:border-red-500/50"
              >
                {s.name.replace(' Bus Stand', '').replace(' Bus Bay', '').replace(' Central Stand', '').replace(' ST Stand', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Stops - Clicking any card immediately opens ONLY this interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stops.map((stop) => {
          // Check upcoming buses to this stop
          const upcomingBuses = buses.filter((b) => b.nextStopName === stop.name);

          return (
            <div
              key={stop.stopId}
              onClick={() => handleSelectStand(stop)}
              className="bg-slate-900 border border-slate-800 hover:border-red-500/60 rounded-2xl p-5 transition shadow-lg space-y-3 cursor-pointer group hover:bg-slate-850"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-xs font-mono font-bold flex items-center justify-center border border-red-500/30 group-hover:bg-red-600 group-hover:text-white transition">
                      {stop.sequence}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition">
                      {stop.name}
                    </h3>
                  </div>
                  {stop.marathiName && (
                    <div className="text-xs text-amber-400/90 font-medium ml-8 mt-0.5">
                      {stop.marathiName}
                    </div>
                  )}
                </div>

                {stop.isMajorTerminal ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
                    TERMINAL
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    STOP
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span>Region / City:</span>
                  <span className="text-slate-200 font-medium">{stop.city}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platforms / Bays:</span>
                  <span className="text-slate-200 font-mono">{stop.platforms || 4} bays</span>
                </div>
                <div className="flex justify-between">
                  <span>GPS Coordinates:</span>
                  <span className="text-slate-400 font-mono text-[11px]">{stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)}</span>
                </div>
              </div>

              {/* Real-time buses arriving */}
              <div className="pt-2">
                {upcomingBuses.length > 0 ? (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Bus className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      {upcomingBuses.length} bus approaching:
                    </span>
                    <span className="font-mono font-bold text-white">
                      {upcomingBuses[0].registrationNumber} &bull; {upcomingBuses[0].predictedArrival}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Scheduled every 20-30 min
                    </span>
                    <span className="text-red-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition text-xs">
                      View Board <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
