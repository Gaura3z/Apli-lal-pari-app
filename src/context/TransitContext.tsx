import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { 
  BusRoute, 
  BusState, 
  BusStop, 
  ServiceAlert, 
  GPSTelemetry,
  DriverReport,
  AuditLog,
  TripStatus,
  GPSConnectionStatus
} from '../types';
import { DEMO_ROUTES, DEMO_STOPS, INITIAL_BUSES, DEMO_ALERTS, DEMO_SCHEDULES } from '../lib/mockData';
import { searchBusServices } from '../services/searchEngine';
import { stepSimulation, createTelemetryPacket } from '../services/gpsSimulator';
import { db } from '../firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

interface TransitContextType {
  buses: BusState[];
  routes: BusRoute[];
  stops: BusStop[];
  alerts: ServiceAlert[];
  telemetries: Record<string, GPSTelemetry>;
  gpsLogs: GPSTelemetry[];
  driverReports: DriverReport[];
  auditLogs: AuditLog[];
  getTelemetry: (busId: string) => GPSTelemetry | undefined;
  isSimulationRunning: boolean;
  simulationSpeed: number; // 0.5x, 1x, 2x, 5x, 10x
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  updateBusTelemetry: (busId: string, updates: Partial<BusState>) => void;
  injectDelay: (busId: string, minutes: number) => void;
  injectPassengerSpike: (busId: string, addedCount: number) => void;
  reverseBusDirection: (busId: string) => void;
  addAlert: (alert: Omit<ServiceAlert, 'alertId' | 'createdAt'>) => void;
  resetDemoData: () => void;
  // Phase 4 Trip Management & Driver Controls
  startTrip: (driverId: string, busId: string, tripId: string, driverName?: string) => { success: boolean; error?: string };
  pauseTrip: (driverId: string, busId: string, tripId: string, driverName?: string) => { success: boolean; error?: string };
  resumeTrip: (driverId: string, busId: string, tripId: string, driverName?: string) => { success: boolean; error?: string };
  endTrip: (driverId: string, busId: string, tripId: string, driverName?: string) => { success: boolean; error?: string };
  setBusPassengerCount: (busId: string, count: number, updatedBy: string) => { success: boolean; error?: string };
  reportDriverIssue: (report: Omit<DriverReport, 'reportId' | 'timestamp' | 'status'> & { status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' }) => Promise<{ success: boolean; error?: string }>;
  simulateGpsSignalLost: (busId: string, isLost: boolean) => void;
  addAuditLog: (log: Omit<AuditLog, 'logId' | 'timestamp'>) => void;
  findBusesForJourney: (fromCityOrStop: string, toCityOrStop: string) => {
    routes: BusRoute[];
    matchingBuses: BusState[];
    originStop?: BusStop;
    destinationStop?: BusStop;
  };
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize buses with explicit tripStatus and gpsStatus
  const [buses, setBuses] = useState<BusState[]>(() => {
    // Clear legacy version if exists
    try {
      localStorage.removeItem('lalpari_buses_state');
      localStorage.removeItem('lalpari_buses_state_v2');
    } catch {
      // Ignore
    }

    const saved = localStorage.getItem('lalpari_buses_state_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_BUSES.length) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_BUSES.map((b) => ({
      ...b,
      tripStatus: (b.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE') as TripStatus,
      gpsStatus: 'CONNECTED' as GPSConnectionStatus
    }));
  });

  const [telemetries, setTelemetries] = useState<Record<string, GPSTelemetry>>(() => {
    const initialPackets: Record<string, GPSTelemetry> = {};
    const initialSource = buses.length > 0 ? buses : INITIAL_BUSES;
    initialSource.forEach((bus) => {
      initialPackets[bus.busId] = createTelemetryPacket(bus);
    });
    return initialPackets;
  });

  // Separate historical GPS logs storage
  const [gpsLogs, setGpsLogs] = useState<GPSTelemetry[]>(() => {
    const saved = localStorage.getItem('lalpari_gps_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Driver Reports storage
  const [driverReports, setDriverReports] = useState<DriverReport[]>(() => {
    const saved = localStorage.getItem('lalpari_driver_reports');
    return saved
      ? JSON.parse(saved)
      : [
          {
            reportId: 'rep-init-01',
            driverId: 'usr-driver-1',
            driverName: 'Santosh Patil',
            busId: 'bus-mh14-8841',
            tripId: 'trip-exp-101',
            issueType: 'TRAFFIC_DELAY',
            description: 'Slow-moving container truck traffic after Somatne Toll Plaza.',
            severity: 'MEDIUM',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'ACKNOWLEDGED'
          }
        ];
  });

  // Security & Operations Audit Logs storage
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('lalpari_audit_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            logId: 'audit-init-01',
            userId: 'usr-driver-1',
            userName: 'Santosh Patil',
            role: 'DRIVER',
            action: 'LOGIN_SUCCESS',
            busId: 'bus-mh14-8841',
            tripId: 'trip-exp-101',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'Driver authenticated successfully via secure terminal'
          }
        ];
  });

  const [routes] = useState<BusRoute[]>(DEMO_ROUTES);
  const [stops] = useState<BusStop[]>(DEMO_STOPS);
  const [alerts, setAlerts] = useState<ServiceAlert[]>(DEMO_ALERTS);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [, startTransition] = useTransition();

  // Save states locally
  useEffect(() => {
    try {
      localStorage.setItem('lalpari_buses_state_v3', JSON.stringify(buses));
    } catch {
      // Ignore
    }
  }, [buses]);

  useEffect(() => {
    try {
      localStorage.setItem('lalpari_gps_logs', JSON.stringify(gpsLogs.slice(-200)));
      localStorage.setItem('lalpari_driver_reports', JSON.stringify(driverReports));
      localStorage.setItem('lalpari_audit_logs', JSON.stringify(auditLogs.slice(-200)));
    } catch {
      // Ignore
    }
  }, [gpsLogs, driverReports, auditLogs]);

  // High-precision GPS simulation loop
  useEffect(() => {
    if (!isSimulationRunning) return;

    const tickInterval = Math.max(250, Math.round(1500 / simulationSpeed));

    const interval = setInterval(() => {
      startTransition(() => {
        setBuses((prevBuses) => {
          // Only advance buses whose tripStatus is 'ACTIVE' and gpsStatus is 'CONNECTED'
          const activeBuses = prevBuses.filter((b) => b.status === 'ACTIVE' && (b as any).gpsStatus !== 'SIGNAL_LOST');
          if (activeBuses.length === 0) return prevBuses;

          const { updatedBuses: simulatedActiveBuses, telemetries: newTelemetries } = stepSimulation(
            activeBuses,
            simulationSpeed
          );

          // Update telemetries record
          setTelemetries((prevTels) => {
            const nextTels = { ...prevTels };
            newTelemetries.forEach((pkt) => {
              nextTels[pkt.busId] = pkt;
            });
            return nextTels;
          });

          // Append to historical GPS logs (capped at 500 entries)
          setGpsLogs((prevLogs) => {
            const combined = [...prevLogs, ...newTelemetries];
            return combined.slice(-500);
          });

          // Map updated buses back into full fleet array
          const activeMap = new Map(simulatedActiveBuses.map((b) => [b.busId, b]));
          return prevBuses.map((b) => activeMap.get(b.busId) || b);
        });
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [isSimulationRunning, simulationSpeed]);

  const toggleSimulation = () => setIsSimulationRunning((prev) => !prev);

  const getTelemetry = (busId: string): GPSTelemetry | undefined => {
    return telemetries[busId];
  };

  const addAuditLog = (logEntry: Omit<AuditLog, 'logId' | 'timestamp'>) => {
    const entry: AuditLog = {
      ...logEntry,
      logId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [entry, ...prev]);

    // Firestore async sync
    try {
      addDoc(collection(db, 'auditLogs'), entry).catch(() => {});
    } catch {
      // offline fallback
    }
  };

  // ----------------------------------------------------
  // TRIP CONTROLS WITH STRICT DRIVER AUTHORIZATION
  // ----------------------------------------------------

  const startTrip = (
    driverId: string, 
    busId: string, 
    tripId: string,
    driverName: string = 'Driver'
  ): { success: boolean; error?: string } => {
    const targetBus = buses.find((b) => b.busId === busId);
    if (!targetBus) return { success: false, error: 'Assigned bus record not found' };

    // Strict validation: Driver can only start their assigned bus
    if (targetBus.driverId !== driverId && driverId !== 'usr-admin-super') {
      addAuditLog({
        userId: driverId,
        userName: driverName,
        role: 'DRIVER',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        busId,
        tripId,
        details: `Driver ${driverId} attempted unauthorized start on bus ${busId}`
      });
      return { success: false, error: 'Unauthorized: You are only permitted to operate your assigned bus.' };
    }

    // Invalid transition check: Cannot start a completed trip
    const currentTripStatus = (targetBus as any).tripStatus || (targetBus.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED');
    if (currentTripStatus === 'COMPLETED') {
      return { success: false, error: 'Invalid state transition: This trip has already been completed.' };
    }

    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const updated: BusState = {
            ...b,
            status: 'ACTIVE',
            currentTripId: tripId,
            currentSpeed: Math.max(35, b.currentSpeed),
            lastUpdated: new Date().toISOString()
          };
          (updated as any).tripStatus = 'ACTIVE';
          (updated as any).gpsStatus = 'CONNECTED';
          return updated;
        }
        return b;
      })
    );

    addAuditLog({
      userId: driverId,
      userName: driverName,
      role: 'DRIVER',
      action: 'TRIP_STARTED',
      busId,
      tripId,
      details: `Trip ${tripId} started successfully for bus ${targetBus.registrationNumber}`
    });

    return { success: true };
  };

  const pauseTrip = (
    driverId: string, 
    busId: string, 
    tripId: string,
    driverName: string = 'Driver'
  ): { success: boolean; error?: string } => {
    const targetBus = buses.find((b) => b.busId === busId);
    if (!targetBus) return { success: false, error: 'Bus not found' };

    if (targetBus.driverId !== driverId && driverId !== 'usr-admin-super') {
      return { success: false, error: 'Unauthorized: Driver mismatch.' };
    }

    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const updated: BusState = {
            ...b,
            status: 'DELAYED',
            currentSpeed: 0,
            lastUpdated: new Date().toISOString()
          };
          (updated as any).tripStatus = 'PAUSED';
          return updated;
        }
        return b;
      })
    );

