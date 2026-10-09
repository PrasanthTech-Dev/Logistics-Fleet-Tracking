import { create } from 'zustand';
import { api } from '@/services/api';
import type {
  ActivityEntry, Customer, Driver, Notification, Shipment, ShipmentPriority, ShipmentStatus, StatusEvent, Vehicle,
} from '@/types';
import { LOCATIONS, SHIPMENT_TRANSITIONS, SHIPMENT_STATUS, VEHICLE_STATUS, DRIVER_STATUS, findLocation } from '@/lib/constants';
import { roadDistanceKm } from '@/lib/geo';
import { errorMessage } from '@/lib/format';
import { isActive } from '@/lib/metrics';
import type { Place } from '@/types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type VehicleInput = Pick<Vehicle, 'plate' | 'make' | 'model' | 'year' | 'type' | 'status' | 'driverId' | 'fuelType' | 'fuelLevel' | 'odometer' | 'lastServiceDate' | 'nextServiceDate' | 'city'>;
export type DriverInput = Pick<Driver, 'name' | 'email' | 'phone' | 'licenseNo' | 'licenseExpiry' | 'city' | 'status'>;
export interface ShipmentInput {
  customer: Customer;
  pickup: { city: string; address: string };
  delivery: { city: string; address: string };
  weightKg: number;
  priority: ShipmentPriority;
  scheduledAt: string; // ISO
  driverId: string | null;
  vehicleId: string | null;
}

