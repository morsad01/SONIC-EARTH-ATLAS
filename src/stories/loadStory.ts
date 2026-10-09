import { loadGistemp } from '../datasets/adapters/gistemp';
import { loadVitalSigns } from '../datasets/adapters/vitalSigns';
import { loadMonsoon } from '../datasets/adapters/monsoon';
import { loadFirms, FIRMS_INFO } from '../datasets/adapters/firms';
import { loadSst, SST_INFO, type SstJson } from '../datasets/adapters/sst';
import { fetchPowerMonthly } from '../datasets/adapters/power';
import { validObs, type SliceJson } from '../datasets/adapters/common';
import { cleanValue, periodOf, type DataSeries } from '../datasets/series';
import type { CoverageRow } from '../countries/countryCoverage';
import type { Story } from './stories';

/** Pure: FIRMS snapshot → the strongest cell of each day (the snapshot keeps the strongest cells, so the daily max is complete). */
export function fireWeekSeries(j: SliceJson): DataSeries {
  const points = [...j.slices].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel)).map((s) => {
    const v = s.observations.filter((o) => o.phenomenon === 'fire' && validObs(o)).map((o) => o.value);
    return { t: s.dateLabel, v: v.length ? Math.max(...v) : null };
  });
  return {
    id: 'fire-week', variable: 'Strongest fire of the day (max FRP in any 2° cell)', unit: FIRMS_INFO.unit, source: FIRMS_INFO.source, sourceUrl: FIRMS_INFO.sourceUrl, attribution: FIRMS_INFO.attribution,
    coverage: 'global-context', spatialResolution: FIRMS_INFO.spatialResolution, temporalResolution: 'Daily', period: periodOf(points), points,
    snapshotDate: j.generated?.slice(0, 10), isLive: false, isSample: false,
    method: 'For each day, the highest fire radiative power among all 2° cells in the snapshot.', limitations: 'One number per day for the whole planet. It says where the strongest fire was burning, not how much burned.',
  };
}

/** Pure: SST snapshot → one monthly value, the file's own area-weighted global mean. */
export function sstMonthSeries(j: SstJson): DataSeries {
  const t = (j.erddapTime ?? j.slices[0]?.dateLabel ?? '').slice(0, 7);
  const points = t ? [{ t, v: cleanValue(j.globalStats?.areaWeightedMeanAnomalyC, -50) }] : [];
  return {
    id: 'sst-month', variable: 'Global mean sea surface temperature anomaly', unit: SST_INFO.unit, source: SST_INFO.source, sourceUrl: SST_INFO.sourceUrl, attribution: SST_INFO.attribution,
    coverage: 'global-context', spatialResolution: `1° sample of ${j.globalStats?.validCells ?? 'the'} open-ocean cells`, temporalResolution: 'Monthly', period: periodOf(points), points,
    snapshotDate: j.generated?.slice(0, 10), isLive: false, isSample: false,
    method: 'Area-weighted (cos latitude) mean of the monthly MUR anomaly over the sampled open-ocean cells, as stored in the snapshot.', limitations: 'A single month, so there is no trend to hear. The anomaly baseline is the MUR climatology, not a WMO normal.',
  };
}

// Bundled files are small and shared by many stories (8 monsoon divisions read one file): fetch each once, retry after a failure.
const once = new Map<string, Promise<unknown>>();
function memo<T>(k: string, f: () => Promise<T>): Promise<T> {
  let p = once.get(k) as Promise<T> | undefined;
  if (!p) { p = f(); once.set(k, p); p.catch(() => once.delete(k)); }
  return p;
}
export const clearStoryCache = () => once.clear();

export interface StoryDeps { signal?: AbortSignal; point?: { lat: number; lon: number } | null; coverage?: CoverageRow[] | null }

/** A story's series, from the same files and APIs as the rest of the app. `null` means a picture story with no numbers. Throws if the data cannot be loaded. */
export async function loadStorySeries(s: Story, d: StoryDeps = {}): Promise<DataSeries | null> {
  switch (s.kind) {
    case 'eic': return null;
    case 'gistemp': return memo('gistemp', () => loadGistemp());
    case 'co2': case 'ice': {
      const id = s.kind === 'co2' ? 'vital-co2' : 'vital-ice', hit = (await memo('vital', () => loadVitalSigns())).find((x) => x.id === id);
      if (!hit) throw new Error(`${id} is missing from vital_signs.json`);
      return hit;
    }
    case 'sst': return sstMonthSeries(await memo('sst', () => loadSst()));
    case 'fire-week': return fireWeekSeries(await memo('firms', () => loadFirms()));
    case 'monsoon': {
      const id = `monsoon-${(s.division ?? '').toLowerCase()}`, hit = (await memo('monsoon', () => loadMonsoon())).find((x) => x.id === id);
      if (!hit) throw new Error(`${s.division} is missing from bangladesh_monsoon.json`);
      return hit;
    }
    case 'country-temp': case 'country-rain': {
      if (!d.point) throw new Error('The representative point is not ready yet');
      const p = await fetchPowerMonthly(d.point.lat, d.point.lon, { signal: d.signal });
      return s.kind === 'country-temp' ? p.temp : p.rain;
    }
    case 'country-fire': {
      const row = d.coverage?.find((r) => r.dataset === 'fire');
      if (!row || row.count === 0) throw new Error('No fire cell lies inside this border');
      return row.series;
    }
  }
}
