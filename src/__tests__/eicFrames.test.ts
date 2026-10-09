import { describe, it, expect } from 'vitest';
import { EIC_FRAMES } from '../lib/eicFrames';

describe('Earth Information Center frames', () => {
  it('has unique ids and complete English and Bangla text, credit and source', () => {
    const ids = new Set(EIC_FRAMES.map((f) => f.id));
    expect(ids.size).toBe(EIC_FRAMES.length);
    expect(EIC_FRAMES.length).toBeGreaterThanOrEqual(4);
    for (const f of EIC_FRAMES) {
      expect(f.title.length).toBeGreaterThan(5);
      expect(f.titleBn.length).toBeGreaterThan(5);
      expect(f.what.length).toBeGreaterThan(20);
      expect(f.credit).toMatch(/Earth Information Center/);
      expect(f.sourceUrl).toMatch(/^https:\/\/earth\.gov/);
    }
  });

  it('points every frame at a bundled, non-empty image (so the demo works offline)', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs' as string);
    for (const f of EIC_FRAMES) {
      expect(f.src).toMatch(/^\/eic\/.+\.webp$/);
      const file = `public${f.src}`;
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.statSync(file).size).toBeGreaterThan(5000);
    }
  });

  it('describes every frame in words, in English and Bangla, for people who cannot see it', () => {
    for (const f of EIC_FRAMES) {
      expect(f.longEn?.length, f.id).toBeGreaterThan(200);
      expect(f.longBn?.length, f.id).toBeGreaterThan(150);
    }
  });
});
