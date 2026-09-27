import { UserRole, BusStatus, AlertSeverity } from '../../types';

export interface StaffAuthorizationState {
  userId: string;
  role: UserRole;
  depotId?: string;
  assignedBusId?: string;
  isAuthorized: boolean;
}

export interface DepotFleetMetrics {
  totalBuses: number;
  activeBuses: number;
  delayedBuses: number;
  crowdedBuses: number;
}
