import clsx from 'clsx';
import { Clock, MapPin, Navigation, Radio, UserRound } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FleetMap } from '@/components/map/FleetMap';
import type { MapMarker, MapRoute } from '@/components/map/FleetMap';
import { StatusBadge } from '@/components/ui/Badge';
import { DataGate } from '@/components/ui/DataGate';
import { FilterBar } from '@/components/ui/FilterBar';
import type { FilterField } from '@/components/ui/FilterBar';
import { PageHeader, ProgressBar } from '@/components/ui/Misc';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { CITY_OPTIONS, SHIPMENT_STATUS, TONE_HEX, VEHICLE_STATUS } from '@/lib/constants';
import { formatDuration, formatTime, formatNumber } from '@/lib/format';
import { liveEta, routeFor, vehiclePosition } from '@/lib/geo';
import type { Pt } from '@/lib/geo';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useFleetStore } from '@/store/useFleetStore';

const KEYS = ['q', 'status', 'city'] as const;
const FIELDS: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['assigned', 'in_transit', 'delayed'].map((s) => ({ value: s, label: SHIPMENT_STATUS[s as 'assigned'].label })) },
  { key: 'city', label: 'Location', type: 'select', options: CITY_OPTIONS },
];

function Tracking() {
  const shipments = useFleetStore((s) => s.shipments);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  const tick = useFleetStore((s) => s.tickSimulation);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('shipment');
  const { values, setFilter, reset, activeCount } = useQueryFilters(KEYS);

  useEffect(() => { const t = setInterval(tick, 3000); return () => clearInterval(t); }, [tick]);

  const tracked = useMemo(() => shipments.filter((s) => ['assigned', 'in_transit', 'delayed'].includes(s.status)), [shipments]);
  const list = useMemo(() => {
    const q = values.q.trim().toLowerCase();
    return tracked.filter((s) => (!q || `${s.id} ${s.customer.name} ${s.pickup.city} ${s.delivery.city}`.toLowerCase().includes(q))
      && (!values.status || s.status === values.status) && (!values.city || s.pickup.city === values.city || s.delivery.city === values.city));
  }, [tracked, values]);
  const selected = tracked.find((s) => s.id === selectedId);
  const select = (id: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (id && id !== selectedId) n.set('shipment', id); else n.delete('shipment'); return n; }, { replace: true });

  const routes: MapRoute[] = useMemo(() => list.map((s) => ({ id: s.id, points: routeFor(s), progress: s.progress, selected: s.id === selectedId, color: TONE_HEX[SHIPMENT_STATUS[s.status].tone] })), [list, selectedId]);
  const markers: MapMarker[] = useMemo(() => {
    const vs: MapMarker[] = vehicles.map((v) => {
      const active = shipments.find((s) => s.vehicleId === v.id && (s.status === 'in_transit' || s.status === 'delayed'));
      const driver = drivers.find((d) => d.id === v.driverId);
      return {
        id: `vehicle:${v.id}`, position: vehiclePosition(v, shipments), kind: 'vehicle', label: v.plate, sublabel: `${VEHICLE_STATUS[v.status].label}${driver ? ' · ' + driver.name : ''}`,
        tone: active?.status === 'delayed' ? 'red' : VEHICLE_STATUS[v.status].tone, pulse: !!active, selected: !!selected && selected.vehicleId === v.id, dim: !!selected && selected.vehicleId !== v.id
      };
    });
    if (!selected) return vs;
    const r = routeFor(selected);
    return [{ id: 'pickup', position: r[0]!, kind: 'pickup', label: 'Pickup', sublabel: selected.pickup.city }, { id: 'delivery', position: r[r.length - 1]!, kind: 'delivery', label: 'Delivery', sublabel: selected.delivery.city }, ...vs];
  }, [vehicles, shipments, drivers, selected]);

  const fitPoints: Pt[] = selected ? routeFor(selected) : routes.length ? routes.flatMap((r) => [r.points[0]!, r.points[r.points.length - 1]!]) : [];
  const onMarker = (id: string) => {
    if (!id.startsWith('vehicle:')) return;
    const s = shipments.find((x) => x.vehicleId === id.slice(8) && ['in_transit', 'delayed', 'assigned'].includes(x.status));
    if (s) select(s.id);
  };

  return (
    <>
      <PageHeader title="Live Tracking" description="Real-time vehicle telemetry, active transit routes and ETA estimates."
        actions={<span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs border border-slate-700/60"><Radio className="h-3.5 w-3.5 text-blue-400 animate-pulse" />Simulated Live Telemetry</span>} />
      <div className="grid gap-5 lg:h-[calc(100vh-11.5rem)] lg:min-h-[540px] lg:grid-cols-[390px_1fr]">
        <div className="order-2 flex min-h-0 flex-col lg:order-1">
          <FilterBar placeholder="Search shipment or destination city..." fields={FIELDS} values={values} onChange={setFilter} onReset={reset} activeCount={activeCount} />
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {list.length === 0 ? <EmptyState icon={<MapPin className="h-5 w-5" />} title="Nothing to track" description="No active shipments match these filters." /> : list.map((s) => {
              const on = s.id === selectedId;
              const moving = s.status !== 'assigned';
              return (
                <div key={s.id} className={clsx('rounded-2xl border bg-slate-900/90 shadow-sm transition-all duration-150', on ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md shadow-cyan-950/40' : 'border-slate-800 hover:border-slate-700 hover:shadow-md')}>
                  <button className="w-full space-y-2.5 p-4 text-left" aria-pressed={on} onClick={() => select(s.id)}>
                    <div className="flex items-center justify-between gap-2"><span className="font-display text-lg font-extrabold tracking-tight text-white">{s.id}</span><StatusBadge meta={SHIPMENT_STATUS[s.status]} /></div>
                    <p className="text-sm font-semibold text-slate-200">{s.pickup.city} <span className="text-slate-500 font-normal">→</span> {s.delivery.city}</p>
                    <ProgressBar value={s.progress * 100} tone={SHIPMENT_STATUS[s.status].tone} label={`${s.id} progress`} />
                    <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><Clock className="h-3.5 w-3.5 text-slate-500" />{moving ? `ETA ${formatTime(liveEta(s))} · ${formatDuration(liveEta(s).getTime() - Date.now())} left` : `Departs ${formatTime(s.scheduledAt)}`}</p>
                  </button>
                  {on && (
                    <div className="space-y-2.5 border-t border-slate-800 rounded-b-2xl bg-slate-950/70 p-4 text-xs">
                      <p className="flex items-center gap-2 font-medium text-slate-300"><UserRound className="h-4 w-4 text-slate-400" /><span className="font-bold text-white">{drivers.find((d) => d.id === s.driverId)?.name ?? 'Unassigned'}</span> · {vehicles.find((v) => v.id === s.vehicleId)?.plate ?? '-'}</p>
                      <p className="flex items-center gap-2 font-medium text-slate-300"><Navigation className="h-4 w-4 text-slate-400" />{formatNumber(Math.round(s.distanceKm * (1 - s.progress)))} km remaining of {formatNumber(s.distanceKm)} km</p>
                      <Link to={`/shipments/${s.id}`} className="inline-block font-bold text-cyan-400 hover:text-cyan-300 hover:underline">Open full shipment overview →</Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative order-1 h-[440px] overflow-hidden rounded-2xl border border-slate-800 shadow-md lg:order-2 lg:h-full">
          <FleetMap markers={markers} routes={routes} fitPoints={fitPoints} fitKey={selectedId ?? `all:${list.length}`} onMarkerClick={onMarker} />
          <div className="absolute bottom-4 left-4 z-[500] space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 backdrop-blur-md text-xs shadow-xl">
            {([['green', 'On route'], ['red', 'Delayed'], ['slate', 'Idle / offline'], ['amber', 'Maintenance']] as const).map(([t, l]) => <p key={l} className="flex items-center gap-2 font-bold text-slate-200"><span className="h-2.5 w-2.5 rounded-full shadow-2xs" style={{ background: TONE_HEX[t] }} />{l}</p>)}
          </div>
        </div>
      </div>
    </>
  );

}

export default function TrackingPage() {
  return <DataGate skeleton={<div className="grid gap-4 lg:grid-cols-[380px_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>}><Tracking /></DataGate>;
}
