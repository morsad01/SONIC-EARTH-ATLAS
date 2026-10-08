import { describe, it, expect } from 'vitest';
// Loaded dynamically so the app's own type-check does not need Node types.
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const css: string = fs.readFileSync('src/index.css', 'utf8');
const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`missing token --${name}`);
  return m[1];
};
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe('colour contrast (WCAG AA, 4.5:1 for text)', () => {
  const backgrounds = ['abyss', 'panel', 'panel-2'];
  for (const fg of ['ink', 'ink-2', 'ink-3', 'brass']) {
    for (const bg of backgrounds) {
      it(`--${fg} on --${bg}`, () => expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
    }
  }
  it('button text on the brass button', () => expect(ratio(token('brass-ink'), token('brass'))).toBeGreaterThanOrEqual(4.5));
});
