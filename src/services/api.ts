/**
 * API layer. Every screen talks to `api.*` only, never to fetch or the seed data directly.
 *
 * - VITE_USE_MOCK=true (default): an in-memory database with simulated latency.
 * - VITE_USE_MOCK=false: REST calls to VITE_API_URL using the conventional routes
 *     GET/POST /vehicles, PATCH/DELETE /vehicles/:id  (same for drivers, shipments, notifications)
 * Swapping to a real backend only requires matching these routes and response shapes.
 */
import { createSeed } from '@/data/seed';
import type { Driver, Notification, Shipment, Vehicle } from '@/types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export class ApiError extends Error {
  constructor(message: string, public status?: number) { super(message); }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.');
  }
  if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const latency = (ms = 450) => new Promise((r) => setTimeout(r, ms + Math.random() * 250));
let counter = 0;
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}${counter++}`;

export interface Crud<T extends { id: string }> {
  list(): Promise<T[]>;
  create(data: Omit<T, 'id'> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

function resource<T extends { id: string }>(path: string, prefix: string, rows: () => T[]): Crud<T> {
  if (!USE_MOCK) {
    return {
      list: () => http<T[]>(path),
      create: (d) => http<T>(path, { method: 'POST', body: JSON.stringify(d) }),
      update: (id, p) => http<T>(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
      remove: (id) => http<void>(`${path}/${id}`, { method: 'DELETE' }),
    };
  }
  return {
    async list() { await latency(); return structuredClone(rows()); },
    async create(data) {
      await latency(250);
      const item = { id: makeId(prefix), ...data } as T;
      rows().unshift(item);
      return structuredClone(item);
    },
    async update(id, patch) {
      await latency(250);
      const list = rows();
      const i = list.findIndex((r) => r.id === id);
      if (i < 0) throw new ApiError('Record not found', 404);
      list[i] = { ...list[i]!, ...patch };
      return structuredClone(list[i]!);
    },
    async remove(id) {
      await latency(250);
      const list = rows();
      const i = list.findIndex((r) => r.id === id);
      if (i >= 0) list.splice(i, 1);
    },
  };
}

const db = createSeed();

export const api = {
  vehicles: resource<Vehicle>('/vehicles', 'VEH', () => db.vehicles),
  drivers: resource<Driver>('/drivers', 'DRV', () => db.drivers),
  shipments: resource<Shipment>('/shipments', 'SHP', () => db.shipments),
  notifications: resource<Notification>('/notifications', 'NTF', () => db.notifications),
};
