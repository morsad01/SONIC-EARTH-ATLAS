import React, { useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, TrendingUp } from 'lucide-react';
import type { DatasetTimeSlice, PhenomenonType } from '../types/dataset';
import { formatDay } from './formatDay';
import { usePrefs } from '../lib/prefs';
import { placeLabel } from '../lib/placesBn';

interface Props {
  slices: DatasetTimeSlice[];
  index: number;
  onChange: (i: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  hearChange: boolean;
  onToggleHearChange: () => void;
  enabled: Record<PhenomenonType, boolean>;
}

export const TimelineBar: React.FC<Props> = ({ slices, index, onChange, playing, onTogglePlay, hearChange, onToggleHearChange, enabled }) => {
  const { t, lang } = usePrefs();
  const n = slices.length;

  useEffect(() => {
    if (!playing || n < 2) return;
    const id = window.setInterval(() => onChange((index + 1) % n), 3200);
    return () => clearInterval(id);
  }, [playing, index, n, onChange]);

  // One-line headline computed from the day's data.
  const headline = useMemo(() => {
    const s = slices[index];
    if (!s) return '';
    const top = (p: PhenomenonType) => s.observations.filter((o) => o.phenomenon === p).sort((a, b) => b.value - a.value)[0];
    const parts: string[] = [];
    const f = enabled.fire && top('fire');
    const r = enabled.precipitation && top('precipitation');
    if (f) parts.push(`${lang === 'bn' ? 'সবচেয়ে বড় আগুন' : 'Strongest fire'}: ${placeLabel(f.regionName, lang)}, ${Math.round(f.value)} MW`);
    if (r) parts.push(`${lang === 'bn' ? 'সবচেয়ে বেশি বৃষ্টি' : 'Heaviest rain'}: ${placeLabel(r.regionName, lang)}, ${Math.round(r.value)} mm`);
    return parts.join(' · ');
  }, [slices, index, enabled, lang]);

  if (!n) return null;
  return (
    <div className="panel p-2.5 sm:p-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-icon" aria-label={t('prevDay')} onClick={() => onChange((index - 1 + n) % n)}><SkipBack className="w-4 h-4" /></button>
          <button className="btn btn-brass btn-icon" aria-label={playing ? t('pause') : t('play')} onClick={onTogglePlay}>{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
          <button className="btn btn-ghost btn-icon" aria-label={t('nextDay')} onClick={() => onChange((index + 1) % n)}><SkipForward className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 min-w-[200px] grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }} role="tablist" aria-label="Day">
          {slices.map((s, i) => (
            <button key={s.dateLabel} role="tab" aria-selected={i === index} onClick={() => onChange(i)}
              className={`min-h-[40px] rounded-lg text-sm tnum cursor-pointer border transition ${i === index ? 'border-[var(--brass)] text-[var(--brass)] bg-[var(--panel-2)] font-semibold' : 'border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}>
              {formatDay(s.dateLabel, lang)}
            </button>
          ))}
        </div>
        <button className="btn" aria-pressed={hearChange} onClick={onToggleHearChange} title={t('hearChangeHint')}>
          <TrendingUp className="w-4 h-4" /><span className="hidden sm:inline">{t('hearChange')}</span>
        </button>
      </div>
      {headline && <p className="text-sm text-[var(--ink-2)] px-1 truncate" aria-live="polite">{formatDay(slices[index].dateLabel, lang, true)} · {headline}</p>}
    </div>
  );
};
