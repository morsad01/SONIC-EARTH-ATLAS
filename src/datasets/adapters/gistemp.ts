import { cleanValue, getJson, periodOf, type DataSeries } from '../series';

interface Raw { generated?: string; source?: string; baseline?: string; unit?: string; series?: { year: number; anomaly: unknown }[] }

export function parseGistemp(j: Raw): DataSeries {
  const points = (j.series ?? []).filter((p) => Number.isInteger(p.year)).map((p) => ({ t: String(p.year), v: cleanValue(p.anomaly, -50) }));
  return {
    id: 'gistemp', variable: 'Global surface temperature anomaly', unit: j.unit ?? '°C',
    source: j.source ?? 'NASA GISS GISTEMP v4', sourceUrl: 'https://data.giss.nasa.gov/gistemp/', attribution: 'NASA Goddard Institute for Space Studies, GISTEMP v4.',
    coverage: 'global-context', spatialResolution: 'Global land-ocean mean', temporalResolution: 'Annual', period: periodOf(points), points,
    snapshotDate: j.generated, isLive: false, isSample: false,
    method: `Annual (Jan–Dec) global land-ocean mean, as an anomaly against ${j.baseline ?? '1951–1980'}.`,
    limitations: 'One global number per year. It says nothing about a single country.',
  };
}
export const loadGistemp = (signal?: AbortSignal) => getJson<Raw>('/data/gistemp_global.json', signal).then(parseGistemp);
