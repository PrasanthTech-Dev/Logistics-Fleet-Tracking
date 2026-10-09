export interface LatLng { lat: number; lng: number }
export interface Place { address: string; city: string; lat: number; lng: number }
export interface Customer { name: string; email: string; phone: string }
export interface ActivityEntry { id: string; at: string; text: string }

export type VehicleStatus = 'active' | 'idle' | 'maintenance' | 'offline';
export type VehicleType = 'Truck' | 'Van' | 'Pickup' | 'Trailer';
export type FuelType = 'Diesel' | 'Petrol' | 'CNG' | 'Electric';

export interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
  driverId: string | null;
  fuelType: FuelType;
  fuelLevel: number; // percent
  odometer: number; // km
  lastServiceDate: string;
  nextServiceDate: string;
  city: string; // home base
  base: LatLng;
  history: ActivityEntry[];
}

export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'on_leave';
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNo: string;
  licenseExpiry: string;
  status: DriverStatus;
  city: string;
  joinedAt: string;
  rating: number;
  incidents: number;
}

export type ShipmentStatus = 'pending' | 'assigned' | 'in_transit' | 'delayed' | 'delivered' | 'cancelled';
export type ShipmentPriority = 'low' | 'normal' | 'high' | 'urgent';
export interface StatusEvent { id: string; status: ShipmentStatus; at: string; note: string }
export interface Shipment {
  id: string;
  customer: Customer;
  pickup: Place;
  delivery: Place;
  driverId: string | null;
  vehicleId: string | null;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  weightKg: number;
  distanceKm: number;
  createdAt: string;
  scheduledAt: string; // pickup time
  promisedAt: string; // original delivery commitment
  eta: string; // current estimate
  deliveredAt?: string;
  progress: number; // 0..1 along the route
  history: StatusEvent[];
}

export type NotificationType = 'delayed_shipment' | 'maintenance' | 'delivery' | 'driver';
export type Severity = 'info' | 'success' | 'warning' | 'critical';
export interface Notification {
  id: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}
