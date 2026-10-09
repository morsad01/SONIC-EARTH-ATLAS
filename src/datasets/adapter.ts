import type { DatasetTimeSlice, PhenomenonType, EarthObservation } from '../types/dataset';
import { generateDemoTimeSlices } from './demoDatasets';
import { normalizeValue } from '../sonification/normalizer';
import { loadFirms, FIRMS_INFO } from './adapters/firms';
import { loadPrecip } from './adapters/precip';
import { loadSst } from './adapters/sst';
import { byDate, validObs } from './adapters/common';

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
  snapshotDates?: Partial<Record<PhenomenonType, string>>; // `generated` stamp of each bundled file
  sstMonth?: string;
  sstGlobal?: { areaWeightedMeanAnomalyC: number; fractionWarmerThanNormal: number };
}

const DEMO_NOTE = 'Offline sample: the real NASA snapshots could not be loaded, so hand-made illustrative values are playing.';

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
      fire: { loaded: false, dateRange: '', sourceName: FIRMS_INFO.source, infoText: 'Not loaded' },
      precipitation: { loaded: false, dateRange: '', sourceName: 'NASA POWER PRECTOTCORR (MERRA-2 based)', infoText: 'Not loaded' },
      sst: { loaded: false, dateRange: '', sourceName: 'NASA JPL MUR SST anomaly via NOAA CoastWatch ERDDAP', infoText: 'Not loaded' },
    };

    const [fire, precip, sst] = await Promise.allSettled([
      loadFirms(),
      loadPrecip(),
      loadSst(),
    ]);

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
    const good = (os: EarthObservation[] | undefined) => (os ?? []).filter(validObs).map(norm);
    const sstObs: EarthObservation[] = good(sstJson?.slices?.[0]?.observations);

    const slices: DatasetTimeSlice[] = dates.map((d, t) => ({
      timestepIndex: t,
      dateLabel: d,
      timestamp: d,
      observations: [...good(fireByDate?.get(d)), ...good(precipByDate?.get(d)), ...sstObs],
    }));

    return {
      slices,
      mode: 'live',
      isFallback: false,
      statusMessage: `Real NASA data, ${dates[0]} to ${dates[dates.length - 1]}`,
      layerStatuses: status,
      snapshotDates: {
        ...(fire.status === 'fulfilled' && fire.value.generated ? { fire: fire.value.generated.slice(0, 10) } : {}),
        ...(precip.status === 'fulfilled' && precip.value.generated ? { precipitation: precip.value.generated.slice(0, 10) } : {}),
        ...(sstJson?.generated ? { sst: sstJson.generated.slice(0, 10) } : {}),
      },
      sstMonth: sstJson?.monthLabel,
      sstGlobal: sstJson?.globalStats,
    };
  }
}
