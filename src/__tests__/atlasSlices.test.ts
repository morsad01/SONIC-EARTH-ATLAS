import { describe, it, expect, vi, afterEach } from 'vitest';
import { dataFile } from './fixtures';
import { DatasetAdapter } from '../datasets/adapter';

const file = (u: string) => dataFile(u);
afterEach(() => vi.unstubAllGlobals());

/** Guards the roadmap Phase 3 rule: the Atlas slices stay identical after the adapter refactor. */
describe('DatasetAdapter.loadDatasets (live snapshots)', () => {
  it('builds the same slices from the bundled snapshots', async () => {
    vi.stubGlobal('fetch', async (u: string) => ({ ok: true, status: 200, json: async () => file(u) }));
    const r = await DatasetAdapter.loadDatasets('live');
    expect(r.mode).toBe('live');
    expect(r.isFallback).toBe(false);
    expect(r.statusMessage).toBe('Real NASA data, 2026-10-02 to 2026-10-05');
    expect(r.sstMonth).toBe('September 2026');
    expect(r.sstGlobal).toEqual({ areaWeightedMeanAnomalyC: 0.693, fractionWarmerThanNormal: 0.763, validCells: 32095 });
    expect(r.layerStatuses).toMatchSnapshot();
    expect(r.slices.map((s) => [s.timestepIndex, s.dateLabel, s.timestamp, s.observations.length])).toMatchSnapshot();
    // normalizedValue comes from Math.log/pow, whose last bits differ between CPUs and OSes: compare at 12 decimals.
    const r12 = (v: number) => Math.round(v * 1e12) / 1e12;
    expect(r.slices.map((s) => ({ ...s, observations: s.observations.map((o) => ({ ...o, normalizedValue: r12(o.normalizedValue) })) }))).toMatchSnapshot();
  });
  it('falls back to the labelled sample when nothing loads', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404, json: async () => ({}) }));
    const r = await DatasetAdapter.loadDatasets('live');
    expect(r.mode).toBe('demo');
    expect(r.isFallback).toBe(true);
  });
});
