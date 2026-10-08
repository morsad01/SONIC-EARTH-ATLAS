import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Loader2, Upload } from 'lucide-react';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs, speak } from '../lib/prefs';

interface Pt { year: number; value: number }
interface Series { id: string; unit: string; source: string; points: Pt[]; baseline?: number }
type Tab = 'temp' | 'co2' | 'ice' | 'all' | 'own';

const NOTE_MS = 190;
const BN = '০১২৩৪৫৬৭৮৯';
const bnNum = (s: string | number) => String(s).replace(/\d/g, (d) => BN[+d]);
const LO = 196, HI = 880; // G3 … A5
const pitch = (v: number, min: number, max: number) => LO * Math.pow(HI / LO, max === min ? 0.5 : (v - min) / (max - min));

const META: Record<Exclude<Tab, 'all'>, { en: string; bn: string; color: string; wave: OscillatorType; rule: string; ruleBn: string }> = {
  temp: { en: 'Global temperature', bn: 'বৈশ্বিক তাপমাত্রা', color: 'var(--warm)', wave: 'sawtooth', rule: 'Higher pitch = warmer year. A soft low tone marks the 1951–1980 average.', ruleBn: 'উঁচু সুর = উষ্ণ বছর। একটি নরম নিচু সুর ১৯৫১–১৯৮০-র গড় চিহ্নিত করে।' },
  co2: { en: 'Carbon dioxide', bn: 'কার্বন ডাই অক্সাইড', color: '#c9a7ff', wave: 'sine', rule: 'Higher pitch = more CO₂ in the air at Mauna Loa.', ruleBn: 'উঁচু সুর = বাতাসে বেশি CO₂।' },
  ice: { en: 'Arctic sea ice (September)', bn: 'আর্কটিক সমুদ্র বরফ (সেপ্টেম্বর)', color: '#9be7ff', wave: 'triangle', rule: 'Higher pitch = more ice, so the melody falls as the ice shrinks.', ruleBn: 'উঁচু সুর = বেশি বরফ, তাই বরফ কমলে সুর নামে।' },
  own: { en: 'Your data', bn: 'আপনার ডেটা', color: 'var(--brass)', wave: 'triangle', rule: 'Higher pitch = higher value in your file.', ruleBn: 'উঁচু সুর = আপনার ফাইলে বড় মান।' },
};

function parseCsv(text: string): Pt[] {
  const pts: Pt[] = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split(/[,;\t ]+/).map((c) => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const x = Number(cells[0]), y = Number(cells[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ year: x, value: y });
  }
  return pts.sort((a, b) => a.year - b.year).slice(0, 2000);
}

