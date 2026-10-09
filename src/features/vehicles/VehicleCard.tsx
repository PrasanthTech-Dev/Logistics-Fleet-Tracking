import { CalendarClock, Fuel, Gauge, Pencil, Trash2, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Avatar, ProgressBar } from '@/components/ui/Misc';
import { VEHICLE_STATUS } from '@/lib/constants';
import { daysUntil, formatDate, formatNumber } from '@/lib/format';
import type { Driver, Vehicle } from '@/types';

export function VehicleCard({ vehicle: v, driver, onEdit, onDelete }: { vehicle: Vehicle; driver?: Driver; onEdit: () => void; onDelete: () => void }) {
  const days = daysUntil(v.nextServiceDate);
  const due = v.status === 'maintenance' || days <= 7;
  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg transition-all duration-200 hover:border-slate-700 hover:shadow-2xl">
      <div className="flex-1 space-y-3.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-500/10">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link to={`/vehicles/${v.id}`} className="block truncate font-display text-xl font-extrabold tracking-tight text-white hover:text-cyan-400 hover:underline">{v.plate}</Link>
              <p className="truncate text-xs font-semibold text-slate-400 mt-0.5">{v.make} {v.model} · {v.type} · {v.year}</p>
            </div>
          </div>
          <StatusBadge meta={VEHICLE_STATUS[v.status]} />
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          {driver ? <><Avatar name={driver.name} size="sm" /><Link to={`/drivers/${driver.id}`} className="truncate font-bold text-slate-200 hover:text-cyan-400 hover:underline">{driver.name}</Link></> : <span className="text-xs font-medium text-slate-500 italic">No driver assigned</span>}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400 font-semibold"><span className="inline-flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-slate-500" />Fuel · {v.fuelType}</span><span className="font-bold text-slate-200">{v.fuelLevel}%</span></div>
          <ProgressBar value={v.fuelLevel} tone="auto" label="Fuel level" />
        </div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 pt-1">
          <span className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-slate-500" />{formatNumber(v.odometer)} km</span>
          <span className={due ? 'inline-flex items-center gap-1.5 font-bold text-amber-400' : 'inline-flex items-center gap-1.5'}>
            <CalendarClock className="h-3.5 w-3.5 text-slate-500" />{v.status === 'maintenance' ? 'In workshop' : days < 0 ? 'Service overdue' : `Service ${formatDate(v.nextServiceDate)}`}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 rounded-b-2xl bg-slate-950/40 px-4 py-3">
        <Link to={`/vehicles/${v.id}`} className="text-xs font-bold uppercase tracking-wider text-cyan-400 hover:underline">View details →</Link>
        <div className="flex gap-1"><IconButton label={`Edit ${v.plate}`} onClick={onEdit}><Pencil className="h-4 w-4" /></IconButton><IconButton label={`Remove ${v.plate}`} onClick={onDelete} className="hover:!bg-rose-900/40 hover:!text-rose-400"><Trash2 className="h-4 w-4" /></IconButton></div>
      </div>
    </article>
  );
}
