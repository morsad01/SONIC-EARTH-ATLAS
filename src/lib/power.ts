/** Live NASA POWER request for any point on Earth (POWER sends CORS headers, no key needed). */
export interface PlaceClimate {
  lat: number;
  lon: number;
  years: number[];
  temp: number[]; // annual mean 2 m air temperature, °C
  rain: number[]; // annual mean precipitation, mm/day
}

export async function fetchPlaceClimate(lat: number, lon: number, signal?: AbortSignal): Promise<PlaceClimate> {
  const u = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR&community=RE&longitude=${lon.toFixed(2)}&latitude=${lat.toFixed(2)}&start=1981&end=2025&format=JSON`;
  const r = await fetch(u, { signal });
  if (!r.ok) throw new Error(`NASA POWER answered ${r.status}`);
  const j = await r.json();
  const T = j.properties?.parameter?.T2M ?? {}, P = j.properties?.parameter?.PRECTOTCORR ?? {};
  const years: number[] = [], temp: number[] = [], rain: number[] = [];
  for (let y = 1981; y <= 2025; y++) {
    const t = T[`${y}13`], p = P[`${y}13`]; // POWER puts the annual value in month "13"
    if (typeof t === 'number' && t > -900 && typeof p === 'number' && p > -900) { years.push(y); temp.push(t); rain.push(p); }
  }
  if (years.length < 5) throw new Error('NASA POWER returned too few years for this point');
  return { lat, lon, years, temp, rain };
}

/** Least-squares slope per decade. */
export function trendPerDecade(xs: number[], ys: number[]) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let k = 0; k < n; k++) { num += (xs[k] - mx) * (ys[k] - my); den += (xs[k] - mx) ** 2; }
  return den ? (num / den) * 10 : 0;
}

let countriesPromise: Promise<{ name: string; f: unknown }[]> | null = null;
/** Country name for a point (Natural Earth 110m), loaded on first use. */
export async function countryName(lat: number, lon: number): Promise<string | null> {
  if (!countriesPromise) {
    countriesPromise = (async () => {
      const [{ feature }, topo] = await Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = (topo as any).default ?? topo;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (feature(t, t.objects.countries) as any).features.map((f: any) => ({ name: f.properties.name as string, f }));
    })();
  }
  const [{ geoContains }, list] = await Promise.all([import('d3-geo'), countriesPromise]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hit = list.find((c) => geoContains(c.f as any, [lon, lat]));
  return hit ? hit.name.replace('United States of America', 'United States').replace('Dem. Rep. Congo', 'DR Congo') : null;
}
