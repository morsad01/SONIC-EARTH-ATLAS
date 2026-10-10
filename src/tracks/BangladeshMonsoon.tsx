import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Loader2, Calendar, Droplets, Info, ChevronLeft, ChevronRight, Award, Compass } from 'lucide-react';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs, speak } from '../lib/prefs';
import { usePlaybackReport } from '../lib/playbackContext';

interface City {
  name: string;
  nameBn: string;
  lat: number;
  lon: number;
  p2026: number[];
  p2025: number[];
  climP: number[];
}

interface Monsoon {
  dates2026: string[];
  dates2025: string[];
  cities: City[];
  outline: [number, number][][];
  source: string;
}

const STEP_MS = 190; // one day per step
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
  const [playScope, setPlayScope] = useState<'focus' | 'all'>('focus');
  const [showGuide, setShowGuide] = useState(false);
  const timer = useRef<number | null>(null);
  const out = useRef<GainNode | null>(null);
  const focusRef = useRef(focus);
  const playScopeRef = useRef(playScope);

  useEffect(() => { focusRef.current = focus; }, [focus]);
  useEffect(() => { playScopeRef.current = playScope; }, [playScope]);

  useEffect(() => {
    fetch('/data/bangladesh_monsoon.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr(true));
  }, []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const dates = data ? (year === 2026 ? data.dates2026 : data.dates2025) : [];
  const series = (c: City) => (year === 2026 ? c.p2026 : c.p2025);
  const fmtDate = (iso: string) => {
    if (!iso) return '';
    const m = +iso.slice(5, 7) - 1, d = +iso.slice(8, 10);
    return lang === 'bn' ? `${bnNum(d)} ${MONTHS_BN[m]}` : `${d} ${MONTHS_EN[m]}`;
  };
  const cityName = (c: City) => (lang === 'bn' ? c.nameBn : c.name);
  const num = (v: number, d = 0) => (lang === 'bn' ? bnNum(v.toFixed(d)) : v.toFixed(d));

  const stats = useMemo(() => {
    if (!data) return [];
    return data.cities.map((c) => {
      const normal = data.dates2026.reduce((s, iso) => s + c.climP[+iso.slice(5, 7) - 1], 0);
      const t26 = c.p2026.reduce((a, b) => a + b, 0);
      const t25 = c.p2025.reduce((a, b) => a + b, 0);
      const maxI = c.p2026.indexOf(Math.max(...c.p2026));
      return { c, normal, t26, t25, maxI, max: c.p2026[maxI] };
    }).sort((a, b) => b.t26 - a.t26);
  }, [data]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (out.current && AudioContextManager.getContext()) {
      out.current.gain.setTargetAtTime(0, AudioContextManager.getContext()!.currentTime, 0.1);
    }
    setPlaying(false);
  };

  usePlaybackReport('monsoon', t('track3'), playing, stop);

  const start = async () => {
    if (!data) return;
    const ctx = await AudioContextManager.init();
    out.current = ctx.createGain();
    out.current.gain.value = 1;
    out.current.connect(AudioContextManager.getMasterNode()!);
    const dest = out.current;
    setPlaying(true);
    let d = day >= dates.length - 1 ? 0 : day;
    const tick = () => {
      const now = ctx.currentTime;
      const curFocus = focusRef.current;
      const curScope = playScopeRef.current;
      const targetCities = curScope === 'focus'
        ? data.cities.filter((c) => c.name === curFocus)
        : data.cities;

      for (const c of targetCities) {
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
          o.frequency.setValueAtTime(base * 1.5, at);
          o.frequency.exponentialRampToValueAtTime(base, at + 0.04);
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(amp, at + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
          p.pan.value = pan;
          o.connect(g); g.connect(p); p.connect(dest);
          o.start(at); o.stop(at + 0.1);
        }
      }
      setDay(d);
      if (d % 30 === 0 && narration) {
        const narratedCity = curScope === 'focus'
          ? (data.cities.find((c) => c.name === curFocus) ?? data.cities[0])
          : [...data.cities].sort((a, b) => series(b)[d] - series(a)[d])[0];
        speak(`${fmtDate(dates[d])}: ${cityName(narratedCity)} ${num(series(narratedCity)[d])} ${lang === 'bn' ? 'মিলিমিটার' : 'millimetres'}`, lang);
      }
      d++;
      if (d >= dates.length) stop();
    };
    tick();
    timer.current = window.setInterval(tick, STEP_MS);
  };

  if (err) return <p className="p-8 text-[var(--warm)]">{t('bdLoadFail')}</p>;
  if (!data) return <div className="h-full grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--brass)]" /></div>;

  const today = [...data.cities].sort((a, b) => series(b)[day] - series(a)[day])[0];
  const fc = data.cities.find((c) => c.name === focus) ?? data.cities[0];
  const fcS = stats.find((s) => s.c.name === focus) ?? stats[0];
  const rankIndex = stats.findIndex((s) => s.c.name === focus);
  const chartW = 640, chartH = 150, bw = chartW / dates.length;
  const yMax = 190;

  return (
    <section className="h-full overflow-y-auto px-4 sm:px-8 pb-10 pt-[calc(var(--header-h)+1.5rem)]" aria-labelledby="bd-title">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="chip text-xs bg-[color-mix(in_srgb,var(--rain)_15%,transparent)] text-[var(--rain)] border-[var(--rain)] font-semibold">
                🌧️ {lang === 'bn' ? 'বাংলাদেশ জলবায়ু লেন্স' : 'Bangladesh Climate Lens'}
              </span>
              <span className="chip text-xs">
                {lang === 'bn' ? 'জুন - অক্টোবর' : 'June - October'}
              </span>
            </div>
            <h1 id="bd-title" className="font-display text-3xl sm:text-4xl font-extrabold">{t('monsoonTitle')}</h1>
            <p className="mt-2 max-w-[68ch] text-[var(--ink-2)] text-base leading-relaxed">{t('monsoonLead')}</p>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="btn btn-ghost text-xs self-start md:self-auto flex items-center gap-1.5 border border-[var(--line)]"
          >
            <Info className="w-4 h-4 text-[var(--brass)]" />
            <span>{showGuide ? (lang === 'bn' ? 'গাইড লুকান' : 'Hide Auditory Guide') : (lang === 'bn' ? 'শব্দ নির্দেশিকা' : 'Auditory Mapping Guide')}</span>
          </button>
        </div>

        {/* Auditory Mapping Guide Banner */}
        {showGuide && (
          <div className="panel p-4 bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] border-[var(--brass)] animate-in fade-in duration-200">
            <h3 className="font-display font-bold text-sm text-[var(--brass)] mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              {lang === 'bn' ? 'কীভাবে শব্দ এবং অবস্থান কাজ করে:' : 'How Sound & Coordinates Work:'}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-[var(--ink-2)]">
              <div className="panel-solid p-2.5 rounded-lg">
                <strong className="text-[var(--ink)] block mb-1">🎧 {lang === 'bn' ? 'স্টেরিও অবস্থান (দ্রাঘিমাংশ)' : 'Stereo Position (Longitude)'}</strong>
                {lang === 'bn' ? 'পশ্চিমের বিভাগ (রাজশাহী/খুলনা) বাম কানে এবং পূর্বের বিভাগ (সিলেট/চট্টগ্রাম) ডান কানে বাজে।' : 'West divisions (Rajshahi/Khulna) play in left ear, East (Sylhet/Chattogram) in right ear.'}
              </div>
              <div className="panel-solid p-2.5 rounded-lg">
                <strong className="text-[var(--ink)] block mb-1">🎵 {lang === 'bn' ? 'সুরের উচ্চতা (অক্ষাংশ)' : 'Pitch (Latitude)'}</strong>
                {lang === 'bn' ? 'দক্ষিণের বিভাগ (বরিশাল) নিচু সুরে এবং উত্তরের বিভাগ (রংপুর/সিলেট) উঁচু সুরে বাজে।' : 'South divisions (Barishal) sound lower in pitch, North (Rangpur/Sylhet) sound higher.'}
              </div>
              <div className="panel-solid p-2.5 rounded-lg">
                <strong className="text-[var(--ink)] block mb-1">💧 {lang === 'bn' ? 'বৃষ্টির পরিমাণ (স্পন্দন)' : 'Rain Intensity (Droplets)'}</strong>
                {lang === 'bn' ? 'বৃষ্টির মিলিমিটার যত বেশি, ফোঁটার শব্দ তত বেশি ঘন, দ্রুত এবং জোরালো হয়।' : 'Higher rainfall mm produces denser, faster, and louder rain droplet bursts.'}
              </div>
            </div>
          </div>
        )}

        {/* Control Bar & Timeline Scrubber */}
        <div className="panel p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={playing ? stop : start}
                className="btn btn-brass min-w-[140px] min-h-[44px] text-base font-semibold shadow-md"
              >
                {playing ? (
                  <><Square className="w-4 h-4 fill-current" /> {t('stop')}</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> {t('play')} {lang === 'bn' ? bnNum(year) : year} {playScope === 'focus' ? `(${cityName(fc)})` : (lang === 'bn' ? '(সব)' : '(All)')}</>
                )}
              </button>

              {/* Playback Scope Toggle (Focused City vs All Divisions) */}
              <div className="flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--panel-2)]" role="group" aria-label="Audio Playback Scope">
                <button
                  type="button"
                  className={`btn btn-ghost min-h-[36px] px-3 text-xs font-semibold flex items-center gap-1.5 ${playScope === 'focus' ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-sm' : 'text-[var(--ink-2)]'}`}
                  aria-pressed={playScope === 'focus'}
                  onClick={() => setPlayScope('focus')}
                  title={lang === 'bn' ? `শুধুমাত্র ${cityName(fc)} এর শব্দ শুনুন` : `Play audio for ${cityName(fc)} only`}
                >
                  <span>🎯</span>
                  <span>{lang === 'bn' ? `${cityName(fc)} (শুধুমাত্র)` : `${cityName(fc)} Only`}</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-ghost min-h-[36px] px-3 text-xs font-semibold flex items-center gap-1.5 ${playScope === 'all' ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-sm' : 'text-[var(--ink-2)]'}`}
                  aria-pressed={playScope === 'all'}
                  onClick={() => setPlayScope('all')}
                  title={lang === 'bn' ? 'সকল ৮টি বিভাগের সমন্বিত শব্দ শুনুন' : 'Play spatial audio for all 8 divisions'}
                >
                  <span>🌐</span>
                  <span>{lang === 'bn' ? 'সকল ৮ বিভাগ' : 'All 8 Divisions'}</span>
                </button>
              </div>

              {/* Year Toggle */}
              <div className="flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--panel-2)]" role="group" aria-label={t('year')}>
                {[2026, 2025].map((y) => (
                  <button
                    key={y}
                    className={`btn btn-ghost min-h-[36px] px-3 font-semibold ${year === y ? 'bg-[var(--brass)] text-[var(--brass-ink)] shadow-sm' : ''}`}
                    aria-pressed={year === y}
                    onClick={() => { stop(); setYear(y as 2026 | 2025); setDay(0); }}
                  >
                    {lang === 'bn' ? bnNum(y) : y}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Today's Top Rain Indicator */}
            <div className="flex items-center gap-2 text-sm bg-[var(--panel-2)] px-3 py-1.5 rounded-lg border border-[var(--line)]">
              <Calendar className="w-4 h-4 text-[var(--rain)]" />
              <span className="font-semibold text-[var(--ink)]">{fmtDate(dates[day])}</span>
              <span className="text-[var(--ink-3)]">·</span>
              <Droplets className="w-4 h-4 text-[var(--rain)]" />
              <span>
                <strong className="text-[var(--brass)]">{cityName(today)}</strong> {num(series(today)[day], 1)} {t('unitMm')}
              </span>
            </div>
          </div>

          {/* Interactive Timeline Scrubber Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-[var(--ink-3)]">
              <span>{fmtDate(dates[0])}</span>
              <span className="font-semibold text-[var(--brass)] tnum">{lang === 'bn' ? 'দিন' : 'Day'} {num(day + 1)} / {num(dates.length)}</span>
              <span>{fmtDate(dates[dates.length - 1])}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost p-1.5 min-h-[32px]"
                disabled={day <= 0}
                onClick={() => { stop(); setDay((d) => Math.max(0, d - 1)); }}
                aria-label={t('prevDay')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={0}
                max={dates.length - 1}
                value={day}
                onChange={(e) => { stop(); setDay(+e.target.value); }}
                className="w-full h-2 rounded-lg accent-[var(--brass)] cursor-pointer bg-[var(--line)]"
                aria-label="Monsoon timeline date scrubber"
              />
              <button
                className="btn btn-ghost p-1.5 min-h-[32px]"
                disabled={day >= dates.length - 1}
                onClick={() => { stop(); setDay((d) => Math.min(dates.length - 1, d + 1)); }}
                aria-label={t('nextDay')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Bangladesh 2D Map Card */}
          <figure className="panel-solid p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Compass className="w-4 h-4 text-[var(--brass)]" />
                {lang === 'bn' ? 'বাংলাদেশ বৃষ্টিপাত মানচিত্র' : 'Bangladesh Rainfall Map'}
              </h2>
              <span className="text-xs text-[var(--ink-3)] tnum">{lang === 'bn' ? '৮ বিভাগ' : '8 Divisions'}</span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-[#0d1c28] border border-[var(--line)] p-2">
              {/* Compass Direction Badges for Audio Orientation */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-2xs text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800/50 z-10">
                N ↑ {lang === 'bn' ? 'উঁচু সুর' : 'High Pitch'}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-2xs text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-800/50 z-10">
                S ↓ {lang === 'bn' ? 'নিচু সুর' : 'Low Pitch'}
              </div>
              <div className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/60 text-2xs text-cyan-300 font-mono px-1.5 py-1 rounded border border-cyan-800/50 z-10">
                W ← {lang === 'bn' ? 'বাম কান' : 'Left Ear'}
              </div>
              <div className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/60 text-2xs text-cyan-300 font-mono px-1.5 py-1 rounded border border-cyan-800/50 z-10">
                E → {lang === 'bn' ? 'ডান কান' : 'Right Ear'}
              </div>

              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto"
                role="group"
                aria-label={t('bdMapLabel', { date: fmtDate(dates[day]), city: cityName(today) })}
              >
                {data.outline.map((ring, i) => (
                  <polygon key={i} points={ring.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} fill="#13324a" stroke="#3d6683" strokeWidth={1.2} />
                ))}
                {data.cities.map((c) => {
                  const mm = series(c)[day];
                  const r = 4 + Math.sqrt(Math.max(0, mm)) * 2.4;
                  const sel = c.name === focus;
                  return (
                    <g
                      key={c.name}
                      onClick={() => setFocus(c.name)}
                      className="cursor-pointer group"
                      role="button"
                      tabIndex={0}
                      aria-pressed={sel}
                      aria-label={t('bdCityLabel', { city: cityName(c), mm: num(mm, 1) })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setFocus(c.name);
                        }
                      }}
                    >
                      {/* Pulse animation for high rain */}
                      {mm > 15 && (
                        <circle
                          cx={px(c.lon)}
                          cy={py(c.lat)}
                          r={r + 6}
                          fill="none"
                          stroke="var(--rain)"
                          strokeWidth={1}
                          opacity={0.6}
                          className="animate-ping"
                          style={{ transformOrigin: `${px(c.lon)}px ${py(c.lat)}px` }}
                        />
                      )}
                      <circle
                        cx={px(c.lon)}
                        cy={py(c.lat)}
                        r={r}
                        fill="var(--rain)"
                        fillOpacity={0.35 + Math.min(0.6, mm / 120)}
                        stroke={sel ? 'var(--brass)' : '#bfe9ff'}
                        strokeWidth={sel ? 3 : 1}
                      />
                      <text
                        x={c.lon > 91.3 && c.lat < 23.5 ? px(c.lon) - r - 4 : px(c.lon) + r + 4}
                        textAnchor={c.lon > 91.3 && c.lat < 23.5 ? 'end' : 'start'}
                        y={py(c.lat) + 4}
                        fontSize={13}
                        fontWeight={sel ? 'bold' : 'normal'}
                        fill={sel ? 'var(--brass)' : 'var(--ink)'}
                        paintOrder="stroke"
                        stroke="#0d1b27"
                        strokeWidth={3}
                      >
                        {cityName(c)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <figcaption className="text-xs text-[var(--ink-3)] mt-1 flex items-center justify-between">
              <span>{t('bdCircle')}</span>
              <span className="text-[var(--brass)] font-semibold">{cityName(fc)} {lang === 'bn' ? 'নির্বাচিত' : 'Selected'}</span>
            </figcaption>
          </figure>

          {/* Right Column: Division Detail & Stats */}
          <div className="space-y-6 min-w-0">
            {/* Daily Rain Chart */}
            <figure className="panel-solid p-4 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-2">
                <div>
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <span>{t('bdRainTitle', { city: cityName(fc), year: lang === 'bn' ? bnNum(year) : year })}</span>
                    {rankIndex === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--brass)] text-[var(--brass-ink)] font-semibold flex items-center gap-1">
                        <Award className="w-3 h-3" /> #1 {lang === 'bn' ? 'সর্বোচ্চ বৃষ্টিপাত' : 'Wettest'}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-[var(--ink-3)] mt-0.5">
                    {lang === 'bn' ? 'জুন থেকে অক্টোবরের দৈনিক বৃষ্টিপাত ও ২০ বছরের গড় হারের সাথে তুলনা' : 'Daily rain from June to October compared against 20-year normal rate'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink-3)]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[var(--rain)] inline-block" /> {lang === 'bn' ? 'দৈনিক বৃষ্টি' : 'Daily Rain'}</span>
                  <span className="flex items-center gap-1"><span className="w-3 border-t-2 border-dashed border-white inline-block" /> {lang === 'bn' ? 'গড় হার' : '20-Yr Normal'}</span>
                </div>
              </div>

              <div className="relative">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH + 20}`}
                  className="w-full h-auto cursor-pointer"
                  role="img"
                  aria-label={t('bdChartLabel', { city: cityName(fc), year: lang === 'bn' ? bnNum(year) : year, mm: num(Math.max(...series(fc)), 0) })}
                >
                  {[50, 100, 150].map((v) => (
                    <g key={v}>
                      <line x1={0} x2={chartW} y1={chartH - (v / yMax) * chartH} y2={chartH - (v / yMax) * chartH} stroke="#22384a" />
                      <text x={chartW - 2} y={chartH - (v / yMax) * chartH - 3} fontSize={10} textAnchor="end" fill="var(--ink-3)">{v} mm</text>
                    </g>
                  ))}
                  {series(fc).map((v, i) => (
                    <rect
                      key={i}
                      x={i * bw + 0.5}
                      width={Math.max(1, bw - 1)}
                      y={chartH - (Math.min(v, yMax) / yMax) * chartH}
                      height={(Math.min(v, yMax) / yMax) * chartH}
                      fill={i === day ? 'var(--brass)' : 'var(--rain)'}
                      fillOpacity={i <= day ? 0.95 : 0.4}
                      onClick={() => { stop(); setDay(i); }}
                    />
                  ))}
                  {/* Climatology dashed line */}
                  <polyline
                    fill="none"
                    stroke="#f2f2f2"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    points={dates.map((iso, i) => `${i * bw},${chartH - (fc.climP[+iso.slice(5, 7) - 1] / yMax) * chartH}`).join(' ')}
                  />
                  {dates.map((iso, i) => (iso.endsWith('-01') ? <text key={iso} x={i * bw} y={chartH + 14} fontSize={11} fill="var(--ink-3)">{fmtDate(iso)}</text> : null))}
                </svg>
              </div>
              <figcaption className="text-xs text-[var(--ink-3)] flex justify-between items-center">
                <span>{t('bdDashed')}</span>
                <span className="text-[var(--ink)] font-mono tnum">
                  {lang === 'bn' ? 'সর্বোচ্চ একদিনে:' : 'Peak day:'} <strong>{num(fcS.max)} mm</strong> ({fmtDate(dates[fcS.maxI])})
                </span>
              </figcaption>
            </figure>

            {/* Division Cards Grid */}
            <div className="space-y-2">
              <h3 className="font-display font-bold text-sm text-[var(--ink-2)] flex items-center justify-between">
                <span>{lang === 'bn' ? 'বিভাগভিত্তিক মোট বর্ষা বৃষ্টিপাত' : 'Division Monsoon Totals & Normal %'}</span>
                <span className="text-xs font-normal text-[var(--ink-3)]">{lang === 'bn' ? 'ক্লিক করে নির্বাচন করুন' : 'Click to inspect division'}</span>
              </h3>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {stats.map((s, idx) => {
                  const pct = Math.round((s.t26 / s.normal) * 100);
                  const isSel = focus === s.c.name;
                  return (
                    <button
                      key={s.c.name}
                      onClick={() => setFocus(s.c.name)}
                      aria-pressed={isSel}
                      className={`text-left rounded-xl border p-3 cursor-pointer transition-all duration-200 relative overflow-hidden ${
                        isSel
                          ? 'border-[var(--brass)] bg-[var(--panel-2)] shadow-lg ring-1 ring-[var(--brass)]'
                          : 'border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] hover:border-[var(--brass)] hover:bg-[var(--panel-2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{cityName(s.c)}</span>
                        {idx === 0 && (
                          <span className="text-2xs px-1.5 py-0.5 rounded bg-[var(--brass)] text-[var(--brass-ink)] font-semibold">
                            #1
                          </span>
                        )}
                      </div>
                      <div className="tnum text-2xl font-display font-bold mt-1 text-[var(--ink)]">
                        {num(s.t26)} <span className="text-xs font-normal text-[var(--ink-3)]">{t('unitMm')}</span>
                      </div>
                      {/* Normal % progress bar */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-[var(--ink-2)] tnum">
                          <span>{num(pct)}% {t('ofNormal')}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: pct >= 100 ? 'var(--rain)' : 'var(--brass)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-2xs text-[var(--ink-3)] mt-2 tnum border-t border-[var(--line)] pt-1.5">
                        {t('bdYear', { year: lang === 'bn' ? bnNum(2025) : 2025, mm: num(s.t25) })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Division Narrative Summary Card */}
            <div className="panel-solid p-4 rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_80%,transparent)]">
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                {t('bdTotalLine', {
                  total: t('totalSince'),
                  from: fmtDate(data.dates2026[0]),
                  to: fmtDate(data.dates2026[data.dates2026.length - 1]),
                  year: lang === 'bn' ? bnNum(2026) : 2026,
                  city: cityName(fc),
                  mm: num(fcS.t26),
                  wettest: t('wettest'),
                  day: fmtDate(data.dates2026[fcS.maxI]),
                  max: num(fcS.max),
                })}
                {' '}
                <span className="text-xs text-[var(--ink-3)] block mt-2">
                  {t('bdCredit', { src: data.source })}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
