import { describe, it, expect } from 'vitest';
import { framingTarget, idleSpin } from '../globe/framing';
import { sectionOf, TRACKS, JUKEBOX_TRACKS } from '../lib/nav';
import { STRINGS } from '../lib/strings';

describe('globe framing', () => {
  it('centres the Atlas globe and pulls the camera back on tall screens', () => {
    expect(framingTarget('explore', 1.8)).toEqual({ x: 0, y: 0, z: 7.2 });
    expect(framingTarget('explore', 0.5)).toEqual({ x: 0, y: 0, z: 10.5 });
  });
  it('spins gently and not at all with reduced motion', () => {
    expect(idleSpin('explore', false)).toBeGreaterThan(0.001);
    expect(idleSpin('explore', false)).toBeLessThan(0.004);
    expect(idleSpin('explore', true)).toBe(0);
  });
});

describe('navigation', () => {
  it('maps every existing track to a v3 section', () => {
    expect(TRACKS.map((t) => sectionOf(t.id))).toEqual(['explore', 'jukebox', 'jukebox', 'jukebox']);
    expect(JUKEBOX_TRACKS.map((t) => t.id)).toEqual(['frames', 'monsoon', 'pulse']);
    expect(sectionOf('about')).toBe('about');
    expect(sectionOf('jukebox')).toBe('jukebox');
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
