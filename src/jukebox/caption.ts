import type { SeriesPoint } from '../datasets/series';
import type { Lang, StringKey } from '../lib/strings';
import { timeLabel, valueLabel } from './format';

type T = (k: StringKey, v?: Record<string, string | number>) => string;

/** Pure: the text caption for the cursor, with the change from the previous value that exists. Gaps are said, never filled. */
export function captionFor(what: string, unit: string, points: SeriesPoint[], cursor: string | null, lang: Lang, t: T): string {
  const i = cursor ? points.findIndex((p) => p.t === cursor) : -1;
  if (i < 0) return '';
  const p = points[i], time = timeLabel(p.t, lang);
  if (p.v === null) return t('jbCapGap', { time, what });
  let prev: SeriesPoint | null = null;
  for (let k = i - 1; k >= 0; k--) if (points[k].v !== null) { prev = points[k]; break; }
  const base = t('jbCap', { time, what, v: valueLabel(p.v, unit, lang) });
  if (!prev) return base;
  const d = Math.round((p.v - prev.v!) * 1000) / 1000, from = timeLabel(prev.t, lang);
  return `${base} ${d === 0 ? t('jbCapSame', { from }) : t(d > 0 ? 'jbCapUp' : 'jbCapDown', { d: valueLabel(Math.abs(d), unit, lang), from })}`;
}
