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
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
            Auditory Legend
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Click to preview sound identity</span>
      </div>

      <div className="space-y-3">
        {/* Wildfire */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-amber-900/40 hover:border-amber-700/60 transition">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-400">ACTIVE WILDFIRES</div>
                <div className="text-[11px] text-slate-400">
                  Crackling bursts represent active fire intensity & power (FRP).
                </div>
              </div>
            </div>
            <button
              onClick={() => handleHearPhenomenon('fire')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'fire'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-800/60'
              }`}
              title="Isolate and audition active fire sound"
              aria-label="Hear Fire Sound"
            >
              {activePreview === 'fire' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{activePreview === 'fire' ? 'Playing...' : 'Hear Fire'}</span>
            </button>
          </div>
          <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Range: 5 - 800 MW</span>
            <span>Acoustic: Bandpass Bursts 800-3000 Hz</span>
          </div>
        </div>

        {/* Precipitation */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-cyan-900/40 hover:border-cyan-700/60 transition">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-cyan-400">PRECIPITATION</div>
                <div className="text-[11px] text-slate-400">
                  Droplet pulse density represents precipitation rate.
                </div>
              </div>
            </div>
            <button
              onClick={() => handleHearPhenomenon('precipitation')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'precipitation'
                  ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300'
                  : 'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/80 border border-cyan-800/60'
              }`}
              title="Isolate and audition precipitation sound"
              aria-label="Hear Rain Sound"
            >
              {activePreview === 'precipitation' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{activePreview === 'precipitation' ? 'Playing...' : 'Hear Rain'}</span>
            </button>
          </div>
          <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Range: 0.1 - 45 mm/hr</span>
            <span>Acoustic: Resonant Droplet Ping 340-700 Hz</span>
          </div>
        </div>

        {/* Ocean Temperature */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-purple-900/40 hover:border-purple-700/60 transition">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-400">OCEAN TEMPERATURE</div>
                <div className="text-[11px] text-slate-400">
                  Sustained oceanic tones represent thermal anomaly conditions.
                </div>
              </div>
            </div>
            <button
              onClick={() => handleHearPhenomenon('sst')}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition flex items-center gap-1.5 whitespace-nowrap ${
                activePreview === 'sst'
                  ? 'bg-purple-400 text-slate-950 ring-2 ring-purple-300'
                  : 'bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 border border-purple-800/60'
              }`}
              title="Isolate and audition ocean SST sound"
              aria-label="Hear Ocean Sound"
            >
              {activePreview === 'sst' ? <CheckCircle2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{activePreview === 'sst' ? 'Playing...' : 'Hear Ocean'}</span>
            </button>
          </div>
          <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Range: -3.0 to +3.0 °C Anomaly</span>
            <span>Acoustic: Warm/Cool Drone Pad 92-138 Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};
