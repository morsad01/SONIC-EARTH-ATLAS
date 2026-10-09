import { test, expect } from '@playwright/test';
import { offline, open } from './helpers';

test('the self-hosted fonts load offline, with real weights (no synthetic bold)', async ({ page }) => {
  await offline(page); // every request outside localhost is aborted, so these can only come from /fonts
  await page.setViewportSize({ width: 1200, height: 800 });
  await open(page, 'track=about');
  const r = await page.evaluate(async () => {
    const faces = ['400 16px "IBM Plex Sans"', '600 16px "IBM Plex Sans"', '700 16px "Bricolage Grotesque"', '400 16px "IBM Plex Mono"', '400 16px "Noto Sans Bengali"'];
    for (const f of faces) await document.fonts.load(f, f.includes('Bengali') ? 'বাংলা' : 'Abc');
    const w = (font: string) => { const c = document.createElement('canvas').getContext('2d')!; c.font = font; return c.measureText('Sonic Earth Atlas, listen to the planet').width; };
    return { ok: faces.map((f) => document.fonts.check(f, f.includes('Bengali') ? 'বাংলা' : 'Abc')), w400: w('400 16px "IBM Plex Sans"'), w600: w('600 16px "IBM Plex Sans"'), b700: w('700 24px "Bricolage Grotesque"'), b800: w('800 24px "Bricolage Grotesque"') };
  });
  expect(r.ok).toEqual([true, true, true, true, true]);
  expect(r.w600).toBeGreaterThan(r.w400); // a real semibold face is wider than regular; synthetic bold would not change the advance this way
  expect(r.b800).toBeGreaterThan(r.b700);
});
