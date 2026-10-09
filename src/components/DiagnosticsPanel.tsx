import React, { useEffect, useState } from 'react';
import { SonificationEngine } from '../audio/sonificationEngine';
import { seriesDiagnostics } from '../sonification/series/diagnostics';
import { Cpu, Terminal } from 'lucide-react';

interface DiagnosticsPanelProps {
  activeDatasetCount: number;
  currentTimestep: number;
  totalTimesteps: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  activeDatasetCount,
  currentTimestep,
  totalTimesteps,
  isOpen,
  onToggle,
}) => {
  const [fps, setFps] = useState(60);
  const [series, setSeries] = useState(seriesDiagnostics);
  const [audioDiag, setAudioDiag] = useState({
    activeVoicesCount: 0,
    maxVoices: 12,
    spatialMode: 'stereo-panning',
    audioContextState: 'suspended',
    sampleRate: 44100,
    isHearChangeMode: false,
  });

  // Calculate FPS and poll SonificationEngine stats
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
        setAudioDiag(SonificationEngine.getInstance().getDiagnostics());
        setSeries(seriesDiagnostics());
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed bottom-3 right-3 z-30">
      {isOpen ? (
        <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md w-72 text-xs font-mono text-slate-300 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>SYSTEM DIAGNOSTICS</span>
            </div>
            <button
              onClick={onToggle}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Render FPS:</span>
              <span className={`font-bold ${fps > 45 ? 'text-emerald-400' : 'text-amber-400'}`}>{fps} FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AudioContext:</span>
              <span className={`font-semibold ${audioDiag.audioContextState === 'running' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {audioDiag.audioContextState.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Audio Voices:</span>
              <span className="text-cyan-300 font-bold">
                {audioDiag.activeVoicesCount} / {audioDiag.maxVoices} (Voice Pool Budgeted)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Series Player:</span>
              <span className={series.state === 'playing' ? 'text-emerald-400 font-semibold' : 'text-slate-200'}>{series.state.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Series Audio Nodes:</span>
              <span className="text-cyan-300 font-bold" data-series-nodes>{series.nodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Spatial Routing:</span>
              <span className="text-slate-200">{audioDiag.spatialMode.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sample Rate:</span>
              <span className="text-slate-200">{audioDiag.sampleRate} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Visible Observations:</span>
              <span className="text-slate-200">{activeDatasetCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Timestep Index:</span>
              <span className="text-slate-200">
                T{currentTimestep + 1} of {totalTimesteps}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hear The Change Mode:</span>
              <span className={audioDiag.isHearChangeMode ? 'text-purple-400 font-bold' : 'text-slate-400'}>
                {audioDiag.isHearChangeMode ? 'ENABLED (Δ)' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 backdrop-blur-md transition shadow-lg text-[10px] font-mono flex items-center gap-1.5"
          title="Toggle Diagnostics Overlay"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>DIAG: {fps} FPS</span>
        </button>
      )}
    </div>
  );
};
