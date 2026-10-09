import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx('animate-fade-in-up rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-glow-cyan', className)}>{children}</section>;
}
export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export const CardBody = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={clsx('p-5', className)}>{children}</div>
);

export function InfoGrid({ items, cols = 2 }: { items: { label: string; value: ReactNode }[]; cols?: 1 | 2 | 3 }) {
  return (
    <dl className={clsx('grid gap-x-6 gap-y-3.5', cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2')}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{i.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-bold text-slate-100">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}


