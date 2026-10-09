import { cleanValue, getJson, periodOf, type DataSeries } from '../series';

/** Monthly NASA POWER series at a point (roadmap D7): real T2M and PRECTOTCORR, 1981–2025. */
const BASE = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
export const POWER_START = 1981, POWER_END = 2025;

interface Raw { properties?: { parameter?: Record<string, Record<string, unknown>> } }
export interface PowerMonthly { lat: number; lon: number; temp: DataSeries; rain: DataSeries; annual: { years: number[]; temp: number[]; rain: number[] } }

export const powerUrl = (lat: number, lon: number) => `${BASE}?parameters=T2M,PRECTOTCORR&community=RE&longitude=${lon.toFixed(2)}&latitude=${lat.toFixed(2)}&start=${POWER_START}&end=${POWER_END}&format=JSON`;

const monthKeys = () => { const k: string[] = []; for (let y = POWER_START; y <= POWER_END; y++) for (let m = 1; m <= 12; m++) k.push(`${y}${String(m).padStart(2, '0')}`); return k; };

/** Pure: POWER JSON → monthly series (invalid / -999 values become null) plus the annual values ("month 13"). */
export function parsePowerMonthly(j: Raw, lat: number, lon: number): PowerMonthly {
  const T = j.properties?.parameter?.T2M ?? {}, P = j.properties?.parameter?.PRECTOTCORR ?? {};
  const mk = (src: Record<string, unknown>) => monthKeys().map((k) => ({ t: `${k.slice(0, 4)}-${k.slice(4)}`, v: cleanValue(src[k]) }));
  const pt = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  const common = {
    source: 'NASA POWER Monthly API (MERRA-2 / CERES based)', sourceUrl: 'https://power.larc.nasa.gov/', attribution: 'NASA POWER Project, NASA Langley Research Center.',
    coverage: 'point-sample' as const, spatialResolution: `One ~50 km model cell at ${pt}`, temporalResolution: 'Monthly', isLive: true, isSample: false,
    limitations: 'Model-based values for one point, not an average of the whole country and not a station record.',
  };
  const tp = mk(T), rp = mk(P);
  const years: number[] = [], temp: number[] = [], rain: number[] = [];
  for (let y = POWER_START; y <= POWER_END; y++) {
    const t = cleanValue(T[`${y}13`]), p = cleanValue(P[`${y}13`]);
    if (t !== null && p !== null) { years.push(y); temp.push(t); rain.push(p); }
  }
  return {
    lat, lon, annual: { years, temp, rain },
    temp: { ...common, id: 'power-t2m', variable: 'Air temperature at 2 m', unit: '°C', period: periodOf(tp), points: tp, method: 'T2M monthly mean at the point.' },
    rain: { ...common, id: 'power-prectotcorr', variable: 'Precipitation (bias-corrected)', unit: 'mm/day', period: periodOf(rp), points: rp, method: 'PRECTOTCORR, monthly mean of daily rain at the point.' },
  };
}

const mem = new Map<string, PowerMonthly>();
const key = (lat: number, lon: number) => `power:${lat.toFixed(2)},${lon.toFixed(2)}`;
const readSession = (k: string): PowerMonthly | null => { try { const s = sessionStorage.getItem(k); return s ? (JSON.parse(s) as PowerMonthly) : null; } catch { return null; } };
const writeSession = (k: string, v: PowerMonthly) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked: memory cache still works */ } };

/** Fetches monthly POWER at a point: memory then sessionStorage cache, abortable, up to `retries` retries on network or 5xx errors (not on abort). */
export async function fetchPowerMonthly(lat: number, lon: number, o: { signal?: AbortSignal; retries?: number; delayMs?: number } = {}): Promise<PowerMonthly> {
  const k = key(lat, lon), hit = mem.get(k) ?? readSession(k);
  if (hit) { mem.set(k, hit); return hit; }
  const { signal, retries = 2, delayMs = 400 } = o;
  let last: unknown;
  for (let a = 0; a <= retries; a++) {
    try {
      const out = parsePowerMonthly(await getJson<Raw>(powerUrl(lat, lon), signal), lat, lon);
      if (out.annual.years.length < 5) throw Object.assign(new Error('NASA POWER returned too few years for this point'), { final: true });
      mem.set(k, out); writeSession(k, out);
      return out;
    } catch (e) {
      last = e;
      if (signal?.aborted || (e as { final?: boolean }).final || /answered 4\d\d/.test(String((e as Error).message))) throw e;
      if (a < retries) await new Promise((r) => setTimeout(r, delayMs * 2 ** a));
    }
  }
  throw last;
}
export const clearPowerCache = () => mem.clear();
