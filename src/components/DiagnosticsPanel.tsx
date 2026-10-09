import React, { useEffect, useState } from 'react';
import { SonificationEngine } from '../audio/sonificationEngine';
import { seriesDiagnostics } from '../sonification/series/diagnostics';
import { Cpu, Terminal } from 'lucide-react';
import { Overlay } from './Overlay';

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
    <Overlay><div className="fixed bottom-3 right-3 z-30">
      {isOpen ? (
        <div className="glass-pop p-3 w-72 text-xs font-mono text-[var(--ink-2)] space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
            <div className="flex items-center gap-1.5 text-[var(--rain)] font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>SYSTEM DIAGNOSTICS</span>
            </div>
            <button
              onClick={onToggle}
              className="text-[var(--ink-3)] hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 text-2xs">
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Render FPS:</span>
              <span className={`font-semibold ${fps > 45 ? 'text-[var(--teal)]' : 'text-[var(--brass)]'}`}>{fps} FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">AudioContext:</span>
              <span className={`font-semibold ${audioDiag.audioContextState === 'running' ? 'text-[var(--teal)]' : 'text-[var(--brass)]'}`}>
                {audioDiag.audioContextState.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Active Audio Voices:</span>
              <span className="text-[var(--rain)] font-semibold">
                {audioDiag.activeVoicesCount} / {audioDiag.maxVoices} (Voice Pool Budgeted)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Series Player:</span>
              <span className={series.state === 'playing' ? 'text-[var(--teal)] font-semibold' : 'text-[var(--ink)]'}>{series.state.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Series Audio Nodes:</span>
              <span className="text-[var(--rain)] font-semibold" data-series-nodes>{series.nodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Spatial Routing:</span>
              <span className="text-[var(--ink)]">{audioDiag.spatialMode.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Sample Rate:</span>
              <span className="text-[var(--ink)]">{audioDiag.sampleRate} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Visible Observations:</span>
              <span className="text-[var(--ink)]">{activeDatasetCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Timestep Index:</span>
              <span className="text-[var(--ink)]">
                T{currentTimestep + 1} of {totalTimesteps}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-3)]">Hear The Change Mode:</span>
              <span className={audioDiag.isHearChangeMode ? 'text-[var(--warm)] font-semibold' : 'text-[var(--ink-3)]'}>
                {audioDiag.isHearChangeMode ? 'ENABLED (Δ)' : 'DISABLED'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onToggle}
          className="p-2 rounded-lg glass text-[var(--ink-3)] hover:text-[var(--rain)] backdrop-blur-md transition shadow-lg text-2xs font-mono flex items-center gap-1.5"
          title="Toggle Diagnostics Overlay"
        >
          <Cpu className="w-3.5 h-3.5 text-[var(--rain)]" />
          <span>DIAG: {fps} FPS</span>
        </button>
      )}
    </div></Overlay>
  );
};
