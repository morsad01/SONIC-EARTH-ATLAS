import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { AudioContextManager } from './audioContext';
import { FireSynthesizer } from './fireSynthesizer';
import { RainSynthesizer } from './rainSynthesizer';
import { OceanSynthesizer } from './oceanSynthesizer';

type AnySynthesizer = FireSynthesizer | RainSynthesizer | OceanSynthesizer;

interface ActiveVoice {
  obsId: string;
  phenomenon: PhenomenonType;
  synth: AnySynthesizer;
  obs: EarthObservation;
  startedAt: number;
}

export class SonificationEngine {
  private static instance: SonificationEngine | null = null;

  private activeVoices: Map<string, ActiveVoice> = new Map();
  private maxVoices = 12; // Deterministic voice limit to protect CPU and prevent acoustic chaos
  private spatialMode: 'spatial-hrtf' | 'stereo-panning' = 'stereo-panning';
  private hearChangeMode = false;
  private isAudioUnlocked = false; // Strict Audio Gate: False by default on page load

  private isMuted: Record<PhenomenonType, boolean> = {
    fire: false,
    precipitation: false,
    sst: false,
  };
  private categoryGainNodes: Record<PhenomenonType, GainNode | null> = {
    fire: null,
    precipitation: null,
    sst: null,
  };
  private isolatedPreviewTimeout: number | null = null;

