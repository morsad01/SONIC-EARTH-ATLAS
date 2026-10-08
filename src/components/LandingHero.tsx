import React, { useEffect, useState } from 'react';
import { Compass, Headphones, Play } from 'lucide-react';
import type { EarthObservation } from '../types/dataset';
import { usePrefs } from '../lib/prefs';
import { TRACKS, type Track } from './Header';
import { gibsUrl } from '../lib/gibs';

interface Props {
  fireObs: EarthObservation[];
  onPick: (t: Track) => void;
  onTour: () => void;
  onListen: () => void;
  onSilent: () => void;
}

/** Bars drawn from the real data each track plays, so each "record" shows its own waveform. */
const Wave: React.FC<{ values: number[]; color: string; signed?: boolean }> = ({ values, color, signed }) => {
  if (!values.length) return <div className="h-10" />;
  const max = Math.max(...values.map(Math.abs)) || 1, w = 240, h = 40, bw = w / values.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none" aria-hidden="true">
      {values.map((v, i) => {
        const bh = Math.max(1, (Math.abs(v) / max) * (signed ? h / 2 : h) * 0.95);
        const y = signed ? (v >= 0 ? h / 2 - bh : h / 2) : (h - bh) / 2;
        return <rect key={i} x={i * bw} y={y} width={Math.max(0.8, bw * 0.7)} height={bh} fill={signed ? (v >= 0 ? 'var(--warm)' : 'var(--cold)') : color} rx={0.5} />;
      })}
    </svg>
  );
};

export const LandingHero: React.FC<Props> = ({ fireObs, onPick, onTour, onListen, onSilent }) => {
  const { t, lang } = usePrefs();
  const [dhaka, setDhaka] = useState<number[]>([]);
  const [temps, setTemps] = useState<number[]>([]);
  useEffect(() => {
    fetch('/data/bangladesh_monsoon.json').then((r) => r.json()).then((j) => setDhaka(j.cities.find((c: { name: string }) => c.name === 'Sylhet')?.p2026 ?? [])).catch(() => {});
    fetch('/data/gistemp_global.json').then((r) => r.json()).then((j) => setTemps(j.series.map((p: { anomaly: number }) => p.anomaly))).catch(() => {});
  }, []);
  const fireWave = [...fireObs].sort((a, b) => a.longitude - b.longitude).map((o) => o.value);

  const visual: Record<Track, React.ReactNode> = {
    atlas: <Wave values={fireWave} color="var(--fire)" />,
    frames: <img src={gibsUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor', '2026-10-03', 'jpeg', 512)} alt="" className="w-full h-10 object-cover rounded opacity-90" loading="lazy" />,
    monsoon: <Wave values={dhaka} color="var(--rain)" />,
    pulse: <Wave values={temps} color="var(--warm)" signed />,
  };

  return (
    <div className="hero-layer fixed inset-0 z-50 overflow-y-auto bg-gradient-to-r from-[#071019] via-[#071019e6] to-transparent">
      <div className="min-h-full max-w-6xl mx-auto px-5 sm:px-10 py-8 sm:py-12 flex flex-col">
        <p className="text-sm text-[var(--ink-3)] max-w-[60ch]">NASA Space Apps Challenge 2026 · The Earth Information Jukebox · independent team entry, not an official NASA product</p>

        <div className="mt-10 sm:mt-14 max-w-2xl">
          <h1 className="font-display font-extrabold text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.92]">{t('appName')}</h1>
          <p className="mt-4 text-lg sm:text-xl text-[var(--ink-2)] max-w-[56ch] leading-relaxed">{t('heroLead')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onListen} className="btn btn-brass min-h-[48px] px-5 text-base"><Play className="w-5 h-5" />{t('listenNow')}</button>
            <button onClick={onTour} className="btn min-h-[48px] px-5 text-base"><Compass className="w-5 h-5" />{t('startTour')}</button>
            <button onClick={onSilent} className="btn min-h-[48px] px-5 text-base">{t('exploreSilently')}</button>
          </div>
          <p className="mt-3 text-sm text-[var(--ink-3)] flex items-center gap-2"><Headphones className="w-4 h-4" />{t('heroHeadphones')} {t('heroNote')}</p>
        </div>

        <section className="mt-10 max-w-2xl" aria-labelledby="pick-title">
          <h2 id="pick-title" className="font-display text-xl font-semibold mb-3">{t('pickTrack')}</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {TRACKS.map((tr) => (
              <li key={tr.id}>
                <button onClick={() => onPick(tr.id)} className="group w-full h-full text-left rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] hover:border-[var(--brass)] p-4 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <span className="tnum font-display font-bold text-sm w-9 h-9 rounded-full grid place-items-center border-2 border-[var(--brass)] text-[var(--brass)] group-hover:bg-[var(--brass)] group-hover:text-[var(--brass-ink)] transition">{tr.code}</span>
                    <span className="font-display text-lg font-semibold leading-tight">{t(tr.key)}</span>
                  </div>
                  <div className="mt-3">{visual[tr.id]}</div>
                  <p className="mt-2 text-sm text-[var(--ink-2)] leading-snug">{t(`${tr.key}Desc` as 'track1Desc')}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 max-w-3xl pb-6" aria-labelledby="how-title">
          <h2 id="how-title" className="font-display text-xl font-semibold mb-3">{lang === 'bn' ? 'ডেটা কীভাবে শব্দ হয়' : 'How data becomes sound'}</h2>
          <ol className="grid sm:grid-cols-4 gap-3 text-sm">
            {(lang === 'bn' ? [
              ['নাসার ডেটা', 'FIRMS, POWER, MUR, GISTEMP, GIBS থেকে আসল মান'],
              ['স্কেল', 'প্রতিটি মান ০ থেকে ১-এ, লেখা সূত্রে'],
              ['সংশ্লেষণ', 'ব্রাউজারে Web Audio দিয়ে সরাসরি শব্দ'],
              ['শুনুন ও দেখুন', 'অবস্থান, মান আর শব্দ একসাথে ব্যাখ্যা করা'],
            ] : [
              ['NASA data', 'Real values from FIRMS, POWER, MUR, GISTEMP and GIBS'],
              ['Scale', 'Each value mapped to 0–1 with a published formula'],
              ['Synthesise', 'Sound generated live with Web Audio in your browser'],
              ['Hear and see', 'Place, value and sound explained side by side'],
            ]).map(([h, d], k) => (
              <li key={h} className="border-t-2 border-[var(--brass)] pt-2">
                <div className="font-semibold"><span className="tnum text-[var(--brass)] mr-1.5">{k + 1}</span>{h}</div>
                <p className="text-[var(--ink-2)] mt-1 leading-snug">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
};
