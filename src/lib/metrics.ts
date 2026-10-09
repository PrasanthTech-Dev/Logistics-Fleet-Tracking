import type { Driver, Shipment, ShipmentStatus, Vehicle } from '@/types';
import { SHIPMENT_STATUS } from './constants';
import type { Tone } from './constants';
import { daysUntil } from './format';

const HOUR = 3_600_000;
const wasOnTime = (s: Shipment) => !!s.deliveredAt && s.deliveredAt <= s.promisedAt;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
export const isActive = (s: Shipment) => s.status === 'assigned' || s.status === 'in_transit' || s.status === 'delayed';
export const maintenanceDue = (v: Vehicle) => v.status === 'maintenance' || daysUntil(v.nextServiceDate) <= 7;

export function dashboardStats(vehicles: Vehicle[], drivers: Driver[], shipments: Shipment[]) {
  const count = (st: ShipmentStatus) => shipments.filter((s) => s.status === st).length;
  const delivered = shipments.filter((s) => s.status === 'delivered');
  const durations = delivered.filter((s) => s.deliveredAt).map((s) => new Date(s.deliveredAt!).getTime() - new Date(s.scheduledAt).getTime());
  const inService = vehicles.filter((v) => v.status !== 'maintenance' && v.status !== 'offline').length;
  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v) => v.status === 'active').length,
    totalDrivers: drivers.length,
    availableDrivers: drivers.filter((d) => d.status === 'available').length,
    inTransit: count('in_transit'),
    delayed: count('delayed'),
    delivered: delivered.length,
    activeShipments: count('in_transit') + count('delayed') + count('assigned'),
    onTimeRate: pct(delivered.filter(wasOnTime).length, delivered.length),
    avgDeliveryHours: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length / HOUR : 0,
    utilization: pct(vehicles.filter((v) => v.status === 'active').length, inService),
    avgFuel: vehicles.length ? Math.round(vehicles.reduce((a, v) => a + v.fuelLevel, 0) / vehicles.length) : 0,
    maintenanceDue: vehicles.filter(maintenanceDue).length,
  };
}

export function deliveriesByDay(shipments: Shipment[], days = 14) {
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toDateString();
    const that = shipments.filter((s) => s.status === 'delivered' && s.deliveredAt && new Date(s.deliveredAt).toDateString() === key);
    const onTime = that.filter(wasOnTime).length;
    return { label: fmt.format(d), onTime, late: that.length - onTime };
  });
}

export function driverMetrics(driverId: string, shipments: Shipment[]) {
  const mine = shipments.filter((s) => s.driverId === driverId);
  const delivered = mine.filter((s) => s.status === 'delivered');
  const late = delivered.filter((s) => !wasOnTime(s));
  const delayMin = late.map((s) => (new Date(s.deliveredAt!).getTime() - new Date(s.promisedAt).getTime()) / 60000);
  return {
    delivered: delivered.length,
    active: mine.filter(isActive).length,
    onTimeRate: pct(delivered.length - late.length, delivered.length),
    avgDelayMin: delayMin.length ? Math.round(delayMin.reduce((a, b) => a + b, 0) / delayMin.length) : 0,
    totalKm: delivered.reduce((a, s) => a + s.distanceKm, 0),
    history: [...mine].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
  };
}

export function vehicleMetrics(vehicleId: string, shipments: Shipment[]) {
  const mine = shipments.filter((s) => s.vehicleId === vehicleId);
  const delivered = mine.filter((s) => s.status === 'delivered');
  return {
    delivered: delivered.length,
    totalKm: delivered.reduce((a, s) => a + s.distanceKm, 0),
    history: [...mine].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
  };
}

export interface FeedItem { id: string; at: string; title: string; note?: string; tone: Tone; href?: string }
export function recentActivity(shipments: Shipment[], vehicles: Vehicle[], limit = 8): FeedItem[] {
  const fromShipments = shipments.flatMap((s) =>
    s.history.map((e) => ({
      id: e.id, at: e.at, title: `${s.id} · ${SHIPMENT_STATUS[e.status].label}`, note: e.note,
      tone: SHIPMENT_STATUS[e.status].tone, href: `/shipments/${s.id}`,
    })),
  );
  const fromVehicles = vehicles.flatMap((v) =>
    v.history.map((e) => ({ id: e.id, at: e.at, title: v.plate, note: e.text, tone: 'slate' as Tone, href: `/vehicles/${v.id}` })),
  );
  return [...fromShipments, ...fromVehicles].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
