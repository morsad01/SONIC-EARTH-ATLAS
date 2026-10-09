import { useEffect, useRef, useState } from 'react';
import { usePrefs } from '../lib/prefs';
import type { SeriesPoint } from '../datasets/series';
import type { SonificationSpec } from '../sonification/series/specs';
import { MAX_PULSES, type MappedPoint } from '../sonification/series/mapping';
import { digits, timeLabel, valueLabel } from './format';

interface Props { spec: SonificationSpec; unit: string; points: SeriesPoint[]; mapped: MappedPoint[]; cursor: string | null; caption: string; playing: boolean }

/** Trailing throttle: the newest text, at most once per `ms` (1/s while playing, so a screen reader is not flooded). */
function useThrottled(text: string, ms: number) {
  const [out, setOut] = useState(text);
  const last = useRef(0);
  useEffect(() => {
    const id = window.setTimeout(() => { last.current = Date.now(); setOut(text); }, Math.max(0, last.current + ms - Date.now()));
    return () => window.clearTimeout(id);
  }, [text, ms]);
  return out;
}

/** Live legend (roadmap Phase 5): the value at the cursor → note, pulses and timbre, and why. Mirrored in a throttled live caption. */
export function MappingLegend({ spec, unit, points, mapped, cursor, caption, playing }: Props) {
  const { t, lang } = usePrefs();
  const i = cursor ? points.findIndex((p) => p.t === cursor) : -1;
  const p = i >= 0 ? points[i] : null, m = i >= 0 ? mapped[i] : null;
  let prev: SeriesPoint | null = null;
  for (let k = i - 1; k >= 0; k--) if (points[k].v !== null) { prev = points[k]; break; }
  const v = (x: number) => valueLabel(x, unit, lang);
  const b = spec.baselineLabel ?? (spec.baseline !== null ? v(spec.baseline) : '');

  const why: string[] = [];
  if (p && m?.kind === 'note' && p.v !== null) {
    why.push(t('lgPitch', { pct: digits(Math.round(m.norm * 100), lang) }));
    if (m.clipped) why.push(t(m.clipped === 'high' ? 'lgClippedHigh' : 'lgClippedLow'));
    why.push(m.delta === null || !prev ? t('lgPulsesFirst') : t('lgPulses', { n: digits(m.pulses, lang), d: v(Math.abs(m.delta)), from: timeLabel(prev.t, lang) }));
    why.push(t(m.timbre === 'warm' ? 'lgTimbreWarm' : m.timbre === 'soft' ? 'lgTimbreSoft' : 'lgTimbrePlain', { b }));
  }
  const live = useThrottled(m?.kind === 'note' ? t('lgLive', { cap: caption, note: m.note, n: digits(m.pulses, lang) }) : caption, playing ? 1000 : 0);

  return (
    <section className="rounded-lg border border-[var(--line)] p-2.5 space-y-1.5" aria-labelledby="jb-legend">
      <h3 id="jb-legend" className="font-display text-sm font-bold">{t('lgTitle')}</h3>
      <p className="text-xs text-[var(--ink-2)] leading-relaxed">{lang === 'bn' ? spec.legend.bn : spec.legend.en}</p>
      <p className="text-xs text-[var(--ink-3)]">{t(spec.fixed ? 'lgRange' : 'lgRangeOwn', { lo: v(spec.ref[0]), hi: v(spec.ref[1]) })}</p>
      {!p || !m ? <p className="text-sm text-[var(--ink-3)]">{t('lgNoCursor')}</p>
        : m.kind === 'silence' || p.v === null ? <p className="text-sm" data-legend-now>{t('lgSilence')}</p>
        : <>
          <p className="text-sm font-semibold tnum" data-legend-now>{t('lgNote', { v: v(p.v), note: m.note, hz: digits(Math.round(m.freq), lang) })}
            <span className="sr-only">, </span><span className="ml-2 inline-flex gap-0.5 align-middle" aria-hidden="true">
              {Array.from({ length: MAX_PULSES }, (_, k) => <span key={k} className={`inline-block w-1.5 h-1.5 rounded-full ${k < m.pulses ? 'bg-[var(--brass)]' : 'border border-[var(--line)]'}`} />)}</span></p>
          <ul className="text-xs text-[var(--ink-2)] space-y-0.5 list-disc pl-4">{why.map((w) => <li key={w}>{w}</li>)}</ul>
        </>}
      <p role="status" aria-live="polite" className="sr-only">{live}</p>
    </section>
  );
}
