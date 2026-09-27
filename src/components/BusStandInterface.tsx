import React, { useState, useMemo } from 'react';
import { BusStop, BusState, BusRoute } from '../types';
import { WhereIsMyBusTracker } from './WhereIsMyBusTracker';
import { 
  MapPin, 
  Bus, 
  Clock, 
  Compass, 
  ArrowRight, 
  Radio, 
  Navigation, 
  Users, 
  Sparkles, 
  Building2, 
  Phone, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  ExternalLink,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';

interface BusStandInterfaceProps {
  stop: BusStop;
  allStops: BusStop[];
  allBuses: BusState[];
  allRoutes: BusRoute[];
  onSelectAnotherStand: (stop: BusStop) => void;
  onTrackBus: (bus: BusState) => void;
  onSearchRouteFromStand: (origin: string, destination: string) => void;
  onBackToDirectory?: () => void;
}

export const BusStandInterface: React.FC<BusStandInterfaceProps> = ({
  stop,
  allStops,
  allBuses,
  allRoutes,
  onSelectAnotherStand,
  onTrackBus,
  onSearchRouteFromStand,
  onBackToDirectory
}) => {
  const [standSearchInput, setStandSearchInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedDirectionFilter, setSelectedDirectionFilter] = useState<'ALL' | 'OUTBOUND' | 'INBOUND'>('ALL');
  const [selectedBusForTracking, setSelectedBusForTracking] = useState<BusState | null>(null);

  // Filter other stops for search/switcher
  const matchingStops = useMemo(() => {
    if (!standSearchInput.trim()) return [];
    const q = standSearchInput.toLowerCase().trim();
    return allStops.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.marathiName && s.marathiName.includes(q)) ||
      (s.aliases && s.aliases.some(a => a.toLowerCase().includes(q))) ||
      s.city.toLowerCase().includes(q)
    );
  }, [standSearchInput, allStops]);

  // Buses that are approaching or currently at this stop
  const upcomingBuses = useMemo(() => {
    return allBuses.filter(bus => {
      // Direct next stop match
      if (bus.nextStopName.toLowerCase().includes(stop.name.toLowerCase()) || 
          stop.name.toLowerCase().includes(bus.nextStopName.toLowerCase())) {
        return true;
      }
      // Check if bus is on a route passing through this stop and hasn't passed it yet
      const route = allRoutes.find(r => r.routeId === bus.routeId);
      if (!route) return false;
      const stopIndex = route.stops.findIndex(s => s.stopId === stop.stopId || s.name === stop.name);
      if (stopIndex !== -1 && bus.currentStopIndex <= stopIndex && bus.status !== 'COMPLETED' && bus.status !== 'OFFLINE') {
        return true;
      }
      return false;
    }).map(bus => {
      // Calculate real-time distance from bus to this stop
      const distKm = calculateDistanceKm(bus.latitude, bus.longitude, stop.latitude, stop.longitude);
      const speed = Math.max(bus.currentSpeed, 30);
      const estMinutes = Math.max(1, Math.round((distKm / speed) * 60) + (bus.delayMinutes || 0));
      return {
        bus,
        distanceKm: Math.round(distKm * 10) / 10,
        estMinutes,
        isApproachingNow: distKm < 2.5
      };
    }).sort((a, b) => a.estMinutes - b.estMinutes);
  }, [allBuses, stop, allRoutes]);

  // Routes passing through this stop
  const passingRoutes = useMemo(() => {
    return allRoutes.filter(r => 
      r.stops.some(s => s.stopId === stop.stopId || s.name.toLowerCase().includes(stop.name.toLowerCase()))
    );
  }, [allRoutes, stop]);

  // Alternative destinations reachable from this stand along the corridor
  const possibleDestinations = useMemo(() => {
    return allStops
      .filter(s => s.stopId !== stop.stopId)
      .slice(0, 6);
  }, [allStops, stop]);

  // Live time for the digital board
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in-50 duration-200">
      {/* Top Banner & Quick Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 text-xs">
          {onBackToDirectory && (
            <button
              onClick={onBackToDirectory}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              &larr; All Bus Stands
            </button>
          )}
          <span className="text-slate-500 font-mono">/</span>
          <span className="text-slate-400 font-medium">Stand Directory</span>
          <span className="text-slate-500 font-mono">/</span>
          <span className="text-amber-400 font-bold">{stop.name}</span>
        </div>

        {/* Instant Search to switch to ANY other bus stand */}
        <div className="relative w-full md:w-80">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={standSearchInput}
              onChange={(e) => {
                setStandSearchInput(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Write any bus stand name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && matchingStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in-50 duration-150">
              <div className="px-3 py-1 bg-slate-950 text-[10px] font-mono text-slate-400 uppercase">
                Select Bus Stand ({matchingStops.length})
              </div>
              {matchingStops.map(s => (
                <div
                  key={s.stopId}
                  onClick={() => {
                    onSelectAnotherStand(s);
                    setStandSearchInput('');
                    setIsSearchOpen(false);
                  }}
                  className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <div>
                    <div className="font-bold text-white hover:text-red-400 transition">{s.name}</div>
                    <div className="text-[11px] text-amber-400/90">{s.marathiName}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{s.city}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Bus Stand Terminal Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-900 border border-red-900/40 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                MSRTC Official Bus Stand
              </span>
              {stop.isMajorTerminal ? (
                <span className="px-2.5 py-1 rounded-full bg-sky-950 border border-sky-700/60 text-sky-400 font-bold text-xs">
                  Major Central Terminal
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs">
                  Transit Bay & Stop
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 font-bold text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Stand Feed Active
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {stop.name}
              </h1>
              {stop.marathiName && (
                <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
                  {stop.marathiName}
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Serving the {stop.city} division along the Pune &harr; Talegaon &harr; Induri &harr; Kamshet &harr; Lonavala corridor.
              Equipped with {stop.platforms || 6} bus bays and live GPS telemetry monitoring.
            </p>

            {/* Quick Stand Metadata Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Division:</span>
                <strong className="text-slate-200">{stop.city} Region</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Platforms:</span>
                <strong className="text-slate-200">{stop.platforms || 6} Active Bays</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Corridor Seq:</span>
                <strong className="text-slate-200">Stop #{stop.sequence}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">GPS:</span>
                <strong className="text-slate-400">{stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}</strong>
              </div>
            </div>
          </div>

          {/* Digital Clock & Stand Live Status Box */}
          <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col items-center lg:items-end justify-center min-w-[220px]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              Terminal Digital Clock
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 mt-1 tracking-wider">
              {currentTime}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Approaching Buses: <strong className="text-emerald-400 text-sm">{upcomingBuses.length}</strong>
            </div>
            <div className="mt-3 w-full pt-3 border-t border-slate-800/80 text-[11px] text-center text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              AIS-140 GPS Geofence Monitored
            </div>
          </div>
        </div>
      </div>

      {/* QUICK CORRIDOR STAND SWITCHER PILLS */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-2">
          Switch Stand:
        </span>
        {allStops.map(s => {
          const isCurrent = s.stopId === stop.stopId;
          return (
            <button
              key={s.stopId}
              onClick={() => onSelectAnotherStand(s)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                isCurrent
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{s.name.replace(' Bus Stand', '').replace(' Bus Bay', '').replace(' Central Stand', '').replace(' ST Stand', '')}</span>
              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* 2. THE ELECTRONIC DIGITAL DEPARTURE & ARRIVAL BOARD */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Digital Station Departure & Arrival Display
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Live Approaching & Departing Buses at {stop.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time radar positions, estimated bay arrival time, and passenger seat occupancy
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              Auto-updating every 2s
            </span>
          </div>
        </div>

        {/* Board content */}
        {upcomingBuses.length > 0 ? (
          <div className="space-y-3">
            {upcomingBuses.map(({ bus, distanceKm, estMinutes, isApproachingNow }) => {
              const route = allRoutes.find(r => r.routeId === bus.routeId);
              const availableSeats = Math.max(0, bus.capacity - bus.currentPassengerCount);

              // Occupancy badge color
              let occBadge = 'bg-emerald-950 text-emerald-300 border-emerald-800';
              let occLabel = 'LOW OCCUPANCY';
              if (bus.occupancyPercentage > 90) {
                occBadge = 'bg-rose-950 text-rose-300 border-rose-800';
                occLabel = 'FULL CAPACITY';
              } else if (bus.occupancyPercentage > 75) {
                occBadge = 'bg-amber-950 text-amber-300 border-amber-800';
                occLabel = 'HIGH OCCUPANCY';
              } else if (bus.occupancyPercentage > 50) {
                occBadge = 'bg-yellow-950 text-yellow-300 border-yellow-800';
                occLabel = 'MODERATE';
              }

              return (
                <div
                  key={bus.busId}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 rounded-2xl transition shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left: Bus identification & Route */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-extrabold text-white text-base flex items-center gap-1.5">
                        <Bus className="w-4 h-4 text-red-500" />
                        {bus.busName || bus.registrationNumber}
                      </span>
                      <span className="font-mono font-black text-amber-300 text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {bus.registrationNumber}
                      </span>
                      <span className="font-bold text-xs text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                        {bus.busType.replace(/_/g, ' ')}
                      </span>
                      {isApproachingNow ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBusForTracking(bus)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse cursor-pointer"
                          title="Click to open Where Is My Bus live status"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>APPROACHING PLATFORM</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300 ml-1">Track ➔</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedBusForTracking(bus)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-950/70 hover:bg-red-900 border border-red-800/50 text-red-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                          title="Click to open Where Is My Bus live status"
                        >
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Location: Near <strong className="text-white underline decoration-amber-400 underline-offset-2">{bus.currentLocationName || bus.nextStopName}</strong> ({distanceKm} km away)</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300 ml-1">Where Is My Bus ➔</span>
                        </button>
                      )}
                    </div>

                    {/* Route Title */}
                    <div className="text-sm font-bold text-slate-200 flex items-center gap-2 flex-wrap">
                      <span>{route?.origin || 'Pune'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-amber-400 font-extrabold">{route?.destination || 'Lonavala'}</span>
                      {bus.nextStopName && (
                        <span className="text-xs font-normal text-slate-400">
                          (Next: <strong className="text-slate-200">{bus.nextStopName}</strong>)
                        </span>
                      )}
                    </div>

                    {/* Telemetry info row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                      <div>Speed: <strong className="text-white">{bus.currentSpeed} km/h</strong></div>
                      <div>Depot: <strong className="text-slate-300">{bus.depotName}</strong></div>
                      <div>GPS: <strong className="text-emerald-400">Connected (AIS-140)</strong></div>
                    </div>
                  </div>

                  {/* Center: ETA & Capacity */}
                  <div className="flex items-center gap-4 sm:gap-6 border-y sm:border-y-0 sm:border-x border-slate-800 py-3 sm:py-0 sm:px-6">
                    {/* ETA Countdown */}
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Estimated Arrival</div>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {estMinutes <= 1 ? 'Due Now' : `${estMinutes} min`}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {bus.predictedArrival || 'On Schedule'}
                      </div>
                    </div>

                    {/* Passenger load */}
                    <div className="text-left">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Live Occupancy</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${occBadge}`}>
                          {occLabel}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {bus.occupancyPercentage}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <strong className="text-emerald-400">{availableSeats}</strong> seats available
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedBusForTracking(bus)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer active:scale-95 transition whitespace-nowrap border border-white/20"
                      title="Open Where Is My Bus Live Status"
                    >
                      <Bus className="w-4 h-4 text-white" />
                      <span>Where Is My Bus</span>
                    </button>
                    <button
                      onClick={() => onTrackBus(bus)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
                      title="View live GPS on map"
                    >
                      <Radio className="w-3.5 h-3.5 text-sky-400" />
                      <span>Map Radar</span>
                    </button>
                    <button
                      onClick={() => onSearchRouteFromStand(stop.name, route?.destination || 'Lonavala')}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <span>Boarding Info &rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <Bus className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
            <div className="text-base font-bold text-white">No active buses currently in the immediate approach sector</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Regular scheduled services run every 15-20 minutes on the corridor. You can check the corridor timetables below or find buses departing shortly.
            </p>
          </div>
        )}
      </div>

      {/* 3. QUICK DESTINATIONS FROM THIS STAND */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            <Compass className="w-4 h-4 text-emerald-400" />
            Direct Connections
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            Where do you want to travel from {stop.name}?
          </h3>
          <p className="text-xs text-slate-400">
            Click any destination stand to find connecting Lalpari and express buses immediately
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {possibleDestinations.map(dest => {
            const distKm = Math.round(calculateDistanceKm(stop.latitude, stop.longitude, dest.latitude, dest.longitude) * 10) / 10;
            return (
              <div
                key={dest.stopId}
                onClick={() => onSearchRouteFromStand(stop.name, dest.name)}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-slate-900 cursor-pointer transition shadow group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono text-slate-500">To Destination:</div>
                  <div className="font-bold text-white text-sm group-hover:text-red-400 transition">{dest.name}</div>
                  <div className="text-[11px] text-amber-400/80">{dest.marathiName}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">Approx ~{distKm} km away</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-red-600 flex items-center justify-center text-slate-300 group-hover:text-white transition shadow">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PASSING CORRIDOR ROUTES & STAND AMENITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Passing routes */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
            <Navigation className="w-4 h-4 text-sky-400" />
            Corridor Transit Routes
          </div>
          <h3 className="text-lg font-bold text-white">
            Scheduled Bus Routes Passing Through {stop.name}
          </h3>

          <div className="space-y-3">
            {passingRoutes.map(route => (
              <div key={route.routeId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                    {route.routeCode}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Frequency: Every {route.frequencyMinutes || 20} min
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {route.routeName}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Origin: <strong className="text-slate-300">{route.origin}</strong></span>
                  <span>&bull;</span>
                  <span>Destination: <strong className="text-slate-300">{route.destination}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stand Amenities & Emergency Contacts */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            <Building2 className="w-4 h-4 text-amber-400" />
            Stand Amenities & Support
          </div>
          <h3 className="text-lg font-bold text-white">
            Passenger Amenities at {stop.name}
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ticket Reservation</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Covered Waiting Shed</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Public Restrooms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Drinking Water</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>CCTV Surveillance</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Wheelchair Access</span>
            </div>
          </div>

          {/* Helpline card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/60 to-slate-950 border border-red-900/40 text-xs space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-red-400" />
              MSRTC Stand Enquiry & Helpline
            </div>
            <div className="text-slate-300">
              Station Superintendent Office Desk: <strong className="text-white">020-24440017</strong>
            </div>
            <div className="text-slate-400 text-[11px]">
              Maharashtra Central Passenger Helpline: <strong className="text-amber-400">1800-22-1251</strong> (24x7 Toll Free)
            </div>
          </div>
        </div>
      </div>

      {/* Where Is My Train Tracker Modal for Bus Stand */}
      {selectedBusForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
                  <Bus className="w-5 h-5 text-red-500" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      Where Is My Bus &bull; {selectedBusForTracking.busName || 'Live Status'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      APPROACHING {stop.name.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Bus: <strong className="text-white">{selectedBusForTracking.busName || 'Express Service'}</strong> &bull; Reg: <strong className="text-amber-300 font-mono">{selectedBusForTracking.registrationNumber}</strong> &bull; Bay / Platform countdown
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const busToTrack = selectedBusForTracking;
                    setSelectedBusForTracking(null);
                    onTrackBus(busToTrack);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  title="View on full map radar"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Open Map Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBusForTracking(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition shrink-0"
                  title="Close live status"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-slate-950/50">
              {(() => {
                const liveBus = allBuses.find((b) => b.busId === selectedBusForTracking.busId) || selectedBusForTracking;
                return (
                  <WhereIsMyBusTracker
                    bus={liveBus}
                    allStops={allStops}
                    allRoutes={allRoutes}
                    onOpenMap={() => {
                      setSelectedBusForTracking(null);
                      onTrackBus(liveBus);
                    }}
                  />
                );
              })()}
            </div>

            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>MSRTC Stand Radar &bull; Monitored GPS Feed</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBusForTracking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Back to Stand Board
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const busToTrack = selectedBusForTracking;
                    setSelectedBusForTracking(null);
                    onTrackBus(busToTrack);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950 transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Full Map Radar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
