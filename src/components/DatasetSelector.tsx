import React from 'react';
import type { PhenomenonType, DataSourceMode } from '../types/dataset';
import { Flame, CloudRain, Waves, Volume2, VolumeX, Database, RefreshCw } from 'lucide-react';
import { SonificationEngine } from '../audio/sonificationEngine';

interface DatasetSelectorProps {
  enabledPhenomena: Record<PhenomenonType, boolean>;
  onTogglePhenomenon: (phenomenon: PhenomenonType) => void;
  dataSourceMode: DataSourceMode;
  onToggleDataSourceMode: () => void;
  isFetchingLive: boolean;
  isFallback: boolean;
  observationsCountByLayer: Record<PhenomenonType, number>;
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  enabledPhenomena,
  onTogglePhenomenon,
  dataSourceMode,
  onToggleDataSourceMode,
  isFetchingLive,
  isFallback,
  observationsCountByLayer,
}) => {
  const [mutedLayers, setMutedLayers] = React.useState<Record<PhenomenonType, boolean>>({
    fire: false,
    precipitation: false,
    sst: false,
  });

  const handleMute = (e: React.MouseEvent, phenomenon: PhenomenonType) => {
    e.stopPropagation();
    const next = !mutedLayers[phenomenon];
    setMutedLayers((prev) => ({ ...prev, [phenomenon]: next }));
    SonificationEngine.getInstance().setCategoryMute(phenomenon, next);
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md">
      {/* Instrument Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
        <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          DATA LAYERS
        </span>

        {/* Live vs Baseline Data Source Toggle */}
        <button
          onClick={onToggleDataSourceMode}
          disabled={isFetchingLive}
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border transition cursor-pointer ${
            dataSourceMode === 'live' && !isFallback
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 shadow-[0_0_8px_rgba(56,189,248,0.15)]'
          }`}
          title="Toggle between NASA Baseline Slices and Live Reanalysis Proxy"
        >
          {isFetchingLive ? (
            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
          ) : (
            <Database className="w-3 h-3" />
          )}
          <span>{dataSourceMode === 'live' && !isFallback ? 'FEED: LIVE PROXY' : 'FEED: BASELINE'}</span>
        </button>
      </div>

      {/* Observation Layers Stack */}
      <div className="space-y-2">
        {/* Wildfires Layer */}
        <div
          onClick={() => onTogglePhenomenon('fire')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
            enabledPhenomena.fire
              ? 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_12px_rgba(255,77,0,0.15)]'
              : 'bg-slate-950/40 border-slate-800/80 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${enabledPhenomena.fire ? 'bg-amber-500/20 text-amber-400' : 'text-slate-600 bg-slate-900'}`}>
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>ACTIVE WILDFIRES</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold">
                  {observationsCountByLayer.fire} pts
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                FIRE RADIATIVE POWER • MW
              </div>
            </div>
          </div>

          <button
            onClick={(e) => handleMute(e, 'fire')}
            className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
              mutedLayers.fire ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={mutedLayers.fire ? 'Unmute Fire Layer' : 'Mute Fire Layer'}
            aria-label="Mute or Unmute Fire"
          >
            {mutedLayers.fire ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Precipitation Layer */}
        <div
          onClick={() => onTogglePhenomenon('precipitation')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
            enabledPhenomena.precipitation
              ? 'bg-slate-900/90 border-cyan-500/60 shadow-[0_0_12px_rgba(0,208,255,0.15)]'
              : 'bg-slate-950/40 border-slate-800/80 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${enabledPhenomena.precipitation ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 bg-slate-900'}`}>
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>PRECIPITATION</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-semibold">
                  {observationsCountByLayer.precipitation} pts
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                PRECIPITATION RATE • mm/hr
              </div>
            </div>
          </div>

          <button
            onClick={(e) => handleMute(e, 'precipitation')}
            className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
              mutedLayers.precipitation ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={mutedLayers.precipitation ? 'Unmute Precipitation Layer' : 'Mute Precipitation Layer'}
            aria-label="Mute or Unmute Precipitation"
          >
            {mutedLayers.precipitation ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Ocean SST Layer */}
        <div
          onClick={() => onTogglePhenomenon('sst')}
          className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
            enabledPhenomena.sst
              ? 'bg-slate-900/90 border-purple-500/60 shadow-[0_0_12px_rgba(191,90,242,0.15)]'
              : 'bg-slate-950/40 border-slate-800/80 opacity-50 hover:opacity-80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${enabledPhenomena.sst ? 'bg-purple-500/20 text-purple-400' : 'text-slate-600 bg-slate-900'}`}>
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>OCEAN SST</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-semibold">
                  {observationsCountByLayer.sst} pts
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                TEMPERATURE ANOMALY • °C
              </div>
            </div>
          </div>

          <button
            onClick={(e) => handleMute(e, 'sst')}
            className={`p-1 rounded hover:bg-slate-800 transition cursor-pointer ${
              mutedLayers.sst ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title={mutedLayers.sst ? 'Unmute SST Layer' : 'Mute SST Layer'}
            aria-label="Mute or Unmute SST"
          >
            {mutedLayers.sst ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
