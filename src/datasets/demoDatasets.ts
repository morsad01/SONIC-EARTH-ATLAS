import type { DatasetTimeSlice, EarthObservation, PhenomenonType } from '../types/dataset';
import { normalizeValue } from '../sonification/normalizer';

// Real geographic coordinates and genuine ranges for authoritative Earth observations
interface RawDemoPoint {
  id: string;
  phenomenon: PhenomenonType;
  lat: number;
  lon: number;
  region: string;
  unit: string;
  variable: string;
  source: string;
  valuesByTime: number[]; // 6 timesteps
  confidence?: number;
}

const RAW_POINTS: RawDemoPoint[] = [
  // --- ACTIVE FIRES (NASA FIRMS / VIIRS - Fire Radiative Power in MW) ---
  {
    id: 'firms-amazon-para',
    phenomenon: 'fire',
    lat: -6.45,
    lon: -52.88,
    region: 'Amazon Basin (Pará, Brazil)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [120, 245, 480, 690, 510, 310],
    confidence: 96,
  },
  {
    id: 'firms-pantanal',
    phenomenon: 'fire',
    lat: -17.25,
    lon: -56.85,
    region: 'Pantanal Wetlands (Brazil)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [45, 95, 290, 420, 230, 80],
    confidence: 92,
  },
  {
    id: 'firms-congo-basin',
    phenomenon: 'fire',
    lat: -5.85,
    lon: 22.40,
    region: 'Congo Savanna (DRC)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [310, 420, 560, 490, 380, 260],
    confidence: 98,
  },
  {
    id: 'firms-angola-plateau',
    phenomenon: 'fire',
    lat: -11.20,
    lon: 17.85,
    region: 'Bie Plateau (Angola)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [180, 290, 410, 340, 210, 140],
    confidence: 94,
  },
  {
    id: 'firms-california-sierra',
    phenomenon: 'fire',
    lat: 39.82,
    lon: -121.15,
    region: 'Sierra Nevada Foothills (California, USA)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [35, 140, 520, 780, 410, 110],
    confidence: 97,
  },
  {
    id: 'firms-boreal-sakha',
    phenomenon: 'fire',
    lat: 62.05,
    lon: 129.74,
    region: 'Sakha Taiga (Siberia)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [85, 230, 370, 540, 320, 150],
    confidence: 91,
  },
  {
    id: 'firms-australia-topend',
    phenomenon: 'fire',
    lat: -14.45,
    lon: 132.28,
    region: 'Katherine Region (Northern Territory, Australia)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [150, 210, 340, 290, 180, 95],
    confidence: 95,
  },
  {
    id: 'firms-greece-peloponnese',
    phenomenon: 'fire',
    lat: 37.60,
    lon: 21.80,
    region: 'Peloponnese (Greece)',
    unit: 'MW',
    variable: 'Fire Radiative Power',
    source: 'Illustrative sample, FIRMS-style',
    valuesByTime: [20, 65, 310, 480, 190, 40],
    confidence: 93,
  },

  // --- PRECIPITATION (NASA GPM IMERG - Precipitation Rate in mm/hr) ---
  {
    id: 'gpm-bengal-monsoon',
    phenomenon: 'precipitation',
    lat: 22.35,
    lon: 89.85,
    region: 'Ganges-Brahmaputra Delta (Bangladesh/India)',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [18.5, 28.4, 42.1, 36.8, 22.0, 12.4],
  },
  {
    id: 'gpm-itcz-pacific',
    phenomenon: 'precipitation',
    lat: 7.20,
    lon: -135.50,
    region: 'Eastern Pacific ITCZ',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [24.0, 31.5, 35.0, 29.8, 33.2, 27.5],
  },
  {
    id: 'gpm-western-ghats',
    phenomenon: 'precipitation',
    lat: 14.25,
    lon: 74.80,
    region: 'Western Ghats (India)',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [14.2, 25.8, 38.6, 31.0, 18.4, 9.2],
  },
  {
    id: 'gpm-amazon-solimoes',
    phenomenon: 'precipitation',
    lat: -3.12,
    lon: -60.02,
    region: 'Central Amazon Convection (Manaus)',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [8.5, 16.2, 22.4, 18.0, 26.5, 14.8],
  },
  {
    id: 'gpm-cyclone-philippines',
    phenomenon: 'precipitation',
    lat: 16.50,
    lon: 126.80,
    region: 'Philippine Sea Tropical Depression',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [6.2, 14.5, 34.0, 48.2, 21.0, 5.8],
  },
  {
    id: 'gpm-north-atlantic-storm',
    phenomenon: 'precipitation',
    lat: 52.40,
    lon: -32.10,
    region: 'North Atlantic Extratropical Cyclone',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [12.0, 19.5, 28.2, 24.0, 15.6, 8.4],
  },
  {
    id: 'gpm-maritime-continent',
    phenomenon: 'precipitation',
    lat: -0.78,
    lon: 114.50,
    region: 'Kalimantan Equatorial Convergence',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [15.2, 22.1, 19.8, 27.4, 21.6, 17.0],
  },
  {
    id: 'gpm-guinea-monsoon',
    phenomenon: 'precipitation',
    lat: 5.60,
    lon: -0.20,
    region: 'Gulf of Guinea Coastal Front (West Africa)',
    unit: 'mm/day',
    variable: 'Precipitation Rate',
    source: 'Illustrative sample, GPM IMERG-style',
    valuesByTime: [11.0, 18.4, 25.6, 21.2, 14.0, 7.5],
  },

  // --- SEA SURFACE TEMPERATURE ANOMALY (NOAA / NASA PO.DAAC - SST Anomaly in °C) ---
  {
    id: 'sst-enso-nino34',
    phenomenon: 'sst',
    lat: 0.00,
    lon: -140.00,
    region: 'Equatorial Pacific (Niño 3.4 ENSO Zone)',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [1.2, 1.6, 2.1, 2.5, 2.7, 2.8],
  },
  {
    id: 'sst-north-atlantic-blob',
    phenomenon: 'sst',
    lat: 44.50,
    lon: -38.20,
    region: 'Subtropical North Atlantic Marine Heatwave',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [1.8, 2.2, 2.6, 3.1, 2.9, 2.4],
  },
  {
    id: 'sst-mediterranean-marine-heat',
    phenomenon: 'sst',
    lat: 36.20,
    lon: 16.50,
    region: 'Ionian Basin (Mediterranean Sea)',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [1.4, 1.9, 2.4, 2.8, 2.5, 2.0],
  },
  {
    id: 'sst-coral-triangle',
    phenomenon: 'sst',
    lat: -5.50,
    lon: 130.20,
    region: 'Banda Sea Coral Thermal Stress Zone',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [1.1, 1.4, 1.8, 2.2, 2.1, 1.7],
  },
  {
    id: 'sst-gulf-of-mexico',
    phenomenon: 'sst',
    lat: 25.80,
    lon: -88.50,
    region: 'Gulf of Mexico Loop Current',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [1.5, 1.8, 2.3, 2.6, 2.4, 1.9],
  },
  {
    id: 'sst-southern-ocean-upwelling',
    phenomenon: 'sst',
    lat: -54.00,
    lon: 45.00,
    region: 'Antarctic Circumpolar Cold Upwelling',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [-0.8, -1.2, -1.7, -2.1, -1.9, -1.5],
  },
  {
    id: 'sst-california-current-cold',
    phenomenon: 'sst',
    lat: 34.00,
    lon: -123.50,
    region: 'California Coastal Upwelling Cold Plume',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [-0.6, -1.0, -1.4, -1.8, -1.5, -1.1],
  },
  {
    id: 'sst-indian-ocean-dipole',
    phenomenon: 'sst',
    lat: -8.00,
    lon: 65.00,
    region: 'Central Equatorial Indian Ocean',
    unit: '°C',
    variable: 'SST Anomaly',
    source: 'Illustrative sample, GHRSST-style',
    valuesByTime: [0.9, 1.3, 1.7, 2.0, 1.8, 1.4],
  },
];

