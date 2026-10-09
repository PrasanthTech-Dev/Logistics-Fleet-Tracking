import type { ReactNode } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { ErrorState } from './States';

/** Renders a skeleton while loading and an error state with retry if the initial fetch fails. */
export function DataGate({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  const status = useFleetStore((s) => s.status);
  const error = useFleetStore((s) => s.error);
  const load = useFleetStore((s) => s.load);
  if (status === 'idle' || status === 'loading') return <>{skeleton}</>;
  if (status === 'error') return <ErrorState message={error} onRetry={load} />;
  return <>{children}</>;
}
