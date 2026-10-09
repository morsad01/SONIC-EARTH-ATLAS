import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { SeriesPoint } from '../datasets/series';
import type { Origin } from './useJukebox';
import { bucketOf, buildRows, BUCKET_LIMIT, type Row } from './timelineRows';
import { digits, timeLabel, valueLabel } from './format';

const now = () => Date.now();

interface Props { points: SeriesPoint[]; cursor: string | null; origin: Origin; seq: number; unit: string; label: string; onCursor: (t: string, origin: Origin) => void }

/**
 * Vertical rail of the real observation dates. Roving tabindex: ↑/↓ move and select, Home/End, → / ← open and close a bucket.
 * The active item has a filled marker, bold text and aria-current. While the user scrolls, the item in the middle band
 * becomes the cursor (origin 'scroll'); scrolls the rail makes itself are flagged and ignored, so nothing loops.
 */
export function TimelineView({ points, cursor, origin, seq, unit, label, onCursor }: Props) {
  const { t, lang, reduceMotion } = usePrefs();
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const cursorBucket = cursor && points.length > BUCKET_LIMIT ? bucketOf(cursor) : null;
  const rows = useMemo(() => buildRows(points, (b) => override[b] ?? b === cursorBucket), [points, override, cursorBucket]);
  const scroller = useRef<HTMLOListElement>(null), els = useRef(new Map<string, HTMLElement>());
  const programmatic = useRef(0), lastUserScroll = useRef(0);

  const tabKey = (focusKey && rows.some((r) => r.key === focusKey) ? focusKey : null) ?? (cursor && rows.some((r) => r.key === cursor) ? cursor : null) ?? (cursorBucket ? `b:${cursorBucket}` : rows[0]?.key);

  // Bring the cursor into view when it moved for any reason other than the user's own scrolling.
  useEffect(() => {
    if (!cursor || origin === 'scroll') return;
    const el = els.current.get(cursor), box = scroller.current;
    if (!el || !box) return;
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (r.top >= b.top && r.bottom <= b.bottom) return;
    programmatic.current = now();
    el.scrollIntoView?.({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [cursor, seq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll sync: only while the user is scrolling the rail (wheel, touch, scrollbar drag), never right after a programmatic scroll or a pick.
  useEffect(() => {
    const box = scroller.current;
    if (!box || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (now() - programmatic.current < 700 || now() - lastUserScroll.current > 600) return;
      const hit = entries.find((e) => e.isIntersecting)?.target.getAttribute('data-t');
      if (hit) onCursor(hit, 'scroll');
    }, { root: box, rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    els.current.forEach((el) => { if (el.dataset.t) io.observe(el); });
    return () => io.disconnect();
  }, [rows, onCursor]);
  // Plain scroll events also come from focus and smooth scrolling, so only scroll intents count.
  const intent = () => { lastUserScroll.current = now(); };
  const pick = (tm: string) => { programmatic.current = now(); onCursor(tm, 'user'); };

  const toggle = (b: string, open?: boolean) => setOverride((o) => ({ ...o, [b]: open ?? !(o[b] ?? b === cursorBucket) }));
  const focusRow = (r: Row) => { setFocusKey(r.key); els.current.get(r.key)?.focus(); if (r.kind === 'item' && r.t) pick(r.t); };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const r = rows[i];
    const go = (j: number) => { e.preventDefault(); const n = rows[Math.min(rows.length - 1, Math.max(0, j))]; if (n) focusRow(n); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(rows.length - 1);
    else if (r.kind === 'bucket' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); toggle(r.bucket, e.key === 'ArrowRight'); }
    else if (r.kind === 'item' && e.key === 'ArrowLeft' && r.bucket) go(rows.findIndex((x) => x.key === `b:${r.bucket}`));
  };

  if (!points.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--ink-3)]">{points.length > BUCKET_LIMIT ? t('jbTimelineBuckets', { n: digits(points.length, lang) }) : t('jbTimelineAll', { n: digits(points.length, lang) })}</p>
      <ol ref={scroller} onWheel={intent} onTouchMove={intent} onPointerDown={(e) => { if (e.target === e.currentTarget) intent(); }} aria-label={t('jbTimelineLabel', { what: label })} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusKey(null); }}
        className="relative max-h-[min(62dvh,620px)] overflow-y-auto overscroll-contain scroll-thin pr-1 border-l-2 border-[var(--line)] ml-2">
        {rows.map((r, i) => {
          const ref = (el: HTMLElement | null) => { if (el) els.current.set(r.key, el); else els.current.delete(r.key); };
          if (r.kind === 'bucket') return (
            <li key={r.key} className="-ml-[2px]">
              <button ref={ref} type="button" tabIndex={tabKey === r.key ? 0 : -1} aria-expanded={r.open} onClick={() => toggle(r.bucket)} onKeyDown={(e) => onKey(e, i)} onFocus={() => setFocusKey(r.key)}
                className={`w-full min-h-[40px] flex items-center gap-2 pl-2 pr-2 text-left text-sm rounded-r-md hover:bg-[var(--panel-2)] ${cursorBucket === r.bucket ? 'text-[var(--ink)] font-semibold' : 'text-[var(--ink-2)]'}`}>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-[var(--dur-fast)] ${r.open ? 'rotate-90' : ''}`} aria-hidden="true" />
                <span className="tnum">{digits(r.bucket, lang)}</span>
                <span className="text-xs text-[var(--ink-3)] tnum">{t('jbBucketCount', { n: digits(r.count ?? 0, lang) })}{r.gaps ? ` · ${t('jbBucketGaps', { n: digits(r.gaps, lang) })}` : ''}</span>
              </button>
            </li>);
          const active = r.t === cursor, gap = r.v === null || r.v === undefined;
          return (
            <li key={r.key} className="-ml-[2px]">
              <button ref={ref} data-t={r.t} type="button" tabIndex={tabKey === r.key ? 0 : -1} aria-current={active ? 'true' : undefined}
                onClick={() => { setFocusKey(r.key); pick(r.t!); }} onKeyDown={(e) => onKey(e, i)} onFocus={() => setFocusKey(r.key)}
                aria-label={`${timeLabel(r.t!, lang)}: ${gap ? t('jbGap') : valueLabel(r.v!, unit, lang)}${active ? `, ${t('jbActive')}` : ''}`}
                className={`w-full min-h-[36px] flex items-center gap-2 ${r.bucket ? 'pl-6' : 'pl-2'} pr-2 text-left text-sm rounded-r-md border-l-2 transition-colors duration-[var(--dur-fast)] ${active ? 'border-[var(--brass)] bg-[var(--panel-2)] text-[var(--ink)] font-semibold' : 'border-transparent text-[var(--ink-2)] hover:bg-[var(--panel-2)]'}`}>
                <span aria-hidden="true" className={`tl-marker w-2.5 h-2.5 rounded-full shrink-0 ${gap ? 'border border-dashed border-[var(--ink-3)]' : active ? 'bg-[var(--brass)] ring-2 ring-[var(--brass)] ring-offset-1 ring-offset-[var(--panel)]' : 'border border-[var(--accent)]'}`} />
                <span className="tnum w-[7.5rem] shrink-0">{timeLabel(r.t!, lang)}</span>
                <span className={`tnum ${gap ? 'italic text-[var(--ink-3)]' : ''}`}>{gap ? t('jbGap') : valueLabel(r.v!, unit, lang)}</span>
              </button>
            </li>);
        })}
      </ol>
    </div>
  );
}
