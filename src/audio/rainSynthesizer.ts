import type { EarthObservation } from '../types/dataset';
import type { SpatialNodePack } from './spatialPanner';
import { SpatialAudioBuilder } from './spatialPanner';

export class RainSynthesizer {
  private ctx: AudioContext;
  private destination: AudioNode;
  private spatialPack: SpatialNodePack | null = null;
  private intervalTimer: number | null = null;
  private currentObs: EarthObservation | null = null;
  private isHearChangeMode = false;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  public start(
    obs: EarthObservation,
    spatialMode: 'spatial-hrtf' | 'stereo-panning',
    hearChangeMode = false
  ) {
    this.stop();
    this.currentObs = obs;
    this.isHearChangeMode = hearChangeMode;

    this.spatialPack = SpatialAudioBuilder.createSpatialChain(
      this.ctx,
      this.destination,
      obs.latitude,
      obs.longitude,
      spatialMode
    );

    let effectiveNorm = obs.normalizedValue;
    if (this.isHearChangeMode && obs.delta !== undefined) {
      effectiveNorm = Math.max(0.08, Math.min(1.0, 0.35 + (obs.delta / 25) * 0.65));
    }

    // Ping rate: 2 Hz (light drizzle) to 18 Hz (torrential storm)
    const intervalMs = Math.max(55, 320 - effectiveNorm * 265);

    this.triggerDroplet();
    this.intervalTimer = window.setInterval(() => {
      this.triggerDroplet();
    }, intervalMs);
  }

  public updateObservation(obs: EarthObservation, hearChangeMode = false) {
    this.currentObs = obs;
    this.isHearChangeMode = hearChangeMode;
    if (this.spatialPack) {
      this.spatialPack.updatePosition(obs.latitude, obs.longitude);
    }

    // Dynamic interval rescheduling as temporal delta updates
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    let effectiveNorm = obs.normalizedValue;
    if (this.isHearChangeMode && obs.delta !== undefined) {
      effectiveNorm = Math.max(0.08, Math.min(1.0, 0.35 + (obs.delta / 25) * 0.65));
    }
    const intervalMs = Math.max(55, 320 - effectiveNorm * 265);

    this.triggerDroplet();
    this.intervalTimer = window.setInterval(() => {
      this.triggerDroplet();
    }, intervalMs);
  }

  private triggerDroplet() {
    if (!this.currentObs || !this.spatialPack || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    let norm = this.currentObs.normalizedValue;

    if (this.isHearChangeMode && this.currentObs.delta !== undefined) {
      norm = Math.max(0.1, Math.min(1.0, 0.35 + (this.currentObs.delta / 30) * 0.65));
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Dual-tone droplet pitch: higher rain rate produces crisper, higher-tension droplet resonance
    const baseFreq = 340 + norm * 360; // 340 Hz to 700 Hz
    osc.type = 'sine';

    // Characteristic water droplet downward micro-pitch glide
    osc.frequency.setValueAtTime(baseFreq * 1.35, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.035);

    const peakGain = 0.06 + norm * 0.16;
    const decayDuration = 0.06 + (1 - norm) * 0.05; // 60ms to 110ms

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    osc.connect(gain);
    gain.connect(this.spatialPack.inputNode);

    osc.start(now);
    osc.stop(now + decayDuration + 0.01);
  }

  public stop() {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.spatialPack) {
      this.spatialPack.dispose();
      this.spatialPack = null;
    }
    this.currentObs = null;
  }
}
