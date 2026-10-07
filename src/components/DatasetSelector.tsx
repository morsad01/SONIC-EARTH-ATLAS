import React, { useState } from 'react';
import type { PhenomenonType, DataSourceMode } from '../types/dataset';
import { Flame, CloudRain, Waves, Volume2, VolumeX, Database, RefreshCw, Eye } from 'lucide-react';
import { SonificationEngine } from '../audio/sonificationEngine';
import { EicVisualContextPanel } from './EicVisualContextPanel';

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
  const [showEicPanel, setShowEicPanel] = useState(false);
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
    <div className="space-y-2 max-w-full overflow-x-hidden">
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 shadow-2xl backdrop-blur-md">
        {/* Instrument Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5 min-h-[36px]">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            DATA LAYERS
          </span>

          {/* Live vs Baseline Data Source Toggle */}
          <button
            onClick={onToggleDataSourceMode}
            disabled={isFetchingLive}
            className={`px-2.5 py-1 min-h-[36px] rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border transition cursor-pointer ${
              dataSourceMode === 'live' && !isFallback
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 shadow-[0_0_8px_rgba(56,189,248,0.15)]'
            }`}
            title="Toggle between NASA Baseline Slices and Live Reanalysis Proxy"
          >
            {isFetchingLive ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
            ) : (
              <Database className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{dataSourceMode === 'live' && !isFallback ? 'FEED: LIVE PROXY' : 'FEED: BASELINE'}</span>
          </button>
        </div>

        {/* Observation Layers Stack */}
        <div className="space-y-2">
          {/* Wildfires Layer */}
          <div
            onClick={() => onTogglePhenomenon('fire')}
            className={`p-2.5 min-h-[44px] rounded-lg border cursor-pointer flex items-center justify-between transition ${
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
              className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-slate-800 transition cursor-pointer ${
                mutedLayers.fire ? 'text-amber-500 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={mutedLayers.fire ? 'Unmute Fire Layer' : 'Mute Fire Layer'}
              aria-label="Mute or Unmute Fire"
            >
              {mutedLayers.fire ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Precipitation Layer */}
          <div
            onClick={() => onTogglePhenomenon('precipitation')}
            className={`p-2.5 min-h-[44px] rounded-lg border cursor-pointer flex items-center justify-between transition ${
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
              className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-slate-800 transition cursor-pointer ${
                mutedLayers.precipitation ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={mutedLayers.precipitation ? 'Unmute Precipitation Layer' : 'Mute Precipitation Layer'}
              aria-label="Mute or Unmute Precipitation"
            >
              {mutedLayers.precipitation ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Ocean SST Layer */}
          <div
            onClick={() => onTogglePhenomenon('sst')}
            className={`p-2.5 min-h-[44px] rounded-lg border cursor-pointer flex items-center justify-between transition ${
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
              className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-slate-800 transition cursor-pointer ${
                mutedLayers.sst ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={mutedLayers.sst ? 'Unmute SST Layer' : 'Mute SST Layer'}
              aria-label="Mute or Unmute SST"
            >
              {mutedLayers.sst ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* NASA EIC Visual Context Toggle Button */}
        <div className="pt-2 border-t border-slate-800/80 mt-2">
          <button
            onClick={() => setShowEicPanel(!showEicPanel)}
            className={`w-full py-2 min-h-[44px] px-2.5 rounded-lg text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer border ${
              showEicPanel
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:text-white hover:border-slate-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{showEicPanel ? 'Hide EIC Context' : 'NASA EIC Visual Context'}</span>
          </button>
        </div>
      </div>

      {/* Expandable EIC Visual Context Panel */}
      <EicVisualContextPanel
        enabledPhenomena={enabledPhenomena}
        isOpen={showEicPanel}
        onClose={() => setShowEicPanel(false)}
      />
    </div>
  );
};
