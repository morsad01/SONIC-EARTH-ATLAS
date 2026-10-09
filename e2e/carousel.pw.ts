import { test, expect } from '@playwright/test';
import { offline, open, noHorizontalScroll } from './helpers';

test.beforeEach(async ({ page }) => { await offline(page); });

test('the landing planets are one WebGL canvas in the carousel (no Atlas globe) and the page has one h1', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, '');
  await expect(page.locator('#world-carousel')).toBeVisible();
  await expect(page.locator('#world-carousel .world-gl canvas')).toHaveCount(1);
  await expect(page.locator('main canvas')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('level 1 → 2 → 3 and back with the buttons and Esc', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, '');
  const stage = page.locator('#world-carousel');
  await expect(stage).toHaveAttribute('data-level', '1');
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(stage).toHaveAttribute('data-level', '2');
  await expect(page.getByRole('heading', { name: 'The burning planet' }).first()).toBeFocused();
  await page.getByRole('button', { name: 'Learn more' }).click();
  await expect(stage).toHaveAttribute('data-level', '3');
  await expect(page.getByRole('button', { name: 'Open this track' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(stage).toHaveAttribute('data-level', '2');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(stage).toHaveAttribute('data-level', '1');
});

test('arrows, dots and the neighbour buttons change the Earth; the neighbours peek in at the edges', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, '');
  await expect(page.getByRole('status').filter({ hasText: '1 of 4' })).toBeAttached();
  await page.getByRole('button', { name: /Next Earth: Imagery/ }).click();
  await expect(page.getByRole('status').filter({ hasText: '2 of 4: Imagery' })).toBeAttached();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('status').filter({ hasText: '3 of 4: Monsoon' })).toBeAttached();
  await page.getByRole('button', { name: 'Show Fire' }).click();
  await expect(page.getByRole('status').filter({ hasText: '1 of 4: Fire' })).toBeAttached();
  await expect.poll(async () => { const b = await page.locator('.world-sphere[data-pos="next"]').boundingBox(); return !!b && b.x < 1280 && b.x + b.width > 1280; }).toBe(true); // cut by the right edge
});

test('?world=monsoon&level=2 opens on that Earth and nothing scrolls sideways at 320 px, in English and বাংলা', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/?world=monsoon&level=2');
  await expect(page.getByRole('heading', { name: 'The rainy planet' })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  await page.evaluate(() => localStorage.setItem('sea-prefs-v1', JSON.stringify({ lang: 'bn' })));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'বৃষ্টির পৃথিবী' })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test('the preview button plays and stops, and reduced motion still shows every level', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?world=fire&level=2');
  const play = page.getByRole('button', { name: 'Play a short preview' });
  await expect(play).toBeVisible();
  await play.click();
  await expect(page.getByRole('button', { name: 'Stop preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop preview' }).click();
  await expect(play).toBeVisible();
  await page.getByRole('button', { name: 'Learn more' }).click();
  await expect(page.getByRole('heading', { name: 'The burning planet' }).last()).toBeVisible();
});

test('the split view shows real key numbers and switching there keeps the split view (sweep)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?world=pulse&level=2');
  await expect(page.getByRole('heading', { name: 'The warming planet' })).toBeVisible();
  await expect(page.locator('.lv2 .world-metrics dd').first()).toHaveText(/^\+\d/); // the latest GISTEMP anomaly
  await page.getByRole('button', { name: /Previous Earth: Monsoon/ }).click();
  await expect(page.locator('#world-carousel')).toHaveAttribute('data-level', '2');
  await expect(page.getByRole('heading', { name: 'The rainy planet' })).toBeVisible();
  const out = page.locator('.world-sphere[data-world="pulse"]');
  await expect(out).toHaveAttribute('data-pos', 'next');
  await expect.poll(async () => (await out.boundingBox())?.x ?? 0).toBeGreaterThanOrEqual(1280); // pushed out of frame on the right
});
