// Re-fetches the global rain sample from NASA POWER and rewrites scripts/raw/power_precip_10deg_selected.txt.
// Then run `npm run build:data`. No API key needed. Usage: node scripts/fetch-precip.mjs [YYYY-MM-DD first] [YYYY-MM-DD last]
import { writeFileSync } from 'node:fs';
const [first = '2026-10-02', last = '2026-10-05'] = process.argv.slice(2);
const days = []; for (let d = new Date(first + 'T00:00:00Z'); d <= new Date(last + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) days.push(d.toISOString().slice(0, 10).replaceAll('-', ''));
const pts = []; for (let lat = -50; lat <= 50; lat += 10) for (let lon = -175; lon <= 175; lon += 10) pts.push([lat, lon]);
const res = new Map(); let i = 0, fail = 0;
async function worker() {
  while (i < pts.length) {
    const [lat, lon] = pts[i++];
    const u = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=RE&longitude=${lon}&latitude=${lat}&start=${days[0]}&end=${days.at(-1)}&format=JSON`;
    for (let a = 0; a < 3; a++) {
      try { const j = await (await fetch(u)).json(); res.set(`${lat},${lon}`, j.properties.parameter.PRECTOTCORR); break; }
      catch { await new Promise((r) => setTimeout(r, 800)); if (a === 2) fail++; }
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const rows = [...res].map(([k, v]) => [k, days.map((d) => v[d])]).filter(([, v]) => v.every((x) => x >= 0));
rows.sort((a, b) => Math.max(...b[1]) - Math.max(...a[1]));
const sel = rows.slice(0, 48).map(([k, v]) => `${k}:${v.join(',')}`).join(';');
writeFileSync(new URL('./raw/power_precip_10deg_selected.txt', import.meta.url),
  `# NASA POWER Daily API, PRECTOTCORR (mm/day), community RE, fetched ${new Date().toISOString().slice(0, 10)}\n# Grid: lat -50..50 step 10, lon -175..175 step 10 = ${pts.length} points, ${fail} failures\n# Kept: 48 points with the highest single-day rain on ${first}..${last}\n# lat,lon: ${days.join(',')}\n${sel}\n`);
console.log(`Wrote raw/power_precip_10deg_selected.txt (${rows.length} valid points). Now run: npm run build:data`);
