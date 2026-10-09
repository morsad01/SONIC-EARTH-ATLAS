import { getJson } from '../series';
import type { SliceJson } from './common';

/** NASA POWER daily rain at the wettest points of a 10° global grid. */
export const loadPrecip = (signal?: AbortSignal) => getJson<SliceJson & { method?: string }>('/data/precip_snapshot.json', signal);
export const PRECIP_INFO = {
  variable: 'Daily precipitation (PRECTOTCORR)', unit: 'mm/day', source: 'NASA POWER (MERRA-2 based), daily', sourceUrl: 'https://power.larc.nasa.gov/',
  attribution: 'Data courtesy of NASA POWER Project, NASA LaRC.',
  spatialResolution: 'MERRA-2 cells (0.5° × 0.625°), sampled on a 10° grid; only the 48 wettest points are kept', temporalResolution: 'Daily',
  method: 'Grid points inside the border. The mean is the mean of those points, not an area-weighted country average.',
  limitations: 'A coarse sample of the wettest places. A country with no point inside has no rain here, which does not mean it had no rain.',
} as const;
