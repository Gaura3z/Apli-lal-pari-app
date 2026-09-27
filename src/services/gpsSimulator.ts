import { BusState, BusStatus, GPSTelemetry, BusStop, BusType } from '../types';
import { calculateDistanceKm } from '../utils/distance';

export interface CorridorWaypoint {
  lat: number;
  lon: number;
  name?: string;
  isStop?: boolean;
  stopId?: string;
}

// Detailed coordinates along the Pune - Talegaon - Induri - Kamshet - Lonavala corridor (NH48 / Old Pune-Mumbai Highway)
export const CORRIDOR_WAYPOINTS: CorridorWaypoint[] = [
  { lat: 18.5018, lon: 73.8586, name: 'Pune Swargate Bus Stand', isStop: true, stopId: 'stop-pune-swargate' },
  { lat: 18.5140, lon: 73.8530, name: 'Laxmi Road Crossing' },
  { lat: 18.5284, lon: 73.8744, name: 'Pune Railway Station Bus Bay', isStop: true, stopId: 'stop-pune-station' },
  { lat: 18.5314, lon: 73.8446, name: 'Pune Shivajinagar Depot', isStop: true, stopId: 'stop-pune-shivajinagar' },
  { lat: 18.5520, lon: 73.8370, name: 'Khadki Old Bazar' },
  { lat: 18.5780, lon: 73.8180, name: 'Dapodi Phata' },
  { lat: 18.5987, lon: 73.7687, name: 'Wakad Highway Bridge', isStop: true, stopId: 'stop-wakad-flyover' },
  { lat: 18.6320, lon: 73.7850, name: 'Pimpri-Chinchwad Bypass' },
  { lat: 18.6580, lon: 73.7710, name: 'Nigdi Bhakti Shakti Chowk' },
  { lat: 18.7010, lon: 73.7420, name: 'Dehu Road Cantonment' },
  { lat: 18.7210, lon: 73.7020, name: 'Somatne Phata Toll Plaza' },
  { lat: 18.7346, lon: 73.6766, name: 'Talegaon Dabhade Chowk', isStop: true, stopId: 'stop-talegaon-dabhade' },
  { lat: 18.7550, lon: 73.6590, name: 'Talegaon MIDC Junction' },
  { lat: 18.7725, lon: 73.6421, name: 'Induri Phata Junction', isStop: true, stopId: 'stop-induri-phata' },
  { lat: 18.7610, lon: 73.6290, name: 'Induri River Bridge' },
  { lat: 18.7480, lon: 73.6190, name: 'Vadgaon Maval Chowk' },
  { lat: 18.7530, lon: 73.5850, name: 'Kanhe Phata Stand' },
  { lat: 18.7569, lon: 73.5583, name: 'Kamshet Central Stand', isStop: true, stopId: 'stop-kamshet-market' },
  { lat: 18.7560, lon: 73.5120, name: 'Pawna Valley Viaduct' },
  { lat: 18.7540, lon: 73.4750, name: 'Karla Caves Phata / Malavli' },
  { lat: 18.7535, lon: 73.4390, name: 'Valvan Lake Curve' },
  { lat: 18.7523, lon: 73.4072, name: 'Lonavala ST Stand', isStop: true, stopId: 'stop-lonavala-st' },
  { lat: 18.7610, lon: 73.3680, name: 'Khandala Ghat Depot', isStop: true, stopId: 'stop-khandala' }
];

/**
 * Calculates compass heading (bearing in degrees 0-360) between two coordinates
 */
export function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  const brng = toDeg(Math.atan2(y, x));
  return Math.round((brng + 360) % 360);
}

/**
 * Linear coordinate interpolation between two waypoints
 */
export function interpolatePoint(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number },
  ratio: number
): { lat: number; lon: number } {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return {
    lat: Number((p1.lat + (p2.lat - p1.lat) * clampedRatio).toFixed(6)),
    lon: Number((p1.lon + (p2.lon - p1.lon) * clampedRatio).toFixed(6))
  };
}

/**
 * Converts a BusState into a strict GPSTelemetry message
 * Reusable for future ESP32 / AIS-140 hardware telemetry feeds
 */
export function createTelemetryPacket(bus: BusState): GPSTelemetry {
  return {
    logId: `gps-log-${bus.busId}-${Date.now()}`,
    busId: bus.busId,
    tripId: bus.currentTripId || `TRIP-${bus.busId}-01`,
    routeId: bus.routeId,
    latitude: bus.latitude,
    longitude: bus.longitude,
    speed: bus.currentSpeed,
    heading: bus.heading || 0,
    timestamp: new Date().toISOString(),
    status: bus.status,
    altitude: 580 + Math.round((bus.latitude - 18.5) * 200),
    satellites: 9 + Math.floor(Math.random() * 4),
    batteryLevel: 94 + Math.floor(Math.random() * 5),
    signalStrengthDbm: -65 - Math.floor(Math.random() * 15),
    doorStatus: bus.currentSpeed < 3 ? 'OPEN' : 'CLOSED',
    isSimulated: true
  };
}

