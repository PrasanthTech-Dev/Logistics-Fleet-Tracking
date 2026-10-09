const dateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const num = new Intl.NumberFormat('en-IN');

export const formatDateTime = (v: string | Date) => dateTime.format(new Date(v));
export const formatDate = (v: string | Date) => date.format(new Date(v));
export const formatTime = (v: string | Date) => time.format(new Date(v));
export const formatNumber = (n: number) => num.format(n);

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

export function formatDuration(ms: number) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');

export const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export const toDateInput = (v: string | Date) => new Date(v).toISOString().slice(0, 10);
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');
