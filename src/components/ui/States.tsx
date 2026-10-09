import clsx from 'clsx';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export const Skeleton = ({ className }: { className?: string }) => <div className={clsx('animate-pulse rounded-xl bg-slate-200/60', className)} />;

export const PageLoader = () => (
  <div className="grid min-h-[40vh] place-items-center text-blue-600" role="status" aria-label="Loading">
    <Loader2 className="h-7 w-7 animate-spin" />
  </div>
);

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5">
          <Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-2 w-full" /><Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="flex items-center gap-4 p-4.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 flex-1" /><Skeleton className="hidden h-4 w-24 sm:block" /><Skeleton className="h-5 w-20" /></div>)}
    </div>
  );
}
export function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-72 rounded-2xl lg:col-span-2" /><Skeleton className="h-72 rounded-2xl" /></div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center">
      <div className="mb-3.5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-600"><AlertTriangle className="h-6 w-6" /></div>
      <h3 className="text-lg font-bold text-slate-900">We couldn't load your fleet data</h3>
      <p className="mt-1 max-w-sm text-xs font-medium text-slate-600">{message ?? 'The request failed.'} Check your connection and try again.</p>
      {onRetry && <Button className="mt-4" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>Retry</Button>}
    </div>
  );
}

