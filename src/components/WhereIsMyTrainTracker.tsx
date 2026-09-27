import React, { useState, useMemo } from 'react';
import { BusState, BusStop, BusRoute } from '../types';
import { calculateDistanceKm, formatMinutesToTime } from '../utils/distance';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Gauge, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  BellRing, 
  Share2, 
  Compass, 
  Navigation, 
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface WhereIsMyBusTrackerProps {
  bus: BusState;
  allStops: BusStop[];
  allRoutes: BusRoute[];
  onOpenMap?: () => void;
  className?: string;
}

export const WhereIsMyBusTracker: React.FC<WhereIsMyBusTrackerProps> = ({
  bus,
  allStops,
  allRoutes,
  onOpenMap,
  className = ''
}) => {
  const [alarmStopId, setAlarmStopId] = useState<string | null>(null);
  const [alarmToast, setAlarmToast] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [commuterMode, setCommuterMode] = useState<'INSIDE_BUS' | 'WAITING_AT_STAND'>('WAITING_AT_STAND');

  // Match the active route for this bus
  const activeRoute = useMemo(() => {
    return allRoutes.find(r => r.routeId === bus.routeId) || allRoutes[0];
  }, [bus.routeId, allRoutes]);

  // Stops on this route in the travel direction
  const routeStops = useMemo(() => {
    return activeRoute?.stops || allStops;
  }, [activeRoute, allStops]);

  // Compute cumulative distances and schedule benchmarks for every stop
  const stopsWithTiming = useMemo(() => {
    let cumulativeKm = 0;
    const isOutbound = bus.direction !== 'INBOUND';
    const baseHour = 10;
    const baseMin = 15;

    return routeStops.map((stop, index) => {
      if (index > 0) {
        const prev = routeStops[index - 1];
        cumulativeKm += calculateDistanceKm(prev.latitude, prev.longitude, stop.latitude, stop.longitude);
      }

      // Schedule estimation
      const totalMinutesFromStart = Math.round((cumulativeKm / 42) * 60);
      const schHour = (baseHour + Math.floor((baseMin + totalMinutesFromStart) / 60)) % 24;
      const schMin = (baseMin + totalMinutesFromStart) % 60;
      const schTimeStr = `${schHour.toString().padStart(2, '0')}:${schMin.toString().padStart(2, '0')} ${schHour >= 12 ? 'PM' : 'AM'}`;

      // Expected time factoring live delay
      const expMinutesFromStart = totalMinutesFromStart + (bus.delayMinutes || 0);
      const expHour = (baseHour + Math.floor((baseMin + expMinutesFromStart) / 60)) % 24;
      const expMin = (baseMin + expMinutesFromStart) % 60;
      const expTimeStr = `${expHour.toString().padStart(2, '0')}:${expMin.toString().padStart(2, '0')} ${expHour >= 12 ? 'PM' : 'AM'}`;

      // Calculate distance from bus's live GPS to this stop
      const distFromBusKm = Math.round(calculateDistanceKm(bus.latitude, bus.longitude, stop.latitude, stop.longitude) * 10) / 10;

      // Status
      let status: 'PASSED' | 'CURRENT' | 'UPCOMING';
      if (index < bus.currentStopIndex) {
        status = 'PASSED';
      } else if (index === bus.currentStopIndex) {
        status = 'CURRENT';
      } else {
        status = 'UPCOMING';
      }

      return {
        stop,
        index,
        cumulativeKm: Math.round(cumulativeKm * 10) / 10,
        distFromBusKm,
        schTimeStr,
        expTimeStr,
        status,
        isNext: index === bus.currentStopIndex + 1 || (index === bus.currentStopIndex && distFromBusKm > 1.5)
      };
    });
  }, [routeStops, bus]);

  const currentStopItem = stopsWithTiming[Math.min(bus.currentStopIndex, stopsWithTiming.length - 1)];
  const nextStopItem = stopsWithTiming[Math.min(bus.currentStopIndex + 1, stopsWithTiming.length - 1)];

  const distToNext = currentStopItem && nextStopItem 
    ? Math.max(0.5, Math.round(calculateDistanceKm(bus.latitude, bus.longitude, nextStopItem.stop.latitude, nextStopItem.stop.longitude) * 10) / 10)
    : 2.5;

  const handleShare = () => {
    const url = `${window.location.origin}/live-tracking?bus=${bus.busId}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleAlarm = (stopId: string, stopName: string) => {
    if (alarmStopId === stopId) {
      setAlarmStopId(null);
      setAlarmToast(`Alarm cleared for ${stopName}`);
    } else {
      setAlarmStopId(stopId);
      setAlarmToast(`🔔 Wake-up Alarm set! You will be alerted 10 minutes before ${stopName}.`);
    }
    setTimeout(() => setAlarmToast(null), 3500);
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      {/* 1. Live Bus Status Header Banner */}
      <div className={`p-4 sm:p-5 text-white transition-colors duration-300 ${
        bus.delayMinutes > 5
          ? 'bg-gradient-to-r from-amber-900/90 via-amber-800/80 to-slate-900'
          : 'bg-gradient-to-r from-emerald-900/90 via-teal-900/80 to-slate-900'
      } border-b border-slate-800/80`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Bus Name (Prominent), Bus Number & Route */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-amber-400" />
                <span>{bus.busName || 'State Transport Express'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-black/50 border border-amber-400/40 text-xs font-mono font-black tracking-wide text-amber-300">
                {bus.registrationNumber}
              </span>
              <span className="text-xs font-bold text-white/90">
                {activeRoute.routeName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/90 uppercase border border-white/10">
                {bus.busType.replace('_', ' ')}
              </span>
            </div>

            {/* Dynamic Status Punchline (Live Bus GPS State) */}
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span>
                {bus.currentSpeed > 5
                  ? `Cruising @ ${bus.currentSpeed} km/h towards ${bus.nextStopName}`
                  : `At ${bus.currentLocationName || bus.nextStopName} (Boarding Bay)`
                }
              </span>
            </div>

            <div className="text-xs text-white/70 flex flex-wrap items-center gap-3">
              <span>Next Stop in <strong className="text-white">{bus.predictedArrival}</strong> ({distToNext} km away)</span>
              <span>&bull;</span>
              <span className={bus.delayMinutes > 0 ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
                {bus.delayMinutes > 0 ? `Running +${bus.delayMinutes} min late` : 'Running On Time'}
              </span>
              <span>&bull;</span>
              <span className="font-mono text-[11px] text-white/60">AIS-140 Bus GPS Telemetry</span>
            </div>
          </div>

          {/* Quick Commuter Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="View on Map"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>View On Map</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Share Live Bus Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commuter Mode Pill & Notification Banner */}
      <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Tracking Mode:</span>
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setCommuterMode('WAITING_AT_STAND')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                commuterMode === 'WAITING_AT_STAND'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              At Bus Stand / Stop
            </button>
            <button
              type="button"
              onClick={() => setCommuterMode('INSIDE_BUS')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                commuterMode === 'INSIDE_BUS'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Inside This Bus</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>

        {commuterMode === 'INSIDE_BUS' && (
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5" />
            <span>Speedometer Active &bull; Next stop alarm armed</span>
          </div>
        )}
      </div>

      {/* Alarm Set Toast Alert Banner */}
      {alarmToast && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 font-bold text-xs flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>{alarmToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlarmToast(null)}
            className="text-slate-900 hover:text-black font-extrabold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Live Telemetry Strip */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-mono block">GPS Speed</span>
          <span className="font-mono font-bold text-white flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            {bus.currentSpeed} km/h
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Occupancy</span>
          <span className={`font-mono font-bold ${bus.occupancyPercentage >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
            {bus.currentPassengerCount} / {bus.capacity} seats ({bus.occupancyPercentage}%)
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Travel Direction</span>
          <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            {bus.direction === 'OUTBOUND' ? 'Outbound ➔ Lonavala' : 'Inbound ➔ Pune'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Bus Trip ID</span>
          <span className="font-mono text-slate-300 truncate block">
            {bus.currentTripId || 'TRIP-EXP-48'}
          </span>
        </div>
      </div>

      {/* 3. VERTICAL STATION-BY-STATION PROGRESSION TIMELINE */}
      <div className="p-4 sm:p-6 bg-slate-900/60 space-y-1">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs text-slate-400">
          <span className="font-mono uppercase font-bold tracking-wider text-[11px] text-slate-300">
            Bus Stand &bull; Platform / Bay
          </span>
          <div className="flex items-center gap-8 font-mono uppercase font-bold tracking-wider text-[11px] text-slate-300">
            <span>Scheduled</span>
            <span>Expected / Status</span>
          </div>
        </div>

        {/* Station Nodes List */}
        <div className="relative">
          {/* Continuous vertical corridor line */}
          <div className="absolute left-[21px] top-4 bottom-4 w-1 bg-slate-800 rounded-full pointer-events-none" />
          {stopsWithTiming.map((item, idx) => {
            const isLast = idx === stopsWithTiming.length - 1;
            const isPassed = item.status === 'PASSED';
            const isCurrent = item.status === 'CURRENT';
            const isNext = item.isNext;
            const hasAlarm = alarmStopId === item.stop.stopId;

            return (
              <div key={item.stop.stopId} className="relative group">
                {/* Station Line Row */}
                <div className={`flex items-center justify-between py-3 px-3 rounded-2xl transition ${
                  isNext 
                    ? 'bg-amber-950/20 border border-amber-500/30' 
                    : isCurrent 
                    ? 'bg-slate-800/40' 
                    : 'hover:bg-slate-800/20'
                }`}>
                  {/* Left Side: Indicator + Station Name */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    {/* Circle Node Icon on the Corridor Track */}
                    <div className="relative flex items-center justify-center">
                      {isPassed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/60">
                          <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isNext ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md shadow-amber-950/60 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Station Name & Platform */}
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${
                          isPassed 
                            ? 'text-slate-300' 
                            : isNext 
                            ? 'text-amber-300 font-extrabold text-base' 
                            : 'text-white'
                        }`}>
                          {item.stop.name}
                        </span>

                        {item.stop.isMajorTerminal && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                            BUS TERMINAL
                          </span>
                        )}

                        {isNext && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0">
                            NEXT STOP
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>{item.stop.city} &bull; Bay / Platform {item.stop.platforms ? Math.min(item.stop.platforms, (idx % 4) + 1) : 1}</span>
                        <span>&bull;</span>
                        <span>{item.cumulativeKm} km</span>
                        {item.distFromBusKm > 0 && !isPassed && (
                          <span className="text-amber-400/90 font-medium">({item.distFromBusKm} km away)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Times & Alarm Action */}
                  <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                    <div className="hidden sm:block text-slate-400 text-xs">
                      {item.schTimeStr}
                    </div>

                    <div className="w-24 sm:w-28 text-right">
                      {isPassed ? (
                        <div>
                          <span className="text-xs font-bold text-emerald-400">
                            {item.schTimeStr}
                          </span>
                          <span className="text-[10px] text-emerald-500/80 block">Departed</span>
                        </div>
                      ) : isNext ? (
                        <div>
                          <span className="text-xs font-black text-amber-300">
                            {item.expTimeStr}
                          </span>
                          <span className="text-[10px] text-amber-400 block font-bold">
                            in ~{bus.predictedArrival}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-semibold text-slate-300">
                            {item.expTimeStr}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {bus.delayMinutes > 0 ? `+${bus.delayMinutes}m` : 'On time'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Alarm Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAlarm(item.stop.stopId, item.stop.name)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        hasAlarm 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/40' 
                          : 'bg-slate-950 text-slate-500 hover:text-slate-300 border-slate-800'
                      }`}
                      title={hasAlarm ? 'Alarm Set for this stop' : 'Set Arrival Alarm'}
                    >
                      {hasAlarm ? (
                        <BellRing className="w-3.5 h-3.5 animate-bounce" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* THE LIVE MOVING BUS INDICATOR ON THE CORRIDOR */}
                {/* Rendered directly between the current stop and the next stop */}
                {isCurrent && !isLast && (
                  <div className="relative my-2 pl-3 sm:pl-4">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-slate-950 to-slate-900 border-2 border-red-500 shadow-xl shadow-red-950/60 flex items-center justify-between gap-3 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-600 border border-red-400 flex items-center justify-center text-white font-black text-lg shadow-md animate-pulse">
                          🚌
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-amber-400">
                              LIVE BUS HERE &bull; {bus.busName || bus.registrationNumber}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-600 text-white font-bold">
                              EN ROUTE
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 font-medium">
                            Between <strong className="text-white">{item.stop.name.split(' ')[0]}</strong> and <strong className="text-amber-300">{nextStopItem?.stop.name.split(' ')[0]}</strong> ({bus.registrationNumber})
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <div className="text-xs font-black text-emerald-400 flex items-center justify-end gap-1">
                          <Gauge className="w-3.5 h-3.5 text-blue-400" />
                          <span>{bus.currentSpeed} km/h</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {distToNext} km to next stop
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Footer Info */}
      <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AIS-140 Certified Onboard Bus GPS Tracker &bull; 100% Real-Time Corridor Progression</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          MSRTC Division Control Room Live Feed
        </div>
      </div>
    </div>
  );
};

// Aliased export for full backward compatibility
export const WhereIsMyTrainTracker = WhereIsMyBusTracker;
