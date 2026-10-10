import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, Compass, Globe2, Headphones, Play, Square } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { Track } from '../lib/nav';
import { gibsUrl } from '../lib/gibs';
import { EarthSphere } from './EarthSphere';
import type { Dot } from './dotLayer';
import { SCROLL_SPAN, WORLDS, clampLevel, levelAt, levelScroll, parseLandingQuery, ringOffset, scrollProgress, worldKey, type Level, type Stage, type World, type WorldId } from './worlds';
import { playPreview } from './preview';
import { hasWebGL } from '../components/GlobeBoundary';

const WorldScene = lazy(() => import('./WorldScene').then((m) => ({ default: m.WorldScene })));

/** What the carousel draws on the Earths and plays in the preview: all of it comes from files the app already loads. */
export interface WorldData {
  fireDots: Dot[];
  cityDots: Dot[];
  melody: Partial<Record<WorldId, number[]>>;
  /** Key numbers for the split view, already formatted for the current language. */
  metrics: Partial<Record<WorldId, { value: string; label: string }[]>>;
}
interface Props {
  data: WorldData;
  onOpen: (t: Track) => void;
  onTour: () => void;
  onListen: () => void;
  onSilent: () => void;
  onDown: () => void;
  /** The sections below the carousel: they scroll in over the pinned stage, with the Earth as their backdrop. */
  children?: React.ReactNode;
}

const stillSrc = (w: World) => (w.still.src.startsWith('gibs:') ? gibsUrl(w.still.src.slice(5), '2026-10-03', 'jpeg', 1600) : w.still.src);

/** The level-3 picture: the real NASA image, or the bundled Blue Marble when it can't load (offline). */
const Still: React.FC<{ world: World }> = ({ world }) => {
  const [src, setSrc] = useState(stillSrc(world));
  return <img src={src} alt="" className="w-full h-full object-cover" onError={() => setSrc((s) => (s === world.still.fallback ? s : world.still.fallback))} />;
};

/**
 * The landing page's world carousel (replaces the WebGL globe). Three levels of depth:
 * 1 Overview (one Earth centred, neighbours peeking in) → 2 Detail (the Earth glides right, copy on the left) → 3 Immersive (the Earth zooms to fill the screen, a real NASA picture and the long text).
 * The level follows the scroll: the stage is sticky for the whole landing page. A spacer below it gives the scroll room for the three levels
 * (with WebGL the planet's position and size follow the scroll continuously); then the Earth pulls back to a backdrop pose (stage 4)
 * while `children` (the sections below) scroll in over it. The buttons and Esc scroll to a level.
 */
