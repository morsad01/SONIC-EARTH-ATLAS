import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { EarthObservation } from '../types/dataset';
import { usePrefs } from '../lib/prefs';
import { fmtNum } from '../lib/strings';
import { EIC_FRAMES } from '../lib/eicFrames';
import type { Track } from '../lib/nav';
import { Footer } from '../components/Footer';
import { applyParallax } from './parallax';
import { WorldCarousel, type WorldData } from './WorldCarousel';
import type { WorldId } from './worlds';

const TopicCarousel = lazy(() => import('../stories/TopicCarousel').then((m) => ({ default: m.TopicCarousel })));

interface Props {
  fireObs: EarthObservation[];
  onPick: (t: Track) => void;
  onListen: () => void;
  onTour: () => void;
  onSilent: () => void;
  onAbout: () => void;
  onTopic: (storyId: string) => void;
}

/**
 * Landing page. (1) The world carousel: four Earths, one per track, with three levels of depth (overview → detail → immersive);
 * (2) the topic carousel and how data becomes sound; (3) the footer. The 3D planets are the carousel's own scene (WorldScene); the Atlas globe is not loaded here.
 * Only the starfield layers move with the scroll (parallax). The 3D Earth stays pinned behind the sections below as their backdrop.
 */
export const Landing: React.FC<Props> = ({ fireObs, onPick, onListen, onTour, onSilent, onAbout, onTopic }) => {
  const { t, lang, reduceMotion } = usePrefs();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; applyParallax(root.scrollTop, []); }); };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => { root.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); applyParallax(0, []); };
  }, []);

  const [rain, setRain] = useState<{ cityDots: WorldData['cityDots']; sylhet: number[]; from: string; to: string }>({ cityDots: [], sylhet: [], from: '', to: '' });
  const [gis, setGis] = useState<{ year: number; anomaly: number }[]>([]);
  useEffect(() => {
    fetch('/data/bangladesh_monsoon.json').then((r) => r.json()).then((j: { dates2026: string[]; cities: { name: string; lat: number; lon: number; p2026?: number[] }[] }) => setRain({
      cityDots: j.cities.map((c) => ({ lat: c.lat, lon: c.lon, w: 1 })),
      sylhet: j.cities.find((c) => c.name === 'Sylhet')?.p2026 ?? [],
      from: j.dates2026[0] ?? '', to: j.dates2026[j.dates2026.length - 1] ?? '',
    })).catch(() => {});
    fetch('/data/gistemp_global.json').then((r) => r.json()).then((j: { series: { year: number; anomaly: number }[] }) => setGis(j.series)).catch(() => {});
  }, []);

  const data = useMemo<WorldData>(() => {
    const byLon = [...fireObs].sort((a, b) => a.longitude - b.longitude);
    const melody: Partial<Record<WorldId, number[]>> = { fire: byLon.map((o) => o.value), monsoon: rain.sylhet, pulse: gis.map((p) => p.anomaly) };
    // Key numbers for the split view: counted from the same bundled files the tracks play.
    const n = (v: number, o?: Intl.NumberFormatOptions) => fmtNum(v, lang, o), day = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '');
    const top = fireObs.reduce<EarthObservation | null>((m, o) => (!m || o.value > m.value ? o : m), null), last = gis[gis.length - 1];
    const metrics: WorldData['metrics'] = {
      fire: fireObs.length ? [{ value: n(fireObs.length), label: t('mFires', { date: day(fireObs[0].timestamp.slice(0, 10)) }) }, ...(top ? [{ value: n(top.value, { maximumFractionDigits: 0 }), label: t('mStrongest', { unit: top.unit }) }] : [])] : [],
      frames: [{ value: n(EIC_FRAMES.length), label: t('mFrames') }],
      monsoon: rain.cityDots.length ? [{ value: n(rain.cityDots.length), label: t('mCities') }, { value: n(rain.sylhet.reduce((a, b) => a + b, 0), { maximumFractionDigits: 0 }), label: t('mSylhet', { from: day(rain.from), to: day(rain.to) }) }] : [],
      pulse: last ? [{ value: `${last.anomaly > 0 ? '+' : ''}${n(last.anomaly, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, label: t('mAnomaly', { year: n(last.year, { useGrouping: false }) }) }, { value: n(gis.length), label: t('mYears') }] : [],
    };
    return { fireDots: fireObs.map((o) => ({ lat: o.latitude, lon: o.longitude, w: o.normalizedValue })), cityDots: rain.cityDots, melody, metrics };
  }, [fireObs, rain, gis, t, lang]);

  const scrollDown = () => document.getElementById('landing-more')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  return (
    <div ref={ref} id="landing" tabIndex={-1} className="hero-layer landing outline-none fixed inset-x-0 bottom-0 top-0 z-30 overflow-y-auto overflow-x-hidden">
      <WorldCarousel data={data} onOpen={onPick} onTour={onTour} onListen={onListen} onSilent={onSilent} onDown={scrollDown}>
      <div id="landing-more" data-cover className="landing-more">
        {/* Topic carousel (Feature D), then how data becomes sound */}
        <Suspense fallback={<div className="min-h-[24rem]" />}><TopicCarousel onListen={onTopic} /></Suspense>
        <section className="reveal max-w-6xl mx-auto px-5 sm:px-10 py-20" aria-labelledby="how-title">
          <h2 id="how-title" className="land-title">{t('howTitle')}</h2>
          <hr className="world-rule land-rule" />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {([['how1', 'how1d'], ['how2', 'how2d'], ['how3', 'how3d'], ['how4', 'how4d']] as const).map(([h, d], k) => (
              <li key={h} className="glass-flat how-step">
                <span className="how-num tnum" aria-hidden="true">{k + 1}</span>
                <div className="font-semibold text-base text-[var(--ink)]"><span className="sr-only">{k + 1}. </span>{t(h)}</div>
                <p className="text-[var(--ink-2)] leading-relaxed">{t(d)}</p>
              </li>
            ))}
          </ol>
          <button className="mt-8 btn btn-brass world-pill" onClick={onAbout}>{t('readAbout')}</button>
        </section>

        <Footer onAbout={onAbout} />
      </div>
      </WorldCarousel>
    </div>
  );
};
