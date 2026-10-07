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

  it('normalizes Precipitation Rate (mm/hr) using square-root scaling', () => {
    // 0 mm/hr should map to 0.0
    expect(normalizeValue('precipitation', 0)).toBe(0.0);

    // Heavy threshold (45 mm/hr) should map to 1.0
    expect(normalizeValue('precipitation', 45)).toBe(1.0);

    // Extreme storm (60 mm/hr) clamped to 1.0
    expect(normalizeValue('precipitation', 60)).toBe(1.0);

    // Drizzle (5 mm/hr)
    const drizzleNorm = normalizeValue('precipitation', 5);
    expect(drizzleNorm).toBeCloseTo(Math.sqrt(5 / 45), 2);
  });

  it('normalizes Sea Surface Temperature Anomaly (°C) using bipolar zero-centered mapping', () => {
    // Zero anomaly (0.0°C) should map exactly to 0.5 (neutral pad pitch)
    const neutral = normalizeValue('sst', 0.0);
    expect(neutral).toBeCloseTo(0.5, 2);

    // Max warm anomaly (+3.0°C) should map to 1.0
    const warm = normalizeValue('sst', 3.0);
    expect(warm).toBeCloseTo(1.0, 2);

    // Extreme cold anomaly (-3.0°C) should map to 0.0
    const cold = normalizeValue('sst', -3.0);
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
    expect(res.isFallback).toBe(false);
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

  it('DEMO_SCRIPT defines camera focus coordinates for regional guidance', async () => {
    const { DEMO_SCRIPT } = await import('../demo/demoScript');
    expect(DEMO_SCRIPT.length).toBe(6);

    // Fire step focuses on South America
    expect(DEMO_SCRIPT[1].cameraFocus).toBeDefined();
    expect(DEMO_SCRIPT[1].cameraFocus?.lat).toBeLessThan(0); // South America
    expect(DEMO_SCRIPT[1].cameraFocus?.lon).toBeLessThan(0); // Western hemisphere

    // Rain step focuses on South Asia
    expect(DEMO_SCRIPT[2].cameraFocus).toBeDefined();
    expect(DEMO_SCRIPT[2].cameraFocus?.lat).toBeGreaterThan(10); // India/Bangladesh
    expect(DEMO_SCRIPT[2].cameraFocus?.lon).toBeGreaterThan(60); // Eastern hemisphere

    // Ocean SST step focuses on Pacific
    expect(DEMO_SCRIPT[3].cameraFocus).toBeDefined();
    expect(DEMO_SCRIPT[3].cameraFocus?.lon).toBeLessThan(-100); // Pacific Niño 3.4
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
