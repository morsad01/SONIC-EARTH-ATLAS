import { describe, it, expect } from 'vitest';
import { decodeShare, encodeShare } from '../lib/shareLink';
import { EIC_FRAMES, EIC_STORY } from '../lib/eicFrames';

const ok = { frames: ['eic-ghg', 'eic-ocean-heat', 'truecolor'], pairs: ['sst', 'custom'] };

describe('share link', () => {
  it('round-trips a single picture view', () => {
    const h = encodeShare({ track: 'frames', frame: 'eic-ghg', col: 40, lang: 'bn' });
    expect(h).toBe('v1&track=frames&frame=eic-ghg&col=40&lang=bn');
    expect(decodeShare('#' + h, ok)).toEqual({ track: 'frames', frame: 'eic-ghg', col: 40, lang: 'bn' });
  });

  it('round-trips a custom ear comparison', () => {
    const h = encodeShare({ track: 'frames', pair: 'custom', a: 'eic-ghg', b: 'truecolor' });
    expect(decodeShare(h, ok)).toEqual({ track: 'frames', pair: 'custom', a: 'eic-ghg', b: 'truecolor' });
  });

  it('opens the About page and still decodes every older track link', () => {
    expect(encodeShare({ track: 'about' })).toBe('v1&track=about');
    expect(decodeShare('#v1&track=about', ok)).toEqual({ track: 'about' });
    for (const tr of ['atlas', 'frames', 'monsoon', 'pulse'] as const) expect(decodeShare(`#v1&track=${tr}`, ok)).toEqual({ track: tr });
    expect(decodeShare('#v1&track=frames&frame=eic-ghg&col=40&lang=bn&story=x&c=BGD', ok)).toEqual({ track: 'frames', frame: 'eic-ghg', col: 40, lang: 'bn' });
  });

  it('ignores unknown versions, ids and out-of-range values', () => {
    expect(decodeShare('#v2&track=frames', ok)).toBeNull();
    expect(decodeShare('#', ok)).toBeNull();
    expect(decodeShare('v1&track=evil&frame=nope&col=999&lang=fr', ok)).toBeNull();
    expect(decodeShare('v1&track=frames&col=-3', ok)).toEqual({ track: 'frames' });
    expect(decodeShare('v1&pair=custom&a=eic-ghg', ok)).toBeNull(); // custom needs both sides
  });
});

describe('EIC story', () => {
  it('has a caption in both languages for every bundled frame, in an existing frame order', () => {
    const ids = new Set(EIC_FRAMES.map((f) => f.id));
    expect(EIC_STORY.length).toBeGreaterThanOrEqual(3);
    for (const s of EIC_STORY) { expect(ids.has(s.frameId)).toBe(true); expect(s.en.length).toBeGreaterThan(30); expect(s.bn.length).toBeGreaterThan(20); }
  });
});
