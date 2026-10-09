import { describe, it, expect } from 'vitest';
import { fmtNum } from '../lib/strings';
// Loaded dynamically so the app's own type-check does not need Node types.
const fs = await import(/* @vite-ignore */ 'node:fs' as string);
const path = await import(/* @vite-ignore */ 'node:path' as string);
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => (e.isDirectory() ? (e.name === '__tests__' ? [] : walk(path.join(dir, e.name))) : [path.join(dir, e.name)]));
const tsx: [string, string][] = walk('src').filter((f) => f.endsWith('.tsx')).map((f) => [f, fs.readFileSync(f, 'utf8')]);

describe('type system (Phase 8D)', () => {
  it('has no text-[10px] or text-[11px]: the floor is the --fs-2xs token (12 px, 13 px in বাংলা)', () => {
    expect(tsx.filter(([, s]) => /text-\[1[01]px\]/.test(s)).map(([f]) => f)).toEqual([]);
  });
  it('uses font-bold only with the display font (Bricolage 700 is loaded; Plex 700 would be synthetic)', () => {
    const bad: string[] = [];
    for (const [f, s] of tsx) for (const m of s.matchAll(/className=(?:"[^"]*"|\{`[^`]*`\})/g)) if (/\bfont-bold\b/.test(m[0]) && !m[0].includes('font-display')) bad.push(`${f}: ${m[0].slice(0, 80)}`);
    expect(bad).toEqual([]);
  });
  it('self-hosts its fonts: no third-party font request, every @font-face file exists, synthesis is off', () => {
    const html: string = fs.readFileSync('index.html', 'utf8'), fonts: string = fs.readFileSync('src/fonts.css', 'utf8'), css: string = fs.readFileSync('src/index.css', 'utf8');
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    const urls = [...fonts.matchAll(/url\('(\/fonts\/[^']+)'\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThanOrEqual(5);
    for (const u of urls) expect(fs.existsSync(path.join('public', u)), u).toBe(true);
    expect(css).toContain('font-synthesis: none');
    expect(css).toMatch(/html\[lang='bn'\][^}]*--fs-2xs: \.8125rem/);
    expect(css).toMatch(/html\[lang='bn'\] \.font-display \{ letter-spacing: 0/);
  });
  it('keeps the self-hosted font payload small', () => {
    const size = fs.readdirSync('public/fonts').reduce((n: number, f: string) => n + fs.statSync(path.join('public/fonts', f)).size, 0);
    expect(size).toBeLessThan(350_000);
  });
});

describe('fmtNum', () => {
  it('never mixes numeral systems in a language', () => {
    expect(fmtNum(2025, 'bn', { useGrouping: false })).toBe('২০২৫');
    expect(fmtNum(2025, 'en', { useGrouping: false })).toBe('2025');
    expect(fmtNum(1234.5, 'en', { maximumFractionDigits: 1 })).toBe('1,234.5');
    expect(fmtNum(0.5, 'bn', { minimumFractionDigits: 2 })).toMatch(/^[০-৯.,٫]+$/);
  });
});
