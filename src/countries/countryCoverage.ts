import type { DatasetTimeSlice, EarthObservation, PhenomenonType } from '../types/dataset';
import { FIRMS_INFO } from '../datasets/adapters/firms';
import { PRECIP_INFO } from '../datasets/adapters/precip';
import { SST_INFO } from '../datasets/adapters/sst';
import { periodOf, type DataSeries } from '../datasets/series';
import { inBbox, type Country } from './countries';

type GeoContains = (o: unknown, p: [number, number]) => boolean;

export interface CoverageRow {
  dataset: PhenomenonType;
  /** Distinct cells / grid points whose centre lies inside the border, over the whole period. */
  count: number;
  /** Headline number and how it was computed (roadmap D6: counts and max for fire, a labelled mean of N points or cells otherwise). */
  stat: { kind: 'max' | 'mean'; value: number; unit: string; of: number } | null;
  /** Per-date values for the profile table and provenance card. Empty when `count` is 0. */
  series: DataSeries;
}

const INFO = { fire: FIRMS_INFO, precipitation: PRECIP_INFO, sst: SST_INFO } as const;
const KIND: Record<PhenomenonType, DataSeries['coverage']> = { fire: 'cells-in-border', precipitation: 'points-in-border', sst: 'cells-in-border' };
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** True when a cell centre falls inside the border. The bounding box rules most cells out before the exact test. */
export function insideCountry(geoContains: GeoContains, c: Country, o: Pick<EarthObservation, 'latitude' | 'longitude'>): boolean {
  return inBbox(c.bbox, o.latitude, o.longitude) && geoContains(c.feature, [o.longitude, o.latitude]);
}

/**
 * Pure: a country plus the loaded Atlas slices → one row per layer. No area-weighted averages and no borrowed values:
 * a layer with no cell inside the border yields `count: 0` and `stat: null`.
 */
export function countryCoverage(country: Country, slices: DatasetTimeSlice[], geoContains: GeoContains, meta: { snapshotDate?: Partial<Record<PhenomenonType, string>> } = {}): CoverageRow[] {
  return (['fire', 'precipitation', 'sst'] as PhenomenonType[]).map((ph) => {
    const info = INFO[ph];
    const perDate = new Map<string, EarthObservation[]>();
    for (const s of slices) {
      const inside = s.observations.filter((o) => o.phenomenon === ph && insideCountry(geoContains, country, o));
      if (inside.length) perDate.set(s.dateLabel, [...(perDate.get(s.dateLabel) ?? []), ...inside]);
    }
    // SST is one monthly map repeated on every date: count it once.
    const dates = ph === 'sst' ? [...perDate.keys()].slice(0, 1) : [...perDate.keys()];
    const all = dates.flatMap((d) => perDate.get(d)!);
    const cells = new Set(all.map((o) => o.id));
    const vals = all.map((o) => o.value).filter(Number.isFinite);
    const points = dates.map((d) => {
      const v = perDate.get(d)!.map((o) => o.value).filter(Number.isFinite);
      return { t: d, v: ph === 'fire' ? v.length : v.length ? r2(mean(v)) : null };
    });
    const stat: CoverageRow['stat'] = !vals.length ? null
      : ph === 'fire' ? { kind: 'max', value: r2(Math.max(...vals)), unit: info.unit, of: cells.size }
      : { kind: 'mean', value: r2(mean(vals)), unit: info.unit, of: ph === 'sst' ? cells.size : all.length };
    const method = ph === 'fire' ? `${info.method} The per-day value is the number of cells with a detection; the headline is the strongest detection (max FRP).`
      : `${info.method} The per-day value is the mean of the ${ph === 'sst' ? 'cells' : 'points'} inside, labelled "mean of N", never an area-weighted figure.`;
    const series: DataSeries = {
      id: `coverage-${country.id}-${ph}`, variable: ph === 'fire' ? 'Cells with a fire detection, per day' : info.variable, unit: ph === 'fire' ? 'cells' : info.unit,
      source: info.source, sourceUrl: info.sourceUrl, attribution: info.attribution, coverage: KIND[ph], spatialResolution: info.spatialResolution, temporalResolution: info.temporalResolution,
      period: periodOf(points), points, snapshotDate: meta.snapshotDate?.[ph], isLive: false, isSample: false, method, limitations: info.limitations,
    };
    return { dataset: ph, count: cells.size, stat, series };
  });
}
