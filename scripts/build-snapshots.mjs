// Builds the app's JSON snapshots from the raw NASA extracts in scripts/raw/ (no values are invented or modified).
// Run: npm run build:data
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { createRequire } from 'node:module';
import { placeName } from './places.mjs';

const require = createRequire(import.meta.url);
const raw = (f) => readFileSync(new URL(`./raw/${f}`, import.meta.url), 'utf8');
const out = (f, obj) => { writeFileSync(new URL(`../public/data/${f}`, import.meta.url), JSON.stringify(obj, null, 1)); console.log('wrote', f); };
const fmt = (lat, lon) => `${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon)}°${lon >= 0 ? 'E' : 'W'}`;
const generated = '2026-10-08';

// ---------- Precipitation (NASA POWER PRECTOTCORR, 10° sample grid) ----------
{
  const dates = ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
  const line = raw('power_precip_10deg_selected.txt').split('\n').find((l) => l && !l.startsWith('#'));
  const pts = line.split(';').map((s) => {
    const [ll, v] = s.split(':');
    const [lat, lon] = ll.split(',').map(Number);
    return { lat, lon, vals: v.split(',').map(Number) };
  });
  const slices = dates.map((d, t) => ({
    timestepIndex: t, dateLabel: d, timestamp: d,
    observations: pts.map((p) => ({
      id: `precip-${p.lat},${p.lon}`, phenomenon: 'precipitation', latitude: p.lat, longitude: p.lon, timestamp: d,
      variable: 'Daily precipitation (PRECTOTCORR)', value: p.vals[t], unit: 'mm/day', normalizedValue: 0,
      delta: t === 0 ? 0 : Number((p.vals[t] - p.vals[t - 1]).toFixed(2)),
      source: 'NASA POWER (MERRA-2 based), daily', regionName: placeName(p.lat, p.lon), metadata: { cell: fmt(p.lat, p.lon) },
    })),
  }));
  out('precip_snapshot.json', {
    generated, source: 'NASA POWER Daily API v2.10, parameter PRECTOTCORR (MERRA-2 based)',
    method: '396-point 10° global sample grid (lat -50..50). Kept the 48 points with the highest single-day rain on 2026-10-02..05.',
    slices,
  });
}

// ---------- SST anomaly (NASA JPL MUR via ERDDAP) ----------
{
  const txt = raw('sst_mur_anom_2026-09_selected.txt');
  const rows = txt.split('\n').filter((l) => /^-?\d/.test(l)).map((l) => l.split(',').map(Number));
  const obs = rows.map(([lat, lon, v]) => ({
    id: `sst-${lat},${lon}`, phenomenon: 'sst', latitude: lat, longitude: lon, timestamp: '2026-09',
    variable: 'Sea surface temperature anomaly (monthly)', value: v, unit: '°C', normalizedValue: 0, delta: 0,
    source: 'NASA JPL MUR SST, served via NOAA CoastWatch ERDDAP', regionName: placeName(lat, lon, { preferOcean: true }),
    metadata: { cell: fmt(lat, lon) },
  }));
  out('sst_snapshot.json', {
    generated, erddapTime: '2026-09-16T00:00:00Z', monthLabel: 'September 2026', datasetId: 'jplMURSST41anommday',
    selectionNote: '40 most anomalous open-ocean cells, at least 12° apart',
    globalStats: { areaWeightedMeanAnomalyC: 0.693, fractionWarmerThanNormal: 0.763, validCells: 32095 },
    slices: [{ timestepIndex: 0, dateLabel: '2026-09', timestamp: '2026-09', observations: obs }],
  });
}

// ---------- FIRMS: add readable place names (values untouched) ----------
{
  const p = new URL('../public/data/firms_snapshot.json', import.meta.url);
  const j = JSON.parse(readFileSync(p, 'utf8'));
  const cache = new Map();
  for (const s of j.slices) for (const o of s.observations) {
    const k = `${o.latitude},${o.longitude}`;
    if (!cache.has(k)) cache.set(k, placeName(o.latitude, o.longitude));
    o.regionName = cache.get(k);
    o.metadata = { ...(o.metadata || {}), cell: fmt(o.latitude, o.longitude) };
  }
  writeFileSync(p, JSON.stringify(j, null, 1));
  console.log('annotated firms_snapshot.json');
}

