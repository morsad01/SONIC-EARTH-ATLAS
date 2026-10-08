import type { DatasetTimeSlice } from '../types/dataset';
import { generateDemoTimeSlices } from './demoDatasets';
import { normalizeValue } from '../sonification/normalizer';

export interface AdapterResult {
  slices: DatasetTimeSlice[];
  mode: 'demo' | 'live';
  statusMessage: string;
  isFallback: boolean;
}

const DEMO_NOTE = 'Illustrative sample: hand-made values modeled on NASA products, not real observations.';

export class DatasetAdapter {
  private static cachedDemoSlices: DatasetTimeSlice[] | null = null;

  public static getDemoData(): DatasetTimeSlice[] {
    if (!this.cachedDemoSlices) this.cachedDemoSlices = generateDemoTimeSlices();
    return this.cachedDemoSlices;
  }

  /** 'live' = real NASA FIRMS snapshot (run `npm run fetch:firms`); falls back to the labeled sample. */
  public static async loadDatasets(requestedMode: 'demo' | 'live'): Promise<AdapterResult> {
    if (requestedMode === 'demo') {
      return { slices: this.getDemoData(), mode: 'demo', statusMessage: DEMO_NOTE, isFallback: false };
    }
    try {
      const res = await fetch('/data/firms_snapshot.json');
      if (!res.ok) throw new Error('snapshot not found');
      const json = await res.json();
      const slices: DatasetTimeSlice[] = json.slices.map((s: DatasetTimeSlice) => ({
        ...s,
        observations: s.observations.map((o) => ({ ...o, normalizedValue: normalizeValue(o.phenomenon, o.value) })),
      }));
      return {
        slices, mode: 'live', isFallback: false,
        statusMessage: `Real NASA FIRMS VIIRS wildfire detections (snapshot ${String(json.generated).slice(0, 10)}). Fire layer only.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'load error';
      return { slices: this.getDemoData(), mode: 'demo', isFallback: true, statusMessage: `Real data unavailable (${msg}). ${DEMO_NOTE}` };
    }
  }
}