/**
 * Finds the closest waypoint index for a given coordinate
 */
export function findNearestWaypointIndex(
  lat: number,
  lon: number,
  waypoints: CorridorWaypoint[] = CORRIDOR_WAYPOINTS
): number {
  let minDistance = Infinity;
  let nearestIdx = 0;

  for (let i = 0; i < waypoints.length; i++) {
    const dist = calculateDistanceKm(lat, lon, waypoints[i].lat, waypoints[i].lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestIdx = i;
    }
  }

  return nearestIdx;
}

/**
 * Finds the next stop on the corridor ahead of the given waypoint index
 */
export function findNextStopAhead(
  currentIndex: number,
  isOutbound: boolean = true,
  waypoints: CorridorWaypoint[] = CORRIDOR_WAYPOINTS
): { stopName: string; stopId?: string; distanceKm: number } {
  const step = isOutbound ? 1 : -1;
  let searchIdx = currentIndex + step;

  while (searchIdx >= 0 && searchIdx < waypoints.length) {
    if (waypoints[searchIdx].isStop) {
      const fromPt = waypoints[currentIndex];
      const targetPt = waypoints[searchIdx];
      const distance = calculateDistanceKm(fromPt.lat, fromPt.lon, targetPt.lat, targetPt.lon);
      return {
        stopName: waypoints[searchIdx].name || 'Upcoming Station',
        stopId: waypoints[searchIdx].stopId,
        distanceKm: distance
      };
    }
    searchIdx += step;
  }

  // If at or past terminus
  const terminus = isOutbound ? waypoints[waypoints.length - 1] : waypoints[0];
  return {
    stopName: terminus.name || 'Terminal',
    stopId: terminus.stopId,
    distanceKm: 0
  };
}

/**
 * Finds the stop index along the 9-stop corridor for a given waypoint index
 */
export function getStopIndexForWaypoint(wpIdx: number, isOutbound: boolean): number {
  if (isOutbound) {
    if (wpIdx < 2) return 0; // Swargate
    if (wpIdx < 3) return 1; // Station
    if (wpIdx < 6) return 2; // Shivajinagar
    if (wpIdx < 11) return 3; // Wakad
    if (wpIdx < 13) return 4; // Talegaon
    if (wpIdx < 17) return 5; // Induri
    if (wpIdx < 21) return 6; // Kamshet
    if (wpIdx < 22) return 7; // Lonavala
    return 8; // Khandala
  } else {
    // Inbound: Khandala (0) -> Swargate (8)
    if (wpIdx >= 22) return 0; // Khandala
    if (wpIdx >= 21) return 1; // Lonavala
    if (wpIdx >= 17) return 2; // Kamshet
    if (wpIdx >= 13) return 3; // Induri
    if (wpIdx >= 11) return 4; // Talegaon
    if (wpIdx >= 6) return 5; // Wakad
    if (wpIdx >= 3) return 6; // Shivajinagar
    if (wpIdx >= 2) return 7; // Station
    return 8; // Swargate
  }
}

/**
 * Moves a fleet of buses along the corridor waypoints smoothly with realistic dynamics
 */
