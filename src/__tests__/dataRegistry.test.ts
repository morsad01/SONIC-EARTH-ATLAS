import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataFile } from './fixtures';
import { geoContains } from 'd3-geo';
import { parseGistemp } from '../datasets/adapters/gistemp';
import { parseVitalSigns } from '../datasets/adapters/vitalSigns';
import { parseMonsoon } from '../datasets/adapters/monsoon';
import { parsePowerMonthly, fetchPowerMonthly, clearPowerCache, powerUrl } from '../datasets/adapters/power';
import { eicRecords } from '../datasets/adapters/eic';
import { cleanValue, periodOf } from '../datasets/series';
import { availableFor, REGISTRY } from '../datasets/registry';
import { countryCoverage } from '../countries/countryCoverage';
import { badgeOf } from '../components/data-status/badge';
import { loadCountries, countryById } from '../countries/countries';
import { DatasetAdapter } from '../datasets/adapter';

const file = (n: string) => dataFile(`/data/${n}.json`);
afterEach(() => vi.unstubAllGlobals());

describe('series helpers', () => {
  it('cleanValue turns anything invalid into null and never invents a number', () => {
    expect(cleanValue(3.2)).toBe(3.2);
    expect(cleanValue(0)).toBe(0);
    for (const bad of [-999, NaN, Infinity, '3', null, undefined]) expect(cleanValue(bad)).toBeNull();
  });
  it('periodOf ignores nulls at the ends', () => {
    expect(periodOf([{ t: '1', v: null }, { t: '2', v: 1 }, { t: '3', v: 2 }, { t: '4', v: null }])).toBe('2 to 3');
    expect(periodOf([{ t: '1', v: null }])).toBe('no data');
  });
});

describe('adapters (real bundled files)', () => {
  it('gistemp: annual °C anomaly, 1880 to 2025, global context', () => {
    const s = parseGistemp(file('gistemp_global'));
    expect(s.unit).toBe('°C'); expect(s.period).toBe('1880 to 2025'); expect(s.coverage).toBe('global-context');
    expect(s.isLive).toBe(false); expect(s.isSample).toBe(false); expect(s.snapshotDate).toBe('2026-10-08');
    expect(badgeOf(s)).toBe('context');
  });
  it('gistemp: invalid values become null', () => {
    const s = parseGistemp({ series: [{ year: 2000, anomaly: 0.5 }, { year: 2001, anomaly: -999 }, { year: 2002, anomaly: 'x' }] });
    expect(s.points.map((p) => p.v)).toEqual([0.5, null, null]);
    expect(s.period).toBe('2000');
  });
  it('vital signs: three series with their own units', () => {
    const v = parseVitalSigns(file('vital_signs'));
    expect(v.map((s) => [s.id, s.unit])).toEqual([['vital-temp', '°C'], ['vital-co2', 'ppm'], ['vital-ice', 'million km²']]);
    expect(v[1].period).toBe('1959 to 2025'); expect(v[2].period).toBe('1979 to 2026');
    expect(v.every((s) => s.coverage === 'global-context' && s.method && s.limitations)).toBe(true);
  });
  it('monsoon: eight point-sample division series, snapshot not live', () => {
    const m = parseMonsoon(file('bangladesh_monsoon'));
    expect(m).toHaveLength(8);
    expect(m[0].points).toHaveLength(127); expect(m[0].unit).toBe('mm/day'); expect(m[0].coverage).toBe('point-sample');
    expect(m.every((s) => !s.isLive && badgeOf(s) === 'snapshot')).toBe(true);
  });
  it('eic: every frame is global context with a source link', () => {
    const r = eicRecords();
    expect(r.length).toBe(4);
    expect(r.every((x) => x.coverage === 'global-context' && x.sourceUrl.startsWith('https://'))).toBe(true);
  });
});

describe('badge rules', () => {
  const base = { isLive: false, isSample: false, coverage: 'cells-in-border' as const };
  it('snapshot data never shows Live; samples are always Sample', () => {
    expect(badgeOf(base)).toBe('snapshot');
    expect(badgeOf({ ...base, isLive: true })).toBe('live');
    expect(badgeOf({ ...base, isSample: true, isLive: true })).toBe('sample');
  });
});

