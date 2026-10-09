import type {
  ActivityEntry, Driver, DriverStatus, Notification, Place, Shipment, ShipmentStatus, StatusEvent, Vehicle, VehicleStatus,
} from '@/types';
import { LOCATIONS } from '@/lib/constants';
import { roadDistanceKm } from '@/lib/geo';

// Deterministic PRNG so the demo data is stable between reloads.
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

const DRIVER_NAMES = ['Arun Kumar', 'Priya Natarajan', 'Karthik Subramanian', 'Meena Iyer', 'Rahul Verma', 'Divya Menon', 'Suresh Babu',
  'Anitha Raj', 'Vikram Singh', 'Lakshmi Narayan', 'Imran Sheikh', 'Neha Kapoor', 'Ganesh Pillai', 'Farah Khan'];
const MODELS = [
  { make: 'Tata', model: 'Prima 4028', type: 'Truck', fuel: 'Diesel' },
  { make: 'Ashok Leyland', model: 'Boss 1920', type: 'Truck', fuel: 'Diesel' },
  { make: 'Eicher', model: 'Pro 3015', type: 'Truck', fuel: 'Diesel' },
  { make: 'Mahindra', model: 'Bolero Pickup', type: 'Pickup', fuel: 'Diesel' },
  { make: 'Tata', model: 'Ace Gold', type: 'Pickup', fuel: 'CNG' },
  { make: 'Force', model: 'Traveller Cargo', type: 'Van', fuel: 'Diesel' },
  { make: 'Maruti', model: 'Eeco Cargo', type: 'Van', fuel: 'Petrol' },
  { make: 'BharatBenz', model: '2823R', type: 'Truck', fuel: 'Diesel' },
  { make: 'Volvo', model: 'FM Trailer', type: 'Trailer', fuel: 'Diesel' },
] as const;
const CUSTOMERS = [
  { name: 'Sundaram Textiles', email: 'dispatch@sundaramtextiles.in', phone: '+91 94430 11820' },
  { name: 'Kaveri Agro Foods', email: 'logistics@kaveriagro.in', phone: '+91 98420 55317' },
  { name: 'Nilgiri Pharma', email: 'supply@nilgiripharma.in', phone: '+91 90030 24781' },
  { name: 'Orbit Electronics', email: 'ops@orbitelectronics.in', phone: '+91 99620 40123' },
  { name: 'Greenleaf Organics', email: 'orders@greenleaf.in', phone: '+91 97910 88245' },
  { name: 'Metro Auto Components', email: 'freight@metroauto.in', phone: '+91 98940 61209' },
  { name: 'Zenith Home Appliances', email: 'wh@zenithhome.in', phone: '+91 93610 70418' },
  { name: 'Coastal Seafoods', email: 'cold@coastalseafoods.in', phone: '+91 94890 33762' },
];
const STREETS = ['Industrial Estate Road', 'Ring Road', 'Market Yard', 'Logistics Park', 'Warehouse Lane', 'Highway Service Road', 'Port Road', 'SIDCO Complex'];
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const NOTES_DELAY = ['Heavy traffic near toll plaza', 'Road diversion due to construction', 'Weather delay on the highway', 'Vehicle halted for tyre check'];

const now = Date.now();
const place = (city: string, address: string): Place => {
  const l = LOCATIONS.find((x) => x.city === city)!;
  return { address, city, lat: l.lat + (rand() - 0.5) * 0.05, lng: l.lng + (rand() - 0.5) * 0.05 };
};

