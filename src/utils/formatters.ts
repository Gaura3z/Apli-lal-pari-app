import { BusType, OccupancySource } from '../types';

export function formatBusType(type: BusType): { label: string; marathi: string; color: string } {
  switch (type) {
    case 'LALPARI_ORDINARY':
      return { label: 'Lalpari Ordinary', marathi: 'लालपरी साधी सेवा', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    case 'HIRVANI_SEMI_LUXURY':
      return { label: 'Hirkani Semi-Luxury', marathi: 'हिरकणी निम-आराम', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'SHIVSHAHI_AC':
      return { label: 'Shivshahi A/C', marathi: 'शिवशाही वातानुकूलित', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' };
    case 'E_SHIVAI_ELECTRIC':
      return { label: 'E-Shivai Electric', marathi: 'ई-शिवाई विद्युत बस', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
    default:
      return { label: 'Ordinary Lalpari', marathi: 'साधी बस', color: 'bg-slate-700 text-slate-300 border-slate-600' };
  }
}

export function getOccupancyLevel(percent: number): {
  level: 'AVAILABLE' | 'MODERATE' | 'HIGH';
  label: string;
  badgeClass: string;
} {
  if (percent >= 85) {
    return {
      level: 'HIGH',
      label: 'High Occupancy',
      badgeClass: 'bg-red-950/80 text-red-400 border-red-800'
    };
  }
  if (percent >= 65) {
    return {
      level: 'MODERATE',
      label: 'Moderate',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800'
    };
  }
  return {
    level: 'AVAILABLE',
    label: 'Seats Available',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
  };
}
