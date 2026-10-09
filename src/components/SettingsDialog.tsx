import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePrefs } from '../lib/prefs';

interface Props {
  open: boolean;
  onClose: () => void;
  volume: number;
  onVolume: (v: number) => void;
  spatialMode: 'spatial-hrtf' | 'stereo-panning';
  onToggleSpatial: () => void;
  showDiagnostics: boolean;
  onToggleDiagnostics: () => void;
}

const SHORTCUTS: [string, string, string][] = [
  ['Space', 'Play or pause the current track', 'চলমান ট্র্যাক চালান/থামান'],
  ['← →', 'Previous / next day (Atlas)', 'আগের / পরের দিন'],
  ['1  2  3', 'Toggle fires, rain, ocean', 'আগুন, বৃষ্টি, সমুদ্র চালু/বন্ধ'],
  ['S', 'Sound on or off', 'শব্দ চালু/বন্ধ'],
  ['G  M  L', 'Globe, map or list view', 'গ্লোব, মানচিত্র বা তালিকা'],
  ['T', 'Start the guided tour', 'ট্যুর শুরু'],
  ['?', 'Open this panel', 'এই প্যানেল খুলুন'],
];

const Toggle: React.FC<{ label: string; on: boolean; onClick: () => void; note?: string }> = ({ label, on, onClick, note }) => (
  <button role="switch" aria-checked={on} onClick={onClick} className="w-full flex items-center justify-between gap-3 py-2.5 cursor-pointer text-left">
    <span>{label}{note && <span className="block text-xs text-[var(--ink-3)] mt-0.5">{note}</span>}</span>
    <span className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition ${on ? 'bg-[var(--brass)]' : 'bg-[var(--line)]'}`}><span className={`block w-5 h-5 rounded-full bg-white transition ${on ? 'translate-x-5' : ''}`} /></span>
  </button>
);

export const SettingsDialog: React.FC<Props> = ({ open, onClose, volume, onVolume, spatialMode, onToggleSpatial, showDiagnostics, onToggleDiagnostics }) => {
  const p = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('button, input')?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex justify-end" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm h-full bg-[var(--panel)] border-l border-[var(--line)] p-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-2xl font-bold">{p.t('settings')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label={p.t('close')}><X className="w-5 h-5" /></button>
        </div>

        <div className="mt-5">
          <div className="label mb-2">{p.t('language')}</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn" aria-pressed={p.lang === 'en'} onClick={() => p.set({ lang: 'en' })}>English</button>
            <button className="btn" aria-pressed={p.lang === 'bn'} onClick={() => p.set({ lang: 'bn' })}>বাংলা</button>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[var(--line)]">
          <Toggle label={p.t('narration')} on={p.narration} onClick={() => p.set({ narration: !p.narration })} />
          <Toggle label={p.t('reduceMotion')} on={p.reduceMotion} onClick={() => p.set({ reduceMotion: !p.reduceMotion })} />
          <Toggle label={p.t('calmBackground')} on={p.calmBackground} note={p.t('calmBackgroundNote')} onClick={() => p.set({ calmBackground: !p.calmBackground })} />
          <Toggle label={p.t('highContrast')} on={p.highContrast} onClick={() => p.set({ highContrast: !p.highContrast })} />
          <Toggle label={`${p.t('spatial')}: ${spatialMode === 'spatial-hrtf' ? p.t('hrtf') : p.t('stereo')}`} on={spatialMode === 'spatial-hrtf'} onClick={onToggleSpatial} />
          <Toggle label={p.t('diagnostics')} on={showDiagnostics} onClick={onToggleDiagnostics} />
        </div>

        <label className="block mt-5">
          <span className="label">{p.t('volume')}: <span className="tnum">{Math.round(volume * 100)}%</span></span>
          <input type="range" min={0} max={1.2} step={0.05} value={volume} onChange={(e) => onVolume(+e.target.value)} className="w-full mt-2 accent-[var(--brass)]" />
        </label>

        <h3 className="font-display text-lg font-semibold mt-6">{p.t('shortcuts')}</h3>
        <dl className="mt-2 text-sm space-y-1.5">
          {SHORTCUTS.map(([k, en, bn]) => (
            <div key={k} className="flex gap-3"><dt className="w-16 shrink-0"><kbd className="chip font-semibold text-[var(--ink)]">{k}</kbd></dt><dd className="text-[var(--ink-2)]">{p.lang === 'bn' ? bn : en}</dd></div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-[var(--ink-3)] leading-relaxed">{p.t('srNote')}</p>
      </div>
    </div>
  );
};
