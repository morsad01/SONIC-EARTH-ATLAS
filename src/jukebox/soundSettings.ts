import type { TimeMode } from '../sonification/series/mapping';
import type { CompareLayout } from '../sonification/series/compare';

/** Listener choices for the series player. None of them starts audio. */
export interface SoundSettings { volume: number; muted: boolean; speed: number; mode: TimeMode; compare: boolean; bFrom: string | null; bTo: string | null; layout: CompareLayout }
export const DEFAULT_SOUND: SoundSettings = { volume: 0.8, muted: false, speed: 1, mode: 'even', compare: false, bFrom: null, bTo: null, layout: 'split' };
