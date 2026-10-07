import type { PhenomenonType } from '../types/dataset';

export interface NormalizationSpec {
  min: number;
  max: number;
  unit: string;
  type: 'log' | 'sqrt' | 'linear' | 'bipolar';
  description: string;
  formulaString: string;
}

export const NORMALIZATION_SPECS: Record<PhenomenonType, NormalizationSpec> = {
  fire: {
    min: 5,
    max: 800,
    unit: 'MW',
    type: 'log',
    description: 'Logarithmic scaling from detection baseline (5 MW) to extreme wildfire threshold (800 MW).',
    formulaString: 'norm = clamp((log10(FRP) - log10(5)) / (log10(800) - log10(5)), 0, 1)',
  },
  precipitation: {
    min: 0.1,
    max: 45,
    unit: 'mm/hr',
    type: 'sqrt',
    description: 'Square-root compressed scaling from light drizzle (0.1 mm/h) to torrential rain (45 mm/h).',
    formulaString: 'norm = clamp(sqrt(RainRate / 45), 0, 1)',
  },
  sst: {
    min: -3.0,
    max: 3.0,
    unit: '°C',
    type: 'bipolar',
    description: 'Bipolar linear scaling centered at zero anomaly (0°C = 0.5, -3°C = 0.0, +3°C = 1.0).',
    formulaString: 'norm = clamp((Anomaly - (-3.0)) / (3.0 - (-3.0)), 0, 1)',
  },
};

/**
 * Normalizes raw scientific measurement into a deterministic 0.0 - 1.0 range.
 */
export function normalizeValue(phenomenon: PhenomenonType, rawValue: number): number {
  const spec = NORMALIZATION_SPECS[phenomenon];
  if (rawValue === undefined || rawValue === null || isNaN(rawValue)) {
    return 0;
  }

  switch (spec.type) {
    case 'log': {
      const clampedVal = Math.max(spec.min, Math.min(spec.max, rawValue));
      const logMin = Math.log10(spec.min);
      const logMax = Math.log10(spec.max);
      return Math.max(0, Math.min(1, (Math.log10(clampedVal) - logMin) / (logMax - logMin)));
    }
    case 'sqrt': {
      const clampedVal = Math.max(0, Math.min(spec.max, rawValue));
      return Math.max(0, Math.min(1, Math.sqrt(clampedVal / spec.max)));
    }
    case 'bipolar': {
      const clampedVal = Math.max(spec.min, Math.min(spec.max, rawValue));
      return Math.max(0, Math.min(1, (clampedVal - spec.min) / (spec.max - spec.min)));
    }
    case 'linear':
    default: {
      const clampedVal = Math.max(spec.min, Math.min(spec.max, rawValue));
      return Math.max(0, Math.min(1, (clampedVal - spec.min) / (spec.max - spec.min)));
    }
  }
}

/**
 * Geographic spatial pan calculation.
 * Longitude: -180 (far left) to +180 (far right)
 */
export function calculateStereoPan(longitude: number): number {
  if (isNaN(longitude)) return 0;
  return Math.max(-1, Math.min(1, longitude / 180));
}

/**
 * Elevation/latitude acoustic positioning.
 * Latitude: -90 (South Pole) to +90 (North Pole)
 * Returns tilt factor between -1 and 1
 */
export function calculateLatitudeTilt(latitude: number): number {
  if (isNaN(latitude)) return 0;
  return Math.max(-1, Math.min(1, latitude / 90));
}
