// Re-fetches the latest monthly MUR SST anomaly from NOAA CoastWatch ERDDAP and rewrites scripts/raw/sst_mur_anom_*_selected.txt.
// Then run `npm run build:data` (update the file name in build-snapshots.mjs if the month changes). No key needed.
import { writeFileSync } from 'node:fs';
const BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41anommday';
const time = (await (await fetch(`${BASE}.json?time[(last)]`)).json()).table.rows[0][0];
const j = await (await fetch(`${BASE}.json?sstAnom[(${time})][(-60):100:(60)][(-179.99):100:(180)]`)).json();
const rows = j.table.rows;
const g = new Map(rows.map((r) => [`${Math.round(r[1])},${Math.round(r[2] + 0.01)}`, r[3]]));
const nearLand = (la, lo) => { for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { let L = lo + b; if (L > 180) L -= 360; if (L < -179) L += 360; if (g.get(`${la + a},${L}`) === null) return true; } return false; };
const cand = [];
for (const [k, v] of g) { if (v === null) continue; const [la, lo] = k.split(',').map(Number); if (Math.abs(la) > 58 || nearLand(la, lo)) continue; cand.push([la, lo, v]); }
const valid = rows.filter((r) => r[3] !== null);
const w = (r) => Math.cos((r[1] * Math.PI) / 180);
const mean = valid.reduce((s, r) => s + r[3] * w(r), 0) / valid.reduce((s, r) => s + w(r), 0);
const warm = valid.filter((r) => r[3] > 0).length / valid.length;
cand.sort((a, b) => Math.abs(b[2]) - Math.abs(a[2]));
const dist = (a, b) => { const dl = Math.abs(a[1] - b[1]); return Math.hypot(a[0] - b[0], Math.min(dl, 360 - dl) * Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180)); };
const sel = []; for (const c of cand) { if (sel.every((s) => dist(s, c) >= 12)) sel.push(c); if (sel.length >= 40) break; }
const month = time.slice(0, 7);
writeFileSync(new URL(`./raw/sst_mur_anom_${month}_selected.txt`, import.meta.url),
  `# NASA JPL MUR SST anomaly, monthly (jplMURSST41anommday, NOAA CoastWatch ERDDAP), time ${time}\n# ${rows.length} cells (1 deg stride), ${valid.length} valid; open-ocean candidates ${cand.length}\n# Area-weighted mean anomaly: ${mean.toFixed(3)} C; fraction warmer than normal: ${warm.toFixed(3)}\nlat,lon,anom_C\n${sel.map((s) => `${s[0]},${s[1]},${s[2].toFixed(2)}`).join('\n')}\n`);
console.log(`Wrote raw/sst_mur_anom_${month}_selected.txt. Now run: npm run build:data`);
