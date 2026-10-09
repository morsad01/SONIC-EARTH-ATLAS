export type PhenomenonType = 'fire' | 'precipitation' | 'sst';

export interface EarthObservation {
  id: string;
  phenomenon: PhenomenonType;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO date string e.g. "2026-08-15"
  variable: string;
  value: number; // Raw scientific value
  unit: string;
  normalizedValue: number; // 0 to 1 normalized
  delta?: number; // Change from previous timestep
  confidence?: number; // Optional 0-100 or 0-1
  source: string;
  regionName?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface DatasetMetadata {
  id: PhenomenonType;
  title: string;
  variableName: string;
  unit: string;
  provider: string;
  sourceUrl: string;
  temporalResolution: string;
  spatialResolution: string;
  validRange: [number, number];
  processingMethod: string;
  normalizationFormula: string;
  audioFormula: string;
  attribution: string;
  colorScheme: {
    primary: string;
    glow: string;
    gradient: string[];
  };
}

export interface DatasetTimeSlice {
  timestepIndex: number;
  dateLabel: string;
  timestamp: string;
  observations: EarthObservation[];
}

export type DataSourceMode = 'demo' | 'live';
