import React, { useEffect, useState } from 'react';
import type { DemoStep } from './demoScript';
import { DEMO_SCRIPT } from './demoScript';
import type { PhenomenonType } from '../types/dataset';
import { Play, Pause, X, ArrowRight } from 'lucide-react';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStepState: (
    phenomena: Record<PhenomenonType, boolean>,
    timestepIndex: number,
    hearChangeMode: boolean,
    cameraFocus?: { lat: number; lon: number }
  ) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onApplyStepState,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const step: DemoStep = DEMO_SCRIPT[currentStepIndex] || DEMO_SCRIPT[0];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(0);
      return;
    }

    // Apply the initial step state
    onApplyStepState(step.activePhenomena, step.timestepIndex, step.hearChangeMode, step.cameraFocus);

    if (!isPlaying) return;

    const intervalTime = 50;
    const totalTicks = step.durationMs / intervalTime;
    let ticks = 0;

    const interval = setInterval(() => {
      ticks++;
      setProgress((ticks / totalTicks) * 100);

      if (ticks >= totalTicks) {
        clearInterval(interval);
        if (currentStepIndex < DEMO_SCRIPT.length - 1) {
          setCurrentStepIndex((prev) => {
            const next = prev + 1;
            const nextStep = DEMO_SCRIPT[next];
            onApplyStepState(nextStep.activePhenomena, nextStep.timestepIndex, nextStep.hearChangeMode, nextStep.cameraFocus);
            return next;
          });
          setProgress(0);
        } else {
          setIsPlaying(false);
        }
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, currentStepIndex, isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-2xl w-full bg-slate-950/95 border border-cyan-500/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-white">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">
              CINEMATIC GUIDED TOUR • STEP {currentStepIndex + 1} OF {DEMO_SCRIPT.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title={isPlaying ? 'Pause Demo' : 'Resume Demo'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Close Guided Demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
          {step.title}
        </h3>

        {/* Synchronized Captions */}
        <p className="text-sm text-slate-300 mt-2 leading-relaxed min-h-[44px]">
          {step.caption}
        </p>

        {/* Final Quote Callout if step has one */}
        {step.quote && (
          <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/60 text-center animate-fade-in">
            <div className="text-lg font-serif italic text-cyan-200">
              {step.quote}
            </div>
            <div className="text-[11px] font-mono text-cyan-400/80 mt-1 uppercase tracking-wider">
              NASA Space Apps Challenge 2026 • Sonic Earth Atlas
            </div>
          </div>
        )}

        {/* Progress Bar & Actions */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentStepIndex < DEMO_SCRIPT.length - 1 ? (
            <button
              onClick={() => {
                const next = currentStepIndex + 1;
                setCurrentStepIndex(next);
                setProgress(0);
                const nextStep = DEMO_SCRIPT[next];
                onApplyStepState(nextStep.activePhenomena, nextStep.timestepIndex, nextStep.hearChangeMode, nextStep.cameraFocus);
              }}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1 bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded-lg hover:bg-cyan-400 transition"
            >
              Begin Exploration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
