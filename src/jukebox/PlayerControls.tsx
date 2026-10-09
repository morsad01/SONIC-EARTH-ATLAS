import { ChevronLeft, ChevronRight, Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { PlayerState } from '../sonification/series/playbackState';
import type { TimeMode } from '../sonification/series/mapping';
import type { CompareLayout } from '../sonification/series/compare';
import type { StringKey } from '../lib/strings';
import { digits } from './format';
import type { SoundSettings } from './soundSettings';

const SPEEDS = [0.5, 1, 2, 4];

interface TransportProps {
  state: PlayerState; index: number; count: number; label: (i: number) => string;
  onPlay: () => void; onPause: () => void; onStop: () => void; onStep: (by: 1 | -1) => void; onSeek: (i: number) => void;
}

/** Pinned transport (roadmap Phase 5): previous, play/pause, stop, next, a seek slider and the state as text. */
export function Transport({ state, index, count, label, onPlay, onPause, onStop, onStep, onSeek }: TransportProps) {
  const { t, lang } = usePrefs();
  const playing = state === 'playing', busy = state === 'loading' || state === 'idle';
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <button type="button" className="btn btn-icon" onClick={() => onStep(-1)} disabled={index <= 0} aria-label={t('jbPrev')}><ChevronLeft className="w-4 h-4" /></button>
      <button type="button" className="btn btn-brass" onClick={playing ? onPause : onPlay} disabled={busy} aria-label={t(playing ? 'plPause' : state === 'paused' ? 'plResume' : 'plPlay')}>
        {playing ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}<span className="hidden sm:inline">{t(playing ? 'plPause' : state === 'paused' ? 'plResume' : 'plPlay')}</span></button>
      <button type="button" className="btn btn-icon" onClick={onStop} disabled={!(playing || state === 'paused')} aria-label={t('plStop')}><Square className="w-4 h-4" /></button>
      <button type="button" className="btn btn-icon" onClick={() => onStep(1)} disabled={index >= count - 1} aria-label={t('jbNext')}><ChevronRight className="w-4 h-4" /></button>
      <input type="range" className="jb-range flex-1 min-w-[120px]" min={0} max={Math.max(0, count - 1)} step={1} value={Math.max(0, index)} disabled={count < 2}
        aria-label={t('plSeek')} aria-valuetext={index >= 0 ? `${label(index)}, ${t('jbPosition', { i: digits(index + 1, lang), n: digits(count, lang) })}` : undefined}
        onChange={(e) => onSeek(+e.target.value)} />
      <p className="text-sm text-[var(--ink-2)] tnum min-w-0" aria-live="off">
        {index >= 0 && <><strong className="text-[var(--ink)]">{label(index)}</strong> · {t('jbPosition', { i: digits(index + 1, lang), n: digits(count, lang) })}</>}
      </p>
      <p role="status" className="text-xs text-[var(--ink-3)] ml-auto" data-player-state={state}>{t('plState', { s: t(`plState_${state}` as StringKey) })}</p>
    </div>
  );
}

interface OptionsProps { value: SoundSettings; years: string[]; periodA: string; onChange: (p: Partial<SoundSettings>) => void }

/** Volume, mute, speed, timing and A/B compare, with the note that this is sonification. Nothing here starts audio. */
export function SoundOptions({ value: o, years, periodA, onChange }: OptionsProps) {
  const { t, lang } = usePrefs();
  const yearSel = (key: 'bFrom' | 'bTo', label: StringKey) => (
    <label className="text-xs text-[var(--ink-2)] grid gap-1">{t(label)}
      <select className="btn min-h-[40px]" value={o[key] ?? ''} onChange={(e) => onChange({ [key]: e.target.value || null })}>
        <option value="">{t(key === 'bFrom' ? 'jbFirstYear' : 'jbLastYear')}</option>
        {years.map((y) => <option key={y} value={y}>{digits(y, lang)}</option>)}
      </select></label>);
  return (
    <section className="rounded-lg border border-[var(--line)] p-2.5 space-y-2.5" aria-labelledby="jb-sound">
      <h3 id="jb-sound" className="font-display text-sm font-bold">{t('plSound')}</h3>
      <p className="text-xs text-[var(--ink-2)]">{t('plNote')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-icon" aria-pressed={o.muted} aria-label={t('plMute')} onClick={() => onChange({ muted: !o.muted })}>
          {o.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
        <label className="flex items-center gap-2 text-xs text-[var(--ink-2)] flex-1 min-w-[140px]">{t('plVolume')}
          <input type="range" className="jb-range flex-1" min={0} max={100} step={5} value={Math.round(o.volume * 100)} aria-valuetext={`${digits(Math.round(o.volume * 100), lang)}%`} onChange={(e) => onChange({ volume: +e.target.value / 100 })} /></label>
        <label className="flex items-center gap-2 text-xs text-[var(--ink-2)]">{t('plSpeed')}
          <select className="btn min-h-[40px]" value={o.speed} onChange={(e) => onChange({ speed: +e.target.value })}>
            {SPEEDS.map((x) => <option key={x} value={x}>{digits(x, lang)}×</option>)}</select></label>
      </div>
      <fieldset className="space-y-1">
        <legend className="text-xs text-[var(--ink-2)]">{t('plTimeMode')}</legend>
        <div className="flex flex-wrap gap-1">
          {(['even', 'proportional'] as TimeMode[]).map((m) => <button key={m} type="button" className="btn btn-ghost" aria-pressed={o.mode === m} onClick={() => onChange({ mode: m })}>{t(m === 'even' ? 'plEven' : 'plProportional')}</button>)}
        </div>
        <p className="text-xs text-[var(--ink-3)]">{t('plTimeNote')}</p>
      </fieldset>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm min-h-[32px]"><input type="checkbox" checked={o.compare} disabled={years.length < 2} onChange={(e) => onChange({ compare: e.target.checked })} />{t('plCompare')}</label>
        {years.length < 2 ? <p className="text-xs text-[var(--ink-3)]">{t('plCompareNeedsYears')}</p> : o.compare && <>
          <p className="text-xs text-[var(--ink-2)]">{t('plCompareA', { p: periodA })}</p>
          <div className="grid grid-cols-2 gap-2">{yearSel('bFrom', 'plCompareB')}{yearSel('bTo', 'jbTo')}</div>
          <fieldset className="space-y-1">
            <legend className="text-xs text-[var(--ink-2)]">{t('plLayout')}</legend>
            <div className="flex flex-wrap gap-1">
              {(['split', 'sequence'] as CompareLayout[]).map((l) => <button key={l} type="button" className="btn btn-ghost" aria-pressed={o.layout === l} onClick={() => onChange({ layout: l })}>{t(l === 'split' ? 'plSplit' : 'plSequence')}</button>)}
            </div>
          </fieldset>
          <p className="text-xs text-[var(--ink-3)]">{t('plCompareNote')}</p>
        </>}
      </div>
    </section>
  );
}
