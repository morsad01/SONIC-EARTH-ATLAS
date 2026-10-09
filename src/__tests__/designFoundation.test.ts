import { describe, it, expect } from 'vitest';
import { pickStage } from '../landing/useScrollStage';
import { framingTarget, idleSpin } from '../globe/framing';
import { sectionOf, TRACKS, JUKEBOX_TRACKS } from '../lib/nav';
import { STRINGS } from '../lib/strings';

describe('landing scroll stage', () => {
  it('picks the most visible section and keeps the current one on a tie', () => {
    expect(pickStage([0.9, 0.1, 0], 0)).toBe(0);
    expect(pickStage([0.2, 0.7, 0.1], 0)).toBe(1);
    expect(pickStage([0, 0.3, 0.6], 1)).toBe(2);
    expect(pickStage([0.5, 0.5, 0], 1)).toBe(1);
    expect(pickStage([0, 0, 0], 2)).toBe(2);
  });
});

describe('globe framing', () => {
  it('offsets the globe on wide screens and centres it in the Atlas', () => {
    expect(framingTarget('hero', 1.8).x).toBeGreaterThan(1);
    expect(framingTarget('immersive', 1.8).x).toBe(0);
    expect(framingTarget('explore', 1.8)).toEqual({ x: 0, y: 0, z: 7.2 });
    expect(framingTarget('explore', 0.5)).toEqual({ x: 0, y: 0, z: 10.5 });
    for (const f of ['hero', 'split', 'immersive'] as const) expect(framingTarget(f, 0.5).x).toBe(0); // phones: never off-screen
  });
  it('spins slower on the landing page and not at all with reduced motion', () => {
    expect(idleSpin('hero', false)).toBeLessThan(idleSpin('explore', false));
    for (const f of ['hero', 'split', 'immersive', 'explore'] as const) expect(idleSpin(f, true)).toBe(0);
  });
});

describe('navigation', () => {
  it('maps every existing track to a v3 section', () => {
    expect(TRACKS.map((t) => sectionOf(t.id))).toEqual(['explore', 'jukebox', 'jukebox', 'jukebox']);
    expect(JUKEBOX_TRACKS.map((t) => t.id)).toEqual(['frames', 'monsoon', 'pulse']);
    expect(sectionOf('about')).toBe('about');
  });
});

describe('strings', () => {
  // Older keys without a translation fall back to English; nothing new may be added to this list.
  const KNOWN_GAPS = new Set(Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.bn)).filter((k) => ['sampleFallback'].includes(k)));
  it('has a বাংলা string for every key', () => {
    const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.bn) && !KNOWN_GAPS.has(k));
    expect(missing).toEqual([]);
  });
  it('keeps placeholders in both languages', () => {
    for (const [k, v] of Object.entries(STRINGS.en)) {
      const vars = (v ?? '').match(/\{\w+\}/g) ?? [];
      for (const x of vars) expect(STRINGS.bn[k as keyof typeof STRINGS.en] ?? x, k).toContain(x);
    }
  });
});
