import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { EarthObservation, PhenomenonType, DataSourceMode, DatasetTimeSlice } from './types/dataset';
import { DatasetAdapter } from './datasets/adapter';
import { AudioContextManager } from './audio/audioContext';
import { SonificationEngine } from './audio/sonificationEngine';
const GlobeCanvas = lazy(() => import('./globe/GlobeCanvas').then((m) => ({ default: m.GlobeCanvas })));
import { Accessible2DMap } from './map/Accessible2DMap';
import { AudioFirstMode } from './accessibility/AudioFirstMode';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { LiveCaption } from './components/LiveCaption';
import { TimelineControls } from './components/TimelineControls';
import { DatasetSelector } from './components/DatasetSelector';
import { InspectLocationModal } from './components/InspectLocationModal';
import { InfoModal } from './components/InfoModal';
import { GuidedDemoModal } from './demo/GuidedDemoModal';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { AuditoryLegend } from './legend/AuditoryLegend';
import { RotateCw, Volume2, X, Layers } from 'lucide-react';

export function App() {
  // --- Landing and App States ---
  const [showLandingHero, setShowLandingHero] = useState(true);
  const [viewMode, setViewMode] = useState<'3d-globe' | '2d-map' | 'audio-first'>('3d-globe');
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.65);
  const [spatialMode, setSpatialMode] = useState<'spatial-hrtf' | 'stereo-panning'>('stereo-panning');
  const [autoRotate, setAutoRotate] = useState(false);
  const [targetGlobeFocus, setTargetGlobeFocus] = useState<{ lat: number; lon: number } | null>(null);
  const [showAcousticCalibratedHint, setShowAcousticCalibratedHint] = useState(false);

  // --- Data and Timestep States ---
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('demo');
  const [timeSlices, setTimeSlices] = useState<DatasetTimeSlice[]>([]);
  const [statusMessage, setStatusMessage] = useState('Loading scientific data...');
  const [isFallback, setIsFallback] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [currentTimestepIndex, setCurrentTimestepIndex] = useState(0);

  // --- Timeline & Sonification Modifiers ---
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hearChangeMode, setHearChangeMode] = useState(false);

  // --- Phenomena Layers (Default to Wildfires-only on first start for acoustic clarity) ---
  const [enabledPhenomena, setEnabledPhenomena] = useState<Record<PhenomenonType, boolean>>({
    fire: true,
    precipitation: false,
    sst: false,
  });

  // --- Interactive Selection & Modals ---
  const [selectedObservation, setSelectedObservation] = useState<EarthObservation | null>(null);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<'science' | 'provenance' | 'legend'>('science');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isMobileLayersOpen, setIsMobileLayersOpen] = useState(false);

  // --- Initial Data Loading ---
  const loadData = useCallback(async (mode: DataSourceMode) => {
    setIsFetchingLive(mode === 'live');
    try {
      const res = await DatasetAdapter.loadDatasets(mode);
      setTimeSlices(res.slices);
      setStatusMessage(res.statusMessage);
      setIsFallback(res.isFallback);
      setDataSourceMode(res.mode);
    } catch {
      const fallback = DatasetAdapter.getDemoData();
      setTimeSlices(fallback);
      setStatusMessage('Curated demonstration dataset loaded.');
      setIsFallback(true);
      setDataSourceMode('demo');
    } finally {
      setIsFetchingLive(false);
    }
  }, []);

  useEffect(() => {
    loadData('demo');
  }, [loadData]);

  // Current slice observations
  const currentSlice = useMemo(() => {
    if (!timeSlices || timeSlices.length === 0) return null;
    return timeSlices[currentTimestepIndex] || timeSlices[0];
  }, [timeSlices, currentTimestepIndex]);

  const observations = useMemo(() => {
    return currentSlice ? currentSlice.observations : [];
  }, [currentSlice]);

  // Count by layer for layer selector
  const observationsCountByLayer = useMemo(() => {
    const counts: Record<PhenomenonType, number> = { fire: 0, precipitation: 0, sst: 0 };
    observations.forEach((obs) => {
      counts[obs.phenomenon] = (counts[obs.phenomenon] || 0) + 1;
    });
    return counts;
  }, [observations]);

  // Update master volume
  useEffect(() => {
    AudioContextManager.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // Toggle Spatial HRTF vs Stereo
  const handleToggleSpatialMode = () => {
    const nextMode = spatialMode === 'spatial-hrtf' ? 'stereo-panning' : 'spatial-hrtf';
    setSpatialMode(nextMode);
    SonificationEngine.getInstance().setSpatialMode(nextMode);
  };

  // Toggle phenomenon layer
  const handleTogglePhenomenon = (phenomenon: PhenomenonType) => {
    setEnabledPhenomena((prev) => ({
      ...prev,
      [phenomenon]: !prev[phenomenon],
    }));
  };

  // Toggle data source mode
  const handleToggleDataSourceMode = () => {
    const nextMode = dataSourceMode === 'demo' ? 'live' : 'demo';
    loadData(nextMode);
  };

  // Sync active observations to SonificationEngine strictly when audio is ready
  useEffect(() => {
    if (isAudioReady) {
      SonificationEngine.getInstance().syncObservations(observations, enabledPhenomena);
    } else {
      SonificationEngine.getInstance().stopAllVoices();
    }
  }, [isAudioReady, observations, enabledPhenomena, currentTimestepIndex]);

  // Start Audio & enter app
  const handleInitAudio = async () => {
    await AudioContextManager.init();
    SonificationEngine.getInstance().setAudioUnlocked(true);
    setIsAudioReady(true);
    SonificationEngine.getInstance().syncObservations(observations, enabledPhenomena);
  };

  const handleStopAudio = () => {
    setIsAudioReady(false);
    SonificationEngine.getInstance().setAudioUnlocked(false);
  };

  const handleStartListeningFromHero = async () => {
    await handleInitAudio();
    setShowLandingHero(false);
  };

  const handleStartGuidedTourFromHero = async () => {
    await handleInitAudio();
    setShowLandingHero(false);
    setIsGuidedDemoOpen(true);
  };

  // Modal helper
  const openInfoModal = (tab: 'science' | 'provenance' | 'legend') => {
    setInfoModalTab(tab);
    setIsInfoModalOpen(true);
  };

  const activeLayersCount = Object.values(enabledPhenomena).filter(Boolean).length;

  return (
    <div className={`${showLandingHero ? 'hero-open ' : ''}flex flex-col h-[100dvh] w-full max-w-[100vw] bg-transparent text-white font-sans overflow-hidden select-none`}>
      {/* Landing Cinematic Hero */}
      {showLandingHero && (
        <LandingHero
          onStartListening={handleStartListeningFromHero}
          onExploreGlobe={() => setShowLandingHero(false)}
          onStartGuidedTour={handleStartGuidedTourFromHero}
        />
      )}

      {/* Navigation & Telemetry Console */}
      <Header
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        spatialMode={spatialMode}
        onToggleSpatialMode={handleToggleSpatialMode}
        isAudioReady={isAudioReady}
        onInitAudio={handleInitAudio}
        onStopAudio={handleStopAudio}
        masterVolume={masterVolume}
        onChangeMasterVolume={setMasterVolume}
        onOpenDemo={() => setIsGuidedDemoOpen(true)}
        onOpenProvenance={() => openInfoModal('provenance')}
        onOpenFormulas={() => openInfoModal('science')}
        onGoHome={() => setShowLandingHero(true)}
      />

      {/* Center Canvas Area: 3D Globe vs 2D Map vs Audio-First */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {viewMode === '3d-globe' && (
          <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-slate-400">Loading globe…</div>}>
          <GlobeCanvas
            observations={observations}
            enabledPhenomena={enabledPhenomena}
            selectedObservation={selectedObservation}
            onSelectObservation={setSelectedObservation}
            autoRotate={autoRotate || showLandingHero}
            targetFocus={targetGlobeFocus}
          />
          </Suspense>
        )}

        {viewMode === '2d-map' && (
          <Accessible2DMap
            observations={observations}
            enabledPhenomena={enabledPhenomena}
            selectedObservation={selectedObservation}
            onSelectObservation={setSelectedObservation}
          />
        )}

        {viewMode === 'audio-first' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950 py-6">
            <AudioFirstMode
              observations={observations}
              currentDateLabel={currentSlice?.dateLabel || 'August 2026'}
              selectedObservation={selectedObservation}
              onSelectObservation={setSelectedObservation}
              onExitAudioFirst={() => setViewMode('3d-globe')}
            />
          </div>
        )}

        {/* Floating HUD Controls for 3D and 2D Views */}
        {viewMode !== 'audio-first' && (
          <>
            {/* Desktop Left Drawer: Dataset Layers Selector */}
            <div className="hidden md:block absolute top-4 left-4 z-20 w-72 max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)]">
              <DatasetSelector
                enabledPhenomena={enabledPhenomena}
                onTogglePhenomenon={handleTogglePhenomenon}
                dataSourceMode={dataSourceMode}
                onToggleDataSourceMode={handleToggleDataSourceMode}
                isFetchingLive={isFetchingLive}
                isFallback={isFallback}
                observationsCountByLayer={observationsCountByLayer}
              />
            </div>

            {/* Mobile Left Drawer Trigger Button */}
            <div className="md:hidden absolute top-3 left-3 z-20">
              <button
                onClick={() => setIsMobileLayersOpen(true)}
                className="px-3 py-1.5 min-h-[38px] rounded-lg bg-slate-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md cursor-pointer"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>LAYERS ({activeLayersCount})</span>
              </button>
            </div>

            {/* Mobile Dataset Layers Bottom Drawer Sheet */}
            {isMobileLayersOpen && (
              <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-950 border-t border-slate-800 rounded-t-2xl p-4 max-h-[80dvh] overflow-y-auto space-y-3 shadow-2xl safe-pb">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      DATASET OBSERVATION LAYERS
                    </span>
                    <button
                      onClick={() => setIsMobileLayersOpen(false)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <DatasetSelector
                    enabledPhenomena={enabledPhenomena}
                    onTogglePhenomenon={handleTogglePhenomenon}
                    dataSourceMode={dataSourceMode}
                    onToggleDataSourceMode={handleToggleDataSourceMode}
                    isFetchingLive={isFetchingLive}
                    isFallback={isFallback}
                    observationsCountByLayer={observationsCountByLayer}
                  />
                </div>
              </div>
            )}

            {/* Globe Quick Controls (Auto-Rotate toggle & View Reset) */}
            {viewMode === '3d-globe' && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col gap-2">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border text-xs font-mono transition gap-1.5 shadow-xl backdrop-blur-md ${
                    autoRotate
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                      : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title={autoRotate ? 'Pause Globe Auto-Rotation' : 'Auto-Rotate Globe'}
                  aria-label="Toggle Globe Rotation"
                >
                  <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{autoRotate ? 'Spinning' : 'Spin'}</span>
                </button>

                <button
                  onClick={() => setIsLegendOpen(!isLegendOpen)}
                  className={`p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border text-xs font-mono transition gap-1.5 shadow-xl backdrop-blur-md ${
                    isLegendOpen
                      ? 'bg-slate-900/90 text-cyan-400 border-slate-700'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                  title="Toggle Auditory Legend Panel"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Legend</span>
                </button>
              </div>
            )}

            {/* Right Side: Collapsible Auditory Legend */}
            {isLegendOpen && viewMode === '3d-globe' && (
              <div className="absolute bottom-24 right-4 z-20 w-80 max-w-[calc(100vw-32px)] animate-fade-in hidden md:block">
                {showAcousticCalibratedHint && (
                  <div className="mb-2.5 p-3 rounded-xl bg-slate-900/95 border border-cyan-500/60 shadow-xl backdrop-blur-md text-white text-xs animate-fade-in">
                    <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" />
                        ACOUSTIC CALIBRATION ACTIVE
                      </span>
                      <button
                        onClick={() => setShowAcousticCalibratedHint(false)}
                        className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                        aria-label="Dismiss hint"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Calibrated to <strong>Active Wildfires only</strong> with gentle volume for listening clarity.
                      Click <strong>[ Hear Fire ]</strong> below to isolate the sound, or activate Rain and Ocean in the left panel.
                    </p>
                  </div>
                )}
                <AuditoryLegend />
              </div>
            )}

            {/* Bottom Center: Timeline Controls */}
            <div className="absolute bottom-2 sm:bottom-4 inset-x-2 sm:inset-x-4 max-w-4xl mx-auto z-20">
              <TimelineControls
                currentTimestepIndex={currentTimestepIndex}
                onChangeTimestep={setCurrentTimestepIndex}
                isPlaying={isPlayingTimeline}
                onTogglePlay={() => setIsPlayingTimeline(!isPlayingTimeline)}
                playbackSpeed={playbackSpeed}
                onChangePlaybackSpeed={setPlaybackSpeed}
                hearChangeMode={hearChangeMode}
                onToggleHearChangeMode={() => setHearChangeMode(!hearChangeMode)}
              />
            </div>
          </>
        )}
        {!showLandingHero && <LiveCaption observations={observations} enabled={enabledPhenomena} />}
      </main>

      {/* Selected Location Inspector Modal */}
      <InspectLocationModal
        observation={selectedObservation}
        onClose={() => setSelectedObservation(null)}
      />

      {/* Guided Cinematic Demo Controller Modal */}
      <GuidedDemoModal
        isOpen={isGuidedDemoOpen}
        onClose={() => {
          setIsGuidedDemoOpen(false);
          setTargetGlobeFocus(null);
        }}
        onApplyStepState={(phenomena, timestepIdx, changeMode, cameraFocus) => {
          setEnabledPhenomena(phenomena);
          setCurrentTimestepIndex(timestepIdx);
          setHearChangeMode(changeMode);
          if (cameraFocus) {
            setTargetGlobeFocus(cameraFocus);
          }
        }}
      />

      {/* Science and Provenance Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        initialTab={infoModalTab}
        onClose={() => setIsInfoModalOpen(false)}
        dataSourceMode={dataSourceMode}
        statusMessage={statusMessage}
        isFallback={isFallback}
      />

      {/* Scientific & Performance Diagnostics Overlay */}
      <DiagnosticsPanel
        activeDatasetCount={observations.length}
        currentTimestep={currentTimestepIndex}
        totalTimesteps={timeSlices.length}
        isOpen={isDiagnosticsOpen}
        onToggle={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
      />
    </div>
  );
}
export default App;
