import type { SeriesPoint } from '../datasets/series';

/** Pure: points → SVG path segments, broken at every gap (null), so a missing value is never bridged. */
export function linePaths(points: SeriesPoint[], x: (i: number) => number, y: (v: number) => number): string[] {
  const out: string[] = [];
  let cur = '';
  points.forEach((p, i) => {
    if (p.v === null) { if (cur) out.push(cur); cur = ''; return; }
    cur += `${cur ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`;
  });
  if (cur) out.push(cur);
  return out;
}
