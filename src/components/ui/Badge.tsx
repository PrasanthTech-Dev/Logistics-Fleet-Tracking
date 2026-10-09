import clsx from 'clsx';
import type { ReactNode } from 'react';
import { TONE_BADGE, TONE_DOT } from '@/lib/constants';
import type { Meta, Tone } from '@/lib/constants';

export function Badge({ tone, children, dot = true }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', TONE_BADGE[tone])}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}
export const StatusBadge = ({ meta }: { meta: Meta }) => <Badge tone={meta.tone}>{meta.label}</Badge>;
