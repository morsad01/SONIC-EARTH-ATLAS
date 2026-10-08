import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs, speak } from '../lib/prefs';

interface City { name: string; nameBn: string; lat: number; lon: number; p2026: number[]; p2025: number[]; climP: number[] }
interface Monsoon { dates2026: string[]; dates2025: string[]; cities: City[]; outline: [number, number][][]; source: string }

const STEP_MS = 190; // one day
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN_DIGITS[+d]);
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

const W = 360, H = 420, LON0 = 88.0, LON1 = 92.7, LAT0 = 20.6, LAT1 = 26.7;
const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
const py = (lat: number) => H - ((lat - LAT0) / (LAT1 - LAT0)) * H;

export const BangladeshMonsoon: React.FC = () => {
  const { t, lang, narration } = usePrefs();
  const [data, setData] = useState<Monsoon | null>(null);
  const [err, setErr] = useState(false);
  const [year, setYear] = useState<2026 | 2025>(2026);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [focus, setFocus] = useState('Sylhet');
  const timer = useRef<number | null>(null);
  const out = useRef<GainNode | null>(null);

  useEffect(() => { fetch('/data/bangladesh_monsoon.json').then((r) => r.json()).then(setData).catch(() => setErr(true)); }, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const dates = data ? (year === 2026 ? data.dates2026 : data.dates2025) : [];
  const series = (c: City) => (year === 2026 ? c.p2026 : c.p2025);
  const fmtDate = (iso: string) => { const m = +iso.slice(5, 7) - 1, d = +iso.slice(8, 10); return lang === 'bn' ? `${bnNum(d)} ${MONTHS_BN[m]}` : `${d} ${MONTHS_EN[m]}`; };
  const cityName = (c: City) => (lang === 'bn' ? c.nameBn : c.name);
  const num = (v: number, d = 0) => (lang === 'bn' ? bnNum(v.toFixed(d)) : v.toFixed(d));

  const stats = useMemo(() => {
    if (!data) return [];
    return data.cities.map((c) => {
      const normal = data.dates2026.reduce((s, iso) => s + c.climP[+iso.slice(5, 7) - 1], 0);
      const t26 = c.p2026.reduce((a, b) => a + b, 0), t25 = c.p2025.reduce((a, b) => a + b, 0);
      const maxI = c.p2026.indexOf(Math.max(...c.p2026));
      return { c, normal, t26, t25, maxI, max: c.p2026[maxI] };
    }).sort((a, b) => b.t26 - a.t26);
  }, [data]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    out.current?.gain.setTargetAtTime(0, AudioContextManager.getContext()!.currentTime, 0.1);
    setPlaying(false);
  };

  const start = async () => {
    if (!data) return;
    const ctx = await AudioContextManager.init();
    out.current = ctx.createGain(); out.current.gain.value = 1; out.current.connect(AudioContextManager.getMasterNode()!);
    const dest = out.current;
    setPlaying(true);
    let d = day >= dates.length - 1 ? 0 : day;
    const tick = () => {
      const now = ctx.currentTime;
      for (const c of data.cities) {
        const mm = series(c)[d];
        if (!(mm > 0.5)) continue;
        const drops = Math.min(10, Math.round(Math.sqrt(mm) * 1.4));
        const pan = Math.max(-1, Math.min(1, ((c.lon - 88.5) / (92 - 88.5)) * 2 - 1));
        const base = 380 + ((c.lat - 22.3) / (25.8 - 22.3)) * 520; // north = higher
        const amp = 0.05 + Math.min(1, Math.sqrt(mm / 120)) * 0.22;
        for (let k = 0; k < drops; k++) {
          const at = now + (k / drops) * (STEP_MS / 1000) + ((k * 37 + c.lon * 13) % 7) * 0.004;
          const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
          o.type = 'sine';
          o.frequency.setValueAtTime(base * 1.5, at); o.frequency.exponentialRampToValueAtTime(base, at + 0.04);
          g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(amp, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
          p.pan.value = pan;
          o.connect(g); g.connect(p); p.connect(dest);
          o.start(at); o.stop(at + 0.1);
        }
      }
      setDay(d);
      if (d % 30 === 0 && narration) {
        const top = [...data.cities].sort((a, b) => series(b)[d] - series(a)[d])[0];
        speak(`${fmtDate(dates[d])}: ${cityName(top)} ${num(series(top)[d])} ${lang === 'bn' ? 'মিলিমিটার' : 'millimetres'}`, lang);
      }
      d++;
      if (d >= dates.length) stop();
    };
    tick();
    timer.current = window.setInterval(tick, STEP_MS);
  };

  if (err) return <p className="p-8">Bangladesh data could not be loaded.</p>;
  if (!data) return <div className="h-full grid place-items-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const today = [...data.cities].sort((a, b) => series(b)[day] - series(a)[day])[0];
  const fc = data.cities.find((c) => c.name === focus)!;
  const fcS = stats.find((s) => s.c.name === focus)!;
  const chartW = 640, chartH = 150, bw = chartW / dates.length;
  const yMax = 190;

  return (
    <section className="h-full overflow-y-auto px-4 sm:px-8 py-6" aria-labelledby="bd-title">
      <div className="max-w-6xl mx-auto">
        <h2 id="bd-title" className="font-display text-3xl sm:text-4xl font-extrabold">{t('monsoonTitle')}</h2>
        <p className="mt-2 max-w-[68ch] text-[var(--ink-2)]">{t('monsoonLead')}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={playing ? stop : start} className="btn btn-brass min-w-[120px]">{playing ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> {t('play')} {lang === 'bn' ? bnNum(year) : year}</>}</button>
          <div className="flex rounded-lg border border-[var(--line)] p-0.5" role="group" aria-label="Year">
            {[2026, 2025].map((y) => <button key={y} className="btn btn-ghost min-h-[36px]" aria-pressed={year === y} onClick={() => { stop(); setYear(y as 2026 | 2025); setDay(0); }}>{lang === 'bn' ? bnNum(y) : y}</button>)}
          </div>
          <div className="tnum text-sm" aria-live="off">
            <span className="text-[var(--ink-3)]">{fmtDate(dates[day])}</span>{' '}
            <span className="text-[var(--ink)]">· {cityName(today)} {num(series(today)[day], 1)} mm</span>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          <figure className="panel-solid p-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Map of Bangladesh with 8 divisional cities. On ${fmtDate(dates[day])} the wettest is ${cityName(today)}.`}>
              {data.outline.map((ring, i) => (
                <polygon key={i} points={ring.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} fill="#13324a" stroke="#3d6683" strokeWidth={1} />
              ))}
              {data.cities.map((c) => {
                const mm = series(c)[day];
                const r = 4 + Math.sqrt(Math.max(0, mm)) * 2.4;
                const sel = c.name === focus;
                return (
                  <g key={c.name} onClick={() => setFocus(c.name)} className="cursor-pointer" role="button" tabIndex={0} aria-label={`${cityName(c)}: ${num(mm, 1)} mm`} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFocus(c.name)}>
                    <circle cx={px(c.lon)} cy={py(c.lat)} r={r} fill="var(--rain)" fillOpacity={0.35 + Math.min(0.6, mm / 120)} stroke={sel ? 'var(--brass)' : '#bfe9ff'} strokeWidth={sel ? 2.5 : 1} />
                    <text x={c.lon > 91.3 && c.lat < 23.5 ? px(c.lon) - r - 4 : px(c.lon) + r + 4} textAnchor={c.lon > 91.3 && c.lat < 23.5 ? 'end' : 'start'} y={py(c.lat) + 4} fontSize={13} fill="var(--ink)" paintOrder="stroke" stroke="#0d1b27" strokeWidth={3}>{cityName(c)}</text>
                  </g>
                );
              })}
            </svg>
            <figcaption className="text-xs text-[var(--ink-3)] mt-2">Circle size = rain that day. Click a city to see its season.</figcaption>
          </figure>

          <div className="space-y-5 min-w-0">
            <figure className="panel-solid p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-semibold">{cityName(fc)}: {lang === 'bn' ? 'দৈনিক বৃষ্টি' : 'daily rain'}, {lang === 'bn' ? bnNum(year) : year}</h3>
                <span className="text-sm text-[var(--ink-3)]">mm/day · NASA POWER</span>
              </div>
              <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full h-auto mt-2" role="img" aria-label={`Daily rain in ${fc.name}, ${year}. Wettest day ${num(Math.max(...series(fc)), 0)} millimetres.`}>
                {[50, 100, 150].map((v) => <g key={v}><line x1={0} x2={chartW} y1={chartH - (v / yMax) * chartH} y2={chartH - (v / yMax) * chartH} stroke="#22384a" /><text x={chartW - 2} y={chartH - (v / yMax) * chartH - 3} fontSize={10} textAnchor="end" fill="var(--ink-3)">{v}</text></g>)}
                {series(fc).map((v, i) => <rect key={i} x={i * bw + 0.5} width={Math.max(1, bw - 1)} y={chartH - (Math.min(v, yMax) / yMax) * chartH} height={(Math.min(v, yMax) / yMax) * chartH} fill={i === day ? 'var(--brass)' : 'var(--rain)'} fillOpacity={i <= day ? 0.95 : 0.4} />)}
                {/* normal daily rate for each month, as a step line */}
                <polyline fill="none" stroke="#f2f2f2" strokeDasharray="4 3" strokeWidth={1.5} points={dates.map((iso, i) => `${i * bw},${chartH - (fc.climP[+iso.slice(5, 7) - 1] / yMax) * chartH}`).join(' ')} />
                {dates.map((iso, i) => (iso.endsWith('-01') ? <text key={iso} x={i * bw} y={chartH + 14} fontSize={11} fill="var(--ink-3)">{fmtDate(iso)}</text> : null))}
              </svg>
              <figcaption className="text-xs text-[var(--ink-3)] mt-1">Dashed line: average daily rain for that month, 2001–2020 (NASA POWER climatology).</figcaption>
            </figure>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {stats.map((s) => {
                const pct = Math.round((s.t26 / s.normal) * 100);
                return (
                  <button key={s.c.name} onClick={() => setFocus(s.c.name)} aria-pressed={focus === s.c.name}
                    className={`text-left rounded-xl border p-3 cursor-pointer ${focus === s.c.name ? 'border-[var(--brass)] bg-[var(--panel-2)]' : 'border-[var(--line)] bg-[var(--panel)]'}`}>
                    <div className="font-semibold">{cityName(s.c)}</div>
                    <div className="tnum text-2xl font-display font-bold mt-1">{num(s.t26)} <span className="text-sm font-normal text-[var(--ink-3)]">mm</span></div>
                    <div className="text-xs text-[var(--ink-2)] mt-1 tnum">{num(pct)}% {t('ofNormal')}</div>
                    <div className="text-xs text-[var(--ink-3)] tnum">2025: {num(s.t25)} mm</div>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-[var(--ink-2)] max-w-[75ch]">
              {t('totalSince')} ({fmtDate(data.dates2026[0])}–{fmtDate(data.dates2026[data.dates2026.length - 1])} 2026). {cityName(fc)}: {num(fcS.t26)} mm, {t('wettest')} {fmtDate(data.dates2026[fcS.maxI])} ({num(fcS.max)} mm).
              {' '}Source: {data.source}. Values are model-based estimates for the city location (about 50 km cells), not rain-gauge readings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
