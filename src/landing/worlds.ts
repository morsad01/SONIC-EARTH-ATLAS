import type { Track } from '../lib/nav';
import type { StringKey } from '../lib/strings';

export type WorldId = 'fire' | 'frames' | 'monsoon' | 'pulse';
export interface World {
  id: WorldId;
  track: Exclude<Track, 'about' | 'jukebox'>;
  n: 1 | 2 | 3 | 4; // string key prefix: w1…w4
  code: string;
  /** Where the texture starts, as a fraction of one turn (so each Earth shows a different face). */
  face: number;
  /** CSS filter on the texture only (the shading stays neutral): the no-WebGL fallback. */
  tint: string;
  /** The same tint for the 3D planet: multiplies the surface colour. */
  tint3d: number;
  /** Colour of the data points drawn on the surface. */
  dotColor: string;
  /** Level 3 picture: a real NASA image; `fallback` is the bundled Blue Marble when it can't load (offline). */
  still: { src: string; fallback: string };
}
const BLUE_MARBLE = '/textures/earth_atmos_2048.jpg';

/** The four Earths of the landing carousel, one per track. Order = carousel order. */
export const WORLDS: World[] = [
  { id: 'fire', tint3d: 0xffe0c2, dotColor: '#ff7a3d', track: 'atlas', n: 1, code: 'A1', face: 0.52, tint: 'saturate(.9) brightness(.95) sepia(.25) hue-rotate(-12deg)', still: { src: 'gibs:VIIRS_SNPP_CorrectedReflectance_TrueColor', fallback: BLUE_MARBLE } },
  { id: 'frames', tint3d: 0xffffff, dotColor: '#ffffff', track: 'frames', n: 2, code: 'A2', face: 0.18, tint: 'saturate(1.1)', still: { src: 'gibs:VIIRS_SNPP_CorrectedReflectance_TrueColor', fallback: BLUE_MARBLE } },
  { id: 'monsoon', tint3d: 0xe4f0ff, dotColor: '#4cc3ff', track: 'monsoon', n: 3, code: 'B1', face: 0.74, tint: 'saturate(1.05) hue-rotate(8deg)', still: { src: '/eic/geos-earth-now-rain.webp', fallback: BLUE_MARBLE } },
  { id: 'pulse', tint3d: 0xffd2c2, dotColor: '#f25c8a', track: 'pulse', n: 4, code: 'B2', face: 0.9, tint: 'saturate(.85) brightness(.9) hue-rotate(-35deg) sepia(.2)', still: { src: '/eic/ocean-heat-content.webp', fallback: BLUE_MARBLE } },
];

type Part = 'Kicker' | 'Name' | 'Line' | 'Title' | 'Body' | 'Deep' | 'Src' | 'Pic';
/** String key of one text part of a world, e.g. `worldKey(WORLDS[0], 'Name')` → `w1Name`. */
export const worldKey = (w: World, part: Part) => `w${w.n}${part}` as StringKey;

/** Position of slide `i` relative to the active one in a ring of `len`: 0 active, ±1 neighbours, anything further is hidden (null). */
export function ringOffset(i: number, active: number, len: number): -1 | 0 | 1 | null {
  if (len < 1) return null;
  let d = (((i - active) % len) + len) % len; // 0..len-1
  if (d > len / 2) d -= len;
  return d === 0 ? 0 : d === 1 ? 1 : d === -1 ? -1 : null;
}

export type Level = 1 | 2 | 3;
export const clampLevel = (n: number): Level => (n <= 1 ? 1 : n >= 3 ? 3 : (Math.round(n) as Level));

/** What the stage shows: the three carousel levels, then 4 = backdrop (no carousel copy; the Earth sits behind the sections below). */
export type Stage = Level | 4;

/**
 * Scroll-driven levels. The stage is sticky for the whole landing page; `u` is how far the page has scrolled past its top, in screen heights.
 * Each level holds for a while (so the copy can be read while the planet is still) and the moves between them are eased:
 * hold L1 → glide right to L2 → hold L2 → zoom into L3 → hold L3 → pull back to the backdrop pose while the sections below scroll in over it.
 * Returns `p` in 0–3 (0 = level 1, 1 = level 2, 2 = level 3, 3 = backdrop). The sections below start entering at `u = SCROLL_SPAN`.
 */
export const SCROLL_SPAN = 3.25;
const STOPS: readonly [number, number][] = [[0, 0], [0.25, 0], [1.2, 1], [1.6, 1], [2.45, 2], [3, 2], [3.8, 3]];
const smooth = (x: number) => x * x * (3 - 2 * x);
export function scrollProgress(u: number): number {
  if (!(u > 0)) return 0;
  for (let i = 1; i < STOPS.length; i++) {
    const [u0, p0] = STOPS[i - 1], [u1, p1] = STOPS[i];
    if (u <= u1) return p0 + (p1 - p0) * smooth((u - u0) / (u1 - u0));
  }
  return 3;
}
/** The stage shown at progress `p`: it switches halfway through each move. */
export const levelAt = (p: number): Stage => (p < 0.5 ? 1 : p < 1.5 ? 2 : p < 2.5 ? 3 : 4);
/** Where to scroll (screen heights into the track) to show a level: the middle of its hold. */
export const levelScroll = (l: Level): number => (l === 1 ? 0 : l === 2 ? 1.4 : 2.7);

/** `?world=monsoon&level=2` opens the landing page on that Earth and level (for demos). Anything invalid falls back to the first Earth, level 1. */
export function parseLandingQuery(search: string): { index: number; level: Level } {
  const q = new URLSearchParams(search), i = WORLDS.findIndex((w) => w.id === q.get('world'));
  const lv = Number(q.get('level'));
  return { index: Math.max(0, i), level: i >= 0 && Number.isFinite(lv) ? clampLevel(lv) : 1 };
}

/** Resamples a series to `n` points (mean of each bucket) and scales it to 0–1. Empty in, empty out; a flat series sits in the middle. */
export function toMelody(values: readonly number[], n = 16): number[] {
  if (!values.length) return [];
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const a = Math.floor((k * values.length) / n), b = Math.max(a + 1, Math.floor(((k + 1) * values.length) / n));
    const slice = values.slice(a, b);
    out.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  const lo = Math.min(...out), hi = Math.max(...out);
  return hi === lo ? out.map(() => 0.5) : out.map((v) => (v - lo) / (hi - lo));
}
/** 0–1 → 220…880 Hz (two octaves, exponential like pitch). */
export const melodyHz = (v: number) => 220 * 2 ** (2 * Math.max(0, Math.min(1, v)));
