import { describe, it, expect } from 'vitest';
import { activeColumns, colAt, nextColumn, noteName, orderRange, rowAt, silentRects, stepMs, timbreWord } from '../lib/frameSweep';
import { EIC_FRAMES } from '../lib/eicFrames';

describe('frame sweep maths', () => {
  it('maps positions to columns and rows, clamped to the frame', () => {
    expect(colAt(0, 128)).toBe(0);
    expect(colAt(0.5, 128)).toBe(64);
    expect(colAt(1, 128)).toBe(127);
    expect(colAt(-0.2, 128)).toBe(0);
    expect(colAt(1.4, 128)).toBe(127);
    expect(rowAt(0.99, 12)).toBe(11);
  });

  it('advances, loops or stops at the end of the range', () => {
    expect(nextColumn(5, { lo: 0, hi: 10, loop: true })).toBe(6);
    expect(nextColumn(10, { lo: 4, hi: 10, loop: true })).toBe(4);
    expect(nextColumn(10, { lo: 4, hi: 10, loop: false })).toBeNull();
    expect(nextColumn(2, { lo: 4, hi: 10, loop: false })).toBe(4); // needle outside the range jumps in
  });

  it('keeps a loop range ordered and inside the frame', () => {
    expect(orderRange(90, 20, 128)).toEqual([20, 90]);
    expect(orderRange(-5, 300, 128)).toEqual([0, 127]);
  });

  it('turns speed into step time', () => {
    expect(stepMs(20, 128, 1)).toBeCloseTo(156.25);
    expect(stepMs(20, 128, 2)).toBeCloseTo(78.125);
  });

  it('silences everything outside the region and inside the ignored boxes', () => {
    expect(silentRects()).toEqual([]);
    const rects = silentRects({ x: 0.2, y: 0.3, w: 0.5, h: 0.4 }, [{ x: 0.3, y: 0.3, w: 0.1, h: 0.1 }]);
    expect(rects).toHaveLength(5);
    // The four outer rectangles plus the picture region tile the whole image exactly.
    const area = rects.slice(0, 4).reduce((a, r) => a + r.w * r.h, 0);
    expect(area).toBeCloseTo(1 - 0.5 * 0.4);
  });

  it('finds the columns that carry sound', () => {
    const lum = new Float32Array(8 * 2);
    lum[2] = 0.5; lum[8 + 5] = 0.4;
    expect(activeColumns(lum, 8, 2)).toEqual([2, 5]);
    expect(activeColumns(new Float32Array(16), 8, 2)).toBeNull();
  });

  it('keeps every EIC sound region inside its image', () => {
    for (const f of EIC_FRAMES) {
      const r = f.soundRegion;
      if (!r) continue;
      expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(1); expect(r.y + r.h).toBeLessThanOrEqual(1);
    }
  });

  it('names notes and timbres for the legend', () => {
    expect(noteName(440)).toBe('A4');
    expect(noteName(261.63)).toBe('C4');
    expect(noteName(130.81)).toBe('C3');
    expect(timbreWord(0.6, 0)).toBe('buzzy');
    expect(timbreWord(0.1, 0.4)).toBe('airy');
    expect(timbreWord(0, 0)).toBe('soft');
  });
});
