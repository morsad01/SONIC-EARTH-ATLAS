import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Headphones } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { countryLabel } from '../lib/placesBn';
import type { Country } from './countries';
import { countryCoverage, type CoverageRow } from './countryCoverage';
import { useGeoContains } from './useGeoContains';
import { ProfileDataContext } from './profileContext';
import { availableFor } from '../datasets/registry';
import { fetchPowerMonthly, type PowerMonthly } from '../datasets/adapters/power';
import { ProvenanceCard } from '../components/data-status/ProvenanceCard';
import { DataState } from '../components/data-status/DataState';

const LAYER: Record<CoverageRow['dataset'], { en: string; bn: string }> = {
  fire: { en: 'Fire detections', bn: 'আগুনের শনাক্তকরণ' }, precipitation: { en: 'Daily rain', bn: 'দৈনিক বৃষ্টি' }, sst: { en: 'Sea surface temperature anomaly', bn: 'সমুদ্রপৃষ্ঠের তাপমাত্রার ব্যতিক্রম' },
};
const BN = '০১২৩৪৫৬৭৮৯';

/** Annual mean temperature as a tiny line chart. The numbers are also in a table. */
function Spark({ years, temp }: { years: number[]; temp: number[] }) {
  const { t, lang } = usePrefs();
  const W = 300, H = 56, lo = Math.min(...temp), hi = Math.max(...temp), n = temp.length;
  const pts = temp.map((v, k) => `${(k / Math.max(1, n - 1)) * W},${4 + (1 - (v - lo) / (hi - lo || 1)) * (H - 8)}`).join(' ');
  const f = (v: number | string) => (lang === 'bn' ? String(v).replace(/\d/g, (d) => BN[+d]) : String(v));
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={t('profileSparkAlt', { a: f(lo.toFixed(1)), b: f(hi.toFixed(1)), from: f(years[0]), to: f(years[n - 1]) })}>
        <polyline fill="none" stroke="var(--warm)" strokeWidth={2} points={pts} />
      </svg>
      <div className="flex justify-between text-[11px] text-[var(--ink-3)] tnum"><span>{f(years[0])}</span><span>{f(lo.toFixed(1))}–{f(hi.toFixed(1))} °C</span><span>{f(years[n - 1])}</span></div>
      <details className="text-xs text-[var(--ink-2)]">
        <summary className="cursor-pointer min-h-[32px] flex items-center">{t('profileTable')}</summary>
        <table className="tnum w-full mt-1"><tbody>{years.map((y, k) => <tr key={y}><th scope="row" className="text-left font-normal text-[var(--ink-3)]">{f(y)}</th><td>{f(temp[k].toFixed(2))} °C</td></tr>)}</tbody></table>
      </details>
    </>
  );
}

