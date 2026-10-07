import type { EarthObservation } from '../types/dataset';
import type { SpatialNodePack } from './spatialPanner';
import { SpatialAudioBuilder } from './spatialPanner';

export class OceanSynthesizer {
  private ctx: AudioContext;
  private destination: AudioNode;
  private spatialPack: SpatialNodePack | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private currentObs: EarthObservation | null = null;

  public getObservation(): EarthObservation | null {
    return this.currentObs;
  }

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

    this.spatialPack = SpatialAudioBuilder.createSpatialChain(
      this.ctx,
      this.destination,
      obs.latitude,
      obs.longitude,
      spatialMode
    );

    const now = this.ctx.currentTime;

    // Calculate base frequency based on SST Anomaly (-3.0 to +3.0 °C)
    // Baseline 110 Hz (A2); warm pushes up by ~4 semitones, cold pushes down by ~3 semitones
    const anomaly = obs.value;
    const semitoneShift = (anomaly / 3.0) * 4;
    const baseFreq = 110 * Math.pow(2, semitoneShift / 12);

    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'triangle';
    this.osc1.frequency.setValueAtTime(baseFreq, now);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sine';
    // Subtle fifth harmonic detuning
    this.osc2.frequency.setValueAtTime(baseFreq * 1.498, now);

    // Warm low-pass filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    const cutoff = 240 + obs.normalizedValue * 520;
    this.filter.frequency.setValueAtTime(cutoff, now);
    this.filter.Q.setValueAtTime(1.8, now);

    // Slow oceanic swell LFO
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(0.18, now);

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(0.04, now);
    this.lfo.connect(this.lfoGain.gain);

    this.gainNode = this.ctx.createGain();
    const targetGain = 0.08 + Math.min(0.12, Math.abs(anomaly) * 0.04);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(targetGain, now + 0.3);

    // Route: (osc1 + osc2) -> filter -> gainNode -> spatialPack.inputNode
    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.spatialPack.inputNode);

    this.osc1.start(now);
    this.osc2.start(now);
    this.lfo.start(now);

    if (hearChangeMode && obs.delta !== undefined) {
      this.applyDeltaModulation(obs.delta);
    }
  }

  public updateObservation(obs: EarthObservation, hearChangeMode = false) {
    this.currentObs = obs;
    if (this.spatialPack) {
      this.spatialPack.updatePosition(obs.latitude, obs.longitude);
    }

    if (!this.osc1 || !this.filter || !this.gainNode) return;
    const now = this.ctx.currentTime;

    const anomaly = obs.value;
    const semitoneShift = (anomaly / 3.0) * 4;
    const baseFreq = 110 * Math.pow(2, semitoneShift / 12);

    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.2);
    if (this.osc2) {
      this.osc2.frequency.setTargetAtTime(baseFreq * 1.498, now, 0.2);
    }

    const cutoff = 240 + obs.normalizedValue * 520;
    this.filter.frequency.setTargetAtTime(cutoff, now, 0.2);

    if (hearChangeMode && obs.delta !== undefined) {
      this.applyDeltaModulation(obs.delta);
    }
  }

  private applyDeltaModulation(delta: number) {
    if (!this.filter || !this.osc1) return;
    const now = this.ctx.currentTime;
    // Warming delta (>0) causes a bright upward frequency inflection
    if (delta > 0.1) {
      this.filter.frequency.exponentialRampToValueAtTime(
        Math.min(2000, this.filter.frequency.value * 1.5),
        now + 0.15
      );
    }
  }

  public stop() {
    const now = this.ctx.currentTime;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(0, now, 0.08);
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.lfo?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.lfo?.disconnect();
          this.filter?.disconnect();
          this.gainNode?.disconnect();
          this.spatialPack?.dispose();
        } catch {
          // ignore cleanup errors
        }
      }, 100);
    } else if (this.spatialPack) {
      this.spatialPack.dispose();
    }
    this.currentObs = null;
  }
}
