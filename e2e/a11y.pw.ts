import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { offline, open, VIEWS } from './helpers';

const PREFS = 'sea-prefs-v1';
const setups: { label: string; width: number; prefs?: object }[] = [
  { label: 'desktop', width: 1400 },
  { label: 'phone, বাংলা, high contrast, reduced motion', width: 360, prefs: { lang: 'bn', highContrast: true, reduceMotion: true } },
];

for (const s of setups) {
  test.describe(s.label, () => {
    for (const [name, hash] of VIEWS) {
      test(`${name} has no axe violations`, async ({ page }) => {
        await offline(page);
        if (s.prefs) await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PREFS, JSON.stringify(s.prefs)]);
        await page.setViewportSize({ width: s.width, height: 800 });
        await open(page, hash);
        await expect(page.locator('h1')).toHaveCount(1);
        await page.waitForTimeout(800); // lazy views and data settle
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      });
    }
  });
}
