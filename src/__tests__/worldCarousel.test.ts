import { describe, it, expect } from 'vitest';
import { SCROLL_SPAN, WORLDS, clampLevel, levelAt, levelScroll, melodyHz, parseLandingQuery, ringOffset, scrollProgress, toMelody, worldKey } from '../landing/worlds';
import { STRINGS } from '../lib/strings';
import { TRACKS } from '../lib/nav';
import { easeK } from '../globe/framing';

describe('world carousel config', () => {
  it('has one Earth per track, in track order, with every text part in English and বাংলা', () => {
    expect(WORLDS.map((w) => w.track)).toEqual(TRACKS.map((t) => t.id));
    expect(WORLDS.map((w) => w.code)).toEqual(TRACKS.map((t) => t.code));
    for (const w of WORLDS) for (const part of ['Kicker', 'Name', 'Line', 'Title', 'Body', 'Deep', 'Src', 'Pic'] as const) {
      expect(STRINGS.en[worldKey(w, part)], `en ${w.id} ${part}`).toBeTruthy();
      expect(STRINGS.bn[worldKey(w, part)], `bn ${w.id} ${part}`).toBeTruthy();
    }
  });
  it('shows a real NASA picture or a bundled one at level 3, and says where it comes from', () => {
    for (const w of WORLDS) { expect(w.still.src).toMatch(/^(gibs:|\/eic\/)/); expect(w.still.fallback).toMatch(/^\/textures\//); expect(STRINGS.en[worldKey(w, 'Src')]).toMatch(/NASA/); expect(STRINGS.en[worldKey(w, 'Pic')]).toMatch(/NASA|Earth Information Center/); }
  });
});

describe('ringOffset', () => {
  it('puts the active Earth at 0 and its neighbours at ±1, wrapping around', () => {
    expect([0, 1, 2, 3].map((i) => ringOffset(i, 0, 4))).toEqual([0, 1, null, -1]);
    expect([0, 1, 2, 3].map((i) => ringOffset(i, 3, 4))).toEqual([1, null, -1, 0]);
  });
  it('handles short rings', () => {
    expect(ringOffset(0, 0, 1)).toBe(0);
    expect([0, 1].map((i) => ringOffset(i, 0, 2))).toEqual([0, 1]);
    expect(ringOffset(0, 0, 0)).toBeNull();
  });
});

describe('scroll-driven levels', () => {
  it('holds each level, moves smoothly between them, ends on the backdrop and stays in 0–3', () => {
    expect([scrollProgress(-1), scrollProgress(0), scrollProgress(0.2), scrollProgress(1.4), scrollProgress(2.7), scrollProgress(9)]).toEqual([0, 0, 0, 1, 2, 3]);
    let last = 0;
    for (let u = 0; u <= SCROLL_SPAN + 1; u += 0.01) { const p = scrollProgress(u); expect(p).toBeGreaterThanOrEqual(last - 1e-9); last = p; }
  });
  it('the Earth starts pulling back before the sections below arrive and is settled once they cover the screen', () => {
    expect(scrollProgress(SCROLL_SPAN)).toBeGreaterThan(2);
    expect(scrollProgress(SCROLL_SPAN + 1)).toBe(3);
  });
  it('switches level halfway through a move, and each level\'s scroll target lands on it', () => {
    expect([levelAt(0), levelAt(0.49), levelAt(0.5), levelAt(1.4), levelAt(1.6), levelAt(2), levelAt(2.6), levelAt(3)]).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    for (const l of [1, 2, 3] as const) expect(levelAt(scrollProgress(levelScroll(l)))).toBe(l);
  });
});

describe('levels and the demo link', () => {
  it('clamps levels to 1–3', () => { expect([clampLevel(-1), clampLevel(1), clampLevel(2), clampLevel(3), clampLevel(9)]).toEqual([1, 1, 2, 3, 3]); });
  it('reads ?world= and ?level= and falls back to the first Earth, level 1', () => {
    expect(parseLandingQuery('?world=monsoon&level=2')).toEqual({ index: 2, level: 2 });
    expect(parseLandingQuery('?world=pulse&level=9')).toEqual({ index: 3, level: 3 });
    expect(parseLandingQuery('?world=nope&level=3')).toEqual({ index: 0, level: 1 });
    expect(parseLandingQuery('?level=x')).toEqual({ index: 0, level: 1 });
    expect(parseLandingQuery('')).toEqual({ index: 0, level: 1 });
  });
});

describe('preview melody', () => {
  it('resamples to 16 notes in 0–1, keeps the shape, and is empty without data', () => {
    expect(toMelody([])).toEqual([]);
    const m = toMelody(Array.from({ length: 100 }, (_, i) => i));
    expect(m).toHaveLength(16);
    expect(m[0]).toBe(0); expect(m[15]).toBe(1);
    expect([...m].sort((a, b) => a - b)).toEqual(m);
    expect(toMelody([5, 5, 5])).toEqual(Array(16).fill(0.5));
  });
  it('maps 0–1 to two octaves from 220 Hz', () => { expect(melodyHz(0)).toBe(220); expect(melodyHz(1)).toBeCloseTo(880); expect(melodyHz(2)).toBeCloseTo(880); });
});

describe('easeK', () => {
  it('reaches the same point at the same time at 30 and 60 fps', () => {
    const run = (fps: number, ms: number) => { let v = 0; for (let t = 0; t < ms; t += 1000 / fps) v += (1 - v) * easeK(1000 / fps, 120); return v; };
    expect(run(30, 600)).toBeCloseTo(run(60, 600), 1);
    expect(easeK(0, 120)).toBe(0);
  });
});
