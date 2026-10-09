import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, pageCount, total, onChange }: { page: number; pageCount: number; total: number; onChange: (p: number) => void }) {
  if (pageCount <= 1) return <p className="pt-2 text-sm text-ink-500">{total} result{total === 1 ? '' : 's'}</p>;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
      <p className="text-sm text-ink-500">{total} results · page {page} of {pageCount}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} icon={<ChevronLeft className="h-4 w-4" />}>Prev</Button>
        <Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Next<ChevronRight className="h-4 w-4" /></Button>
      </div>
    </nav>
  );
}
