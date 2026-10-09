import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 active:scale-[0.98] border border-blue-400/30',
  secondary: 'bg-slate-850 text-slate-200 border border-slate-700/80 hover:bg-slate-750 hover:text-white hover:border-slate-600 shadow-xs active:scale-[0.98]',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white',
  danger: 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-500/25 active:scale-[0.98]',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        variants[variant], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label}
      className={clsx('grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-all hover:bg-slate-800 hover:text-white active:scale-95', className)} {...rest}>
      {children}
    </button>
  );
}


