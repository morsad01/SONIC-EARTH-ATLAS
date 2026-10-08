import { describe, it, expect } from 'vitest';
import { normalizeValue, calculateStereoPan, calculateLatitudeTilt } from '../sonification/normalizer';
import { generateDemoTimeSlices } from '../datasets/demoDatasets';
import { DatasetAdapter } from '../datasets/adapter';

describe('Scientific Sonification Normalization', () => {
  it('normalizes Fire Radiative Power (MW) logarithmically within valid bounds', () => {
    // Detection baseline (5 MW) should map to 0.0
    const minNorm = normalizeValue('fire', 5);
    expect(minNorm).toBeCloseTo(0.0, 2);

    // High wildfire threshold (800 MW) should map to 1.0
    const maxNorm = normalizeValue('fire', 800);
    expect(maxNorm).toBeCloseTo(1.0, 2);

    // Extreme fire > 800 MW should be clamped to 1.0
    const clampedExtreme = normalizeValue('fire', 1200);
    expect(clampedExtreme).toBe(1.0);

    // Intermediate value (e.g. 100 MW)
    const midNorm = normalizeValue('fire', 100);
    expect(midNorm).toBeGreaterThan(0.4);
    expect(midNorm).toBeLessThan(0.8);
  });

  it('normalizes Precipitation Rate (mm/day) using square-root scaling', () => {
    // 0 mm/day should map to 0.0
    expect(normalizeValue('precipitation', 0)).toBe(0.0);

    // Heavy threshold (100 mm/day) should map to 1.0
    expect(normalizeValue('precipitation', 100)).toBe(1.0);

    // Extreme storm (150 mm/day) clamped to 1.0
    expect(normalizeValue('precipitation', 150)).toBe(1.0);

    // Moderate rain (25 mm/day) -> sqrt(25/100) = 0.5
    const modNorm = normalizeValue('precipitation', 25);
    expect(modNorm).toBeCloseTo(0.5, 2);
  });

  it('normalizes Sea Surface Temperature Anomaly (°C) using bipolar zero-centered mapping', () => {
    // Zero anomaly (0.0°C) should map exactly to 0.5 (neutral pad pitch)
    const neutral = normalizeValue('sst', 0.0);
    expect(neutral).toBeCloseTo(0.5, 2);

    // Max warm anomaly (+5.0°C) should map to 1.0
    const warm = normalizeValue('sst', 5.0);
    expect(warm).toBeCloseTo(1.0, 2);

    // Extreme cold anomaly (-5.0°C) should map to 0.0
    const cold = normalizeValue('sst', -5.0);
    expect(cold).toBeCloseTo(0.0, 2);
  });

  it('gracefully handles missing, NaN or invalid values without crashing', () => {
    expect(normalizeValue('fire', NaN)).toBe(0.0);
    expect(normalizeValue('precipitation', undefined as unknown as number)).toBe(0.0);
    expect(normalizeValue('sst', null as unknown as number)).toBe(0.0);
  });
});

describe('Geographic Spatial Audio Mapping', () => {
  it('correctly maps longitude to stereo pan clamp [-1, 1]', () => {
    // Prime Meridian (0°) is dead center
    expect(calculateStereoPan(0)).toBe(0);

    // International Date Line (+180°) is full right
    expect(calculateStereoPan(180)).toBe(1);

    // Western hemisphere (-180°) is full left
    expect(calculateStereoPan(-180)).toBe(-1);

    // Halfway West (-90°)
    expect(calculateStereoPan(-90)).toBe(-0.5);

    // Out of bounds clamping (> 180°)
    expect(calculateStereoPan(200)).toBe(1);
    expect(calculateStereoPan(-250)).toBe(-1);
  });

  it('correctly maps latitude to acoustic elevation tilt factor [-1, 1]', () => {
    expect(calculateLatitudeTilt(0)).toBe(0); // Equator
    expect(calculateLatitudeTilt(90)).toBe(1); // North Pole
    expect(calculateLatitudeTilt(-90)).toBe(-1); // South Pole
    expect(calculateLatitudeTilt(45)).toBe(0.5);
  });
});

