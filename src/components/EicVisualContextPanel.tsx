import React from 'react';
import type { PhenomenonType } from '../types/dataset';
import { DATASET_CATALOG } from '../datasets/datasetMetadata';
import { Eye, ShieldCheck, ExternalLink, Radio, Layers } from 'lucide-react';

interface EicVisualContextPanelProps {
  enabledPhenomena: Record<PhenomenonType, boolean>;
  activePhenomenon?: PhenomenonType;
  isOpen: boolean;
  onClose?: () => void;
}

export const EicVisualContextPanel: React.FC<EicVisualContextPanelProps> = ({
  enabledPhenomena,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Determine active phenomenon for frame preview metadata
  const activeKey: PhenomenonType = enabledPhenomena.fire
    ? 'fire'
    : enabledPhenomena.precipitation
    ? 'precipitation'
    : 'sst';

  const catalog = DATASET_CATALOG[activeKey];

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-white animate-fade-in space-y-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              NASA EIC VISUAL CONTEXT
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Earth Information Center Scientific Framing
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        )}
      </div>

      {/* Visual-Sonification Alignment Chain */}
      <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[10px] font-mono space-y-1">
        <div className="text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Radio className="w-3 h-3 animate-pulse" />
            SYNCHRONIZED ALIGNMENT
          </span>
          <span className="text-slate-500">JUKEBOX CHAIN</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center text-[9px] pt-1 border-t border-slate-800/80">
          <div className="p-1 bg-slate-950 rounded text-cyan-300 border border-slate-800 truncate">
            1. EIC VISUAL
          </div>
          <div className="p-1 bg-slate-950 rounded text-amber-300 border border-slate-800 truncate">
            2. DATA VALUE
          </div>
          <div className="p-1 bg-slate-950 rounded text-purple-300 border border-slate-800 truncate">
            3. SONIFICATION
          </div>
        </div>
      </div>

      {/* Active Phenomenon EIC Frame Description */}
      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            {catalog.title}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {catalog.variableName}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-tight">
          {catalog.processingMethod}
        </p>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span>Cadence: {catalog.temporalResolution}</span>
          <a
            href={catalog.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>{catalog.provider}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Honest Classification Disclaimer */}
      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 leading-normal flex items-start gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">Attribution &amp; Integrity: </span>
          Original Earth observation data courtesy of NASA EOSDIS, GPM, PO.DAAC &amp; NOAA. Globe is an interactive 3D WebGL scientific rendering of official dataset points.
        </div>
      </div>
    </div>
  );
};
