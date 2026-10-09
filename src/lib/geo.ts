import type { LatLng, Shipment, Vehicle } from '@/types';

export type Pt = [number, number];
const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const roadDistanceKm = (a: LatLng, b: LatLng) => Math.max(5, Math.round(haversineKm(a, b) * 1.22));

/**
 * Mock route geometry: a gentle quadratic curve between two points.
 * With a real backend, replace with the polyline returned by a routing service (OSRM, Mapbox, Google).
 */
export function routePoints(a: LatLng, b: LatLng, steps = 40): Pt[] {
  const mx = (a.lat + b.lat) / 2;
  const my = (a.lng + b.lng) / 2;
  const dx = b.lat - a.lat;
  const dy = b.lng - a.lng;
  const cx = mx - dy * 0.14;
  const cy = my + dx * 0.14;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * a.lat + 2 * u * t * cx + t * t * b.lat, u * u * a.lng + 2 * u * t * cy + t * t * b.lng] as Pt;
  });
}

export function pointAlong(points: Pt[], progress: number): { position: Pt; index: number } {
  const p = Math.min(Math.max(progress, 0), 1);
  const f = p * (points.length - 1);
  const i = Math.floor(f);
  const j = Math.min(i + 1, points.length - 1);
  const t = f - i;
  return {
    position: [points[i][0] + (points[j][0] - points[i][0]) * t, points[i][1] + (points[j][1] - points[i][1]) * t],
    index: i,
  };
}

const routeCache = new Map<string, Pt[]>();
export function routeFor(s: Shipment): Pt[] {
  const key = `${s.id}:${s.pickup.lat}:${s.pickup.lng}:${s.delivery.lat}:${s.delivery.lng}`;
  let r = routeCache.get(key);
  if (!r) {
    r = routePoints(s.pickup, s.delivery);
    routeCache.set(key, r);
  }
  return r;
}

const isMoving = (s: Shipment) => s.status === 'in_transit' || s.status === 'delayed';

export function vehiclePosition(v: Vehicle, shipments: Shipment[]): Pt {
  const s = shipments.find((x) => x.vehicleId === v.id && isMoving(x));
  return s ? pointAlong(routeFor(s), s.progress).position : [v.base.lat, v.base.lng];
}

/** Live ETA from remaining distance; falls back to the scheduled ETA before departure. */
export function liveEta(s: Shipment): Date {
  if (!isMoving(s)) return new Date(s.eta);
  const speed = s.status === 'delayed' ? 36 : 48; // km/h
  return new Date(Date.now() + ((s.distanceKm * (1 - s.progress)) / speed) * 3_600_000);
}
