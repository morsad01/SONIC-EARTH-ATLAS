import type { SeriesPoint } from '../../datasets/series';
import type { SonificationSpec } from './specs';
import { planSeries, type Plan, type PlanStep, type TimeMode } from './mapping';
import { planCompare, type CompareLayout } from './compare';
import { createMachine, type PlayerState } from './playbackState';
import { seriesStats } from './diagnostics';
export { seriesDiagnostics } from './diagnostics';

/**
 * Series player (roadmap Phase 5): a lookahead scheduler over a pure `Plan`. A 25 ms tick schedules notes up to 150 ms ahead
 * (never more than 2 s), on the shared context through one per-player bus. Pause, stop and seek fade the bus out and
 * disconnect it with every voice on it; `dispose()` disconnects everything at once. The node counter is module-wide for Diagnostics.
 */
export interface PlayInput { points: SeriesPoint[]; spec: SonificationSpec; compare?: { b: SeriesPoint[]; layout: CompareLayout } | null }
export interface PlayerDeps { context: () => AudioContext | null; destination: () => AudioNode | null }

export const TICK_MS = 25, LOOKAHEAD_S = 0.15, MAX_WINDOW_S = 2;
const LEAD_S = 0.05, FADE_S = 0.012, RELEASE_MS = 90;


interface Voice { osc: OscillatorNode; nodes: AudioNode[]; end: number }

export class SeriesPlayer {
  onCursor: (index: number) => void = () => {};
  onState: (s: PlayerState) => void = () => {};
  error: string | null = null;
  private m = createMachine((s) => { seriesStats.state = s; this.onState(s); });
  private input: PlayInput | null = null;
  private plan: Plan | null = null;
  private mode: TimeMode = 'even';
  private speed = 1;
  private volume = 0.8;
  private muted = false;
  private out: GainNode | null = null;
  private bus: GainNode | null = null;
  private voices: Voice[] = [];
  private pos = 0; // next step to schedule
  private heard = 0; // first step the cursor has not reached
  private t0 = 0; // context time of plan time 0
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastCursor = -1;
  private own = 0;
  private deps: PlayerDeps;

  constructor(deps: PlayerDeps) { this.deps = deps; }
  /** Sets the cursor and/or state listeners; returns a function that removes them. */
  listen(h: { cursor?: (index: number) => void; state?: (s: PlayerState) => void }): () => void {
    if (h.cursor) this.onCursor = h.cursor;
    if (h.state) this.onState = h.state;
    return () => { if (h.cursor && this.onCursor === h.cursor) this.onCursor = () => {}; if (h.state && this.onState === h.state) this.onState = () => {}; };
  }
  get state(): PlayerState { return this.m.state; }
  get nodes(): number { return this.own; }
  get log() { return this.m.log; }
  get steps(): readonly PlanStep[] { return this.plan?.steps ?? []; }

  /** The data for the next play is on its way: stop and show "loading". */
  markLoading() { this.halt(); this.m.send('load'); }
  fail(message: string) { this.halt(); this.error = message; this.m.send('fail'); }

  load(input: PlayInput) {
    this.halt();
    this.m.send('load');
    this.input = input;
    this.replan();
    if (!input.points.length) { this.error = 'No values to play'; this.m.send('fail'); return; }
    this.error = null;
    this.m.send('loaded');
  }

  /** Starts at the first step of point `from` (lane A). Call only from a user gesture. */
  start(from = 0): boolean {
    if (!this.plan?.steps.length || !['ready', 'paused', 'ended', 'error'].includes(this.state)) return false;
    if (!this.deps.context() || !this.deps.destination()) { this.fail('Audio is not available in this browser'); return false; }
    this.cut(true);
    this.pos = this.stepOf(from);
    this.error = null;
    this.begin();
    this.m.send('play');
    return true;
  }
  pause() { if (this.state !== 'playing') return; this.cut(true); this.pos = this.heard; this.m.send('pause'); }
  resume() { if (this.state !== 'paused') return; this.begin(); this.m.send('resume'); }
  stop() { if (this.state !== 'playing' && this.state !== 'paused' && this.state !== 'ended') return; this.cut(true); this.pos = this.heard = 0; this.m.send('stop'); }

