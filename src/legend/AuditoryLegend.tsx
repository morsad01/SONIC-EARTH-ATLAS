import React, { useState } from 'react';
import type { PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { Flame, CloudRain, Waves, Volume2, CheckCircle2 } from 'lucide-react';

interface AuditoryLegendProps {
  onIsolatePreview?: (phenomenon: PhenomenonType) => void;
}

export const AuditoryLegend: React.FC<AuditoryLegendProps> = () => {
  const [activePreview, setActivePreview] = useState<PhenomenonType | null>(null);

  const handleHearPhenomenon = (phenomenon: PhenomenonType) => {
    setActivePreview(phenomenon);
    SonificationEngine.getInstance().playIsolatedPreview(phenomenon);
    setTimeout(() => {
      setActivePreview(null);
    }, 4000);
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-widest">
            AUDITORY LEGEND
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Audition sound signatures</span>
      </div>

      <div className="space-y-3">
        {/* Wildfire Signature */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-900/50 hover:border-amber-700/60 transition shadow-inner">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-400 tracking-wide">ACTIVE WILDFIRES</div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  Crackling bursts track fire intensity &amp; power (FRP MW).
                </div>
              </div>
            </div>
            <button
              onClick={() => handleHearPhenomenon('fire')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activePreview === 'fire'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-amber-950/70 text-amber-300 hover:bg-amber-900/90 border border-amber-700/60'
              }`}
              title="Isolate and audition active fire sound"
              aria-label="Hear Fire Sound"
            >
              {activePreview === 'fire' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{activePreview === 'fire' ? 'Playing...' : 'Hear Fire'}</span>
            </button>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Range: 5 - 800 MW</span>
            <span className="text-amber-400/90 font-semibold">Bandpass 800-3000 Hz</span>
          </div>
        </div>

        {/* Precipitation Signature */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-900/50 hover:border-cyan-700/60 transition shadow-inner">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-400">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-cyan-400 tracking-wide">PRECIPITATION</div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  Droplet pulse density tracks rainfall volume (mm/hr).
                </div>
              </div>
            </div>
            <button
              onClick={() => handleHearPhenomenon('precipitation')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activePreview === 'precipitation'
                  ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900/90 border border-cyan-700/60'
              }`}
              title="Isolate and audition precipitation sound"
              aria-label="Hear Rain Sound"
            >
              {activePreview === 'precipitation' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{activePreview === 'precipitation' ? 'Playing...' : 'Hear Rain'}</span>
            </button>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Range: 0.1 - 45 mm/hr</span>
            <span className="text-cyan-400/90 font-semibold">Resonant Ping 340-700 Hz</span>
          </div>
        </div>

        {/* Ocean SST Signature */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-purple-900/50 hover:border-purple-700/60 transition shadow-inner">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-purple-500/20 text-purple-400">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-400 tracking-wide">OCEAN TEMPERATURE</div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  Sustained drones track sea surface thermal anomalies (°C).
                </div>
              </div>
            </div>
            <button
              onClick={() => handleHearPhenomenon('sst')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activePreview === 'sst'
                  ? 'bg-purple-400 text-slate-950 ring-2 ring-purple-300 shadow-md shadow-purple-500/20'
                  : 'bg-purple-950/70 text-purple-300 hover:bg-purple-900/90 border border-purple-700/60'
              }`}
              title="Isolate and audition ocean SST sound"
              aria-label="Hear Ocean Sound"
            >
              {activePreview === 'sst' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{activePreview === 'sst' ? 'Playing...' : 'Hear Ocean'}</span>
            </button>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Range: -3.0 to +3.0 °C</span>
            <span className="text-purple-400/90 font-semibold">Drone Pad 92-138 Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};
