import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, InfoGrid } from '@/components/ui/Card';
import { DataGate } from '@/components/ui/DataGate';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Avatar, PageHeader, ProgressBar, Timeline } from '@/components/ui/Misc';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { SHIPMENT_STATUS, VEHICLE_STATUS } from '@/lib/constants';
import { daysUntil, errorMessage, formatDate, formatNumber } from '@/lib/format';
import { vehicleMetrics } from '@/lib/metrics';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import { VehicleForm } from './VehicleForm';

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vehicle = useFleetStore((s) => s.vehicles.find((v) => v.id === id));
  const drivers = useFleetStore((s) => s.drivers);
  const shipments = useFleetStore((s) => s.shipments);
  const removeVehicle = useFleetStore((s) => s.removeVehicle);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const metrics = useMemo(() => (vehicle ? vehicleMetrics(vehicle.id, shipments) : null), [vehicle, shipments]);

  if (!vehicle || !metrics) return <EmptyState title="Vehicle not found" description="It may have been removed from the fleet." action={<Link to="/vehicles"><Button variant="secondary">Back to vehicles</Button></Link>} />;
  const driver = drivers.find((d) => d.id === vehicle.driverId);
  const days = daysUntil(vehicle.nextServiceDate);

  return (
    <>
      <PageHeader back={{ to: '/vehicles', label: 'Vehicles' }}
        title={<span className="flex flex-wrap items-center gap-3">{vehicle.plate}<StatusBadge meta={VEHICLE_STATUS[vehicle.status]} /></span>}
        description={`${vehicle.make} ${vehicle.model} · ${vehicle.type} · ${vehicle.year}`}
        actions={<><Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>Edit</Button><Button variant="secondary" className="!text-rose-400 hover:!bg-rose-950/50 hover:!border-rose-800" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting(true)}>Remove</Button></>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card><CardHeader title="Vehicle Specifications & Telemetry" /><CardBody><InfoGrid cols={3} items={[
            { label: 'Base location', value: vehicle.city }, { label: 'Fuel type', value: vehicle.fuelType }, { label: 'Odometer', value: `${formatNumber(vehicle.odometer)} km` },
            { label: 'Deliveries completed', value: metrics.delivered }, { label: 'Distance on deliveries', value: `${formatNumber(metrics.totalKm)} km` }, { label: 'Year', value: vehicle.year },
          ]} /></CardBody></Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card><CardHeader title="Fuel Status" /><CardBody className="space-y-2.5">
              <p className="font-display text-3xl font-extrabold text-white">{vehicle.fuelLevel}%</p>
              <ProgressBar value={vehicle.fuelLevel} tone="auto" label="Fuel level" />
              <p className="text-xs font-medium text-slate-400">{vehicle.fuelLevel < 20 ? 'Low fuel reserve. Refuel stop advised.' : 'Fuel level is within normal range.'}</p>
            </CardBody></Card>
            <Card><CardHeader title="Maintenance Schedule" /><CardBody>
              <InfoGrid items={[{ label: 'Last service', value: formatDate(vehicle.lastServiceDate) }, { label: 'Next service', value: formatDate(vehicle.nextServiceDate) }]} />
              <p className={`mt-3 text-xs font-bold ${days <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>{vehicle.status === 'maintenance' ? 'Currently in workshop' : days < 0 ? `Overdue by ${-days} days` : `Service due in ${days} days`}</p>
            </CardBody></Card>
          </div>

          <Card><CardHeader title="Trip History" subtitle={`${metrics.history.length} total shipments`} />
            {metrics.history.length === 0 ? <CardBody><p className="text-sm text-slate-400">No shipments registered for this vehicle.</p></CardBody> : (
              <ul className="divide-y divide-slate-800">
                {metrics.history.slice(0, 8).map((s) => (
                  <li key={s.id}><Link to={`/shipments/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-800/50 transition-colors">
                    <span className="min-w-0"><span className="block text-sm font-bold text-white">{s.id}</span><span className="block truncate text-xs text-slate-400 mt-0.5">{s.pickup.city} → {s.delivery.city}</span></span>
                    <StatusBadge meta={SHIPMENT_STATUS[s.status]} />
                  </Link></li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card><CardHeader title="Assigned Driver" /><CardBody>
            {driver ? <Link to={`/drivers/${driver.id}`} className="flex items-center gap-3.5 group"><Avatar name={driver.name} size="lg" /><div><span className="block font-bold text-white group-hover:text-cyan-400 group-hover:underline">{driver.name}</span><span className="text-xs text-slate-400">{driver.phone}</span></div></Link>
              : <p className="text-xs text-slate-400 italic">No driver assigned. Click edit to assign a driver.</p>}
          </CardBody></Card>
          <Card><CardHeader title="Telemetry & Logs" /><CardBody><Timeline items={vehicle.history.map((h) => ({ id: h.id, at: h.at, title: h.text }))} /></CardBody></Card>
        </div>
      </div>
      <VehicleForm open={editing} vehicle={vehicle} onClose={() => setEditing(false)} />
      <ConfirmDialog open={deleting} title="Remove vehicle?" confirmLabel="Remove vehicle" message={`${vehicle.plate} and its history will be removed. This can't be undone.`} onClose={() => setDeleting(false)}
        onConfirm={async () => { try { await removeVehicle(vehicle.id); toast.success(`${vehicle.plate} removed`); navigate('/vehicles'); } catch (e) { toast.error(errorMessage(e)); setDeleting(false); } }} />
    </>
  );

}

export default function VehicleDetailPage() {
  return <DataGate skeleton={<div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64" /></div>}><Detail /></DataGate>;
}
