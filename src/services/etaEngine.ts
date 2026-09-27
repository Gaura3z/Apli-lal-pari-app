import { BusState, ETAPrediction } from '../types';

// Haversine distance formula in Kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Modular ETA calculation taking live speed, distance, time of day and delay factors
export function calculatePredictedETA(
  bus: BusState,
  targetLat: number,
  targetLon: number,
  targetStopName: string
): ETAPrediction {
  const remainingDistanceKm = calculateDistanceKm(bus.latitude, bus.longitude, targetLat, targetLon);
  
  // Real world speed smoothing (MSRTC average ghat/highway speed ~ 40-50 km/h)
  const effectiveSpeed = Math.max(bus.currentSpeed > 5 ? bus.currentSpeed : 35, 20);
  
  // Base travel time in minutes
  const baseTravelMinutes = Math.round((remainingDistanceKm / effectiveSpeed) * 60);

  // Time of day multiplier (e.g. peak hours in Maharashtra)
  const now = new Date();
  const hour = now.getHours();
  let peakTrafficMultiplier = 1.0;
  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20)) {
    peakTrafficMultiplier = 1.25; // +25% peak delay
  }

  // Dynamic predicted delay
  const trafficDelay = Math.round(baseTravelMinutes * (peakTrafficMultiplier - 1.0));
  const totalPredictedDelay = bus.delayMinutes + trafficDelay;

  const scheduledArrivalDate = new Date(now.getTime() + baseTravelMinutes * 60000);
  const predictedArrivalDate = new Date(now.getTime() + (baseTravelMinutes + totalPredictedDelay) * 60000);

  // Format to standard time HH:MM AM/PM
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // AI-inspired crowd prediction at arrival
  // If approaching Pune/Lonavala during busy hours, boarding rates spike
  const simulatedUpcomingBoardingFactor = hour > 8 && hour < 20 ? 1.08 : 0.95;
  const predictedCountAtStop = Math.min(
    bus.capacity,
    Math.round(bus.currentPassengerCount * simulatedUpcomingBoardingFactor)
  );
  const predictedOccupancyPercent = Math.round((predictedCountAtStop / bus.capacity) * 100);
  const predictedAvailableSeats = Math.max(0, bus.capacity - predictedCountAtStop);

  let crowdLevel: 'COMFORTABLE' | 'MODERATE' | 'HIGH_OCCUPANCY' | 'OVERCROWDED' = 'MODERATE';
  let warningMessage: string | undefined;

  if (predictedOccupancyPercent >= 90) {
    crowdLevel = 'HIGH_OCCUPANCY';
    warningMessage = 'High occupancy expected at your boarding stop. Only standing / very few seats likely.';
  } else if (predictedOccupancyPercent >= 98) {
    crowdLevel = 'OVERCROWDED';
    warningMessage = 'Overcrowded service. Consider the next upcoming service.';
  } else if (predictedOccupancyPercent < 65) {
    crowdLevel = 'COMFORTABLE';
  }

  return {
    busId: bus.busId,
    stopId: targetStopName.toLowerCase().replace(/\s+/g, '-'),
    stopName: targetStopName,
    scheduledArrival: formatTime(scheduledArrivalDate),
    predictedArrival: formatTime(predictedArrivalDate),
    delayMinutes: totalPredictedDelay,
    confidenceScore: Math.max(65, Math.min(96, Math.round(95 - remainingDistanceKm * 0.4))),
    factors: {
      trafficCongestion: peakTrafficMultiplier > 1.1 ? 'HIGH' : 'LOW',
      weatherImpact: 'NONE',
      historicalVarianceMinutes: Math.round(Math.random() * 3),
      currentSpeed: bus.currentSpeed
    },
    occupancyAtArrival: {
      predictedOccupancyPercent,
      predictedAvailableSeats,
      crowdLevel,
      warningMessage
    }
  };
}