export function createSeed() {
  const drivers: Driver[] = DRIVER_NAMES.map((name, i) => {
    const status: DriverStatus = i < 10 ? 'on_trip' : i < 12 ? 'available' : i === 12 ? 'off_duty' : 'on_leave';
    return {
      id: `DRV-${101 + i}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@fleetops.example`,
      phone: `+91 9${int(1000, 9999)} ${int(10000, 99999)}`,
      licenseNo: `TN${int(10, 99)}${2010 + int(0, 9)}${int(1000000, 9999999)}`,
      licenseExpiry: iso(now + (i === 3 ? 21 : int(90, 1400)) * DAY),
      status,
      city: LOCATIONS[i % LOCATIONS.length]!.city,
      joinedAt: iso(now - int(200, 2400) * DAY),
      rating: Math.round((3.8 + rand() * 1.1) * 10) / 10,
      incidents: int(0, 3),
    };
  });

  const vehicles: Vehicle[] = Array.from({ length: 16 }, (_, i) => {
    const m = MODELS[i % MODELS.length]!;
    const status: VehicleStatus = i < 10 ? 'active' : i < 13 ? 'idle' : i === 13 ? 'offline' : 'maintenance';
    const city = LOCATIONS[(i * 3) % LOCATIONS.length]!;
    const history: ActivityEntry[] = [
      { id: `VA-${i}-1`, at: iso(now - int(2, 9) * DAY), text: `Refuelled to full tank` },
      { id: `VA-${i}-2`, at: iso(now - int(12, 30) * DAY), text: 'Routine service completed' },
      { id: `VA-${i}-3`, at: iso(now - int(40, 90) * DAY), text: 'Vehicle added to fleet' },
    ];
    return {
      id: `VEH-${201 + i}`,
      plate: `TN ${10 + i} ${pick([...LETTERS])}${pick([...LETTERS])} ${1000 + i * 137}`,
      make: m.make, model: m.model, year: int(2017, 2025), type: m.type, status,
      driverId: i < 14 ? drivers[i]!.id : null,
      fuelType: m.fuel,
      fuelLevel: i === 4 ? 12 : i === 9 ? 16 : int(28, 96),
      odometer: int(24000, 260000),
      lastServiceDate: iso(now - int(20, 150) * DAY),
      nextServiceDate: iso(now + (i === 2 ? 4 : i >= 14 ? 0 : int(15, 120)) * DAY),
      city: city.city,
      base: { lat: city.lat + (rand() - 0.5) * 0.04, lng: city.lng + (rand() - 0.5) * 0.04 },
      history,
    };
  });

  const plan: { status: ShipmentStatus; pair?: number }[] = [
    ...[0, 1, 2, 3, 4, 5, 6].map((pair) => ({ status: 'in_transit' as const, pair })),
    ...[7, 8, 9].map((pair) => ({ status: 'delayed' as const, pair })),
    ...[10, 11].map((pair) => ({ status: 'assigned' as const, pair })),
    ...Array.from({ length: 4 }, () => ({ status: 'pending' as const })),
    ...Array.from({ length: 16 }, () => ({ status: 'delivered' as const, pair: int(0, 13) })),
    ...Array.from({ length: 2 }, () => ({ status: 'cancelled' as const })),
  ];

  const shipments: Shipment[] = plan.map((p, n) => {
    const pu = pick(LOCATIONS);
    const de = pick(LOCATIONS.filter((l) => l.city !== pu.city));
    const pickup = place(pu.city, `${int(1, 220)}, ${pick(STREETS)}`);
    const delivery = place(de.city, `${int(1, 220)}, ${pick(STREETS)}`);
    const distanceKm = roadDistanceKm(pickup, delivery);
    const dur = Math.max(distanceKm / 48, 1.5) * HOUR;
    const driver = p.pair !== undefined ? drivers[p.pair]! : null;
    const vehicle = p.pair !== undefined ? vehicles[p.pair]! : null;
    let scheduledAt = now, promisedAt = now, eta = now, progress = 0, deliveredAt: number | undefined;

    switch (p.status) {
      case 'in_transit': progress = 0.15 + rand() * 0.7; scheduledAt = now - progress * dur; promisedAt = scheduledAt + dur; eta = promisedAt; break;
      case 'delayed': progress = 0.3 + rand() * 0.4; promisedAt = now - int(20, 120) * MIN; scheduledAt = promisedAt - dur; eta = now + (1 - progress) * dur * 1.1; break;
      case 'assigned': scheduledAt = now + int(1, 6) * HOUR; promisedAt = scheduledAt + dur; eta = promisedAt; break;
      case 'pending': scheduledAt = now + int(20, 50) * HOUR; promisedAt = scheduledAt + dur; eta = promisedAt; break;
      case 'delivered': {
        scheduledAt = now - (int(0, 13) * DAY + int(6, 20) * HOUR); promisedAt = scheduledAt + dur;
        const late = rand() < 0.22;
        deliveredAt = promisedAt + (late ? int(30, 150) * MIN : -int(0, 40) * MIN);
        if (deliveredAt > now) deliveredAt = now - 30 * MIN;
        eta = promisedAt; progress = 1; break;
      }
      case 'cancelled': scheduledAt = now - int(1, 5) * DAY; promisedAt = scheduledAt + dur; eta = promisedAt; break;
    }

    const id = `SHP-${10240 + n}`;
    const createdAt = scheduledAt - int(3, 30) * HOUR;
    const ev = (status: ShipmentStatus, at: number, note: string): StatusEvent => ({ id: `${id}-${status}`, status, at: iso(at), note });
    const history: StatusEvent[] = [ev('pending', createdAt, 'Shipment created')];
    if (driver && vehicle) history.push(ev('assigned', createdAt + HOUR, `Assigned to ${driver.name} · ${vehicle.plate}`));
    if (['in_transit', 'delayed', 'delivered'].includes(p.status)) history.push(ev('in_transit', scheduledAt, `Picked up in ${pickup.city}`));
    if (p.status === 'delayed') history.push(ev('delayed', promisedAt, pick(NOTES_DELAY)));
    if (p.status === 'delivered') history.push(ev('delivered', deliveredAt!, 'Delivered and signed by recipient'));
    if (p.status === 'cancelled') history.push(ev('cancelled', createdAt + 2 * HOUR, 'Cancelled by customer'));

    return {
      id, customer: pick(CUSTOMERS), pickup, delivery,
      driverId: driver?.id ?? null, vehicleId: vehicle?.id ?? null,
      status: p.status, priority: pick(['low', 'normal', 'normal', 'high', 'urgent'] as const),
      weightKg: int(2, 38) * 100, distanceKm,
      createdAt: iso(createdAt), scheduledAt: iso(scheduledAt), promisedAt: iso(promisedAt), eta: iso(eta),
      deliveredAt: deliveredAt ? iso(deliveredAt) : undefined, progress, history,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const notifications: Notification[] = [];
  let nid = 1;
  const note = (n: Omit<Notification, 'id'>) => notifications.push({ id: `NTF-${nid++}`, ...n });

  shipments.filter((s) => s.status === 'delayed').forEach((s) =>
    note({ type: 'delayed_shipment', severity: 'critical', title: `${s.id} is running late`, read: false, link: `/shipments/${s.id}`,
      message: `${s.customer.name}: ${s.pickup.city} to ${s.delivery.city} is past its delivery commitment.`, createdAt: iso(now - int(10, 90) * MIN) }));
  vehicles.forEach((v) => {
    const days = Math.ceil((new Date(v.nextServiceDate).getTime() - now) / DAY);
    if (v.status === 'maintenance') note({ type: 'maintenance', severity: 'warning', title: `${v.plate} is in maintenance`, message: `${v.make} ${v.model} is unavailable for dispatch.`, read: false, link: `/vehicles/${v.id}`, createdAt: iso(now - int(2, 20) * HOUR) });
    else if (days <= 7) note({ type: 'maintenance', severity: 'warning', title: `${v.plate} service due in ${Math.max(days, 0)} days`, message: 'Schedule a service slot before the next long haul.', read: false, link: `/vehicles/${v.id}`, createdAt: iso(now - int(3, 30) * HOUR) });
    if (v.fuelLevel < 20) note({ type: 'maintenance', severity: 'warning', title: `${v.plate} fuel at ${v.fuelLevel}%`, message: 'Plan a refuel stop on the current route.', read: false, link: `/vehicles/${v.id}`, createdAt: iso(now - int(20, 80) * MIN) });
  });
  shipments.filter((s) => s.status === 'delivered').sort((a, b) => b.deliveredAt!.localeCompare(a.deliveredAt!)).slice(0, 3).forEach((s, i) =>
    note({ type: 'delivery', severity: 'success', title: `${s.id} delivered`, message: `${s.customer.name} received the shipment in ${s.delivery.city}.`, read: i > 0, link: `/shipments/${s.id}`, createdAt: s.deliveredAt! }));
  drivers.forEach((d) => {
    if (d.status === 'off_duty' || d.status === 'on_leave') note({ type: 'driver', severity: 'info', title: `${d.name} is ${d.status === 'off_duty' ? 'off duty' : 'on leave'}`, message: 'Reassign upcoming shipments if needed.', read: true, link: `/drivers/${d.id}`, createdAt: iso(now - int(2, 12) * HOUR) });
    if (new Date(d.licenseExpiry).getTime() - now < 30 * DAY) note({ type: 'driver', severity: 'warning', title: `${d.name}'s licence expires soon`, message: 'Request a renewed licence copy before expiry.', read: false, link: `/drivers/${d.id}`, createdAt: iso(now - int(1, 6) * HOUR) });
  });
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { vehicles, drivers, shipments, notifications };
}
