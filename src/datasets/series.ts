/** Common shape for every dataset the app can show, hear or cite (roadmap Phase 3). */
export type Coverage = 'country' | 'points-in-border' | 'cells-in-border' | 'point-sample' | 'global-context';

export interface SeriesPoint { t: string; v: number | null }

export interface DataSeries {
  id: string;
  variable: string;
  unit: string;
  source: string;
  sourceUrl: string;
  attribution: string;
  coverage: Coverage;
  spatialResolution: string;
  temporalResolution: string;
  period: string; // first to last timestamp actually present, e.g. "1880 to 2025"
  points: SeriesPoint[];
  snapshotDate?: string; // when the bundled file was generated; absent for live data
  isLive: boolean;
  isSample: boolean;
  method: string;
  limitations: string;
}

/** Drops anything that is not a finite number to `null`. Never invents a value. */
export function cleanValue(v: unknown, missingBelow = -900): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > missingBelow ? v : null;
}

/** "first to last" timestamp over points that carry a value (or "no data"). */
export function periodOf(points: SeriesPoint[]): string {
  const have = points.filter((p) => p.v !== null);
  return have.length ? (have[0].t === have[have.length - 1].t ? have[0].t : `${have[0].t} to ${have[have.length - 1].t}`) : 'no data';
}

export const validCount = (s: Pick<DataSeries, 'points'>) => s.points.filter((p) => p.v !== null).length;

export async function getJson<T = unknown>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return r.json() as Promise<T>;
}
