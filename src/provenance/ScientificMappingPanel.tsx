import React from 'react';
import { NORMALIZATION_SPECS } from '../sonification/normalizer';
import { Flame, CloudRain, Waves, Sliders, Globe, Clock, ShieldCheck } from 'lucide-react';

export const ScientificMappingPanel: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-200">
      {/* Intro Header */}
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          SCIENTIFIC SONIFICATION FRAMEWORK
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Every auditory parameter is derived deterministically from authoritative numerical NASA & NOAA Earth
          observations without arbitrary or random pitch allocations.
        </p>
      </div>

      {/* Core Universal Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold mb-1">
            <Globe className="w-4 h-4" />
            1. WHERE (Spatial Audio)
          </div>
          <p className="text-[11px] text-slate-300">
            Geographic longitude maps to stereo pan:
          </p>
          <code className="block mt-1 text-[10px] bg-slate-950 p-1.5 rounded text-cyan-300 font-mono">
            pan = clamp(longitude / 180, -1, 1)
          </code>
          <p className="text-[10px] text-slate-400 mt-1">
            Latitude influences elevation filtering and HRTF positioning.
          </p>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-semibold mb-1">
            <Sliders className="w-4 h-4" />
            2. WHAT (Phenomenon Identity)
          </div>
          <p className="text-[11px] text-slate-300">
            Distinct synthesis architectures model physical signatures:
          </p>
          <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
            <div>• Fire: Thermal combustion crackle bursts</div>
            <div>• Rain: Downward-glide droplet pings</div>
            <div>• SST: Harmonic pad with oceanic swell</div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-semibold mb-1">
            <Clock className="w-4 h-4" />
            3. CHANGE (Temporal Delta)
          </div>
          <p className="text-[11px] text-slate-300">
            Rate of change between timesteps (Δv = v_t - v_t-1):
          </p>
          <code className="block mt-1 text-[10px] bg-slate-950 p-1.5 rounded text-purple-300 font-mono">
            Δv &gt; 0: Rising pitch &amp; higher density
          </code>
          <p className="text-[10px] text-slate-400 mt-1">
            In &quot;Hear The Change&quot; mode, temporal deltas take precedence.
          </p>
        </div>
      </div>

      {/* Dataset-by-dataset Breakdown */}
      <div className="space-y-4">
        {/* Wildfires */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-sm font-bold text-amber-400">
                ACTIVE WILDFIRES (NASA FIRMS / VIIRS)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Unit: Megawatts (MW)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono mt-3">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">RAW INPUT</div>
              <div className="text-white font-semibold mt-0.5">Fire Radiative Power</div>
              <div className="text-[10px] text-slate-500">Range: 5 to 800 MW</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">NORMALIZATION</div>
              <div className="text-amber-300 mt-0.5 text-[11px]">Logarithmic Decibel</div>
              <code className="text-[9px] text-slate-400 block mt-0.5 truncate">
                {NORMALIZATION_SPECS.fire.formulaString}
              </code>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">AUDIO PARAMETERS</div>
              <div className="text-cyan-300 mt-0.5 text-[11px]">Cutoff: 800 - 3000 Hz</div>
              <div className="text-[10px] text-slate-400">Burst Rate: 4 - 24 Hz</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">PERCEIVED SOUND</div>
              <div className="text-white mt-0.5 text-[11px]">Combustion Crackle</div>
              <div className="text-[10px] text-slate-500">Intense fires yield snappy high-density bursts</div>
            </div>
          </div>
        </div>

        {/* Precipitation */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm font-bold text-cyan-400">
                PRECIPITATION RATE (NASA GPM IMERG)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Unit: mm / hour
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono mt-3">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">RAW INPUT</div>
              <div className="text-white font-semibold mt-0.5">Precipitation Rate</div>
              <div className="text-[10px] text-slate-500">Range: 0.1 to 45 mm/hr</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">NORMALIZATION</div>
              <div className="text-cyan-300 mt-0.5 text-[11px]">Square Root Scale</div>
              <code className="text-[9px] text-slate-400 block mt-0.5 truncate">
                {NORMALIZATION_SPECS.precipitation.formulaString}
              </code>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">AUDIO PARAMETERS</div>
              <div className="text-cyan-300 mt-0.5 text-[11px]">Pitch: 340 - 700 Hz</div>
              <div className="text-[10px] text-slate-400">Droplet Rate: 2 - 18 Hz</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-white mt-0.5 text-[11px]">Rainfall Ripples</div>
              <div className="text-[10px] text-slate-500">Downward pitch glide mimics water impact</div>
            </div>
          </div>
        </div>

        {/* Sea Surface Temperature */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-purple-400" />
              <span className="font-mono text-sm font-bold text-purple-400">
                SEA SURFACE TEMP ANOMALY (NOAA / NASA PO.DAAC)
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Unit: °Celsius Anomaly
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono mt-3">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">RAW INPUT</div>
              <div className="text-white font-semibold mt-0.5">SST Thermal Anomaly</div>
              <div className="text-[10px] text-slate-500">Range: -3.0°C to +3.0°C</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">NORMALIZATION</div>
              <div className="text-purple-300 mt-0.5 text-[11px]">Bipolar Zero-Centered</div>
              <code className="text-[9px] text-slate-400 block mt-0.5 truncate">
                {NORMALIZATION_SPECS.sst.formulaString}
              </code>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">AUDIO PARAMETERS</div>
              <div className="text-purple-300 mt-0.5 text-[11px]">Base: 110 Hz (A2)</div>
              <div className="text-[10px] text-slate-400">Shift: ±4 semitones; LFO: 0.18 Hz</div>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">PERCEIVED SOUND</div>
              <div className="text-white mt-0.5 text-[11px]">Ocean Swell Drone</div>
              <div className="text-[10px] text-slate-500">Warm heatwaves ascend; cold upwellings drone low</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
