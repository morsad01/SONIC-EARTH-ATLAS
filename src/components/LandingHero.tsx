import React from 'react';
import { Volume2, Globe, Sparkles } from 'lucide-react';

interface LandingHeroProps {
  onStartListening: () => void;
  onExploreGlobe: () => void;
  onStartGuidedTour: () => void;
}

const DIMENSIONS = [
  { dot: 'bg-cyan-400', title: 'Where', text: 'Left to right, a sound moves with longitude. Higher or lower in pitch tilt follows latitude.' },
  { dot: 'bg-amber-400', title: 'What', text: 'Fires crackle, rain falls as droplets, warm oceans hum as a slow drone.' },
  { dot: 'bg-rose-400', title: 'How it changes', text: 'When a signal grows, it gets higher and denser. When it fades, it settles.' },
];

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartListening, onExploreGlobe, onStartGuidedTour }) => (
  <div className="hero-layer fixed inset-0 z-50 overflow-y-auto text-white bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent safe-pb safe-pt">
    <div className="min-h-full max-w-6xl mx-auto px-5 sm:px-10 py-8 flex flex-col justify-between">
      <p className="text-sm text-slate-300">NASA Space Apps Challenge 2026 · independent entry, not an official NASA product</p>

      <div className="max-w-2xl py-10">
        <h1 className="font-sans font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight">
          Sonic Earth Atlas
        </h1>
        <p className="mt-4 text-2xl sm:text-3xl font-light text-sky-100">Hear where Earth is changing.</p>
        <p className="mt-4 text-base text-slate-200 leading-relaxed">
          Satellites watch fires, storms and warming seas, but most of that data is locked behind charts.
          This atlas turns it into spatial sound you can explore with your ears, with a keyboard, or with a screen reader.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <button onClick={onStartGuidedTour} aria-label="Take the 35-second guided tour"
            className="min-h-[48px] px-6 whitespace-nowrap rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
            <Sparkles className="w-5 h-5" /> Take the 35-second tour
          </button>
          <button onClick={onStartListening} aria-label="Start listening to Earth"
            className="min-h-[48px] px-6 whitespace-nowrap rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
            <Volume2 className="w-5 h-5" /> Listen to Earth
          </button>
          <button onClick={onExploreGlobe} aria-label="Explore the globe silently"
            className="min-h-[48px] px-6 whitespace-nowrap rounded-lg border border-slate-500 hover:bg-white/10 font-medium flex items-center justify-center gap-2 cursor-pointer transition">
            <Globe className="w-5 h-5" /> Explore silently
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-400">Sound starts only after you press a button. Headphones recommended.</p>
      </div>

      <dl className="grid sm:grid-cols-3 gap-6 max-w-3xl pb-2">
        {DIMENSIONS.map((d) => (
          <div key={d.title}>
            <dt className="flex items-center gap-2 font-semibold"><span className={`w-2 h-2 rounded-full ${d.dot}`} />{d.title}</dt>
            <dd className="mt-1 text-sm text-slate-300 leading-relaxed">{d.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  </div>
);
