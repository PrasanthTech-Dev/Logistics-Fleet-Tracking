import { Plus, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DataGate } from '@/components/ui/DataGate';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterField } from '@/components/ui/FilterBar';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/Misc';
import { Pagination } from '@/components/ui/Pagination';
import { CardGridSkeleton, EmptyState } from '@/components/ui/States';
import { CITY_OPTIONS, VEHICLE_STATUS, VEHICLE_TYPES } from '@/lib/constants';
import { errorMessage } from '@/lib/format';
import { paginate, useQueryFilters } from '@/hooks/useQueryFilters';
import { useFleetStore } from '@/store/useFleetStore';
import { toast } from '@/store/useToastStore';
import type { Vehicle } from '@/types';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';

const KEYS = ['q', 'status', 'type', 'city'] as const;
const FIELDS: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: Object.entries(VEHICLE_STATUS).map(([value, m]) => ({ value, label: m.label })) },
  { key: 'type', label: 'Type', type: 'select', options: VEHICLE_TYPES.map((t) => ({ value: t, label: t })) },
  { key: 'city', label: 'Base location', type: 'select', options: CITY_OPTIONS },
];

export default function VehiclesPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  const removeVehicle = useFleetStore((s) => s.removeVehicle);
  const { values, setFilter, setPage, reset, page, activeCount } = useQueryFilters(KEYS);
  const [formFor, setFormFor] = useState<Vehicle | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  const filtered = useMemo(() => {
    const q = values.q.trim().toLowerCase();
    return vehicles.filter((v) => {
      const driver = v.driverId ? driverMap.get(v.driverId)?.name ?? '' : '';
      return (!q || `${v.plate} ${v.make} ${v.model} ${driver}`.toLowerCase().includes(q))
        && (!values.status || v.status === values.status) && (!values.type || v.type === values.type) && (!values.city || v.city === values.city);
    });
  }, [vehicles, driverMap, values]);
  const { rows, pageCount, current } = paginate(filtered, page);

  return (
    <>
      <PageHeader title="Vehicles" description="Manage your fleet, assignments, fuel and service schedules."
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>Add vehicle</Button>} />
      <DataGate skeleton={<CardGridSkeleton />}>
        <FilterBar placeholder="Search plate, model or driver" fields={FIELDS} values={values} onChange={setFilter} onReset={reset} activeCount={activeCount} />
        {rows.length === 0 ? (
          <EmptyState icon={<Truck className="h-5 w-5" />} title={vehicles.length ? 'No vehicles match these filters' : 'Your fleet is empty'}
            description={vehicles.length ? 'Try a different search or clear the filters.' : 'Add your first vehicle to start assigning drivers and shipments.'}
            action={vehicles.length ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : <Button onClick={() => setFormFor('new')}>Add vehicle</Button>} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((v) => <VehicleCard key={v.id} vehicle={v} driver={v.driverId ? driverMap.get(v.driverId) : undefined} onEdit={() => setFormFor(v)} onDelete={() => setDeleting(v)} />)}
            </div>
            <Pagination page={current} pageCount={pageCount} total={filtered.length} onChange={setPage} />
          </>
        )}
      </DataGate>
      <VehicleForm open={formFor !== null} vehicle={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} />
      <ConfirmDialog open={!!deleting} title="Remove vehicle?" confirmLabel="Remove vehicle"
        message={`${deleting?.plate ?? 'This vehicle'} and its history will be removed from the fleet. This can't be undone.`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => { try { await removeVehicle(deleting!.id); toast.success(`${deleting!.plate} removed`); setDeleting(null); } catch (e) { toast.error(errorMessage(e)); setDeleting(null); } }} />
    </>
  );
}
