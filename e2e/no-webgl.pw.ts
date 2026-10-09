import { test, expect } from '@playwright/test';
import { offline, open, noHorizontalScroll } from './helpers';

// Its own file: launch options force a separate browser.
test.use({ launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] } });

test('WebGL off: the Atlas falls back to the 2D map with the country picker', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await open(page, 'track=atlas');
  await expect(page.getByRole('combobox').first()).toBeVisible();
  await expect(page.locator('main canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('WebGL off: the landing carousel needs no WebGL and reads at 320 px', async ({ page }) => {
  const errors = await offline(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await open(page, '');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'The burning planet' })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  expect(errors).toEqual([]);
});
