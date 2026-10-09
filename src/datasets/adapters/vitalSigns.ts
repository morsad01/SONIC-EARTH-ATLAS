import { cleanValue, getJson, periodOf, type DataSeries } from '../series';

interface RawSeries { id: string; unit: string; source: string; points: { year: number; value: unknown }[] }
interface Raw { generated?: string; series?: RawSeries[] }

const META: Record<string, { variable: string; sourceUrl: string; attribution: string; method: string; limitations: string }> = {
  temp: { variable: 'Global surface temperature anomaly', sourceUrl: 'https://data.giss.nasa.gov/gistemp/', attribution: 'NASA GISS GISTEMP v4.', method: 'Annual global land-ocean mean anomaly against 1951–1980.', limitations: 'One global number per year.' },
  co2: { variable: 'Atmospheric CO₂ (Mauna Loa annual mean)', sourceUrl: 'https://gml.noaa.gov/ccgg/trends/', attribution: 'NOAA Global Monitoring Laboratory, shown on NASA Vital Signs.', method: 'Annual mean of the Mauna Loa record.', limitations: 'One station, used as the global indicator. Not a country measurement.' },
  ice: { variable: 'Arctic sea ice extent (September)', sourceUrl: 'https://nsidc.org/data/seaice_index', attribution: 'NSIDC Sea Ice Index v4.0, shown on NASA Vital Signs.', method: 'September monthly mean extent, the yearly minimum.', limitations: 'Latest years are near-real-time and may be revised. Arctic-wide, not national.' },
};

export function parseVitalSigns(j: Raw): DataSeries[] {
  return (j.series ?? []).filter((s) => META[s.id]).map((s) => {
    const m = META[s.id], points = s.points.filter((p) => Number.isInteger(p.year)).map((p) => ({ t: String(p.year), v: cleanValue(p.value, s.id === 'temp' ? -50 : 0) }));
    return { id: `vital-${s.id}`, variable: m.variable, unit: s.unit, source: s.source, sourceUrl: m.sourceUrl, attribution: m.attribution, coverage: 'global-context' as const,
      spatialResolution: 'Global', temporalResolution: 'Annual', period: periodOf(points), points, snapshotDate: j.generated, isLive: false, isSample: false, method: m.method, limitations: m.limitations };
  });
}
export const loadVitalSigns = (signal?: AbortSignal) => getJson<Raw>('/data/vital_signs.json', signal).then(parseVitalSigns);
