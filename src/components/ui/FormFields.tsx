import clsx from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1 block text-xs font-semibold text-slate-300">{label}</span>
      {children}
      {error ? <span role="alert" className="mt-1 block text-xs font-medium text-rose-400">{error}</span>
        : hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

const base = 'h-10 w-full rounded-xl border bg-slate-950/80 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:bg-slate-900 disabled:text-slate-500 shadow-inner border-slate-800';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ invalid, className, ...p }, ref) => <input ref={ref} aria-invalid={invalid || undefined} className={clsx(base, invalid ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/25' : 'border-slate-800', className)} {...p} />,
);
TextInput.displayName = 'TextInput';

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ invalid, className, children, ...p }, ref) => (
    <select ref={ref} aria-invalid={invalid || undefined} className={clsx(base, 'pr-8', invalid ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/25' : 'border-slate-800', className)} {...p}>{children}</select>
  ),
);
SelectInput.displayName = 'SelectInput';