export function stepSimulation(
  currentBuses: BusState[],
  speedMultiplier: number = 1,
  waypoints: CorridorWaypoint[] = CORRIDOR_WAYPOINTS
): { updatedBuses: BusState[]; telemetries: GPSTelemetry[] } {
  const telemetries: GPSTelemetry[] = [];

  const updatedBuses = currentBuses.map((bus) => {
    // Determine direction
    const isOutbound = bus.direction !== 'INBOUND';
    const wpCount = waypoints.length;

    // Find current waypoint segment
    const currentWpIdx = findNearestWaypointIndex(bus.latitude, bus.longitude, waypoints);

    // Determine target waypoint index
    let nextWpIdx = isOutbound ? currentWpIdx + 1 : currentWpIdx - 1;

    // Loop/reverse direction if reached end and seamlessly switch routeId
    let updatedDirection = bus.direction;
    let updatedRouteId = bus.routeId;
    let currentTripId = bus.currentTripId;

    if (nextWpIdx >= wpCount) {
      nextWpIdx = wpCount - 2;
      updatedDirection = 'INBOUND';
      if (bus.routeId === 'route-pune-khandala-outbound') {
        updatedRouteId = 'route-khandala-pune-inbound';
      } else if (bus.routeId === 'route-talegaon-lonavala-outbound') {
        updatedRouteId = 'route-lonavala-talegaon-inbound';
      } else {
        updatedRouteId = 'route-lonavala-pune-inbound';
      }
      currentTripId = `trip-inb-${bus.busId.replace('bus-', '')}-${Math.floor(Date.now() / 60000)}`;
    } else if (nextWpIdx < 0) {
      nextWpIdx = 1;
      updatedDirection = 'OUTBOUND';
      if (bus.routeId === 'route-khandala-pune-inbound') {
        updatedRouteId = 'route-pune-khandala-outbound';
      } else if (bus.routeId === 'route-lonavala-talegaon-inbound') {
        updatedRouteId = 'route-talegaon-lonavala-outbound';
      } else {
        updatedRouteId = 'route-pune-lonavala-outbound';
      }
      currentTripId = `trip-out-${bus.busId.replace('bus-', '')}-${Math.floor(Date.now() / 60000)}`;
    }

    const currentWp = waypoints[currentWpIdx];
    const targetWp = waypoints[nextWpIdx];

    // Compute bearing/heading to next waypoint
    const heading = calculateHeading(
      bus.latitude,
      bus.longitude,
      targetWp.lat,
      targetWp.lon
    );

    // Continuous fractional advancement step (0.04 to 0.08 of segment per second)
    const segmentDistanceKm = calculateDistanceKm(currentWp.lat, currentWp.lon, targetWp.lat, targetWp.lon);
    const stepSize = Math.min(0.35, Math.max(0.04, (0.06 * speedMultiplier) / Math.max(0.5, segmentDistanceKm)));

    // Smooth coordinate interpolation
    const newPos = interpolatePoint(
      { lat: bus.latitude, lon: bus.longitude },
      { lat: targetWp.lat, lon: targetWp.lon },
      stepSize
    );

    // Check distance to target waypoint
    const distToTarget = calculateDistanceKm(newPos.lat, newPos.lon, targetWp.lat, targetWp.lon);

    let currentPassengerCount = bus.currentPassengerCount;
    let speed = bus.currentSpeed;
    let delayMinutes = bus.delayMinutes;
    let nextStopInfo = findNextStopAhead(nextWpIdx, updatedDirection === 'OUTBOUND', waypoints);

    if (distToTarget < 0.2 && targetWp.isStop) {
      // Reached or at a major stop: Simulate station dwell time & passenger transfer
      speed = Math.floor(Math.random() * 8); // nearly stopped
      const alighting = Math.floor(Math.random() * 6);
      const boarding = Math.floor(Math.random() * 9);
      currentPassengerCount = Math.max(8, Math.min(bus.capacity, currentPassengerCount - alighting + boarding));

      // Slight dwell delay
      if (Math.random() < 0.15) {
        delayMinutes = Math.min(45, delayMinutes + 1);
      }
    } else {
      // Cruising on highway NH48: realistic speed fluctuations (38 - 62 km/h)
      const baseSpeed = (bus.busType === 'SHIVSHAHI_AC' || bus.busType === 'E_SHIVAI' || bus.busType === 'E_SHIVAI_ELECTRIC') ? 52 : 46;
      const variation = Math.floor(Math.random() * 14) - 7;
      speed = Math.max(28, Math.min(75, baseSpeed + variation));
    }

    const occupancyPercentage = Math.round((currentPassengerCount / bus.capacity) * 100);

    // Calculate dynamic ETA to next stop
    const etaMinutes = speed > 5 ? Math.max(1, Math.round((nextStopInfo.distanceKm / speed) * 60)) : 1;
    const predictedArrival = etaMinutes <= 1 ? 'Approaching now' : `~${etaMinutes} min`;

    // Accurately compute currentStopIndex matching updatedDirection
    const currentStopIndex = getStopIndexForWaypoint(currentWpIdx, updatedDirection === 'OUTBOUND');
    const currentLocationName = currentWp.name 
      ? (currentWp.isStop ? currentWp.name : `Near ${currentWp.name}`)
      : nextStopInfo.stopName;

    const updatedBus: BusState = {
      ...bus,
      latitude: newPos.lat,
      longitude: newPos.lon,
      heading,
      currentSpeed: speed,
      currentPassengerCount,
      occupancyPercentage,
      direction: updatedDirection,
      routeId: updatedRouteId,
      currentTripId,
      currentStopIndex,
      currentLocationName,
      nextStopName: nextStopInfo.stopName,
      delayMinutes,
      predictedArrival,
      lastUpdated: new Date().toISOString()
    };

    telemetries.push(createTelemetryPacket(updatedBus));
    return updatedBus;
  });

  return { updatedBuses, telemetries };
}
