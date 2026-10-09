import { useMemo } from 'react';
import { usePrefs } from '../lib/prefs';
import type { SeriesPoint } from '../datasets/series';
import { digits, timeLabel, valueLabel } from './format';
import { linePaths } from './linePaths';

const W = 640, H = 220, L = 52, R = 12, T = 12, B = 28;

/** Lightweight line chart with a cursor, unit-labelled axis, gaps drawn as breaks and a table alternative. A click moves the cursor. */
export function SeriesChart({ points, cursor, unit, label, onCursor }: { points: SeriesPoint[]; cursor: string | null; unit: string; label: string; onCursor?: (t: string) => void }) {
  const { t, lang } = usePrefs();
  const g = useMemo(() => {
    const vals = points.map((p) => p.v).filter((v): v is number => v !== null);
    if (!vals.length) return null;
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
    const n = points.length;
    const x = (i: number) => L + (n === 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R));
    const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    return { lo, hi, x, y, paths: linePaths(points, x, y), vals };
  }, [points]);
  if (!g) return <p className="text-sm text-[var(--ink-3)]">{t('jbNoValues')}</p>;
  const ci = cursor ? points.findIndex((p) => p.t === cursor) : -1, cp = ci >= 0 ? points[ci] : null;
  const ticks = [g.hi, (g.lo + g.hi) / 2, g.lo];
  const xl = points.length > 2 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : points.map((_, i) => i);
  const gaps = points.filter((p) => p.v === null).length;
  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onCursor) return;
    const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (points.length - 1));
    const p = points[Math.min(points.length - 1, Math.max(0, i))];
    if (p) onCursor(p.t);
  };
  const alt = t('jbChartAlt', { what: label, from: timeLabel(points[0].t, lang), to: timeLabel(points[points.length - 1].t, lang), lo: valueLabel(Math.min(...g.vals), unit, lang), hi: valueLabel(Math.max(...g.vals), unit, lang) });
  return (
    <figure className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label={alt} onClick={pick} style={{ cursor: onCursor ? 'crosshair' : undefined }}>
        {ticks.map((v, k) => (
          <g key={k}>
            <line x1={L} x2={W - R} y1={g.y(v)} y2={g.y(v)} stroke="var(--line)" strokeDasharray={k === 1 ? '3 4' : undefined} />
            <text x={L - 6} y={g.y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">{digits(v.toFixed(Math.abs(v) >= 10 ? 0 : 1), lang)}</text>
          </g>
        ))}
        {g.lo < 0 && g.hi > 0 && <line x1={L} x2={W - R} y1={g.y(0)} y2={g.y(0)} stroke="var(--ink-3)" strokeWidth={1} />}
        <text x={4} y={T + 2} fontSize="11" fill="var(--ink-2)" dominantBaseline="hanging">{unit}</text>
        {xl.map((i) => <text key={i} x={g.x(i)} y={H - 8} fontSize="11" fill="var(--ink-3)" textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}>{timeLabel(points[i].t, lang)}</text>)}
        {g.paths.map((d, k) => <path key={k} d={d} fill="none" stroke="var(--accent)" strokeWidth={points.length > 200 ? 1.25 : 2} strokeLinejoin="round" />)}
        {points.length <= 60 && points.map((p, i) => p.v !== null && <circle key={p.t} cx={g.x(i)} cy={g.y(p.v)} r={2.2} fill="var(--accent)" />)}
        {cp && (
          <g data-cursor={cp.t}>
            <line x1={g.x(ci)} x2={g.x(ci)} y1={T} y2={H - B} stroke="var(--brass)" strokeWidth={1.5} />
            {cp.v !== null ? <circle cx={g.x(ci)} cy={g.y(cp.v)} r={5} fill="var(--brass)" stroke="var(--abyss)" strokeWidth={2} />
              : <text x={g.x(ci) + 4} y={T + 12} fontSize="11" fill="var(--brass)">{t('jbGap')}</text>}
          </g>
        )}
      </svg>
      {gaps > 0 && <figcaption className="text-[11px] text-[var(--ink-3)]">{t('jbGapsNote', { n: digits(gaps, lang) })}</figcaption>}
      <details className="text-xs text-[var(--ink-2)]">
        <summary className="cursor-pointer min-h-[32px] flex items-center">{t('profileTable')}</summary>
        <div className="max-h-56 overflow-y-auto scroll-thin">
          <table className="tnum w-full mt-1">
            <caption className="sr-only">{label}</caption>
            <thead><tr><th scope="col" className="text-left font-semibold">{t('jbTime')}</th><th scope="col" className="text-left font-semibold">{unit}</th></tr></thead>
            <tbody>{points.map((p) => <tr key={p.t} aria-current={p.t === cursor ? 'true' : undefined} className={p.t === cursor ? 'text-[var(--ink)] font-semibold' : undefined}>
              <th scope="row" className="text-left font-normal text-[var(--ink-3)]">{timeLabel(p.t, lang)}</th><td>{p.v === null ? t('jbGap') : valueLabel(p.v, unit, lang)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
