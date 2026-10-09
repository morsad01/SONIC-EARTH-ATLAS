import { test, expect } from '@playwright/test';
import { offline, open, VIEWS, noHorizontalScroll } from './helpers';

test.describe('every view', () => {
  for (const [name, hash] of VIEWS) {
    test(`${name} loads with one h1, no page errors and no horizontal scroll at 320 px`, async ({ page }) => {
      const errors = await offline(page);
      await page.setViewportSize({ width: 320, height: 720 });
      await open(page, hash);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await noHorizontalScroll(page)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
});

test('navigation reaches every section from the header', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  const nav = page.getByRole('banner');
  await nav.getByRole('button', { name: 'Data Jukebox' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Data Jukebox' })).toBeVisible();
  await nav.getByRole('button', { name: 'About the Science' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await nav.getByRole('button', { name: 'Explore Earth' }).click();
  await expect(page).toHaveURL(/track=atlas/);
  expect(errors).toEqual([]);
});

test('a country can be chosen by search with the keyboard and survives the share link', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  const box = page.getByRole('combobox').first();
  await box.click();
  await box.fill('Nepal');
  await expect(page.getByRole('option', { name: /Nepal/ }).first()).toBeVisible();
  await box.press('Enter');
  await expect(page).toHaveURL(/c=NPL/);
  await page.reload();
  await expect(page.getByText('Nepal').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Jukebox: a timeline pick updates chart, caption and hash; Play changes the state to playing', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=jukebox&story=co2&t=1990');
  await expect(page.locator('[data-caption]')).toContainText('1990');
  await page.getByRole('button', { name: /^2000:/ }).click();
  await expect(page.locator('[data-cursor]')).toHaveAttribute('data-cursor', '2000');
  await expect(page.locator('[data-caption]')).toContainText('2000');
  await expect(page).toHaveURL(/t=2000/);
  await expect(page.locator('[data-player-state]')).toHaveAttribute('data-player-state', 'ready');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('[data-player-state]')).toHaveAttribute('data-player-state', 'playing');
  await expect(page.locator('[data-cursor]')).not.toHaveAttribute('data-cursor', '2000');
  await expect(page.getByRole('banner').getByRole('button', { name: /Pause Carbon dioxide/ })).toBeVisible(); // header chip names the story
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('[data-player-state]')).toHaveAttribute('data-player-state', 'paused');
  expect(errors).toEqual([]);
});

test('an old share link (frame + column) still opens the frame player', async ({ page }) => {
  const errors = await offline(page);
  await open(page, 'track=frames&frame=eic-ocean-heat&col=40');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/frame=eic-ocean-heat/);
  expect(errors).toEqual([]);
});
