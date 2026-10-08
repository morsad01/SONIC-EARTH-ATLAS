import React from 'react';
import { DATASET_CATALOG } from '../datasets/datasetMetadata';
import type { DataSourceMode } from '../types/dataset';
import { ExternalLink, Database, BookOpen, CheckCircle2 } from 'lucide-react';

interface ProvenancePanelProps {
  dataSourceMode: DataSourceMode;
  statusMessage: string;
  isFallback: boolean;
}

export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({
  dataSourceMode,
  statusMessage,
  isFallback,
}) => {
  return (
    <div className="space-y-6 text-slate-200">
      {/* Feed Status Indicator */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Data Ingestion Status
            </div>
            <div className="text-sm font-semibold text-white flex items-center gap-2 mt-0.5">
              <span>{statusMessage}</span>
              {isFallback && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Fallback Mode Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              dataSourceMode === 'live' && !isFallback
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dataSourceMode === 'live' && !isFallback ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            {dataSourceMode === 'live' && !isFallback ? 'REAL NASA FIRMS SNAPSHOT' : 'ILLUSTRATIVE SAMPLE'}
          </div>
        </div>
      </div>

      {/* Scientific Transparency Note */}
      <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-cyan-200/90 leading-relaxed">
        <span className="font-bold text-cyan-300">Data Architecture Disclosure: </span>
        Direct in-browser telemetry queries to NASA FIRMS / Earthdata typically require backend authentication keys or face browser CORS barriers. Sonic Earth Atlas maintains strict scientific integrity by operating on a verified 6-timestep NASA/NOAA observational baseline, supplemented with a live open meteorological reanalysis bridge for real-time telemetry testing.
      </div>

      {/* Dataset Provenance Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          Authoritative Observation Registries
        </h4>

        {Object.values(DATASET_CATALOG).map((catalog) => (
          <div
            key={catalog.id}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-3">
              <div>
                <span className="text-sm font-bold text-white font-mono">{catalog.title}</span>
                <span className="ml-2 text-xs text-slate-400">({catalog.variableName})</span>
              </div>
              <a
                href={catalog.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 inline-flex"
              >
                <span>{catalog.provider}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">UNIT OF MEASURE</span>
                <span className="text-slate-200 font-semibold">{catalog.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SPATIAL RESOLUTION</span>
                <span className="text-slate-200">{catalog.spatialResolution}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TEMPORAL CADENCE</span>
                <span className="text-slate-200">{catalog.temporalResolution}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VALID RANGE</span>
                <span className="text-slate-200">
                  {catalog.validRange[0]} to {catalog.validRange[1]} {catalog.unit}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/60">
              <span className="text-slate-500 font-semibold">Processing: </span>
              {catalog.processingMethod}
            </div>

            <div className="mt-2 text-[10px] text-slate-500 italic">
              {catalog.attribution}
            </div>
          </div>
        ))}
      </div>

      {/* Prior Art & Scientific Methodology */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-200 mb-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          Prior Art &amp; Methodological Statement
        </div>
        <p className="text-slate-300 leading-relaxed">
          Sonification of environmental parameters has an established history across scientific research, from geiger
          counters to astronomical radio frequency conversions. This project does not claim that data sonification is
          our exclusive invention. Rather, <span className="text-white font-semibold">Sonic Earth Atlas</span> focuses on
          an integrated, deterministic, spatial audio instrument that unifies geographic coordinates (WHERE), phenomenon
          synthesis physics (WHAT), and temporal variance (HOW IT CHANGES) into an accessible multi-sensory Earth map.
        </p>
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          Attribution: NASA data and imagery provided by NASA and its Earth Science Data Systems (ESDIS, FIRMS, GPM,
          PO.DAAC) and NOAA. Built for the NASA Space Apps Challenge 2026.
        </div>
      </div>
    </div>
  );
};
