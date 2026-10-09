import { ChevronRight, Package, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataGate } from '@/components/ui/DataGate';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterField } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/Misc';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, TableSkeleton } from '@/components/ui/States';
import { CITY_OPTIONS, PRIORITY, SHIPMENT_STATUS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { paginate, useQueryFilters } from '@/hooks/useQueryFilters';
import { useFleetStore } from '@/store/useFleetStore';
import { ShipmentForm } from './ShipmentForm';

const KEYS = ['q', 'status', 'driver', 'vehicle', 'city', 'from', 'to'] as const;

export default function ShipmentsPage() {
  const shipments = useFleetStore((s) => s.shipments);
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const navigate = useNavigate();
  const { values, setFilter, setPage, reset, page, activeCount } = useQueryFilters(KEYS);
  const [creating, setCreating] = useState(false);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const fields: FilterField[] = useMemo(() => [
    { key: 'status', label: 'Status', type: 'select', options: Object.entries(SHIPMENT_STATUS).map(([value, m]) => ({ value, label: m.label })) },
    { key: 'driver', label: 'Driver', type: 'select', options: drivers.map((d) => ({ value: d.id, label: d.name })) },
    { key: 'vehicle', label: 'Vehicle', type: 'select', options: vehicles.map((v) => ({ value: v.id, label: v.plate })) },
    { key: 'city', label: 'Pickup or delivery in', type: 'select', options: CITY_OPTIONS },
    { key: 'from', label: 'Scheduled from', type: 'date' },
    { key: 'to', label: 'Scheduled to', type: 'date' },
  ], [drivers, vehicles]);

  const filtered = useMemo(() => {
    const q = values.q.trim().toLowerCase();
    const from = values.from ? new Date(`${values.from}T00:00:00`).getTime() : null;
    const to = values.to ? new Date(`${values.to}T23:59:59`).getTime() : null;
    return shipments.filter((s) => {
      const t = new Date(s.scheduledAt).getTime();
      return (!q || `${s.id} ${s.customer.name} ${s.pickup.city} ${s.delivery.city}`.toLowerCase().includes(q))
        && (!values.status || s.status === values.status) && (!values.driver || s.driverId === values.driver)
        && (!values.vehicle || s.vehicleId === values.vehicle) && (!values.city || s.pickup.city === values.city || s.delivery.city === values.city)
        && (from === null || t >= from) && (to === null || t <= to);
    });
  }, [shipments, values]);
  const { rows, pageCount, current } = paginate(filtered, page, 10);

  return (
    <>
      <PageHeader title="Shipments" description="Create, assign and follow every delivery."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>Create shipment</Button>} />
      <DataGate skeleton={<TableSkeleton />}>
        <FilterBar placeholder="Search shipment ID, customer or city" fields={fields} values={values} onChange={setFilter} onReset={reset} activeCount={activeCount} />
        {rows.length === 0 ? (
          <EmptyState icon={<Package className="h-5 w-5" />} title={shipments.length ? 'No shipments match these filters' : 'No shipments yet'}
            description={shipments.length ? 'Try widening the date range or clearing filters.' : 'Create a shipment to start dispatching.'}
            action={shipments.length ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : <Button onClick={() => setCreating(true)}>Create shipment</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr><th className="px-5 py-3.5">Shipment</th><th className="px-5 py-3.5">Route</th><th className="hidden px-5 py-3.5 lg:table-cell">Driver / Vehicle</th><th className="hidden px-5 py-3.5 md:table-cell">Schedule</th><th className="px-5 py-3.5">Status</th><th className="w-10" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {rows.map((s) => (
                    <tr key={s.id} onClick={() => navigate(`/shipments/${s.id}`)} className="cursor-pointer transition-colors hover:bg-slate-800/60">
                      <td className="px-5 py-3.5"><Link to={`/shipments/${s.id}`} onClick={(e) => e.stopPropagation()} className="font-display text-base font-extrabold text-white hover:text-cyan-400 hover:underline">{s.id}</Link><div className="text-xs text-slate-400 mt-0.5">{s.customer.name}</div></td>
                      <td className="px-5 py-3.5"><div className="font-bold text-slate-200">{s.pickup.city} <span className="text-slate-500 font-normal">→</span> {s.delivery.city}</div><div className="text-xs text-slate-400 mt-0.5">{s.distanceKm} km · {s.weightKg.toLocaleString()} kg</div></td>
                      <td className="hidden px-5 py-3.5 lg:table-cell"><div className="font-bold text-slate-200">{s.driverId ? driverMap.get(s.driverId)?.name : <span className="text-slate-500 font-normal italic">Unassigned</span>}</div><div className="text-xs text-slate-400 mt-0.5">{s.vehicleId ? vehicleMap.get(s.vehicleId)?.plate : '-'}</div></td>
                      <td className="hidden px-5 py-3.5 text-slate-300 md:table-cell"><span className="text-xs font-semibold">{formatDateTime(s.scheduledAt)}</span><div className="mt-1">{(s.priority === 'high' || s.priority === 'urgent') && <Badge tone={PRIORITY[s.priority].tone} dot={false}>{PRIORITY[s.priority].label}</Badge>}</div></td>
                      <td className="px-5 py-3.5"><StatusBadge meta={SHIPMENT_STATUS[s.status]} /></td>
                      <td className="pr-4 text-slate-500"><ChevronRight className="h-4 w-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={current} pageCount={pageCount} total={filtered.length} onChange={setPage} />
          </>


        )}
      </DataGate>
      <ShipmentForm open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
