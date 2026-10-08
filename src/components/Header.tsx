import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Globe, Map as MapIcon, Sliders, Database, Headphones, Radio, Settings, X, Home } from 'lucide-react';

interface HeaderProps {
  viewMode: '3d-globe' | '2d-map' | 'audio-first';
  onChangeViewMode: (mode: '3d-globe' | '2d-map' | 'audio-first') => void;
  spatialMode: 'spatial-hrtf' | 'stereo-panning';
  onToggleSpatialMode: () => void;
  isAudioReady: boolean;
  onInitAudio: () => void;
  onStopAudio: () => void;
  masterVolume: number;
  onChangeMasterVolume: (vol: number) => void;
  onOpenDemo: () => void;
  onOpenProvenance: () => void;
  onOpenFormulas: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onChangeViewMode,
  spatialMode,
  onToggleSpatialMode,
  isAudioReady,
  onInitAudio,
  onStopAudio,
  masterVolume,
  onChangeMasterVolume,
  onOpenDemo,
  onOpenProvenance,
  onOpenFormulas,
  onGoHome,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full max-w-[100vw] bg-slate-950/90 border-b border-slate-800/80 px-2.5 sm:px-4 py-2 pt-[max(0.4rem,env(safe-area-inset-top))] backdrop-blur-md sticky top-0 z-40 shadow-xl overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        {/* Brand & Mission Telemetry (Clickable to go Home) */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 hover:opacity-85 transition cursor-pointer text-left focus:outline-none"
          title="Return to Home Page"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/30 shrink-0">
            <Radio className="w-3.5 h-3.5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FC3D21] animate-pulse shrink-0" />
              <h1 className="text-xs sm:text-sm font-bold font-mono tracking-wider text-white leading-none truncate max-w-[140px] sm:max-w-none">
                SONIC EARTH ATLAS
              </h1>
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400 mt-0.5 tracking-tight hidden sm:block">
              Hear Where Earth Is Changing
            </p>
          </div>
        </button>

        {/* View Switcher (3D Globe vs 2D Map vs Audio-First) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg text-xs font-mono shadow-inner shrink-0">
          <button
            onClick={() => onChangeViewMode('3d-globe')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 min-h-[36px] rounded flex items-center gap-1 transition cursor-pointer ${
              viewMode === '3d-globe'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            aria-label="Switch to 3D Globe View"
            title="3D Earth View"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px] sm:text-xs">3D Earth</span>
          </button>

          <button
            onClick={() => onChangeViewMode('2d-map')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 min-h-[36px] rounded flex items-center gap-1 transition cursor-pointer ${
              viewMode === '2d-map'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            aria-label="Switch to 2D Accessible Map View"
            title="2D Map View"
          >
            <MapIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px] sm:text-xs">2D Map</span>
          </button>

          <button
            onClick={() => onChangeViewMode('audio-first')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 min-h-[36px] rounded flex items-center gap-1 transition cursor-pointer ${
              viewMode === 'audio-first'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                : 'text-purple-300 hover:text-white hover:bg-slate-800/60'
            }`}
            aria-label="Switch to Audio-First Mode"
            title="Audio-First Mode"
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px] sm:text-xs">Audio-First</span>
          </button>
        </div>

        {/* Guided Demo Button & Audio Control Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenDemo}
            className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-md shadow-orange-500/15 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span className="hidden sm:inline">EXPERIENCE SONIC EARTH</span>
            <span className="sm:hidden">TOUR</span>
          </button>

          {/* Desktop Control Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={onGoHome}
              className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Return to Landing Home Page"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Home</span>
            </button>

            <button
              onClick={onOpenFormulas}
              className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
              title="Inspect Sonification Mathematics & Formulas"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Science</span>
            </button>

            <button
              onClick={onOpenProvenance}
              className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
              title="Data Sources, Registry & Provenance"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Data</span>
            </button>

            <button
              onClick={onToggleSpatialMode}
              className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-mono border transition cursor-pointer ${
                spatialMode === 'spatial-hrtf'
                  ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/80'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {spatialMode === 'spatial-hrtf' ? 'HRTF 3D' : 'Stereo'}
            </button>

            {!isAudioReady ? (
              <button
                onClick={onInitAudio}
                className="px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1 animate-pulse cursor-pointer shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>START AUDIO</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-900/90 px-2 py-1 min-h-[36px] rounded-lg border border-slate-800">
                <button
                  onClick={onStopAudio}
                  className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Stop all audio output immediately"
                  aria-label="Stop Audio"
                >
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>STOP</span>
                </button>
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

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle Mobile Options Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Settings Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                onGoHome();
                setIsMobileMenuOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                onOpenFormulas();
                setIsMobileMenuOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Science</span>
            </button>

            <button
              onClick={() => {
                onOpenProvenance();
                setIsMobileMenuOpen(false);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Data</span>
            </button>

            <button
              onClick={onToggleSpatialMode}
              className={`px-2.5 py-1.5 rounded-lg border ${
                spatialMode === 'spatial-hrtf'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {spatialMode === 'spatial-hrtf' ? 'HRTF 3D' : 'Stereo'}
            </button>
          </div>

          {!isAudioReady ? (
            <button
              onClick={() => {
                onInitAudio();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>START AUDIO</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  onStopAudio();
                  setIsMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>STOP</span>
              </button>
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.05"
                value={masterVolume}
                onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-cyan-400 bg-slate-800 rounded cursor-pointer"
                aria-label="Master Volume"
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
};
