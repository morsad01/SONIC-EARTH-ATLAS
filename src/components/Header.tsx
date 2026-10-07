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
    <header className="w-full max-w-[100vw] bg-slate-950/90 border-b border-slate-800/80 px-3 sm:px-4 py-2 sm:py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-xl overflow-x-hidden">
      {/* Brand & Mission Telemetry */}
      <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/30 shrink-0">
            <Radio className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FC3D21] animate-pulse" />
              <h1 className="text-xs sm:text-sm font-bold font-mono tracking-wider text-white leading-none">
                SONIC EARTH ATLAS
              </h1>
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400 mt-0.5 tracking-tight">
              Hear Where Earth Is Changing
            </p>
          </div>
        </div>

        <span className="hidden lg:inline-block text-slate-800">|</span>
        <span className="hidden lg:inline-block text-[11px] font-mono text-slate-400">
          NASA Earth Observations Spatial Sonification
        </span>
      </div>

      {/* View Switcher (3D Globe vs 2D Map vs Audio-First) */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg text-xs font-mono shadow-inner min-h-[44px]">
        <button
          onClick={() => onChangeViewMode('3d-globe')}
          className={`px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded flex items-center gap-1.5 transition cursor-pointer ${
            viewMode === '3d-globe'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          aria-label="Switch to 3D Globe View"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">3D Earth</span>
        </button>

        <button
          onClick={() => onChangeViewMode('2d-map')}
          className={`px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded flex items-center gap-1.5 transition cursor-pointer ${
            viewMode === '2d-map'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          aria-label="Switch to 2D Accessible Map View"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">2D Map</span>
        </button>

        <button
          onClick={() => onChangeViewMode('audio-first')}
          className={`px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded flex items-center gap-1.5 transition cursor-pointer ${
            viewMode === 'audio-first'
              ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
              : 'text-purple-300 hover:text-white hover:bg-slate-800/60'
          }`}
          aria-label="Switch to Audio-First Mode"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">Audio-First</span>
        </button>
      </div>

      {/* Main Interactive Modals & Telemetry Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-h-[44px]">
        {/* Guided Demo CTA */}
        <button
          onClick={onOpenDemo}
          className="px-3 py-2 min-h-[44px] rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-mono text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/15 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span>EXPERIENCE SONIC EARTH</span>
        </button>

        {/* Scientific Formulas */}
        <button
          onClick={onOpenFormulas}
          className="px-2.5 py-2 min-h-[44px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] sm:text-xs font-mono flex items-center gap-1 transition cursor-pointer"
          title="Inspect Sonification Mathematics & Formulas"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Science</span>
        </button>

        {/* Data & Provenance */}
        <button
          onClick={onOpenProvenance}
          className="px-2.5 py-2 min-h-[44px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] sm:text-xs font-mono flex items-center gap-1 transition cursor-pointer"
          title="Data Sources, Registry & Provenance"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Data</span>
        </button>

        {/* Spatial Audio Toggle */}
        <button
          onClick={onToggleSpatialMode}
          className={`px-2.5 py-2 min-h-[44px] rounded-lg text-[11px] sm:text-xs font-mono border transition cursor-pointer ${
            spatialMode === 'spatial-hrtf'
              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/80 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle 3D HRTF Spatial vs Stereo Fallback"
        >
          {spatialMode === 'spatial-hrtf' ? 'HRTF 3D' : 'Stereo'}
        </button>

        {/* Web Audio API Gestural Trigger & Master Volume */}
        {!isAudioReady ? (
          <button
            onClick={onInitAudio}
            className="px-3 py-2 min-h-[44px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-[11px] sm:text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>START AUDIO</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-2 min-h-[44px] rounded-lg border border-slate-800">
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
