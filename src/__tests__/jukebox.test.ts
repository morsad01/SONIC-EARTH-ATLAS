import { describe, it, expect } from 'vitest';
import { jukeboxReducer as R, initialState, nearestTime, visibleTimes, type JukeboxState, type Action } from '../jukebox/useJukebox';
import { buildRows, bucketOf, BUCKET_LIMIT } from '../jukebox/timelineRows';
import { captionFor } from '../jukebox/caption';
import { linePaths } from '../jukebox/linePaths';
import { STRINGS, type StringKey } from '../lib/strings';

const years = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
const months = (a: number, b: number) => years(a, b).flatMap((y) => Array.from({ length: 12 }, (_, m) => `${y}-${String(m + 1).padStart(2, '0')}`));
const run = (s: JukeboxState, ...as: Action[]) => as.reduce(R, s);
const ready = (id = 'gistemp', ts = years(1880, 2025)) => run(initialState(), { type: 'setStories', ids: ['gistemp', 'co2', 'c-npl-temp', 'c-npl-rain'] }, { type: 'selectStory', id }, { type: 'seriesLoaded', storyId: id, times: ts });
const t = (k: StringKey, v?: Record<string, string | number>) => Object.entries(v ?? {}).reduce((s, [a, b]) => s.replaceAll(`{${a}}`, String(b)), STRINGS.en[k] ?? k);

describe('useJukebox reducer', () => {
  it('starts on the first available story and puts the cursor on the latest observation once loaded', () => {
    let s = R(initialState(), { type: 'setStories', ids: ['gistemp', 'co2'] });
    expect(s.storyId).toBe('gistemp');
    s = R(s, { type: 'seriesLoaded', storyId: 'gistemp', times: years(1880, 2025) });
    expect(s.cursor).toBe('2025');
    expect(s.origin).toBe('load');
  });

  it('keeps a shared story and cursor (share link) and snaps the cursor to the nearest real date', () => {
    let s = run(initialState('co2', '1950'), { type: 'setStories', ids: ['gistemp', 'co2'] });
    expect(s.storyId).toBe('co2');
    s = R(s, { type: 'seriesLoaded', storyId: 'co2', times: years(1959, 2025) });
    expect(s.cursor).toBe('1959');
  });

  it('origin-tagged updates cannot loop: re-sending the current cursor returns the same state', () => {
    const s = ready();
    const a = R(s, { type: 'setCursor', t: '1998', origin: 'user' });
    expect(a.cursor).toBe('1998');
    // A view that echoes every cursor change back (scroll sync, chart, caption) reaches a fixed point at once.
    expect(R(a, { type: 'setCursor', t: '1998', origin: 'scroll' })).toBe(a);
    expect(R(a, { type: 'setCursor', t: '1998', origin: 'playback' })).toBe(a);
    expect(R(a, { type: 'setStories', ids: ['gistemp', 'co2', 'c-npl-temp', 'c-npl-rain'] })).toBe(a);
  });

  it('ignores scroll while step-through runs, and dates that are not in the series', () => {
    let s = R(ready(), { type: 'setCursor', t: '1900', origin: 'user' });
    s = R(s, { type: 'setPlaying', playing: true });
    expect(R(s, { type: 'setCursor', t: '1950', origin: 'scroll' })).toBe(s);
    expect(R(s, { type: 'setCursor', t: '1950', origin: 'user' }).cursor).toBe('1950');
    expect(R(s, { type: 'setCursor', t: '1066', origin: 'user' })).toBe(s);
  });

  it('drops a late series answer for a story that is no longer shown', () => {
    const s = R(ready(), { type: 'selectStory', id: 'co2' });
    expect(s.times).toEqual([]);
    expect(R(s, { type: 'seriesLoaded', storyId: 'gistemp', times: ['1999'] })).toBe(s);
  });

  it('country change remaps a country story and keeps the cursor; a removed story falls back to the first', () => {
    let s = R(ready('c-npl-temp', months(1981, 2025)), { type: 'setCursor', t: '1998-07', origin: 'user' });
    s = R(s, { type: 'setStories', ids: ['c-bgd-temp', 'c-bgd-rain', 'gistemp'] });
    expect(s.storyId).toBe('c-bgd-temp');
    expect(s.cursor).toBe('1998-07');
    s = R(s, { type: 'seriesLoaded', storyId: 'c-bgd-temp', times: months(1981, 2025) });
    expect(s.cursor).toBe('1998-07');
    s = R(s, { type: 'setStories', ids: ['gistemp', 'co2'] }); // country cleared
    expect(s.storyId).toBe('gistemp');
    expect(s.cursor).toBeNull();
  });

  it('period filters only narrow, swap a reversed range, and move the cursor inside it', () => {
    let s = R(ready(), { type: 'setCursor', t: '1900', origin: 'user' });
    s = R(s, { type: 'setFilter', patch: { from: '2000', to: '1990' } });
    expect([s.filters.from, s.filters.to]).toEqual(['1990', '2000']);
    expect(visibleTimes(s)).toEqual(years(1990, 2000));
    expect(s.cursor).toBe('1990');
    s = R(s, { type: 'setFilter', patch: { topic: 'ice' } });
    expect(s.cursor).toBe('1990');
    s = R(s, { type: 'resetFilters' });
    expect(visibleTimes(s)).toHaveLength(146);
    expect(s.filters.topic).toBe('all');
    // A new series without the filtered years clears the period instead of showing nothing.
    s = run(R(ready(), { type: 'setFilter', patch: { from: '1880', to: '1900' } }), { type: 'selectStory', id: 'co2' });
    expect(s.filters.from).toBeNull();
  });

  it('step-through stops at the end and restarts from the first item', () => {
    let s = run(ready(), { type: 'setFilter', patch: { from: '2023' } }, { type: 'setCursor', t: '2024', origin: 'user' }, { type: 'setPlaying', playing: true });
    s = R(s, { type: 'step', by: 1, origin: 'playback' });
    expect(s.cursor).toBe('2025');
    s = R(s, { type: 'step', by: 1, origin: 'playback' });
    expect(s.playing).toBe(false);
    s = R(s, { type: 'setPlaying', playing: true });
    expect([s.cursor, s.playing]).toEqual(['2023', true]);
  });

  it('nearestTime matches across granularities', () => {
    expect(nearestTime(months(1981, 1982), '1981')).toBe('1981-01');
    expect(nearestTime(years(1990, 1995), '2010')).toBe('1995');
    expect(nearestTime([], '2000')).toBeNull();
    expect(nearestTime(['a', 'b'], null)).toBe('b');
  });
});

