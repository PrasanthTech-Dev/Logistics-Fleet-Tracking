import { Mail, Pencil, Phone, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, InfoGrid } from '@/components/ui/Card';
import { DataGate } from '@/components/ui/DataGate';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Avatar, PageHeader } from '@/components/ui/Misc';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { DRIVER_STATUS, SHIPMENT_STATUS, VEHICLE_STATUS } from '@/lib/constants';
import { daysUntil, errorMessage, formatDate, formatNumber } from '@/lib/format';
import { driverMetrics } from '@/lib/metrics';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import { DriverForm } from './DriverForm';

const Metric = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="font-display text-3xl font-extrabold text-white mt-0.5">{value}</p>{hint && <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>}</div>
);

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const driver = useFleetStore((s) => s.drivers.find((d) => d.id === id));
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useFleetStore((s) => s.shipments);
  const removeDriver = useFleetStore((s) => s.removeDriver);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const m = useMemo(() => (driver ? driverMetrics(driver.id, shipments) : null), [driver, shipments]);

  if (!driver || !m) return <EmptyState title="Driver profile not found" description="This profile may have been removed." action={<Link to="/drivers"><Button variant="secondary">Back to drivers</Button></Link>} />;
  const vehicle = vehicles.find((v) => v.driverId === driver.id);
  const licenceDays = daysUntil(driver.licenseExpiry);

  return (
    <>
      <PageHeader back={{ to: '/drivers', label: 'Drivers' }}
        title={<span className="flex flex-wrap items-center gap-3">{driver.name}<StatusBadge meta={DRIVER_STATUS[driver.status]} /></span>}
        description={`Based in ${driver.city} · joined ${formatDate(driver.joinedAt)}`}
        actions={<><Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>Edit</Button><Button variant="secondary" className="!text-rose-400 hover:!bg-rose-950/50 hover:!border-rose-800" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting(true)}>Remove</Button></>} />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Deliveries" value={m.delivered} hint={`${formatNumber(m.totalKm)} km covered`} />
        <Metric label="On-time rate" value={m.delivered ? `${m.onTimeRate}%` : '-'} hint={m.avgDelayMin ? `Late runs avg ${m.avgDelayMin} min` : 'No late deliveries'} />
        <Metric label="Performance Rating" value={driver.rating.toFixed(1)} hint={`${driver.incidents} incident${driver.incidents === 1 ? '' : 's'} on record`} />
        <Metric label="Active Freight" value={m.active} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card><CardHeader title="Driver Profile & Contact" /><CardBody className="space-y-4">
            <div className="flex items-center gap-3.5"><Avatar name={driver.name} size="lg" /><div className="min-w-0 space-y-1 text-xs font-semibold"><p className="flex items-center gap-2 text-slate-300"><Mail className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{driver.email}</span></p><p className="flex items-center gap-2 text-slate-300"><Phone className="h-4 w-4 shrink-0 text-slate-400" />{driver.phone}</p></div></div>
            <InfoGrid items={[{ label: 'Licence No.', value: driver.licenseNo }, { label: 'Licence Expiry', value: <span className={licenceDays < 30 ? 'text-amber-400 font-bold' : ''}>{formatDate(driver.licenseExpiry)}</span> }]} />
            {licenceDays < 30 && <p className="rounded-xl border border-amber-800/80 bg-amber-950/40 px-3.5 py-2.5 text-xs font-bold text-amber-300">Licence {licenceDays < 0 ? 'has expired' : `expires in ${licenceDays} days`}. Renewal required.</p>}
          </CardBody></Card>
          <Card><CardHeader title="Assigned Vehicle" /><CardBody>
            {vehicle ? <Link to={`/vehicles/${vehicle.id}`} className="flex items-center justify-between gap-3 group"><div><span className="block font-bold text-white group-hover:text-cyan-400 group-hover:underline">{vehicle.plate}</span><span className="text-xs text-slate-400">{vehicle.make} {vehicle.model}</span></div><StatusBadge meta={VEHICLE_STATUS[vehicle.status]} /></Link>
              : <p className="text-xs text-slate-400 italic">No vehicle assigned. Assign one from the vehicle's edit form.</p>}
          </CardBody></Card>
        </div>

        <Card className="lg:col-span-2"><CardHeader title="Delivery History Log" subtitle={`${m.history.length} assigned shipments`} />
          {m.history.length === 0 ? <CardBody><p className="text-sm text-slate-400">This driver hasn't been assigned any shipments yet.</p></CardBody> : (
            <ul className="divide-y divide-slate-800">
              {m.history.slice(0, 10).map((s) => (
                <li key={s.id}><Link to={`/shipments/${s.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-800/50 transition-colors">
                  <span className="min-w-0"><span className="block text-sm font-bold text-white">{s.id} · {s.customer.name}</span><span className="block truncate text-xs text-slate-400 mt-0.5">{s.pickup.city} → {s.delivery.city} · {formatDate(s.scheduledAt)}</span></span>
                  <span className="flex shrink-0 items-center gap-2.5">{s.deliveredAt && <Star className={`h-4 w-4 ${s.deliveredAt <= s.promisedAt ? 'fill-emerald-500 text-emerald-600' : 'text-slate-600'}`} aria-label={s.deliveredAt <= s.promisedAt ? 'On time' : 'Late'} />}<StatusBadge meta={SHIPMENT_STATUS[s.status]} /></span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <DriverForm open={editing} driver={driver} onClose={() => setEditing(false)} />
      <ConfirmDialog open={deleting} title="Remove driver?" confirmLabel="Remove driver" message={`${driver.name} will be removed and unassigned from any vehicle.`} onClose={() => setDeleting(false)}
        onConfirm={async () => { try { await removeDriver(driver.id); toast.success(`${driver.name} removed`); navigate('/drivers'); } catch (e) { toast.error(errorMessage(e)); setDeleting(false); } }} />
    </>
  );

}

export default function DriverDetailPage() {
  return <DataGate skeleton={<div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64" /></div>}><Detail /></DataGate>;
}