interface FleetState {
  vehicles: Vehicle[];
  drivers: Driver[];
  shipments: Shipment[];
  notifications: Notification[];
  status: LoadStatus;
  error: string | null;
  load: () => Promise<void>;
  addVehicle: (input: VehicleInput) => Promise<void>;
  updateVehicle: (id: string, input: VehicleInput) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  addDriver: (input: DriverInput) => Promise<void>;
  updateDriver: (id: string, input: DriverInput) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  addShipment: (input: ShipmentInput) => Promise<void>;
  updateShipment: (id: string, input: ShipmentInput) => Promise<void>;
  setShipmentStatus: (id: string, next: ShipmentStatus, note?: string) => Promise<void>;
  tickSimulation: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const nowIso = () => new Date().toISOString();
const place = (p: { city: string; address: string }): Place => {
  const l = findLocation(p.city) ?? LOCATIONS[0]!;
  return { address: p.address, city: l.city, lat: l.lat, lng: l.lng };
};
const schedule = (distanceKm: number, scheduledAt: string) => {
  const promised = new Date(new Date(scheduledAt).getTime() + Math.max(distanceKm / 48, 1.5) * 3_600_000).toISOString();
  return promised;
};
const DEFAULT_NOTE: Record<ShipmentStatus, string> = {
  pending: 'Shipment created', assigned: 'Driver and vehicle assigned', in_transit: 'Trip started', delayed: 'Delay reported on route',
  delivered: 'Delivered to recipient', cancelled: 'Shipment cancelled',
};

/**
 * Cascading rules (a driver can only drive one vehicle, delivering frees the driver, etc.) live here
 * so the mock backend behaves like a real one. With a real API these rules belong on the server and
 * the actions below would simply refetch or merge the response.
 */
export const useFleetStore = create<FleetState>((set, get) => {
  const pushNotification = (n: Pick<Notification, 'type' | 'severity' | 'title' | 'message' | 'link'>) => {
    const full: Notification = { ...n, id: uid('NTF'), createdAt: nowIso(), read: false };
    set((s) => ({ notifications: [full, ...s.notifications] }));
    api.notifications.create(full).catch(() => undefined);
  };
  const commitVehicle = async (id: string, patch: Partial<Vehicle>) => {
    await api.vehicles.update(id, patch);
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  };
  const commitDriver = async (id: string, patch: Partial<Driver>) => {
    await api.drivers.update(id, patch);
    set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  };
  const commitShipment = async (id: string, patch: Partial<Shipment>) => {
    await api.shipments.update(id, patch);
    set((s) => ({ shipments: s.shipments.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  };
  const entry = (text: string): ActivityEntry => ({ id: uid('ACT'), at: nowIso(), text });
  const logVehicle = async (vehicleId: string | null, text: string, patch: Partial<Vehicle> = {}) => {
    const v = vehicleId ? get().vehicles.find((x) => x.id === vehicleId) : undefined;
    if (v) await commitVehicle(v.id, { ...patch, history: [entry(text), ...v.history] });
  };
  /** A driver can drive only one vehicle: free them from any other vehicle. */
  const unassignDriver = async (driverId: string, exceptVehicleId: string) => {
    const others = get().vehicles.filter((v) => v.driverId === driverId && v.id !== exceptVehicleId);
    await Promise.all(others.map((o) => commitVehicle(o.id, { driverId: null, history: [entry('Driver reassigned to another vehicle'), ...o.history] })));
  };
  const activeFor = (field: 'driverId' | 'vehicleId', id: string) =>
    get().shipments.some((s) => s[field] === id && isActive(s));

  return {
    vehicles: [], drivers: [], shipments: [], notifications: [], status: 'idle', error: null,

    async load() {
      set({ status: 'loading', error: null });
      try {
        const [vehicles, drivers, shipments, notifications] = await Promise.all([
          api.vehicles.list(), api.drivers.list(), api.shipments.list(), api.notifications.list(),
        ]);
        set({ vehicles, drivers, shipments, notifications, status: 'ready' });
      } catch (e) {
        set({ status: 'error', error: errorMessage(e) });
      }
    },

    // ---- vehicles
    async addVehicle(input) {
      const loc = findLocation(input.city) ?? LOCATIONS[0]!;
      const created = await api.vehicles.create({
        ...input, base: { lat: loc.lat, lng: loc.lng }, history: [entry('Vehicle added to fleet')],
      });
      set((s) => ({ vehicles: [created, ...s.vehicles] }));
      if (input.driverId) await unassignDriver(input.driverId, created.id);
    },
    async updateVehicle(id, input) {
      const prev = get().vehicles.find((v) => v.id === id);
      if (!prev) throw new Error('Vehicle not found');
      const history = [...prev.history];
      if (input.driverId !== prev.driverId) {
        const d = get().drivers.find((x) => x.id === input.driverId);
        history.unshift(entry(d ? `Assigned to ${d.name}` : 'Driver unassigned'));
      }
      if (input.status !== prev.status) history.unshift(entry(`Status changed to ${VEHICLE_STATUS[input.status].label}`));
      const loc = findLocation(input.city);
      await commitVehicle(id, { ...input, base: loc ? { lat: loc.lat, lng: loc.lng } : prev.base, history });
      if (input.driverId && input.driverId !== prev.driverId) await unassignDriver(input.driverId, id);
      if (input.status === 'maintenance' && prev.status !== 'maintenance')
        pushNotification({ type: 'maintenance', severity: 'warning', title: `${input.plate} moved to maintenance`, message: 'The vehicle is unavailable for dispatch.', link: `/vehicles/${id}` });
    },
    async removeVehicle(id) {
      if (activeFor('vehicleId', id)) throw new Error('This vehicle is assigned to an active shipment. Reassign or complete the shipment first.');
      await api.vehicles.remove(id);
      set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
    },

    // ---- drivers
    async addDriver(input) {
      const created = await api.drivers.create({ ...input, joinedAt: nowIso(), rating: 4.5, incidents: 0 });
      set((s) => ({ drivers: [created, ...s.drivers] }));
    },
    async updateDriver(id, input) {
      const prev = get().drivers.find((d) => d.id === id);
      if (!prev) throw new Error('Driver not found');
      await commitDriver(id, input);
      if (prev.status !== input.status)
        pushNotification({ type: 'driver', severity: 'info', title: `${input.name} is now ${DRIVER_STATUS[input.status].label.toLowerCase()}`, message: 'Driver status was updated.', link: `/drivers/${id}` });
    },
    async removeDriver(id) {
      if (activeFor('driverId', id)) throw new Error('This driver has an active shipment. Reassign or complete it first.');
      await Promise.all(get().vehicles.filter((v) => v.driverId === id).map((v) => commitVehicle(v.id, { driverId: null })));
      await api.drivers.remove(id);
      set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) }));
    },

    // ---- shipments
    async addShipment(input) {
      const pickup = place(input.pickup);
      const delivery = place(input.delivery);
      const distanceKm = roadDistanceKm(pickup, delivery);
      const promisedAt = schedule(distanceKm, input.scheduledAt);
      const status: ShipmentStatus = input.driverId && input.vehicleId ? 'assigned' : 'pending';
      const at = nowIso();
      const history: StatusEvent[] = [{ id: uid('EVT'), status: 'pending', at, note: DEFAULT_NOTE.pending }];
      if (status === 'assigned') history.push({ id: uid('EVT'), status: 'assigned', at, note: DEFAULT_NOTE.assigned });
      const created = await api.shipments.create({
        customer: input.customer, pickup, delivery, driverId: input.driverId, vehicleId: input.vehicleId, status,
        priority: input.priority, weightKg: input.weightKg, distanceKm, createdAt: at, scheduledAt: input.scheduledAt,
        promisedAt, eta: promisedAt, progress: 0, history,
      });
      set((s) => ({ shipments: [created, ...s.shipments] }));
      pushNotification({ type: 'delivery', severity: 'info', title: `${created.id} created`, message: `${input.customer.name}: ${pickup.city} to ${delivery.city}.`, link: `/shipments/${created.id}` });
    },
    async updateShipment(id, input) {
      const prev = get().shipments.find((s) => s.id === id);
      if (!prev) throw new Error('Shipment not found');
      const pickup = place(input.pickup);
      const delivery = place(input.delivery);
      const distanceKm = roadDistanceKm(pickup, delivery);
      const promisedAt = schedule(distanceKm, input.scheduledAt);
      const patch: Partial<Shipment> = {
        customer: input.customer, pickup, delivery, distanceKm, priority: input.priority, weightKg: input.weightKg,
        scheduledAt: input.scheduledAt, promisedAt, eta: promisedAt, driverId: input.driverId, vehicleId: input.vehicleId,
      };
      const assigned = !!(input.driverId && input.vehicleId);
      if (prev.status === 'pending' && assigned) { patch.status = 'assigned'; patch.history = [...prev.history, { id: uid('EVT'), status: 'assigned', at: nowIso(), note: DEFAULT_NOTE.assigned }]; }
      if (prev.status === 'assigned' && !assigned) { patch.status = 'pending'; patch.history = [...prev.history, { id: uid('EVT'), status: 'pending', at: nowIso(), note: 'Assignment removed' }]; }
      await commitShipment(id, patch);
    },
    async setShipmentStatus(id, next, note) {
      const s = get().shipments.find((x) => x.id === id);
      if (!s) throw new Error('Shipment not found');
      if (!SHIPMENT_TRANSITIONS[s.status].includes(next))
        throw new Error(`A ${SHIPMENT_STATUS[s.status].label.toLowerCase()} shipment can't be marked ${SHIPMENT_STATUS[next].label.toLowerCase()}.`);
      if (next === 'in_transit' && (!s.driverId || !s.vehicleId)) throw new Error('Assign a driver and a vehicle before starting the trip.');
      const at = nowIso();
      const patch: Partial<Shipment> = { status: next, history: [...s.history, { id: uid('EVT'), status: next, at, note: note ?? DEFAULT_NOTE[next] }] };
      if (next === 'delivered') { patch.deliveredAt = at; patch.progress = 1; }
      if (next === 'in_transit' && s.status === 'assigned') patch.progress = 0.02;
      if (next === 'delayed') patch.eta = new Date(new Date(s.eta).getTime() + 45 * 60_000).toISOString();
      await commitShipment(id, patch);

      const driver = get().drivers.find((d) => d.id === s.driverId);
      const vehicle = get().vehicles.find((v) => v.id === s.vehicleId);
      if (next === 'in_transit') {
        if (driver) await commitDriver(driver.id, { status: 'on_trip' });
        await logVehicle(s.vehicleId, `Started trip ${s.id} to ${s.delivery.city}`, { status: 'active' });
      }
      if (next === 'delivered' || next === 'cancelled') {
        if (driver?.status === 'on_trip') await commitDriver(driver.id, { status: 'available' });
        if (vehicle?.status === 'active') await logVehicle(vehicle.id, next === 'delivered' ? `Completed trip ${s.id}` : `Trip ${s.id} cancelled`, { status: 'idle' });
      }
      if (next === 'delayed') pushNotification({ type: 'delayed_shipment', severity: 'critical', title: `${s.id} is delayed`, message: note ?? `${s.customer.name}: ${s.pickup.city} to ${s.delivery.city}.`, link: `/shipments/${s.id}` });
      if (next === 'delivered') pushNotification({ type: 'delivery', severity: 'success', title: `${s.id} delivered`, message: `${s.customer.name} received the shipment in ${s.delivery.city}.`, link: `/shipments/${s.id}` });
      if (next === 'in_transit') pushNotification({ type: 'delivery', severity: 'info', title: `${s.id} is on the way`, message: `Heading to ${s.delivery.city}.`, link: `/shipments/${s.id}` });
    },
    /** Demo only: advances moving shipments along their routes so the tracking map feels live. */
    tickSimulation() {
      set((st) => ({
        shipments: st.shipments.map((x) =>
          (x.status === 'in_transit' || x.status === 'delayed') && x.progress < 0.97 ? { ...x, progress: Math.min(0.97, x.progress + 0.003) } : x),
      }));
    },

    // ---- notifications
    markRead(id) {
      set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      api.notifications.update(id, { read: true }).catch(() => undefined);
    },
    markAllRead() {
      const unread = get().notifications.filter((n) => !n.read);
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      unread.forEach((n) => api.notifications.update(n.id, { read: true }).catch(() => undefined));
    },
    dismissNotification(id) {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      api.notifications.remove(id).catch(() => undefined);
    },
    clearAllNotifications() {
      const current = get().notifications;
      set({ notifications: [] });
      current.forEach((n) => api.notifications.remove(n.id).catch(() => undefined));
    },
  };
});
