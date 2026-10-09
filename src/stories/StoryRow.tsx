import { memo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { EIC_FRAMES } from '../lib/eicFrames';
import type { SeriesPoint } from '../datasets/series';
import type { Story } from './stories';
import { topicKey, regionLabel } from './labels';

/** Tiny real-data line for a card (or nothing until the series has loaded). */
export function Spark({ points, className = 'w-full h-10' }: { points?: SeriesPoint[]; className?: string }) {
  const vals = points?.map((p) => p.v).filter((v): v is number => v !== null) ?? [];
  if (vals.length < 2) return <div className={className} aria-hidden="true" />;
  const lo = Math.min(...vals), hi = Math.max(...vals), n = points!.length;
  const d = points!.map((p, i) => (p.v === null ? null : `${(i / (n - 1)) * 200},${38 - ((p.v - lo) / (hi - lo || 1)) * 36}`)).filter(Boolean).join(' ');
  return <svg viewBox="0 0 200 40" preserveAspectRatio="none" className={className} aria-hidden="true"><polyline points={d} fill="none" stroke="var(--accent)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" /></svg>;
}

/**
 * Horizontal story row: scroll-snap, overscroll contained on x only (vertical page scroll passes through), arrow buttons, ←/→ keys
 * between cards, the active card scrolled to the centre. Neighbours stay partly visible on wide screens.
 */
/** Memoised: the cards (with sparklines) do not re-render on every playback cursor tick. */
export const StoryRow = memo(function StoryRow({ stories, activeId, onSelect, sparks }: { stories: Story[]; activeId: string | null; onSelect: (id: string) => void; sparks: Record<string, SeriesPoint[] | undefined> }) {
  const { t, lang, reduceMotion } = usePrefs();
  const row = useRef<HTMLUListElement>(null), cards = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    const el = activeId ? cards.current.get(activeId) : null, box = row.current;
    if (!el || !box) return;
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo?.({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeId, stories.length, reduceMotion]);
  const page = (dir: 1 | -1) => row.current?.scrollBy?.({ left: dir * row.current.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? stories.length - 1 : null;
    if (j === null) return;
    e.preventDefault();
    const s = stories[Math.min(stories.length - 1, Math.max(0, j))];
    cards.current.get(s.id)?.focus();
  };
  const activeIdx = Math.max(0, stories.findIndex((s) => s.id === activeId));
  return (
    <section aria-label={t('jbStories')} className="relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="font-display text-lg font-semibold">{t('jbStories')} <span className="text-sm font-normal text-[var(--ink-3)] tnum">({stories.length})</span></h2>
        <div className="flex gap-1">
          <button type="button" className="btn btn-icon" onClick={() => page(-1)} aria-label={t('jbPrevStories')}><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" className="btn btn-icon" onClick={() => page(1)} aria-label={t('jbNextStories')}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      {!stories.length ? <p className="text-sm text-[var(--ink-3)]">{t('jbNoStories')}</p> : (
        <ul ref={row} className="story-row flex gap-3 overflow-x-auto pb-2 scroll-thin" aria-label={t('jbStories')}>
          {stories.map((s, i) => {
            const active = s.id === activeId, frame = s.frameId ? EIC_FRAMES.find((f) => f.id === s.frameId) : null;
            return (
              <li key={s.id} className="story-card shrink-0">
                <button ref={(el) => { if (el) cards.current.set(s.id, el); else cards.current.delete(s.id); }} type="button" tabIndex={i === activeIdx ? 0 : -1}
                  aria-pressed={active} onClick={() => onSelect(s.id)} onKeyDown={(e) => onKey(e, i)}
                  className={`w-full h-full text-left rounded-xl border p-3 flex flex-col gap-2 cursor-pointer lift ${active ? 'border-[var(--brass)] bg-[var(--panel-2)] shadow-[inset_0_-3px_0_var(--brass)]' : 'border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_85%,transparent)]'}`}>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="chip">{t(topicKey(s.topic))}</span>
                    <span className="chip">{regionLabel(s, lang, t)}</span>
                    {s.isSample && <span className="chip border-[var(--warm)]">{t('provSample')}</span>}
                    {active && <span className="chip border-[var(--brass)] text-[var(--brass)]">{t('jbNowShowing')}</span>}
                  </div>
                  {frame ? <img src={frame.src} alt="" loading="lazy" className="w-full h-10 object-cover rounded opacity-90" /> : <Spark points={sparks[s.id]} />}
                  <span className="font-semibold leading-snug text-sm">{lang === 'bn' ? s.titleBn : s.title}</span>
                  <span className="text-xs text-[var(--ink-3)] tnum mt-auto">{s.visual === 'eic' ? t('jbPicture') : s.period}</span>
                </button>
              </li>);
          })}
        </ul>)}
    </section>
  );
});
