import { describe, it, expect } from 'vitest';
import { parallaxAt } from '../landing/parallax';

describe('landing parallax', () => {
  it('is zero at the top and layers move at different speeds (far = slower)', () => {
    const top = parallaxAt(0);
    expect(Math.abs(top.stars) + Math.abs(top.milky) + Math.abs(top.nebula)).toBe(0);
    const p = parallaxAt(500);
    expect(Math.abs(p.stars)).toBeLessThan(Math.abs(p.milky));
    expect(Math.abs(p.milky)).toBeLessThan(Math.abs(p.nebula));
    expect(p.nebula).toBeLessThan(0);
  });
  it('clamps every offset so layers never run out of their spare room', () => {
    const p = parallaxAt(100000);
    expect(p.stars).toBe(-80); expect(p.milky).toBe(-160); expect(p.nebula).toBe(-240);
    expect(p.copy(0)).toBe(140);
  });
  it('moves and fades a section block only after it scrolls past the top', () => {
    expect(parallaxAt(700).copy(800)).toBe(0);
    expect(parallaxAt(700).fade(800, 800)).toBe(1);
    expect(parallaxAt(900).copy(800)).toBeCloseTo(30);
    expect(parallaxAt(1040).fade(800, 800)).toBeCloseTo(0.5);
    expect(parallaxAt(2000).fade(800, 800)).toBe(0);
  });
});