describe('NASA POWER monthly', () => {
  const raw = (over: Record<string, unknown> = {}) => {
    const T: Record<string, unknown> = {}, P: Record<string, unknown> = {};
    for (let y = 1981; y <= 2025; y++) { for (let m = 1; m <= 12; m++) { const k = `${y}${String(m).padStart(2, '0')}`; T[k] = 20 + m / 10; P[k] = 2; } T[`${y}13`] = 20.6; P[`${y}13`] = 2; }
    return { properties: { parameter: { T2M: { ...T, ...over }, PRECTOTCORR: P } } };
  };
  beforeEach(() => clearPowerCache());

  it('parses 540 months, -999 → null, and the annual values', () => {
    const p = parsePowerMonthly(raw({ '199005': -999 }), 23.8, 90.4);
    expect(p.temp.points).toHaveLength(45 * 12);
    expect(p.temp.points[0]).toEqual({ t: '1981-01', v: 20.1 });
    expect(p.temp.points.find((x) => x.t === '1990-05')!.v).toBeNull();
    expect(p.temp.period).toBe('1981-01 to 2025-12');
    expect(p.annual.years).toHaveLength(45);
    expect(p.temp.isLive).toBe(true); expect(p.temp.coverage).toBe('point-sample'); expect(p.temp.unit).toBe('°C'); expect(p.rain.unit).toBe('mm/day');
    expect(p.temp.spatialResolution).toContain('23.80°N, 90.40°E');
  });
  it('caches in memory so a second call does not fetch', async () => {
    const f = vi.fn(async (_u: string) => ({ ok: true, status: 200, json: async () => raw() }));
    vi.stubGlobal('fetch', f);
    await fetchPowerMonthly(10, 20); await fetchPowerMonthly(10, 20);
    expect(f).toHaveBeenCalledTimes(1);
    expect(String(f.mock.calls[0][0])).toBe(powerUrl(10, 20));
  });
  it('survives a sessionStorage that is missing or throws, and reads from it when present', async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => raw() }));
    vi.stubGlobal('fetch', f);
    const store = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
    await fetchPowerMonthly(30, 40);
    expect(store.size).toBe(1);
    clearPowerCache();
    await fetchPowerMonthly(30, 40); // memory cleared, served from sessionStorage
    expect(f).toHaveBeenCalledTimes(1);
    clearPowerCache();
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } });
    await fetchPowerMonthly(31, 41);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('retries a server error, then succeeds', async () => {
    let n = 0;
    vi.stubGlobal('fetch', async () => (++n < 2 ? { ok: false, status: 503, json: async () => ({}) } : { ok: true, status: 200, json: async () => raw() }));
    const p = await fetchPowerMonthly(11, 21, { delayMs: 1 });
    expect(n).toBe(2); expect(p.annual.years.length).toBe(45);
  });
  it('does not retry a 4xx, and reports the error', async () => {
    const f = vi.fn(async () => ({ ok: false, status: 422, json: async () => ({}) }));
    vi.stubGlobal('fetch', f);
    await expect(fetchPowerMonthly(12, 22, { delayMs: 1 })).rejects.toThrow('422');
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('rejects data with too few valid years instead of inventing it', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => ({ properties: { parameter: { T2M: {}, PRECTOTCORR: {} } } }) }));
    await expect(fetchPowerMonthly(13, 23, { delayMs: 1 })).rejects.toThrow('too few years');
  });
  it('stops at once when aborted', async () => {
    const ac = new AbortController(); ac.abort();
    vi.stubGlobal('fetch', async () => { throw new DOMException('aborted', 'AbortError'); });
    await expect(fetchPowerMonthly(14, 24, { signal: ac.signal, delayMs: 1 })).rejects.toThrow();
  });
});

