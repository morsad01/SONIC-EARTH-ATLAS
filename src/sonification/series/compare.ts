import type { SeriesPoint } from '../../datasets/series';
import type { SonificationSpec } from './specs';
import { planSeries, type Plan, type TimeMode } from './mapping';

/**
 * A/B two periods of one series with the same spec (roadmap Phase 5). `split`: A in the left ear, B in the right, together.
 * `sequence`: A, a short rest, then B, both centred. Without a stereo panner `split` falls back to `sequence`.
 */
export type CompareLayout = 'split' | 'sequence';

export function planCompare(a: SeriesPoint[], b: SeriesPoint[], spec: SonificationSpec, o: { mode: TimeMode; speed: number; layout: CompareLayout; stereo?: boolean }): Plan {
  const split = o.layout === 'split' && o.stereo !== false;
  const pa = planSeries(a, spec, { mode: o.mode, speed: o.speed, lane: 'a', pan: split ? -0.85 : 0 });
  const gap = split ? 0 : pa.duration + (2 * spec.stepMs) / 1000 / o.speed;
  const pb = planSeries(b, spec, { mode: o.mode, speed: o.speed, lane: 'b', pan: split ? 0.85 : 0, startAt: Math.round(gap * 1e4) / 1e4 });
  const steps = [...pa.steps, ...pb.steps].sort((x, y) => x.at - y.at || (x.lane < y.lane ? -1 : 1));
  return { steps, duration: Math.max(pa.duration, pb.duration) };
}

/** Points whose year lies in [from, to] (inclusive, either end open). */
export const pointsInYears = (points: SeriesPoint[], from: string | null, to: string | null) =>
  points.filter((p) => (!from || p.t.slice(0, 4) >= from) && (!to || p.t.slice(0, 4) <= to));
