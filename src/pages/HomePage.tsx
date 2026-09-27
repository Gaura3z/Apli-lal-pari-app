import React, { useState, useMemo } from 'react';
import { 
  Bus, 
  MapPin, 
  Compass, 
  Search, 
  ArrowRight, 
  Radio, 
  Clock, 
  Users, 
  TrendingUp, 
  Route, 
  Building2, 
  Landmark, 
  BarChart3, 
  ShieldAlert, 
  Lock, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Navigation
} from 'lucide-react';
import { UserRole, BusState } from '../types';
import { useTransit } from '../context/TransitContext';
import { SearchAutocomplete } from '../components/SearchAutocomplete';
import { findNearestStops } from '../services/searchEngine';
import { WhereIsMyBusTracker } from '../components/WhereIsMyBusTracker';

interface HomePageProps {
  onSearch: (from: string, to: string) => void;
  onNavigateToPortal: (portalKey: string, portalName: string, requiredRole?: UserRole) => void;
  onOpenLiveTracking: () => void;
  onSelectStand?: (standName: string) => void;
  onTrackBus?: (bus: BusState) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  onNavigateToPortal,
  onOpenLiveTracking,
  onSelectStand,
  onTrackBus
}) => {
  const { stops, buses, routes } = useTransit();
  const [searchMode, setSearchMode] = useState<'ROUTE' | 'SPOT_BUS' | 'STAND'>('ROUTE');
  const [standQuery, setStandQuery] = useState('Pune Swargate Bus Stand');
  const [spotBusQuery, setSpotBusQuery] = useState('');
  const [fromQuery, setFromQuery] = useState('Pune');
  const [toQuery, setToQuery] = useState('Lonavala');
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [trackingBusInModal, setTrackingBusInModal] = useState<BusState | null>(null);

  // Filter buses by busName or registrationNumber for Spot Bus mode
  const matchingBuses = useMemo(() => {
    const q = spotBusQuery.trim().toLowerCase();
    if (!q) return buses.slice(0, 4);
    return buses.filter(b => 
      (b.busName && b.busName.toLowerCase().includes(q)) ||
      b.registrationNumber.toLowerCase().includes(q) ||
      b.busType.toLowerCase().includes(q) ||
      b.nextStopName.toLowerCase().includes(q)
    );
  }, [spotBusQuery, buses]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = findNearestStops(pos.coords.latitude, pos.coords.longitude, stops, 1);
          if (nearest.length > 0) {
            setFromQuery(nearest[0].stop.name);
            setGeoNotice(`Selected closest stand: ${nearest[0].stop.name}`);
          } else {
            setFromQuery('Pune Shivajinagar');
          }
        },
        () => {
          setFromQuery('Pune Swargate');
          setGeoNotice('Defaulted to Pune Swargate.');
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

  const handleFindBusesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(fromQuery, toQuery);
  };

  return (
    <div className="space-y-12">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Maharashtra State Public Bus Network
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Where Is My Lalpari?
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-medium">
            Find your bus without knowing the bus number.
          </p>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Commuters no longer need to know vehicle registration numbers, timetable booklets, or depot codes. Simply tell Lalpari where you are and where you want to go.
          </p>

          {/* Primary Search Card with Dual Modes */}
          <div className="mt-6 bg-slate-950/85 border border-slate-800 p-4 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md">
            {/* Search Mode Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setSearchMode('ROUTE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  searchMode === 'ROUTE'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span>Find Buses (From &rarr; To)</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode('SPOT_BUS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  searchMode === 'SPOT_BUS'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Bus className="w-3.5 h-3.5 text-amber-400" />
                <span>Spot Bus (By Bus Name or Number)</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode('STAND')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  searchMode === 'STAND'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Live Bus Stand Board</span>
              </button>
            </div>

            {searchMode === 'ROUTE' ? (
              <form onSubmit={handleFindBusesSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* FROM input */}
                  <div className="md:col-span-5 relative">
                    <SearchAutocomplete
                      label="FROM"
                      value={fromQuery}
                      placeholder="Enter origin (e.g. Pune, Talegaon, Induri)"
                      allStops={stops}
                      onChange={(val) => setFromQuery(val)}
                      leadingIcon={<MapPin className="w-4 h-4 text-emerald-400" />}
                      rightAction={
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/40 px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
                          title="Use My Location"
                        >
                          <Compass className="w-3 h-3" />
                          GPS
                        </button>
                      }
                    />
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

                  {/* TO input */}
                  <div className="md:col-span-4 relative">
                    <SearchAutocomplete
                      label="TO"
                      value={toQuery}
                      placeholder="Enter destination (e.g. Lonavala, Kamshet)"
                      allStops={stops}
                      onChange={(val) => setToQuery(val)}
                      leadingIcon={<MapPin className="w-4 h-4 text-red-400" />}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="md:col-span-2 pt-5 md:pt-0">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer active:scale-95 transition"
                    >
                      <Search className="w-4 h-4" />
                      Find Buses
                    </button>
                  </div>
                </div>

                {geoNotice && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{geoNotice}</span>
                  </div>
                )}

                {/* Quick buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Quick Corridors:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFromQuery('Pune');
                      setToQuery('Lonavala');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition"
                  >
                    Pune &rarr; Lonavala (Express)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromQuery('Talegaon');
                      setToQuery('Kamshet');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition"
                  >
                    Talegaon &rarr; Kamshet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromQuery('Shivajinagar');
                      setToQuery('Khandala');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition"
                  >
                    Shivajinagar &rarr; Khandala Ghat
                  </button>
                </div>
              </form>
            ) : searchMode === 'SPOT_BUS' ? (
              /* SPOT BUS MODE: By Bus Name or Bus Registration Number */
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                    ENTER BUS NAME OR BUS NUMBER (E.G. SHIVSHAHI, LALPARI, EXPRESS 101, MH 14 BT 8841)
                  </label>
                  <div className="relative flex items-center">
                    <Bus className="absolute left-3.5 w-4 h-4 text-amber-400 pointer-events-none" />
                    <input
                      type="text"
                      value={spotBusQuery}
                      onChange={(e) => setSpotBusQuery(e.target.value)}
                      placeholder="Type Bus Name (Shivshahi, Express 101, Hirvani) or Reg No..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm font-semibold"
                    />
                    {spotBusQuery && (
                      <button
                        type="button"
                        onClick={() => setSpotBusQuery('')}
                        className="absolute right-3 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Popular Bus Name Chips */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Quick Bus Names:</span>
                  {['Shivshahi 103', 'Express 101', 'Hirvani 104', 'Express 105', 'E-Shivai 106'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSpotBusQuery(name)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition flex items-center gap-1"
                    >
                      <Bus className="w-3 h-3 text-amber-400" />
                      <span>{name}</span>
                    </button>
                  ))}
                </div>

                {/* Matching Buses List with Instant Where Is My Bus Tracking */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Active Running Fleet ({matchingBuses.length} Buses Found)</span>
                    <span className="text-emerald-400 font-bold">AIS-140 GPS LIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {matchingBuses.map((bus) => (
                      <div
                        key={bus.busId}
                        className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 space-y-2.5 shadow-md transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                                <Bus className="w-4 h-4 text-red-500" />
                                {bus.busName || bus.registrationNumber}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/50 text-amber-300 border border-amber-500/30">
                                {bus.registrationNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Type: <strong className="text-slate-300">{bus.busType.replace('_', ' ')}</strong> &bull; {bus.depotName}
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            bus.delayMinutes > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {bus.delayMinutes > 0 ? `+${bus.delayMinutes}m` : 'On Time'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-mono">Location</div>
                            <div className="font-semibold text-white truncate max-w-[170px]">
                              {bus.currentLocationName || bus.nextStopName}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-[10px] text-slate-500 uppercase">Live Speed</div>
                            <div className="text-emerald-400 font-bold">{bus.currentSpeed} km/h</div>
                          </div>
                        </div>

                        {/* Where Is My Bus Button */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onTrackBus) {
                                onTrackBus(bus);
                              } else {
                                setTrackingBusInModal(bus);
                              }
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-950/60 cursor-pointer active:scale-95 transition border border-white/20"
                            title="Open Where Is My Bus Live Status"
                          >
                            <Bus className="w-3.5 h-3.5 text-white" />
                            <span>Where Is My Bus</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* BUS STAND LIVE BOARD MODE: Write any bus stand name -> ONLY this interface comes */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onSelectStand) {
                    onSelectStand(standQuery);
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-9 relative">
                    <SearchAutocomplete
                      label="WRITE ANY BUS STAND NAME (STATION / DEPOT / BAY)"
                      value={standQuery}
                      placeholder="Write any bus stand name (e.g. Swargate, Talegaon, Induri, Kamshet, Lonavala)..."
                      allStops={stops}
                      onChange={(val) => setStandQuery(val)}
                      leadingIcon={<MapPin className="w-4 h-4 text-amber-400" />}
                    />
                  </div>

                  <div className="md:col-span-3 pt-5 md:pt-0">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 cursor-pointer active:scale-95 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      Open Live Board
                    </button>
                  </div>
                </div>

                {/* Popular bus stand chips */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Quick Stands:</span>
                  {stops.slice(0, 6).map((s) => (
                    <button
                      key={s.stopId}
                      type="button"
                      onClick={() => {
                        setStandQuery(s.name);
                        if (onSelectStand) onSelectStand(s.name);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition hover:border-amber-500/50"
                    >
                      {s.name.replace(' Bus Stand', '').replace(' Bus Bay', '').replace(' Central Stand', '').replace(' ST Stand', '')}
                    </button>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 2. Below Search Core Value Highlights */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Intelligent Public Bus System Capabilities
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key functional pillars powering Maharashtra's next-generation Lalpari fleet
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Feature 1: Live Bus Tracking */}
          <div 
            onClick={onOpenLiveTracking}
            className="bg-slate-900 border border-slate-800 hover:border-red-500/50 p-4 rounded-2xl transition group cursor-pointer shadow-lg space-y-2"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition">
              Live Bus Tracking
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track real-time GPS telemetry, coordinate headings, and highway progress updated continuously.
            </p>
          </div>

          {/* Feature 2: Smart ETA */}
          <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-4 rounded-2xl transition group shadow-lg space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
              Smart ETA
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic arrival predictions factoring actual travel velocity, ghat road terrain, and diurnal time patterns.
            </p>
          </div>

          {/* Feature 3: Passenger Capacity */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl transition group shadow-lg space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
              Passenger Capacity
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Know available seats before boarding. Explicitly distinguished as Measured or Estimated occupancy.
            </p>
          </div>

          {/* Feature 4: Delay Prediction */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl transition group shadow-lg space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
              Delay Prediction
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proactive warnings regarding highway congestion near Wakad, Talegaon, and Khandala ghat bottlenecks.
            </p>
          </div>

          {/* Feature 5: Intelligent Journey Planning */}
          <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl transition group shadow-lg space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
              <Route className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
              Journey Planning
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligently associates stops and connects rural and express services for optimal transit.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Visible Portal Cards Section */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Operational Portals & Governance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Publicly visible gateways. Privileged roles strictly enforce zero-trust authentication and server-side RBAC.
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-full w-fit">
            VISIBLE &bull; ZERO-TRUST CLEARANCE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Passenger Portal */}
          <div
            onClick={() => onNavigateToPortal('PASSENGER', 'Passenger Portal')}
            className="bg-slate-900 border border-slate-800 hover:border-red-500 p-6 rounded-3xl transition duration-200 group cursor-pointer shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-red-400 transition">1. Passenger Portal</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">PUBLIC</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Search FROM &rarr; TO without knowing bus numbers. View live ETA, seat capacity, and crowd warnings.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-red-400">
              <span>Open Passenger Interface</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: Driver Portal */}
          <div
            onClick={() => onNavigateToPortal('DRIVER', 'Driver Portal', 'DRIVER')}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-6 rounded-3xl transition duration-200 group cursor-pointer shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">2. Driver Portal</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-bold">RESTRICTED</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Dedicated interface for bus crew. Access assigned bus, route progress, start/end trip, and passenger counter.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Driver Authentication</span>
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {/* Card 3: Depot Manager Portal */}
          <div
            onClick={() => onNavigateToPortal('DEPOT', 'Depot Manager Portal', 'DEPOT_MANAGER')}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500 p-6 rounded-3xl transition duration-200 group cursor-pointer shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">3. Depot Manager Portal</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">DEPOT LEVEL</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Depot operations overview (e.g. Shivajinagar). Fleet tracking, delay mitigations, and passenger alert dispatches.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Manage Depot Operations</span>
              <Lock className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          {/* Card 4: Authority Portal */}
          <div
            onClick={() => onNavigateToPortal('AUTHORITY', 'Authority Portal', 'AUTHORITY')}
            className="bg-slate-900 border border-slate-800 hover:border-sky-500 p-6 rounded-3xl transition duration-200 group cursor-pointer shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-500 group-hover:scale-110 transition">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition">4. Authority Portal</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-800 font-bold">STATE HQ</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  State-level executive command. High-demand corridor surveillance, capacity bottleneck warnings, and directives.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-sky-400">
              <span>Command Headquarters</span>
              <Lock className="w-4 h-4 text-sky-500" />
            </div>
          </div>

          {/* Card 5: Analytics Portal */}
          <div
            onClick={() => onNavigateToPortal('ANALYST', 'Analytics Portal', 'ANALYST')}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-3xl transition duration-200 group cursor-pointer shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition">5. Analytics Portal</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">READ ONLY</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Read-only operational analytics: diurnal passenger load profiles, ETA accuracy, and bus stop demand densities.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-400">
              <span>View Transit Analytics</span>
              <Lock className="w-4 h-4 text-indigo-500" />
            </div>
          </div>

          {/* Card 6: Administration Portal */}
          <div
            onClick={() => onNavigateToPortal('ADMIN', 'Administration Portal', 'SUPER_ADMIN')}
            className="bg-slate-900 border border-slate-800 hover:border-rose-500 p-6 rounded-3xl transition duration-200 group cursor-pointer shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 group-hover:scale-110 transition">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition">6. Administration</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold">SUPER ADMIN</span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Master registry governance: User RBAC records, bus fleets, route stop sequences, and security audit logs.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-rose-400">
              <span>Admin Clearance</span>
              <Lock className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>
      </section>

      {/* WHERE IS MY BUS LIVE STATUS MODAL */}
      {trackingBusInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

            {/* Modal Navigation Top Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
                  <Bus className="w-5 h-5 text-red-500" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      Where Is My Bus &bull; {trackingBusInModal.busName || 'Live Status'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE AIS-140 GPS
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Bus Name: <strong className="text-white">{trackingBusInModal.busName || 'Express Service'}</strong> &bull; Registration: <strong className="text-amber-300 font-mono">{trackingBusInModal.registrationNumber}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const busToTrack = trackingBusInModal;
                    setTrackingBusInModal(null);
                    if (onTrackBus) {
                      onTrackBus(busToTrack);
                    } else {
                      onOpenLiveTracking();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  title="View on full map radar"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Open Map Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackingBusInModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition shrink-0"
                  title="Close live status"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: WhereIsMyBusTracker Component */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-slate-950/50">
              {(() => {
                const liveBus = buses.find((b) => b.busId === trackingBusInModal.busId) || trackingBusInModal;
                return (
                  <WhereIsMyBusTracker
                    bus={liveBus}
                    allStops={stops}
                    allRoutes={routes}
                    onOpenMap={() => {
                      setTrackingBusInModal(null);
                      if (onTrackBus) {
                        onTrackBus(liveBus);
                      } else {
                        onOpenLiveTracking();
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
