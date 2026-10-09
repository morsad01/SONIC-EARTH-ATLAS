import { EIC_FRAMES } from '../../lib/eicFrames';
import type { DataSeries } from '../series';

/** EIC frames are bundled images, so they carry provenance but no numbers. They are global context only. */
export interface ImageryRecord { id: string; title: string; credit: string; sourceUrl: string; coverage: DataSeries['coverage']; isLive: false; isSample: false }
export const eicRecords = (): ImageryRecord[] => EIC_FRAMES.map((f) => ({ id: f.id, title: f.title, credit: f.credit, sourceUrl: f.sourceUrl ?? 'https://earth.gov', coverage: 'global-context', isLive: false, isSample: false }));
