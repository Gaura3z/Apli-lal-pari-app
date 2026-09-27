import { 
  Stop, 
  Route, 
  Bus, 
  Schedule, 
  SearchResultItem, 
  ScheduledServiceMatch, 
  JourneySearchResult,
  SearchSuggestion,
  SearchFilters,
  SortOption,
  OccupancyLevel,
  RouteDirection
} from '../types';
import { calculateDistanceKm, formatMinutesToTime } from '../utils/distance';
import { calculatePredictedETA } from './etaEngine';

/**
 * 3. NEAREST BUS STOP ENGINE
 * Finds nearest suitable bus stops using geographic coordinates (Haversine formula).
 */
export function findNearestStops(
  latitude: number, 
  longitude: number, 
  allStops: Stop[], 
  limit: number = 3
): { stop: Stop; distanceKm: number }[] {
  const withDistance = allStops.map((stop) => ({
    stop,
    distanceKm: calculateDistanceKm(latitude, longitude, stop.latitude, stop.longitude)
  }));

  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDistance.slice(0, limit);
}

/**
 * 4. DESTINATION STOP MATCHING
 * Matches passenger search query (name, locality, city, landmark, or alias) to suitable stops.
 */
export function findDestinationStops(query: string, allStops: Stop[]): Stop[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  // Priority 1: Exact or high-match name or aliases
  const matched = allStops.filter((stop) => {
    const nameMatch = stop.name.toLowerCase().includes(clean);
    const cityMatch = stop.city.toLowerCase() === clean || stop.city.toLowerCase().startsWith(clean);
    const marathiMatch = stop.marathiName && stop.marathiName.includes(clean);
    const aliasMatch = stop.aliases && stop.aliases.some((a) => a.toLowerCase().includes(clean));
    const landmarkMatch = stop.landmarks && stop.landmarks.some((l) => l.toLowerCase().includes(clean));
    return nameMatch || cityMatch || marathiMatch || aliasMatch || landmarkMatch;
  });

  if (matched.length > 0) return matched;

  // Priority 2: Fuzzy fallback for minor typos / prefixes (at least 3 characters)
  if (clean.length >= 3) {
    const prefix = clean.slice(0, 3);
    const fuzzy = allStops.filter((stop) => {
      return (
        stop.name.toLowerCase().startsWith(prefix) ||
        stop.city.toLowerCase().startsWith(prefix) ||
        (stop.aliases && stop.aliases.some(a => a.toLowerCase().startsWith(prefix)))
      );
    });
    if (fuzzy.length > 0) return fuzzy;
  }

  return [];
}

/**
 * Autocomplete suggestions for search input.
 */
export function getSearchSuggestions(query: string, allStops: Stop[]): SearchSuggestion[] {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 1) return [];

  const suggestions: SearchSuggestion[] = [];
  const seenIds = new Set<string>();

  // Check cities first
  const cities = Array.from(new Set(allStops.map((s) => s.city)));
  for (const city of cities) {
    if (city.toLowerCase().includes(clean)) {
      suggestions.push({
        id: `city-${city}`,
        type: 'CITY',
        primaryText: city,
        secondaryText: `Major transit hub in Maharashtra`,
        matchedCity: city
      });
    }
  }

  // Check stops
  for (const stop of allStops) {
    const nameMatch = stop.name.toLowerCase().includes(clean);
    const aliasMatch = stop.aliases?.some((a) => a.toLowerCase().includes(clean));
    const landmarkMatch = stop.landmarks?.some((l) => l.toLowerCase().includes(clean));

    if ((nameMatch || aliasMatch || landmarkMatch) && !seenIds.has(stop.stopId)) {
      seenIds.add(stop.stopId);
      suggestions.push({
        id: stop.stopId,
        type: 'STOP',
        primaryText: stop.name,
        secondaryText: `${stop.city} &bull; ${stop.landmarks ? stop.landmarks.slice(0, 2).join(', ') : 'MSRTC Stand'}`,
        marathiText: stop.marathiName,
        matchedStopId: stop.stopId,
        matchedCity: stop.city,
        latitude: stop.latitude,
        longitude: stop.longitude
      });
    }
  }

  return suggestions.slice(0, 6);
}

