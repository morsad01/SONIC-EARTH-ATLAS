// Usage: FIRMS_MAP_KEY=xxxx npm run fetch:firms   (free key: https://firms.modaps.eosdis.nasa.gov/api/map_key/)
import { writeFileSync } from 'node:fs';
const KEY = process.env.FIRMS_MAP_KEY;
if (!KEY) { console.error('Set FIRMS_MAP_KEY first.'); process.exit(1); }
const DAYS = 6, CELL = 2, TOP = 80;
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const dates = Array.from({ length: DAYS }, (_, i) => day(DAYS - i));
const perDay = [];
for (const d of dates) {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEY}/VIIRS_SNPP_NRT/world/1/${d}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${d}: HTTP ${res.status}`);
  const [head, ...rows] = (await res.text()).trim().split('\n');
  const col = Object.fromEntries(head.split(',').map((h, i) => [h, i]));
  const cells = new Map();
  for (const r of rows) {
    const f = r.split(',');
    if (f[col.confidence] === 'l') continue; // drop low-confidence detections
    const lat = Math.floor(+f[col.latitude] / CELL) * CELL + CELL / 2;
    const lon = Math.floor(+f[col.longitude] / CELL) * CELL + CELL / 2;
    const k = `${lat},${lon}`;
    cells.set(k, Math.max(cells.get(k) ?? 0, +f[col.frp]));
  }
  perDay.push(cells);
  console.log(d, rows.length, 'detections');
}
const total = new Map();
perDay.forEach((c) => c.forEach((v, k) => total.set(k, (total.get(k) ?? 0) + v)));
const top = [...total].sort((a, b) => b[1] - a[1]).slice(0, TOP).map(([k]) => k);
const slices = dates.map((d, t) => ({
  timestepIndex: t, dateLabel: d, timestamp: d,
  observations: top.map((k) => {
    const [lat, lon] = k.split(',').map(Number);
    const v = perDay[t].get(k) ?? 0, prev = t ? perDay[t - 1].get(k) ?? 0 : v;
    return { id: `firms-${k}`, phenomenon: 'fire', latitude: lat, longitude: lon, timestamp: d,
      variable: 'Fire Radiative Power (max in 2° cell)', value: v, unit: 'MW', normalizedValue: 0,
      delta: v - prev, source: 'NASA FIRMS VIIRS S-NPP NRT', regionName: `${lat.toFixed(0)}°, ${lon.toFixed(0)}°` };
  }),
}));
writeFileSync('public/data/firms_snapshot.json', JSON.stringify({ generated: new Date().toISOString(), slices }));
console.log('Wrote public/data/firms_snapshot.json');
