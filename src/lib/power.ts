import { findCountry } from '../countries/countries';
import { fetchPowerMonthly } from '../datasets/adapters/power';

/** Live NASA POWER request for any point on Earth (POWER sends CORS headers, no key needed). */
export interface PlaceClimate {
  lat: number;
  lon: number;
  years: number[];
  temp: number[]; // annual mean 2 m air temperature, °C
  rain: number[]; // annual mean precipitation, mm/day
}

export async function fetchPlaceClimate(lat: number, lon: number, signal?: AbortSignal): Promise<PlaceClimate> {
  const { annual } = await fetchPowerMonthly(lat, lon, { signal }); // annual values are POWER's month "13"
  return { lat, lon, years: annual.years, temp: annual.temp, rain: annual.rain };
}

/** Least-squares slope per decade. */
export function trendPerDecade(xs: number[], ys: number[]) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let k = 0; k < n; k++) { num += (xs[k] - mx) * (ys[k] - my); den += (xs[k] - mx) ** 2; }
  return den ? (num / den) * 10 : 0;
}

/** Country name for a point (Natural Earth 110m, shared with the country picker), loaded on first use. */
export async function countryName(lat: number, lon: number): Promise<string | null> {
  return (await findCountry(lat, lon))?.name ?? null;
}
