import type { ReactNode } from 'react';
import { ExternalLink, Headphones } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { EIC_FRAMES } from '../lib/eicFrames';
import { TRACKS } from '../lib/nav';
import type { DataSeries, SeriesPoint } from '../datasets/series';
import { ProvenanceCard } from '../components/data-status/ProvenanceCard';
import { DataState } from '../components/data-status/DataState';
import type { Story } from '../stories/stories';
import { SeriesChart } from './SeriesChart';
import { captionFor } from './caption';

export type StoryLoad = { status: 'loading'; message?: string } | { status: 'error'; message: string } | { status: 'ready'; series: DataSeries | null };

interface Props { story: Story; load: StoryLoad; points: SeriesPoint[]; cursor: string | null; sound?: ReactNode; onCursor: (t: string) => void; onRetry: () => void; onOpenCollection: (s: Story) => void }

/** Right column: title, explanation, the visual (EIC picture or chart with the cursor), a text caption, the sound legend and options, provenance, and the full collection player. */
export function StoryPanel({ story, load, points, cursor, sound, onCursor, onRetry, onOpenCollection }: Props) {
  const { t, lang } = usePrefs();
  const frame = story.frameId ? EIC_FRAMES.find((f) => f.id === story.frameId) : null;
  const series = load.status === 'ready' ? load.series : null;
  const cap = series ? captionFor(series.variable, series.unit, points, cursor, lang, t) : '';
  const coll = story.collection ? TRACKS.find((x) => x.id === story.collection) : null;
  return (
    <article className="panel p-3 sm:p-4 space-y-3" aria-labelledby="jb-story-title">
      <header className="space-y-1">
        <h2 id="jb-story-title" className="font-display text-xl font-bold leading-tight">{lang === 'bn' ? story.titleBn : story.title}</h2>
        <p className="text-sm text-[var(--ink-2)] leading-relaxed">{lang === 'bn' ? story.blurbBn : story.blurb}</p>
        {story.isSample && <span className="chip border-[var(--warm)]">{t('provSample')}</span>}
      </header>

      {frame ? (
        <figure className="space-y-2">
          <img src={frame.src} alt={frame.what} className="w-full h-auto rounded-lg border border-[var(--line)]" />
          <figcaption className="text-xs text-[var(--ink-3)]">{frame.credit} · <a className="link inline-flex items-center gap-1" href={frame.sourceUrl} target="_blank" rel="noreferrer">earth.gov<ExternalLink className="w-3 h-3" aria-hidden="true" /></a> · <span className="chip">{t('provContext')}</span></figcaption>
          {(lang === 'bn' ? frame.longBn : frame.longEn) && <details className="text-sm text-[var(--ink-2)]"><summary className="cursor-pointer min-h-[32px] flex items-center">{t('describeFrame')}</summary><p className="mt-1 leading-relaxed">{lang === 'bn' ? frame.longBn : frame.longEn}</p></details>}
        </figure>
      ) : load.status === 'loading' ? <DataState status="loading" message={load.message} />
        : load.status === 'error' ? <DataState status={typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error'} message={`${t('dsError')} ${load.message}`} onRetry={onRetry} />
        : series && (
          <>
            <SeriesChart points={points} cursor={cursor} unit={series.unit} label={series.variable} onCursor={onCursor} />
            <p className="text-sm text-[var(--ink)] min-h-[2.5rem]" data-caption>{cap}</p>
            {sound}
            <ProvenanceCard series={series} />
          </>)}

      {coll && <div className="rounded-lg border border-[var(--line)] p-2.5 space-y-2">
        <p className="text-xs text-[var(--ink-2)] flex gap-2"><Headphones className="w-4 h-4 shrink-0 text-[var(--brass)]" aria-hidden="true" />{t(frame ? 'plNoSound' : 'jbSoundNote')}</p>
        <button type="button" className="btn" onClick={() => onOpenCollection(story)}>{t('jbOpenCollection', { name: t(coll.key) })}</button>
      </div>}
    </article>
  );
}
