import { useId } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { countryLabel } from '../lib/placesBn';
import type { Country } from '../countries/countries';
import { CountryPicker } from '../countries/CountryPicker';
import { SOURCES, TOPICS, type RegionKind, type SourceKey, type Topic } from '../stories/stories';
import { regionKey, topicKey } from '../stories/labels';
import type { Filters } from './useJukebox';
import { digits } from './format';

interface Props {
  filters: Filters;
  years: string[]; // years present in the loaded series, ascending
  onFilter: (p: Partial<Filters>) => void;
  onReset: () => void;
  countries: { list: Country[]; country: Country | null; point: { lat: number; lon: number } | null; onSelect: (c: Country | null) => void };
}

/** Left column: period (only the years the series has), topic, region and source filters, the country, and Reset. */
export function TimelineFilters({ filters: f, years, onFilter, onReset, countries: c }: Props) {
  const { t, lang } = usePrefs();
  const uid = useId();
  const pressed = 'border-[var(--brass)] text-[var(--ink)]';
  const regions: RegionKind[] = c.country ? ['global', 'country', 'bangladesh'] : ['global', 'bangladesh'];
  return (
    <div className="space-y-4">
      <section className="panel p-3 space-y-2" aria-labelledby={`${uid}-c`}>
        <h2 id={`${uid}-c`} className="font-display text-base font-bold">{t('country')}</h2>
        <CountryPicker list={c.list} selected={c.country} onSelect={c.onSelect} />
        <div role="status" aria-live="polite" className="text-sm">
          {c.country ? (
            <div className="rounded-lg border border-[var(--brass)] p-2 space-y-1">
              <div className="font-semibold">{countryLabel(c.country.id, c.country.name, lang)} <span className="text-[var(--ink-3)] font-normal">· {c.country.id}</span></div>
              <p className="text-xs text-[var(--ink-2)]">{t('jbCountryNote')}</p>
              <button type="button" className="btn btn-ghost min-h-[36px] px-2" onClick={() => c.onSelect(null)}><X className="w-4 h-4" aria-hidden="true" />{t('countryClear')}</button>
            </div>
          ) : <p className="text-xs text-[var(--ink-3)]">{t('jbCountryHint')}</p>}
        </div>
      </section>

      <section className="panel p-3 space-y-3" aria-labelledby={`${uid}-f`}>
        <div className="flex items-center justify-between gap-2">
          <h2 id={`${uid}-f`} className="font-display text-base font-bold">{t('jbFilters')}</h2>
          <button type="button" className="btn btn-ghost min-h-[36px] px-2" onClick={onReset}><RotateCcw className="w-4 h-4" aria-hidden="true" />{t('jbReset')}</button>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="label mb-1">{t('jbPeriod')}</legend>
          {years.length < 2 ? <p className="text-xs text-[var(--ink-3)]">{years.length ? t('jbOnePeriod', { y: digits(years[0], lang) }) : t('jbNoPeriod')}</p> : (
            <div className="grid grid-cols-2 gap-2">
              {(['from', 'to'] as const).map((k) => (
                <label key={k} className="text-xs text-[var(--ink-2)] space-y-1">
                  <span className="block">{t(k === 'from' ? 'jbFrom' : 'jbTo')}</span>
                  <select className="w-full min-h-[40px] rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-[var(--ink)] px-2 text-sm tnum"
                    value={f[k] ?? ''} onChange={(e) => onFilter({ [k]: e.target.value || null })}>
                    <option value="">{t(k === 'from' ? 'jbFirstYear' : 'jbLastYear')}</option>
                    {years.map((y) => <option key={y} value={y}>{digits(y, lang)}</option>)}
                  </select>
                </label>))}
            </div>)}
        </fieldset>

        <fieldset>
          <legend className="label mb-1">{t('jbTopic')}</legend>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...TOPICS] as (Topic | 'all')[]).map((tp) => (
              <button key={tp} type="button" aria-pressed={f.topic === tp} onClick={() => onFilter({ topic: tp })} className={`chip min-h-[32px] cursor-pointer ${f.topic === tp ? pressed : ''}`}>
                {tp === 'all' ? t('jbAll') : t(topicKey(tp))}
              </button>))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label mb-1">{t('jbRegion')}</legend>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...regions] as (RegionKind | 'all')[]).map((r) => (
              <button key={r} type="button" aria-pressed={f.region === r} onClick={() => onFilter({ region: r })} className={`chip min-h-[32px] cursor-pointer ${f.region === r ? pressed : ''}`}>
                {r === 'all' ? t('jbAll') : r === 'country' && c.country ? countryLabel(c.country.id, c.country.name, lang) : t(regionKey(r))}
              </button>))}
          </div>
        </fieldset>

        <label className="block text-xs text-[var(--ink-2)] space-y-1">
          <span className="label block">{t('jbSource')}</span>
          <select className="w-full min-h-[40px] rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-[var(--ink)] px-2 text-sm" value={f.source} onChange={(e) => onFilter({ source: e.target.value as SourceKey | 'all' })}>
            <option value="all">{t('jbAllSources')}</option>
            {SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
      </section>
    </div>
  );
}
