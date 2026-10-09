import { getJson } from '../series';
import type { SliceJson } from './common';

/** NASA FIRMS VIIRS: max fire radiative power per 2° cell per day. */
export const loadFirms = (signal?: AbortSignal) => getJson<SliceJson>('/data/firms_snapshot.json', signal);
export const FIRMS_INFO = {
  variable: 'Fire radiative power (max per 2° cell)', unit: 'MW', source: 'NASA FIRMS VIIRS S-NPP NRT', sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/',
  attribution: 'Data courtesy of NASA FIRMS / LANCE, ESDIS project, using the VIIRS Active Fire algorithm.',
  spatialResolution: '375 m detections grouped into 2° cells; one value per cell (the strongest detection)', temporalResolution: 'Daily',
  method: 'Cells whose centre lies inside the border are counted. Counts are cells with a detection, not numbers of fires.',
  limitations: 'Only the strongest cells of each day are kept in the snapshot, and 2° cells do not follow borders, so cells on a border are included or left out by their centre. Not a full fire inventory.',
} as const;
