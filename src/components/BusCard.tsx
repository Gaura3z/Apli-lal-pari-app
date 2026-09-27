import React, { useState } from 'react';
import { BusState, ETAPrediction, SearchResultItem } from '../types';
import { calculatePredictedETA } from '../services/etaEngine';
import { 
  Bus, 
  Clock, 
  Users, 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Info,
  Route,
  ArrowRight
} from 'lucide-react';
import { formatBusType } from '../utils/formatters';

interface BusCardProps {
  bus: BusState;
  destinationName: string;
  destinationLat: number;
  destinationLon: number;
  onTrackOnMap: (bus: BusState) => void;
  onTrackWhereIsMyBus?: (bus: BusState) => void;
  onTrackWhereIsMyTrain?: (bus: BusState) => void;
  searchItem?: SearchResultItem;
  onViewDetails?: (item: SearchResultItem) => void;
}

export const BusCard: React.FC<BusCardProps> = ({
  bus,
  destinationName,
  destinationLat,
  destinationLon,
  onTrackOnMap,
  onTrackWhereIsMyBus,
  onTrackWhereIsMyTrain,
  searchItem,
  onViewDetails
}) => {
  const [showPredictionDetails, setShowPredictionDetails] = useState(false);
  const handleTrackBusProgression = onTrackWhereIsMyBus || onTrackWhereIsMyTrain;

  // Compute live ETA & crowd forecast using our modular engine
  const etaPrediction: ETAPrediction = calculatePredictedETA(
    bus,
    destinationLat,
    destinationLon,
    destinationName
  );

  const occupancyPercent = searchItem ? searchItem.occupancyPercentage : bus.occupancyPercentage;
  const availableSeats = searchItem ? searchItem.availableSeats : Math.max(0, bus.capacity - bus.currentPassengerCount);
  const busTypeInfo = formatBusType(bus.busType);

  // Standardized 4-level occupancy logic from Prompt (0-50: LOW, 51-75: MODERATE, 76-90: HIGH, 91-100: FULL)
  const getOccupancyBadge = () => {
    if (occupancyPercent > 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800">
          <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
          Full ({occupancyPercent}%)
        </span>
      );
    }
    if (occupancyPercent > 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          High ({occupancyPercent}%)
        </span>
      );
    }
    if (occupancyPercent > 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
          Moderate ({occupancyPercent}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
        Available / Low ({occupancyPercent}%)
      </span>
    );
  };

  const etaMinutes = searchItem ? searchItem.etaMinutes : Math.max(1, Math.round(calculatePredictedETA(bus, destinationLat, destinationLon, destinationName).delayMinutes + 6));
  const scheduledTime = searchItem ? searchItem.scheduledArrival : etaPrediction.scheduledArrival;
  const predictedTime = searchItem ? searchItem.predictedArrival : etaPrediction.predictedArrival;
  const delayMin = searchItem ? searchItem.delayMinutes : bus.delayMinutes;
  const currentLocation = searchItem ? searchItem.currentLocationName : (bus.currentLocationName || 'En route');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all duration-200 shadow-xl relative overflow-hidden group">
      {/* Top red header accent stripe for Lalpari signature style */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

      {/* Main card body */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Bus Identity, Route & Location */}
        <div className="space-y-1.5 flex-1">
          {/* Corridor route tagline */}
          {searchItem && (
            <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>{searchItem.route.origin}</span>
              <ArrowRight className="w-3 h-3 text-red-500 inline" />
              <span className="text-white">{searchItem.route.destination}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-amber-400">{searchItem.route.direction || 'DIRECT'}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-base font-extrabold text-white tracking-wide">
              <Bus className="w-5 h-5 text-red-500" />
              <span>{bus.busName || bus.registrationNumber}</span>
              {bus.busName && (
                <span className="text-xs font-mono font-normal text-slate-400">({bus.registrationNumber})</span>
              )}
            </div>

            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${busTypeInfo.color}`}>
              {busTypeInfo.label}
            </span>

            {getOccupancyBadge()}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (handleTrackBusProgression) {
                  handleTrackBusProgression(bus);
                } else {
                  onTrackOnMap(bus);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 hover:border-red-500 text-red-200 hover:text-white transition group cursor-pointer shadow-sm text-left"
              title="Click on bus location to see live Where Is My Bus tracking"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <MapPin className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform shrink-0" />
              <span>
                Current Location: <strong className="text-white underline decoration-amber-400 decoration-1 underline-offset-2">{currentLocation}</strong>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 ml-1 whitespace-nowrap">
                Track Live ➔
              </span>
            </button>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-slate-500" />
              Next Stop: <strong className="text-slate-300">{bus.nextStopName}</strong>
            </span>
            <span>&bull;</span>
            <span className="font-mono text-slate-400">Speed: {bus.currentSpeed} km/h</span>
          </div>
        </div>

        {/* Middle: ETA & Capacity Metrics */}
        <div className="flex items-center gap-5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              ETA
            </div>
            <div className="text-xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{etaMinutes} min</span>
              {delayMin > 0 ? (
                <span className="text-xs font-bold text-amber-400">
                  (+{delayMin}m)
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400">On Time</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Sched: {scheduledTime} &bull; Pred: {predictedTime}
            </div>
          </div>

          {/* Capacity & Occupancy */}
          <div className="border-l border-slate-800 pl-4">
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Capacity
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono ${
                occupancyPercent > 75 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {occupancyPercent}%
              </span>
              <span className="text-xs text-slate-300 font-medium">
                ~{availableSeats} seats left
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span>{bus.occupancySource === 'MEASURED' ? 'Measured Occupancy' : 'Estimated Occupancy'}</span>
              <span title={bus.occupancySource === 'MEASURED' ? 'Verified by onboard door sensor' : 'Calculated by historical boarding algorithms'}>
                <Info className="w-2.5 h-2.5 text-slate-400 inline" />
              </span>
            </div>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex md:flex-col items-center gap-2 justify-end shrink-0">
          {/* Primary Where Is My Bus Track Button */}
          <button
            type="button"
            onClick={() => {
              if (handleTrackBusProgression) {
                handleTrackBusProgression(bus);
              } else {
                onTrackOnMap(bus);
              }
            }}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all cursor-pointer active:scale-95 border border-white/20"
            title="Open Where Is My Bus Live Running Status"
          >
            <Bus className="w-4 h-4 text-white" />
            <span>Where Is My Bus</span>
          </button>

          <button
            onClick={() => onTrackOnMap(bus)}
            className="w-full md:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="Track on Interactive Map"
          >
            <Navigation className="w-3 h-3 text-sky-400" />
            <span>Map Radar</span>
          </button>

          {searchItem && onViewDetails && (
            <button
              onClick={() => onViewDetails(searchItem)}
              className="w-full md:w-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1 border border-slate-700 transition cursor-pointer"
            >
              <Route className="w-3 h-3 text-amber-400" />
              <span>Route Details</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {!searchItem && (
            <button
              onClick={() => setShowPredictionDetails(!showPredictionDetails)}
              className="w-full md:w-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1 border border-slate-700 transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{showPredictionDetails ? 'Hide Forecast' : 'AI Forecast'}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showPredictionDetails ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* High Occupancy Warning Alert Box */}
      {(occupancyPercent >= 85 || (searchItem && searchItem.warningMessage)) && (
        <div className="mt-3.5 bg-red-950/50 border border-red-800/70 rounded-2xl p-2.5 px-3 flex items-center gap-2 text-xs text-red-300">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>High occupancy expected at your boarding stop.</strong> Only ~{availableSeats} seats remaining upon arrival.
          </span>
        </div>
      )}

      {/* Collapsible Modular AI Crowd & ETA Explanation Card (when not in modal) */}
      {showPredictionDetails && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-2xl text-xs">
          <div>
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Intelligent ETA Factors
            </div>
            <p className="text-slate-400 leading-relaxed">
              Calculated using live telemetry, highway congestion coefficients (+{etaPrediction.delayMinutes}m delay),
              and time-of-day traffic patterns.
            </p>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-1">Upcoming Stop Prediction</div>
            <div className="space-y-1 text-slate-300">
              <div>Predicted Occupancy at Boarding: <span className="font-bold text-white">{etaPrediction.occupancyAtArrival.predictedOccupancyPercent}%</span></div>
              <div>Estimated Available Seats: <span className="font-bold text-emerald-400">~{etaPrediction.occupancyAtArrival.predictedAvailableSeats} seats</span></div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-200 mb-1">Confidence & Telemetry Source</div>
            <div className="text-slate-400 space-y-1">
              <div>Algorithm Confidence: <span className="text-sky-400 font-bold">{etaPrediction.confidenceScore}%</span></div>
              <div>Telemetry Mode: <span className="text-amber-400 font-semibold font-mono">SIMULATED GPS</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