/** What this app really has for the selected country, with the source, unit, period and method of each number. */
export function CountryProfile({ country, point }: { country: Country; point: { lat: number; lon: number } | null }) {
  const { t, lang } = usePrefs();
  const data = useContext(ProfileDataContext);
  const geoContains = useGeoContains();
  const name = countryLabel(country.id, country.name, lang);

  const rows = useMemo(() => (data && !data.isFallback && geoContains ? countryCoverage(country, data.slices, geoContains as never, { snapshotDate: data.snapshotDates }) : null), [data, geoContains, country]);

  const [power, setPower] = useState<{ key: string; v: PowerMonthly } | { key: string; err: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = point ? `${country.id}:${point.lat.toFixed(2)},${point.lon.toFixed(2)}:${attempt}` : '';
  useEffect(() => {
    if (!point) return;
    const ac = new AbortController();
    fetchPowerMonthly(point.lat, point.lon, { signal: ac.signal }).then((v) => setPower({ key, v }), (e) => { if (!ac.signal.aborted) setPower({ key, err: e.message }); });
    return () => ac.abort();
  }, [point?.lat, point?.lon, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const cur = power && power.key === key ? power : null;

  const dates = data?.slices.map((s) => s.dateLabel).sort() ?? [];
  const stamps = Object.values(data?.snapshotDates ?? {}).sort();
  const have = rows?.filter((r) => r.count > 0) ?? [], none = rows?.filter((r) => r.count === 0) ?? [];
  const avail = availableFor(country.id, rows ?? []);
  const context = avail.filter((a) => a.availability === 'global-context');
  const bgd = avail.find((a) => a.entry.id === 'monsoon');
  const anything = have.length > 0 || (cur && 'v' in cur) || !!bgd;
  const settled = rows !== null && cur !== null;
  const lab = (l: { en: string; bn: string }) => (lang === 'bn' ? l.bn : l.en);

  return (
    <section className="panel p-3 space-y-3" aria-label={t('profileTitle')} aria-busy={!settled}>
      <h2 className="font-display text-base font-bold">{t('profileTitle')}: {name} <span className="text-[var(--ink-3)] font-normal">· {country.id}</span></h2>

      <div className="space-y-2">
        <h3 className="label">{t('profileHave')}</h3>
        {data?.isFallback ? <DataState status="stale" message={t('profileSample')} />
          : !data || data.loading || !rows ? <DataState status="loading" />
          : have.map((r) => (
            <div key={r.dataset} className="space-y-1.5">
              <p className="text-sm"><strong>{lab(LAYER[r.dataset])}</strong>: <span className="tnum">{t('profileCells', { n: r.count })}</span>
                {r.stat && <>, <span className="tnum">{r.stat.kind === 'max' ? t('profileMax', { v: r.stat.value, u: r.stat.unit }) : t('profileMean', { n: r.stat.of, v: r.stat.value, u: r.stat.unit })}</span></>}
                {r.series.points.length > 1 && <>, <span className="tnum">{t('profileDays', { n: r.series.points.length })}</span></>}</p>
              <ProvenanceCard series={r.series} />
            </div>))}
        {rows && none.length > 0 && have.length > 0 && <p className="text-xs text-[var(--ink-3)]">{t('profileChecked')}: {none.map((r) => lab(LAYER[r.dataset])).join(', ')}</p>}
        {rows && have.length === 0 && none.length > 0 && <p className="text-sm text-[var(--ink-2)]">{none.map((r) => t('profileNoCells', { what: lab(LAYER[r.dataset]) })).join(' · ')}</p>}
        {rows && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-xs text-[var(--ink-2)]">
            {dates.length > 0 && <><dt className="text-[var(--ink-3)]">{t('profileRange')}</dt><dd className="tnum">{dates[0]} to {dates[dates.length - 1]}</dd></>}
            {stamps.length > 0 && <><dt className="text-[var(--ink-3)]">{t('profileStamp')}</dt><dd className="tnum">{stamps[stamps.length - 1]}</dd></>}
          </dl>)}
      </div>

      {point && (
        <div className="space-y-1.5">
          <h3 className="label">{t('profileSparkTitle')}</h3>
          {!cur ? <DataState status="loading" message={t('profileLoadingPower')} />
            : 'err' in cur ? <DataState status={typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error'} message={`${t('dsError')} ${cur.err}`} onRetry={retry} />
            : <>
              <p className="text-xs text-[var(--ink-2)]">{t('profilePointOnly', { pt: `${Math.abs(point.lat).toFixed(2)}°${point.lat >= 0 ? 'N' : 'S'}, ${Math.abs(point.lon).toFixed(2)}°${point.lon >= 0 ? 'E' : 'W'}` })}</p>
              <Spark years={cur.v.annual.years} temp={cur.v.annual.temp} />
              <ProvenanceCard series={cur.v.temp} />
              <ProvenanceCard series={cur.v.rain} />
            </>}
        </div>)}

      {bgd && <p className="text-sm">{lang === 'bn' ? bgd.entry.titleBn : bgd.entry.title}</p>}

      {settled && !anything && <DataState status="empty" message={t('profileEmpty', { name })} />}

      {context.length > 0 && (
        <div>
          <h3 className="label">{t('profileContext')}</h3>
          <ul className="text-xs text-[var(--ink-2)] list-disc pl-4">{context.map((c) => <li key={c.entry.id}>{lang === 'bn' ? c.entry.titleBn : c.entry.title} <span className="chip">{t('provContext')}</span></li>)}</ul>
        </div>)}

      {data?.onExplore && (
        <div>
          <button type="button" className="btn btn-brass w-full" onClick={() => data.onExplore!(country.id)}><Headphones className="w-4 h-4" aria-hidden="true" />{t('profileExplore')}</button>
          <p className="text-[11px] text-[var(--ink-3)] mt-1">{t('profileExploreNote')}</p>
        </div>)}
    </section>
  );
}
