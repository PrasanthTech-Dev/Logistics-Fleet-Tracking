import { Pencil, Plus, Star, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { DataGate } from '@/components/ui/DataGate';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterField } from '@/components/ui/FilterBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Avatar, PageHeader } from '@/components/ui/Misc';
import { Pagination } from '@/components/ui/Pagination';
import { CardGridSkeleton, EmptyState } from '@/components/ui/States';
import { CITY_OPTIONS, DRIVER_STATUS } from '@/lib/constants';
import { errorMessage } from '@/lib/format';
import { driverMetrics } from '@/lib/metrics';
import { paginate, useQueryFilters } from '@/hooks/useQueryFilters';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import type { Driver } from '@/types';
import { DriverForm } from './DriverForm';

const KEYS = ['q', 'status', 'city'] as const;
const FIELDS: FilterField[] = [
  { key: 'status', label: 'Availability', type: 'select', options: Object.entries(DRIVER_STATUS).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'city', label: 'Home location', type: 'select', options: CITY_OPTIONS },
];

export default function DriversPage() {
  const drivers = useFleetStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const shipments = useFleetStore((s) => s.shipments);
  const removeDriver = useFleetStore((s) => s.removeDriver);
  const { values, setFilter, setPage, reset, page, activeCount } = useQueryFilters(KEYS);
  const [formFor, setFormFor] = useState<Driver | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Driver | null>(null);

  const filtered = useMemo(() => {
    const q = values.q.trim().toLowerCase();
    return drivers.filter((d) => (!q || `${d.name} ${d.email} ${d.licenseNo} ${d.phone}`.toLowerCase().includes(q))
      && (!values.status || d.status === values.status) && (!values.city || d.city === values.city));
  }, [drivers, values]);
  const { rows, pageCount, current } = paginate(filtered, page);

  return (
    <>
      <PageHeader title="Drivers" description="Profiles, availability and delivery performance."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>Add driver</Button>} />
      <DataGate skeleton={<CardGridSkeleton />}>
        <FilterBar placeholder="Search name, email, phone or licence" fields={FIELDS} values={values} onChange={setFilter} onReset={reset} activeCount={activeCount} />
        {rows.length === 0 ? (
          <EmptyState icon={<Users className="h-5 w-5" />} title={drivers.length ? 'No drivers match these filters' : 'No drivers yet'}
            description={drivers.length ? 'Try a different search or clear the filters.' : 'Add a driver to start assigning shipments.'}
            action={drivers.length ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : <Button onClick={() => setFormFor('new')}>Add driver</Button>} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((d) => {
                const m = driverMetrics(d.id, shipments);
                const vehicle = vehicles.find((v) => v.driverId === d.id);
                return (
                  <article key={d.id} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-cyan-950/20">
                    <div className="flex-1 space-y-3.5 p-5">
                      <div className="flex items-start gap-3.5">
                        <Avatar name={d.name} />
                        <div className="min-w-0 flex-1">
                          <Link to={`/drivers/${d.id}`} className="block truncate font-display text-xl font-extrabold leading-tight tracking-tight text-white hover:text-cyan-400 hover:underline">{d.name}</Link>
                          <p className="truncate text-xs font-semibold text-slate-400 mt-0.5">{d.city} · {vehicle ? vehicle.plate : 'No vehicle'}</p>
                        </div>
                        <StatusBadge meta={DRIVER_STATUS[d.status]} />
                      </div>
                      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-center">
                        <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deliveries</dt><dd className="font-display text-lg font-extrabold text-white mt-0.5">{m.delivered}</dd></div>
                        <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On Time</dt><dd className="font-display text-lg font-extrabold text-white mt-0.5">{m.delivered ? `${m.onTimeRate}%` : '-'}</dd></div>
                        <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating</dt><dd className="flex items-center justify-center gap-1 font-display text-lg font-extrabold text-white mt-0.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{d.rating.toFixed(1)}</dd></div>
                      </dl>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 rounded-b-2xl bg-slate-950/40 px-4 py-3">
                      <Link to={`/drivers/${d.id}`} className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 hover:underline">View Profile →</Link>
                      <div className="flex gap-1"><IconButton label={`Edit ${d.name}`} onClick={() => setFormFor(d)}><Pencil className="h-4 w-4" /></IconButton><IconButton label={`Remove ${d.name}`} className="hover:!bg-rose-950/50 hover:!text-rose-400" onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4" /></IconButton></div>
                    </div>
                  </article>
                );

              })}
            </div>
            <Pagination page={current} pageCount={pageCount} total={filtered.length} onChange={setPage} />
          </>
        )}
      </DataGate>
      <DriverForm open={formFor !== null} driver={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} />
      <ConfirmDialog open={!!deleting} title="Remove driver?" confirmLabel="Remove driver" message={`${deleting?.name ?? 'This driver'} will be removed and unassigned from any vehicle.`} onClose={() => setDeleting(null)}
        onConfirm={async () => { try { await removeDriver(deleting!.id); toast.success(`${deleting!.name} removed`); } catch (e) { toast.error(errorMessage(e)); } finally { setDeleting(null); } }} />
    </>
  );
}
