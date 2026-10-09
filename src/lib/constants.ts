import type {
  DriverStatus, NotificationType, ShipmentPriority, ShipmentStatus, VehicleStatus, VehicleType, FuelType,
} from '@/types';

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'violet';
export interface Meta { label: string; tone: Tone }

export const VEHICLE_STATUS: Record<VehicleStatus, Meta> = {
  active: { label: 'On route', tone: 'green' },
  idle: { label: 'Idle', tone: 'slate' },
  maintenance: { label: 'In maintenance', tone: 'amber' },
  offline: { label: 'Offline', tone: 'red' },
};
export const DRIVER_STATUS: Record<DriverStatus, Meta> = {
  available: { label: 'Available', tone: 'green' },
  on_trip: { label: 'On trip', tone: 'blue' },
  off_duty: { label: 'Off duty', tone: 'slate' },
  on_leave: { label: 'On leave', tone: 'amber' },
};
export const SHIPMENT_STATUS: Record<ShipmentStatus, Meta> = {
  pending: { label: 'Pending', tone: 'slate' },
  assigned: { label: 'Assigned', tone: 'violet' },
  in_transit: { label: 'In transit', tone: 'blue' },
  delayed: { label: 'Delayed', tone: 'red' },
  delivered: { label: 'Delivered', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
};
export const PRIORITY: Record<ShipmentPriority, Meta> = {
  low: { label: 'Low', tone: 'slate' },
  normal: { label: 'Normal', tone: 'blue' },
  high: { label: 'High', tone: 'amber' },
  urgent: { label: 'Urgent', tone: 'red' },
};
export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['cancelled'],
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'delayed', 'cancelled'],
  delayed: ['in_transit', 'delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};
export const TRANSITION_LABEL: Partial<Record<ShipmentStatus, string>> = {
  in_transit: 'Start trip',
  delivered: 'Mark delivered',
  delayed: 'Report delay',
  cancelled: 'Cancel shipment',
};

export const NOTIFICATION_TYPES: Record<NotificationType, string> = {
  delayed_shipment: 'Delayed shipments',
  maintenance: 'Vehicle maintenance',
  delivery: 'Delivery updates',
  driver: 'Driver status',
};

export const VEHICLE_TYPES: VehicleType[] = ['Truck', 'Van', 'Pickup', 'Trailer'];
export const FUEL_TYPES: FuelType[] = ['Diesel', 'Petrol', 'CNG', 'Electric'];

export const LOCATIONS = [
  { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { city: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
  { city: 'Madurai', lat: 9.9252, lng: 78.1198 },
  { city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { city: 'Mumbai', lat: 19.076, lng: 72.8777 },
];
export const CITY_OPTIONS = LOCATIONS.map((l) => ({ value: l.city, label: l.city }));
export const findLocation = (city: string) => LOCATIONS.find((l) => l.city === city);

// Full class strings so Tailwind's scanner keeps them.
export const TONE_BADGE: Record<Tone, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 border border-emerald-500/20',
  blue: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30 border border-blue-500/20',
  amber: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 border border-amber-500/20',
  red: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30 border border-rose-500/20',
  slate: 'bg-slate-800/90 text-slate-300 ring-1 ring-slate-700 border border-slate-700/60',
  violet: 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30 border border-indigo-500/20',
};
export const TONE_DOT: Record<Tone, string> = {
  green: 'bg-emerald-400 shadow-glow-sm', blue: 'bg-blue-400 shadow-glow-sm', amber: 'bg-amber-400', red: 'bg-rose-400', slate: 'bg-slate-400', violet: 'bg-indigo-400 shadow-glow-sm',
};
export const TONE_SOFT: Record<Tone, string> = {
  green: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  red: 'bg-rose-500/20 text-rose-300 border border-rose-500/30', slate: 'bg-slate-800 text-slate-300 border border-slate-700', violet: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
};
export const TONE_HEX: Record<Tone, string> = {
  green: '#34d399', blue: '#60a5fa', amber: '#fbbf24', red: '#f87171', slate: '#94a3b8', violet: '#818cf8',
};


