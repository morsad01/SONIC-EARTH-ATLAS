import React from 'react';
import { Volume2, Sparkles, Globe, Map as MapIcon, Sliders, Database, Headphones, Radio } from 'lucide-react';

interface HeaderProps {
  viewMode: '3d-globe' | '2d-map' | 'audio-first';
  onChangeViewMode: (mode: '3d-globe' | '2d-map' | 'audio-first') => void;
  spatialMode: 'spatial-hrtf' | 'stereo-panning';
  onToggleSpatialMode: () => void;
  isAudioReady: boolean;
  onInitAudio: () => void;
  masterVolume: number;
  onChangeMasterVolume: (vol: number) => void;
  onOpenDemo: () => void;
  onOpenProvenance: () => void;
  onOpenFormulas: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onChangeViewMode,
  spatialMode,
  onToggleSpatialMode,
  isAudioReady,
  onInitAudio,
  masterVolume,
  onChangeMasterVolume,
  onOpenDemo,
  onOpenProvenance,
  onOpenFormulas,
}) => {
  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-mono tracking-wider text-white leading-tight">
              SONIC EARTH ATLAS
            </h1>
            <p className="text-[10px] font-mono text-cyan-400">
              Hear Where Earth Is Changing
            </p>
          </div>
        </div>

        <span className="hidden lg:inline-block text-slate-700">|</span>
        <span className="hidden lg:inline-block text-[11px] font-mono text-slate-400">
          NASA Earth Observations Spatial Sonification
        </span>
      </div>

      {/* View Switcher (3D Globe vs 2D Map vs Audio-First) */}
      <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-mono">
        <button
          onClick={() => onChangeViewMode('3d-globe')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
            viewMode === '3d-globe'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white'
          }`}
          aria-label="Switch to 3D Globe View"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D Earth</span>
        </button>

        <button
          onClick={() => onChangeViewMode('2d-map')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
            viewMode === '2d-map'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow'
              : 'text-slate-300 hover:text-white'
          }`}
          aria-label="Switch to 2D Accessible Map View"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">2D Map</span>
        </button>

        <button
          onClick={() => onChangeViewMode('audio-first')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
            viewMode === 'audio-first'
              ? 'bg-purple-500 text-slate-950 font-bold shadow'
              : 'text-purple-300 hover:text-white'
          }`}
          aria-label="Switch to Audio-First Mode"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Audio-First</span>
        </button>
      </div>

      {/* Main Interactive Modals & Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Experience Sonic Earth Guided Demo Button */}
        <button
          onClick={onOpenDemo}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/10 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>EXPERIENCE SONIC EARTH</span>
        </button>

        {/* Scientific Formulas */}
        <button
          onClick={onOpenFormulas}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
          title="Inspect Sonification Mathematics & Formulas"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Science</span>
        </button>

        {/* Data & Provenance */}
        <button
          onClick={onOpenProvenance}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
          title="Data Sources, Registry & Provenance"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Data &amp; Sources</span>
        </button>

        {/* Spatial Audio Toggle */}
        <button
          onClick={onToggleSpatialMode}
          className={`px-2 py-1.5 rounded-lg text-xs font-mono border transition ${
            spatialMode === 'spatial-hrtf'
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title="Toggle 3D HRTF Spatial vs Stereo Fallback"
        >
          {spatialMode === 'spatial-hrtf' ? 'HRTF 3D' : 'Stereo'}
        </button>

        {/* Web Audio API Gestural Trigger & Master Volume */}
        {!isAudioReady ? (
          <button
            onClick={onInitAudio}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 animate-pulse"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>START AUDIO</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.05"
              value={masterVolume}
              onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
              aria-label="Master Volume"
            />
          </div>
        )}
      </div>
    </header>
  );
};
