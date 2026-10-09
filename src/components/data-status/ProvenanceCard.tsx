import { useId, useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { usePrefs } from '../../lib/prefs';
import type { DataSeries } from '../../datasets/series';
import { badgeOf } from './badge';

/** Variable, unit, period, resolution, source link, credit, a badge and an expandable "method and limits" for one series. */
export function ProvenanceCard({ series: s, defaultOpen = false }: { series: DataSeries; defaultOpen?: boolean }) {
  const { t } = usePrefs();
  const [open, setOpen] = useState(defaultOpen), id = useId();
  const b = badgeOf(s);
  const badge = { snapshot: s.snapshotDate ? t('provSnapshot', { date: s.snapshotDate }) : t('provSnapshotNoDate'), live: t('provLive'), context: t('provContext'), sample: t('provSample') }[b];
  return (
    <article className="rounded-lg border border-[var(--line)] p-2.5 text-sm space-y-1.5" aria-label={s.variable} data-badge={b}>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 className="font-semibold text-[var(--ink)]">{s.variable}</h3>
        <span className="chip" style={b === 'live' ? { borderColor: 'var(--accent)' } : undefined}>{badge}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-[var(--ink-2)]">
        <dt className="text-[var(--ink-3)]">{t('provUnit')}</dt><dd>{s.unit}</dd>
        <dt className="text-[var(--ink-3)]">{t('provPeriod')}</dt><dd className="tnum">{s.period}</dd>
        <dt className="text-[var(--ink-3)]">{t('provSpatial')}</dt><dd>{s.spatialResolution}</dd>
        <dt className="text-[var(--ink-3)]">{t('provTemporal')}</dt><dd>{s.temporalResolution}</dd>
        <dt className="text-[var(--ink-3)]">{t('provSource')}</dt>
        <dd><a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">{s.source}<ExternalLink className="w-3 h-3" aria-hidden="true" /><span className="sr-only">{t('provOpenSource')}</span></a></dd>
      </dl>
      <p className="text-2xs text-[var(--ink-3)]">{s.attribution}</p>
      <button type="button" className="btn btn-ghost min-h-[36px] px-2" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />{t('provMethod')}
      </button>
      <div id={id} hidden={!open} className="text-xs text-[var(--ink-2)] space-y-1">
        <p><strong>{t('provMethodHead')}.</strong> {s.method}</p>
        <p><strong>{t('provLimitsHead')}.</strong> {s.limitations}</p>
      </div>
    </article>
  );
}
