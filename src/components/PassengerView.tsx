import React, { useState } from 'react';
import { useTransit } from '../context/TransitContext';
import { BusCard } from './BusCard';
import { LiveBusMap } from './LiveBusMap';
import { BusState } from '../types';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Compass, 
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const PassengerView: React.FC = () => {
  const { buses, stops, alerts, findBusesForJourney } = useTransit();
  const [fromQuery, setFromQuery] = useState('Pune');
  const [toQuery, setToQuery] = useState('Lonavala');
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedBus, setSelectedBus] = useState<BusState | null>(buses[0]);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Perform search
  const { matchingBuses, originStop, destinationStop } = findBusesForJourney(fromQuery, toQuery);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Nearest simulated stop in Pune region
          setFromQuery('Pune Shivajinagar');
        },
        () => {
          setFromQuery('Pune Swargate');
        }
      );
    } else {
      setFromQuery('Pune Swargate');
    }
  };

  const handleSwap = () => {
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp);
  };

  const filteredBuses = matchingBuses.filter((b) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'AVAILABLE') return b.occupancyPercentage < 80;
    if (filterType === 'ORDINARY') return b.busType === 'LALPARI_ORDINARY';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner if any active alerts exist */}
      {alerts.length > 0 && alerts[0].active && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-red-950/80 border border-amber-600/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{alerts[0].title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/30 text-amber-300 font-mono">STATE DISPATCH</span>
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5">{alerts[0].message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section: "Where are you going?" */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Smart MSRTC Bus Discovery &bull; No Bus Number Required
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Where are you going?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Just enter your origin and destination. Lalpari automatically maps active routes, live GPS coordinates, predicted delays, and available seat capacity.
          </p>

          {/* Search Inputs Card */}
          <div className="mt-6 bg-slate-950/80 border border-slate-800/90 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* FROM field */}
              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  From (Origin)
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 w-4 h-4 text-emerald-400" />
                  <input
                    type="text"
                    value={fromQuery}
                    onChange={(e) => setFromQuery(e.target.value)}
                    placeholder="e.g. Pune, Swargate, Talegaon..."
                    className="w-full pl-10 pr-24 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="absolute right-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/40 px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
                  >
                    <Compass className="w-3 h-3" />
                    GPS
                  </button>
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center pt-5 md:pt-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer shadow-md"
                  title="Swap Origin and Destination"
                >
                  <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                </button>
              </div>

              {/* TO field */}
              <div className="md:col-span-4 relative">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  To (Destination)
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 w-4 h-4 text-red-400" />
                  <input
                    type="text"
                    value={toQuery}
                    onChange={(e) => setToQuery(e.target.value)}
                    placeholder="e.g. Lonavala, Kamshet..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  />
                </div>
              </div>

              {/* Find Buses CTA */}
              <div className="md:col-span-2 pt-5 md:pt-0">
                <button
                  type="button"
                  onClick={() => setHasSearched(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer active:scale-95 transition"
                >
                  <Search className="w-4 h-4" />
                  Find Buses
                </button>
              </div>
            </div>

            {/* Quick popular routes tags */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Popular Corridors:</span>
              <button
                onClick={() => {
                  setFromQuery('Pune');
                  setToQuery('Lonavala');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition"
              >
                Pune &rarr; Lonavala (Express)
              </button>
              <button
                onClick={() => {
                  setFromQuery('Talegaon');
                  setToQuery('Kamshet');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition"
              >
                Talegaon &rarr; Kamshet
              </button>
              <button
                onClick={() => {
                  setFromQuery('Shivajinagar');
                  setToQuery('Khandala');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition"
              >
                Shivajinagar &rarr; Khandala Ghat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Map Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
              Live Interactive Fleet Map
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Click any bus to inspect speed, driver, and arrival timeline
          </span>
        </div>

        <LiveBusMap
          buses={buses}
          stops={stops}
          selectedBusId={selectedBus?.busId}
          onSelectBus={(bus) => setSelectedBus(bus)}
        />
      </div>

      {/* Search Results / Bus List */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Matching Active Buses ({filteredBuses.length})</span>
                <span className="text-xs font-normal text-slate-400">
                  {fromQuery} &rarr; {toQuery}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Matched via nearest boarding station: <strong className="text-slate-200">{originStop?.name}</strong> to <strong className="text-slate-200">{destinationStop?.name}</strong>
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
              </span>
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  filterType === 'ALL'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Buses
              </button>
              <button
                onClick={() => setFilterType('AVAILABLE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  filterType === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Seats Available
              </button>
              <button
                onClick={() => setFilterType('ORDINARY')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  filterType === 'ORDINARY'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Lalpari Only
              </button>
            </div>
          </div>

          {/* List of matching buses */}
          <div className="space-y-3">
            {filteredBuses.map((bus) => (
              <BusCard
                key={bus.busId}
                bus={bus}
                destinationName={destinationStop?.name || 'Lonavala'}
                destinationLat={destinationStop?.latitude || 18.7523}
                destinationLon={destinationStop?.longitude || 73.4072}
                onTrackOnMap={(selected) => {
                  setSelectedBus(selected);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
