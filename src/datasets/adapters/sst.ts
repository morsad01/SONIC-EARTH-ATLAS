import { getJson } from '../series';
import type { SliceJson } from './common';

export interface SstJson extends SliceJson { monthLabel: string; erddapTime?: string; selectionNote?: string; globalStats?: { areaWeightedMeanAnomalyC: number; fractionWarmerThanNormal: number; validCells?: number } }
export const loadSst = (signal?: AbortSignal) => getJson<SstJson>('/data/sst_snapshot.json', signal);
export const SST_INFO = {
  variable: 'Sea surface temperature anomaly (monthly)', unit: '°C', source: 'NASA JPL MUR SST via NOAA CoastWatch ERDDAP', sourceUrl: 'https://podaac.jpl.nasa.gov/MEaSUREs-MUR',
  attribution: 'Data courtesy of NASA JPL MUR SST via NOAA CoastWatch ERDDAP.',
  spatialResolution: '0.01° native, sampled every 1°; the 40 most anomalous open-ocean cells are kept', temporalResolution: 'Monthly',
  method: 'Open-ocean cells whose centre lies inside the border (rare: only sea inside a national outline).',
  limitations: 'Open-ocean cells are mostly outside every border, so most countries have none. Exclusive economic zones are not modelled.',
} as const;
