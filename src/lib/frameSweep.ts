/** Pure helpers for the Frame Jukebox sweep (column maths, looping, silent regions). */

/** A rectangle in fractions of an image (0..1). */
export interface Rect { x: number; y: number; w: number; h: number }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Column under a horizontal position given as a fraction (0..1) of the frame width. */
export const colAt = (fx: number, cols: number) => clamp(Math.floor(fx * cols), 0, cols - 1);
export const rowAt = (fy: number, rows: number) => clamp(Math.floor(fy * rows), 0, rows - 1);

export interface Loop { lo: number; hi: number; loop: boolean }

/** The column after `c`, or null when a non-looping sweep has reached the end of its range. */
export function nextColumn(c: number, { lo, hi, loop }: Loop): number | null {
  if (c < lo || c > hi) return lo;
  if (c < hi) return c + 1;
  return loop ? lo : null;
}

/** Milliseconds between columns for a full-width sweep of `sweepSec` at a speed multiplier. */
export const stepMs = (sweepSec: number, cols: number, speed: number) => (sweepSec * 1000) / cols / speed;

/** Order two columns so lo <= hi and both are inside 0..cols-1. */
export function orderRange(a: number, b: number, cols: number): [number, number] {
  const x = clamp(a, 0, cols - 1), y = clamp(b, 0, cols - 1);
  return x <= y ? [x, y] : [y, x];
}

/**
 * Rectangles to paint black so that only `region` (minus `ignore`) makes sound.
 * Everything is in image fractions. With no region and nothing ignored, nothing is painted.
 */
export function silentRects(region?: Rect, ignore: Rect[] = []): Rect[] {
  const out: Rect[] = [];
  if (region) {
    const { x, y, w, h } = region;
    out.push({ x: 0, y: 0, w: 1, h: y }, { x: 0, y: y + h, w: 1, h: 1 - (y + h) }, { x: 0, y, w: x, h }, { x: x + w, y, w: 1 - (x + w), h });
  }
  return [...out, ...ignore].filter((r) => r.w > 0 && r.h > 0);
}

/** First and last columns that carry any sound, or null for a silent grid. */
export function activeColumns(lum: Float32Array, cols: number, rows: number, threshold = 0.02): [number, number] | null {
  let lo = -1, hi = -1;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (lum[r * cols + c] > threshold) { if (lo < 0) lo = c; hi = c; break; }
    }
  }
  return lo < 0 ? null : [lo, hi];
}

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
/** Note name with octave for a frequency, e.g. 261.63 → "C4". */
export function noteName(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  return `${NOTES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/** The sound colour in plain words, matching how the filter opens for warm colours. */
export function timbreWord(warm: number, green: number): 'buzzy' | 'airy' | 'soft' {
  if (warm > 0.25) return 'buzzy';
  if (green > 0.15) return 'airy';
  return 'soft';
}
