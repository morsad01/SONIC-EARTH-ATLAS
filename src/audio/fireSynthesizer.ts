import type { EarthObservation } from '../types/dataset';
import type { SpatialNodePack } from './spatialPanner';
import { SpatialAudioBuilder } from './spatialPanner';

export class FireSynthesizer {
  private ctx: AudioContext;
  private destination: AudioNode;
  private spatialPack: SpatialNodePack | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private intervalTimer: number | null = null;
  private currentObs: EarthObservation | null = null;
  private isHearChangeMode = false;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
    this.createDeterministicNoiseBuffer();
  }

  private createDeterministicNoiseBuffer() {
    // 1-second pre-computed pink/crackle noise buffer
    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      // Deterministic pseudorandom white noise calculation for pinking filter
      const white = Math.sin(i * 12.9898 + 78.233) * 43758.5453 - Math.floor(Math.sin(i * 12.9898 + 78.233) * 43758.5453) * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
    }
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

    // Rate of bursts proportional to normalized FRP (4 Hz to 24 Hz)
    let effectiveNorm = obs.normalizedValue;
    if (this.isHearChangeMode && obs.delta !== undefined) {
      // Positive delta intensifies crackle bursts
      effectiveNorm = Math.max(0.05, Math.min(1.0, 0.4 + (obs.delta / 300) * 0.6));
    }

    const intervalMs = Math.max(40, 250 - effectiveNorm * 200);

    // Trigger deterministic crackle bursts
    this.triggerBurst();
    this.intervalTimer = window.setInterval(() => {
      this.triggerBurst();
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
      effectiveNorm = Math.max(0.05, Math.min(1.0, 0.4 + (obs.delta / 300) * 0.6));
    }
    const intervalMs = Math.max(40, 250 - effectiveNorm * 200);

    this.triggerBurst();
    this.intervalTimer = window.setInterval(() => {
      this.triggerBurst();
    }, intervalMs);
  }

  private triggerBurst() {
    if (!this.currentObs || !this.spatialPack || !this.noiseBuffer || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    let norm = this.currentObs.normalizedValue;

    if (this.isHearChangeMode && this.currentObs.delta !== undefined) {
      norm = Math.max(0.1, Math.min(1.0, 0.4 + (this.currentObs.delta / 400) * 0.6));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    // Offset based on time to vary sample position deterministically
    source.loop = false;

    // Bandpass filter for authentic thermal combustion resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const cutoff = 800 + norm * 2200; // 800 Hz to 3000 Hz
    filter.frequency.setValueAtTime(cutoff, now);
    filter.Q.setValueAtTime(4.0, now);

    // Burst amplitude envelope (fast snap crackle)
    const env = this.ctx.createGain();
    const peakGain = 0.08 + norm * 0.22;
    const duration = 0.03 + norm * 0.05;

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(peakGain, now + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(env);
    env.connect(this.spatialPack.inputNode);

    source.start(now);
    source.stop(now + duration + 0.01);
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
