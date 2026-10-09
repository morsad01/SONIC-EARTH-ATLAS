import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, SlidersHorizontal, X } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { countryLabel } from '../lib/placesBn';
import { JUKEBOX_TRACKS, type Track } from '../lib/nav';
import type { Country } from '../countries/countries';
import { countryCoverage } from '../countries/countryCoverage';
import { useGeoContains } from '../countries/useGeoContains';
import { ProfileDataContext } from '../countries/profileContext';
import type { SeriesPoint } from '../datasets/series';
import { DataState } from '../components/data-status/DataState';
import { matchesFilters, storiesFor, type Story } from '../stories/stories';
import { loadStorySeries } from '../stories/loadStory';
import { StoryRow } from '../stories/StoryRow';
import { useJukebox, visibleTimes, type Origin } from './useJukebox';
import { TimelineFilters } from './TimelineFilters';
import { TimelineView } from './TimelineView';
import { StoryPanel, type StoryLoad } from './StoryPanel';
import { digits, timeLabel } from './format';

interface Props {
  countries: { list: Country[]; country: Country | null; point: { lat: number; lon: number } | null; onSelect: (c: Country | null) => void };
  initialStory?: string;
  initialT?: string;
  onOpenCollection: (track: Track, frameId?: string) => void;
}
const STEP_MS = 700;
type Tab = 'filters' | 'timeline' | 'story';

/**
 * Data Jukebox (roadmap Phase 4): story row on top, then filters · timeline · story. Desktop shows three columns,
 * tablet two with the filters in a drawer, phones one column chosen with Filters / Timeline / Story and the step bar pinned at the bottom.
 * `useJukebox` is the single source of truth; every view only dispatches.
 */