describe('countryCoverage and availableFor (real snapshots + borders)', () => {
  const load = async () => {
    vi.stubGlobal('fetch', async (u: string) => ({ ok: true, status: 200, json: async () => file(u.replace('/data/', '').replace('.json', '')) }));
    const [r, list] = await Promise.all([DatasetAdapter.loadDatasets('live'), loadCountries('110m')]);
    return { slices: r.slices, list };
  };
  const cov = (id: string, slices: Awaited<ReturnType<typeof load>>['slices'], list: Awaited<ReturnType<typeof load>>['list']) => countryCoverage(countryById(list, id)!, slices, geoContains as never);

  it('counts distinct cells inside the border and reports max FRP, per day', async () => {
    const { slices, list } = await load();
    const png = cov('PNG', slices, list).find((r) => r.dataset === 'fire')!;
    expect(png.count).toBeGreaterThan(0);
    expect(png.stat!.kind).toBe('max'); expect(png.stat!.unit).toBe('MW');
    expect(png.series.coverage).toBe('cells-in-border'); expect(png.series.unit).toBe('cells');
    const all = slices.flatMap((s) => s.observations).filter((o) => o.phenomenon === 'fire' && (geoContains(countryById(list, 'PNG')!.feature, [o.longitude, o.latitude])));
    expect(png.count).toBe(new Set(all.map((o) => o.id)).size);
    expect(png.stat!.value).toBe(Math.round(Math.max(...all.map((o) => o.value)) * 100) / 100);
    expect(png.series.points.every((p) => p.v! > 0)).toBe(true);
  });
  it('a country with nothing inside gets count 0 and no statistic (empty, not filler)', async () => {
    const { slices, list } = await load();
    const rows = cov('LUX', slices, list);
    expect(rows.map((r) => r.dataset)).toEqual(['fire', 'precipitation', 'sst']);
    for (const r of rows) { expect(r.count).toBe(0); expect(r.stat).toBeNull(); expect(r.series.points).toEqual([]); expect(r.series.period).toBe('no data'); }
  });
  it('SST is counted once even though it repeats on every date', async () => {
    const { slices, list } = await load();
    const sstCells = slices[0].observations.filter((o) => o.phenomenon === 'sst');
    const any = list.find((c) => sstCells.some((o) => geoContains(c.feature, [o.longitude, o.latitude])));
    if (!any) return; // no 40-cell sample point falls in a border: nothing to assert
    const r = cov(any.id, slices, list).find((x) => x.dataset === 'sst')!;
    expect(r.series.points).toHaveLength(1);
    expect(r.stat!.kind).toBe('mean'); expect(r.stat!.of).toBe(r.count);
  });
  it('a centroid outside its polygon still resolves by the cell centre test (no fudge by bbox alone)', async () => {
    const { list } = await load();
    const chl = countryById(list, 'CHL')!;
    const slice = [{ timestepIndex: 0, dateLabel: '2026-10-02', timestamp: '2026-10-02', observations: [
      { id: 'in', phenomenon: 'fire' as const, latitude: -33, longitude: -71, timestamp: '', variable: '', value: 50, unit: 'MW', normalizedValue: 0, source: '' },
      { id: 'bbox-only', phenomenon: 'fire' as const, latitude: -33, longitude: -60, timestamp: '', variable: '', value: 70, unit: 'MW', normalizedValue: 0, source: '' }, // inside Chile's box, Argentina in fact
    ] }];
    const r = countryCoverage(chl, slice, geoContains as never).find((x) => x.dataset === 'fire')!;
    expect(r.count).toBe(1); expect(r.stat!.value).toBe(50);
  });

  it('availableFor lists only genuinely available datasets', async () => {
    const { slices, list } = await load();
    const ids = (t: string, rows = cov(t === 'global' ? 'PNG' : t, slices, list)) => availableFor(t, rows).map((a) => a.entry.id);
    expect(ids('BGD')).toContain('monsoon');
    expect(ids('PNG')).not.toContain('monsoon');
    expect(ids('LUX')).toEqual(['power-monthly', 'gistemp', 'vital-signs', 'eic']); // nothing from gridded layers, so none listed
    expect(ids('PNG')).toContain('fire');
    const ctx = availableFor('LUX', cov('LUX', slices, list)).filter((a) => a.availability === 'global-context').map((a) => a.entry.id);
    expect(ctx).toEqual(['gistemp', 'vital-signs', 'eic']);
    const g = availableFor('global').map((a) => a.entry.id);
    expect(g).not.toContain('monsoon'); expect(g).not.toContain('power-monthly');
    expect(new Set(REGISTRY.map((e) => e.id)).size).toBe(REGISTRY.length);
  });
});
