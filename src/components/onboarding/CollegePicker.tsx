import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchColleges, type College } from '../../services/collegeService';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '@/lib/utils';

export type CollegeValue = College | { other: string } | null;

const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';

export function CollegePicker({ value, onChange }: { value: CollegeValue; onChange: (v: CollegeValue) => void }) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [otherOpen, setOtherOpen] = useState(!!value && 'other' in value);
  const debounced = useDebounce(query, 250);
  const { data, isLoading, isError, isFetching } = useQuery({ queryKey: ['colleges', debounced.trim()], queryFn: () => searchColleges(debounced), placeholderData: keepPreviousData });
  const settled = query.trim() === debounced.trim() && !isFetching;
  const items = data ?? [];
  const optionCount = items.length + 1; // last option is "Other college"
  const selectedId = value && 'id' in value ? value.id : null;

  useEffect(() => setActive(0), [debounced]);

  const pick = (i: number) => {
    if (i < items.length) { setOtherOpen(false); onChange(items[i]); }
    else { setOtherOpen(true); onChange({ other: value && 'other' in value ? value.other : '' }); }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % optionCount); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + optionCount) % optionCount); }
    else if (e.key === 'Enter') { e.preventDefault(); if (settled) pick(active); }
  };

  const optId = (i: number) => `${uid}-opt-${i}`;

  return (
    <div>
      <label htmlFor={`${uid}-search`} className="block text-[13px] font-semibold text-ink">Search your college</label>
      <input
        id={`${uid}-search`}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={`${uid}-list`}
        aria-activedescendant={optId(active)}
        autoComplete="off"
        placeholder="e.g. SRCC, Hansraj, Miranda"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        className={inputCls}
      />
      {isError && <p role="alert" className="mt-2 text-[13px] text-danger">Could not load colleges. Try again.</p>}
      {!isLoading && !isError && items.length === 0 && (
        <p className="mt-2 text-[13px] text-ink-muted">No college found — choose Other college</p>
      )}
      <ul id={`${uid}-list`} role="listbox" aria-label="Colleges" className="mt-2 max-h-64 overflow-y-auto rounded-sm border border-line">
        {items.map((c, i) => (
          <li
            key={c.id}
            id={optId(i)}
            role="option"
            aria-selected={selectedId === c.id}
            onClick={() => pick(i)}
            onMouseEnter={() => setActive(i)}
            className={cn('flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2', active === i && 'bg-canvas', selectedId === c.id && 'border-l-4 border-brand')}
          >
            <span className="text-[15px] font-semibold text-ink">{c.name}</span>
            <span className="text-[13px] text-ink-muted">{c.short_name} · {c.campus}</span>
          </li>
        ))}
        <li
          id={optId(items.length)}
          role="option"
          aria-selected={otherOpen}
          onClick={() => pick(items.length)}
          onMouseEnter={() => setActive(items.length)}
          className={cn('flex min-h-11 cursor-pointer items-center px-3 py-2 text-[15px] font-semibold text-ink', active === items.length && 'bg-canvas', otherOpen && 'border-l-4 border-brand')}
        >
          Other college
        </li>
      </ul>
      {otherOpen && (
        <div className="mt-3">
          <label htmlFor={`${uid}-other`} className="block text-[13px] font-semibold text-ink">Your college name</label>
          <input
            id={`${uid}-other`}
            type="text"
            maxLength={150}
            value={value && 'other' in value ? value.other : ''}
            onChange={e => onChange({ other: e.target.value })}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}
