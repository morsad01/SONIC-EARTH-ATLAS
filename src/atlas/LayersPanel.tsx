import React from 'react';
import { Volume2, Info } from 'lucide-react';
import type { PhenomenonType } from '../types/dataset';
import type { LayerLoadStatus } from '../datasets/adapter';
import { SonificationEngine } from '../audio/sonificationEngine';
import { usePrefs } from '../lib/prefs';
import { LAYER_META } from './layerMeta';

interface Props {
  enabled: Record<PhenomenonType, boolean>;
  onToggle: (p: PhenomenonType) => void;
  counts: Record<PhenomenonType, number>;
  statuses?: Record<PhenomenonType, LayerLoadStatus>;
  isFallback: boolean;
  statusMessage: string;
  audioReady: boolean;
  onOpenData: () => void;
}

export const LayersPanel: React.FC<Props> = ({ enabled, onToggle, counts, statuses, isFallback, statusMessage, audioReady, onOpenData }) => {
  const { t } = usePrefs();
  return (
    <div className="panel p-3 space-y-2" role="group" aria-label={t('layers')}>
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display font-semibold text-lg">{t('layers')}</h2>
        <span className={`chip ${isFallback ? 'border-amber-400/60 text-amber-200' : 'border-emerald-400/40 text-emerald-200'}`}>
          <span className="dot" style={{ background: isFallback ? '#fbbf24' : '#34d399' }} />{isFallback ? 'Sample' : t('realData')}
        </span>
      </div>
      {(Object.keys(LAYER_META) as PhenomenonType[]).map((p) => {
        const m = LAYER_META[p], on = enabled[p], st = statuses?.[p];
        const available = isFallback || st?.loaded !== false;
        return (
          <div key={p} className={`rounded-xl border p-2.5 transition ${on ? 'bg-[var(--panel-2)]' : 'bg-transparent'}`} style={{ borderColor: on ? m.color : 'var(--line)' }}>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={on} disabled={!available} onChange={() => onToggle(p)} />
                <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0 peer-focus-visible:outline peer-focus-visible:outline-2" style={{ background: on ? m.color : 'transparent', border: `1px solid ${m.color}` }}>
                  <m.Icon className="w-4.5 h-4.5" style={{ color: on ? '#0b1620' : m.color }} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight">{t(m.name)} <span className="text-[var(--ink-3)] font-normal tnum text-sm">· {counts[p]}</span></span>
                  <span className="block text-xs text-[var(--ink-3)] truncate">{t(m.unit)} → {t(m.sound)}</span>
                </span>
              </label>
              <button className="btn btn-ghost btn-icon shrink-0" disabled={!audioReady} title={audioReady ? `${t('hear')}: ${t(m.name)}` : t('soundOn')}
                aria-label={`${t('hear')} ${t(m.name)} reference sound`} onClick={() => SonificationEngine.getInstance().playIsolatedPreview(p)}>
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {st?.loaded && <p className="text-[11px] leading-snug text-[var(--ink-3)] mt-1.5 pl-12">{st.sourceName}. {st.infoText}.</p>}
          </div>
        );
      })}
      <button onClick={onOpenData} className="w-full text-left text-xs text-[var(--ink-2)] px-1 pt-1 flex items-start gap-1.5 hover:text-[var(--ink)] cursor-pointer">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{statusMessage}. {t('data')}</span>
      </button>
    </div>
  );
};
