import type { Severity } from '@/types';

export const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500', warning: 'bg-amber-500', success: 'bg-green-500', info: 'bg-blue-500',
};
