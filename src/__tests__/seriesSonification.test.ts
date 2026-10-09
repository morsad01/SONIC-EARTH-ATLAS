import { describe, it, expect, vi, afterEach } from 'vitest';
import { dataFile } from './fixtures';
import { parseGistemp } from '../datasets/adapters/gistemp';
import { SPECS, specFor } from '../sonification/series/specs';
import { mapPoint, mapSeries, offsets, planSeries, GAIN_MAX, LOW_HZ, HIGH_HZ } from '../sonification/series/mapping';
import { planCompare, pointsInYears } from '../sonification/series/compare';
import { TRANSITIONS, createMachine, transition, type PlayerEvent, type PlayerState } from '../sonification/series/playbackState';
import { SeriesPlayer, seriesDiagnostics, TICK_MS } from '../sonification/series/SeriesPlayer';

const spec = SPECS.gistemp;
const pts = (vs: (number | null)[], y0 = 2000) => vs.map((v, i) => ({ t: String(y0 + i), v }));

describe('mapping', () => {
  it('maps the fixed reference range onto G3–G5 and clips outside it', () => {
    const lo = mapPoint(-0.6, null, spec), hi = mapPoint(1.4, null, spec), out = mapPoint(3, null, spec), under = mapPoint(-2, null, spec);
    expect(lo).toMatchObject({ kind: 'note', freq: LOW_HZ, note: 'G3', clipped: null });
    expect(hi).toMatchObject({ kind: 'note', freq: HIGH_HZ, note: 'G5' });
    expect(out).toMatchObject({ freq: HIGH_HZ, clipped: 'high' });
    expect(under).toMatchObject({ freq: LOW_HZ, clipped: 'low' });
  });

  it('the range is fixed per dataset: a value keeps its note whatever period surrounds it', () => {
    const a = mapSeries(pts([0.1, 0.5, 0.9]), spec), b = mapSeries(pts([-0.4, 0.5, 1.2]), spec);
    expect(a[1].kind === 'note' && b[1].kind === 'note' && a[1].freq === b[1].freq).toBe(true);
  });

  it('gaps are silence and the change after a gap is taken from the last real value', () => {
    const m = mapSeries(pts([0.2, null, 0.45]), spec);
    expect(m[1]).toEqual({ kind: 'silence' });
    expect(m[2]).toMatchObject({ kind: 'note', delta: 0.25, pulses: 6 });
    expect(m[0]).toMatchObject({ pulses: 1, delta: null });
    expect(mapPoint(Number.NaN, 0, spec)).toEqual({ kind: 'silence' });
  });

  it('|change| → 1–6 pulses; anomaly sign → warm / soft timbre, non-anomaly → plain', () => {
    expect(mapPoint(0.2, 0.2, spec)).toMatchObject({ pulses: 1, timbre: 'warm' });
    expect(mapPoint(-0.1, 0.025, spec)).toMatchObject({ pulses: 4, timbre: 'soft' });
    expect(mapPoint(400, 397, SPECS['vital-co2'])).toMatchObject({ pulses: 6, timbre: 'plain' });
  });

  it('gain is capped and never jumps by more than 6 dB between sounding steps', () => {
    const m = mapSeries(pts([-0.6, 1.4, -0.6, 1.4, null, 1.4]), spec).filter((x) => x.kind === 'note');
    const g = m.map((x) => (x.kind === 'note' ? x.gain : 0));
    expect(Math.max(...g)).toBeLessThanOrEqual(GAIN_MAX);
    for (let i = 1; i < g.length; i++) expect(Math.abs(20 * Math.log10(g[i] / g[i - 1]))).toBeLessThanOrEqual(6.03);
  });

  it('sqrt curve spreads light rain; unknown series fall back to their own range and say so', () => {
    const r5 = mapPoint(5, null, SPECS.monsoon);
    expect(r5.kind === 'note' && r5.norm > 5 / 150).toBe(true);
    expect(specFor('monsoon-dhaka')).toBe(SPECS.monsoon);
    expect(specFor('coverage-PNG-fire')).toBe(SPECS['country-fire']);
    const f = specFor('own', [2, 4, 9]);
    expect([f.fixed, f.ref]).toEqual([false, [2, 9]]);
  });

  it('time modes: even steps, or proportional to real time over the same total length', () => {
    const p = [{ t: '2000', v: 1 }, { t: '2001', v: 1 }, { t: '2010', v: 1 }];
    expect(offsets(p, spec, 'even')).toEqual([0, 0.16, 0.32]);
    const o = offsets(p, spec, 'proportional');
    expect(o[0]).toBe(0);
    expect(o[2]).toBeCloseTo(0.32);
    expect(o[1]).toBeLessThan(0.05);
    expect(offsets(p, spec, 'even', 2)).toEqual([0, 0.08, 0.16]);
  });

  it('is deterministic: the same story and range always give the same scheduled notes (snapshot)', () => {
    const g = parseGistemp(dataFile('/data/gistemp_global.json') as never);
    const range = pointsInYears(g.points, '1990', '2025');
    const a = planSeries(range, specFor(g.id), { mode: 'even', speed: 1 }), b = planSeries(range, specFor(g.id), { mode: 'even', speed: 1 });
    expect(a).toEqual(b);
    const notes = a.steps.map((s) => `${range[s.index].t} ${s.mapped.kind === 'note' ? `${s.mapped.note} ×${s.mapped.pulses} ${s.mapped.timbre} g${s.mapped.gain}` : 'rest'} @${s.at} ${s.notes.map((n) => `${n.freq}Hz+${n.at}`).join(' ')}`);
    expect(notes).toMatchSnapshot();
  });

  it('compare: split puts A left and B right together; sequence plays B after A', () => {
    const a = pts([0, 0.5]), b = pts([1, 1.2], 2020);
    const split = planCompare(a, b, spec, { mode: 'even', speed: 1, layout: 'split' });
    expect(split.steps.filter((s) => s.lane === 'b')[0].at).toBe(0);
    expect(split.steps.flatMap((s) => s.notes.map((n) => [s.lane, n.pan]))).toContainEqual(['a', -0.85]);
    expect(split.steps.flatMap((s) => s.notes.map((n) => [s.lane, n.pan]))).toContainEqual(['b', 0.85]);
    const seq = planCompare(a, b, spec, { mode: 'even', speed: 1, layout: 'sequence' });
    expect(seq.steps.find((s) => s.lane === 'b')!.at).toBeGreaterThanOrEqual(0.32);
    expect(planCompare(a, b, spec, { mode: 'even', speed: 1, layout: 'split', stereo: false }).steps.find((s) => s.lane === 'b')!.at).toBeGreaterThan(0);
  });
});

