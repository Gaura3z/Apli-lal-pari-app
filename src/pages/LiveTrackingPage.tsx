import React, { useState, useEffect } from 'react';
import { useTransit } from '../context/TransitContext';
import { LiveBusMap } from '../components/LiveBusMap';
import { WhereIsMyBusTracker } from '../components/WhereIsMyBusTracker';
import { BusState, BusType } from '../types';
import { 
  Radio, 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2,
  Compass,
  Play,
  Pause,
  Zap,
  RotateCcw,
  Signal,
  Battery,
  Satellite,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';

interface LiveTrackingPageProps {
  initiallySelectedBusId?: string;
  onNavigateToSearch?: () => void;
}

export const LiveTrackingPage: React.FC<LiveTrackingPageProps> = ({
  initiallySelectedBusId,
  onNavigateToSearch
}) => {
  const { 
    buses, 
    stops, 
    routes,
    telemetries,
    simulationSpeed, 
    setSimulationSpeed, 
    isSimulationRunning, 
    toggleSimulation,
    injectDelay,
    injectPassengerSpike,
    reverseBusDirection,
    resetDemoData
  } = useTransit();

  const [selectedBusId, setSelectedBusId] = useState<string>(
    initiallySelectedBusId || (buses[0] ? buses[0].busId : '')
  );

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [trackingTab, setTrackingTab] = useState<'BUS_TIMELINE' | 'RAW_TELEMETRY'>('BUS_TIMELINE');
  const [activeViewLayout, setActiveViewLayout] = useState<'DUAL' | 'BUS_TRACK_ONLY' | 'MAP_ONLY'>('DUAL');

  // Update selected bus if initiallySelectedBusId changes
  useEffect(() => {
    if (initiallySelectedBusId) {
      setSelectedBusId(initiallySelectedBusId);
      setTrackingTab('BUS_TIMELINE');
      setActiveViewLayout('DUAL');
    }
  }, [initiallySelectedBusId]);

  // Synchronize URL to /live-tracking for clear page identification
  useEffect(() => {
    if (window.location.pathname !== '/live-tracking') {
      window.history.replaceState(null, '', '/live-tracking');
    }
  }, []);

  const selectedBus = buses.find((b) => b.busId === selectedBusId) || buses[0];
  const selectedTelemetry = selectedBus ? telemetries[selectedBus.busId] : undefined;

  // Filtered fleet list
  const filteredBuses = buses.filter((b) => {
    const matchesSearch = 
      b.registrationNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.nextStopName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.depotName.toLowerCase().includes(searchFilter.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'LALPARI') return matchesSearch && b.busType === 'LALPARI_ORDINARY';
    if (filterType === 'HIRKANI') return matchesSearch && (b.busType === 'HIRKANI_SEMI_LUXURY' || b.busType === 'HIRVANI_SEMI_LUXURY');
    if (filterType === 'SHIVSHAHI') return matchesSearch && (b.busType === 'SHIVSHAHI_AC' || b.busType === 'E_SHIVAI' || b.busType === 'E_SHIVAI_ELECTRIC');
    if (filterType === 'HIGH_OCCUPANCY') return matchesSearch && b.occupancyPercentage >= 85;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Simulation Banner Notice */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">PROTOTYPE SIMULATION NOTICE:</span> This live tracking view uses high-fidelity{' '}
            <span className="font-mono underline">SIMULATED GPS TELEMETRY</span> based on the AIS-140 standard for engineering innovation demonstration.
            It does not claim to represent live official MSRTC server feeds.
          </div>
        </div>
        <div className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[11px] whitespace-nowrap">
          DEMO / SIMULATED DATA
        </div>
      </div>

      {/* Main Page Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
            <Radio className="w-4 h-4 animate-pulse text-red-500" />
            Active Fleet Radar &bull; Route 48 Express
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Real-Time Bus Tracking & Live Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Corridor: <span className="text-amber-400 font-semibold">Pune Swargate &rarr; Talegaon &rarr; Induri &rarr; Kamshet &rarr; Lonavala ST Stand</span>
          </p>
        </div>

        {/* Live Simulation Control Dashboard */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 shadow-inner">
          {/* Play/Pause */}
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              isSimulationRunning
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-amber-600/20 text-amber-400 border border-amber-500/40 hover:bg-amber-600/30'
            }`}
          >
            {isSimulationRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Sim Running</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Sim Paused</span>
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Speed:</span>
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
                  simulationSpeed === spd
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset button */}
          <button
            onClick={resetDemoData}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Reset Fleet Positions"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Layout Controls & Tracking Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500" />
            Tracking Mode:
          </span>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveViewLayout('DUAL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeViewLayout === 'DUAL'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚡ Dual (Map + Track)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewLayout('BUS_TRACK_ONLY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeViewLayout === 'BUS_TRACK_ONLY'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Where Is My Bus Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewLayout('MAP_ONLY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeViewLayout === 'MAP_ONLY'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🗺️ Map Only</span>
            </button>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Active Bus: <strong className="text-white">{selectedBus?.busName || 'Express Bus'}</strong> (<strong className="text-amber-400">{selectedBus?.registrationNumber}</strong>)</span>
          <span>&bull;</span>
          <span className="text-emerald-400">{selectedBus?.currentSpeed} km/h</span>
        </div>
      </div>

      {/* Interactive Map Component (Rendered unless user switched to BUS_TRACK_ONLY) */}
      {activeViewLayout !== 'BUS_TRACK_ONLY' && (
        <LiveBusMap
          buses={buses}
          stops={stops}
          selectedBusId={selectedBusId}
          onSelectBus={(bus) => setSelectedBusId(bus.busId)}
          telemetries={telemetries}
        />
      )}

      {/* Bottom Section: Fleet Selector & Detailed Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Bus Fleet List with filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-red-500" />
                Corridor Fleet ({filteredBuses.length} active)
              </h3>
              <p className="text-[11px] text-slate-400">Click a bus to track live</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
              LIVE 4G
            </span>
          </div>

          {/* Search & Filter pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search bus number, depot, stop..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'ALL', label: 'All Buses' },
                { id: 'LALPARI', label: 'Lalpari' },
                { id: 'HIRKANI', label: 'Hirkani' },
                { id: 'SHIVSHAHI', label: 'Shivshahi' },
                { id: 'HIGH_OCCUPANCY', label: 'Overcrowded' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    filterType === f.id
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fleet List */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredBuses.map((b) => {
              const isSelected = b.busId === selectedBusId;
              const isCrowded = b.occupancyPercentage >= 85;

              return (
                <div
                  key={b.busId}
                  onClick={() => {
                    setSelectedBusId(b.busId);
                    setTrackingTab('BUS_TIMELINE');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-500'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs sm:text-sm">
                        {b.busName || b.registrationNumber}
                      </span>
                      {b.busName && (
                        <span className="font-mono text-[11px] text-slate-400">
                          ({b.registrationNumber})
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {b.busType.slice(0, 8)}
                      </span>
                    </div>

                    <div className={`text-xs font-bold font-mono ${isCrowded ? 'text-red-400' : 'text-emerald-400'}`}>
                      {b.occupancyPercentage}% Occupied
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">Near: <strong className="text-slate-200">{b.currentLocationName || b.nextStopName}</strong></span>
                    </div>

                    <div className="font-mono text-slate-300 flex items-center gap-1">
                      <span>{b.currentSpeed} km/h</span>
                      <span className="text-[10px] text-amber-400 font-bold ml-1">Track ➔</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2-Columns: Selected Bus Tracking Console */}
        {selectedBus && (
          <div className="lg:col-span-2 space-y-4">
            {/* View Switcher between Where Is My Bus Timeline and Raw Telemetry */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTrackingTab('BUS_TIMELINE')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    trackingTab === 'BUS_TIMELINE'
                      ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                      : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>Where Is My Bus Timeline</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-black/40 text-amber-300 font-mono font-bold">
                    LIVE
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackingTab('RAW_TELEMETRY')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    trackingTab === 'RAW_TELEMETRY'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>AIS-140 Diagnostics</span>
                </button>
              </div>

              <div className="text-xs font-mono text-slate-400 hidden sm:flex items-center gap-2 pr-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Tracking: <strong className="text-white">{selectedBus.registrationNumber}</strong></span>
              </div>
            </div>

            {/* TAB 1: Where Is My Bus Live Progression Timeline */}
            {trackingTab === 'BUS_TIMELINE' && (
              <WhereIsMyBusTracker
                bus={selectedBus}
                allStops={stops}
                allRoutes={routes}
                onOpenMap={() => {
                  setActiveViewLayout('DUAL');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* TAB 2: Comprehensive Telemetry Inspector */}
            {trackingTab === 'RAW_TELEMETRY' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                {/* Bus Header & Route Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                        Telemetry Stream Node &bull; {selectedBus.busId}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                        {selectedBus.status}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white font-mono flex items-center gap-3 mt-1">
                      <span>{selectedBus.registrationNumber}</span>
                      <span className="text-xs font-sans px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 font-bold">
                        {selectedBus.busType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Assigned Depot: <strong className="text-slate-200">{selectedBus.depotName}</strong> &bull; Driver: <strong className="text-slate-200">{selectedBus.driverName || 'Santosh Patil'}</strong>
                    </div>
                  </div>

                  {/* Direction & Status Tag */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => reverseBusDirection(selectedBus.busId)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition text-[11px] cursor-pointer"
                      title="Reverse simulated direction"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Direction: {selectedBus.direction || 'OUTBOUND'}</span>
                    </button>

                    {selectedBus.delayMinutes > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                        +{selectedBus.delayMinutes} min delay
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        On Schedule
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Telemetry Metrics 4-Pack */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 shadow">
                    <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                      <span>Current Speed</span>
                      <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-1">
                      {selectedBus.currentSpeed} <span className="text-xs text-slate-500 font-sans">km/h</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">GPS Doppler Calc</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 shadow">
                    <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                      <span>Passenger Load</span>
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-1">
                      {selectedBus.currentPassengerCount} <span className="text-xs text-slate-500">/ {selectedBus.capacity}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{selectedBus.occupancySource} sensor</div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 shadow">
                    <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                      <span>Capacity Level</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className={`text-2xl font-black font-mono mt-1 ${selectedBus.occupancyPercentage >= 85 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedBus.occupancyPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {Math.max(0, selectedBus.capacity - selectedBus.currentPassengerCount)} seats remaining
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 shadow">
                    <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
                      <span>Bearing / Heading</span>
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-1">
                      {selectedBus.heading || 0}&deg;
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Compass Heading</div>
                  </div>
                </div>

                {/* Approaching Next Stop Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs font-mono uppercase">Approaching Station:</div>
                      <div className="text-lg font-bold text-white">{selectedBus.nextStopName}</div>
                      <div className="text-xs text-slate-400">
                        Scheduled: <span className="text-slate-300 font-mono">{selectedBus.scheduledArrival}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-slate-400 text-xs font-mono uppercase">Predicted Arrival (Smart ETA):</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">{selectedBus.predictedArrival}</div>
                    <div className="text-[11px] text-slate-400">Adjusted for highway speed & stop dwell</div>
                  </div>
                </div>

                {/* Overcrowding Warning if >85% */}
                {selectedBus.occupancyPercentage >= 85 && (
                  <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center gap-3 text-red-300 text-xs">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <strong className="text-red-200">High Predicted Passenger Crowding Warning:</strong> This bus is running at {selectedBus.occupancyPercentage}% capacity. Boarding at upcoming stops may be restricted to standing room only. Commuters are advised to consider the next scheduled service if comfortable seating is required.
                    </div>
                  </div>
                )}

                {/* Hardware & IoT Diagnostics Packet (AIS-140 / ESP32 Standard Telemetry) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      AIS-140 IoT Telemetry Frame (Simulated ESP32)
                    </span>
                    <span>Last Packet: {new Date(selectedBus.lastUpdated).toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">GPS Coords</div>
                      <div className="text-white text-[11px] font-bold truncate mt-0.5">
                        {selectedBus.latitude.toFixed(4)}N, {selectedBus.longitude.toFixed(4)}E
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                        <span>Altitude & Sats</span>
                        <Satellite className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="text-white text-[11px] font-bold mt-0.5">
                        {selectedTelemetry?.altitude || 595}m &bull; {selectedTelemetry?.satellites || 11} Sats
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                        <span>Battery & Signal</span>
                        <Signal className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-white text-[11px] font-bold mt-0.5">
                        {selectedTelemetry?.batteryLevel || 98}% &bull; {selectedTelemetry?.signalStrengthDbm || -70} dBm
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase">Pneumatic Doors</div>
                      <div className="text-white text-[11px] font-bold mt-0.5">
                        <span className={selectedTelemetry?.doorStatus === 'OPEN' ? 'text-amber-400' : 'text-emerald-400'}>
                          {selectedTelemetry?.doorStatus || (selectedBus.currentSpeed < 5 ? 'OPEN' : 'CLOSED')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Simulation Injector Buttons for Demonstrators */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Live Demonstrator Injection:
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => injectDelay(selectedBus.busId, 5)}
                      className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/80 text-xs font-mono font-bold transition cursor-pointer"
                    >
                      +5m Toll Delay
                    </button>
                    <button
                      onClick={() => injectDelay(selectedBus.busId, 15)}
                      className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-mono font-bold transition cursor-pointer"
                    >
                      +15m Ghat Jam
                    </button>
                    <button
                      onClick={() => injectPassengerSpike(selectedBus.busId, 12)}
                      className="px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-800/80 text-xs font-mono font-bold transition cursor-pointer"
                    >
                      +12 Tourists Spike
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
