import React, { useRef } from 'react';
import type { EarthObservation } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { DATASET_CATALOG } from '../datasets/datasetMetadata';
import { usePrefs } from '../lib/prefs';
import { fmtNum } from '../lib/strings';
import { useDialog } from '../lib/useDialog';
import { Overlay } from './Overlay';
import { X, Volume2, ExternalLink, MapPin, Activity, Compass, Clock, Sliders } from 'lucide-react';

interface InspectLocationModalProps {
  observation: EarthObservation | null;
  onClose: () => void;
}

const TINT: Record<string, string> = { fire: 'var(--fire)', precipitation: 'var(--rain)', sst: 'var(--warm)' };

/** Pan as a whole percent: longitude / 180, so 180°W is 100% left. */
function panPercent(lon: number): number { return Math.round(Math.abs(lon / 180) * 100); }

export const InspectLocationModal: React.FC<InspectLocationModalProps> = ({ observation, onClose }) => {
  const { t, lang } = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(!!observation, onClose, ref);
  if (!observation) return null;

  const catalog = DATASET_CATALOG[observation.phenomenon];
  const pct = panPercent(observation.longitude);
  const panLabel = pct === 0 ? t('inspCentre') : t(observation.longitude < 0 ? 'inspLeft' : 'inspRight', { n: fmtNum(pct, lang) });
  const n1 = (v: number) => fmtNum(v, lang, { maximumFractionDigits: 1 });
  const tint = TINT[observation.phenomenon] ?? 'var(--brass)';

  return (
    <Overlay>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 scrim max-w-[100vw] overflow-x-hidden safe-pb safe-pt" onClick={onClose}>
        <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="inspect-title" onClick={(e) => e.stopPropagation()}
          className="glass-strong max-w-lg w-full max-h-[85dvh] overflow-y-auto p-4 sm:p-5 text-[var(--ink)] space-y-3.5">
          <div className="flex items-start justify-between border-b border-[var(--line)] pb-3 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${tint} 20%, transparent)`, color: tint }}>
                <Activity className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id="inspect-title" className="text-base font-semibold truncate">{observation.regionName || observation.variable}</h2>
                <p className="text-xs text-[var(--ink-3)] truncate">{catalog.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon shrink-0" aria-label={t('close')}><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="p-3 bg-[color-mix(in_srgb,var(--panel-2)_45%,transparent)] rounded-xl border border-[var(--line)]">
              <span className="text-[var(--ink-3)] text-xs block">{t('inspMeasured')}</span>
              <span className="text-xl font-semibold mt-0.5 block tnum">{n1(observation.value)} <span className="text-xs text-[var(--ink-3)]">{observation.unit}</span></span>
              {observation.delta !== undefined && (
                <span className={`text-xs block mt-1 tnum ${observation.delta >= 0 ? 'text-[var(--brass)]' : 'text-[var(--cold)]'}`}>
                  Δ {observation.delta > 0 ? '+' : ''}{n1(observation.delta)} {t('inspVsPrev')}
                </span>
              )}
            </div>
            <div className="p-3 bg-[color-mix(in_srgb,var(--panel-2)_45%,transparent)] rounded-xl border border-[var(--line)]">
              <span className="text-[var(--ink-3)] text-xs block">{t('inspIntensity')}</span>
              <span className="text-xl font-semibold text-[var(--brass)] mt-0.5 block tnum">{fmtNum(observation.normalizedValue, lang, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-[var(--brass)] h-full rounded-full" style={{ width: `${Math.round(observation.normalizedValue * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="p-3 bg-[color-mix(in_srgb,var(--panel-2)_45%,transparent)] rounded-xl border border-[var(--line)] space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--ink-3)] flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{t('inspCoords')}</span>
              <span className="font-medium truncate tnum">{fmtNum(observation.latitude, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}° {t('inspLat')}, {fmtNum(observation.longitude, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}° {t('inspLon')}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--ink-3)] flex items-center gap-1.5 shrink-0"><Compass className="w-3.5 h-3.5" aria-hidden="true" />{t('inspPan')}</span>
              <span className="font-medium truncate tnum">{panLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--ink-3)] flex items-center gap-1.5 shrink-0"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{t('inspTime')}</span>
              <span className="truncate tnum">{observation.timestamp}</span>
            </div>
            {observation.confidence !== undefined && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--ink-3)] shrink-0">{t('inspConf')}</span>
                <span className="text-[var(--teal)] font-medium tnum">{fmtNum(observation.confidence, lang)}%</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-[color-mix(in_srgb,var(--panel-2)_45%,transparent)] rounded-xl border border-[var(--line)] text-sm">
            <div className="text-xs text-[var(--ink-3)] flex items-center gap-1 mb-1"><Sliders className="w-3 h-3 text-[var(--brass)]" aria-hidden="true" />{t('inspHow')}</div>
            <p className="text-xs text-[var(--ink-2)] break-words">{catalog.audioFormula}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <a href={catalog.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--brass)] hover:text-[var(--ink)] flex items-center gap-1 min-h-[44px]">
              <span>{t('inspSource', { p: catalog.provider })}</span><ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
            <button onClick={() => SonificationEngine.getInstance().playObservation(observation)} className="btn btn-brass w-full sm:w-auto min-h-[44px]">
              <Volume2 className="w-4 h-4" aria-hidden="true" /><span>{t('inspPlay')}</span>
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};