// ---------- Bangladesh monsoon (NASA POWER, 8 divisional cities) ----------
{
  const lines = raw('bangladesh_power_raw.txt').split('\n').slice(3).filter(Boolean);
  const cities = {}; let cur = null;
  for (const l of lines) {
    const p = l.split('|');
    let series;
    if (p.length === 4) { cur = p[0]; cities[cur] = { name: cur, lat: +p[1], lon: +p[2] }; series = p[3]; } else series = p[1];
    const [k, v] = series.split(':');
    cities[cur][k] = v.split(',').map(Number);
  }
  const day = (start, i) => { const d = new Date(start + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); };
  const dates2026 = Array.from({ length: 127 }, (_, i) => day('2026-06-01', i));
  // Bangladesh outline (Natural Earth 50m via world-atlas), simplified ring as [lon,lat]
  const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
  const bd = feature(topo, topo.objects.countries).features.find((f) => f.properties.name === 'Bangladesh');
  const polys = bd.geometry.type === 'Polygon' ? [bd.geometry.coordinates] : bd.geometry.coordinates;
  const outline = polys.map((poly) => poly[0].map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]));
  const BN = { Dhaka: 'ঢাকা', Chattogram: 'চট্টগ্রাম', Sylhet: 'সিলেট', Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Barishal: 'বরিশাল', Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ' };
  out('bangladesh_monsoon.json', {
    generated,
    source: 'NASA POWER Daily API v2.10 (PRECTOTCORR, MERRA-2 based) and POWER Climatology API (2001-2020 monthly means)',
    dates2026, dates2025: Array.from({ length: 127 }, (_, i) => day('2025-06-01', i)),
    climMonths: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'ANN'],
    cities: Object.values(cities).map((c) => ({ name: c.name, nameBn: BN[c.name], lat: c.lat, lon: c.lon, p2026: c.P2026, p2025: c.P2025, climP: c.climP, climT: c.climT })),
    outline,
  });
}

// ---------- GISTEMP global annual ----------
{
  const line = raw('gistemp_v4_global_annual.txt').split('\n').find((l) => /^1880/.test(l));
  const series = line.trim().split(/\s+/).map((s) => { const [y, v] = s.split(':'); return { year: +y, anomaly: Number(v) }; });
  out('gistemp_global.json', {
    generated, source: 'NASA GISS Surface Temperature Analysis (GISTEMP v4), Land-Ocean global annual mean (J-D)',
    baseline: '1951-1980', unit: '°C', series,
  });
}

// ---------- Earth vital signs: GISTEMP + Mauna Loa CO2 + NSIDC Arctic September extent ----------
{
  const rows = (f) => raw(f).split('\n').filter((l) => /^\d{4}\s/.test(l)).map((l) => l.trim().split(/\s+/));
  const g = raw('gistemp_v4_global_annual.txt').split('\n').find((l) => /^1880/.test(l)).trim().split(/\s+/).map((s) => { const [y, v] = s.split(':'); return { year: +y, value: Number(v) }; });
  out('vital_signs.json', {
    generated,
    series: [
      { id: 'temp', unit: '°C', baseline: 0, higherIsWarmer: true, source: 'NASA GISS GISTEMP v4, global land-ocean annual mean, anomaly vs 1951–1980', points: g },
      { id: 'co2', unit: 'ppm', source: 'NOAA GML Mauna Loa annual mean CO₂ (the record on NASA Vital Signs)', points: rows('noaa_gml_co2_annmean_mlo.txt').map((r) => ({ year: +r[0], value: +r[1] })) },
      { id: 'ice', unit: 'million km²', source: 'NSIDC Sea Ice Index v4.0, Arctic September extent (NASA Vital Signs). 2025–2026 near-real-time, may be revised', points: rows('nsidc_g02135_N_09_extent_v4.0.txt').map((r) => ({ year: +r[0], value: +r[1] })) },
    ],
  });
}
