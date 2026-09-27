import { BusState, BusStop, BusRoute, ETAPrediction } from '../../types';

export interface PassengerSearchState {
  fromQuery: string;
  toQuery: string;
  originStop?: BusStop;
  destinationStop?: BusStop;
  availableBuses: BusState[];
  selectedBus?: BusState;
  hasSearched: boolean;
}

export interface PassengerJourneyCardData {
  route: BusRoute;
  bus: BusState;
  etaPrediction: ETAPrediction;
  isHighOccupancy: boolean;
  availableSeats: number;
}