describe('timeline rows', () => {
  it('lists every point up to the limit, then buckets by year (monthly) or decade (annual) with gap counts', () => {
    const few = years(1880, 2025).map((tm) => ({ t: tm, v: 1 }));
    expect(few.length).toBeLessThanOrEqual(BUCKET_LIMIT);
    expect(buildRows(few, () => false).every((r) => r.kind === 'item')).toBe(true);
    const many = months(1981, 2025).map((tm, i) => ({ t: tm, v: i === 5 ? null : 1 }));
    const closed = buildRows(many, () => false);
    expect(closed).toHaveLength(45);
    expect(closed[0]).toMatchObject({ kind: 'bucket', bucket: '1981', count: 12, gaps: 1 });
    const open = buildRows(many, (b) => b === '1998');
    expect(open).toHaveLength(45 + 12);
    expect(bucketOf('1987')).toBe('1980s');
  });
});

describe('caption and chart', () => {
  const pts = [{ t: '1997', v: 0.5 }, { t: '1998', v: null }, { t: '1999', v: 0.62 }];
  it('says the value, the change from the last real value, and names gaps', () => {
    expect(captionFor('Global anomaly', '°C', pts, '1999', 'en', t)).toBe('1999: Global anomaly was 0.62 °C. Up 0.12 °C from 1997.');
    expect(captionFor('Global anomaly', '°C', pts, '1998', 'en', t)).toContain('no value');
    expect(captionFor('Global anomaly', '°C', pts, '1997', 'en', t)).toBe('1997: Global anomaly was 0.50 °C.');
    expect(captionFor('x', 'u', pts, null, 'en', t)).toBe('');
    expect(captionFor('x', '°C', pts, '1999', 'bn', t)).toMatch(/[০-৯]/);
  });
  it('breaks the line at gaps instead of bridging them', () => {
    expect(linePaths(pts, (i) => i, (v) => v)).toEqual(['M0.0,0.5', 'M2.0,0.6']);
    expect(linePaths([{ t: 'a', v: null }], (i) => i, (v) => v)).toEqual([]);
  });
});