    addAuditLog({
      userId: driverId,
      userName: driverName,
      role: 'DRIVER',
      action: 'TRIP_PAUSED',
      busId,
      tripId,
      details: `Trip ${tripId} paused by driver at ${targetBus.nextStopName}`
    });

    return { success: true };
  };

  const resumeTrip = (
    driverId: string, 
    busId: string, 
    tripId: string,
    driverName: string = 'Driver'
  ): { success: boolean; error?: string } => {
    const targetBus = buses.find((b) => b.busId === busId);
    if (!targetBus) return { success: false, error: 'Bus not found' };

    if (targetBus.driverId !== driverId && driverId !== 'usr-admin-super') {
      return { success: false, error: 'Unauthorized: Driver mismatch.' };
    }

    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const updated: BusState = {
            ...b,
            status: 'ACTIVE',
            currentSpeed: 45,
            lastUpdated: new Date().toISOString()
          };
          (updated as any).tripStatus = 'ACTIVE';
          (updated as any).gpsStatus = 'CONNECTED';
          return updated;
        }
        return b;
      })
    );

    addAuditLog({
      userId: driverId,
      userName: driverName,
      role: 'DRIVER',
      action: 'TRIP_RESUMED',
      busId,
      tripId,
      details: `Trip ${tripId} resumed by driver`
    });

    return { success: true };
  };

  const endTrip = (
    driverId: string, 
    busId: string, 
    tripId: string,
    driverName: string = 'Driver'
  ): { success: boolean; error?: string } => {
    const targetBus = buses.find((b) => b.busId === busId);
    if (!targetBus) return { success: false, error: 'Bus not found' };

    if (targetBus.driverId !== driverId && driverId !== 'usr-admin-super') {
      return { success: false, error: 'Unauthorized: Driver mismatch.' };
    }

    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const updated: BusState = {
            ...b,
            status: 'COMPLETED',
            currentSpeed: 0,
            lastUpdated: new Date().toISOString()
          };
          (updated as any).tripStatus = 'COMPLETED';
          return updated;
        }
        return b;
      })
    );

    addAuditLog({
      userId: driverId,
      userName: driverName,
      role: 'DRIVER',
      action: 'TRIP_COMPLETED',
      busId,
      tripId,
      details: `Trip ${tripId} concluded at final destination.`
    });

    return { success: true };
  };

  const setBusPassengerCount = (
    busId: string, 
    count: number,
    updatedBy: string
  ): { success: boolean; error?: string } => {
    const targetBus = buses.find((b) => b.busId === busId);
    if (!targetBus) return { success: false, error: 'Bus not found' };

    // Clamped strictly between 0 and configured capacity
    const clampedCount = Math.max(0, Math.min(targetBus.capacity, count));
    const occupancyPercentage = Math.round((clampedCount / targetBus.capacity) * 100);

    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          return {
            ...b,
            currentPassengerCount: clampedCount,
            occupancyPercentage,
            occupancySource: 'MEASURED',
            lastUpdated: new Date().toISOString()
          };
        }
        return b;
      })
    );

    addAuditLog({
      userId: updatedBy,
      role: 'DRIVER',
      action: 'PASSENGER_COUNT_UPDATED',
      busId,
      details: `Passenger count set to ${clampedCount}/${targetBus.capacity} (${occupancyPercentage}%)`
    });

    return { success: true };
  };

  const reportDriverIssue = async (
    reportData: Omit<DriverReport, 'reportId' | 'timestamp' | 'status'> & { status?: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' }
  ): Promise<{ success: boolean; error?: string }> => {
    const newReport: DriverReport = {
      ...reportData,
      reportId: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };

    setDriverReports((prev) => [newReport, ...prev]);

    addAuditLog({
      userId: reportData.driverId,
      userName: reportData.driverName,
      role: 'DRIVER',
      action: 'ISSUE_REPORTED',
      busId: reportData.busId,
      tripId: reportData.tripId,
      details: `[${reportData.issueType}] ${reportData.description}`
    });

    // Create a service alert if high or critical
    if (reportData.severity === 'HIGH' || reportData.severity === 'CRITICAL') {
      addAlert({
        title: `Driver Report: ${reportData.issueType.replace('_', ' ')}`,
        message: reportData.description,
        severity: reportData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        createdBy: `Driver: ${reportData.driverName}`,
        active: true
      });
    }

    try {
      await addDoc(collection(db, 'driverReports'), newReport);
    } catch {
      // offline demo persistence
    }

    return { success: true };
  };

  const simulateGpsSignalLost = (busId: string, isLost: boolean) => {
    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const updated = { ...b };
          (updated as any).gpsStatus = isLost ? 'SIGNAL_LOST' : 'CONNECTED';
          if (isLost) {
            updated.currentSpeed = 0;
          }
          return updated;
        }
        return b;
      })
    );
  };

  const updateBusTelemetry = (busId: string, updates: Partial<BusState>) => {
    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const updated = { ...b, ...updates, lastUpdated: new Date().toISOString() };
          setTelemetries((tels) => ({
            ...tels,
            [busId]: createTelemetryPacket(updated)
          }));
          return updated;
        }
        return b;
      })
    );
  };

  const injectDelay = (busId: string, minutes: number) => {
    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const newDelay = Math.max(0, b.delayMinutes + minutes);
          const updated: BusState = {
            ...b,
            delayMinutes: newDelay,
            status: newDelay > 10 ? 'DELAYED' : 'ACTIVE',
            predictedArrival: `+${newDelay}m adjusted delay`
          };
          setTelemetries((tels) => ({
            ...tels,
            [busId]: createTelemetryPacket(updated)
          }));
          return updated;
        }
        return b;
      })
    );
  };

  const injectPassengerSpike = (busId: string, addedCount: number) => {
    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const newCount = Math.min(b.capacity, Math.max(0, b.currentPassengerCount + addedCount));
          const updated: BusState = {
            ...b,
            currentPassengerCount: newCount,
            occupancyPercentage: Math.round((newCount / b.capacity) * 100),
            occupancySource: 'MEASURED'
          };
          setTelemetries((tels) => ({
            ...tels,
            [busId]: createTelemetryPacket(updated)
          }));
          return updated;
        }
        return b;
      })
    );
  };

  const reverseBusDirection = (busId: string) => {
    setBuses((prev) =>
      prev.map((b) => {
        if (b.busId === busId) {
          const newDirection = b.direction === 'INBOUND' ? 'OUTBOUND' : 'INBOUND';
          return {
            ...b,
            direction: newDirection,
            heading: (b.heading + 180) % 360
          };
        }
        return b;
      })
    );
  };

  const addAlert = (newAlert: Omit<ServiceAlert, 'alertId' | 'createdAt'>) => {
    const alert: ServiceAlert = {
      ...newAlert,
      alertId: `alt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const resetDemoData = () => {
    const fresh = INITIAL_BUSES.map((b) => ({
      ...b,
      tripStatus: 'ACTIVE' as TripStatus,
      gpsStatus: 'CONNECTED' as GPSConnectionStatus
    }));
    setBuses(fresh);
    const initialPackets: Record<string, GPSTelemetry> = {};
    fresh.forEach((bus) => {
      initialPackets[bus.busId] = createTelemetryPacket(bus);
    });
    setTelemetries(initialPackets);
    localStorage.removeItem('lalpari_buses_state');
    localStorage.removeItem('lalpari_buses_state_v2');
    localStorage.removeItem('lalpari_buses_state_v3');
  };

  // Passenger search algorithm
  const findBusesForJourney = (fromInput: string, toInput: string) => {
    // Only return buses that are NOT completed
    const availableFleet = buses.filter((b) => (b as any).tripStatus !== 'COMPLETED');
    const result = searchBusServices({
      fromText: fromInput,
      toText: toInput,
      allStops: stops,
      allRoutes: routes,
      allBuses: availableFleet,
      allSchedules: DEMO_SCHEDULES
    });

    return {
      routes: result.matchedRoutes.length > 0 ? result.matchedRoutes : routes,
      matchingBuses: result.activeResults.length > 0 ? result.activeResults.map((r) => r.bus) : availableFleet,
      originStop: result.matchedOriginStop || stops[0],
      destinationStop: result.matchedDestinationStop || stops[7]
    };
  };

  return (
    <TransitContext.Provider
      value={{
        buses,
        routes,
        stops,
        alerts,
        telemetries,
        gpsLogs,
        driverReports,
        auditLogs,
        getTelemetry,
        isSimulationRunning,
        simulationSpeed,
        toggleSimulation,
        setSimulationSpeed,
        updateBusTelemetry,
        injectDelay,
        injectPassengerSpike,
        reverseBusDirection,
        addAlert,
        resetDemoData,
        startTrip,
        pauseTrip,
        resumeTrip,
        endTrip,
        setBusPassengerCount,
        reportDriverIssue,
        simulateGpsSignalLost,
        addAuditLog,
        findBusesForJourney
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const ctx = useContext(TransitContext);
  if (!ctx) throw new Error('useTransit must be used within TransitProvider');
  return ctx;
};