describe('playbackState', () => {
  it('follows idle → loading → ready → playing ⇄ paused → ended, and invalid events are no-ops', () => {
    const m = createMachine();
    for (const e of ['play', 'load', 'loaded', 'play', 'pause', 'resume', 'end', 'pause'] as PlayerEvent[]) m.send(e);
    expect(m.log.map((x) => x.to)).toEqual(['idle', 'loading', 'ready', 'playing', 'paused', 'playing', 'ended', 'ended']);
    expect(transition('idle', 'play')).toBe('idle');
    expect(transition('ready', 'pause')).toBe('ready');
    expect(transition('playing', 'fail')).toBe('error');
    expect(transition('error', 'reset')).toBe('idle');
  });
  it('every target in the table is a known state', () => {
    const states = Object.keys(TRANSITIONS) as PlayerState[];
    for (const s of states) for (const to of Object.values(TRANSITIONS[s])) expect(states).toContain(to);
  });
});

// ---- a fake AudioContext: a clock the test moves, and nodes that record what they were asked ----
function fakeCtx() {
  const clock = { now: 0 };
  const started: { freq: number; at: number; wave: string }[] = [];
  const param = () => ({ value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() });
  const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
  const ctx = {
    get currentTime() { return clock.now; },
    destination: node(),
    createGain: () => ({ ...node(), gain: param() }),
    createStereoPanner: () => ({ ...node(), pan: param() }),
    createOscillator: () => {
      const o = { ...node(), type: 'sine', frequency: param(), start: (t: number) => started.push({ freq: (o.frequency.setValueAtTime.mock.calls[0]?.[0] as number), at: t, wave: o.type }), stop: vi.fn() };
      return o;
    },
  };
  const advance = (s: number) => { for (let k = 0; k < Math.round(s * 1000 / TICK_MS); k++) { clock.now += TICK_MS / 1000; vi.advanceTimersByTime(TICK_MS); } };
  return { ctx: ctx as unknown as AudioContext, clock, started, advance };
}

