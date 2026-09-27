import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTransit } from '../context/TransitContext';
import { 
  BusState, 
  DriverIssueType, 
  TripStatus, 
  GPSConnectionStatus, 
  DriverReport
} from '../types';
import { 
  Bus, 
  MapPin, 
  Gauge, 
  Users, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2,
  Navigation,
  Send,
  Radio,
  Clock,
  Compass,
  Zap,
  RotateCcw,
  Sliders,
  AlertCircle,
  Plus,
  Minus,
  Check,
  Circle,
  FileText,
  Lock,
  Wifi,
  WifiOff,
  UserCheck
} from 'lucide-react';
import { calculateDistanceKm } from '../utils/distance';

export const DriverDashboard: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const { 
    buses, 
    telemetries, 
    driverReports, 
    auditLogs,
    startTrip, 
    pauseTrip, 
    resumeTrip, 
    endTrip, 
    setBusPassengerCount, 
    reportDriverIssue, 
    simulateGpsSignalLost,
    isSimulationRunning,
    simulationSpeed,
    toggleSimulation,
    setSimulationSpeed,
    injectDelay,
    resetDemoData
  } = useTransit();

  // Strict Driver Isolation: Only get the bus assigned to this authenticated driver
  const assignedBusId = userProfile?.assignedBusId || 'bus-mh14-8841';
  const assignedBus = buses.find((b) => b.busId === assignedBusId) || buses[0];
  const busTelemetry = telemetries[assignedBus.busId];

  // Driver Trip State
  const tripId = assignedBus.currentTripId || 'TRIP-EXP-101';
  const rawTripStatus = (assignedBus as any).tripStatus || (assignedBus.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE');
  const [tripStatus, setTripStatus] = useState<TripStatus>(rawTripStatus);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Sync state if assigned bus updates externally
  useEffect(() => {
    setTripStatus((assignedBus as any).tripStatus || (assignedBus.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE'));
  }, [assignedBus]);

  // GPS Connection calculation (<10 seconds = Connected)
  const isGpsSignalLost = (assignedBus as any).gpsStatus === 'SIGNAL_LOST';
  const lastUpdatedMs = new Date(assignedBus.lastUpdated).getTime();
  const nowMs = Date.now();
  const secondsSinceUpdate = Math.max(0, Math.floor((nowMs - lastUpdatedMs) / 1000));
  const isGpsOnline = !isGpsSignalLost && isSimulationRunning && secondsSinceUpdate < 15;

  // Passenger Count Stepper
  const [passengerCount, setPassengerCount] = useState<number>(assignedBus.currentPassengerCount);
  useEffect(() => {
    setPassengerCount(assignedBus.currentPassengerCount);
  }, [assignedBus.currentPassengerCount]);

  const capacity = assignedBus.capacity || 50;
  const occupancyPercentage = Math.round((passengerCount / capacity) * 100);
  const remainingCapacity = Math.max(0, capacity - passengerCount);

  // Occupancy category
  const occupancyLevel = useMemo(() => {
    if (occupancyPercentage >= 91) return { label: 'FULL', color: 'text-red-400 bg-red-950/80 border-red-700' };
    if (occupancyPercentage >= 76) return { label: 'HIGH', color: 'text-amber-400 bg-amber-950/80 border-amber-700' };
    if (occupancyPercentage >= 51) return { label: 'MODERATE', color: 'text-yellow-400 bg-yellow-950/80 border-yellow-700' };
    return { label: 'LOW', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700' };
  }, [occupancyPercentage]);

  // Issue reporting form state
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueType, setIssueType] = useState<DriverIssueType>('TRAFFIC_DELAY');
  const [issueSeverity, setIssueSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueSuccessNotice, setIssueSuccessNotice] = useState(false);

  // Stop checklist progression
  const corridorStops = [
    { name: 'Pune Swargate', lat: 18.5018, lon: 73.8586 },
    { name: 'Talegaon Dabhade', lat: 18.7346, lon: 73.6766 },
    { name: 'Induri Phata', lat: 18.7725, lon: 73.6421 },
    { name: 'Kamshet Central', lat: 18.7569, lon: 73.5583 },
    { name: 'Lonavala ST Stand', lat: 18.7523, lon: 73.4072 }
  ];

  // Calculate stop milestones
  const stopMilestones = useMemo(() => {
    const isOutbound = assignedBus.direction !== 'INBOUND';
    const stopsList = isOutbound ? corridorStops : [...corridorStops].reverse();

    // Check which stop is closest or next
    let closestIdx = 0;
    let minDistance = Infinity;

    stopsList.forEach((st, idx) => {
      const d = calculateDistanceKm(assignedBus.latitude, assignedBus.longitude, st.lat, st.lon);
      if (d < minDistance) {
        minDistance = d;
        closestIdx = idx;
      }
    });

    return stopsList.map((st, idx) => {
      let state: 'PASSED' | 'CURRENT' | 'UPCOMING' = 'UPCOMING';
      if (idx < closestIdx) state = 'PASSED';
      else if (idx === closestIdx) state = 'CURRENT';
      return { ...st, state, distanceToBusKm: calculateDistanceKm(assignedBus.latitude, assignedBus.longitude, st.lat, st.lon) };
    });
  }, [assignedBus.latitude, assignedBus.longitude, assignedBus.direction]);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  const handleStartTrip = () => {
    setActionError(null);
    const res = startTrip(userProfile?.userId || 'usr-driver-1', assignedBus.busId, tripId, userProfile?.name);
    if (!res.success) {
      setActionError(res.error || 'Failed to start trip');
      return;
    }
    setTripStatus('ACTIVE');
    setActionSuccess('Trip started! Live telemetry broadcasting to passenger map.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handlePauseTrip = () => {
    setActionError(null);
    const res = pauseTrip(userProfile?.userId || 'usr-driver-1', assignedBus.busId, tripId, userProfile?.name);
    if (!res.success) {
      setActionError(res.error || 'Failed to pause trip');
      return;
    }
    setTripStatus('PAUSED');
    setActionSuccess('Trip paused. Status set to DELAYED.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleResumeTrip = () => {
    setActionError(null);
    const res = resumeTrip(userProfile?.userId || 'usr-driver-1', assignedBus.busId, tripId, userProfile?.name);
    if (!res.success) {
      setActionError(res.error || 'Failed to resume trip');
      return;
    }
    setTripStatus('ACTIVE');
    setActionSuccess('Trip resumed. Telemetry active.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleEndTrip = () => {
    setActionError(null);
    const res = endTrip(userProfile?.userId || 'usr-driver-1', assignedBus.busId, tripId, userProfile?.name);
    if (!res.success) {
      setActionError(res.error || 'Failed to end trip');
      return;
    }
    setTripStatus('COMPLETED');
    setActionSuccess('Trip concluded successfully. Bus marked COMPLETED.');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleUpdatePassengerCount = (newCount: number) => {
    const clamped = Math.max(0, Math.min(capacity, newCount));
    setPassengerCount(clamped);
    setBusPassengerCount(assignedBus.busId, clamped, userProfile?.userId || 'driver');
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription) return;

    setIsSubmittingIssue(true);
    await reportDriverIssue({
      driverId: userProfile?.userId || 'usr-driver-1',
      driverName: userProfile?.name || 'Santosh Patil',
      busId: assignedBus.busId,
      tripId,
      issueType,
      severity: issueSeverity,
      description: issueDescription,
      locationName: assignedBus.nextStopName
    });

    setIsSubmittingIssue(false);
    setIssueDescription('');
    setIssueModalOpen(false);
    setIssueSuccessNotice(true);
    setTimeout(() => setIssueSuccessNotice(false), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 px-2 sm:px-4">
      {/* Simulation Banner Notice */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">PROTOTYPE SIMULATION NOTICE:</span> This driver cockpit operates on{' '}
            <span className="font-mono underline">SIMULATED GPS TELEMETRY &amp; AIS-140 MOCK DATA</span>.
            Real MSRTC bus hardware is not physically connected.
          </div>
        </div>
        <div className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[11px] whitespace-nowrap">
          DEMO / SIMULATED DATA
        </div>
      </div>

      {/* Top Cockpit Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-900/60 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
            <Radio className="w-4 h-4 animate-pulse text-red-500" />
            MSRTC Mobile Cockpit &bull; AIS-140 GPS Connected
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Welcome, {userProfile?.name || 'Driver Santosh Patil'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Driver Badge: <span className="font-mono font-bold text-white">#402</span> &bull; Division:{' '}
            <span className="text-slate-200 font-semibold">{assignedBus.depotName}</span>
          </p>
        </div>

        {/* GPS Live Status Indicator & Driver Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${
              isGpsOnline
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}
          >
            {isGpsOnline ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <Wifi className="w-3.5 h-3.5" />
                <span>GPS CONNECTED</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>GPS SIGNAL LOST</span>
              </>
            )}
          </div>

          <div className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
            {assignedBus.registrationNumber}
          </div>
        </div>
      </div>

      {/* Action alerts */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {issueSuccessNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Issue dispatched to Depot Traffic Controller and broadcast to transit alert desk.</span>
        </div>
      )}

      {/* Main Bus & Trip Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Assigned Bus:
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-red-600/20 text-red-400 border border-red-500/30">
                BUS-101
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                {assignedBus.busType.replace('_', ' ')}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 flex items-center gap-3">
              <span>{assignedBus.registrationNumber}</span>
              <span className="text-xs font-sans text-slate-400 font-normal">
                (Reg: DEMO-MH-01)
              </span>
            </div>
            <div className="text-xs sm:text-sm text-amber-400 font-semibold mt-1 flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5" />
              <span>Assigned Route: Pune Swargate &rarr; Talegaon &rarr; Induri &rarr; Kamshet &rarr; Lonavala</span>
            </div>
          </div>

          {/* Trip Status Badge & Current Trip ID */}
          <div className="sm:text-right space-y-1">
            <div className="text-xs text-slate-400 font-mono">
              Current Trip ID: <strong className="text-white">{tripId}</strong>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-black border ${
                  tripStatus === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : tripStatus === 'PAUSED'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : tripStatus === 'COMPLETED'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                TRIP: {tripStatus}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Key Driver Telemetry Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-center">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3 text-blue-400" />
              <span>Speed</span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {assignedBus.currentSpeed} <span className="text-xs font-sans text-slate-500">km/h</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Passengers</span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {passengerCount} <span className="text-xs text-slate-500">/ {capacity}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Occupancy</span>
            </div>
            <div className={`text-xl font-black mt-1 ${occupancyPercentage >= 85 ? 'text-red-400' : 'text-emerald-400'}`}>
              {occupancyPercentage}%
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
              <Compass className="w-3 h-3 text-purple-400" />
              <span>Heading</span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {assignedBus.heading || 310}&deg;
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-red-400" />
              <span>Next Stop</span>
            </div>
            <div className="text-xs font-bold text-slate-200 mt-1.5 truncate">
              {assignedBus.nextStopName}
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Next ETA</span>
            </div>
            <div className="text-sm font-black text-emerald-400 mt-1.5">
              {assignedBus.predictedArrival}
            </div>
          </div>
        </div>

        {/* TRIP CONTROLS: Show only valid actions for the current trip state */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-red-500" />
              Driver Trip Operational Controls
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              State: {tripStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* NOT_STARTED: Only START TRIP is available */}
            {tripStatus === 'NOT_STARTED' && (
              <button
                onClick={handleStartTrip}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950"
              >
                <Play className="w-4 h-4 fill-current" />
                START TRIP
              </button>
            )}

            {/* ACTIVE: Can PAUSE or END TRIP */}
            {tripStatus === 'ACTIVE' && (
              <>
                <button
                  onClick={handlePauseTrip}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-amber-950"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  PAUSE TRIP
                </button>
                <button
                  onClick={handleEndTrip}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-red-950"
                >
                  <Square className="w-4 h-4 fill-current" />
                  END TRIP
                </button>
              </>
            )}

            {/* PAUSED: Can RESUME or END TRIP */}
            {tripStatus === 'PAUSED' && (
              <>
                <button
                  onClick={handleResumeTrip}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-950"
                >
                  <Play className="w-4 h-4 fill-current" />
                  RESUME TRIP
                </button>
                <button
                  onClick={handleEndTrip}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-red-950"
                >
                  <Square className="w-4 h-4 fill-current" />
                  END TRIP
                </button>
              </>
            )}

            {/* COMPLETED: No controls */}
            {tripStatus === 'COMPLETED' && (
              <div className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs font-mono text-slate-400">
                ✓ Trip successfully completed. Operational controls locked. Return to depot or wait for next schedule.
              </div>
            )}
          </div>
        </div>

        {/* PASSENGER CAPACITY MANAGEMENT (DEMO PASSENGER COUNT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Passenger Stepper Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Passenger Count Control
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  DEMO PASSENGER COUNT &bull; (Prototype Sensor Mock)
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${occupancyLevel.color}`}>
                {occupancyLevel.label}
              </span>
            </div>

            {/* Stepper display & buttons */}
            <div className="flex items-center justify-between gap-4 py-2">
              <button
                onClick={() => handleUpdatePassengerCount(passengerCount - 1)}
                disabled={passengerCount <= 0}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-white flex items-center justify-center text-xl font-bold cursor-pointer transition"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center font-mono">
                <div className="text-4xl font-black text-white">
                  {passengerCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Capacity: {capacity} &bull; Available: <strong className="text-emerald-400">{remainingCapacity}</strong>
                </div>
              </div>

              <button
                onClick={() => handleUpdatePassengerCount(passengerCount + 1)}
                disabled={passengerCount >= capacity}
                className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-white flex items-center justify-center text-xl font-bold cursor-pointer transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick multi-board buttons */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono font-bold">
              <button
                onClick={() => handleUpdatePassengerCount(passengerCount + 5)}
                disabled={passengerCount + 5 > capacity}
                className="py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 disabled:opacity-30 transition"
              >
                +5 Board
              </button>
              <button
                onClick={() => handleUpdatePassengerCount(passengerCount + 1)}
                disabled={passengerCount + 1 > capacity}
                className="py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 disabled:opacity-30 transition"
              >
                +1
              </button>
              <button
                onClick={() => handleUpdatePassengerCount(passengerCount - 5)}
                disabled={passengerCount - 5 < 0}
                className="py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 transition"
              >
                -5 Alight
              </button>
              <button
                onClick={() => handleUpdatePassengerCount(passengerCount - 1)}
                disabled={passengerCount - 1 < 0}
                className="py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 transition"
              >
                -1
              </button>
            </div>

            {/* Capacity Warning */}
            {passengerCount >= capacity && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs font-bold text-center animate-pulse">
                ⚠ FULL CAPACITY REACHED &bull; NO ADDITIONAL PASSENGERS PERMITTED
              </div>
            )}
          </div>

          {/* Issue Reporting Form Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Driver Incident / Delay Dispatch
              </span>
              <span className="text-[10px] font-mono text-slate-400">Direct to Depot</span>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                    Issue Category
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as DriverIssueType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="TRAFFIC_DELAY">Traffic Delay</option>
                    <option value="VEHICLE_PROBLEM">Vehicle Breakdown</option>
                    <option value="GPS_PROBLEM">GPS Hardware Fault</option>
                    <option value="ROUTE_PROBLEM">Route Diversion / Block</option>
                    <option value="EMERGENCY">Medical / Emergency</option>
                    <option value="OTHER">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                    Urgency Severity
                  </label>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Alert</option>
                    <option value="CRITICAL">Critical Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono uppercase mb-1">
                  Incident Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="e.g. Container jam at Somatne phata, expect 12m delay..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingIssue}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white text-xs flex items-center justify-center gap-1.5 transition shadow cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingIssue ? 'Transmitting...' : 'Dispatch Report to Depot'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* STOP-BY-STOP ROUTE PROGRESS CHECKLIST */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-400" />
              Live Route Station Progression
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Next Stop: <strong className="text-amber-400">{assignedBus.nextStopName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {stopMilestones.map((st) => (
              <div
                key={st.name}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  st.state === 'PASSED'
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                    : st.state === 'CURRENT'
                    ? 'bg-red-950/40 border-red-500 text-white ring-1 ring-red-500 shadow-md'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{st.name}</span>
                  {st.state === 'PASSED' ? (
                    <span className="text-emerald-400 text-xs font-black">✓</span>
                  ) : st.state === 'CURRENT' ? (
                    <span className="text-red-400 text-xs font-black animate-pulse">●</span>
                  ) : (
                    <span className="text-slate-600 text-xs">○</span>
                  )}
                </div>

                <div className="text-[10px] font-mono mt-2">
                  {st.state === 'PASSED' ? (
                    <span className="text-emerald-500">Crossed</span>
                  ) : st.state === 'CURRENT' ? (
                    <span className="text-amber-400 font-bold">NEXT STOP</span>
                  ) : (
                    <span className="text-slate-500">~{st.distanceToBusKm} km away</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DEMO CONTROLS (Clearly labeled for Innovation Evaluators) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-amber-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              DEMO SIMULATION CONTROLS (PROTOTYPE EVALUATION ONLY)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Not for production drivers</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Simulation speed controls */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 font-mono">
              <span className="text-slate-500 mr-1">Speed:</span>
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSimulationSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    simulationSpeed === s ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Delay simulator */}
            <button
              onClick={() => injectDelay(assignedBus.busId, 8)}
              className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 font-mono font-bold transition cursor-pointer"
            >
              +8m Traffic Delay
            </button>

            {/* GPS Signal Lost simulator */}
            <button
              onClick={() => simulateGpsSignalLost(assignedBus.busId, !isGpsSignalLost)}
              className={`px-3 py-1.5 rounded-xl border font-mono font-bold transition cursor-pointer ${
                isGpsSignalLost
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-red-950/60 border-red-700 text-red-300'
              }`}
            >
              {isGpsSignalLost ? 'Restore GPS Signal' : 'Simulate GPS Offline'}
            </button>

            {/* Reset */}
            <button
              onClick={resetDemoData}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono transition cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Fleet</span>
            </button>
          </div>
        </div>

        {/* AUDIT LOG FOR IMPORTANT DRIVER ACTIONS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-400" />
              Driver Operational Audit Trail
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Synced to Firestore auditLogs
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.logId}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{log.action}</span>
                  <span className="text-slate-400 truncate max-w-xs">{log.details}</span>
                </div>
                <span className="text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
