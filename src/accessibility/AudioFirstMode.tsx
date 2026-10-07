import React, { useState } from 'react';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { Volume2, VolumeX, Radio, Flame, CloudRain, Waves } from 'lucide-react';

interface AudioFirstModeProps {
  observations: EarthObservation[];
  currentDateLabel: string;
  selectedObservation: EarthObservation | null;
  onSelectObservation: (obs: EarthObservation | null) => void;
  onExitAudioFirst: () => void;
}

export const AudioFirstMode: React.FC<AudioFirstModeProps> = ({
  observations,
  currentDateLabel,
  selectedObservation,
  onSelectObservation,
  onExitAudioFirst,
}) => {
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [activePhenomenonFilter, setActivePhenomenonFilter] = useState<'all' | PhenomenonType>('all');

  const filtered = activePhenomenonFilter === 'all'
    ? observations
    : observations.filter((o) => o.phenomenon === activePhenomenonFilter);

  const speakDescription = (text: string) => {
    if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelect = (obs: EarthObservation) => {
    onSelectObservation(obs);
    SonificationEngine.getInstance().playObservation(obs);
    const spokenText = `${obs.regionName}. ${obs.variable}: ${obs.value} ${obs.unit}. Panned ${
      obs.longitude < 0 ? `${Math.abs(Math.round(obs.longitude / 1.8))}% to the left` : `${Math.round(obs.longitude / 1.8)}% to the right`
    }.`;
    speakDescription(spokenText);
  };

  return (
    <div
      className="p-6 max-w-5xl mx-auto w-full space-y-6 text-white"
      role="region"
      aria-label="Audio-First Earth Science Exploration Mode"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border-2 border-cyan-500 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold font-mono tracking-wide">
              AUDIO-FIRST EXPLORATION CONSOLE
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Optimized for low-vision users, screen-readers, and non-visual cognitive exploration.
            Spatial audio delivers geographic and scientific data directly to your ears.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !speechEnabled;
              setSpeechEnabled(next);
              if (next) speakDescription('Spoken text descriptions enabled.');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition ${
              speechEnabled
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            aria-pressed={speechEnabled}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Voice Narration: {speechEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onExitAudioFirst}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            Switch to Visual 3D
          </button>
        </div>
      </div>

      {/* Phenomenon Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 mr-2">Filter Phenomenon:</span>
        <button
          onClick={() => setActivePhenomenonFilter('all')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
            activePhenomenonFilter === 'all'
              ? 'bg-slate-100 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          All Data ({observations.length})
        </button>
        <button
          onClick={() => setActivePhenomenonFilter('fire')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition ${
            activePhenomenonFilter === 'fire'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Fires Only</span>
        </button>
        <button
          onClick={() => setActivePhenomenonFilter('precipitation')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition ${
            activePhenomenonFilter === 'precipitation'
              ? 'bg-cyan-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-cyan-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Precipitation Only</span>
        </button>
        <button
          onClick={() => setActivePhenomenonFilter('sst')}
          className={`px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition ${
            activePhenomenonFilter === 'sst'
              ? 'bg-purple-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-purple-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Ocean SST Only</span>
        </button>
      </div>

      {/* High-Contrast Accessible Observation Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">ACTIVE TIMESTEP: {currentDateLabel}</span>
          <span className="text-cyan-400">Select any row using mouse or keyboard Tab + Enter</span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto">
          {filtered.map((obs) => {
            const isSelected = selectedObservation?.id === obs.id;
            const panPercent = Math.round((obs.longitude / 180) * 100);
            const panLabel = panPercent < 0 ? `${Math.abs(panPercent)}% Left` : panPercent > 0 ? `${panPercent}% Right` : 'Center';

            return (
              <div
                key={obs.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(obs)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(obs);
                  }
                }}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer transition ${
                  isSelected
                    ? 'bg-cyan-950/40 border-l-4 border-cyan-400 text-white'
                    : 'hover:bg-slate-800/60 text-slate-200'
                }`}
                aria-label={`${obs.regionName}. ${obs.variable}: ${obs.value} ${obs.unit}. Stereo position: ${panLabel}.`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg mt-0.5"
                    style={{
                      backgroundColor:
                        obs.phenomenon === 'fire'
                          ? 'rgba(255, 77, 0, 0.15)'
                          : obs.phenomenon === 'precipitation'
                          ? 'rgba(0, 208, 255, 0.15)'
                          : 'rgba(191, 90, 242, 0.15)',
                      color:
                        obs.phenomenon === 'fire'
                          ? '#ff4d00'
                          : obs.phenomenon === 'precipitation'
                          ? '#00d0ff'
                          : '#bf5af2',
                    }}
                  >
                    {obs.phenomenon === 'fire' ? (
                      <Flame className="w-5 h-5" />
                    ) : obs.phenomenon === 'precipitation' ? (
                      <CloudRain className="w-5 h-5" />
                    ) : (
                      <Waves className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{obs.regionName}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-bold uppercase">
                          Currently Sonifying
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {obs.variable} • Coordinates: {obs.latitude > 0 ? `+${obs.latitude.toFixed(1)}°` : `${obs.latitude.toFixed(1)}°`} Lat, {obs.longitude > 0 ? `+${obs.longitude.toFixed(1)}°` : `${obs.longitude.toFixed(1)}°`} Lon
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-base font-bold text-white">
                      {obs.value} <span className="text-xs text-slate-400">{obs.unit}</span>
                    </div>
                    {obs.delta !== undefined && (
                      <div className={`text-[11px] ${obs.delta >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                        Δ {obs.delta > 0 ? `+${obs.delta.toFixed(1)}` : obs.delta.toFixed(1)} vs prev
                      </div>
                    )}
                  </div>

                  <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-cyan-300">
                    Pan: {panLabel}
                  </div>

                  <button
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="Play Audio for Location"
                    aria-label={`Play audio for ${obs.regionName}`}
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
