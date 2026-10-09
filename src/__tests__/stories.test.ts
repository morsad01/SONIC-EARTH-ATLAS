import { describe, it, expect, vi, afterEach } from 'vitest';
import { dataFile } from './fixtures';
import { REGISTRY } from '../datasets/registry';
import { EIC_FRAMES } from '../lib/eicFrames';
import { encodeShare, decodeShare } from '../lib/shareLink';
import { GLOBAL_STORIES, BGD_STORIES, countryStories, storiesFor, remapStoryId, matchesFilters, TOPICS, SOURCES } from '../stories/stories';
import { loadStorySeries, fireWeekSeries, sstMonthSeries, clearStoryCache } from '../stories/loadStory';
import { clearPowerCache } from '../datasets/adapters/power';
import { validCount } from '../datasets/series';
import type { CoverageRow } from '../countries/countryCoverage';

afterEach(() => { vi.unstubAllGlobals(); clearStoryCache(); clearPowerCache(); });
const stubFiles = () => vi.stubGlobal('fetch', async (u: string) => ({ ok: true, status: 200, json: async () => dataFile(u) }));
const ALL = [...GLOBAL_STORIES, ...BGD_STORIES, ...countryStories('NPL', 'Nepal', 'নেপাল', { fireInside: true })];

describe('story registry integrity', () => {
  it('names only registry datasets, uses unique share-safe ids and known topics and sources', () => {
    const ids = new Set(REGISTRY.map((e) => e.id)), topics = new Set(TOPICS), sources = new Set(SOURCES.map((s) => s.key));
    expect(new Set(ALL.map((s) => s.id)).size).toBe(ALL.length);
    for (const s of ALL) {
      expect(s.datasetIds.length, s.id).toBeGreaterThan(0);
      for (const d of s.datasetIds) expect(ids.has(d), `${s.id} → ${d}`).toBe(true);
      expect(topics.has(s.topic)).toBe(true);
      expect(sources.has(s.source)).toBe(true);
      expect(decodeShare('#' + encodeShare({ track: 'jukebox', story: s.id }), { frames: [], pairs: [] })?.story, s.id).toBe(s.id);
      expect(s.title.length && s.titleBn.length && s.blurb.length && s.blurbBn.length).toBeTruthy();
      expect(s.isSample).toBe(false); // nothing in the Jukebox is a sample today
    }
  });

  it('covers every EIC frame and the 8 Bangladesh divisions of the monsoon file', () => {
    expect(GLOBAL_STORIES.filter((s) => s.kind === 'eic').map((s) => s.frameId).sort()).toEqual(EIC_FRAMES.map((f) => f.id).sort());
    const cities = (dataFile('/data/bangladesh_monsoon.json').cities as { name: string }[]).map((c) => c.name).sort();
    expect(BGD_STORIES.map((s) => s.division).sort()).toEqual(cities);
  });

  it('resolves every global and Bangladesh story to a real, non-sample series from the bundled files', async () => {
    stubFiles();
    for (const s of [...GLOBAL_STORIES, ...BGD_STORIES]) {
      const x = await loadStorySeries(s);
      if (s.kind === 'eic') { expect(x).toBeNull(); continue; }
      expect(x, s.id).not.toBeNull();
      expect(validCount(x!), s.id).toBeGreaterThan(0);
      expect(x!.isSample).toBe(false);
      expect(x!.isLive).toBe(false); // bundled snapshots are never "live"
      expect(x!.source && x!.unit && x!.method && x!.limitations).toBeTruthy();
    }
  });

  it('builds the fire-week and SST series straight from the files', () => {
    const firms = dataFile('/data/firms_snapshot.json'), fw = fireWeekSeries(firms);
    expect(fw.points.map((p) => p.t)).toEqual(firms.slices.map((s: { dateLabel: string }) => s.dateLabel).sort());
    const day0 = Math.max(...firms.slices[0].observations.map((o: { value: number }) => o.value));
    expect(fw.points[0].v).toBe(day0);
    const sst = sstMonthSeries(dataFile('/data/sst_snapshot.json'));
    expect(sst.points).toEqual([{ t: '2026-09', v: 0.693 }]);
    expect(sstMonthSeries({ slices: [], monthLabel: '', globalStats: { areaWeightedMeanAnomalyC: Number.NaN, fractionWarmerThanNormal: 0 } }).points).toEqual([]);
  });

  it('country stories: POWER at the point, fire only with a cell inside, errors instead of stand-ins', async () => {
    expect(countryStories('ISL', 'Iceland', 'আইসল্যান্ড', { fireInside: false }).map((s) => s.kind)).toEqual(['country-temp', 'country-rain']);
    const [temp, , fire] = countryStories('NPL', 'Nepal', 'নেপাল', { fireInside: true });
    await expect(loadStorySeries(temp, { point: null })).rejects.toThrow();
    await expect(loadStorySeries(fire, { coverage: [] })).rejects.toThrow();
    const series = { id: 'x', points: [{ t: '2026-10-02', v: 2 }] } as unknown as CoverageRow['series'];
    expect(await loadStorySeries(fire, { coverage: [{ dataset: 'fire', count: 2, stat: null, series }] })).toBe(series);
    const T: Record<string, number> = {}, P: Record<string, number> = {};
    for (let y = 1981; y <= 2025; y++) { for (let m = 1; m <= 13; m++) { T[`${y}${String(m).padStart(2, '0')}`] = 10 + m; P[`${y}${String(m).padStart(2, '0')}`] = 2; } }
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => ({ properties: { parameter: { T2M: T, PRECTOTCORR: P } } }) }));
    const x = await loadStorySeries(temp, { point: { lat: 28, lon: 84 } });
    expect(x!.points).toHaveLength(45 * 12);
    expect(x!.points[0]).toEqual({ t: '1981-01', v: 11 });
    expect(x!.coverage).toBe('point-sample');
  });

  it('orders and remaps stories for a country change', () => {
    expect(storiesFor(null)[0].id).toBe('gistemp');
    const bgd = storiesFor({ id: 'BGD', name: 'Bangladesh', nameBn: 'বাংলাদেশ', fireInside: false }).map((s) => s.id);
    expect(bgd.slice(0, 3)).toEqual(['c-bgd-temp', 'c-bgd-rain', 'bgd-dhaka']);
    const npl = storiesFor({ id: 'NPL', name: 'Nepal', nameBn: 'নেপাল', fireInside: false }).map((s) => s.id);
    expect(remapStoryId('c-bgd-rain', npl)).toBe('c-npl-rain');
    expect(remapStoryId('c-bgd-fire', npl)).toBeNull(); // Nepal has no fire cell: no fire story to map to
    expect(remapStoryId('gistemp', npl)).toBeNull();
    const f = { topic: 'rain', source: 'all', region: 'bangladesh' } as const;
    expect(storiesFor(null).filter((s) => matchesFilters(s, f))).toHaveLength(8);
  });
});
