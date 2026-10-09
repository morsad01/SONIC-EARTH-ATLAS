import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, X, Loader2, MapPin } from 'lucide-react';
import { AudioContextManager } from '../audio/audioContext';
import { fetchPlaceClimate, trendPerDecade, countryName, type PlaceClimate } from '../lib/power';
import { usePrefs, speak } from '../lib/prefs';
import { placeLabel } from '../lib/placesBn';
import { PRESETS } from './presets';


const NOTE_MS = 220;
const BN = '০১২৩৪৫৬৭৮৯';
const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN[+d]);

interface Props { place: { lat: number; lon: number } | null; onPick: (p: { lat: number; lon: number }) => void; onClose: () => void }

/** "Hear any place": click the globe or pick a city, then hear 45 years of its NASA POWER climate. The parent keys it by place, so a new place starts fresh. */
export const PlacePanel: React.FC<Props> = ({ place, onPick, onClose }) => {
  const { t, lang, narration } = usePrefs();
  const [data, setData] = useState<PlaceClimate | null>(null);
  const preset = place ? PRESETS.find((p) => Math.abs(p.lat - place.lat) < 0.01 && Math.abs(p.lon - place.lon) < 0.01) : undefined;
  const [name, setName] = useState<string | null>(preset ? (lang === 'bn' ? preset.bn : preset.name) : null);
  const [err, setErr] = useState<string | null>(null);
  const [i, setI] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const stop = () => { if (timer.current) clearInterval(timer.current); timer.current = null; setPlaying(false); };

  useEffect(() => {
    if (!place) return;
    const ac = new AbortController();
    if (!preset) countryName(place.lat, place.lon).then((n) => setName(n ? placeLabel(n, lang) : (lang === 'bn' ? 'সমুদ্র' : 'Open ocean'))).catch(() => {});
    fetchPlaceClimate(place.lat, place.lon, ac.signal).then(setData).catch((e) => { if (!ac.signal.aborted) setErr(e.message); });
    return () => ac.abort();
  }, [place?.lat, place?.lon]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), []);

  const play = async () => {
    if (!data) return;
    const ctx = await AudioContextManager.init();
    const dest = AudioContextManager.getMasterNode()!;
    const tMin = Math.min(...data.temp), tMax = Math.max(...data.temp), rMax = Math.max(...data.rain) || 1;
    setPlaying(true);
    let k = 0;
    const tick = () => {
      const now = ctx.currentTime;
      // Temperature: one note, higher = warmer year for this place
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 220 * Math.pow(4, (data.temp[k] - tMin) / (tMax - tMin || 1));
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.16, now + 0.01); g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.35);
      // Rain: droplets, more for a wetter year
      const drops = Math.round((data.rain[k] / rMax) * 6);
      for (let d = 0; d < drops; d++) {
        const at = now + 0.02 + (d / Math.max(1, drops)) * (NOTE_MS / 1000) * 0.9;
        const q = ctx.createOscillator(), h = ctx.createGain();
        q.type = 'sine'; q.frequency.setValueAtTime(1400, at); q.frequency.exponentialRampToValueAtTime(900, at + 0.04);
        h.gain.setValueAtTime(0, at); h.gain.linearRampToValueAtTime(0.06, at + 0.003); h.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
        q.connect(h); h.connect(dest); q.start(at); q.stop(at + 0.08);
      }
      setI(k);
      if (narration && data.years[k] % 10 === 0) speak(lang === 'bn' ? bnNum(data.years[k]) : String(data.years[k]), lang);
      if (++k >= data.years.length) stop();
    };
    tick(); timer.current = window.setInterval(tick, NOTE_MS);
  };

  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const num = (v: number, d = 1) => (lang === 'bn' ? bnNum(v.toFixed(d)) : v.toFixed(d));
  const coords = place ? `${Math.abs(place.lat).toFixed(1)}°${place.lat >= 0 ? 'N' : 'S'}, ${Math.abs(place.lon).toFixed(1)}°${place.lon >= 0 ? 'E' : 'W'}` : '';

  return (
    <section className="panel p-3" aria-labelledby="place-title">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="place-title" className="font-display font-semibold text-lg flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[var(--brass)]" />{lang === 'bn' ? 'যেকোনো জায়গা শুনুন' : 'Hear any place'}</h2>
          <p className="text-xs text-[var(--ink-3)]">{lang === 'bn' ? 'গ্লোবে যেকোনো জায়গায় ক্লিক করুন বা একটি শহর বাছুন। নাসা POWER, ১৯৮১–২০২৫।' : 'Click anywhere on the globe or choose a city. NASA POWER, 1981–2025, fetched live.'}</p>
        </div>
        {place && <button className="btn btn-ghost btn-icon shrink-0" onClick={() => { stop(); onClose(); }} aria-label={t('closePlace')}><X className="w-4 h-4" /></button>}
      </div>
      <label className="block mt-2">
        <span className="sr-only">{t('chooseCity')}</span>
        <select className="w-full btn justify-start" value="" onChange={(e) => { const p = PRESETS[+e.target.value]; if (p) onPick({ lat: p.lat, lon: p.lon }); }}>
          <option value="">{t('chooseCity')}…</option>
          {PRESETS.map((p, k) => <option key={p.name} value={k}>{lang === 'bn' ? p.bn : p.name}</option>)}
        </select>
      </label>

      {place && (
        <div className="mt-3">
          <div className="font-semibold">{name ?? '…'} <span className="text-[var(--ink-3)] font-normal text-sm tnum">{coords}</span></div>
          {!data && !err && <p className="text-sm text-[var(--ink-2)] mt-2 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{lang === 'bn' ? 'নাসা POWER থেকে আনা হচ্ছে…' : 'Asking NASA POWER…'}</p>}
          {err && <p className="text-sm text-[var(--brass)] mt-2">{lang === 'bn' ? 'নাসা POWER থেকে ডেটা আসেনি। ইন্টারনেট সংযোগ দেখুন।' : `NASA POWER did not answer (${err}). Check the internet connection and try again.`}</p>}
          {data && (() => {
            const n = data.years.length, early = data.temp.slice(0, 10), late = data.temp.slice(-10);
            const tr = trendPerDecade(data.years, data.temp);
            const tMin = Math.min(...data.temp), tMax = Math.max(...data.temp), rMax = Math.max(...data.rain) || 1;
            const W = 300, H = 90, bw = W / n;
            return (
              <>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-2" role="img" aria-label={`Annual temperature and rain, ${data.years[0]} to ${data.years[n - 1]}. Warming trend ${tr.toFixed(2)} degrees per decade.`}>
                  {data.rain.map((r, k) => <rect key={k} x={k * bw + 0.5} width={Math.max(1, bw - 1)} y={H - (r / rMax) * 34} height={(r / rMax) * 34} fill="var(--rain)" opacity={i < 0 || k <= i ? 0.55 : 0.18} />)}
                  <polyline fill="none" stroke="var(--warm)" strokeWidth={2} points={data.temp.map((t, k) => `${k * bw + bw / 2},${6 + (1 - (t - tMin) / (tMax - tMin || 1)) * 46}`).join(' ')} />
                  {i >= 0 && <line x1={i * bw + bw / 2} x2={i * bw + bw / 2} y1={0} y2={H} stroke="var(--brass)" strokeWidth={1.5} />}
                </svg>
                <div className="flex justify-between text-2xs text-[var(--ink-3)] tnum"><span>{lang === 'bn' ? bnNum(data.years[0]) : data.years[0]}</span><span className="text-[var(--warm)]">— {lang === 'bn' ? 'তাপমাত্রা' : 'temperature'}</span><span className="text-[var(--rain)]">▮ {lang === 'bn' ? 'বৃষ্টি' : 'rain'}</span><span>{lang === 'bn' ? bnNum(data.years[n - 1]) : data.years[n - 1]}</span></div>
                <dl className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div><dt className="label">{lang === 'bn' ? 'গড় তাপমাত্রা' : 'Average temperature'}</dt><dd className="tnum">{num(avg(early))} → {num(avg(late))} °C</dd><dd className="text-2xs text-[var(--ink-3)]">{lang === 'bn' ? 'প্রথম ১০ বনাম শেষ ১০ বছর' : 'first vs last 10 years'}</dd></div>
                  <div><dt className="label">{lang === 'bn' ? 'প্রবণতা' : 'Trend'}</dt><dd className="tnum">{tr >= 0 ? '+' : ''}{num(tr, 2)} °C / {lang === 'bn' ? 'দশক' : 'decade'}</dd><dd className="text-2xs text-[var(--ink-3)]">{lang === 'bn' ? 'বৃষ্টি গড়' : 'Rain avg'} {num(avg(data.rain) * 365.25, 0)} mm/{lang === 'bn' ? 'বছর' : 'yr'}</dd></div>
                </dl>
                <button onClick={playing ? stop : play} className="btn btn-brass w-full mt-3">{playing ? <><Square className="w-4 h-4" />{t('stop')}</> : <><Play className="w-4 h-4" />{lang === 'bn' ? `${bnNum(n)} বছর শুনুন` : `Hear ${n} years`}</>}</button>
                <p className="text-2xs text-[var(--ink-3)] mt-2 leading-snug">{lang === 'bn' ? 'উঁচু সুর = এই জায়গার উষ্ণ বছর, বেশি ফোঁটা = ভেজা বছর। নাসা POWER (MERRA-2) মডেল-ভিত্তিক মান, প্রায় ৫০ কিমি এলাকা।' : 'Higher note = a warmer year for this place; more droplets = a wetter year. NASA POWER (MERRA-2) model-based values for a ~50 km cell.'}</p>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
};
