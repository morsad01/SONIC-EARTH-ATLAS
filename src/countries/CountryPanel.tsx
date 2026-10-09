import { MapPinned, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { countryLabel } from '../lib/placesBn';
import type { Country } from './countries';
import { CountryPicker } from './CountryPicker';
import { CountryProfile } from './CountryProfile';

/** Picker plus a text readout of the selection (never colour alone). */
export function CountryPanel({ list, country, point, onSelect }: { list: Country[]; country: Country | null; point: { lat: number; lon: number } | null; onSelect: (c: Country | null) => void }) {
  const { t, lang } = usePrefs();
  return (
    <div className="space-y-3">
    <section className="panel p-3 space-y-3" aria-label={t('country')}>
      <h2 className="font-display text-base font-bold flex items-center gap-2"><MapPinned className="w-4 h-4 text-[var(--brass)]" aria-hidden="true" />{t('country')}</h2>
      <CountryPicker list={list} selected={country} onSelect={onSelect} />
      <div role="status" aria-live="polite" className="text-sm">
        {country ? (
          <div className="rounded-lg border border-[var(--brass)] p-2.5 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brass)]">{t('countrySelected')}</div>
            <div className="font-semibold text-[var(--ink)]">{countryLabel(country.id, country.name, lang)} <span className="text-[var(--ink-3)] font-normal">· {country.id}</span></div>
            {point && <div className="text-xs text-[var(--ink-2)]">{t('countryPoint')}: {Math.abs(point.lat).toFixed(1)}°{point.lat >= 0 ? 'N' : 'S'}, {Math.abs(point.lon).toFixed(1)}°{point.lon >= 0 ? 'E' : 'W'}<br /><span className="text-[var(--ink-3)]">{t('countryPointNote')}</span></div>}
            <button type="button" className="btn btn-ghost min-h-[36px] px-2" onClick={() => onSelect(null)}><X className="w-4 h-4" />{t('countryClear')}</button>
          </div>
        ) : <p className="text-[var(--ink-3)]">{t('countryNoneSelected')}</p>}
      </div>
    </section>
    {country && <CountryProfile country={country} point={point} />}
    </div>
  );
}