export const TIMESTEP_DATES = [
  '2026-08-01',
  '2026-08-08',
  '2026-08-15',
  '2026-08-22',
  '2026-08-29',
  '2026-09-05',
];

export const TIMESTEP_LABELS = [
  'Aug 01, 2026',
  'Aug 08, 2026',
  'Aug 15, 2026',
  'Aug 22, 2026',
  'Aug 29, 2026',
  'Sep 05, 2026',
];

export interface TimestepNarrative {
  timestepIndex: number;
  label: string;
  headline: string;
  detail: string;
}

export const TIMESTEP_NARRATIVES: TimestepNarrative[] = [
  {
    timestepIndex: 0,
    label: 'T1 — Baseline Conditions',
    headline: 'Global Baseline Observations',
    detail: 'Illustrative values shaped like NASA wildfire, rainfall and ocean-temperature products. Switch to Real data to hear actual FIRMS detections.',
  },
  {
    timestepIndex: 1,
    label: 'T2 — Fire & Convection Rise',
    headline: 'Thermal Power & Monsoon Rates Increase',
    detail: 'Fire Radiative Power climbs in the Amazon and Congo basins while tropical convective rainfall rates expand.',
  },
  {
    timestepIndex: 2,
    label: 'T3 — Monsoon Surge & Fire Escalation',
    headline: 'South Asian Monsoon Peak & Fire Escalation',
    detail: 'Ganges-Brahmaputra monsoon rate peaks at 42.1 mm/hr as wildfire radiative power escalates across North & South America.',
  },
  {
    timestepIndex: 3,
    label: 'T4 — Peak Combustion Intensity',
    headline: 'Amazon & California Fire Peaks; Marine Heatwave Expansion',
    detail: 'Wildfire radiative power peaks in Amazon (690 MW) and California (780 MW); North Atlantic marine anomaly reaches +3.1°C.',
  },
  {
    timestepIndex: 4,
    label: 'T5 — Ocean Warm Anomaly Crest',
    headline: 'Wildfires Subside as Pacific ENSO Anomaly Strengthens',
    detail: 'Thermal fire output moderates globally while Equatorial Pacific SST warm anomaly crests at +2.7°C.',
  },
  {
    timestepIndex: 5,
    label: 'T6 — Multi-System Seasonal Transition',
    headline: 'Late-Season Fire Recedes; Persistent Marine Thermal Anomalies',
    detail: 'Wildfire activity and precipitation subside toward baseline levels as elevated ocean heat content persists.',
  },
];

