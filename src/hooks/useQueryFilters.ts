import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Filters live in the URL so views are shareable, bookmarkable and survive refresh. */
export function useQueryFilters<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ''])) as Record<K, string>;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setFilter = useCallback((key: string, value: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setParams]);

  const setPage = useCallback((p: number) => {
    setParams((prev) => { const next = new URLSearchParams(prev); if (p > 1) next.set('page', String(p)); else next.delete('page'); return next; }, { replace: true });
  }, [setParams]);

  const reset = useCallback(() => {
    setParams((prev) => { const next = new URLSearchParams(prev); keys.forEach((k) => next.delete(k)); next.delete('page'); return next; }, { replace: true });
  }, [setParams, keys]);

  const activeCount = keys.filter((k) => values[k]).length;
  return { values, setFilter, setPage, reset, page, activeCount };
}

export const PAGE_SIZE = 9;
export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  return { rows: items.slice((current - 1) * size, current * size), pageCount, current };
}
