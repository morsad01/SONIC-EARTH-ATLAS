import type { Page } from '@playwright/test';

/** Aborts every request that leaves localhost and collects real page errors (failed aborted loads are expected, not errors). */
export async function offline(page: Page) {
  const errors: string[] = [];
  await page.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_|did not answer|NASA POWER/i.test(m.text())) errors.push(m.text()); });
  return errors;
}

/** Opens a share-hash view with a fresh load (a hash-only change does not reload the app). */
export async function open(page: Page, hash: string) {
  await page.goto('about:blank');
  await page.goto(hash ? `/#v1&${hash}` : '/');
}

export const VIEWS: [string, string][] = [
  ['landing', ''], ['atlas', 'track=atlas'], ['jukebox', 'track=jukebox&story=gistemp'], ['about', 'track=about'],
  ['frames', 'track=frames'], ['monsoon', 'track=monsoon'], ['pulse', 'track=pulse'],
];

export const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
