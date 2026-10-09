import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { SelectInput, TextInput } from './FormFields';

export type FilterField =
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'date' };

interface Props {
  searchKey?: string;
  placeholder: string;
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  activeCount: number;
}

const COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };

/** Search + filter controls. Fields collapse behind a toggle below `md`. */
export function FilterBar({ searchKey = 'q', placeholder, fields, values, onChange, onReset, activeCount }: Props) {
  const [open, setOpen] = useState(false);
  const hasFilters = activeCount > 0;
  return (
    <div className="mb-5 space-y-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xs">
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <TextInput className="pl-10" type="search" aria-label="Search" placeholder={placeholder} value={values[searchKey] ?? ''} onChange={(e) => onChange(searchKey, e.target.value)} />
        </div>
        <Button variant="secondary" className="md:hidden" aria-expanded={open} onClick={() => setOpen((o) => !o)} icon={<SlidersHorizontal className="h-4 w-4" />}>Filters</Button>
        {hasFilters && <Button variant="ghost" onClick={onReset} icon={<X className="h-4 w-4" />}>Clear<span className="hidden sm:inline"> ({activeCount})</span></Button>}
      </div>
      <div className={(open ? 'grid' : 'hidden md:grid') + ' grid-cols-2 gap-3 md:grid-cols-3 ' + (COLS[Math.min(fields.length, 6)] ?? 'lg:grid-cols-6')}>
        {fields.map((f) => (
          <label key={f.key} className="block min-w-0">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">{f.label}</span>
            {f.type === 'select' ? (
              <SelectInput value={values[f.key] ?? ''} onChange={(e) => onChange(f.key, e.target.value)}>
                <option value="" className="bg-slate-900 text-slate-100">All</option>
                {f.options.map((o) => <option key={o.value} value={o.value} className="bg-slate-900 text-slate-100">{o.label}</option>)}
              </SelectInput>
            ) : (
              <TextInput type="date" value={values[f.key] ?? ''} onChange={(e) => onChange(f.key, e.target.value)} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}