export const VitalSigns: React.FC = () => {
  const { lang, narration } = usePrefs();
  const [data, setData] = useState<Record<string, Series> | null>(null);
  const [tab, setTab] = useState<Tab>('temp');
  const [own, setOwn] = useState<{ name: string; points: Pt[] } | null>(null);
  const [i, setI] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);
  const drone = useRef<{ o: OscillatorNode; g: GainNode } | null>(null);

  useEffect(() => {
    fetch('/data/vital_signs.json').then((r) => r.json()).then((j) => setData(Object.fromEntries(j.series.map((s: Series) => [s.id, s])))).catch(() => setData({}));
  }, []);

  const yr = (y: number) => (lang === 'bn' ? bnNum(y) : String(y));
  const fmt = (v: number, unit: string, d = 2) => `${unit === '°C' && v > 0 ? '+' : ''}${lang === 'bn' ? bnNum(v.toFixed(d)) : v.toFixed(d)} ${unit}`;

  // Series currently shown (for "all", the three are aligned to their common years).
  const view = useMemo(() => {
    if (!data) return null;
    if (tab === 'own') return own ? { kind: 'one' as const, s: { id: 'own', unit: '', source: own.name, points: own.points } } : null;
    if (tab !== 'all') return data[tab] ? { kind: 'one' as const, s: data[tab] } : null;
    const ids = ['temp', 'co2', 'ice'].filter((k) => data[k]);
    const years = data[ids[0]].points.map((p) => p.year).filter((y) => ids.every((k) => data[k].points.some((p) => p.year === y)));
    return { kind: 'all' as const, ids, years };
  }, [data, tab, own]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const ctx = AudioContextManager.getContext();
    if (drone.current && ctx) { const d = drone.current; d.g.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(() => { try { d.o.stop(); } catch { /* stopped */ } }, 800); }
    drone.current = null;
    setPlaying(false);
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { stop(); setI(-1); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const note = (ctx: AudioContext, dest: AudioNode, hz: number, wave: OscillatorType, pan: number, bright: number, gain = 0.16) => {
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), e = ctx.createGain(), p = ctx.createStereoPanner();
    o.type = wave; o.frequency.value = hz;
    f.type = 'lowpass'; f.frequency.value = 500 + bright * 2600;
    e.gain.setValueAtTime(0, now); e.gain.linearRampToValueAtTime(gain, now + 0.01); e.gain.exponentialRampToValueAtTime(0.001, now + (NOTE_MS / 1000) * 1.6);
    p.pan.value = pan;
    o.connect(f); f.connect(e); e.connect(p); p.connect(dest);
    o.start(now); o.stop(now + 0.4);
  };

  const start = async () => {
    if (!view || !data) return;
    const ctx = await AudioContextManager.init();
    const dest = AudioContextManager.getMasterNode()!;
    setPlaying(true);
    let k = 0;
    if (view.kind === 'one') {
      const pts = view.s.points;
      const vals = pts.map((p) => p.value), min = Math.min(...vals), max = Math.max(...vals);
      const m = META[tab as Exclude<Tab, 'all'>];
      if (tab === 'temp') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = pitch(0, min, max) / 2; g.gain.value = 0; g.gain.setTargetAtTime(0.05, ctx.currentTime, 0.3);
        o.connect(g); g.connect(dest); o.start(); drone.current = { o, g };
      }
      const tick = () => {
        const p = pts[k];
        note(ctx, dest, pitch(p.value, min, max), m.wave, (k / Math.max(1, pts.length - 1)) * 1.6 - 0.8, (p.value - min) / (max - min || 1));
        setI(k);
        if (narration && p.year % 20 === 0) speak(yr(p.year), lang);
        if (++k >= pts.length) stop();
      };
      tick(); timer.current = window.setInterval(tick, NOTE_MS);
    } else {
      const ranges = Object.fromEntries(view.ids.map((id) => { const v = data[id].points.map((p) => p.value); return [id, [Math.min(...v), Math.max(...v)]]; }));
      const pans: Record<string, number> = { temp: -0.7, co2: 0, ice: 0.7 };
      const tick = () => {
        const y = view.years[k];
        for (const id of view.ids) {
          const v = data[id].points.find((p) => p.year === y)!.value; const [mn, mx] = ranges[id];
          note(ctx, dest, pitch(v, mn, mx), META[id as 'temp'].wave, pans[id], (v - mn) / (mx - mn), 0.11);
        }
        setI(k);
        if (++k >= view.years.length) stop();
      };
      tick(); timer.current = window.setInterval(tick, NOTE_MS * 1.3);
    }
  };

  if (!data) return <div className="h-full grid place-items-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const W = 900, H = 240, pad = 34;
  const tabs: { id: Tab; label: string }[] = [
    { id: 'temp', label: lang === 'bn' ? 'তাপমাত্রা' : 'Temperature' },
    { id: 'co2', label: 'CO₂' },
    { id: 'ice', label: lang === 'bn' ? 'আর্কটিক বরফ' : 'Arctic sea ice' },
    { id: 'all', label: lang === 'bn' ? 'তিনটি একসাথে' : 'All three together' },
    { id: 'own', label: lang === 'bn' ? 'আপনার ডেটা' : 'Your data' },
  ];

  let chart: React.ReactNode = null, facts: React.ReactNode = null, readout: React.ReactNode = null, rule = '', source = '';
  if (view?.kind === 'one') {
    const s = view.s, pts = s.points, m = META[tab as Exclude<Tab, 'all'>];
    const vals = pts.map((p) => p.value), min = Math.min(...vals), max = Math.max(...vals);
    const lo = tab === 'temp' ? Math.min(-0.6, min) : min - (max - min) * 0.08, hi = max + (max - min) * 0.08;
    const y = (v: number) => 10 + ((hi - v) / (hi - lo)) * (H - 20);
    const bw = (W - pad) / pts.length;
    const first = pts[0], last = pts[pts.length - 1];
    const maxP = pts.reduce((a, b) => (b.value > a.value ? b : a)), minP = pts.reduce((a, b) => (b.value < a.value ? b : a));
    rule = lang === 'bn' ? m.ruleBn : m.rule; source = s.source;
    const unit = s.unit;
    chart = (
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full h-auto" role="img" aria-label={`${m.en}, ${first.year} to ${last.year}: from ${first.value} to ${last.value} ${unit}. Highest ${maxP.year}, lowest ${minP.year}.`}>
        {tab === 'temp' && <><line x1={pad} x2={W} y1={y(0)} y2={y(0)} stroke="#7f96a3" strokeDasharray="4 4" /><text x={0} y={y(0) + 4} fontSize={11} fill="var(--ink-3)">0°</text></>}
        {[min, max].map((v) => <text key={v} x={0} y={y(v) + 4} fontSize={10} fill="var(--ink-3)">{v.toFixed(tab === 'co2' ? 0 : 1)}</text>)}
        {tab === 'temp'
          ? pts.map((p, k) => { const top = Math.min(y(p.value), y(0)); return <rect key={p.year} x={pad + k * bw} y={top} width={Math.max(1, bw - 0.8)} height={Math.max(1, Math.abs(y(p.value) - y(0)))} fill={p.value >= 0 ? 'var(--warm)' : 'var(--cold)'} opacity={i < 0 || k <= i ? 0.95 : 0.25} />; })
          : <>
              <polyline fill="none" stroke={m.color} strokeOpacity={0.35} strokeWidth={2} points={pts.map((p, k) => `${pad + k * bw + bw / 2},${y(p.value)}`).join(' ')} />
              <polyline fill="none" stroke={m.color} strokeWidth={2.5} points={pts.slice(0, i < 0 ? pts.length : i + 1).map((p, k) => `${pad + k * bw + bw / 2},${y(p.value)}`).join(' ')} />
            </>}
        {i >= 0 && <line x1={pad + i * bw + bw / 2} x2={pad + i * bw + bw / 2} y1={0} y2={H} stroke="var(--brass)" strokeWidth={2} />}
        <text x={pad} y={H + 16} fontSize={11} fill="var(--ink-3)">{yr(first.year)}</text>
        <text x={W} y={H + 16} fontSize={11} fill="var(--ink-3)" textAnchor="end">{yr(last.year)}</text>
      </svg>
    );
    const cur = i >= 0 ? pts[i] : null;
    readout = <><div className="tnum font-display text-4xl font-bold">{yr(cur ? cur.year : first.year)}</div><div className="tnum text-xl" style={{ color: m.color }}>{cur ? fmt(cur.value, unit) : ''}</div></>;
    facts = (
      <dl className="mt-5 grid sm:grid-cols-3 gap-3">
        <div className="panel-solid p-4"><dt className="label">{yr(first.year)} → {yr(last.year)}</dt><dd className="font-display text-2xl font-bold mt-1 tnum">{fmt(first.value, unit)} → {fmt(last.value, unit)}</dd></div>
        <div className="panel-solid p-4"><dt className="label">{lang === 'bn' ? 'সর্বোচ্চ' : 'Highest'}</dt><dd className="font-display text-2xl font-bold mt-1">{yr(maxP.year)} <span className="text-base tnum">{fmt(maxP.value, unit)}</span></dd></div>
        <div className="panel-solid p-4"><dt className="label">{lang === 'bn' ? 'সর্বনিম্ন' : 'Lowest'}</dt><dd className="font-display text-2xl font-bold mt-1">{yr(minP.year)} <span className="text-base tnum">{fmt(minP.value, unit)}</span></dd></div>
      </dl>
    );
  } else if (view?.kind === 'all') {
    const bw = (W - pad) / view.years.length;
    rule = lang === 'bn' ? 'প্রতি বছর তিনটি সুর একসাথে: তাপমাত্রা বাম কানে, CO₂ মাঝে, বরফ ডান কানে। প্রথম দুটি উপরে ওঠে, বরফ নিচে নামে।' : 'Each year plays three notes at once: temperature in your left ear, CO₂ in the centre, Arctic ice on the right. Two lines climb while the ice falls.';
    source = 'NASA GISS GISTEMP v4 · NOAA GML Mauna Loa · NSIDC Sea Ice Index';
    chart = (
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full h-auto" role="img" aria-label={`Temperature, CO2 and Arctic sea ice, ${view.years[0]} to ${view.years.at(-1)}, each scaled from its own lowest to highest value.`}>
        {view.ids.map((id) => {
          const pts = view.years.map((yv) => data[id].points.find((p) => p.year === yv)!.value);
          const mn = Math.min(...pts), mx = Math.max(...pts);
          return <polyline key={id} fill="none" stroke={META[id as 'temp'].color} strokeWidth={2.5} points={pts.map((v, k) => `${pad + k * bw + bw / 2},${10 + (1 - (v - mn) / (mx - mn)) * (H - 20)}`).join(' ')} />;
        })}
        {i >= 0 && <line x1={pad + i * bw + bw / 2} x2={pad + i * bw + bw / 2} y1={0} y2={H} stroke="var(--brass)" strokeWidth={2} />}
        <text x={pad} y={H + 16} fontSize={11} fill="var(--ink-3)">{yr(view.years[0])}</text>
        <text x={W} y={H + 16} fontSize={11} fill="var(--ink-3)" textAnchor="end">{yr(view.years.at(-1)!)}</text>
      </svg>
    );
    readout = <div className="tnum font-display text-4xl font-bold">{yr(i >= 0 ? view.years[i] : view.years[0])}</div>;
    facts = (
      <ul className="mt-4 flex flex-wrap gap-4 text-sm">
        {view.ids.map((id) => <li key={id} className="flex items-center gap-2"><span className="dot" style={{ background: META[id as 'temp'].color }} /><span>{lang === 'bn' ? META[id as 'temp'].bn : META[id as 'temp'].en}{i >= 0 && <span className="tnum text-[var(--ink-2)]">: {fmt(data[id].points.find((p) => p.year === view.years[i])!.value, data[id].unit)}</span>}</span></li>)}
      </ul>
    );
  }

  return (
    <section className="h-full overflow-y-auto px-4 sm:px-8 py-6" aria-labelledby="vital-title">
      <div className="max-w-6xl mx-auto">
        <h2 id="vital-title" className="font-display text-3xl sm:text-4xl font-extrabold">{lang === 'bn' ? 'পৃথিবীর প্রাণচিহ্ন' : "Earth's vital signs"}</h2>
        <p className="mt-2 max-w-[68ch] text-[var(--ink-2)]">{lang === 'bn' ? 'NASA যে তিনটি মূল সংকেত দিয়ে জলবায়ু পরিবর্তন দেখায়, প্রতি বছরে একটি সুর।' : 'Three of the signals NASA uses to show climate change, one note per year. Or bring your own data.'}</p>
        <p className="mt-1 text-sm text-[var(--ink-3)]">
          {lang === 'bn' ? 'এই তথ্য নাসার আর্থ ইনফরমেশন সেন্টারেও দেখা যায়: ' : 'These records also appear in NASA’s Earth Information Center: '}
          <a href="https://earth.gov/themes/greenhouse-gases" target="_blank" rel="noreferrer" className="underline text-[var(--brass)]">{lang === 'bn' ? 'গ্রিনহাউস গ্যাস' : 'greenhouse gases'}</a>
          {' · '}
          <a href="https://earth.gov/themes/sea-level-change" target="_blank" rel="noreferrer" className="underline text-[var(--brass)]">{lang === 'bn' ? 'সমুদ্রস্তর পরিবর্তন' : 'sea level change'}</a>
        </p>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Series">
          {tabs.map((tb) => <button key={tb.id} role="tab" aria-selected={tab === tb.id} aria-pressed={tab === tb.id} className="btn" onClick={() => setTab(tb.id)}>{tb.label}</button>)}
        </div>

        {tab === 'own' && (
          <div className="mt-4 panel-solid p-4 max-w-2xl">
            <label className="btn cursor-pointer"><Upload className="w-4 h-4" />{lang === 'bn' ? 'CSV ফাইল বাছুন' : 'Choose a CSV file'}
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const pts = parseCsv(await f.text()); setOwn(pts.length >= 2 ? { name: f.name, points: pts } : null); setI(-1); }} />
            </label>
            <p className="text-sm text-[var(--ink-2)] mt-2">{lang === 'bn' ? 'দুই কলাম: বছর (বা যেকোনো সংখ্যা) এবং মান। যেমন NASA-র যেকোনো টাইম সিরিজ। ফাইলটি আপনার ব্রাউজারের বাইরে যায় না।' : 'Two columns: year (or any number) and value, for example any NASA time series downloaded as CSV. The file never leaves your browser.'}</p>
            {own && <p className="text-sm mt-1">{own.name}: {own.points.length} rows</p>}
          </div>
        )}

        {view && (
          <>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button onClick={playing ? stop : start} className="btn btn-brass min-w-[120px]">{playing ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> {lang === 'bn' ? 'চালান' : 'Play'}</>}</button>
              {readout}
            </div>
            <p className="mt-3 text-sm text-[var(--ink-2)]">{rule}</p>
            <figure className="panel-solid p-4 mt-3">{chart}<figcaption className="text-xs text-[var(--ink-3)] mt-2">{source}</figcaption></figure>
            {facts}
          </>
        )}
      </div>
    </section>
  );
};
