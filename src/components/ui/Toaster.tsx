import clsx from 'clsx';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

const styles = { success: 'border-emerald-800/80 bg-slate-900/95 text-emerald-300', error: 'border-red-800/80 bg-slate-900/95 text-red-300', info: 'border-cyan-800/80 bg-slate-900/95 text-slate-100' } as const;
const icons = { success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, error: <XCircle className="h-5 w-5 text-red-400" />, info: <Info className="h-5 w-5 text-cyan-400" /> };

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} role="status" className={clsx('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md', styles[t.kind])}>
          {icons[t.kind]}
          <p className="flex-1 text-sm font-medium text-slate-100">{t.message}</p>
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
