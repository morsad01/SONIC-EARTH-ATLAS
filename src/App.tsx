import { decodeShare, encodeShare } from './lib/shareLink';
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { EarthObservation, PhenomenonType, DatasetTimeSlice } from './types/dataset';
import { DatasetAdapter, type AdapterResult } from './datasets/adapter';
import { AudioContextManager } from './audio/audioContext';
import { SonificationEngine } from './audio/sonificationEngine';
import { recordOutput } from './audio/recorder';
import { Accessible2DMap } from './map/Accessible2DMap';
import { AudioFirstMode } from './accessibility/AudioFirstMode';
import { Header } from './components/Header';
import { sectionOf, type Track } from './lib/nav';
import { Landing } from './landing/Landing';
import type { Stage } from './landing/useScrollStage';
import { GlobeBoundary, GlobeStill } from './components/GlobeBoundary';
import type { Framing } from './globe/framing';
import { usePlaybackReport } from './lib/playbackContext';
import { InspectLocationModal } from './components/InspectLocationModal';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { DataMethodDialog } from './components/DataMethodDialog';
import { LayersPanel } from './atlas/LayersPanel';
import { HearingPanel } from './atlas/HearingPanel';
import { TimelineBar } from './atlas/TimelineBar';
import { PlacePanel } from './atlas/PlacePanel';
import { TourBar } from './demo/TourBar';
import { usePrefs } from './lib/prefs';
import { useCountry } from './countries/useCountry';
import { CountryPanel } from './countries/CountryPanel';
import { gibsUrl } from './lib/gibs';
import { Globe, Map as MapIcon, List, Satellite, RotateCw, Layers, AudioLines, X, MapPin, MapPinned } from 'lucide-react';