describe('SeriesPlayer', () => {
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  const setup = () => {
    vi.useFakeTimers();
    const f = fakeCtx(), p = new SeriesPlayer({ context: () => f.ctx, destination: () => f.ctx.destination as AudioNode });
    const cursors: number[] = [];
    p.onCursor = (i) => cursors.push(i);
    return { ...f, p, cursors };
  };

  it('schedules only inside the lookahead window, moves the cursor in order, and ends', () => {
    const { p, started, advance, cursors } = setup();
    p.load({ points: pts([0, 0.2, null, 0.6, 0.8]), spec });
    expect(p.state).toBe('ready');
    expect(p.start(0)).toBe(true);
    expect(p.state).toBe('playing');
    expect(started.every((s) => s.at <= 0.15 + 1e-9)).toBe(true);
    expect(started.length).toBeLessThan(4);
    advance(2);
    expect(cursors).toEqual([0, 1, 2, 3, 4]);
    expect(p.state).toBe('ended');
    vi.advanceTimersByTime(200);
    expect(p.nodes).toBe(1); // only the persistent output gain
    p.dispose();
    expect(p.nodes).toBe(0);
  });

  it('pause keeps the place, resume continues from it, seek jumps, stop resets', () => {
    const { p, advance, cursors } = setup();
    p.load({ points: pts([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]), spec });
    p.start(0);
    advance(0.4);
    p.pause();
    expect(p.state).toBe('paused');
    const at = cursors[cursors.length - 1];
    advance(1);
    expect(cursors[cursors.length - 1]).toBe(at);
    p.resume();
    advance(0.1);
    expect(cursors[cursors.length - 1]).toBe(at + 1);
    p.seek(6);
    advance(0.1);
    expect(cursors[cursors.length - 1]).toBe(6);
    p.stop();
    expect(p.state).toBe('ready');
    p.dispose();
  });

  it('20× play, seek and story change leaves no growing node count, and dispose leaves 0', () => {
    const { p, advance } = setup();
    const counts: number[] = [];
    for (let k = 0; k < 20; k++) {
      p.load({ points: pts(Array.from({ length: 30 }, (_, i) => Math.sin(i + k))), spec });
      p.start(k % 5);
      advance(0.3);
      p.seek(20);
      advance(0.3);
      p.markLoading();
      vi.advanceTimersByTime(200);
      counts.push(p.nodes);
    }
    expect(new Set(counts)).toEqual(new Set([1]));
    expect(seriesDiagnostics().nodes).toBe(1);
    p.dispose();
    expect(p.nodes).toBe(0);
    expect(seriesDiagnostics().nodes).toBe(0);
  });

  it('volume and mute set the output gain; no context → error state, not a throw', () => {
    const { p, ctx } = setup();
    const gains: { gain: { setTargetAtTime: ReturnType<typeof vi.fn> } }[] = [];
    const mk = ctx.createGain.bind(ctx);
    (ctx as unknown as { createGain: () => unknown }).createGain = () => { const g = mk(); gains.push(g as never); return g; };
    p.load({ points: pts([0, 1]), spec });
    p.start(0);
    p.setVolume(0.3);
    p.setMute(true);
    expect(gains[0].gain.setTargetAtTime.mock.calls.map((c) => c[0])).toEqual([0.3, 0]);
    p.dispose();
    const q = new SeriesPlayer({ context: () => null, destination: () => null });
    q.load({ points: pts([0, 1]), spec });
    expect(q.start(0)).toBe(false);
    expect(q.state).toBe('error');
    expect(q.error).toMatch(/not available/);
  });

  it('a speed change while playing keeps the place', () => {
    const { p, advance, cursors } = setup();
    p.load({ points: pts(Array.from({ length: 20 }, (_, i) => i / 20)), spec });
    p.start(0);
    advance(0.5);
    const at = cursors[cursors.length - 1];
    p.setSpeed(2);
    advance(0.05);
    expect(cursors[cursors.length - 1]).toBeGreaterThanOrEqual(at);
    expect(cursors[cursors.length - 1]).toBeLessThanOrEqual(at + 1);
    p.dispose();
  });
});
