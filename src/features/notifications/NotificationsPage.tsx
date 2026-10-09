import clsx from 'clsx';
import { AlertTriangle, BellOff, CheckCheck, CheckCircle2, Info, Wrench, X } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, IconButton } from '@/components/ui/Button';
import { DataGate } from '@/components/ui/DataGate';
import { PageHeader } from '@/components/ui/Misc';
import { EmptyState, TableSkeleton } from '@/components/ui/States';
import { NOTIFICATION_TYPES } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { useFleetStore } from '@/store/useFleetStore';
import type { Notification, NotificationType, Severity } from '@/types';

const ICON: Record<Severity, { node: JSX.Element; bg: string }> = {
  critical: { node: <AlertTriangle className="h-4 w-4" />, bg: 'bg-red-950/80 text-red-400 border border-red-800/60' },
  warning: { node: <Wrench className="h-4 w-4" />, bg: 'bg-amber-950/80 text-amber-400 border border-amber-800/60' },
  success: { node: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' },
  info: { node: <Info className="h-4 w-4" />, bg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' },
};
const KEYS = ['type', 'unread'] as const;

function Row({ n }: { n: Notification }) {
  const markRead = useFleetStore((s) => s.markRead);
  const dismiss = useFleetStore((s) => s.dismissNotification);
  const body = (
    <div className="flex min-w-0 flex-1 items-start gap-3.5">
      <span className={clsx('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-xs', ICON[n.severity].bg)}>{ICON[n.severity].node}</span>
      <span className="min-w-0">
        <span className={clsx('block text-sm', n.read ? 'text-slate-300 font-medium' : 'font-extrabold text-white')}>{n.title}</span>
        <span className="block text-xs text-slate-400 mt-0.5">{n.message}</span>
        <span className="mt-1 block text-[11px] font-medium text-slate-400">{NOTIFICATION_TYPES[n.type]} · {timeAgo(n.createdAt)}</span>
      </span>
    </div>
  );
  return (
    <li className={clsx('flex items-start gap-3 px-5 py-4 transition-colors', !n.read ? 'bg-cyan-950/20' : 'hover:bg-slate-800/40')}>
      {n.link ? <Link to={n.link} onClick={() => markRead(n.id)} className="flex min-w-0 flex-1 hover:opacity-90">{body}</Link> : body}
      {!n.read && <button onClick={() => markRead(n.id)} className="mt-1 whitespace-nowrap text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline">Mark read</button>}
      <IconButton label="Dismiss notification" onClick={() => dismiss(n.id)}><X className="h-4 w-4" /></IconButton>
    </li>
  );
}

function Inner() {
  const notifications = useFleetStore((s) => s.notifications);
  const markAllRead = useFleetStore((s) => s.markAllRead);
  const { values, setFilter, reset } = useQueryFilters(KEYS);
  const filtered = useMemo(() => notifications.filter((n) => (!values.type || n.type === values.type) && (values.unread !== '1' || !n.read)), [notifications, values]);
  const unread = notifications.filter((n) => !n.read).length;
  const chips: { key: string; label: string }[] = [{ key: '', label: 'All' }, ...(Object.keys(NOTIFICATION_TYPES) as NotificationType[]).map((k) => ({ key: k, label: NOTIFICATION_TYPES[k] }))];

  return (
    <>
      <PageHeader title="Alerts & Telemetry Notifications" description={unread ? `${unread} unread operational alerts requiring attention` : 'All system notifications are up to date.'}
        actions={<Button variant="secondary" disabled={!unread} icon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>Mark all as read</Button>} />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button key={c.key} aria-pressed={values.type === c.key} onClick={() => setFilter('type', c.key)}
            className={clsx('rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all', values.type === c.key ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-xs' : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800')}>{c.label}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-300"><input type="checkbox" className="h-4 w-4 rounded accent-cyan-500 bg-slate-900 border-slate-700" checked={values.unread === '1'} onChange={(e) => setFilter('unread', e.target.checked ? '1' : '')} />Unread only</label>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<BellOff className="h-5 w-5" />} title={notifications.length ? 'No alerts match this view' : 'No alerts right now'}
          description={notifications.length ? 'Change the type or turn off the unread filter.' : 'Delays, maintenance, deliveries and driver changes will show up here.'}
          action={notifications.length ? <Button variant="secondary" onClick={reset}>Show all alerts</Button> : undefined} />
      ) : (
        <ul className="divide-y divide-slate-800/80 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm">{filtered.map((n) => <Row key={n.id} n={n} />)}</ul>
      )}
    </>
  );
}


export default function NotificationsPage() {
  return <DataGate skeleton={<TableSkeleton rows={6} />}><Inner /></DataGate>;
}