  public static getInstance(): SonificationEngine {
    if (!this.instance) {
      this.instance = new SonificationEngine();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * Explicitly unlocks or locks/stops all sonification output.
   */
  public setAudioUnlocked(unlocked: boolean): void {
    this.isAudioUnlocked = unlocked;
    if (!unlocked) {
      this.stopAllVoices();
      if (this.isolatedPreviewTimeout) {
        clearTimeout(this.isolatedPreviewTimeout);
        this.isolatedPreviewTimeout = null;
      }
      AudioContextManager.suspend();
    }
  }

  public isUnlocked(): boolean {
    return this.isAudioUnlocked && AudioContextManager.isReady();
  }

  private getCategoryNode(phenomenon: PhenomenonType): AudioNode | null {
    const master = AudioContextManager.getMasterNode();
    const ctx = AudioContextManager.getContext();
    if (!ctx || !master) return null;

    if (!this.categoryGainNodes[phenomenon]) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(this.isMuted[phenomenon] ? 0 : 1.0, ctx.currentTime);
      g.connect(master);
      this.categoryGainNodes[phenomenon] = g;
    }
    return this.categoryGainNodes[phenomenon];
  }

  public setCategoryMute(phenomenon: PhenomenonType, muted: boolean) {
    this.isMuted[phenomenon] = muted;
    const ctx = AudioContextManager.getContext();
    const node = this.categoryGainNodes[phenomenon];
    if (ctx && node) {
      node.gain.setTargetAtTime(muted ? 0 : 1.0, ctx.currentTime, 0.05);
    }
  }

  public setSpatialMode(mode: 'spatial-hrtf' | 'stereo-panning') {
    this.spatialMode = mode;
    if (!this.isAudioUnlocked) return;

    // Re-trigger active voices to update routing
    const currentList = Array.from(this.activeVoices.values());
    this.stopAllVoices();
    for (const item of currentList) {
      this.playObservation(item.obs);
    }
  }

  public setHearChangeMode(enabled: boolean) {
    this.hearChangeMode = enabled;
  }

  /**
   * Updates audio rendering to match a set of visible/active observations.
   * Performs prioritization: top observations by normalized value.
   */
  public syncObservations(observations: EarthObservation[], enabledPhenomena: Record<PhenomenonType, boolean>) {
    if (!this.isAudioUnlocked) return;

    const ctx = AudioContextManager.getContext();
    if (!ctx || ctx.state !== 'running') return;

    // Filter to active, non-muted phenomena
    const eligible = observations.filter(
      (obs) => enabledPhenomena[obs.phenomenon] && !this.isMuted[obs.phenomenon]
    );

    // Sort by normalized value + absolute delta to prioritize highest informational impact
    eligible.sort((a, b) => {
      const scoreA = a.normalizedValue + (this.hearChangeMode ? Math.abs(a.delta || 0) * 0.1 : 0);
      const scoreB = b.normalizedValue + (this.hearChangeMode ? Math.abs(b.delta || 0) * 0.1 : 0);
      return scoreB - scoreA;
    });

    // Select top N within voice budget
    const chosen = eligible.slice(0, this.maxVoices);
    const chosenIds = new Set(chosen.map((c) => c.id));

    // Stop voices that are no longer chosen
    for (const [id, voice] of this.activeVoices.entries()) {
      if (!chosenIds.has(id)) {
        voice.synth.stop();
        this.activeVoices.delete(id);
      }
    }

    // Update or start chosen voices
    for (const obs of chosen) {
      const existing = this.activeVoices.get(obs.id);
      if (existing) {
        existing.obs = obs;
        existing.synth.updateObservation(obs, this.hearChangeMode);
      } else {
        this.startVoice(obs);
      }
    }
  }

  /**
   * Instantly sonifies a single observation (e.g. user clicked on the globe or 2D map).
   */
  public playObservation(obs: EarthObservation) {
    if (!this.isAudioUnlocked) return;

    const ctx = AudioContextManager.getContext();
    if (!ctx || ctx.state !== 'running') return;
    this.startVoice(obs);
  }

  /**
   * Plays isolated preview for Auditory Legend demonstration.
   */
  public playIsolatedPreview(phenomenon: PhenomenonType) {
    if (!this.isAudioUnlocked) return;

    const ctx = AudioContextManager.getContext();
    if (!ctx || ctx.state !== 'running') return;

    this.stopAllVoices();
    if (this.isolatedPreviewTimeout) {
      clearTimeout(this.isolatedPreviewTimeout);
    }

    // Create high-clarity sample observation centered at prime meridian
    let sampleObs: EarthObservation;
    if (phenomenon === 'fire') {
      sampleObs = {
        id: 'preview-fire',
        phenomenon: 'fire',
        latitude: 10,
        longitude: 0,
        timestamp: '2026-08-01',
        variable: 'Fire Radiative Power',
        value: 450,
        unit: 'MW',
        normalizedValue: 0.75,
        source: 'NASA FIRMS / VIIRS Sample',
        regionName: 'Auditory Legend Reference Sound',
      };
    } else if (phenomenon === 'precipitation') {
      sampleObs = {
        id: 'preview-rain',
        phenomenon: 'precipitation',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-08-01',
        variable: 'Precipitation Rate',
        value: 28.5,
        unit: 'mm/hr',
        normalizedValue: 0.8,
        source: 'NASA GPM IMERG Sample',
        regionName: 'Auditory Legend Reference Sound',
      };
    } else {
      sampleObs = {
        id: 'preview-sst',
        phenomenon: 'sst',
        latitude: -5,
        longitude: 0,
        timestamp: '2026-08-01',
        variable: 'SST Anomaly',
        value: 2.3,
        unit: '°C',
        normalizedValue: 0.88,
        source: 'NOAA / NASA GHRSST Sample',
        regionName: 'Auditory Legend Reference Sound',
      };
    }

    this.startVoice(sampleObs);

    // Auto-stop preview after 4 seconds
    this.isolatedPreviewTimeout = window.setTimeout(() => {
      this.stopVoice(sampleObs.id);
    }, 4000);
  }

  private startVoice(obs: EarthObservation) {
    if (!this.isAudioUnlocked) return;

    const ctx = AudioContextManager.getContext();
    if (!ctx) return;

    const dest = this.getCategoryNode(obs.phenomenon);
    if (!dest) return;

    // Check if voice already running
    if (this.activeVoices.has(obs.id)) {
      const existing = this.activeVoices.get(obs.id)!;
      existing.synth.updateObservation(obs, this.hearChangeMode);
      return;
    }

    // Voice budgeting: if at limit, drop the oldest voice
    if (this.activeVoices.size >= this.maxVoices) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, voice] of this.activeVoices.entries()) {
        if (voice.startedAt < oldestTime) {
          oldestTime = voice.startedAt;
          oldestKey = key;
        }
      }
      if (oldestKey) {
        this.stopVoice(oldestKey);
      }
    }

    let synth: AnySynthesizer;
    if (obs.phenomenon === 'fire') {
      synth = new FireSynthesizer(ctx, dest);
    } else if (obs.phenomenon === 'precipitation') {
      synth = new RainSynthesizer(ctx, dest);
    } else {
      synth = new OceanSynthesizer(ctx, dest);
    }

    synth.start(obs, this.spatialMode, this.hearChangeMode);

    this.activeVoices.set(obs.id, {
      obsId: obs.id,
      phenomenon: obs.phenomenon,
      synth,
      obs,
      startedAt: performance.now(),
    });
  }

  private stopVoice(id: string) {
    const v = this.activeVoices.get(id);
    if (v) {
      v.synth.stop();
      this.activeVoices.delete(id);
    }
  }

  public stopAllVoices() {
    for (const voice of this.activeVoices.values()) {
      voice.synth.stop();
    }
    this.activeVoices.clear();
  }

  public getDiagnostics() {
    const ctx = AudioContextManager.getContext();
    return {
      activeVoicesCount: this.activeVoices.size,
      maxVoices: this.maxVoices,
      spatialMode: this.spatialMode,
      audioContextState: ctx ? ctx.state : 'uninitialized',
      sampleRate: ctx ? ctx.sampleRate : 0,
      isHearChangeMode: this.hearChangeMode,
      isAudioUnlocked: this.isAudioUnlocked,
    };
  }

  /**
   * Returns a map of actively emitting voices with their normalized intensity,
   * phenomenon type, and timestamp to drive synchronized visual beacons.
   */
  public getActiveVoiceDetails(): Map<string, { intensity: number; phenomenon: PhenomenonType; startedAt: number }> {
    const ctx = AudioContextManager.getContext();
    const result = new Map<string, { intensity: number; phenomenon: PhenomenonType; startedAt: number }>();
    if (!ctx || ctx.state !== 'running' || !this.isAudioUnlocked) {
      return result;
    }

    for (const [id, voice] of this.activeVoices.entries()) {
      if (this.isMuted[voice.phenomenon]) continue;
      result.set(id, {
        intensity: voice.obs.normalizedValue,
        phenomenon: voice.phenomenon,
        startedAt: voice.startedAt,
      });
    }
    return result;
  }
}
