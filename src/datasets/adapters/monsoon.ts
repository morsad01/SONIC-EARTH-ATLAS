import { cleanValue, getJson, periodOf, type DataSeries } from '../series';

interface City { name: string; lat: number; lon: number; p2026: unknown[]; p2025: unknown[]; climP: unknown[] }
interface Raw { generated?: string; source?: string; dates2026?: string[]; cities?: City[] }

/** One daily-rain series per Bangladesh division point (June to October 2026). */
export function parseMonsoon(j: Raw): DataSeries[] {
  const dates = j.dates2026 ?? [];
  return (j.cities ?? []).map((c) => {
    const points = dates.map((t, i) => ({ t, v: cleanValue(c.p2026[i]) }));
    return {
      id: `monsoon-${c.name.toLowerCase().replace(/\W+/g, '-')}`, variable: `Daily rain, ${c.name} division`, unit: 'mm/day',
      source: j.source ?? 'NASA POWER Daily API', sourceUrl: 'https://power.larc.nasa.gov/', attribution: 'NASA POWER Project, NASA LaRC (MERRA-2 based PRECTOTCORR).',
      coverage: 'point-sample' as const, spatialResolution: `One point at ${c.lat.toFixed(2)}°N, ${c.lon.toFixed(2)}°E (~50 km model cell)`, temporalResolution: 'Daily', period: periodOf(points), points,
      snapshotDate: j.generated, isLive: false, isSample: false,
      method: 'Bias-corrected precipitation (PRECTOTCORR) at the division\'s city point. Compared elsewhere against the 2001–2020 monthly normal.',
      limitations: 'Model-based, one point per division, not a rain-gauge network or an average of the division.',
    };
  });
}
export const loadMonsoon = (signal?: AbortSignal) => getJson<Raw>('/data/bangladesh_monsoon.json', signal).then(parseMonsoon);