export const WorldCarousel: React.FC<Props> = ({ data, onOpen, onTour, onListen, onSilent, onDown, children }) => {
  const { t, reduceMotion } = usePrefs();
  const [start] = useState(() => parseLandingQuery(window.location.search));
  const [index, setIndex] = useState(start.index);
  const [level, setLevel] = useState<Stage>(start.level);
  const [playing, setPlaying] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1); // last move: planets that leave go out on the side opposite to it
  const gl = !glFailed && hasWebGL(); // 3D planets; CSS discs only when WebGL is missing or fails
  const stopRef = useRef<(() => void) | null>(null);
  const root = useRef<HTMLElement>(null), track = useRef<HTMLDivElement>(null), heads = useRef<(HTMLElement | null)[]>([]), want = useRef<Level | null>(null), swipe = useRef<number | null>(null);
  const len = WORLDS.length, world = WORLDS[index], name = (w: World) => t(worldKey(w, 'Name'));

  const stop = useCallback(() => { stopRef.current?.(); stopRef.current = null; setPlaying(false); }, []);
  useEffect(() => stop, [stop]);
  // Focus the new level's heading only when a button or Esc asked for that level, never on a plain scroll.
  useEffect(() => { if (want.current === level) { want.current = null; heads.current[level - 1]?.focus({ preventScroll: true }); } }, [level]);

  // Scroll → level. `--p1` (L1→L2), `--p2` (L2→L3) and `--p3` (L3→backdrop) let the CSS place the 3D planet's anchor continuously.
  const scroller = () => track.current?.closest<HTMLElement>('#landing') ?? null;
  useEffect(() => {
    const el = track.current, stage = root.current, sc = scroller();
    if (!el || !stage || !sc) return;
    const update = () => {
      const h = stage.clientHeight || 1, u = (sc.getBoundingClientRect().top - el.getBoundingClientRect().top) / h, p = scrollProgress(u);
      const c = (v: number) => Math.max(0, Math.min(1, v)).toFixed(4);
      stage.style.setProperty('--p1', c(p));
      stage.style.setProperty('--p2', c(p - 1));
      stage.style.setProperty('--p3', c(p - 2));
      setLevel(levelAt(p));
    };
    if (start.level > 1) {
      const scrollOffset = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + levelScroll(start.level) * (stage.clientHeight || 1);
      sc.scrollTop += scrollOffset;
      const targetP = levelScroll(start.level);
      const c = (v: number) => Math.max(0, Math.min(1, v)).toFixed(4);
      stage.style.setProperty('--p1', c(targetP));
      stage.style.setProperty('--p2', c(targetP - 1));
      stage.style.setProperty('--p3', c(targetP - 2));
      setLevel(start.level);
    } else {
      update();
    }
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
    sc.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { sc.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [start.level]);

  const pick = (i: number, d?: 1 | -1) => { if (i === index) return; stop(); setDir(d ?? (i > index ? 1 : -1)); setIndex(i); };
  const go = (d: 1 | -1) => pick((index + d + len) % len, d);
  const to = (n: number) => {
    const l = clampLevel(n), el = track.current, sc = scroller(), h = root.current?.clientHeight || 1;
    stop(); want.current = l;
    if (!el || !sc) { setLevel(l); return; }
    sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top + levelScroll(l) * h, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  const melody = data.melody[world.id] ?? [];
  const togglePreview = async () => {
    if (playing) { stop(); return; }
    setPlaying(true);
    stopRef.current = await playPreview(melody, () => { stopRef.current = null; setPlaying(false); });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && level > 1) { e.stopPropagation(); to(level - 1); }
    else if (level < 3 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1); }
  };

  const prev = WORLDS[(index - 1 + len) % len], next = WORLDS[(index + 1) % len];
  const dotsOf = (w: World) => (w.id === 'fire' ? data.fireDots : w.id === 'monsoon' ? data.cityDots : []);
  const sceneDots = useMemo(() => ({ fire: data.fireDots, monsoon: data.cityDots }), [data.fireDots, data.cityDots]);
  const onGlFail = useCallback(() => setGlFailed(true), []);
  const lv = (n: Level) => ({ 'data-on': level === n, inert: level !== n, 'aria-hidden': level !== n } as const);
  const label = (k: 'Kicker' | 'Name' | 'Line' | 'Title' | 'Body' | 'Deep' | 'Src' | 'Pic') => t(worldKey(world, k));

  return (
    <div ref={track} className="world-track">
    <section ref={root} id="world-carousel" className="world-stage" data-level={level} data-gl={gl} aria-roledescription="carousel" aria-label={t('carouselLabel')} onKeyDown={onKey}
      onPointerDown={(e) => { swipe.current = level < 3 && e.pointerType !== 'mouse' ? e.clientX : null; }}
      onPointerUp={(e) => { const x0 = swipe.current; swipe.current = null; if (x0 !== null && Math.abs(e.clientX - x0) > 40) go(e.clientX < x0 ? 1 : -1); }}>
      <h1 className="sr-only">{t('heroHeadline')}</h1>

      {gl && <Suspense fallback={null}><WorldScene stage={root} dots={sceneDots} onFail={onGlFail} /></Suspense>}
      {/* Planet anchors: CSS places them for each level (the active one centred, its neighbours peeking in at the edges); the 3D planets follow them. Without WebGL they draw a CSS Earth themselves. */}
      {WORLDS.map((w, i) => {
        const off = ringOffset(i, index, len);
        return (
          <div key={w.id} className="world-sphere" data-world={w.id} data-pos={off === 0 ? 'active' : off === -1 ? 'prev' : off === 1 ? 'next' : dir > 0 ? 'far-prev' : 'far-next'}>
            {!gl && <EarthSphere world={w} spin={off === 0} dots={dotsOf(w)} dotColor={w.dotColor} />}
          </div>
        );
      })}

      {/* level 3: a real NASA picture the Earth zooms into */}
      {level === 3 && !gl && (
        <div className="world-still" aria-hidden="true">
          <Still key={world.id} world={world} />
        </div>
      )}

      {/* team identity, level 1 only */}
      <div className="world-id lv" {...lv(1)}>
        <img src="/images/space-apps-logo.png" alt={t('spaceAppsLogoAlt')} width={440} height={172} className="h-8 sm:h-14 w-auto" />
        <p className="text-xs sm:text-sm text-[var(--ink-3)] max-w-[60ch]">{t('heroKicker')}</p>
      </div>

      {/* level 1 */}
      <div className="world-copy lv lv1" {...lv(1)} key={`l1-${world.id}`}>
        <p className="world-kicker">{label('Kicker')}</p>
        <h2 ref={(el) => { heads.current[0] = el; }} tabIndex={-1} className="world-name font-serif outline-none">{label('Name')}</h2>
        <p className="mt-3 text-base sm:text-lg text-[var(--ink-2)] max-w-[44ch] mx-auto">{label('Line')}</p>
        <button onClick={() => to(2)} className="btn btn-brass world-pill mt-5">{t('ctaStart')}</button>
        <div className="mt-3 flex flex-wrap justify-center gap-x-1 gap-y-1">
          <button onClick={onTour} className="btn btn-ghost"><Compass className="w-4 h-4" />{t('startTour')}</button>
          <button onClick={onListen} className="btn btn-ghost"><Play className="w-4 h-4" />{t('ctaStory')}</button>
          <button onClick={onSilent} className="btn btn-ghost">{t('exploreSilently')}</button>
        </div>
      </div>

      {/* level 2 */}
      <div className="world-copy lv lv2" {...lv(2)} key={`l2-${world.id}`}>
        <p className="world-kicker">{label('Kicker')}</p>
        <h2 ref={(el) => { heads.current[1] = el; }} tabIndex={-1} className="world-title font-serif outline-none">{label('Title')}</h2>
        <hr className="world-rule" />
        <p className="text-[var(--ink-2)] leading-relaxed max-w-[46ch]">{label('Body')}</p>
        {!!data.metrics[world.id]?.length && (
          <dl className="world-metrics" aria-label={t('metricsLabel')}>
            {data.metrics[world.id]!.map((m) => <div key={m.label}><dt className="sr-only">{m.label}</dt><dd className="font-serif tnum">{m.value}</dd><dd className="text-xs sm:text-sm text-[var(--ink-3)]">{m.label}</dd></div>)}
          </dl>
        )}
        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => to(3)} className="btn btn-brass world-pill">{t('ctaLearn')}</button>
          {melody.length > 0 && (
            <button onClick={togglePreview} aria-pressed={playing} aria-label={playing ? t('ctaStopPreview') : t('ctaPreview')} title={playing ? t('ctaStopPreview') : t('ctaPreview')} className="btn btn-icon world-round">
              {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
        </div>
        {melody.length > 0 && <p className="mt-3 text-xs sm:text-sm text-[var(--ink-3)] max-w-[46ch]" role="status">{t('previewNote')}</p>}
        <p className="mt-2 text-xs sm:text-sm text-[var(--ink-3)] flex items-start gap-2 max-w-[46ch]"><Headphones className="w-4 h-4 mt-0.5 shrink-0" />{t('heroHeadphones')}</p>
      </div>

      {/* level 3 */}
      <div className="world-copy lv lv3 glass-strong" {...lv(3)} key={`l3-${world.id}`}>
        <h2 ref={(el) => { heads.current[2] = el; }} tabIndex={-1} className="world-title font-serif text-[var(--fs-3xl)] outline-none">{label('Title')}</h2>
        <hr className="world-rule" />
        <p className="leading-relaxed">{label('Deep')}</p>
        <p className="mt-3 text-xs sm:text-sm text-[var(--ink-3)]">{label('Src')} {gl ? t('planetCredit') : label('Pic')}</p>
        <button onClick={() => onOpen(world.track)} className="btn btn-brass world-pill mt-4">{world.track === 'atlas' ? <Globe2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}{t('ctaOpenTrack')}</button>
      </div>

      {/* back */}
      <button className="btn btn-ghost world-back lv" {...lv(2)} data-on={level === 2 || level === 3} inert={level !== 2 && level !== 3} aria-hidden={level !== 2 && level !== 3} onClick={() => to(level - 1)}><ChevronLeft className="w-4 h-4" />{t('ctaBackLevel')}</button>

      {/* previous / next (levels 1 and 2): the neighbours' names; the sweep pushes the current Earth out of frame */}
      <button className="world-nav world-nav-prev lv" data-on={level < 3} inert={level === 3} aria-hidden={level === 3} onClick={() => go(-1)} aria-label={t('carPrev', { name: name(prev) })}><ChevronLeft className="w-5 h-5" /><span>{name(prev)}</span></button>
      <button className="world-nav world-nav-next lv" data-on={level < 3} inert={level === 3} aria-hidden={level === 3} onClick={() => go(1)} aria-label={t('carNext', { name: name(next) })}><span>{name(next)}</span><ChevronRight className="w-5 h-5" /></button>
      <div className="world-foot lv" {...lv(1)}>
        <div className="flex gap-2" role="group" aria-label={t('carouselLabel')}>
          {WORLDS.map((w, i) => <button key={w.id} className="world-dot" aria-current={i === index ? 'true' : undefined} aria-label={t('carGoTo', { name: name(w) })} onClick={() => pick(i)} />)}
        </div>
        <button className="btn btn-ghost world-down" onClick={onDown} aria-label={t('carHowItWorks')}><ArrowDown className="w-5 h-5" /></button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{t('carouselOf', { n: index + 1, total: len, name: name(world) })}</p>
    </section>
    <div className="world-spacer" aria-hidden="true" style={{ '--span': SCROLL_SPAN } as React.CSSProperties} />
    {children}
    </div>
  );
};
