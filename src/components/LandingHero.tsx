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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex flex-col justify-between p-6 sm:p-12 text-white bg-gradient-to-b from-slate-950/85 via-slate-950/65 to-slate-950/90 transition-opacity duration-500">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Tagline Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>NASA SPACE APPS CHALLENGE 2026</span>
        </div>
        <div className="text-xs font-mono text-slate-500">
          ESDIS • FIRMS • GPM IMERG • GHRSST
        </div>
      </div>

      {/* Main Hero Section */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-wider">
          PLANETARY SPATIAL SONIFICATION INSTRUMENT
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white leading-tight">
          SONIC EARTH ATLAS
        </h1>

        <p className="text-xl sm:text-2xl font-light text-cyan-200/90 tracking-wide font-sans">
          Hear Where Earth Is Changing.
        </p>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          An interactive auditory map powered by NASA Earth observations. We transform authoritative machine-readable
          climate measurements into an explorable spatial auditory environment.
        </p>

        {/* Cinematic Preview Banner */}
        <div className="relative max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
          <img
            src="/images/sonic_earth_hero.jpg"
            alt="Sonic Earth Atlas Planetary Sonification"
            className="w-full h-44 sm:h-52 object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
          <div className="absolute bottom-2 left-4 text-left">
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-800">
              NASA SPATIAL ACOUSTIC SOUNDSCAPE • 8K TELEMETRY
            </span>
          </div>
        </div>

        {/* Primary & Secondary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onStartGuidedTour}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-orange-500/25 transition transform hover:-translate-y-0.5 cursor-pointer ring-1 ring-amber-400/50"
            aria-label="Experience the 35-second guided cinematic tour"
          >
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>EXPERIENCE 35-SECOND GUIDED TOUR</span>
          </button>

          <button
            onClick={onStartListening}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 cursor-pointer"
            aria-label="Start listening to Earth with audio enabled"
          >
            <Volume2 className="w-5 h-5" />
            <span>LISTEN TO EARTH</span>
          </button>

          <button
            onClick={onExploreGlobe}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            aria-label="Explore the interactive 3D globe"
          >
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>EXPLORE GLOBE</span>
          </button>
        </div>

        {/* Three Core Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
              <Compass className="w-4 h-4" />
              WHERE
            </div>
            <div className="text-sm font-semibold text-white">Geographic Position</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Longitude maps directly to spatial stereo placement while latitude influences acoustic elevation and depth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold mb-1">
              <Activity className="w-4 h-4" />
              WHAT
            </div>
            <div className="text-sm font-semibold text-white">Phenomenon Identity</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Active wildfires crackle with thermal bursts, precipitation cascades in droplet pings, and ocean anomalies swell as drones.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold mb-1">
              <Clock className="w-4 h-4" />
              HOW IT CHANGES
            </div>
            <div className="text-sm font-semibold text-white">Temporal Dynamics</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Move along the timeline to hear rates of change (Δ). Accelerated events pitch upward and intensify.
            </p>
          </div>
        </div>

        {/* How It Works Pipeline Diagram */}
        <div className="pt-6 border-t border-slate-900">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-3">
            Deterministic Pipeline Architecture
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-300">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">NASA EARTH DATA</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">SCIENTIFIC VALUES</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">SONIFICATION ENGINE</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">SPATIAL AUDIO</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">HUMAN PERCEPTION</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono border-t border-slate-800/80 pt-4 max-w-5xl mx-auto w-full">
        <div>Not an official NASA product. Uses public domain Earth observations.</div>
        <div className="text-slate-400 mt-1 sm:mt-0">Web Audio API • Three.js • Accessibility-First</div>
      </div>
    </div>
  );
};
