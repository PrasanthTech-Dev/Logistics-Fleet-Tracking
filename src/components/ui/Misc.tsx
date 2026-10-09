import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TONE_DOT, TONE_SOFT } from '@/lib/constants';
import type { Tone } from '@/lib/constants';
import { formatDateTime, initials } from '@/lib/format';

export function PageHeader({ actions, back }: { title?: ReactNode; description?: string; actions?: ReactNode; back?: { to: string; label: string } }) {
  if (!actions && !back) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      {back ? <Link to={back.to} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-3.5 w-3.5" />{back.label}</Link> : <div />}
      {actions && <div className="flex flex-wrap items-center gap-2.5 ml-auto">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, tone = 'slate', to }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; tone?: Tone; to?: string }) {
  const body = (
    <div className="group animate-fade-in-up flex h-full items-start gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4.5 shadow-xl backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-glow-cyan">
      <div className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', TONE_SOFT[tone])}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white mt-0.5 transition-colors duration-300 group-hover:text-cyan-400">{value}</p>
        {hint && <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

export function ProgressBar({ value, tone = 'blue', label }: { value: number; tone?: Tone | 'auto'; label?: string }) {
  const v = Math.min(100, Math.max(0, value));
  const t: Tone = tone === 'auto' ? (v < 20 ? 'red' : v < 40 ? 'amber' : 'green') : tone;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={clsx('h-full rounded-full transition-all duration-500', TONE_DOT[t])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span aria-hidden className={clsx('grid shrink-0 place-items-center rounded-xl font-bold text-white shadow-xs border border-white/10', size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-9.5 w-9.5 text-sm')}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 50%), hsl(${hue} 70% 35%))` }}>{initials(name)}</span>
  );
}

export interface TimelineItem { id: string; at: string; title: string; note?: string; tone?: Tone; href?: string }
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l border-slate-800 pl-5">
      {items.map((i) => (
        <li key={i.id} className="relative">
          <span className={clsx('absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-900 shadow-2xs', TONE_DOT[i.tone ?? 'slate'])} />
          <p className="text-sm font-bold text-slate-100">{i.href ? <Link className="hover:text-cyan-400 transition-colors" to={i.href}>{i.title}</Link> : i.title}</p>
          {i.note && <p className="text-xs text-slate-400 mt-0.5">{i.note}</p>}
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{formatDateTime(i.at)}</p>
        </li>
      ))}
    </ol>
  );
}


