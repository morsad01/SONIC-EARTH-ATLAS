import { test, expect } from '@playwright/test';
import { offline, open, VIEWS } from './helpers';

for (const width of [1400, 390]) {
  test.describe(`dialogs at ${width} px`, () => {
    for (const [name, hash] of VIEWS) {
      test(`Settings and Data open and are visible on ${name}`, async ({ page }) => {
        const errors = await offline(page);
        await page.setViewportSize({ width, height: 860 });
        await open(page, hash);
        const gear = page.getByRole('button', { name: 'Settings' });
        await gear.click();
        const dlg = page.getByRole('dialog', { name: 'Settings' });
        await expect(dlg).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dlg).toHaveCount(0);
        await expect(gear).toBeFocused();
        const data = page.getByRole('banner').getByRole('button', { name: 'Data & method', exact: true });
        await data.click();
        await expect(page.getByRole('dialog', { name: 'Data and method' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        expect(errors).toEqual([]);
      });
    }
  });
}

test('Tab stays inside Settings and the app behind it is inert', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 860 });
  await open(page, 'track=about'); // no WebGL globe, so the software renderer doesn't starve the page
  await page.getByRole('button', { name: 'Settings' }).click();
  const dlg = page.getByRole('dialog', { name: 'Settings' });
  await expect(dlg).toBeVisible();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await dlg.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await expect(page.locator('#root')).toHaveAttribute('inert', '');
});

test('shortcuts do nothing while Settings is open', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 860 });
  await open(page, 'track=atlas');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.keyboard.press('m');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Globe', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('? opens Settings on the landing page and Settings does not reopen after Explore', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 1400, height: 860 });
  await open(page, '');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('banner').getByRole('button', { name: 'Explore Earth' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the mobile menu closes when Settings opens', async ({ page }) => {
  await offline(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page, 'track=atlas');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('#site-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.locator('#site-menu')).toHaveCount(0);
});
