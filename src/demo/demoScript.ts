import type { PhenomenonType } from '../types/dataset';

export interface DemoStep {
  id: number;
  title: string;
  durationMs: number;
  caption: string;
  activePhenomena: Record<PhenomenonType, boolean>;
  timestepIndex: number;
  hearChangeMode: boolean;
  targetRegionName?: string;
  quote?: string;
  cameraFocus?: { lat: number; lon: number };
}

export const DEMO_SCRIPT: DemoStep[] = [
  {
    id: 1,
    title: 'ORBITAL AUDIO CALIBRATION',
    durationMs: 4500,
    caption: 'Calibrating Web Audio spatial engine. Earth rests in the quiet expanse of orbit.',
    activePhenomena: { fire: false, precipitation: false, sst: false },
    timestepIndex: 0,
    hearChangeMode: false,
    cameraFocus: { lat: 10, lon: 0 },
  },
  {
    id: 2,
    title: 'NASA FIRMS — ACTIVE WILDFIRES',
    durationMs: 6500,
    caption: 'Thermal sensors online. Crackling bursts emerge from South America and Africa. Longitude positions each fire across your stereo field.',
    activePhenomena: { fire: true, precipitation: false, sst: false },
    timestepIndex: 1,
    hearChangeMode: false,
    targetRegionName: 'Amazon Basin (Pará, Brazil)',
    cameraFocus: { lat: -8, lon: -54 },
  },
  {
    id: 3,
    title: 'NASA GPM IMERG — PRECIPITATION DYNAMICS',
    durationMs: 6500,
    caption: 'Precipitation radar synchronizes. Droplet cascades ripple across tropical monsoon basins. Pulse rate directly tracks rain volume in mm/hr.',
    activePhenomena: { fire: false, precipitation: true, sst: false },
    timestepIndex: 2,
    hearChangeMode: false,
    targetRegionName: 'Ganges-Brahmaputra Delta (Bangladesh/India)',
    cameraFocus: { lat: 22, lon: 89 },
  },
  {
    id: 4,
    title: 'NOAA / NASA GHRSST — OCEAN THERMAL ANOMALIES',
    durationMs: 6500,
    caption: 'Sea surface temperatures sound as sustained resonant drones. Warm marine heatwaves ascend in pitch, while deep upwellings drone low.',
    activePhenomena: { fire: false, precipitation: false, sst: true },
    timestepIndex: 3,
    hearChangeMode: false,
    targetRegionName: 'Equatorial Pacific (Niño 3.4 ENSO Zone)',
    cameraFocus: { lat: 0, lon: -140 },
  },
  {
    id: 5,
    title: 'HEAR THE CHANGE — TEMPORAL FLUX',
    durationMs: 6500,
    caption: 'Advancing through time. The sonification engine transitions to differential mode, translating rates of change (Δ) into acoustic motion.',
    activePhenomena: { fire: true, precipitation: true, sst: true },
    timestepIndex: 4,
    hearChangeMode: true,
    cameraFocus: { lat: 15, lon: -40 },
  },
  {
    id: 6,
    title: 'THE SONIC EARTH',
    durationMs: 7000,
    caption: 'Complete multi-system harmony. A living planetary instrument powered by authoritative NASA Earth observations.',
    activePhenomena: { fire: true, precipitation: true, sst: true },
    timestepIndex: 5,
    hearChangeMode: false,
    cameraFocus: { lat: 10, lon: 0 },
    quote: '“Earth is not silent. We just needed another way to listen.”',
  },
];