/**
 * Generates the pre-bundled normalized dataset time slices.
 */
export function generateDemoTimeSlices(): DatasetTimeSlice[] {
  return TIMESTEP_DATES.map((dateStr, tIdx) => {
    const observations: EarthObservation[] = RAW_POINTS.map((pt) => {
      const val = pt.valuesByTime[tIdx];
      const prevVal = tIdx > 0 ? pt.valuesByTime[tIdx - 1] : val;
      const delta = val - prevVal;
      const normalizedValue = normalizeValue(pt.phenomenon, val);

      return {
        id: `${pt.id}-t${tIdx}`,
        phenomenon: pt.phenomenon,
        latitude: pt.lat,
        longitude: pt.lon,
        timestamp: dateStr,
        variable: pt.variable,
        value: val,
        unit: pt.unit,
        normalizedValue,
        delta,
        confidence: pt.confidence,
        source: pt.source,
        regionName: pt.region,
        metadata: {
          previousValue: prevVal,
          timestepIndex: tIdx,
          geographicQuadrant: `${pt.lat >= 0 ? 'N' : 'S'}${Math.abs(pt.lat).toFixed(1)}°, ${pt.lon >= 0 ? 'E' : 'W'}${Math.abs(pt.lon).toFixed(1)}°`,
        },
      };
    });

    return {
      timestepIndex: tIdx,
      dateLabel: TIMESTEP_LABELS[tIdx],
      timestamp: dateStr,
      observations,
    };
  });
}
