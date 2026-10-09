import type { SeriesPoint } from '../datasets/series';

/** Timeline rows (roadmap Phase 4): every observation, or above BUCKET_LIMIT points, year/decade buckets that expand. Pure. */
export const BUCKET_LIMIT = 150;
export interface Row { key: string; kind: 'bucket' | 'item'; t?: string; v?: number | null; bucket: string; count?: number; gaps?: number; open?: boolean }

/** Annual stamps group by decade ("1990s"), monthly and daily ones by year. */
export const bucketOf = (t: string) => (t.length === 4 ? `${t.slice(0, 3)}0s` : t.slice(0, 4));

export function buildRows(points: SeriesPoint[], isOpen: (bucket: string) => boolean): Row[] {
  if (points.length <= BUCKET_LIMIT) return points.map((p) => ({ key: p.t, kind: 'item', t: p.t, v: p.v, bucket: '' }));
  const groups = new Map<string, SeriesPoint[]>();
  for (const p of points) { const b = bucketOf(p.t); groups.set(b, [...(groups.get(b) ?? []), p]); }
  const rows: Row[] = [];
  for (const [b, ps] of groups) {
    const open = isOpen(b);
    rows.push({ key: `b:${b}`, kind: 'bucket', bucket: b, count: ps.length, gaps: ps.filter((p) => p.v === null).length, open });
    if (open) for (const p of ps) rows.push({ key: p.t, kind: 'item', t: p.t, v: p.v, bucket: b });
  }
  return rows;
}
