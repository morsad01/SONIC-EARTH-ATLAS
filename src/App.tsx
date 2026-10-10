import { decodeLocation, buildUrl, decodeShare, encodeShare } from './lib/shareLink';
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { EarthObservation, PhenomenonType, DatasetTimeSlice } from './types/dataset';
import { DatasetAdapter, type AdapterResult } from './datasets/adapter';
import { AudioContextManager } from './audio/audioContext';
import { SonificationEngine } from './audio/sonificationEngine';
import { Accessible2DMap } from './map/Accessible2DMap';
import { AudioFirstMode } from './accessibility/AudioFirstMode';
import { Header } from './components/Header';
import { sectionOf, type Track } from './lib/nav';
import { Landing } from './landing/Landing';
import { GlobeBoundary } from './components/GlobeBoundary';
import { usePlaybackReport } from './lib/playbackContext';
import { InspectLocationModal } from './components/InspectLocationModal';
import { MobileSheet } from './atlas/MobileSheet';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { DataMethodDialog } from './components/DataMethodDialog';
import { LayersPanel } from './atlas/LayersPanel';
import { HearingPanel } from './atlas/HearingPanel';
import { TimelineBar } from './atlas/TimelineBar';
import { TourBar } from './demo/TourBar';
import { usePrefs } from './lib/prefs';
import { useCountry } from './countries/useCountry';
import { CountryPanel } from './countries/CountryPanel';
import { ProfileDataContext } from './countries/profileContext';
import { gibsUrl } from './lib/gibs';
import { Globe, Map as MapIcon, List, Satellite, RotateCw, Layers, AudioLines, MapPinned } from 'lucide-react';

