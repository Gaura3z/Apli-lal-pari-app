import React, { useState, useRef, useMemo } from 'react';
import { BusState, BusStop, GPSTelemetry } from '../types';
import { calculateDistanceKm } from '../utils/distance';
import { CORRIDOR_WAYPOINTS } from '../services/gpsSimulator';
import { WhereIsMyBusTracker } from './WhereIsMyBusTracker';
import { useTransit } from '../context/TransitContext';
import { 
  Navigation, 
  MapPin, 
  Layers, 
  Compass, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertCircle,
  Clock,
  Gauge,
  Users,
  ShieldCheck,
  ChevronRight,
  X,
  Bus
} from 'lucide-react';

interface LiveMapProps {
  buses: BusState[];
  stops: BusStop[];
  selectedBusId?: string;
  onSelectBus?: (bus: BusState) => void;
  highlightRouteId?: string;
  telemetries?: Record<string, GPSTelemetry>;
}

export const LiveBusMap: React.FC<LiveMapProps> = ({
  buses,
  stops,
  selectedBusId,
  onSelectBus,
  telemetries
}) => {
  // Map View Mode: 'GEOGRAPHIC' (interactive curved road map) vs 'SCHEMATIC' (Where-Is-My-Train style linear corridor)
  const [mapMode, setMapMode] = useState<'GEOGRAPHIC' | 'SCHEMATIC'>('GEOGRAPHIC');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [hoveredStop, setHoveredStop] = useState<BusStop | null>(null);

  // Geographic bounds for the Pune to Lonavala region
  // Latitude: 18.46 (South/Swargate) to 18.82 (North/Kamshet-Induri)
  // Longitude: 73.34 (West/Khandala) to 73.90 (East/Pune Station)
  const minLat = 18.47;
  const maxLat = 18.80;
  const minLon = 73.35;
  const maxLon = 73.89;

  // Convert GPS Coordinates to SVG percentages (0 - 100)
  const getCoordinatesPct = (lat: number, lon: number) => {
    // East -> higher lon -> right (x increases)
    // North -> higher lat -> top (y decreases)
    const x = ((lon - minLon) / (maxLon - minLon)) * 90 + 5;
    const y = 92 - ((lat - minLat) / (maxLat - minLat)) * 84;
    return {
      x: Math.min(97, Math.max(3, x)),
      y: Math.min(97, Math.max(3, y))
    };
  };

  // Build the high-resolution route path using all corridor waypoints
  const routePathD = useMemo(() => {
    return CORRIDOR_WAYPOINTS.reduce((acc, wp, idx) => {
      const pt = getCoordinatesPct(wp.lat, wp.lon);
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, []);

  const { routes } = useTransit();
  const selectedBus = buses.find((b) => b.busId === selectedBusId) || buses[0];
  const selectedTelemetry = selectedBus ? telemetries?.[selectedBus.busId] : undefined;

  // Linear station progression for Schematic View
  const corridorStops = useMemo(() => {
    return stops
      .filter((s) => ['Pune', 'Talegaon', 'Induri', 'Kamshet', 'Lonavala', 'Khandala'].some(c => s.city.includes(c) || s.name.includes(c)))
      .sort((a, b) => a.sequence - b.sequence);
  }, [stops]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* Top Map Header & Simulation Label */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>LIVE GPS TELEMETRY MAP</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">&bull; 4G/LTE ESP32 FEED</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Corridor: Pune &rarr; Talegaon &rarr; Induri &rarr; Kamshet &rarr; Lonavala
            </div>
          </div>
        </div>

        {/* View Switcher & Demo Notice */}
        <div className="flex items-center gap-2">
          {/* Prominent Simulated Notice */}
          <div className="px-2.5 py-1 rounded bg-red-950/80 border border-red-700/60 text-[10px] font-mono font-bold text-red-300">
            DEMO / SIMULATED DATA
          </div>

          {/* Mode Toggle Button */}
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setMapMode('GEOGRAPHIC')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                mapMode === 'GEOGRAPHIC'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Curved Map
            </button>
            <button
              onClick={() => setMapMode('SCHEMATIC')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                mapMode === 'SCHEMATIC'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Station Track
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Rendering Area */}
      <div className="relative w-full h-[420px] sm:h-[480px] bg-slate-950 overflow-hidden select-none">
        {mapMode === 'GEOGRAPHIC' ? (
          // GEOGRAPHIC INTERACTIVE VECTOR MAP
          <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transition-transform duration-300"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}%, ${panOffset.y}%)`,
                transformOrigin: 'center center'
              }}
              preserveAspectRatio="none"
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="geoGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#1e293b" strokeWidth="0.25" strokeDasharray="1,1" />
                </pattern>

                {/* Route Track Glow Filter */}
                <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.0" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Road Corridor Gradient */}
                <linearGradient id="nh48Gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="45%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                {/* Vehicle Marker Filter */}
                <filter id="busShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0.8" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Background Canvas */}
              <rect width="100" height="100" fill="#070b12" />
              <rect width="100" height="100" fill="url(#geoGrid)" opacity="0.4" />

              {/* Geographical Context & Terrain Features (Western Ghats & Indrayani River styling) */}
              <path
                d="M 5 60 Q 25 70 50 55 T 95 62"
                fill="none"
                stroke="#0284c7"
                strokeWidth="0.8"
                strokeOpacity="0.2"
                strokeDasharray="3,1"
              />
              <text x="35" y="66" fontSize="1.8" fill="#0284c7" opacity="0.3" fontStyle="italic">
                Indrayani River Basin
              </text>

              <path
                d="M 2 20 Q 20 15 40 25 T 90 18"
                fill="none"
                stroke="#334155"
                strokeWidth="0.6"
                strokeOpacity="0.3"
                strokeDasharray="2,2"
              />
              <text x="12" y="24" fontSize="1.8" fill="#64748b" opacity="0.35">
                Sahyadri Western Ghats Range
              </text>

              {/* Highway Outer Corridor Glow Track */}
              <path
                d={routePathD}
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.2"
                strokeOpacity="0.18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Highway Outer Border */}
              <path
                d={routePathD}
                fill="none"
                stroke="#334155"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main Active Highway Track (NH48) */}
              <path
                d={routePathD}
                fill="none"
                stroke="url(#nh48Gradient)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#corridorGlow)"
              />

              {/* Directional Chevrons along track */}
              <path
                d={routePathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.5"
                strokeDasharray="1, 4"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Bus Stops Nodes along Route */}
              {stops.map((stop) => {
                const pos = getCoordinatesPct(stop.latitude, stop.longitude);
                const isMajor = stop.isMajorTerminal;

                return (
                  <g
                    key={stop.stopId}
                    className="cursor-pointer group"
                    onClick={() => setHoveredStop(stop)}
                    onMouseEnter={() => setHoveredStop(stop)}
                  >
                    {/* Outer ring */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isMajor ? '1.9' : '1.3'}
                      fill="#090d16"
                      stroke={isMajor ? '#38bdf8' : '#64748b'}
                      strokeWidth={isMajor ? '0.7' : '0.4'}
                    />
                    {/* Inner core */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isMajor ? '0.9' : '0.6'}
                      fill={isMajor ? '#38bdf8' : '#94a3b8'}
                    />
                    {/* Stop Label */}
                    <text
                      x={pos.x}
                      y={pos.y - 2.4}
                      fontSize="2.2"
                      fill={isMajor ? '#e2e8f0' : '#94a3b8'}
                      textAnchor="middle"
                      fontWeight={isMajor ? '700' : '500'}
                      className="transition-all group-hover:fill-white font-sans pointer-events-none drop-shadow"
                    >
                      {stop.city || stop.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Real-time Moving Buses on Route */}
              {buses.map((bus) => {
                const pos = getCoordinatesPct(bus.latitude, bus.longitude);
                const isSelected = selectedBusId === bus.busId;
                const isCrowded = bus.occupancyPercentage >= 85;
                const headingAngle = bus.heading || 0;
                const isDelayed = bus.delayMinutes > 5;

                // Color accent according to bus type & status
                const markerColor =
                  bus.busType === 'SHIVSHAHI_AC'
                    ? '#2563eb'
                    : bus.busType === 'HIRKANI_SEMI_LUXURY' || bus.busType === 'HIRVANI_SEMI_LUXURY'
                    ? '#16a34a'
                    : bus.busType === 'E_SHIVAI' || bus.busType === 'E_SHIVAI_ELECTRIC'
                    ? '#0284c7'
                    : '#dc2626'; // Lalpari Ordinary Red

                return (
                  <g
                    key={bus.busId}
                    className="cursor-pointer transition-all duration-700 ease-out"
                    onClick={() => onSelectBus?.(bus)}
                  >
                    {/* Active Radar Beacon for selected / moving bus */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? '5.2' : '3.4'}
                      fill={isCrowded ? '#ef4444' : isDelayed ? '#f59e0b' : '#22c55e'}
                      opacity={isSelected ? '0.35' : '0.2'}
                      className="animate-ping"
                    />

                    {/* Outer Selection Highlight Ring */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="3.6"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="0.8"
                        strokeDasharray="1,1"
                      />
                    )}

                    {/* Bus Marker Body */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? '2.8' : '2.2'}
                      fill={markerColor}
                      stroke={isSelected ? '#ffffff' : '#0f172a'}
                      strokeWidth={isSelected ? '0.7' : '0.5'}
                      filter="url(#busShadow)"
                    />

                    {/* Directional Heading Pointer Arrow - visually shows bus direction */}
                    <g transform={`translate(${pos.x}, ${pos.y}) rotate(${headingAngle})`}>
                      <polygon
                        points="0,-3.4 1.2,-1.5 -1.2,-1.5"
                        fill="#fbbf24"
                        stroke="#0f172a"
                        strokeWidth="0.2"
                      />
                    </g>

                    {/* Bus Glyph Icon */}
                    <text
                      x={pos.x}
                      y={pos.y + 0.7}
                      fontSize={isSelected ? '1.8' : '1.4'}
                      fill="#ffffff"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none font-mono"
                    >
                      🚌
                    </text>

                    {/* Floating Info Tag: ONLY if this particular bus is selected! */}
                    {isSelected && (
                      <g className="pointer-events-none">
                        <rect
                          x={pos.x - 9.5}
                          y={pos.y + 4.2}
                          width="19"
                          height="5.4"
                          rx="1.5"
                          fill="#020617"
                          stroke="#fbbf24"
                          strokeWidth="0.6"
                          opacity="0.98"
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 7.6}
                          fontSize="2.1"
                          fontWeight="800"
                          textAnchor="middle"
                          fill="#fbbf24"
                          className="font-mono"
                        >
                          {bus.registrationNumber}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + 9.1}
                          fontSize="1.6"
                          fontWeight="600"
                          textAnchor="middle"
                          fill={isCrowded ? '#f87171' : '#34d399'}
                          className="font-mono"
                        >
                          {bus.currentSpeed} km/h • {bus.occupancyPercentage}% full
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Map Controls: Zoom in, Zoom out, Reset, Follow */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shadow-lg transition"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // SCHEMATIC LINEAR CORRIDOR TRACK VIEW (Where Is My Bus Timeline)
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-950">
            <WhereIsMyBusTracker
              bus={selectedBus}
              allStops={stops}
              allRoutes={routes}
              onOpenMap={() => setMapMode('GEOGRAPHIC')}
            />
          </div>
        )}

        {/* Hovered / Clicked Stop Floating HUD Panel */}
        {hoveredStop && !selectedBus && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 sm:p-4 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl">
                📍
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base">
                    {hoveredStop.name}
                  </span>
                  {hoveredStop.marathiName && (
                    <span className="text-amber-400/90 text-xs">
                      {hoveredStop.marathiName}
                    </span>
                  )}
                  {hoveredStop.isMajorTerminal && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      TERMINAL
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {hoveredStop.city} Division &bull; {hoveredStop.platforms || 4} Platforms / Bays &bull; Seq #{hoveredStop.sequence}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/stops?stand=${encodeURIComponent(hoveredStop.name)}`;
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer"
              >
                <span>Open Bus Stand Live Board &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setHoveredStop(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Selected Bus Floating HUD Panel */}
        {selectedBus && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 sm:p-4 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs z-20">
            {/* Bus Info - Clickable to open Where Is My Bus */}
            <div 
              onClick={() => setMapMode('SCHEMATIC')}
              className="flex items-center gap-3 cursor-pointer group"
              title="Click to open Where Is My Bus live track"
            >
              <div className="w-10 h-10 rounded-xl bg-red-600/20 group-hover:bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-500 font-black text-xl transition">
                🚌
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm sm:text-base group-hover:text-amber-300 transition">
                    {selectedBus.busName || selectedBus.registrationNumber}
                  </span>
                  {selectedBus.busName && (
                    <span className="text-xs font-mono text-slate-400">
                      ({selectedBus.registrationNumber})
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {selectedBus.busType.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {selectedBus.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Approaching: <strong className="text-slate-200">{selectedBus.nextStopName}</strong> &bull; Heading: {selectedBus.heading}&deg; &bull; <span className="text-amber-400 font-mono">Where Is My Bus ➔</span>
                </div>
              </div>
            </div>

            {/* Live Telemetry Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Live Speed</div>
                <div className="text-white font-bold text-sm flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  <span>{selectedBus.currentSpeed} km/h</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">
                  Occupancy ({selectedBus.occupancySource})
                </div>
                <div className={`font-bold text-sm ${selectedBus.occupancyPercentage >= 85 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedBus.currentPassengerCount} / {selectedBus.capacity} ({selectedBus.occupancyPercentage}%)
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Next Stop ETA</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {selectedBus.predictedArrival}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Delay Status</div>
                <div className={`font-bold text-sm ${selectedBus.delayMinutes > 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                  +{selectedBus.delayMinutes} min
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase">Updated</div>
                <div className="text-slate-400 text-[11px]">
                  {new Date(selectedBus.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMapMode('SCHEMATIC')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/60 transition cursor-pointer shrink-0 border border-white/20 active:scale-95"
                title="View in Where Is My Bus station-by-station progression timeline"
              >
                <Bus className="w-4 h-4 text-white" />
                <span>Where Is My Bus Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend & Corridor Notice */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available (&lt;70%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (70-85%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High Occupancy (&gt;85%)
          </span>
        </div>

        <div className="text-slate-500 font-mono text-[10px]">
          Hardware telemetry mock: AIS-140 GPS &bull; Frequency: 1.5s
        </div>
      </div>
    </div>
  );
};
