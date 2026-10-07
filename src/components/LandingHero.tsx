import React from 'react';
import { Volume2, Globe, Activity, Compass, Clock, Sparkles } from 'lucide-react';

interface LandingHeroProps {
  onStartListening: () => void;
  onExploreGlobe: () => void;
  onStartGuidedTour: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartListening,
  onExploreGlobe,
  onStartGuidedTour,
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 md:p-12 text-white bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90 transition-opacity duration-500 max-w-[100vw] overflow-x-hidden safe-pb safe-pt">
      {/* Background radial atmosphere glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] bg-cyan-600/10 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-wider text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-[#FC3D21] animate-pulse shadow-[0_0_8px_#FC3D21]" />
          <span className="text-slate-300 font-semibold">NASA SPACE APPS CHALLENGE 2026</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">ESDIS</span>
          <span className="text-slate-600">•</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">FIRMS</span>
          <span className="text-slate-600">•</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">GPM</span>
          <span className="text-slate-600">•</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">GHRSST</span>
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="max-w-4xl mx-auto w-full my-auto py-4 sm:py-6 text-center space-y-4 sm:space-y-6">
        <div className="inline-block px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] sm:text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(56,189,248,0.15)] max-w-full truncate">
          PLANETARY SPATIAL SONIFICATION INSTRUMENT
        </div>

        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-tight drop-shadow-sm">
          SONIC EARTH ATLAS
        </h1>

        <p className="text-lg sm:text-2xl font-light text-cyan-100/90 tracking-wide font-sans">
          Hear Where Earth Is Changing.
        </p>

        <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans px-2">
          Explore NASA Earth observations as spatial sound — where geographic location, environmental phenomenon, and temporal change become something you can hear.
        </p>

        {/* Cinematic Telemetry Banner */}
        <div className="relative max-w-2xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl group">
          <img
            src="/images/sonic_earth_hero.jpg"
            alt="Sonic Earth Atlas Planetary Sonification"
            className="w-full h-36 sm:h-52 object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
          <div className="absolute bottom-2.5 left-3 text-left">
            <span className="text-[9px] sm:text-[10px] font-mono text-cyan-300 tracking-wider uppercase bg-slate-950/90 px-2 py-0.5 sm:py-1 rounded border border-cyan-800/80 shadow-lg">
              NASA SPATIAL ACOUSTIC SOUNDSCAPE • MULTI-TEMPORAL TELEMETRY
            </span>
          </div>
        </div>

        {/* Primary & Secondary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
          <button
            onClick={onStartGuidedTour}
            className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer ring-1 ring-amber-400/50"
            aria-label="Experience the 35-second guided cinematic tour"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 shrink-0" />
            <span>EXPERIENCE 35-SECOND GUIDED TOUR</span>
          </button>

          <button
            onClick={onStartListening}
            className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            aria-label="Start listening to Earth with audio enabled"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>LISTEN TO EARTH</span>
          </button>

          <button
            onClick={onExploreGlobe}
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-mono font-semibold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            aria-label="Explore the interactive 3D globe"
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <span>EXPLORE GLOBE</span>
          </button>
        </div>

        {/* Three Core Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 text-left">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
              <Compass className="w-4 h-4" />
              WHERE
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white">Geographic Position</div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
              Longitude maps to spatial stereo panning while latitude controls acoustic elevation tilt and 3D HRTF spatial positioning.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-amber-500/30 transition">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold mb-1">
              <Activity className="w-4 h-4" />
              WHAT
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white">Phenomenon Identity</div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
              Active wildfires crackle with thermal bursts, precipitation cascades in droplet pings, and ocean anomalies swell as drones.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-sm hover:border-purple-500/30 transition">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold mb-1">
              <Clock className="w-4 h-4" />
              HOW IT CHANGES
            </div>
            <div className="text-xs sm:text-sm font-semibold text-white">Temporal Dynamics</div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
              Advance through time to hear differential rates of change (Δ). Intensifying events pitch upward and accelerate.
            </p>
          </div>
        </div>

        {/* How It Works Pipeline Diagram */}
        <div className="pt-4 sm:pt-6 border-t border-slate-900">
          <div className="text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-2.5">
            Deterministic Pipeline Architecture
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-slate-300">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">NASA DATA</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SCIENTIFIC VALUES</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SONIFICATION ENGINE</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SPATIAL AUDIO</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">PERCEIVED SOUND</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 font-mono border-t border-slate-800/80 pt-3 max-w-5xl mx-auto w-full gap-1">
        <div>Not an official NASA product. Uses public domain Earth observations.</div>
        <div className="text-slate-400">Web Audio API • Three.js • Accessibility-First</div>
      </div>
    </div>
  );
};
