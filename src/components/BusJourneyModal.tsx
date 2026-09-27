import React, { useState } from 'react';
import { SearchResultItem, BusState } from '../types';
import { useTransit } from '../context/TransitContext';
import { WhereIsMyBusTracker } from './WhereIsMyBusTracker';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle, 
  Navigation, 
  CheckCircle2, 
  Radio, 
  X, 
  Calendar,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { formatBusType } from '../utils/formatters';

interface BusJourneyModalProps {
  item: SearchResultItem;
  onClose: () => void;
  onTrackLive: (bus: BusState) => void;
}

export const BusJourneyModal: React.FC<BusJourneyModalProps> = ({
  item,
  onClose,
  onTrackLive
}) => {
  const { stops, routes, buses } = useTransit();
  const [modalTab, setModalTab] = useState<'BUS_TIMELINE' | 'CORRIDOR_SUMMARY'>('BUS_TIMELINE');

  const liveBus = buses.find((b) => b.busId === item.bus.busId) || item.bus;
  const { route, originStop, destinationStop, occupancyLevel, availableSeats } = item;
  const busTypeInfo = formatBusType(liveBus.busType);

  // Stop sequence visualization
  const busStopIndex = liveBus.currentStopIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header accent */}
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/80 shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-white text-lg tracking-wide flex items-center gap-1.5">
                <Bus className="w-5 h-5 text-red-500" />
                {liveBus.busName || liveBus.registrationNumber}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${busTypeInfo.color}`}>
                {busTypeInfo.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {route.direction || 'DIRECT'}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Corridor: <strong className="text-slate-200">{route.routeName}</strong>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setModalTab('BUS_TIMELINE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  modalTab === 'BUS_TIMELINE'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Where Is My Bus Timeline</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-black/40 text-amber-300 font-mono">LIVE</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('CORRIDOR_SUMMARY')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  modalTab === 'CORRIDOR_SUMMARY'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                <span>📋 Overview & Stops</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {modalTab === 'BUS_TIMELINE' ? (
            <WhereIsMyBusTracker
              bus={liveBus}
              allStops={stops}
              allRoutes={routes}
              onOpenMap={() => {
                onClose();
                onTrackLive(liveBus);
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Key Live Status Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-400" />
                    Arrival ETA
                  </div>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {item.etaMinutes} min
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Pred: {item.predictedArrival} {item.delayMinutes > 0 ? `(+${item.delayMinutes}m)` : ''}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-400" />
                    Occupancy
                  </div>
                  <div className={`text-lg font-black font-mono mt-1 ${
                    occupancyLevel === 'FULL' || occupancyLevel === 'HIGH' ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {liveBus.occupancyPercentage}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {availableSeats} seats free &bull; {item.occupancySource}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-amber-400" />
                    Current Speed
                  </div>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {liveBus.currentSpeed} km/h
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Near: {liveBus.currentLocationName || liveBus.nextStopName}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    Trip Status
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ACTIVE ON ROUTE
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {liveBus.currentTripId || 'TRIP-EXP-101'}
                  </div>
                </div>
              </div>

              {/* High occupancy warning if applicable */}
              {item.warningMessage && (
                <div className="p-3 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{item.warningMessage}</span>
                </div>
              )}

              {/* ROUTE STOP VISUALIZATION */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Complete Corridor Stop Visualization
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {route.stops.length} stations on route
                  </span>
                </div>

                <div className="relative pl-6 py-2 space-y-4">
                  <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-800" />

                  {route.stops.map((stop, idx) => {
                    const isPassed = idx < busStopIndex;
                    const isCurrent = idx === busStopIndex;
                    const isBoarding = stop.stopId === originStop.stopId;
                    const isAlighting = stop.stopId === destinationStop.stopId;

                    return (
                      <div key={stop.stopId} className="relative flex items-start gap-3">
                        <div className="relative -ml-[19px] shrink-0 mt-0.5">
                          {isCurrent ? (
                            <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg shadow-red-600 animate-pulse">
                              <Bus className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : isPassed ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            </div>
                          ) : (
                            <div className={`w-3.5 h-3.5 rounded-full border ${
                              isBoarding || isAlighting ? 'bg-amber-500 border-amber-300' : 'bg-slate-900 border-slate-700'
                            }`} />
                          )}
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-xs ${
                                isCurrent ? 'text-red-400 font-bold' : isPassed ? 'text-slate-500 line-through' : 'text-slate-200'
                              }`}>
                                {stop.name}
                              </span>
                              {isBoarding && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                  YOUR BOARDING
                                </span>
                              )}
                              {isAlighting && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                                  YOUR DESTINATION
                                </span>
                              )}
                            </div>
                            {stop.marathiName && (
                              <div className="text-[10px] text-slate-500">{stop.marathiName}</div>
                            )}
                          </div>

                          <div className="text-[10px] font-mono text-slate-400">
                            {isCurrent ? (
                              <span className="text-amber-400 font-bold">● BUS HERE NOW</span>
                            ) : isPassed ? (
                              <span className="text-slate-600">Passed</span>
                            ) : isBoarding ? (
                              <span className="text-sky-400 font-bold">ETA: ~{item.etaMinutes} min</span>
                            ) : (
                              <span>Station #{idx + 1}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:block font-mono">
            {liveBus.registrationNumber} &bull; Driver: {liveBus.driverName || 'Eknath Shinde'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onTrackLive(liveBus);
              }}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950 cursor-pointer active:scale-95 transition"
            >
              <Navigation className="w-4 h-4" />
              <span>Track Live on Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