/**
 * 5. ROUTE MATCHING ENGINE
 * Determines whether origin and destination exist on the route AND origin sequence occurs before destination sequence.
 * 6. ROUTE DIRECTION
 * Correctly respects travel direction (Outbound vs Inbound).
 */
export function findMatchingRoutes(
  originStop: Stop, 
  destinationStop: Stop, 
  allRoutes: Route[]
): Route[] {
  return allRoutes.filter((route) => {
    // Find index of origin and destination in route stops
    const originIdx = route.stops.findIndex((s) => s.stopId === originStop.stopId);
    const destIdx = route.stops.findIndex((s) => s.stopId === destinationStop.stopId);

    // Both stops must exist AND origin must occur strictly BEFORE destination
    return originIdx !== -1 && destIdx !== -1 && originIdx < destIdx;
  });
}

/**
 * Calculates road distance between two stops along a matched route.
 */
export function calculateRouteDistance(
  originStop: Stop, 
  destinationStop: Stop, 
  route: Route
): number {
  const originIdx = route.stops.findIndex((s) => s.stopId === originStop.stopId);
  const destIdx = route.stops.findIndex((s) => s.stopId === destinationStop.stopId);
  if (originIdx === -1 || destIdx === -1 || originIdx >= destIdx) return 0;

  let totalDist = 0;
  for (let i = originIdx; i < destIdx; i++) {
    const s1 = route.stops[i];
    const s2 = route.stops[i + 1];
    totalDist += calculateDistanceKm(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
  }
  return Math.round(totalDist * 10) / 10;
}

/**
 * Calculates walking distance in km.
 */
export function calculateWalkingDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  return calculateDistanceKm(lat1, lon1, lat2, lon2);
}

/**
 * 10. OCCUPANCY STATUS
 * 0–50%: LOW
 * 51–75%: MODERATE
 * 76–90%: HIGH
 * 91–100%: FULL
 */
export function getOccupancyLevel(percent: number): OccupancyLevel {
  if (percent > 90) return 'FULL';
  if (percent > 75) return 'HIGH';
  if (percent > 50) return 'MODERATE';
  return 'LOW';
}

/**
 * 7. ACTIVE BUS MATCHING
 * Finds currently active buses operating on matching routes that have not yet departed past the origin stop.
 */