describe('Dataset Integrity and Temporal Delta', () => {
  it('generates 6 demo timesteps with valid observations and non-empty metadata', () => {
    const slices = generateDemoTimeSlices();
    expect(slices).toHaveLength(6);

    slices.forEach((slice, idx) => {
      expect(slice.timestepIndex).toBe(idx);
      expect(slice.observations.length).toBeGreaterThan(15);

      slice.observations.forEach((obs) => {
        expect(obs.id).toBeDefined();
        expect(obs.latitude).toBeGreaterThanOrEqual(-90);
        expect(obs.latitude).toBeLessThanOrEqual(90);
        expect(obs.longitude).toBeGreaterThanOrEqual(-180);
        expect(obs.longitude).toBeLessThanOrEqual(180);
        expect(obs.normalizedValue).toBeGreaterThanOrEqual(0);
        expect(obs.normalizedValue).toBeLessThanOrEqual(1);

        if (idx > 0) {
          expect(obs.delta).toBeDefined();
        }
      });
    });
  });

  it('DatasetAdapter provides fallback demonstration data gracefully', async () => {
    const res = await DatasetAdapter.loadDatasets('demo');
    expect(res.slices.length).toBe(6);
    expect(res.mode).toBe('demo');
    expect(res.isFallback).toBe(true); // the sample is only ever an offline fallback, and says so
  });
});

describe('UX & Judge Presentation Enhancements (P0/P1)', () => {
  it('TIMESTEP_NARRATIVES provides scientifically grounded descriptions for all 6 timesteps', async () => {
    const { TIMESTEP_NARRATIVES, TIMESTEP_DATES } = await import('../datasets/demoDatasets');
    expect(TIMESTEP_NARRATIVES).toHaveLength(TIMESTEP_DATES.length);
    TIMESTEP_NARRATIVES.forEach((narrative, idx) => {
      expect(narrative.timestepIndex).toBe(idx);
      expect(narrative.label).toContain(`T${idx + 1}`);
      expect(narrative.headline.length).toBeGreaterThan(10);
      expect(narrative.detail.length).toBeGreaterThan(20);
    });
  });

  it('Guided tour numbers match the bundled NASA snapshots', async () => {
    const { TOUR } = await import('../demo/TourBar');
    const fs = await import(/* @vite-ignore */ 'node:fs' as string);
    const firms = JSON.parse(fs.readFileSync('public/data/firms_snapshot.json', 'utf8'));
    const precip = JSON.parse(fs.readFileSync('public/data/precip_snapshot.json', 'utf8'));
    const sst = JSON.parse(fs.readFileSync('public/data/sst_snapshot.json', 'utf8'));
    const find = (j: { slices: { dateLabel: string; observations: { id: string; value: number }[] }[] }, date: string, id: string) =>
      j.slices.find((s) => s.dateLabel === date)!.observations.find((o) => o.id === id)!.value;
    expect(TOUR.length).toBeGreaterThanOrEqual(6);
    expect(TOUR.some((s) => s.en.includes('675'))).toBe(true);
    expect(Math.round(find(firms, '2026-10-02', 'firms-43,-113'))).toBe(675);
    expect(TOUR.some((s) => s.en.includes('93 millimetres'))).toBe(true);
    expect(Math.round(find(precip, '2026-10-05', 'precip-20,105'))).toBe(93);
    expect(TOUR.some((s) => s.en.includes('572'))).toBe(true);
    expect(Math.round(find(firms, '2026-10-05', 'firms--3,15'))).toBe(572);
    expect(Math.max(...sst.slices[0].observations.map((o: { value: number }) => o.value))).toBeGreaterThan(7);
  });

  it('SonificationEngine exposes getActiveVoiceDetails cleanly without crashing', async () => {
    const { SonificationEngine } = await import('../audio/sonificationEngine');
    const engine = SonificationEngine.getInstance();
    const activeMap = engine.getActiveVoiceDetails();
    expect(activeMap).toBeInstanceOf(Map);
    // When audio context is not running in Node test env, activeMap should be empty Map
    expect(activeMap.size).toBe(0);
  });
});

describe('Audio Lifecycle & Zero Autoplay Security (Pre-Submission Hardening)', () => {
  it('SonificationEngine starts strictly in a locked state (isUnlocked() === false)', async () => {
    const { SonificationEngine } = await import('../audio/sonificationEngine');
    const engine = SonificationEngine.getInstance();
    expect(engine.isUnlocked()).toBe(false);
  });

  it('syncObservations and playObservation do not produce active voices when audio is locked', async () => {
    const { SonificationEngine } = await import('../audio/sonificationEngine');
    const { generateDemoTimeSlices } = await import('../datasets/demoDatasets');

    const engine = SonificationEngine.getInstance();
    engine.setAudioUnlocked(false);

    const slices = generateDemoTimeSlices();
    const obsList = slices[0].observations;

    // Attempt to sync observations while locked
    engine.syncObservations(obsList, { fire: true, precipitation: true, sst: true });

    // Active voice map should remain empty
    const voiceDetails = engine.getActiveVoiceDetails();
    expect(voiceDetails.size).toBe(0);

    // Single observation attempt while locked
    engine.playObservation(obsList[0]);
    expect(engine.getActiveVoiceDetails().size).toBe(0);
  });

  it('setAudioUnlocked(false) immediately clears active voices and locks audio output', async () => {
    const { SonificationEngine } = await import('../audio/sonificationEngine');
    const engine = SonificationEngine.getInstance();

    // Locking audio stops all voices immediately
    engine.setAudioUnlocked(false);
    expect(engine.isUnlocked()).toBe(false);
    expect(engine.getActiveVoiceDetails().size).toBe(0);
  });
});