const GlobeCanvas = lazy(() => import('./globe/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })));
const FrameJukebox = lazy(() => import('./tracks/FrameJukebox').then((m) => ({ default: m.FrameJukebox })));
const BangladeshMonsoon = lazy(() => import('./tracks/BangladeshMonsoon').then((m) => ({ default: m.BangladeshMonsoon })));
const VitalSigns = lazy(() => import('./tracks/VitalSigns').then((m) => ({ default: m.VitalSigns })));
const JukeboxView = lazy(() => import('./jukebox/JukeboxView').then((m) => ({ default: m.JukeboxView })));
const AboutPage = lazy(() => import('./about/AboutPage').then((m) => ({ default: m.AboutPage })));

type View = '3d-globe' | '2d-map' | 'audio-first';
export function App() {
  const { t, lang, set } = usePrefs();
  const [initialShare] = useState(() => decodeLocation(window.location.pathname, window.location.search, window.location.hash, { frames: [], pairs: [] }));
  const [showHero, setShowHero] = useState(!initialShare?.track);
  const [autoListen, setAutoListen] = useState(false);
  const [track, setTrack] = useState<Track>(initialShare?.track ?? 'atlas');
  const [lastJukebox, setLastJukebox] = useState<Track>(initialShare?.track && sectionOf(initialShare.track) === 'jukebox' ? initialShare.track : 'jukebox');
  // What the Jukebox opens on; `n` remounts it when the landing carousel or a country profile asks for a story.
  const [jbStart, setJbStart] = useState<{ story?: string; t?: string; n: number }>(() => (initialShare?.track === 'jukebox' ? { story: initialShare.story, t: initialShare.t, n: 0 } : { n: 0 }));
  const [globeFailed, setGlobeFailed] = useState(false);
  const [view, setView] = useState<View>('3d-globe');
  const [audioReady, setAudioReady] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [spatialMode, setSpatialMode] = useState<'spatial-hrtf' | 'stereo-panning'>('stereo-panning');
  const [autoRotate, setAutoRotate] = useState(false);
  const [imagery, setImagery] = useState(false);
  const [focus, setFocus] = useState<{ lat: number; lon: number } | null>(null);

  const [data, setData] = useState<AdapterResult | null>(null);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hearChange, setHearChange] = useState(false);
  const [enabled, setEnabled] = useState<Record<PhenomenonType, boolean>>({ fire: true, precipitation: false, sst: false });
  const [selected, setSelected] = useState<EarthObservation | null>(null);

  const [tourOpen, setTourOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(false);
  const [sheet, setSheet] = useState<'layers' | 'hearing' | 'country' | null>(null);
  const cty = useCountry(initialShare?.c);

  useEffect(() => { if (initialShare?.lang && initialShare.lang !== lang) set({ lang: initialShare.lang }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    DatasetAdapter.loadDatasets('live').then(setData).catch(() => DatasetAdapter.loadDatasets('demo').then(setData));
  }, []);

  const slices: DatasetTimeSlice[] = useMemo(() => data?.slices ?? [], [data]);
  const slice = slices[day] ?? slices[0];
  const observations = useMemo(() => slice?.observations ?? [], [slice]);
  // The landing carousel draws the first snapshot's fires on its Earth and plays them in the preview.
  const landingFire = useMemo(() => slices[0]?.observations.filter((o) => o.phenomenon === 'fire') ?? [], [slices]);
  const counts = useMemo(() => {
    const c: Record<PhenomenonType, number> = { fire: 0, precipitation: 0, sst: 0 };
    observations.forEach((o) => c[o.phenomenon]++);
    return c;
  }, [observations]);

  useEffect(() => {
    const curShare = decodeLocation(window.location.pathname, window.location.search, window.location.hash, { frames: [], pairs: [] });
    if (showHero) {
      if (window.location.pathname !== '/' || window.location.search || window.location.hash) {
        history.replaceState(null, '', '/');
      }
    } else {
      const nextUrl = buildUrl({ ...curShare, track, c: cty.id ?? undefined });
      if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
        history.replaceState(null, '', nextUrl);
      }
    }
  }, [track, showHero, cty.id]);
  // The landing page is laid out for a 90% type scale on desktop (see html.landing-open in index.css)
  useEffect(() => { document.documentElement.classList.toggle('landing-open', showHero); return () => document.documentElement.classList.remove('landing-open'); }, [showHero]);

  usePlaybackReport('atlas', t('track1'), playing && track === 'atlas' && !showHero, () => setPlaying(false));

  useEffect(() => { AudioContextManager.setMasterVolume(volume); }, [volume, audioReady]);
  useEffect(() => { SonificationEngine.getInstance().setHearChangeMode(hearChange); }, [hearChange]);

  // The spatial engine only plays while the Atlas track is on screen.
  useEffect(() => {
    const eng = SonificationEngine.getInstance();
    if (audioReady && track === 'atlas' && !showHero) eng.syncObservations(observations, enabled);
    else eng.stopAllVoices();
  }, [audioReady, observations, enabled, track, showHero]);

  const soundOn = useCallback(async () => {
    await AudioContextManager.init();
    SonificationEngine.getInstance().setAudioUnlocked(true);
    AudioContextManager.setMasterVolume(volume);
    setAudioReady(true);
  }, [volume]);
  const soundOff = useCallback(() => { SonificationEngine.getInstance().setAudioUnlocked(false); setAudioReady(false); }, []);

  const toggleSpatial = () => {
    const next = spatialMode === 'spatial-hrtf' ? 'stereo-panning' : 'spatial-hrtf';
    setSpatialMode(next);
    SonificationEngine.getInstance().setSpatialMode(next);
  };

  const navigate = (tr: Track) => { setTrack(tr); if (sectionOf(tr) === 'jukebox') setLastJukebox(tr); };
  const goAbout = () => { navigate('about'); setShowHero(false); setTourOpen(false); };
  const openJukebox = (story?: string) => { setJbStart((j) => ({ story, n: j.n + 1 })); navigate('jukebox'); setShowHero(false); setTourOpen(false); };
  const pickTrack = async (tr: Track) => {
    navigate(tr);
    setShowHero(false);
    if (tr === 'atlas' && !audioReady) await soundOn();
  };
  // One click from the landing page: sound on and an Earth Information Center frame playing.
  const listenNow = async () => {
    navigate('frames'); setShowHero(false); setAutoListen(true);
    if (!audioReady) await soundOn();
  };
  const startTour = async () => {
    setTrack('atlas'); setView('3d-globe'); setShowHero(false);
    if (!audioReady) await soundOn();
    setTourOpen(true);
  };

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[aria-modal="true"]')) return; // a dialog is open: it owns the keyboard
      const k = e.key.toLowerCase();
      if (k === '?') { setSettingsOpen(true); return; }
      if (showHero) return;
      if (k === 's') { if (audioReady) soundOff(); else soundOn(); return; }
      if (k === 't') { startTour(); return; }
      if (track !== 'atlas') return;
      if (e.key === ' ' && tag !== 'BUTTON') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'ArrowRight' && view !== '2d-map') setDay((d) => (d + 1) % Math.max(1, slices.length));
      else if (e.key === 'ArrowLeft' && view !== '2d-map') setDay((d) => (d - 1 + slices.length) % Math.max(1, slices.length));
      else if (k === '1' || k === '2' || k === '3') { const p = (['fire', 'precipitation', 'sst'] as PhenomenonType[])[+k - 1]; setEnabled((o) => ({ ...o, [p]: !o[p] })); }
      else if (k === 'g') setView('3d-globe');
      else if (k === 'm') setView('2d-map');
      else if (k === 'l') setView('audio-first');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const profileData = useMemo(() => ({
    slices, snapshotDates: data?.snapshotDates, isFallback: !!data?.isFallback, loading: !data,
    onExplore: (c: string) => openJukebox(`c-${c.toLowerCase()}-temp`),
  }), [slices, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // A Jukebox story opens its full collection; an EIC picture opens on that frame (FrameJukebox reads the hash on mount).
  const openCollection = (tr: Track, frameId?: string) => {
    if (tr === 'frames' && frameId) history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${encodeShare({ track: 'frames', frame: frameId, c: cty.id ?? undefined })}`);
    pickTrack(tr);
  };

  const imageryUrl = imagery && slice && /^\d{4}-\d{2}-\d{2}$/.test(slice.dateLabel) ? gibsUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor', slice.dateLabel, 'jpeg', 2048) : null;

  const layersPanel = (
    <LayersPanel enabled={enabled} onToggle={(p) => setEnabled((o) => ({ ...o, [p]: !o[p] }))} counts={counts}
      statuses={data?.layerStatuses} isFallback={!!data?.isFallback} statusMessage={data?.statusMessage ?? 'Loading NASA data…'}
      audioReady={audioReady} onOpenData={() => setDataOpen(true)} />
  );
  const countryPanel = <CountryPanel list={cty.list} country={cty.country} point={cty.point} onSelect={cty.select} />;
  const hearingPanel = <HearingPanel observations={observations} enabled={enabled} audioReady={audioReady} onSelect={(o) => { setSelected(o); SonificationEngine.getInstance().playObservation(o); }} />;

  return (
    <ProfileDataContext.Provider value={profileData}>
    <div className={`${showHero ? 'hero-open ' : ''}flex flex-col h-[100dvh] w-full max-w-[100vw] overflow-hidden`}>
      <a href={showHero ? '#landing' : '#main'} className="sr-only-focusable absolute z-[80] left-2 top-2 btn btn-brass">{t('skip')}</a>
      {showHero && <Landing fireObs={landingFire} onPick={pickTrack}
        onTour={startTour} onListen={listenNow} onSilent={() => { setShowHero(false); setTrack('atlas'); }} onAbout={goAbout} onTopic={openJukebox} />}

      <Header track={track} onLanding={showHero} onTrack={(tr) => { navigate(tr); setShowHero(false); setTourOpen(false); }} lastJukebox={lastJukebox}
        audioReady={audioReady} onToggleAudio={() => (audioReady ? soundOff() : soundOn())} onListen={listenNow}
        onHome={() => { setShowHero(true); setTourOpen(false); }} onTour={startTour} onData={() => setDataOpen(true)} onSettings={() => setSettingsOpen(true)} settingsOpen={settingsOpen} />

      <main id="main" className="flex-1 relative w-full overflow-hidden">
        {/* First child = the visual canvas (the landing hero shows the globe from here). */}
        <div className="absolute inset-0">
          {track === 'atlas' && !showHero && <h1 className="sr-only">{t('navExplore')}: {t('track1')}</h1>}
          {track === 'atlas' && !showHero && view === '3d-globe' && (
            <GlobeBoundary onFail={() => setGlobeFailed(true)} fallback={<Accessible2DMap observations={observations} enabledPhenomena={enabled} selectedObservation={selected} onSelectObservation={setSelected}
                countries={cty.list} country={cty.country} onSelectCountry={cty.select} />}>
              <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-[var(--ink-3)]">{t('loadingGlobe')}</div>}>
                <GlobeCanvas observations={observations} enabledPhenomena={enabled} selectedObservation={selected}
                  onSelectObservation={setSelected} autoRotate={autoRotate} targetFocus={focus} imageryUrl={imageryUrl}
                  framing="explore"
                  countries={cty.list} country={cty.country} countryPoint={cty.point} onSelectCountry={cty.select} />
              </Suspense>
            </GlobeBoundary>
          )}
          {track === 'atlas' && !showHero && view === '2d-map' && (
            <Accessible2DMap observations={observations} enabledPhenomena={enabled} selectedObservation={selected} onSelectObservation={setSelected}
                countries={cty.list} country={cty.country} onSelectCountry={cty.select} />
          )}
          {track === 'atlas' && !showHero && view === 'audio-first' && (
            <div className="w-full h-full overflow-y-auto pb-6 pt-[calc(var(--header-h)+1.5rem)] lg:pl-[340px]">
              <AudioFirstMode observations={observations.filter((o) => enabled[o.phenomenon])} currentDateLabel={slice?.dateLabel ?? ''} selectedObservation={selected}
                onSelectObservation={setSelected} onExitAudioFirst={() => setView('3d-globe')}
                countries={{ list: cty.list, country: cty.country, point: cty.point, onSelect: cty.select }} />
            </div>
          )}
          {track !== 'atlas' && !showHero && (
            <Suspense fallback={<div className="h-full grid place-items-center text-sm text-[var(--ink-3)]">{t('loadingView')}</div>}>
              {track === 'frames' && <FrameJukebox autoPlay={autoListen} onAutoPlayed={() => setAutoListen(false)} onPlay={() => { if (!audioReady) soundOn(); }} />}
              {track === 'monsoon' && <BangladeshMonsoon />}
              {track === 'pulse' && <VitalSigns />}
              {track === 'jukebox' && <JukeboxView key={jbStart.n} initialStory={jbStart.story} initialT={jbStart.t} onOpenCollection={openCollection}
                countries={{ list: cty.list, country: cty.country, point: cty.point, onSelect: cty.select }} />}
              {track === 'about' && <AboutPage onOpenMethod={() => setDataOpen(true)} />}
            </Suspense>
          )}
        </div>

        {track === 'atlas' && !showHero && (
          <>
            <TourBar open={tourOpen} onClose={() => { setTourOpen(false); setFocus(null); }}
              onApply={(layers, d, change, f) => { setEnabled(layers); setDay(Math.min(d, Math.max(0, slices.length - 1))); setHearChange(change); setFocus(f); if (view !== '3d-globe') setView('3d-globe'); }} />

            {/* Desktop side column */}
            <div className="hidden lg:flex flex-col gap-3 absolute left-3 top-[calc(var(--header-h)+.75rem)] bottom-[75px] w-[340px] max-h-[calc(100vh-var(--header-h)-5.25rem)] overflow-y-auto scroll-thin z-20 pb-4">
              {view !== 'audio-first' && countryPanel}
              {layersPanel}
              {hearingPanel}
            </div>

            {/* View switch and globe options */}
            <div data-ctl="views" className="absolute right-3 top-[calc(var(--header-h)+3.5rem)] lg:top-[calc(var(--header-h)+.75rem)] z-20 flex flex-row lg:flex-col items-start lg:items-end gap-2">
              <div className="panel p-1 flex gap-1" role="group" aria-label={t('viewGroup')}>
                {([['3d-globe', Globe, 'globe'], ['2d-map', MapIcon, 'map'], ['audio-first', List, 'list']] as const).map(([v, Icon, key]) => (
                  <button key={v} className="btn btn-ghost min-h-[36px] pointer-coarse:min-h-[44px] px-2.5" aria-pressed={view === v} aria-label={t(key)} onClick={() => setView(v)}>
                    <Icon className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline" aria-hidden="true">{t(key)}</span>
                  </button>
                ))}
              </div>
              {view === '3d-globe' && (
                <div className="panel p-1 flex flex-row lg:flex-col gap-1">
                  <button className="btn btn-ghost min-h-[36px] px-2.5 justify-start" aria-pressed={imagery} onClick={() => setImagery(!imagery)} title={t('imageryHint')}><Satellite className="w-4 h-4" /><span className="hidden sm:inline">{t('imagery')}</span></button>
                  <button className="btn btn-ghost min-h-[36px] px-2.5 justify-start" aria-pressed={autoRotate} onClick={() => setAutoRotate(!autoRotate)} aria-label={t('spinHint')}><RotateCw className="w-4 h-4" /><span className="hidden sm:inline">{t('spin')}</span></button>
                </div>
              )}
            </div>

            {/* Mobile panel buttons */}
            <div data-ctl="bar" className="lg:hidden absolute left-3 right-3 top-[calc(var(--header-h)+.5rem)] z-20 flex gap-2 overflow-x-auto scroll-thin fade-x pe-7">
              <button className="btn panel shrink-0" onClick={() => setSheet('layers')}><Layers className="w-4 h-4" />{t('layers')}</button>
              <button className="btn panel shrink-0" onClick={() => setSheet('hearing')}><AudioLines className="w-4 h-4" />{t('nowHearing')}</button>
              {view !== 'audio-first' && <button className="btn panel shrink-0" onClick={() => setSheet('country')}><MapPinned className="w-4 h-4" />{t('country')}</button>}
            </div>
            {sheet && (
              <MobileSheet onClose={() => setSheet(null)}>
                {sheet === 'layers' ? layersPanel : sheet === 'country' ? countryPanel : hearingPanel}
              </MobileSheet>
            )}

            <div data-ctl="timeline" className="absolute bottom-2 sm:bottom-3 left-2 right-2 lg:left-[340px] lg:right-3 z-20">
              {globeFailed && view === '3d-globe' && <p role="status" className="panel px-3 py-2 mb-2 text-sm text-[var(--ink-2)] w-fit max-w-full">{t('webglOff')}</p>}
              <TimelineBar slices={slices} index={day} onChange={setDay} playing={playing} onTogglePlay={() => setPlaying(!playing)}
                hearChange={hearChange} onToggleHearChange={() => setHearChange(!hearChange)} enabled={enabled} />
            </div>
          </>
        )}
      </main>

      <InspectLocationModal observation={selected} onClose={() => setSelected(null)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} volume={volume} onVolume={setVolume} spatialMode={spatialMode}
        onToggleSpatial={toggleSpatial} showDiagnostics={diagnostics} onToggleDiagnostics={() => setDiagnostics(!diagnostics)} />
      <DataMethodDialog open={dataOpen} onClose={() => setDataOpen(false)} sstGlobal={data?.sstGlobal} onAbout={track === 'about' && !showHero ? undefined : () => { setDataOpen(false); goAbout(); }} />
      {diagnostics && <DiagnosticsPanel activeDatasetCount={observations.length} currentTimestep={day} totalTimesteps={slices.length} isOpen onToggle={() => setDiagnostics(false)} />}
    </div>
    </ProfileDataContext.Provider>
  );
}
export default App;
