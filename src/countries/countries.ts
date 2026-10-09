/** Country borders (Natural Earth via world-atlas) and the geometry helpers the globe, map and picker share. */
import { ISO_ALPHA3 } from './iso';

export type Resolution = '110m' | '50m';
type Ring = number[][];
export interface Country {
  id: string; // ISO 3166-1 alpha-3
  name: string; // English name (Natural Earth, tidied)
  polygons: Ring[][]; // GeoJSON polygons: [outer ring, ...holes], [lon, lat]
  bbox: [number, number, number, number]; // west, south, east, north (west > east: crosses the antimeridian)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feature: any;
}

const NAME_FIX: Record<string, string> = {
  'United States of America': 'United States', 'Dem. Rep. Congo': 'DR Congo', 'Dominican Rep.': 'Dominican Republic', 'Central African Rep.': 'Central African Republic',
  'Eq. Guinea': 'Equatorial Guinea', 'Bosnia and Herz.': 'Bosnia and Herzegovina', Macedonia: 'North Macedonia', 'W. Sahara': 'Western Sahara', 'S. Sudan': 'South Sudan',
  'Falkland Is.': 'Falkland Islands', 'Solomon Is.': 'Solomon Islands', 'Fr. S. Antarctic Lands': 'French Southern Territories', eSwatini: 'Eswatini',
};
export const tidyName = (n: string) => NAME_FIX[n] ?? n;

const cache: Partial<Record<Resolution, Promise<Country[]>>> = {};
/** Loads (once) every country that has an ISO code. 50m is a separate lazy chunk, only fetched when asked for. */
export function loadCountries(res: Resolution = '110m'): Promise<Country[]> {
  return (cache[res] ??= (async () => {
    const [{ feature }, { geoBounds }, topo] = await Promise.all([
      import('topojson-client'), import('d3-geo'),
      res === '50m' ? import('world-atlas/countries-50m.json') : import('world-atlas/countries-110m.json'),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (topo as any).default ?? topo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feats = (feature(t, t.objects.countries) as any).features as any[];
    const seen = new Set<string>(), out: Country[] = [];
    for (const f of feats) {
      const id = ISO_ALPHA3[String(f.id).padStart(3, '0')];
      if (!id || seen.has(id) || !f.geometry) continue; // no ISO code (N. Cyprus, Somaliland, Kosovo…) or a duplicate id
      seen.add(id);
      const polygons: Ring[][] = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const [[w, s], [e, n]] = geoBounds(f);
      out.push({ id, name: tidyName(f.properties.name), polygons, bbox: [w, s, e, n], feature: f });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  })());
}

export const inBbox = (b: Country['bbox'], lat: number, lon: number) =>
  lat >= b[1] && lat <= b[3] && (b[0] <= b[2] ? lon >= b[0] && lon <= b[2] : lon >= b[0] || lon <= b[2]);

const featureOf = (c: Country, poly?: Ring[]) => (poly ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: poly } } : c.feature);

/** The country containing a point, or null (open ocean). A bounding box rules most countries out first. */
export async function findCountry(lat: number, lon: number, list?: Country[]): Promise<Country | null> {
  const [{ geoContains }, all] = await Promise.all([import('d3-geo'), list ?? loadCountries('110m')]);
  return findCountrySync(geoContains, all, lat, lon);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findCountrySync(geoContains: (o: any, p: [number, number]) => boolean, list: Country[], lat: number, lon: number): Country | null {
  const l = ((lon + 540) % 360) - 180;
  for (const c of list) if (inBbox(c.bbox, lat, l) && geoContains(c.feature, [l, lat])) return c;
  return null;
}

/** A point on land to fly to and to query: the centroid of the largest polygon, or, when that falls outside (crescents, islands), the nearest contained point on a grid inside its box. */
export async function representativePoint(c: Country): Promise<{ lat: number; lon: number }> {
  const { geoArea, geoCentroid, geoContains, geoBounds } = await import('d3-geo');
  let best = c.polygons[0], bestA = -1;
  for (const p of c.polygons) { const a = geoArea(featureOf(c, p)); if (a > bestA) { bestA = a; best = p; } }
  const pf = featureOf(c, best);
  const [clon, clat] = geoCentroid(pf);
  if (geoContains(pf, [clon, clat])) return { lat: clat, lon: clon };
  const [[w, s], [e, n]] = geoBounds(pf), span = w <= e ? e - w : e + 360 - w;
  let pt: [number, number] | null = null, bd = Infinity;
  for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
    const lo = ((w + (span * i) / 24 + 540) % 360) - 180, la = s + ((n - s) * j) / 24;
    if (!geoContains(pf, [lo, la])) continue;
    const d = (lo - clon) ** 2 + (la - clat) ** 2;
    if (d < bd) { bd = d; pt = [lo, la]; }
  }
  return pt ? { lat: pt[1], lon: pt[0] } : { lat: clat, lon: clon };
}

export const countryById = (list: Country[], alpha3: string | null | undefined) => (alpha3 ? list.find((c) => c.id === alpha3) ?? null : null);

/** xyz on a sphere of radius r for lat/lon, in the layout of three's SphereGeometry with an equirectangular texture (lon 0 → +x, lon −90 → +z, north → +y). */
export function latLonToXYZ(lat: number, lon: number, r: number): [number, number, number] {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
}
/** Inverse of `latLonToXYZ` (any radius). */
export function xyzToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  return { lat: (Math.asin(Math.max(-1, Math.min(1, y / Math.hypot(x, y, z)))) * 180) / Math.PI, lon: (Math.atan2(-z, x) * 180) / Math.PI };
}

/** Border rings as GL line segments (pairs of xyz) on a sphere of radius r. Long edges are subdivided so they follow the surface, not a chord through it. */
export function outlineSegments(c: Country, r: number, maxStepDeg = 2): Float32Array {
  const out: number[] = [];
  for (const poly of c.polygons) for (const ring of poly) for (let i = 1; i < ring.length; i++) {
    const [lo0, la0] = ring[i - 1], [lo1, la1] = ring[i];
    let dlo = lo1 - lo0; if (dlo > 180) dlo -= 360; else if (dlo < -180) dlo += 360;
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(dlo), Math.abs(la1 - la0)) / maxStepDeg));
    for (let k = 0; k < n; k++) {
      out.push(...latLonToXYZ(la0 + ((la1 - la0) * k) / n, lo0 + (dlo * k) / n, r), ...latLonToXYZ(la0 + ((la1 - la0) * (k + 1)) / n, lo0 + (dlo * (k + 1)) / n, r));
    }
  }
  return new Float32Array(out);
}

/** SVG path (equirectangular, 1000 × 500) for the flat map. Edges that jump across the antimeridian are broken, not drawn across the map. */
export function outlinePath(c: Country): string {
  const px = (lo: number) => ((lo + 180) / 360) * 1000, py = (la: number) => ((90 - la) / 180) * 500;
  let d = '';
  for (const poly of c.polygons) for (const ring of poly) {
    ring.forEach(([lo, la], i) => { d += `${i === 0 || Math.abs(lo - ring[i - 1][0]) > 180 ? 'M' : 'L'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`; });
  }
  return d;
}

