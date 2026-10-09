import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { NORMALIZATION_SPECS } from '../sonification/normalizer';
import { usePrefs } from '../lib/prefs';
import { fmtNum, type StringKey } from '../lib/strings';
import { Overlay } from './Overlay';
import { useDialog } from '../lib/useDialog';

interface Props { open: boolean; onClose: () => void; onAbout?: () => void; sstGlobal?: { areaWeightedMeanAnomalyC: number; fractionWarmerThanNormal: number } }

const Sec: React.FC<{ color?: string; title: string; children: React.ReactNode }> = ({ color, title, children }) => (
  <section className="mt-6">
    <h3 className="font-display text-xl font-semibold flex items-center gap-2">{color && <span className="dot" style={{ background: color }} />}{title}</h3>
    <dl className="mt-2">{children}</dl>
  </section>
);

const Row: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-4 py-2 border-t border-[var(--line)]"><dt className="label">{k}</dt><dd className="text-sm leading-relaxed">{children}</dd></div>
);

/** Text with `backticks` shows those parts as code. */
const rich = (s: string) => s.split('`').map((p, i) => (i % 2 ? <code key={i}>{p}</code> : p));

export const DataMethodDialog: React.FC<Props> = ({ open, onClose, onAbout, sstGlobal }) => {
  const { t, lang } = usePrefs();
  const ref = useRef<HTMLDivElement>(null);
  useDialog(open, onClose, ref);
  if (!open) return null;
  const F = NORMALIZATION_SPECS;
  const r = (k: StringKey, vars?: Record<string, string | number>) => rich(t(k, vars));
  return (
    <Overlay><div className="fixed inset-0 z-[70] scrim grid place-items-center p-3" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="data-title" onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-4xl max-h-[92dvh] overflow-y-auto p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="data-title" className="font-display text-3xl font-extrabold">{t('dataTitle')}</h2>
            <p className="mt-2 text-[var(--ink-2)] max-w-[70ch]">{r('dmIntro')}</p>
            {onAbout && <button className="btn mt-3" onClick={onAbout}>{t('readAbout')}</button>}
          </div>
          <button className="btn btn-ghost btn-icon shrink-0" onClick={onClose} aria-label={t('close')}><X className="w-5 h-5" /></button>
        </div>

        <Sec color="var(--fire)" title={t('dmFireTitle')}>
          <Row k={t('provSource')}>{r('dmFireSource')}</Row>
          <Row k={t('dmSampling')}>{r('dmFireSampling')}</Row>
          <Row k={t('dmToSound')}>{r('dmFireSound', { f: F.fire.formulaString })}</Row>
        </Sec>
        <Sec color="var(--rain)" title={t('dmRainTitle')}>
          <Row k={t('provSource')}>{r('dmRainSource')}</Row>
          <Row k={t('dmSampling')}>{r('dmRainSampling')}</Row>
          <Row k={t('dmToSound')}>{r('dmRainSound', { f: F.precipitation.formulaString })}</Row>
        </Sec>
        <Sec color="var(--warm)" title={t('dmOceanTitle')}>
          <Row k={t('provSource')}>{r('dmOceanSource')}</Row>
          <Row k={t('dmSampling')}>{r('dmOceanSampling')}{sstGlobal && <> {t('dmOceanGlobal', { mean: fmtNum(sstGlobal.areaWeightedMeanAnomalyC, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pct: fmtNum(Math.round(sstGlobal.fractionWarmerThanNormal * 100), lang) })}</>}</Row>
          <Row k={t('dmToSound')}>{r('dmOceanSound', { f: F.sst.formulaString })}</Row>
        </Sec>
        <Sec title={t('dmOtherTitle')}>
          <Row k={t('dmFramesKey')}>{r('dmFramesBody')}</Row>
          <Row k={t('dmBdKey')}>{r('dmBdBody')}</Row>
          <Row k={t('dmVitalKey')}>{r('dmVitalBody')}</Row>
          <Row k={t('dmPlaceKey')}>{r('dmPlaceBody')}</Row>
        </Sec>

        <section className="mt-6">
          <h3 className="font-display text-xl font-semibold">{t('dmStereoTitle')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)] max-w-[75ch]">{t('dmStereoBody')}</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-3)] max-w-[75ch]">{t('dmCredit')}</p>
        </section>
      </div>
    </div></Overlay>
  );
};
