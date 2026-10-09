import clsx from 'clsx';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { timeAgo } from '@/lib/format';
import { useFleetStore } from '@/store/useFleetStore';
import { SEVERITY_DOT } from '@/features/notifications/severity';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const notifications = useFleetStore((s) => s.notifications);
  const markRead = useFleetStore((s) => s.markRead);
  const markAllRead = useFleetStore((s) => s.markAllRead);
  const clearAllNotifications = useFleetStore((s) => s.clearAllNotifications);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const displayedList = useMemo(() => filteredNotifications.slice(0, 8), [filteredNotifications]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={clsx(
          'relative grid h-10 w-10 cursor-pointer place-items-center rounded-xl border transition-all duration-300',
          unread > 0
            ? 'border-amber-500/50 bg-slate-900 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:bg-slate-800'
            : 'border-slate-800 bg-slate-900 text-slate-300 shadow-xs hover:bg-slate-800 hover:text-white'
        )}
      >
        <Bell className={clsx('h-4.5 w-4.5 transition-transform', unread > 0 && 'animate-pulse text-amber-400')} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-extrabold text-white shadow-md">
              {unread > 9 ? '9+' : unread}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 z-50 mt-3 w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4.5 py-3.5 bg-slate-900/40">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-blue-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Notifications & Alerts</h3>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Sub-bar Filter & Actions */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter('all');
                }}
                className={clsx(
                  'rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter('unread');
                }}
                className={clsx(
                  'rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                  filter === 'unread'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )}
              >
                Unread ({unread})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllRead();
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
              >
                <Check className="h-3.5 w-3.5" /> Read all
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllNotifications();
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* List */}
          {displayedList.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              {filter === 'unread' ? 'No unread notifications.' : "You're all caught up."}
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-800/80 overflow-y-auto">
              {displayedList.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="flex w-full gap-3 px-4.5 py-3 text-left transition-colors hover:bg-slate-800/60 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(n.id);
                      setOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <span
                      className={clsx(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.read ? 'bg-transparent' : SEVERITY_DOT[n.severity]
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          'block truncate text-sm',
                          n.read ? 'text-slate-400 font-normal' : 'font-bold text-slate-100'
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="block text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-cyan-400 hover:bg-slate-800/60 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
