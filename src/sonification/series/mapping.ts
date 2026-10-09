import type { SeriesPoint } from '../../datasets/series';
import type { SonificationSpec } from './specs';

/**
 * Pure series → sound mapping (roadmap Phase 5). Deterministic: the same points and spec always give the same plan.
 * value → G-major pentatonic G3–G5 against the spec's fixed range; |change| → 1–6 pulses; anomaly sign → timbre; null → silence.
 */
export const SEMITONES = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // G A B D E, two octaves from G3
const NAMES = ['G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5'];
export const LOW_HZ = 196, HIGH_HZ = 784;
export const GAIN_MAX = 0.18, GAIN_MIN = 0.05, MAX_PULSES = 6;
const MIN_PULSE_S = 0.04;

export type Timbre = 'warm' | 'soft' | 'plain';
export const WAVE: Record<Timbre, OscillatorType> = { warm: 'triangle', soft: 'sine', plain: 'sine' };

export interface Mapped {
  kind: 'note';
  norm: number; // 0…1 position in the fixed range
  clipped: 'low' | 'high' | null; // the value lies outside the range and plays the end note
  degree: number; // 0…10 on the scale
  note: string;
  freq: number;
  pulses: number;
  delta: number | null; // change from the previous real value
  timbre: Timbre;
  gain: number;
}
export type MappedPoint = Mapped | { kind: 'silence' };

const r = (x: number, d = 4) => Math.round(x * 10 ** d) / 10 ** d;
const shape = (v: number, c: SonificationSpec['curve']) => (c === 'sqrt' ? Math.sign(v) * Math.sqrt(Math.abs(v)) : v);
export const freqOf = (degree: number) => r(LOW_HZ * 2 ** (SEMITONES[degree] / 12), 2);
export const noteName = (degree: number) => NAMES[degree];

/** One point. `prev` is the previous real value (gaps skipped), `prevGain` the last sounding gain for smoothing. */
export function mapPoint(value: number | null, prev: number | null, spec: SonificationSpec, prevGain: number | null = null): MappedPoint {
  if (value === null || !Number.isFinite(value)) return { kind: 'silence' };
  const [lo, hi] = spec.ref, a = shape(lo, spec.curve), b = shape(hi, spec.curve);
  const raw = b === a ? 0.5 : (shape(value, spec.curve) - a) / (b - a);
  const norm = r(Math.min(1, Math.max(0, raw)));
  const degree = Math.round(norm * (SEMITONES.length - 1));
  const delta = prev === null ? null : r(value - prev, 6);
  const pulses = delta === null ? 1 : 1 + Math.round(Math.min(1, Math.abs(delta) / spec.rateRef) * (MAX_PULSES - 1));
  const timbre: Timbre = spec.baseline === null ? 'plain' : value >= spec.baseline ? 'warm' : 'soft';
  let gain = GAIN_MIN + (GAIN_MAX - GAIN_MIN) * (0.4 + 0.6 * norm);
  if (prevGain !== null) gain = Math.min(prevGain * 2, Math.max(prevGain / 2, gain)); // no jump above 6 dB
  return { kind: 'note', norm, clipped: raw < 0 ? 'low' : raw > 1 ? 'high' : null, degree, note: NAMES[degree], freq: freqOf(degree), pulses, delta, timbre, gain: r(Math.min(GAIN_MAX, gain)) };
}

/** Every point in order, with the change taken from the last real value and the gain smoothed along the run. */
export function mapSeries(points: SeriesPoint[], spec: SonificationSpec): MappedPoint[] {
  let prev: number | null = null, g: number | null = null;
  return points.map((p) => {
    const m = mapPoint(p.v, prev, spec, g);
    if (m.kind === 'note') { prev = p.v; g = m.gain; }
    return m;
  });
}

export type TimeMode = 'even' | 'proportional';
const ms = (t: string) => { const [y, m = '1', d = '1'] = t.split('-'); return Date.UTC(+y, +m - 1, +d); };

/** Start offsets in seconds. Even: one step each. Proportional: spaced by real time over the same total length. */
export function offsets(points: SeriesPoint[], spec: SonificationSpec, mode: TimeMode, speed = 1): number[] {
  const step = spec.stepMs / 1000 / speed, n = points.length;
  if (mode === 'even' || n < 2) return points.map((_, i) => r(i * step));
  const t0 = ms(points[0].t), span = ms(points[n - 1].t) - t0;
  return points.map((p, i) => r(span > 0 ? ((ms(p.t) - t0) / span) * (n - 1) * step : i * step));
}

export interface PlannedNote { at: number; dur: number; freq: number; wave: OscillatorType; gain: number; pan: number }
export interface PlanStep { index: number; lane: 'a' | 'b'; at: number; dur: number; mapped: MappedPoint; notes: PlannedNote[] }
export interface Plan { steps: PlanStep[]; duration: number }

/** Pulses split the step evenly; each one is short enough to leave a gap before the next. */
function notesFor(m: MappedPoint, at: number, dur: number, pan: number): PlannedNote[] {
  if (m.kind === 'silence') return [];
  const k = Math.max(1, Math.min(m.pulses, Math.floor(dur / MIN_PULSE_S))), slot = dur / k;
  return Array.from({ length: k }, (_, i) => ({ at: r(at + i * slot), dur: r(Math.min(0.45, slot * 0.8)), freq: m.freq, wave: WAVE[m.timbre], gain: m.gain, pan }));
}

export interface PlanOpts { mode: TimeMode; speed: number; lane?: 'a' | 'b'; pan?: number; startAt?: number }

/** The whole schedule for one series: steps in time order with their notes. */
export function planSeries(points: SeriesPoint[], spec: SonificationSpec, o: PlanOpts): Plan {
  const mapped = mapSeries(points, spec), off = offsets(points, spec, o.mode, o.speed), step = spec.stepMs / 1000 / o.speed, s0 = o.startAt ?? 0;
  const steps = points.map((_, i): PlanStep => {
    const dur = r(i < points.length - 1 ? Math.min(step, off[i + 1] - off[i]) || step : step);
    return { index: i, lane: o.lane ?? 'a', at: r(s0 + off[i]), dur, mapped: mapped[i], notes: notesFor(mapped[i], s0 + off[i], dur, o.pan ?? 0) };
  });
  return { steps, duration: steps.length ? r(steps[steps.length - 1].at + steps[steps.length - 1].dur) : 0 };
}
