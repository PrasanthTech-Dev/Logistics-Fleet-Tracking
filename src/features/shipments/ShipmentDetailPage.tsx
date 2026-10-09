import { Pencil, Navigation } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FleetMap } from '@/components/map/FleetMap';
import type { MapMarker } from '@/components/map/FleetMap';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, InfoGrid } from '@/components/ui/Card';
import { DataGate } from '@/components/ui/DataGate';
import { Avatar, PageHeader, ProgressBar, Timeline } from '@/components/ui/Misc';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { PRIORITY, SHIPMENT_STATUS, SHIPMENT_TRANSITIONS, TONE_HEX, TRANSITION_LABEL } from '@/lib/constants';
import { errorMessage, formatDateTime, formatNumber } from '@/lib/format';
import { liveEta, pointAlong, routeFor } from '@/lib/geo';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import type { ShipmentStatus } from '@/types';
import { ShipmentForm } from './ShipmentForm';

function Detail() {
  const { id } = useParams();
  const shipment = useFleetStore((s) => s.shipments.find((x) => x.id === id));
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const setStatus = useFleetStore((s) => s.setShipmentStatus);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<ShipmentStatus | null>(null);

  if (!shipment) return <EmptyState title="Shipment not found" description="Check the shipment ID or go back to the list." action={<Link to="/shipments"><Button variant="secondary">Back to shipments</Button></Link>} />;
  const driver = drivers.find((d) => d.id === shipment.driverId);
  const vehicle = vehicles.find((v) => v.id === shipment.vehicleId);
  const meta = SHIPMENT_STATUS[shipment.status];
  const moving = shipment.status === 'in_transit' || shipment.status === 'delayed';
  const route = routeFor(shipment);
  const current = pointAlong(route, shipment.progress).position;
  const markers: MapMarker[] = [
    { id: 'pickup', position: route[0]!, kind: 'pickup', label: 'Pickup', sublabel: `${shipment.pickup.address}, ${shipment.pickup.city}` },
    { id: 'delivery', position: route[route.length - 1]!, kind: 'delivery', label: 'Delivery', sublabel: `${shipment.delivery.address}, ${shipment.delivery.city}` },
    ...(moving ? [{ id: 'vehicle', position: current, kind: 'vehicle' as const, label: vehicle?.plate ?? 'Vehicle', sublabel: driver?.name, tone: meta.tone, pulse: true }] : []),
  ];
  const allowed = SHIPMENT_TRANSITIONS[shipment.status];
  const canEdit = shipment.status === 'pending' || shipment.status === 'assigned';

  const move = async (next: ShipmentStatus) => {
    setBusy(next);
    try {
      await setStatus(shipment.id, next);
      toast.success(`${shipment.id} marked ${SHIPMENT_STATUS[next].label.toLowerCase()}`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHeader back={{ to: '/shipments', label: 'Shipments' }}
        title={<span className="flex flex-wrap items-center gap-3">{shipment.id}<StatusBadge meta={meta} /><Badge tone={PRIORITY[shipment.priority].tone} dot={false}>{PRIORITY[shipment.priority].label} priority</Badge></span>}
        description={`${shipment.customer.name} · ${shipment.pickup.city} to ${shipment.delivery.city}`}
        actions={<>
          {canEdit && <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>Edit</Button>}
          {moving && <Link to={`/tracking?shipment=${shipment.id}`}><Button variant="secondary" icon={<Navigation className="h-4 w-4" />}>Track live</Button></Link>}
          {allowed.map((n) => <Button key={n} variant={n === 'cancelled' ? 'secondary' : 'primary'} className={n === 'cancelled' ? '!text-rose-400 hover:!bg-rose-950/50 hover:!border-rose-800' : ''} loading={busy === n} disabled={!!busy} onClick={() => move(n)}>{TRANSITION_LABEL[n]}</Button>)}
        </>} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="h-72 overflow-hidden rounded-t-2xl"><FleetMap markers={markers} routes={[{ id: shipment.id, points: route, progress: shipment.progress, selected: true, color: TONE_HEX[meta.tone] }]} fitPoints={route} fitKey={shipment.id} /></div>
            <CardBody className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold"><span className="font-bold text-white">{Math.round(shipment.progress * 100)}% of {formatNumber(shipment.distanceKm)} km</span>
                <span className="text-slate-400">{shipment.status === 'delivered' ? `Delivered ${formatDateTime(shipment.deliveredAt!)}` : shipment.status === 'cancelled' ? 'Cancelled' : `ETA ${formatDateTime(liveEta(shipment))}`}</span></div>
              <ProgressBar value={shipment.progress * 100} tone={meta.tone} label="Route progress" />
            </CardBody>
          </Card>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card><CardHeader title="Pickup Details" /><CardBody><p className="font-bold text-white">{shipment.pickup.city}</p><p className="text-xs text-slate-400 mt-0.5">{shipment.pickup.address}</p><p className="mt-3 text-xs font-medium text-slate-400">Scheduled: <span className="font-semibold text-slate-200">{formatDateTime(shipment.scheduledAt)}</span></p></CardBody></Card>
            <Card><CardHeader title="Delivery Destination" /><CardBody><p className="font-bold text-white">{shipment.delivery.city}</p><p className="text-xs text-slate-400 mt-0.5">{shipment.delivery.address}</p><p className="mt-3 text-xs font-medium text-slate-400">Promised: <span className="font-semibold text-slate-200">{formatDateTime(shipment.promisedAt)}</span></p></CardBody></Card>
          </div>
          <Card><CardHeader title="Customer & Cargo Specs" /><CardBody><InfoGrid cols={3} items={[
            { label: 'Customer', value: shipment.customer.name }, { label: 'Email', value: shipment.customer.email }, { label: 'Phone', value: shipment.customer.phone },
            { label: 'Weight', value: `${formatNumber(shipment.weightKg)} kg` }, { label: 'Distance', value: `${formatNumber(shipment.distanceKm)} km` }, { label: 'Created', value: formatDateTime(shipment.createdAt) },
          ]} /></CardBody></Card>
        </div>

        <div className="space-y-5">
          <Card><CardHeader title="Resource Assignment" /><CardBody className="space-y-4">
            {driver ? <Link to={`/drivers/${driver.id}`} className="flex items-center gap-3.5 group"><Avatar name={driver.name} /><div><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Driver</span><span className="font-bold text-white group-hover:text-cyan-400 group-hover:underline">{driver.name}</span></div></Link> : <p className="text-xs text-slate-400 italic">No driver assigned yet.</p>}
            {vehicle ? <Link to={`/vehicles/${vehicle.id}`} className="block group"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle</span><span className="font-bold text-white group-hover:text-cyan-400 group-hover:underline">{vehicle.plate}</span><span className="text-xs text-slate-400"> · {vehicle.make} {vehicle.model}</span></Link> : <p className="text-xs text-slate-400 italic">No vehicle assigned yet.</p>}
          </CardBody></Card>
          <Card><CardHeader title="Status Audit Log" /><CardBody>
            <Timeline items={[...shipment.history].reverse().map((e) => ({ id: e.id, at: e.at, title: SHIPMENT_STATUS[e.status].label, note: e.note, tone: SHIPMENT_STATUS[e.status].tone }))} />
          </CardBody></Card>
        </div>
      </div>
      <ShipmentForm open={editing} shipment={shipment} onClose={() => setEditing(false)} />
    </>
  );

}

export default function ShipmentDetailPage() {
  return <DataGate skeleton={<div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-80" /></div>}><Detail /></DataGate>;
}