  /** Moves to point `index` (lane A). While playing the sound jumps there; otherwise the next play starts there. */
  seek(index: number) {
    const k = this.stepOf(index);
    if (this.state === 'playing') { this.cut(true); this.pos = k; this.begin(); } else this.pos = this.heard = k;
  }
  setSpeed(x: number) { if (x > 0 && x !== this.speed) { this.speed = x; this.rebuild(); } }
  setTimeMode(m: TimeMode) { if (m !== this.mode) { this.mode = m; this.rebuild(); } }
  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); this.applyGain(); }
  setMute(on: boolean) { this.muted = on; this.applyGain(); }

  dispose() {
    this.cut(false);
    if (this.out) { this.release([], this.out); this.out = null; }
    this.input = this.plan = null;
    this.m.send('reset');
  }

  // ---- internals ----
  private stepOf(index: number) {
    const s = this.plan?.steps ?? [], k = s.findIndex((x) => x.lane === 'a' && x.index >= index);
    return k < 0 ? 0 : k;
  }
  private replan() {
    const i = this.input;
    if (!i) { this.plan = null; return; }
    const stereo = typeof this.deps.context()?.createStereoPanner === 'function' || !this.deps.context();
    this.plan = i.compare ? planCompare(i.points, i.compare.b, i.spec, { mode: this.mode, speed: this.speed, layout: i.compare.layout, stereo })
      : planSeries(i.points, i.spec, { mode: this.mode, speed: this.speed });
  }
  /** Rebuild the plan after a speed or time-mode change, keeping the place. */
  private rebuild() {
    const at = this.plan?.steps[Math.min(this.heard, (this.plan?.steps.length ?? 1) - 1)]?.index ?? 0;
    this.replan();
    if (this.state === 'playing') { this.cut(true); this.pos = this.stepOf(at); this.begin(); } else this.pos = this.heard = this.stepOf(at);
  }
  private made(n: number) { this.own += n; seriesStats.nodes += n; }
  private freed(n: number) { this.own -= n; seriesStats.nodes -= n; }
  private gainValue() { return this.muted ? 0 : this.volume; }
  private applyGain() { const c = this.deps.context(); if (this.out && c) this.out.gain.setTargetAtTime(this.gainValue(), c.currentTime, 0.03); }

  private begin() {
    const ctx = this.deps.context(), dest = this.deps.destination(), steps = this.plan?.steps;
    if (!ctx || !dest || !steps?.length) return;
    if (!this.out) { this.out = ctx.createGain(); this.out.gain.value = this.gainValue(); this.out.connect(dest); this.made(1); }
    this.bus = ctx.createGain();
    this.bus.connect(this.out);
    this.made(1);
    this.pos = Math.min(this.pos, steps.length - 1);
    this.heard = this.pos;
    this.lastCursor = -1;
    this.t0 = ctx.currentTime + LEAD_S - steps[this.pos].at;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  private tick() {
    const ctx = this.deps.context(), steps = this.plan?.steps;
    if (!ctx || !steps || !this.bus) return;
    const now = ctx.currentTime, horizon = now + Math.min(LOOKAHEAD_S, MAX_WINDOW_S);
    while (this.pos < steps.length && this.t0 + steps[this.pos].at <= horizon) this.schedule(ctx, steps[this.pos++]);
    let idx = -1;
    while (this.heard < steps.length && this.t0 + steps[this.heard].at <= now) { if (steps[this.heard].lane === 'a') idx = steps[this.heard].index; this.heard++; }
    if (idx >= 0 && idx !== this.lastCursor) { this.lastCursor = idx; this.onCursor(idx); }
    const done = this.voices.filter((v) => v.end < now);
    if (done.length) { this.voices = this.voices.filter((v) => v.end >= now); for (const v of done) this.release(v.nodes); }
    if (this.heard >= steps.length && now >= this.t0 + (this.plan?.duration ?? 0)) { this.cut(true); this.pos = this.heard = 0; this.m.send('end'); }
  }

  private schedule(ctx: AudioContext, step: PlanStep) {
    for (const n of step.notes) {
      const t = this.t0 + n.at, osc = ctx.createOscillator(), env = ctx.createGain(), nodes: AudioNode[] = [osc, env];
      osc.type = n.wave;
      osc.frequency.setValueAtTime(n.freq, t);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(n.gain, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0008, t + n.dur);
      osc.connect(env);
      if (n.pan !== 0 && typeof ctx.createStereoPanner === 'function') {
        const p = ctx.createStereoPanner();
        p.pan.setValueAtTime(n.pan, t);
        env.connect(p); p.connect(this.bus!); nodes.push(p);
      } else env.connect(this.bus!);
      osc.start(t);
      osc.stop(t + n.dur + 0.02);
      this.voices.push({ osc, nodes, end: t + n.dur + 0.05 });
      this.made(nodes.length);
    }
  }

  private release(nodes: AudioNode[], ...more: AudioNode[]) {
    for (const n of [...nodes, ...more]) { try { n.disconnect(); } catch { /* already gone */ } }
    this.freed(nodes.length + more.length);
  }

  /** Stops scheduling and drops the bus. Soft: fade 12 ms, then disconnect. Hard: disconnect now. */
  private cut(soft: boolean) {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    const bus = this.bus, vs = this.voices, ctx = this.deps.context();
    this.bus = null; this.voices = [];
    if (!bus) return;
    if (soft && ctx) {
      const now = ctx.currentTime;
      bus.gain.setTargetAtTime(0, now, FADE_S);
      for (const v of vs) { try { v.osc.stop(now + 0.06); } catch { /* not started or stopped */ } }
      setTimeout(() => this.release(vs.flatMap((v) => v.nodes), bus), RELEASE_MS);
    } else this.release(vs.flatMap((v) => v.nodes), bus);
  }
  private halt() { this.cut(true); this.pos = this.heard = 0; }
}
