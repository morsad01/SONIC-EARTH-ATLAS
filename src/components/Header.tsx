import React from 'react';
import { Volume2, VolumeX, Settings, Database, Circle, Compass } from 'lucide-react';
import { usePrefs } from '../lib/prefs';

export type Track = 'atlas' | 'frames' | 'monsoon' | 'pulse';
export const TRACKS: { id: Track; key: 'track1' | 'track2' | 'track3' | 'track4'; code: string }[] = [
  { id: 'atlas', key: 'track1', code: 'A1' },
  { id: 'frames', key: 'track2', code: 'A2' },
  { id: 'monsoon', key: 'track3', code: 'B1' },
  { id: 'pulse', key: 'track4', code: 'B2' },
];

interface Props {
  track: Track;
  onTrack: (t: Track) => void;
  audioReady: boolean;
  onToggleAudio: () => void;
  onHome: () => void;
  onTour: () => void;
  onData: () => void;
  onSettings: () => void;
  recording: string | null;
  onRecord: () => void;
}

export const Header: React.FC<Props> = ({ track, onTrack, audioReady, onToggleAudio, onHome, onTour, onData, onSettings, recording, onRecord }) => {
  const { t } = usePrefs();
  return (
    <header className="relative z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--abyss)_88%,transparent)] backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 sm:px-4 h-14">
        <button onClick={onHome} className="flex items-center gap-2 cursor-pointer shrink-0" aria-label={`${t('appName')}, ${t('home')}`}>
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="12.5" fill="none" stroke="var(--brass)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="8" fill="none" stroke="var(--brass)" strokeOpacity=".55" />
            <circle cx="14" cy="14" r="3.2" fill="var(--brass)" />
          </svg>
          <span className="font-display font-bold text-lg hidden sm:inline whitespace-nowrap">{t('appName')}</span>
        </button>

        <nav className="hidden min-[1400px]:flex items-center gap-1 ml-4" aria-label={t('tracks')}>
          {TRACKS.map((tr) => (
            <button key={tr.id} onClick={() => onTrack(tr.id)} aria-current={track === tr.id ? 'page' : undefined}
              className={`h-9 px-3 rounded-lg text-sm cursor-pointer flex items-center gap-2 transition whitespace-nowrap ${track === tr.id ? 'bg-[var(--panel-2)] text-[var(--ink)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'}`}>
              <span className={`tnum text-[11px] font-semibold rounded px-1 ${track === tr.id ? 'bg-[var(--brass)] text-[var(--brass-ink)]' : 'border border-[var(--line)]'}`}>{tr.code}</span>
              {t(tr.key)}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onTour} aria-label={t('tour')}><Compass className="w-4 h-4" /><span className="hidden 2xl:inline">{t('tour')}</span></button>
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onData} aria-label={t('data')}><Database className="w-4 h-4" /><span className="hidden 2xl:inline">{t('data')}</span></button>
          <button className="btn btn-ghost btn-icon md:hidden" onClick={onData} aria-label={t('data')}><Database className="w-4 h-4" /></button>
          <button className="btn btn-ghost" onClick={onRecord} disabled={!!recording || !audioReady} title={audioReady ? t('record') : t('soundOn')}>
            <Circle className={`w-3.5 h-3.5 ${recording ? 'fill-rose-500 text-rose-500 animate-pulse' : 'text-rose-400'}`} />
            <span className={`${recording ? 'inline' : 'hidden 2xl:inline'} tnum`}>{recording ?? t('record')}</span>
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onSettings} aria-label={t('settings')}><Settings className="w-4.5 h-4.5" /></button>
          <button className={`btn ${audioReady ? '' : 'btn-brass'}`} onClick={onToggleAudio} aria-pressed={audioReady} title={`${audioReady ? t('soundOn') : t('soundOff')} (S)`} aria-label={audioReady ? t('soundOn') : t('soundOff')}>
            {audioReady ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{audioReady ? t('soundOn') : t('soundOff')}</span>
          </button>
        </div>
      </div>
      <nav className="min-[1400px]:hidden flex gap-1 px-2 pb-2 overflow-x-auto" aria-label={t('tracks')}>
        {TRACKS.map((tr) => (
          <button key={tr.id} onClick={() => onTrack(tr.id)} aria-current={track === tr.id ? 'page' : undefined}
            className={`shrink-0 h-9 px-3 rounded-lg text-sm cursor-pointer flex items-center gap-1.5 ${track === tr.id ? 'bg-[var(--panel-2)] text-[var(--ink)] border border-[var(--brass)]' : 'text-[var(--ink-2)] border border-[var(--line)]'}`}>
            <span className="tnum text-[11px] font-semibold">{tr.code}</span>{t(tr.key)}
          </button>
        ))}
      </nav>
    </header>
  );
};
