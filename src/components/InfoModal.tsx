import React, { useState, useEffect } from 'react';
import { ScientificMappingPanel } from '../provenance/ScientificMappingPanel';
import { ProvenancePanel } from '../provenance/ProvenancePanel';
import { AuditoryLegend } from '../legend/AuditoryLegend';
import type { DataSourceMode } from '../types/dataset';
import { X, Sliders, Database, Volume2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  initialTab?: 'science' | 'provenance' | 'legend';
  onClose: () => void;
  dataSourceMode: DataSourceMode;
  statusMessage: string;
  isFallback: boolean;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  initialTab = 'science',
  onClose,
  dataSourceMode,
  statusMessage,
  isFallback,
}) => {
  const [activeTab, setActiveTab] = useState<'science' | 'provenance' | 'legend'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header with Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('science')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'science'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>How Sound Works</span>
            </button>

            <button
              onClick={() => setActiveTab('provenance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'provenance'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data &amp; Provenance</span>
            </button>

            <button
              onClick={() => setActiveTab('legend')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'legend'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Auditory Legend</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'science' && <ScientificMappingPanel />}
          {activeTab === 'provenance' && (
            <ProvenancePanel
              dataSourceMode={dataSourceMode}
              statusMessage={statusMessage}
              isFallback={isFallback}
            />
          )}
          {activeTab === 'legend' && <AuditoryLegend />}
        </div>
      </div>
    </div>
  );
};
