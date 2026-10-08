import type { DatasetTimeSlice, PhenomenonType, EarthObservation } from '../types/dataset';
import { generateDemoTimeSlices } from './demoDatasets';
import { normalizeValue } from '../sonification/normalizer';

export interface LayerLoadStatus {
  loaded: boolean;
  dateRange: string;
  sourceName: string;
  infoText: string;
}

export interface AdapterResult {
  slices: DatasetTimeSlice[];
  mode: 'demo' | 'live';
  statusMessage: string;
  isFallback: boolean;
  layerStatuses?: Record<PhenomenonType, LayerLoadStatus>;
  sstMonth?: string;
  sstGlobal?: { areaWeightedMeanAnomalyC: number; fractionWarmerThanNormal: number };
}

const DEMO_NOTE = 'Offline sample: the real NASA snapshots could not be loaded, so hand-made illustrative values are playing.';

async function getJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}

export class DatasetAdapter {
  private static cachedDemoSlices: DatasetTimeSlice[] | null = null;

  public static getDemoData(): DatasetTimeSlice[] {
    if (!this.cachedDemoSlices) this.cachedDemoSlices = generateDemoTimeSlices();
    return this.cachedDemoSlices;
  }

  /** Loads the three real NASA snapshots and aligns them by calendar date. Falls back to the labelled sample only if nothing loads. */
  public static async loadDatasets(requestedMode: 'demo' | 'live' = 'live'): Promise<AdapterResult> {
    if (requestedMode === 'demo') {
      return { slices: this.getDemoData(), mode: 'demo', statusMessage: DEMO_NOTE, isFallback: true };
    }

    const status: Record<PhenomenonType, LayerLoadStatus> = {
      fire: { loaded: false, dateRange: '', sourceName: 'NASA FIRMS VIIRS S-NPP NRT', infoText: 'Not loaded' },
      precipitation: { loaded: false, dateRange: '', sourceName: 'NASA POWER PRECTOTCORR (MERRA-2 based)', infoText: 'Not loaded' },
      sst: { loaded: false, dateRange: '', sourceName: 'NASA JPL MUR SST anomaly via NOAA CoastWatch ERDDAP', infoText: 'Not loaded' },
    };

    const [fire, precip, sst] = await Promise.allSettled([
      getJson('/data/firms_snapshot.json'),
      getJson('/data/precip_snapshot.json'),
      getJson('/data/sst_snapshot.json'),
    ]);

    const byDate = (j: { slices: DatasetTimeSlice[] }) => new Map(j.slices.map((s) => [s.dateLabel, s.observations]));
    const fireByDate = fire.status === 'fulfilled' ? byDate(fire.value) : null;
    const precipByDate = precip.status === 'fulfilled' ? byDate(precip.value) : null;
    const sstJson = sst.status === 'fulfilled' ? sst.value : null;

    if (!fireByDate && !precipByDate && !sstJson) {
      return { slices: this.getDemoData(), mode: 'demo', isFallback: true, statusMessage: DEMO_NOTE, layerStatuses: status };
    }

    const range = (m: Map<string, unknown>) => { const k = [...m.keys()].sort(); return `${k[0]} to ${k[k.length - 1]}`; };
    if (fireByDate) status.fire = { ...status.fire, loaded: true, dateRange: range(fireByDate), infoText: `Daily max fire radiative power in 2° cells, ${range(fireByDate)}` };
    if (precipByDate) status.precipitation = { ...status.precipitation, loaded: true, dateRange: range(precipByDate), infoText: `Daily rain at 48 wettest points of a 10° global grid, ${range(precipByDate)}` };
    if (sstJson) status.sst = { ...status.sst, loaded: true, dateRange: sstJson.monthLabel, infoText: `Monthly anomaly, ${sstJson.monthLabel}: 40 most anomalous open-ocean cells` };

    // Timeline = dates present in every loaded daily layer.
    const sets = [fireByDate, precipByDate].filter(Boolean).map((m) => new Set(m!.keys()));
    let dates = sets.length ? [...sets[0]].filter((d) => sets.every((s) => s.has(d))).sort() : [];
    if (!dates.length) dates = [...new Set(sets.flatMap((s) => [...s]))].sort();
    if (!dates.length) dates = ['2026-10-02'];

    const norm = (o: EarthObservation): EarthObservation => ({ ...o, normalizedValue: normalizeValue(o.phenomenon, o.value) });
    const sstObs: EarthObservation[] = (sstJson?.slices?.[0]?.observations ?? []).map(norm);

    const slices: DatasetTimeSlice[] = dates.map((d, t) => ({
      timestepIndex: t,
      dateLabel: d,
      timestamp: d,
      observations: [...(fireByDate?.get(d) ?? []).map(norm), ...(precipByDate?.get(d) ?? []).map(norm), ...sstObs],
    }));

    return {
      slices,
      mode: 'live',
      isFallback: false,
      statusMessage: `Real NASA data, ${dates[0]} to ${dates[dates.length - 1]}`,
      layerStatuses: status,
      sstMonth: sstJson?.monthLabel,
      sstGlobal: sstJson?.globalStats,
    };
  }
}