export function JukeboxView({ countries, initialStory, initialT, onOpenCollection }: Props) {
  const { t, lang } = usePrefs();
  const profile = useContext(ProfileDataContext);
  const geoContains = useGeoContains();
  const { country, point } = countries;

  // Fire inside the border needs the Atlas slices and d3-geo; until both are in, the story list for a country waits.
  const coverage = useMemo(() => (country && profile && !profile.loading && !profile.isFallback && geoContains ? countryCoverage(country, profile.slices, geoContains as never, { snapshotDate: profile.snapshotDates }) : null), [country, profile, geoContains]);
  const settled = !country || !profile || profile.isFallback || coverage !== null;
  const stories = useMemo(() => storiesFor(country ? { id: country.id, name: country.name, nameBn: countryLabel(country.id, country.name, 'bn'), fireInside: !!coverage?.some((r) => r.dataset === 'fire' && r.count > 0) } : null), [country, coverage]);

  const [s, dispatch] = useJukebox(initialStory ?? null, initialT ?? null);
  useEffect(() => { if (settled) dispatch({ type: 'setStories', ids: stories.map((x) => x.id) }); }, [stories, settled, dispatch]);
  const story = stories.find((x) => x.id === s.storyId) ?? null;

  // Load the active story's series. A late answer for another story is ignored by key and by the reducer.
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<{ key: string; v: StoryLoad } | null>(null);
  const needsPoint = story?.kind === 'country-temp' || story?.kind === 'country-rain';
  const key = story ? `${story.id}|${needsPoint && point ? `${point.lat.toFixed(2)},${point.lon.toFixed(2)}` : ''}|${attempt}` : '';
  useEffect(() => {
    if (!story || (needsPoint && !point)) return;
    const ac = new AbortController();
    loadStorySeries(story, { signal: ac.signal, point, coverage }).then((series) => {
      if (ac.signal.aborted) return;
      setLoad({ key, v: { status: 'ready', series } });
      dispatch({ type: 'seriesLoaded', storyId: story.id, times: series?.points.map((p) => p.t) ?? [] });
    }, (e: Error) => { if (!ac.signal.aborted) setLoad({ key, v: { status: 'error', message: e.message } }); });
    return () => ac.abort();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur: StoryLoad = load && load.key === key ? load.v : { status: 'loading', message: needsPoint ? t('profileLoadingPower') : undefined };
  const series = cur.status === 'ready' ? cur.series : null;
  const visible = useMemo(() => new Set(visibleTimes(s)), [s]);
  const points: SeriesPoint[] = useMemo(() => (series ? series.points.filter((p) => visible.has(p.t)) : []), [series, visible]);
  const years = useMemo(() => [...new Set(s.times.map((x) => x.slice(0, 4)))], [s.times]);

  // Real-data sparklines for the cards. POWER ones only once the main load has filled the cache, so nothing is fetched twice.
  const [sparks, setSparks] = useState<Record<string, SeriesPoint[] | undefined>>({});
  const powerReady = !!series && needsPoint;
  useEffect(() => {
    let on = true;
    for (const st of stories) {
      if (st.visual !== 'chart' || sparks[st.id] || ((st.kind === 'country-temp' || st.kind === 'country-rain') && !powerReady)) continue;
      loadStorySeries(st, { point, coverage }).then((x) => { if (on && x) setSparks((m) => (m[st.id] ? m : { ...m, [st.id]: x.points })); }, () => {});
    }
    return () => { on = false; };
  }, [stories, powerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Story and cursor go into the share hash (#v1&track=jukebox&story=…&t=…), other keys are kept.
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.replace(/^#v1&/, ''));
    if (p.get('track') !== 'jukebox') return;
    if (s.storyId) p.set('story', s.storyId); else p.delete('story');
    if (s.cursor) p.set('t', s.cursor); else p.delete('t');
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}#v1&${p.toString()}`);
  }, [s.storyId, s.cursor]);

  // Step-through: advances the cursor with origin 'playback'; the reducer stops it at the end.
  useEffect(() => {
    if (!s.playing) return;
    const id = window.setInterval(() => dispatch({ type: 'step', by: 1, origin: 'playback' }), STEP_MS);
    return () => window.clearInterval(id);
  }, [s.playing, dispatch]);

  const onCursor = useCallback((tm: string, origin: Origin) => dispatch({ type: 'setCursor', t: tm, origin }), [dispatch]);
  const filters = s.filters.region === 'country' && !country ? { ...s.filters, region: 'all' as const } : s.filters;
  const shown = stories.filter((x) => matchesFilters(x, filters));
  const open = (st: Story) => onOpenCollection(st.collection!, st.frameId);

  const [tab, setTab] = useState<Tab>('story');
  const [drawer, setDrawer] = useState(false);
  const drawerBtn = useRef<HTMLButtonElement>(null), drawerBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!drawer) return;
    drawerBox.current?.querySelector<HTMLElement>('input, button, select')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDrawer(false); drawerBtn.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  const vt = visibleTimes(s), ci = s.cursor ? vt.indexOf(s.cursor) : -1;
  const isPicture = story?.visual === 'eic';

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scroll-thin">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 pt-4 pb-24 md:pb-6 space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{t('navJukebox')}</h1>
            <p className="text-sm text-[var(--ink-2)] max-w-[70ch]">{t('jbLead')}</p>
          </div>
          <button ref={drawerBtn} type="button" className="btn hidden md:inline-flex lg:hidden" aria-expanded={drawer} aria-controls="jb-filters" onClick={() => setDrawer(true)}><SlidersHorizontal className="w-4 h-4" aria-hidden="true" />{t('jbFilters')}</button>
        </header>

        <StoryRow stories={shown} activeId={s.storyId} onSelect={(id) => dispatch({ type: 'selectStory', id })} sparks={sparks} />

        <div className="md:hidden flex gap-1 panel p-1" role="group" aria-label={t('jbShow')}>
          {(['filters', 'timeline', 'story'] as Tab[]).map((k) => (
            <button key={k} type="button" className="btn btn-ghost flex-1 min-h-[40px]" aria-pressed={tab === k} onClick={() => setTab(k)}>{t(k === 'filters' ? 'jbFilters' : k === 'timeline' ? 'jbTimeline' : 'jbStory')}</button>))}
        </div>

        <div className="jb-grid" data-tab={tab} data-drawer={drawer}>
          {drawer && <button type="button" className="jb-backdrop hidden md:block lg:hidden" aria-label={t('close')} onClick={() => setDrawer(false)} />}
          <div data-col="filters" id="jb-filters" ref={drawerBox} className="min-w-0 space-y-4">
            {drawer && <div className="hidden md:flex lg:hidden justify-end"><button type="button" className="btn btn-ghost btn-icon" onClick={() => { setDrawer(false); drawerBtn.current?.focus(); }} aria-label={t('close')}><X className="w-5 h-5" /></button></div>}
            <TimelineFilters filters={filters} years={years} onFilter={(patch) => dispatch({ type: 'setFilter', patch })} onReset={() => dispatch({ type: 'resetFilters' })} countries={countries} />
            <section className="panel p-3 space-y-2" aria-labelledby="jb-coll">
              <h2 id="jb-coll" className="font-display text-base font-bold">{t('collections')}</h2>
              <p className="text-xs text-[var(--ink-3)]">{t('jbCollectionsNote')}</p>
              <ul className="grid gap-1.5">
                {JUKEBOX_TRACKS.map((tr) => <li key={tr.id}><button type="button" className="btn w-full justify-start" onClick={() => onOpenCollection(tr.id)}><span className="tnum text-[11px] font-semibold text-[var(--brass)]">{tr.code}</span>{t(tr.key)}</button></li>)}
              </ul>
            </section>
          </div>

          <section data-col="timeline" className="panel p-3 min-w-0 space-y-2 self-start" aria-labelledby="jb-tl">
            <h2 id="jb-tl" className="font-display text-base font-bold">{t('jbTimeline')}</h2>
            {!story ? <DataState status="loading" />
              : isPicture ? <p className="text-sm text-[var(--ink-2)]">{t('jbPictureNoTimeline')}</p>
              : cur.status === 'ready' && series ? <TimelineView points={points} cursor={s.cursor} origin={s.origin} seq={s.seq} unit={series.unit} label={series.variable} onCursor={onCursor} />
              : cur.status === 'error' ? <p className="text-sm text-[var(--ink-3)]">{t('dsError')}</p>
              : <DataState status="loading" message={cur.status === 'loading' ? cur.message : undefined} />}
          </section>

          <div data-col="story" className="min-w-0 space-y-3">
            {story ? <StoryPanel story={story} load={isPicture ? { status: 'ready', series: null } : cur} points={points} cursor={s.cursor} playing={s.playing}
              onCursor={(tm) => onCursor(tm, 'user')} onRetry={() => setAttempt((a) => a + 1)} onOpenCollection={open} /> : <DataState status="loading" />}
          </div>
        </div>
      </div>

      {story && !isPicture && vt.length > 0 && (
        <div className="jb-stepbar sticky bottom-0 z-20 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--abyss)_94%,transparent)] backdrop-blur-md safe-pb">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 pt-2 flex items-center gap-2">
            <button type="button" className="btn btn-icon" onClick={() => dispatch({ type: 'step', by: -1, origin: 'user' })} disabled={ci <= 0} aria-label={t('jbPrev')}><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" className="btn" onClick={() => dispatch({ type: 'setPlaying', playing: !s.playing })} aria-pressed={s.playing} disabled={vt.length < 2}>
              {s.playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}{t(s.playing ? 'jbStepStop' : 'jbStepPlay')}</button>
            <button type="button" className="btn btn-icon" onClick={() => dispatch({ type: 'step', by: 1, origin: 'user' })} disabled={ci >= vt.length - 1} aria-label={t('jbNext')}><ChevronRight className="w-4 h-4" /></button>
            <p className="text-sm text-[var(--ink-2)] tnum truncate min-w-0" aria-live="off">
              {s.cursor && <><strong className="text-[var(--ink)]">{timeLabel(s.cursor, lang)}</strong> · {t('jbPosition', { i: digits(ci + 1, lang), n: digits(vt.length, lang) })}</>}
            </p>
            <p className="hidden xl:block ml-auto text-xs text-[var(--ink-3)]">{t('jbStepNote')}</p>
          </div>
        </div>)}
    </div>
  );
}
