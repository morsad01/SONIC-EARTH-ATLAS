import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock, Zap } from 'lucide-react';
import { TIMESTEP_LABELS, TIMESTEP_DATES, TIMESTEP_NARRATIVES } from '../datasets/demoDatasets';

interface TimelineControlsProps {
  currentTimestepIndex: number;
  onChangeTimestep: (idx: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangePlaybackSpeed: (speed: number) => void;
  hearChangeMode: boolean;
  onToggleHearChangeMode: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  currentTimestepIndex,
  onChangeTimestep,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangePlaybackSpeed,
  hearChangeMode,
  onToggleHearChangeMode,
}) => {
  const timerRef = useRef<number | null>(null);

  // Automatic playback ticker
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 2800 / playbackSpeed;
    timerRef.current = window.setInterval(() => {
      onChangeTimestep((currentTimestepIndex + 1) % TIMESTEP_DATES.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, currentTimestepIndex, onChangeTimestep]);

  const handlePrev = () => {
    const prev = (currentTimestepIndex - 1 + TIMESTEP_DATES.length) % TIMESTEP_DATES.length;
    onChangeTimestep(prev);
  };

  const handleNext = () => {
    const next = (currentTimestepIndex + 1) % TIMESTEP_DATES.length;
    onChangeTimestep(next);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2.5">
      {/* 1-Line Scientifically Grounded Event Narrative */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px] tracking-wider whitespace-nowrap">
            {TIMESTEP_NARRATIVES[currentTimestepIndex]?.label || `T${currentTimestepIndex + 1}`}
          </span>
          <span className="text-slate-200 font-semibold truncate text-[11px] sm:text-xs">
            {TIMESTEP_NARRATIVES[currentTimestepIndex]?.headline}
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px] truncate">
            — {TIMESTEP_NARRATIVES[currentTimestepIndex]?.detail}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase hidden sm:block whitespace-nowrap pl-2">
          NASA / NOAA OBSERVATIONAL SERIES
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Controls & Timestamp Display */}
        <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={handlePrev}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title="Previous Timestep"
            aria-label="Previous Timestep"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded transition ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400'
            }`}
            title={isPlaying ? 'Pause Playback' : 'Play Timeline'}
            aria-label={isPlaying ? 'Pause Playback' : 'Play Timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title="Next Timestep"
            aria-label="Next Timestep"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Date Display */}
        <div className="flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-xs font-bold text-white">
              {TIMESTEP_LABELS[currentTimestepIndex]}
            </div>
            <div className="text-[10px] text-slate-400">
              Timestep {currentTimestepIndex + 1} of {TIMESTEP_DATES.length}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Scrubber Points */}
      <div className="flex-1 w-full max-w-md flex items-center gap-1.5">
        {TIMESTEP_DATES.map((date, idx) => {
          const isSelected = idx === currentTimestepIndex;
          const isPast = idx < currentTimestepIndex;

          return (
            <button
              key={date}
              onClick={() => onChangeTimestep(idx)}
              className="flex-1 group flex flex-col items-center py-1 cursor-pointer focus:outline-none"
              title={TIMESTEP_LABELS[idx]}
              aria-label={`Jump to ${TIMESTEP_LABELS[idx]}`}
            >
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  isSelected
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.8)] scale-y-125'
                    : isPast
                    ? 'bg-cyan-900 group-hover:bg-cyan-700'
                    : 'bg-slate-800 group-hover:bg-slate-700'
                }`}
              />
              <span
                className={`text-[9px] font-mono mt-1 transition ${
                  isSelected ? 'text-cyan-300 font-bold' : 'text-slate-500'
                }`}
              >
                T{idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Speed & "HEAR THE CHANGE" Mode Toggle */}
      <div className="flex items-center gap-2">
        {/* Speed Selector */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono p-0.5">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangePlaybackSpeed(spd)}
              className={`px-2 py-1 rounded transition ${
                playbackSpeed === spd
                  ? 'bg-slate-800 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* HEAR THE CHANGE Mode Button */}
        <button
          onClick={onToggleHearChangeMode}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition border ${
            hearChangeMode
              ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-[0_0_12px_rgba(191,90,242,0.4)]'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle Delta Mode: Emphasizes rates of change rather than absolute magnitudes"
          aria-pressed={hearChangeMode}
        >
          <Zap className={`w-3.5 h-3.5 ${hearChangeMode ? 'text-purple-400 fill-purple-400' : ''}`} />
          <span className="whitespace-nowrap">
            {hearChangeMode ? 'HEARING CHANGE (Δ)' : 'HEAR THE CHANGE'}
          </span>
        </button>
      </div>
    </div>
  </div>
);
};
