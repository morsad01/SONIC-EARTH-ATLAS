import type { EarthObservation } from '../types/dataset';

export interface VoiceDescription {
  pan: number; // -1 left .. +1 right (longitude / 180)
  pitchHz: number; // main pitch or filter centre the listener hears
  ratePerSec: number | null; // crackles or droplets per second (null for the continuous ocean drone)
}

/** Mirrors the formulas inside the fire / rain / ocean synthesizers so the UI can say exactly what is playing. */
export function describeVoice(obs: EarthObservation): VoiceDescription {
  const n = obs.normalizedValue;
  const pan = Math.max(-1, Math.min(1, obs.longitude / 180));
  if (obs.phenomenon === 'fire') return { pan, pitchHz: 800 + n * 2200, ratePerSec: 1000 / Math.max(40, 250 - n * 200) };
  if (obs.phenomenon === 'precipitation') return { pan, pitchHz: 340 + n * 360, ratePerSec: 1000 / Math.max(55, 320 - n * 265) };
  return { pan, pitchHz: 110 * Math.pow(2, ((obs.value / 3) * 4) / 12), ratePerSec: null };
}
