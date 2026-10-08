// Offline reverse geocoding for observation cells: country (Natural Earth via world-atlas) or ocean basin name.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoContains, geoDistance } from 'd3-geo';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
export const countries = feature(topo, topo.objects.countries).features;

const SHORT = {
  'Dem. Rep. Congo': 'DR Congo', 'Central African Rep.': 'Central African Republic', 'S. Sudan': 'South Sudan',
  'United States of America': 'United States', 'Bosnia and Herz.': 'Bosnia', 'Eq. Guinea': 'Equatorial Guinea',
  "Côte d'Ivoire": "Côte d'Ivoire", 'Solomon Is.': 'Solomon Islands', 'Dominican Rep.': 'Dominican Republic',
};
const nm = (f) => SHORT[f.properties.name] ?? f.properties.name;

export function countryAt(lat, lon) {
  for (const f of countries) if (geoContains(f, [lon, lat])) {
    const n = nm(f);
    if (n === 'France' && lat < 15 && lon < 0) return 'French Guiana';
    return n;
  }
  return null;
}

function nearestCountry(lat, lon, maxDeg = 3) {
  let best = null, bestD = Infinity;
  for (let dl = -maxDeg; dl <= maxDeg; dl += 0.5) {
    for (let dn = -maxDeg; dn <= maxDeg; dn += 0.5) {
      const c = countryAt(lat + dl, lon + dn);
      if (!c) continue;
      const d = geoDistance([lon, lat], [lon + dn, lat + dl]);
      if (d < bestD) { bestD = d; best = c; }
    }
  }
  return best;
}

const inBox = (lat, lon, s, n, w, e) => lat >= s && lat <= n && lon >= w && lon <= e;

export function oceanName(lat, lon) {
  if (inBox(lat, lon, 5, 23, 80, 95)) return 'Bay of Bengal';
  if (inBox(lat, lon, 5, 25, 50, 77)) return 'Arabian Sea';
  if (inBox(lat, lon, 18, 31, -98, -81)) return 'Gulf of Mexico';
  if (inBox(lat, lon, 9, 22, -88, -60)) return 'Caribbean Sea';
  if (inBox(lat, lon, 30, 46, -6, 36)) return 'Mediterranean Sea';
  if (inBox(lat, lon, 0, 23, 105, 121)) return 'South China Sea';
  if (inBox(lat, lon, 5, 32, 121, 142)) return 'Philippine Sea';
  if (inBox(lat, lon, -46, -30, 150, 175)) return 'Tasman Sea';
  if (inBox(lat, lon, -25, -10, 145, 165)) return 'Coral Sea';
  if (inBox(lat, lon, -46, -33, 12, 40)) return 'Agulhas region, off South Africa';
  if (inBox(lat, lon, -5, 5, -100, -88)) return 'Equatorial Pacific near the Galápagos';
  if (lat < -50) return 'Southern Ocean';
  const hemi = lat > 10 ? 'North' : lat < -10 ? 'South' : 'Equatorial';
  // Indian Ocean
  if (lon >= 20 && lon <= 120 && lat < 25 && !(lon > 100 && lat > 0)) return `${hemi === 'North' ? 'Northern' : hemi === 'South' ? 'Southern' : 'Equatorial'} Indian Ocean`;
  // Atlantic (rough wedge)
  const atlW = lat > 10 ? -80 : lat > -10 ? -50 : -68;
  if (lon >= atlW && lon <= 20) return `${hemi} Atlantic`;
  const side = lon < 0 ? (lon > -140 ? 'Eastern ' : 'Central ') : lon > 160 ? 'Central ' : 'Western ';
  return `${side}${hemi} Pacific`.replace('Eastern Equatorial', 'Eastern Equatorial');
}

/** Human-readable name for a grid cell. */
export function placeName(lat, lon, { preferOcean = false } = {}) {
  const here = countryAt(lat, lon);
  if (here && !preferOcean) return here;
  if (!here) {
    const near = nearestCountry(lat, lon, preferOcean ? 0 : 2);
    if (near && !preferOcean) return `Coast of ${near}`;
  }
  return oceanName(lat, lon);
}
