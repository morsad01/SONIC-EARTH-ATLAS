import React, { useEffect, useState } from 'react';
import { Pause, Play, X, SkipForward } from 'lucide-react';
import type { PhenomenonType } from '../types/dataset';
import { usePrefs, speak } from '../lib/prefs';
import { TOUR } from './tour';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (layers: Record<PhenomenonType, boolean>, day: number, change: boolean, focus: { lat: number; lon: number }) => void;
}

export const TourBar: React.FC<Props> = ({ open, onClose, onApply }) => {
  const { t, lang, narration } = usePrefs();
  // Step and time in the step move together; the ticker advances both, so no effect has to reset them.
  const [pos, setPos] = useState({ i: 0, elapsed: 0 });
  const [paused, setPaused] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setPos({ i: 0, elapsed: 0 }); setPaused(false); } }
  const { i, elapsed } = pos;
  const done = i >= TOUR.length;

  useEffect(() => {
    if (!open || done) return;
    const s = TOUR[i];
    onApply(s.layers, s.day, s.change, s.focus);
    if (narration) speak(lang === 'bn' ? s.bn : s.en, lang);
  }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || paused || done) return;
    const id = window.setInterval(() => setPos((p) => (p.elapsed + 100 < TOUR[p.i].ms ? { ...p, elapsed: p.elapsed + 100 } : { i: p.i + 1, elapsed: 0 })), 100);
    return () => clearInterval(id);
  }, [open, paused, done]);

  useEffect(() => { if (open && done) onClose(); }, [open, done, onClose]);

  if (!open || done) return null;
  const s = TOUR[i];
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-[calc(var(--header-h)+.75rem)] z-30 w-[min(720px,calc(100%-24px))] glass-pop p-3 sm:p-4" role="region" aria-label={t('tourRegion')}>
      <div className="flex items-start gap-3">
        <span className="tnum text-xs font-semibold rounded-full border border-[var(--brass)] text-[var(--brass)] px-2 py-0.5 mt-0.5 shrink-0">{i + 1}/{TOUR.length}</span>
        <p className="flex-1 text-base leading-snug" aria-live="polite">{lang === 'bn' ? s.bn : s.en}</p>
        <div className="flex gap-1 shrink-0">
          <button className="btn btn-ghost btn-icon" onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume tour' : 'Pause tour'}>{paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
          <button className="btn btn-ghost btn-icon" onClick={() => setPos({ i: i + 1, elapsed: 0 })} aria-label={t('tourNext')}><SkipForward className="w-4 h-4" /></button>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('tourEnd')}><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="mt-2 h-1 rounded bg-[var(--line)] overflow-hidden"><div className="h-full bg-[var(--brass)]" style={{ width: `${Math.min(100, (elapsed / s.ms) * 100)}%` }} /></div>
    </div>
  );
};
