import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Headphones, Maximize2, Columns2 } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import type { StringKey } from '../lib/strings';
import { EIC_FRAMES } from '../lib/eicFrames';
import type { SeriesPoint } from '../datasets/series';
import { GLOBAL_STORIES, BGD_STORIES, SOURCES, type Topic } from './stories';
import { loadStorySeries } from './loadStory';
import { topicKey } from './labels';
import { Spark } from './StoryRow';
import { ImgOr } from '../components/ImgOr';

/** Feature D as roadmap D5: six Earth topics, each with a real visual (an EIC picture or a sparkline of the bundled series) and the story it opens. */
const TOPICS: { topic: Topic; story: string; frame?: string }[] = [
  { topic: 'temperature', story: 'gistemp' },
  { topic: 'greenhouse', story: 'co2', frame: 'eic-ghg' },
  { topic: 'ocean', story: 'eic-ocean-heat', frame: 'eic-ocean-heat' },
  { topic: 'ice', story: 'sea-ice' },
  { topic: 'fire', story: 'fire-week' },
  { topic: 'rain', story: 'bgd-sylhet', frame: 'eic-geos-rain' },
];
const ALL = [...GLOBAL_STORIES, ...BGD_STORIES];
type Stage = 'overview' | 'split' | 'immersive';

/** Centred active topic with prev/next, three stages Overview → Split → Immersive with Back at each, "Skip animation", and Listen. */
export function TopicCarousel({ onListen }: { onListen: (storyId: string) => void }) {
  const { t, lang } = usePrefs();
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<Stage>('overview');
  const [skip, setSkip] = useState(false);
  const [sparks, setSparks] = useState<Record<string, SeriesPoint[]>>({});
  useEffect(() => {
    let on = true;
    for (const tp of TOPICS) {
      const st = ALL.find((s) => s.id === tp.story);
      if (st && st.visual === 'chart' && !tp.frame) loadStorySeries(st).then((x) => { if (on && x) setSparks((m) => ({ ...m, [st.id]: x.points })); }, () => {});
    }
    return () => { on = false; };
  }, []);

  const n = TOPICS.length, cur = TOPICS[i], story = ALL.find((s) => s.id === cur.story)!;
  const frame = cur.frame ? EIC_FRAMES.find((f) => f.id === cur.frame) : null;
  const src = SOURCES.find((s) => s.key === story.source)?.label ?? '';
  const go = (d: 1 | -1) => { setI((k) => (k + d + n) % n); setStage('overview'); };
  const name = t(topicKey(cur.topic)), line = t(`topicLine_${cur.topic}` as StringKey), detail = t(`topicDetail_${cur.topic}` as StringKey);
  const visual = (big: boolean) => frame
    ? <ImgOr src={frame.src} alt={frame.what} className={`w-full rounded-lg border border-[var(--line)] object-contain bg-black ${big ? 'max-h-[60vh]' : 'max-h-56'}`} loading="lazy" />
    : <div role="img" aria-label={t('topicSparkAlt', { what: lang === 'bn' ? story.titleBn : story.title })} className="rounded-lg border border-[var(--line)] p-3 bg-[color-mix(in_srgb,var(--panel)_40%,transparent)]"><Spark points={sparks[story.id]} className={`w-full ${big ? 'h-56' : 'h-28'}`} /></div>;
  const listen = <button type="button" className="btn btn-brass" onClick={() => onListen(story.id)}><Headphones className="w-4 h-4" aria-hidden="true" />{t('topicListen')}</button>;
  const back = (to: Stage) => <button type="button" className="btn btn-ghost" onClick={() => setStage(to)}><ArrowLeft className="w-4 h-4" aria-hidden="true" />{t('topicBack')}</button>;

  return (
    <section className="topic-carousel reveal max-w-6xl mx-auto px-5 sm:px-10 pt-20" aria-roledescription="carousel" aria-labelledby="topics-title" data-skip={skip}>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 mb-6">
        <div>
          <h2 id="topics-title" className="land-title">{t('topicsTitle')}</h2>
          <hr className="world-rule land-rule" />
          <p className="land-lead">{t('topicsLead')}</p>
        </div>
        <button type="button" className="btn btn-ghost" aria-pressed={skip} onClick={() => setSkip(!skip)}>{t('topicSkip')}</button>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-icon shrink-0" onClick={() => go(-1)} aria-label={t('topicPrev')}><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <p role="status" aria-live="polite" className="sr-only">{t('topicOf', { i: i + 1, n, name })}</p>
          <div key={`${cur.topic}-${stage}`} className="topic-stage glass-flat p-4 sm:p-5" role="group" aria-roledescription="slide" aria-label={t('topicOf', { i: i + 1, n, name })}>
            {stage === 'overview' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr] items-center">
                <div className="space-y-2">
                  <p className="text-xs text-[var(--ink-3)] tnum">{t('topicOf', { i: i + 1, n, name })}</p>
                  <h3 className="font-display text-2xl font-bold">{name}</h3>
                  <p className="text-[var(--ink-2)]">{line}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" className="btn" onClick={() => setStage('split')}><Columns2 className="w-4 h-4" aria-hidden="true" />{t('topicMore')}</button>
                    {listen}
                  </div>
                </div>
                {visual(false)}
              </div>)}
            {stage === 'split' && (
              <div className="grid gap-4 md:grid-cols-2 items-start">
                {visual(false)}
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold">{lang === 'bn' ? story.titleBn : story.title}</h3>
                  <p className="text-[var(--ink-2)] leading-relaxed">{detail}</p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-xs text-[var(--ink-2)]">
                    <dt className="text-[var(--ink-3)]">{t('provSource')}</dt><dd>{src}</dd>
                    <dt className="text-[var(--ink-3)]">{t('provPeriod')}</dt><dd className="tnum">{story.visual === 'eic' ? t('jbPicture') : story.period}</dd>
                  </dl>
                  <div className="flex flex-wrap gap-2 pt-1">{back('overview')}<button type="button" className="btn" onClick={() => setStage('immersive')}><Maximize2 className="w-4 h-4" aria-hidden="true" />{t('topicImmersive')}</button>{listen}</div>
                </div>
              </div>)}
            {stage === 'immersive' && (
              <div className="space-y-3">
                {visual(true)}
                <p className="text-[var(--ink)] leading-relaxed">{detail}</p>
                <div className="flex flex-wrap gap-2">{back('split')}{listen}</div>
              </div>)}
          </div>
        </div>
        <button type="button" className="btn btn-icon shrink-0" onClick={() => go(1)} aria-label={t('topicNext')}><ChevronRight className="w-5 h-5" /></button>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 mt-3" role="group" aria-label={t('topicsTitle')}>
        {TOPICS.map((tp, k) => <button key={tp.topic} type="button" className={`chip min-h-[32px] cursor-pointer ${k === i ? 'border-[var(--brass)] text-[var(--ink)]' : ''}`} aria-pressed={k === i} onClick={() => { setI(k); setStage('overview'); }}>{t(topicKey(tp.topic))}</button>)}
      </div>
    </section>
  );
}