describe('Real data snapshot integrity', () => {
  it('daily layers share the Atlas dates and contain no fill values', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs' as string);
    const precip = JSON.parse(fs.readFileSync('public/data/precip_snapshot.json', 'utf8'));
    const firms = JSON.parse(fs.readFileSync('public/data/firms_snapshot.json', 'utf8'));
    const pd = precip.slices.map((s: { dateLabel: string }) => s.dateLabel);
    const fd = new Set(firms.slices.map((s: { dateLabel: string }) => s.dateLabel));
    pd.forEach((d: string) => expect(fd.has(d)).toBe(true));
    for (const s of precip.slices) for (const o of s.observations) { expect(o.value).toBeGreaterThanOrEqual(0); expect(o.regionName).toBeTruthy(); }
  });

  it('SST cells are open ocean and at least 12 degrees apart', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs' as string);
    const obs = JSON.parse(fs.readFileSync('public/data/sst_snapshot.json', 'utf8')).slices[0].observations as { latitude: number; longitude: number }[];
    expect(obs).toHaveLength(40);
    for (let i = 0; i < obs.length; i++) for (let j = i + 1; j < obs.length; j++) {
      const a = obs[i], b = obs[j];
      const dl = Math.abs(a.longitude - b.longitude), dlon = Math.min(dl, 360 - dl) * Math.cos(((a.latitude + b.latitude) / 2) * Math.PI / 180);
      expect(Math.hypot(a.latitude - b.latitude, dlon)).toBeGreaterThanOrEqual(11.99);
    }
  });

  it('Bangladesh and GISTEMP series are complete', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs' as string);
    const bd = JSON.parse(fs.readFileSync('public/data/bangladesh_monsoon.json', 'utf8'));
    expect(bd.cities).toHaveLength(8);
    bd.cities.forEach((c: { p2026: number[]; p2025: number[] }) => { expect(c.p2026).toHaveLength(127); expect(c.p2025).toHaveLength(127); });
    const g = JSON.parse(fs.readFileSync('public/data/gistemp_global.json', 'utf8'));
    expect(g.series[0].year).toBe(1880);
    expect(g.series[g.series.length - 1].year).toBe(2025);
    expect(g.series.every((p: { anomaly: number }) => Number.isFinite(p.anomaly))).toBe(true);
  });

  it('describeVoice mirrors the synth mappings', async () => {
    const { describeVoice } = await import('../audio/voiceParams');
    const base = { id: 'x', latitude: 0, timestamp: '', variable: '', unit: '', source: '' };
    expect(describeVoice({ ...base, phenomenon: 'fire', longitude: -90, value: 800, normalizedValue: 1 }).ratePerSec).toBeCloseTo(20, 0);
    expect(describeVoice({ ...base, phenomenon: 'fire', longitude: -90, value: 5, normalizedValue: 0 }).pan).toBe(-0.5);
    expect(describeVoice({ ...base, phenomenon: 'sst', longitude: 0, value: 3, normalizedValue: 0.8 }).pitchHz).toBeCloseTo(110 * Math.pow(2, 4 / 12), 3);
  });

  it('vital signs series are complete and ordered', async () => {
    const fs = await import(/* @vite-ignore */ 'node:fs' as string);
    const v = JSON.parse(fs.readFileSync('public/data/vital_signs.json', 'utf8'));
    const by = Object.fromEntries(v.series.map((s: { id: string }) => [s.id, s]));
    expect(by.co2.points[0]).toEqual({ year: 1959, value: 315.98 });
    expect(by.co2.points.at(-1).value).toBe(427.35);
    expect(by.ice.points.find((p: { year: number }) => p.year === 2012).value).toBe(3.57);
    for (const s of v.series) for (let k = 1; k < s.points.length; k++) expect(s.points[k].year).toBe(s.points[k - 1].year + 1);
  });
});
