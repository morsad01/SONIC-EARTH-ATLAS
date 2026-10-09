import { useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { countryLabel } from '../lib/placesBn';
import type { Country } from './countries';
import { searchCountries } from './search';

/** ARIA 1.2 combobox with a listbox popup: type to filter, ↑/↓ move, Enter selects, Esc closes (then clears). */
export function CountryPicker({ list, selected, onSelect }: { list: Country[]; selected: Country | null; onSelect: (c: Country | null) => void }) {
  const { t, lang } = usePrefs();
  const uid = useId(), listId = `${uid}-list`, inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), [active, setActive] = useState(0);
  const results = useMemo(() => searchCountries(list, q), [list, q]);
  const label = (c: Country) => countryLabel(c.id, c.name, lang);
  const idx = Math.min(active, Math.max(0, results.length - 1));
  const choose = (c: Country) => { onSelect(c); setQ(''); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive((idx + 1) % Math.max(1, results.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!open) setOpen(true); else setActive((idx - 1 + results.length) % Math.max(1, results.length)); }
    else if (e.key === 'Home' && open) { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' && open) { e.preventDefault(); setActive(results.length - 1); }
    else if (e.key === 'Enter') { if (open && results[idx]) { e.preventDefault(); choose(results[idx]); } }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } else if (q) { setQ(''); } }
  };
  const showList = open && list.length > 0;
  const status = !showList ? '' : results.length ? t('countryResults', { n: results.length }) : t('countryNone', { q });
  return (
    <div className="relative">
      <label htmlFor={`${uid}-in`} className="block text-xs font-semibold text-[var(--ink-2)] mb-1">{t('countrySearch')}</label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] pointer-events-none" aria-hidden="true" />
        <input id={`${uid}-in`} ref={inputRef} type="text" role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list" autoComplete="off" spellCheck={false}
          aria-activedescendant={showList && results[idx] ? `${uid}-o-${results[idx].id}` : undefined}
          className="w-full min-h-[44px] rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-[var(--ink)] pl-8 pr-9 text-sm"
          placeholder={selected ? countryLabel(selected.id, selected.name, lang) : t('countryPlaceholder')}
          value={q} onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKey} />
        {q && <button type="button" className="absolute right-1 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon min-h-[36px] min-w-[36px]" aria-label={t('close')}
          onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(''); inputRef.current?.focus(); }}><X className="w-4 h-4" /></button>}
      </div>
      <ul id={listId} role="listbox" aria-label={t('country')} hidden={!showList}
        className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto scroll-thin glass-pop rounded-lg">
        {showList && results.map((c, i) => (
          <li key={c.id} id={`${uid}-o-${c.id}`} role="option" aria-selected={selected?.id === c.id}
            ref={(el) => { if (el && i === idx) el.scrollIntoView?.({ block: 'nearest' }); }}
            className={`px-3 min-h-[40px] flex items-center justify-between gap-2 cursor-pointer text-sm ${i === idx ? 'bg-[var(--panel-2)] text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}
            onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => choose(c)}>
            <span>{label(c)}</span>
            <span className="text-xs text-[var(--ink-3)]">{selected?.id === c.id ? t('selectedBadge') : c.id}</span>
          </li>
        ))}
        {showList && !results.length && <li role="presentation" className="px-3 py-2 text-sm text-[var(--ink-3)]">{t('countryNone', { q })}</li>}
      </ul>
      <p role="status" aria-live="polite" className="sr-only">{status}</p>
    </div>
  );
}
