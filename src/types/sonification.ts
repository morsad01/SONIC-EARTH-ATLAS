import type { PhenomenonType } from './dataset';

export interface SpatialAudioConfig {
  mode: 'spatial-hrtf' | 'stereo-panning';
  listenerOrientation: [number, number, number];
  elevationFiltering: boolean;
  masterVolume: number;
  layerVolumes: Record<PhenomenonType, number>;
  layerMuted: Record<PhenomenonType, boolean>;
}

export interface SonificationParameters {
  frequency: number; // Base Hz
  qFactor: number;
  gain: number; // 0 to 1
  pan: number; // -1 to 1 (longitude mapped)
  pulseRate: number; // Hz or events per second
  brightness: number; // High-frequency cutoff
  temporalModulation: number; // LFO or delta rate
  harmonicWarmth: number;
}

export interface SoundEvent {
  id: string;
  phenomenon: PhenomenonType;
  latitude: number;
  longitude: number;
  value: number;
  normalizedValue: number;
  delta: number;
  timestamp: number;
  durationMs: number;
  parameters: SonificationParameters;
}

export type { PlayerState } from '../sonification/series/playbackState';
/** Legacy three-state view. New players use `PlayerState` (idle → loading → ready → playing ⇄ paused → ended, error). */
export type PlaybackState = 'playing' | 'paused' | 'stopped';