const GlobeCanvas = lazy(() => import('./globe/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })));
const FrameJukebox = lazy(() => import('./tracks/FrameJukebox').then((m) => ({ default: m.FrameJukebox })));
const BangladeshMonsoon = lazy(() => import('./tracks/BangladeshMonsoon').then((m) => ({ default: m.BangladeshMonsoon })));
const VitalSigns = lazy(() => import('./tracks/VitalSigns').then((m) => ({ default: m.VitalSigns })));
const AboutPage = lazy(() => import('./about/AboutPage').then((m) => ({ default: m.AboutPage })));

type View = '3d-globe' | '2d-map' | 'audio-first';
const ALL_ON: Record<PhenomenonType, boolean> = { fire: true, precipitation: true, sst: true };
const STAGE_FRAMING: Framing[] = ['hero', 'split', 'immersive'];

export function App() {
  const { t, lang, set } = usePrefs();
  const [initialShare] = useState(() => decodeShare(window.location.hash, { frames: [], pairs: [] }));
  const [showHero, setShowHero] = useState(!initialShare?.track);
  const [autoListen, setAutoListen] = useState(false);
  const [track, setTrack] = useState<Track>(initialShare?.track ?? 'atlas');
  const [lastJukebox, setLastJukebox] = useState<Track>(initialShare?.track && sectionOf(initialShare.track) === 'jukebox' ? initialShare.track : 'frames');
  const [stage, setStage] = useState<Stage>(0);
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
  const [recording, setRecording] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'layers' | 'hearing' | 'place' | 'country' | null>(null);
  const [place, setPlace] = useState<{ lat: number; lon: number } | null>(null);
  const cty = useCountry(initialShare?.c);

  useEffect(() => { if (initialShare?.lang && initialShare.lang !== lang) set({ lang: initialShare.lang }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    DatasetAdapter.loadDatasets('live').then(setData).catch(() => DatasetAdapter.loadDatasets('demo').then(setData));
  }, []);

  const slices: DatasetTimeSlice[] = useMemo(() => data?.slices ?? [], [data]);
  const slice = slices[day] ?? slices[0];
  const observations = useMemo(() => slice?.observations ?? [], [slice]);
  const counts = useMemo(() => {
    const c: Record<PhenomenonType, number> = { fire: 0, precipitation: 0, sst: 0 };
    observations.forEach((o) => c[o.phenomenon]++);
    return c;
  }, [observations]);

  // Mirror the view into the share hash. A hash that already names this track is kept (it may carry frame/col keys).
  useEffect(() => {
    const cur = decodeShare(window.location.hash, { frames: [], pairs: [] })?.track;
    const url = window.location.pathname + window.location.search;
    if (showHero) { if (window.location.hash) history.replaceState(null, '', url); }
    else if (cur !== track) history.replaceState(null, '', `${url}#${encodeShare({ track, c: cty.id ?? undefined })}`);
    else { // same track: only add, change or drop the country key, leaving frame/col keys alone
      const p = new URLSearchParams(window.location.hash.replace(/^#v1&/, ''));
      if ((p.get('c') ?? null) !== cty.id) { if (cty.id) p.set('c', cty.id); else p.delete('c'); history.replaceState(null, '', `${url}#v1&${p.toString()}`); }
    }
  }, [track, showHero, cty.id]);

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

  const record = async () => {
    if (!audioReady) await soundOn();
    const name = await recordOutput(30, (s) => setRecording(t('recording', { s })));
    setRecording(name ? t('recordSaved', { name }) : null);
    window.setTimeout(() => setRecording(null), 2500);
  };

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (showHero) return;
      const k = e.key.toLowerCase();
      if (k === '?') { setSettingsOpen(true); return; }
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

  const imageryUrl = imagery && slice && /^\d{4}-\d{2}-\d{2}$/.test(slice.dateLabel) ? gibsUrl('VIIRS_SNPP_CorrectedReflectance_TrueColor', slice.dateLabel, 'jpeg', 2048) : null;

  const layersPanel = (
    <LayersPanel enabled={enabled} onToggle={(p) => setEnabled((o) => ({ ...o, [p]: !o[p] }))} counts={counts}
      statuses={data?.layerStatuses} isFallback={!!data?.isFallback} statusMessage={data?.statusMessage ?? 'Loading NASA data…'}
      audioReady={audioReady} onOpenData={() => setDataOpen(true)} />
  );
  const countryPanel = <CountryPanel list={cty.list} country={cty.country} point={cty.point} onSelect={cty.select} />;
  const placePanel = <PlacePanel place={place} onPick={(p) => { setPlace(p); setFocus(p); window.setTimeout(() => setFocus(null), 2500); }} onClose={() => setPlace(null)} />;
  const hearingPanel = <HearingPanel observations={observations} enabled={enabled} audioReady={audioReady} onSelect={(o) => { setSelected(o); SonificationEngine.getInstance().playObservation(o); }} />;

  return (
    <div className={`${showHero ? 'hero-open ' : ''}flex flex-col h-[100dvh] w-full max-w-[100vw] overflow-hidden`}>
      <a href={showHero ? '#landing' : '#main'} className="sr-only-focusable absolute z-[80] left-2 top-2 btn btn-brass">{t('skip')}</a>
      {showHero && <Landing fireObs={slices[0]?.observations.filter((o) => o.phenomenon === 'fire') ?? []} onPick={pickTrack} onExplore={() => pickTrack('atlas')}
        onTour={startTour} onListen={listenNow} onSilent={() => { setShowHero(false); setTrack('atlas'); }} onAbout={goAbout} onStage={setStage} />}

      <Header track={track} onLanding={showHero} onTrack={(tr) => { navigate(tr); setShowHero(false); setTourOpen(false); }} lastJukebox={lastJukebox}
        audioReady={audioReady} onToggleAudio={() => (audioReady ? soundOff() : soundOn())} onListen={listenNow}
        onHome={() => { setShowHero(true); setTourOpen(false); setStage(0); }} onTour={startTour} onData={() => setDataOpen(true)} onSettings={() => setSettingsOpen(true)}
        recording={recording} onRecord={record} />

      <main id="main" className="flex-1 relative w-full overflow-hidden">
        {/* First child = the visual canvas (the landing hero shows the globe from here). */}
        <div className="absolute inset-0">
          {(track === 'atlas' || showHero) && view === '3d-globe' && (
            <GlobeBoundary onFail={() => setGlobeFailed(true)} fallback={showHero
              ? <GlobeStill label={t('globeStill')} />
              : <Accessible2DMap observations={observations} enabledPhenomena={enabled} selectedObservation={selected} onSelectObservation={setSelected}
                countries={cty.list} country={cty.country} onSelectCountry={cty.select} />}>
              <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-[var(--ink-3)]">Loading globe…</div>}>
                <GlobeCanvas observations={observations} enabledPhenomena={showHero ? ALL_ON : enabled} selectedObservation={selected}
                  onSelectObservation={setSelected} autoRotate={autoRotate || showHero} targetFocus={focus} imageryUrl={imageryUrl}
                  onPickPlace={showHero ? undefined : (p) => { setPlace(p); if (window.innerWidth < 1024) setSheet('place'); }} pickedPlace={place}
                  framing={showHero ? STAGE_FRAMING[stage] : 'explore'}
                  countries={showHero ? undefined : cty.list} country={showHero ? null : cty.country} countryPoint={cty.point} onSelectCountry={showHero ? undefined : cty.select} />
              </Suspense>
            </GlobeBoundary>
          )}
          {track === 'atlas' && !showHero && view === '2d-map' && (
            <Accessible2DMap observations={observations} enabledPhenomena={enabled} selectedObservation={selected} onSelectObservation={setSelected}
                countries={cty.list} country={cty.country} onSelectCountry={cty.select} />
          )}
          {track === 'atlas' && !showHero && view === 'audio-first' && (
            <div className="w-full h-full overflow-y-auto py-6 lg:pl-[340px]">
              <AudioFirstMode observations={observations.filter((o) => enabled[o.phenomenon])} currentDateLabel={slice?.dateLabel ?? ''} selectedObservation={selected}
                onSelectObservation={setSelected} onExitAudioFirst={() => setView('3d-globe')}
                countries={{ list: cty.list, country: cty.country, point: cty.point, onSelect: cty.select }} />
            </div>
          )}
          {track !== 'atlas' && !showHero && (
            <Suspense fallback={<div className="h-full grid place-items-center text-sm text-[var(--ink-3)]">Loading…</div>}>
              {track === 'frames' && <FrameJukebox autoPlay={autoListen} onAutoPlayed={() => setAutoListen(false)} onPlay={() => { if (!audioReady) soundOn(); }} />}
              {track === 'monsoon' && <BangladeshMonsoon />}
              {track === 'pulse' && <VitalSigns />}
              {track === 'about' && <AboutPage onOpenMethod={() => setDataOpen(true)} />}
            </Suspense>
          )}
        </div>

        {track === 'atlas' && !showHero && (
          <>
            <TourBar open={tourOpen} onClose={() => { setTourOpen(false); setFocus(null); }}
              onApply={(layers, d, change, f) => { setEnabled(layers); setDay(Math.min(d, Math.max(0, slices.length - 1))); setHearChange(change); setFocus(f); if (view !== '3d-globe') setView('3d-globe'); }} />

            {/* Desktop side column */}
            <div className="hidden lg:flex flex-col gap-3 absolute left-3 top-3 bottom-[118px] w-[320px] overflow-y-auto scroll-thin z-20 pb-1">
              {view !== 'audio-first' && countryPanel}
              {layersPanel}
              {hearingPanel}
            </div>

            {/* View switch and globe options */}
            <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
              <div className="panel p-1 flex gap-1" role="group" aria-label="View">
                {([['3d-globe', Globe, 'globe'], ['2d-map', MapIcon, 'map'], ['audio-first', List, 'list']] as const).map(([v, Icon, key]) => (
                  <button key={v} className="btn btn-ghost min-h-[36px] px-2.5" aria-pressed={view === v} onClick={() => setView(v)}>
                    <Icon className="w-4 h-4" /><span className="hidden sm:inline">{t(key)}</span>
                  </button>
                ))}
              </div>
              {view === '3d-globe' && (
                <div className="panel p-1 flex flex-col gap-1">
                  <button className="btn btn-ghost min-h-[36px] px-2.5 justify-start" aria-pressed={imagery} onClick={() => setImagery(!imagery)} title={t('imageryHint')}><Satellite className="w-4 h-4" /><span className="hidden sm:inline">{t('imagery')}</span></button>
                  <button className="btn btn-ghost min-h-[36px] px-2.5 justify-start" aria-pressed={autoRotate} onClick={() => setAutoRotate(!autoRotate)} aria-label="Spin the globe"><RotateCw className="w-4 h-4" /><span className="hidden sm:inline">Spin</span></button>
                </div>
              )}
              {view === '3d-globe' && <div className="hidden lg:block w-[300px] max-h-[calc(100dvh-330px)] overflow-y-auto scroll-thin">{placePanel}</div>}
            </div>

            {/* Mobile panel buttons */}
            <div className="lg:hidden absolute left-3 top-3 z-20 flex flex-col gap-2">
              <button className="btn panel" onClick={() => setSheet('layers')}><Layers className="w-4 h-4" />{t('layers')}</button>
              <button className="btn panel" onClick={() => setSheet('hearing')}><AudioLines className="w-4 h-4" />{t('nowHearing')}</button>
              {view !== 'audio-first' && <button className="btn panel" onClick={() => setSheet('country')}><MapPinned className="w-4 h-4" />{t('country')}</button>}
              <button className="btn panel" onClick={() => setSheet('place')}><MapPin className="w-4 h-4" />{t('anyPlace')}</button>
            </div>
            {sheet && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setSheet(null)}>
                <div className="w-full max-h-[78dvh] overflow-y-auto bg-[var(--abyss)] rounded-t-2xl p-3 pb-6 border-t border-[var(--line)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                  <div className="flex justify-end"><button className="btn btn-ghost btn-icon" onClick={() => setSheet(null)} aria-label={t('close')}><X className="w-5 h-5" /></button></div>
                  {sheet === 'layers' ? layersPanel : sheet === 'place' ? placePanel : sheet === 'country' ? countryPanel : hearingPanel}
                </div>
              </div>
            )}

            <div className="absolute bottom-2 sm:bottom-3 left-2 right-2 lg:left-[340px] lg:right-3 z-20">
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
  );
}
export default App;