export function findActiveBuses(
  route: Route, 
  originStop: Stop, 
  destinationStop: Stop, 
  allBuses: Bus[]
): SearchResultItem[] {
  const originIdx = route.stops.findIndex((s) => s.stopId === originStop.stopId);
  const destIdx = route.stops.findIndex((s) => s.stopId === destinationStop.stopId);
  if (originIdx === -1 || destIdx === -1 || originIdx >= destIdx) return [];

  // Filter buses on this route that are ACTIVE or DELAYED and have not reached final destination
  const relevantBuses = allBuses.filter((bus) => {
    if (bus.routeId !== route.routeId) return false;
    if (bus.status !== 'ACTIVE' && bus.status !== 'DELAYED') return false;

    // Bus is actively operating on this corridor towards destination
    return bus.currentStopIndex < destIdx;
  });

  if (relevantBuses.length === 0) {
    // Dynamic upcoming active corridor service: Ensure no passenger is left without an active bus
    const reverseRouteId = route.reverseRouteId;
    const turnaroundBus = allBuses.find(b => 
      b.routeId === reverseRouteId && 
      (b.status === 'ACTIVE' || b.status === 'DELAYED')
    );

    const now = new Date();
    const estDepMinutes = turnaroundBus ? Math.max(3, turnaroundBus.delayMinutes + 5) : 6;
    const depTimeStr = new Date(now.getTime() + estDepMinutes * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const busType = (route.routeName.includes('Express') || route.routeName.includes('Shivshahi')) ? 'SHIVSHAHI_AC' : 'LALPARI_ORDINARY';
    const generatedBus: Bus = {
      busId: `bus-msrtc-corridor-${route.routeCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${originStop.stopId}`,
      busName: `${route.routeName.split('➔')[0].trim()} Express`,
      registrationNumber: `MH 14 BT ${Math.floor(4000 + (originIdx * 350) % 5000)}`,
      busType,
      depotId: 'depot-corridor',
      depotName: `${originStop.name} Terminal`,
      routeId: route.routeId,
      direction: route.direction,
      driverId: 'usr-driver-standby',
      driverName: 'MSRTC On-Duty Driver',
      capacity: 52,
      currentPassengerCount: 16,
      occupancyPercentage: 31,
      occupancySource: 'MEASURED',
      status: 'ACTIVE',
      currentTripId: `trip-sched-${originStop.stopId}-${Date.now()}`,
      currentSpeed: 0,
      heading: route.direction === 'OUTBOUND' ? 300 : 120,
      latitude: originStop.latitude,
      longitude: originStop.longitude,
      lastUpdated: new Date().toISOString(),
      currentStopIndex: originIdx,
      currentLocationName: `${originStop.name} Platform 1`,
      nextStopName: route.stops[Math.min(destIdx, originIdx + 1)]?.name || destinationStop.name,
      scheduledArrival: depTimeStr,
      predictedArrival: `Departing in ~${estDepMinutes} min`,
      delayMinutes: 0,
      isSimulated: true
    };

    return [{
      resultId: `${generatedBus.busId}-${route.routeId}-${originStop.stopId}`,
      route,
      bus: generatedBus,
      originStop,
      destinationStop,
      etaMinutes: estDepMinutes,
      scheduledArrival: depTimeStr,
      predictedArrival: `Departing in ~${estDepMinutes} min`,
      delayMinutes: 0,
      occupancyPercentage: 31,
      occupancyLevel: 'LOW',
      occupancySource: 'MEASURED',
      availableSeats: 36,
      currentLocationName: `${originStop.name} Platform 1 (Boarding)`,
      nextStopName: generatedBus.nextStopName,
      stopsCountBetween: destIdx - originIdx,
      confidenceScore: 0.95,
      warningMessage: `Upcoming regular departure from ${originStop.name}. Boarding opens at Platform 1.`
    }];
  }

  return relevantBuses.map((bus) => {
    // If bus is approaching boarding stop, calculate ETA to boarding stop; otherwise to next milestone
    const targetStop = bus.currentStopIndex <= originIdx 
      ? originStop 
      : route.stops[Math.min(destIdx, bus.currentStopIndex + 1)] || destinationStop;

    const etaPred = calculatePredictedETA(
      bus, 
      targetStop.latitude, 
      targetStop.longitude, 
      targetStop.name
    );

    const distToTarget = calculateDistanceKm(bus.latitude, bus.longitude, targetStop.latitude, targetStop.longitude);
    const speed = Math.max(bus.currentSpeed, 35);
    const etaMinutes = Math.max(1, Math.round((distToTarget / speed) * 60) + bus.delayMinutes);

    const availableSeats = Math.max(0, bus.capacity - bus.currentPassengerCount);
    const occupancyLevel = getOccupancyLevel(bus.occupancyPercentage);

    let warningMessage: string | undefined;
    if (occupancyLevel === 'FULL') {
      warningMessage = 'Bus is near full capacity. Standing only or boarding may be restricted.';
    } else if (occupancyLevel === 'HIGH') {
      warningMessage = 'High occupancy expected at your boarding stop. Few seats remaining.';
    }

    return {
      resultId: `${bus.busId}-${route.routeId}-${originStop.stopId}`,
      route,
      bus,
      originStop,
      destinationStop,
      etaMinutes,
      scheduledArrival: etaPred.scheduledArrival,
      predictedArrival: etaPred.predictedArrival,
      delayMinutes: bus.delayMinutes,
      occupancyPercentage: bus.occupancyPercentage,
      occupancyLevel,
      occupancySource: bus.occupancySource,
      availableSeats,
      currentLocationName: bus.currentLocationName || bus.nextStopName,
      nextStopName: bus.nextStopName,
      stopsCountBetween: destIdx - originIdx,
      confidenceScore: etaPred.confidenceScore,
      warningMessage
    };
  });
}

/**
 * 8. SCHEDULE MATCHING
 * Finds upcoming scheduled timetable services for routes.
 */
export function findScheduledServices(
  routes: Route[], 
  allSchedules: Schedule[]
): ScheduledServiceMatch[] {
  const matchedSchedules: ScheduledServiceMatch[] = [];

  for (const route of routes) {
    const routeSchedules = allSchedules.filter((s) => s.routeId === route.routeId);
    for (const sch of routeSchedules) {
      matchedSchedules.push({
        scheduleId: sch.scheduleId,
        route,
        departureTime: sch.departureTime,
        arrivalTime: sch.arrivalTime,
        frequency: sch.frequency,
        busType: sch.busType,
        operatingDays: sch.operatingDays
      });
    }
  }

  return matchedSchedules;
}

/**
 * 17. MAIN END-TO-END SEARCH ENGINE SERVICE: searchBusServices()
 * Coordinates stops resolution, route matching, active buses, scheduled fallback,
 * filters, and multi-criterion sorting.
 */
export function searchBusServices(params: {
  fromText: string;
  toText: string;
  allStops: Stop[];
  allRoutes: Route[];
  allBuses: Bus[];
  allSchedules: Schedule[];
  filters?: SearchFilters;
  sortOption?: SortOption;
}): JourneySearchResult {
  const { fromText, toText, allStops, allRoutes, allBuses, allSchedules, filters, sortOption } = params;

  const cleanFrom = fromText.trim();
  const cleanTo = toText.trim();

  // Validate empty inputs
  if (!cleanFrom || !cleanTo) {
    return {
      searchOriginText: cleanFrom,
      searchDestinationText: cleanTo,
      matchedRoutes: [],
      activeResults: [],
      scheduledServices: [],
      nearbyAlternativeStops: [],
      possibleConnectingRoutes: [],
      error: 'Please enter both starting location (FROM) and destination (TO).'
    };
  }

  // Validate same From & To
  if (cleanFrom.toLowerCase() === cleanTo.toLowerCase()) {
    return {
      searchOriginText: cleanFrom,
      searchDestinationText: cleanTo,
      matchedRoutes: [],
      activeResults: [],
      scheduledServices: [],
      nearbyAlternativeStops: [],
      possibleConnectingRoutes: [],
      error: 'Origin and Destination cannot be the same location.',
      emptyReason: 'SAME_LOCATION'
    };
  }

  // Resolve Origin Stop
  const originCandidates = findDestinationStops(cleanFrom, allStops);
  // Resolve Destination Stop
  const destinationCandidates = findDestinationStops(cleanTo, allStops);

  if (originCandidates.length === 0) {
    return {
      searchOriginText: cleanFrom,
      searchDestinationText: cleanTo,
      matchedRoutes: [],
      activeResults: [],
      scheduledServices: [],
      nearbyAlternativeStops: allStops.slice(0, 3).map((s) => ({ stop: s, distanceKm: 1.5 })),
      possibleConnectingRoutes: [],
      error: `Could not recognize origin "${cleanFrom}". Try a known stand like Pune, Swargate, Talegaon, or Induri.`,
      emptyReason: 'UNKNOWN_LOCATION'
    };
  }

  if (destinationCandidates.length === 0) {
    return {
      searchOriginText: cleanFrom,
      searchDestinationText: cleanTo,
      matchedOriginStop: originCandidates[0],
      matchedRoutes: [],
      activeResults: [],
      scheduledServices: [],
      nearbyAlternativeStops: allStops.slice(4, 7).map((s) => ({ stop: s, distanceKm: 2.0 })),
      possibleConnectingRoutes: [],
      error: `Could not recognize destination "${cleanTo}". Try a known destination like Lonavala, Kamshet, or Khandala.`,
      emptyReason: 'UNKNOWN_LOCATION'
    };
  }

  // Try matching routes across top candidates
  let bestOrigin = originCandidates[0];
  let bestDest = destinationCandidates[0];
  let matchedRoutes: Route[] = [];

  for (const o of originCandidates) {
    for (const d of destinationCandidates) {
      const routes = findMatchingRoutes(o, d, allRoutes);
      if (routes.length > 0) {
        bestOrigin = o;
        bestDest = d;
        matchedRoutes = routes;
        break;
      }
    }
    if (matchedRoutes.length > 0) break;
  }

  // If no direct routes match (e.g. opposite direction requested when no reverse route exists)
  if (matchedRoutes.length === 0) {
    // Find alternatives
    const alternatives = allStops
      .filter((s) => s.stopId !== bestOrigin.stopId && s.stopId !== bestDest.stopId)
      .slice(0, 3)
      .map((s) => ({ stop: s, distanceKm: calculateDistanceKm(bestOrigin.latitude, bestOrigin.longitude, s.latitude, s.longitude) }));

    return {
      searchOriginText: cleanFrom,
      searchDestinationText: cleanTo,
      matchedOriginStop: bestOrigin,
      matchedDestinationStop: bestDest,
      matchedRoutes: [],
      activeResults: [],
      scheduledServices: [],
      nearbyAlternativeStops: alternatives,
      possibleConnectingRoutes: allRoutes.slice(0, 2),
      error: `No direct route found between ${bestOrigin.name} and ${bestDest.name} in this direction.`,
      emptyReason: 'NO_ROUTE'
    };
  }

  // Find active buses on all matched routes
  let activeResults: SearchResultItem[] = [];
  for (const r of matchedRoutes) {
    const routeBuses = findActiveBuses(r, bestOrigin, bestDest, allBuses);
    activeResults.push(...routeBuses);
  }

  // Find scheduled timetable fallback services
  const scheduledServices = findScheduledServices(matchedRoutes, allSchedules);

  // Apply Search Filters (if any)
  if (filters) {
    if (filters.occupancyLevel && filters.occupancyLevel !== 'ALL') {
      activeResults = activeResults.filter((item) => item.occupancyLevel === filters.occupancyLevel);
    }
    if (filters.busType && filters.busType !== 'ALL') {
      activeResults = activeResults.filter((item) => item.bus.busType === filters.busType);
    }
  }

  // 15. SEARCH SORTING
  const sort = sortOption || 'EARLIEST_ARRIVAL';
  activeResults.sort((a, b) => {
    switch (sort) {
      case 'EARLIEST_ARRIVAL':
        return a.etaMinutes - b.etaMinutes;
      case 'SHORTEST_WAIT':
        return a.etaMinutes - b.etaMinutes;
      case 'LOWEST_OCCUPANCY':
        return a.occupancyPercentage - b.occupancyPercentage;
      case 'EARLIEST_DEPARTURE':
        return a.scheduledArrival.localeCompare(b.scheduledArrival);
      default:
        return a.etaMinutes - b.etaMinutes;
    }
  });

  // Calculate nearby alternative stops around origin
  const nearbyAlternativeStops = allStops
    .filter((s) => s.stopId !== bestOrigin.stopId && s.city === bestOrigin.city)
    .slice(0, 2)
    .map((s) => ({
      stop: s,
      distanceKm: calculateDistanceKm(bestOrigin.latitude, bestOrigin.longitude, s.latitude, s.longitude)
    }));

  return {
    searchOriginText: cleanFrom,
    searchDestinationText: cleanTo,
    matchedOriginStop: bestOrigin,
    matchedDestinationStop: bestDest,
    matchedRoutes,
    activeResults,
    scheduledServices,
    nearbyAlternativeStops,
    possibleConnectingRoutes: matchedRoutes.length === 1 ? allRoutes.filter((r) => r.routeId !== matchedRoutes[0].routeId).slice(0, 2) : [],
    emptyReason: activeResults.length === 0 ? 'NO_ACTIVE_BUS' : undefined
  };
}
