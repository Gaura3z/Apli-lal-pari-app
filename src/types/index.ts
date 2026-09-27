export type UserRole = 
  | 'PASSENGER' 
  | 'DRIVER' 
  | 'DEPOT_MANAGER' 
  | 'AUTHORITY' 
  | 'ANALYST' 
  | 'SUPER_ADMIN';

export type BusStatus = 'ACTIVE' | 'DELAYED' | 'MAINTENANCE' | 'OFFLINE' | 'COMPLETED' | 'STANDBY';
export type TripStatus = 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' | 'RUNNING';
export type GPSConnectionStatus = 'CONNECTED' | 'SIGNAL_LOST' | 'SEARCHING';
export type OccupancySource = 'MEASURED' | 'ESTIMATED';
export type BusType = 
  | 'LALPARI_ORDINARY' 
  | 'HIRVANI_SEMI_LUXURY' 
  | 'HIRKANI_SEMI_LUXURY'
  | 'SHIVSHAHI_AC' 
  | 'E_SHIVAI_ELECTRIC'
  | 'E_SHIVAI';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type RouteDirection = 'OUTBOUND' | 'INBOUND';
export type OccupancyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'FULL';

export interface User {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  depotId?: string;
  assignedBusId?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserProfile = User;

export interface Driver {
  driverId: string;
  badgeNumber: string;
  name: string;
  phone: string;
  depotId: string;
  assignedBusId?: string;
  licenseNumber: string;
  status: 'ON_DUTY' | 'OFF_DUTY' | 'REST';
}

export interface Depot {
  depotId: string;
  name: string;
  region: string;
  city: string;
  managerName: string;
  totalBuses: number;
  activeBuses: number;
  delayedBuses: number;
  phone: string;
}

export interface Stop {
  stopId: string;
  name: string;
  marathiName?: string;
  latitude: number;
  longitude: number;
  sequence: number;
  depotId?: string;
  city: string;
  platforms?: number;
  isMajorTerminal?: boolean;
  landmarks?: string[];
  aliases?: string[];
}

export type BusStop = Stop;

export interface Route {
  routeId: string;
  routeCode: string;
  routeName: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedMinutes: number;
  stops: Stop[];
  activeBusCount: number;
  frequencyMinutes?: number;
  direction?: RouteDirection;
  reverseRouteId?: string;
}

export type BusRoute = Route;

export interface Schedule {
  scheduleId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  frequency: string;
  busType: BusType;
  operatingDays: string[];
  direction?: RouteDirection;
}

export interface Trip {
  tripId: string;
  busId: string;
  routeId: string;
  driverId: string;
  startTime?: string;
  departureTime?: string;
  endTime?: string;
  arrivalTime?: string;
  status: TripStatus;
  currentDelayMinutes: number;
  averageOccupancy: number;
  fuelOrBatteryPercent?: number;
}

export type TripLog = Trip;

export interface Bus {
  busId: string;
  busName?: string; // e.g. "Demo Bus 101"
  registrationNumber: string;
  busType: BusType;
  depotId: string;
  depotName: string;
  routeId: string;
  driverId: string;
  driverName?: string;
  capacity: number; // e.g. 52 seats
  currentPassengerCount: number;
  occupancyPercentage: number;
  occupancySource: OccupancySource;
  status: BusStatus;
  direction?: RouteDirection;
  currentTripId?: string;
  currentSpeed: number; // km/h
  heading: number; // degrees
  latitude: number;
  longitude: number;
  lastUpdated: string;
  currentStopIndex: number;
  currentLocationName?: string;
  nextStopName: string;
  scheduledArrival: string;
  predictedArrival: string;
  delayMinutes: number;
  isSimulated?: boolean;
}

export type BusState = Bus;

export interface GPSTelemetry {
  logId?: string;
  busId: string;
  tripId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: BusStatus;
  // Hardware/IoT extensions (AIS-140 & ESP32 standards)
  altitude?: number;
  satellites?: number;
  batteryLevel?: number;
  signalStrengthDbm?: number;
  doorStatus?: 'OPEN' | 'CLOSED';
  isSimulated?: boolean;
}

export type GPSLog = GPSTelemetry;
export type GpsTelemetry = GPSTelemetry;

export interface OccupancyRecord {
  occupancyId?: string;
  busId: string;
  currentCount: number;
  capacity: number;
  occupancyPercentage: number;
  source: OccupancySource;
  timestamp: string;
}

export interface ETAPrediction {
  busId: string;
  stopId: string;
  stopName: string;
  scheduledArrival: string;
  predictedArrival: string;
  delayMinutes: number;
  confidenceScore: number; // 0 - 100%
  predictionTime?: string;
  factors: {
    trafficCongestion: 'LOW' | 'MEDIUM' | 'HIGH';
    weatherImpact: 'NONE' | 'MODERATE' | 'HEAVY_MONSOON';
    historicalVarianceMinutes: number;
    currentSpeed: number;
  };
  occupancyAtArrival: {
    predictedOccupancyPercent: number;
    predictedAvailableSeats: number;
    crowdLevel: 'COMFORTABLE' | 'MODERATE' | 'HIGH_OCCUPANCY' | 'OVERCROWDED';
    warningMessage?: string;
  };
}

export interface Alert {
  alertId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  routeId?: string;
  depotId?: string;
  createdAt: string;
  createdBy: string;
  active: boolean;
}

export type ServiceAlert = Alert;

export interface Feedback {
  feedbackId: string;
  busId?: string;
  stopId?: string;
  rating: number; // 1-5
  comment: string;
  category: 'CLEANLINESS' | 'PUNCTUALITY' | 'STAFF_BEHAVIOR' | 'CROWDING' | 'GENERAL';
  createdAt: string;
  userName?: string;
}

export interface AnalyticsRecord {
  recordId: string;
  date: string;
  totalTrips: number;
  onTimePercentage: number;
  averageDelayMinutes: number;
  totalPassengersCarried: number;
  peakOccupancyRate: number;
  fleetUtilizationPercent: number;
}

// ----------------------------------------------------
// Driver Portal & Telemetry Types (Phase 4)
// ----------------------------------------------------

export type DriverIssueType = 
  | 'VEHICLE_PROBLEM' 
  | 'GPS_PROBLEM' 
  | 'ROUTE_PROBLEM' 
  | 'TRAFFIC_DELAY' 
  | 'EMERGENCY' 
  | 'OTHER';

export interface DriverReport {
  reportId: string;
  driverId: string;
  driverName: string;
  busId: string;
  tripId: string;
  issueType: DriverIssueType;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  locationName?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export type AuditAction = 
  | 'TRIP_STARTED' 
  | 'TRIP_PAUSED' 
  | 'TRIP_RESUMED' 
  | 'TRIP_COMPLETED' 
  | 'PASSENGER_COUNT_UPDATED' 
  | 'ISSUE_REPORTED'
  | 'LOGIN_SUCCESS'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export interface AuditLog {
  logId: string;
  userId: string;
  userName?: string;
  role: UserRole;
  action: AuditAction;
  busId?: string;
  tripId?: string;
  timestamp: string;
  details?: string;
}

export interface BusCurrentState {
  busId: string;
  tripId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  nextStopId: string;
  nextStopName: string;
  status: BusStatus;
  tripStatus: TripStatus;
  gpsStatus: GPSConnectionStatus;
  currentPassengerCount: number;
  capacity: number;
  occupancyPercentage: number;
  occupancyStatus: 'LOW' | 'MODERATE' | 'HIGH' | 'FULL';
  lastUpdated: string;
}

// ----------------------------------------------------
// Intelligent Search Engine Types (Phase 2)
// ----------------------------------------------------

export interface SearchSuggestion {
  id: string;
  type: 'STOP' | 'CITY' | 'LANDMARK';
  primaryText: string;
  secondaryText: string;
  marathiText?: string;
  matchedStopId?: string;
  matchedCity?: string;
  latitude?: number;
  longitude?: number;
}

export interface SearchFilters {
  occupancyLevel?: OccupancyLevel | 'ALL';
  busType?: BusType | 'ALL';
  directOnly?: boolean;
  maxDelayMinutes?: number;
}

export type SortOption = 
  | 'EARLIEST_ARRIVAL' 
  | 'EARLIEST_DEPARTURE' 
  | 'SHORTEST_WAIT' 
  | 'LOWEST_OCCUPANCY';

export interface SearchResultItem {
  resultId: string;
  route: Route;
  bus: Bus;
  originStop: Stop;
  destinationStop: Stop;
  etaMinutes: number;
  scheduledArrival: string;
  predictedArrival: string;
  delayMinutes: number;
  occupancyPercentage: number;
  occupancyLevel: OccupancyLevel;
  occupancySource: OccupancySource;
  availableSeats: number;
  currentLocationName: string;
  nextStopName: string;
  stopsCountBetween: number;
  confidenceScore: number;
  warningMessage?: string;
}

export interface ScheduledServiceMatch {
  scheduleId: string;
  route: Route;
  departureTime: string;
  arrivalTime: string;
  frequency: string;
  busType: BusType;
  operatingDays: string[];
}

export interface JourneySearchResult {
  searchOriginText: string;
  searchDestinationText: string;
  matchedOriginStop?: Stop;
  matchedDestinationStop?: Stop;
  matchedRoutes: Route[];
  activeResults: SearchResultItem[];
  scheduledServices: ScheduledServiceMatch[];
  nearbyAlternativeStops: { stop: Stop; distanceKm: number }[];
  possibleConnectingRoutes: Route[];
  error?: string;
  emptyReason?: 'NO_ROUTE' | 'NO_ACTIVE_BUS' | 'SAME_LOCATION' | 'UNKNOWN_LOCATION';
}
