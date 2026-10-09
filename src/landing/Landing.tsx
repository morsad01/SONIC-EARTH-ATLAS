import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, Compass, Globe2, Headphones, Play } from 'lucide-react';
import type { EarthObservation } from '../types/dataset';
import { usePrefs } from '../lib/prefs';
import { TRACKS, type Track } from '../lib/nav';
import { Footer } from '../components/Footer';
import { gibsUrl } from '../lib/gibs';
import { useScrollStage, type Stage } from './useScrollStage';

const TopicCarousel = lazy(() => import('../stories/TopicCarousel').then((m) => ({ default: m.TopicCarousel })));

interface Props {
  fireObs: EarthObservation[];
  onPick: (t: Track) => void;
  onExplore: () => void;
  onListen: () => void;
  onTour: () => void;
  onSilent: () => void;
  onAbout: () => void;
  onStage: (s: Stage) => void;
  onTopic: (storyId: string) => void;
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

/**
 * Landing page. Sections: (1) hero, (2) split copy + globe, (3) immersive globe, (4) track records,
 * (5) topic carousel and how data becomes sound, (6) footer. The globe itself lives behind this layer (App's main canvas);
 * the scroll stage of sections 1–3 sets its framing.
 */
export const Landing: React.FC<Props> = ({ fireObs, onPick, onExplore, onListen, onTour, onSilent, onAbout, onStage, onTopic }) => {
  const { t, reduceMotion } = usePrefs();
  const { ref, stage } = useScrollStage<HTMLDivElement>();
  useEffect(() => { onStage(stage); }, [stage, onStage]);

  const [sylhet, setSylhet] = useState<number[]>([]);
  const [temps, setTemps] = useState<number[]>([]);
  useEffect(() => {
    fetch('/data/bangladesh_monsoon.json').then((r) => r.json()).then((j) => setSylhet(j.cities.find((c: { name: string }) => c.name === 'Sylhet')?.p2026 ?? [])).catch(() => {});
    fetch('/data/gistemp_global.json').then((r) => r.json()).then((j) => setTemps(j.series.map((p: { anomaly: number }) => p.anomaly))).catch(() => {});
  }, []);
  const fireWave = [...fireObs].sort((a, b) => a.longitude - b.longitude).map((o) => o.value);
  const visual: Record<(typeof TRACKS)[number]['id'], React.ReactNode> = {
    atlas: <Wave values={fireWave} color="var(--fire)" />,
    frames: <img src={gibsUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor', '2026-10-03', 'jpeg', 512)} alt="" className="w-full h-10 object-cover rounded opacity-90" loading="lazy" />,
    monsoon: <Wave values={sylhet} color="var(--rain)" />,
    pulse: <Wave values={temps} color="var(--warm)" signed />,
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  return (
    <div ref={ref} id="landing" tabIndex={-1} data-stage={stage} className="hero-layer landing outline-none fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 overflow-y-auto overflow-x-hidden">
      {/* 1 · Hero */}
      <section data-stage-index="0" className="landing-section landing-scrim flex flex-col" aria-labelledby="hero-title">
        <div className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-10 py-8 sm:py-12 flex flex-col">
          <p className="text-sm text-[var(--ink-3)] max-w-[60ch]">{t('heroKicker')}</p>
          <div className="landing-copy my-auto py-8 max-w-2xl">
            <p className="font-display font-semibold text-[var(--brass)] text-lg">{t('appName')}</p>
            <h1 id="hero-title" className="mt-2 font-display font-extrabold text-[clamp(2.5rem,7.5vw,5.25rem)] leading-[0.95]">{t('heroHeadline')}</h1>
            <p className="mt-5 text-lg sm:text-xl text-[var(--ink-2)] max-w-[52ch] leading-relaxed">{t('heroDataLine')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={onExplore} className="btn btn-brass min-h-[48px] px-5 text-base"><Globe2 className="w-5 h-5" />{t('ctaExplore')}</button>
              <button onClick={onListen} className="btn min-h-[48px] px-5 text-base"><Play className="w-5 h-5" />{t('ctaStory')}</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
              <button onClick={onTour} className="btn btn-ghost"><Compass className="w-4 h-4" />{t('startTour')}</button>
              <button onClick={onSilent} className="btn btn-ghost">{t('exploreSilently')}</button>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-3)] flex items-start gap-2"><Headphones className="w-4 h-4 mt-0.5 shrink-0" />{t('heroHeadphones')} {t('heroNote')}</p>
          </div>
          <button className="btn btn-ghost self-start" onClick={() => scrollTo('landing-split')}><ArrowDown className="w-4 h-4" />{t('scrollHint')}</button>
        </div>
      </section>

      {/* 2 · Split: copy left, globe right */}
      <section id="landing-split" data-stage-index="1" className="landing-section landing-scrim flex items-center" aria-labelledby="split-title">
        <div className="landing-copy w-full max-w-6xl mx-auto px-5 sm:px-10 py-12">
          <div className="max-w-xl">
            <h2 id="split-title" className="font-display font-bold text-[clamp(1.75rem,4.5vw,3rem)] leading-tight">{t('splitTitle')}</h2>
            <p className="mt-4 text-[var(--ink-2)] text-lg leading-relaxed">{t('splitBody')}</p>
            <ul className="mt-5 grid gap-2">
              {(['splitPoint1', 'splitPoint2', 'splitPoint3'] as const).map((k) => (
                <li key={k} className="flex gap-2 items-start"><span className="dot mt-2" style={{ background: 'var(--accent)' }} aria-hidden="true" />{t(k)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3 · Immersive globe with an exploration prompt */}
      <section data-stage-index="2" className="landing-section flex items-end" aria-labelledby="immersive-title">
        <div className="landing-copy w-full max-w-6xl mx-auto px-5 sm:px-10 pb-10">
          <div className="panel p-5 max-w-md">
            <h2 id="immersive-title" className="font-display font-bold text-2xl">{t('immersiveTitle')}</h2>
            <p className="mt-2 text-[var(--ink-2)] leading-relaxed">{t('immersiveBody')}</p>
            <button onClick={onExplore} className="mt-4 btn btn-brass min-h-[44px]"><Globe2 className="w-4 h-4" />{t('immersiveCta')}</button>
          </div>
        </div>
      </section>

      <div className="bg-[color-mix(in_srgb,var(--abyss)_95%,transparent)]">
        {/* 4 · Track records with real waveforms */}
        <section className="reveal max-w-6xl mx-auto px-5 sm:px-10 pt-14" aria-labelledby="pick-title">
          <h2 id="pick-title" className="font-display text-2xl font-semibold mb-4">{t('pickTrack')}</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TRACKS.map((tr) => (
              <li key={tr.id}>
                <button onClick={() => onPick(tr.id)} className="group w-full h-full text-left rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_85%,transparent)] hover:border-[var(--brass)] p-4 cursor-pointer transition-colors duration-[var(--dur-fast)]">
                  <div className="flex items-center gap-3">
                    <span className="tnum font-display font-bold text-sm w-9 h-9 shrink-0 rounded-full grid place-items-center border-2 border-[var(--brass)] text-[var(--brass)] group-hover:bg-[var(--brass)] group-hover:text-[var(--brass-ink)]">{tr.code}</span>
                    <span className="font-display text-lg font-semibold leading-tight">{t(tr.key)}</span>
                  </div>
                  <div className="mt-3">{visual[tr.id]}</div>
                  <p className="mt-2 text-sm text-[var(--ink-2)] leading-snug">{t(`${tr.key}Desc` as 'track1Desc')}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* 5 · Topic carousel (Feature D), then how data becomes sound */}
        <Suspense fallback={<div className="min-h-[24rem]" />}><TopicCarousel onListen={onTopic} /></Suspense>
        <section className="reveal max-w-6xl mx-auto px-5 sm:px-10 py-14" aria-labelledby="how-title">
          <h2 id="how-title" className="font-display text-2xl font-semibold mb-4">{t('howTitle')}</h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {([['how1', 'how1d'], ['how2', 'how2d'], ['how3', 'how3d'], ['how4', 'how4d']] as const).map(([h, d], k) => (
              <li key={h} className="border-t-2 border-[var(--brass)] pt-2">
                <div className="font-semibold"><span className="tnum text-[var(--brass)] mr-1.5">{k + 1}</span>{t(h)}</div>
                <p className="text-[var(--ink-2)] mt-1 leading-snug">{t(d)}</p>
              </li>
            ))}
          </ol>
          <button className="mt-6 btn" onClick={onAbout}>{t('readAbout')}</button>
        </section>

        {/* 6 · Footer */}
        <Footer onAbout={onAbout} />
      </div>
    </div>
  );
};
