import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { describeVoice } from '../audio/voiceParams';
import { usePrefs, speak } from '../lib/prefs';
import { LAYER_META } from './LayersPanel';
import { placeLabel } from '../lib/placesBn';

interface Props {
  observations: EarthObservation[];
  enabled: Record<PhenomenonType, boolean>;
  audioReady: boolean;
  onSelect: (o: EarthObservation) => void;
}

/** Live, plain-language account of what each audible voice is and how its data became sound. */
export const HearingPanel: React.FC<Props> = ({ observations, enabled, audioReady, onSelect }) => {
  const { t, lang, narration } = usePrefs();
  const [live, setLive] = useState<EarthObservation[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const read = () => {
      const m = SonificationEngine.getInstance().getActiveVoiceDetails();
      setLive([...m.values()].map((v) => v.obs).filter((o) => !o.id.startsWith('preview')).sort((a, b) => b.normalizedValue - a.normalizedValue));
    };
    read();
    const id = window.setInterval(read, 600);
    return () => clearInterval(id);
  }, [observations, enabled, audioReady]);

  const fallback = useMemo(() => observations.filter((o) => enabled[o.phenomenon]).sort((a, b) => b.normalizedValue - a.normalizedValue), [observations, enabled]);
  const rows = (audioReady && live.length ? live : fallback).slice(0, 5);
  const top = rows[0];

  useEffect(() => {
    if (narration && audioReady && top) speak(`${t(LAYER_META[top.phenomenon].name)}, ${placeLabel(top.regionName, lang)}, ${Math.round(top.value * 10) / 10} ${top.unit}`, lang);
  }, [top?.id, narration, audioReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const where = (pan: number) => (Math.abs(pan) < 0.08 ? t('centre') : `${Math.round(Math.abs(pan) * 100)}% ${pan < 0 ? t('left') : t('right')}`);
  const trend = (o: EarthObservation) => {
    if (o.phenomenon === 'sst') return lang === 'bn' ? 'মাসিক গড়' : 'monthly mean';
    const d = o.delta ?? 0;
    if (Math.abs(d) < 0.05) return t('steady');
    return `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} ${t('vsYesterday')}`;
  };

  return (
    <section className="panel p-3" aria-labelledby="hearing-title">
      <button className="w-full flex items-center justify-between gap-2 cursor-pointer" onClick={() => setOpen(!open)} aria-expanded={open}>
        <h2 id="hearing-title" className="font-display font-semibold text-lg">{t('nowHearing')}</h2>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <>
          {!audioReady && <p className="text-sm text-[var(--ink-2)] mt-1">{t('nothingPlaying')}</p>}
          <ol className="mt-2 space-y-1.5" aria-live="off">
            {rows.map((o) => {
              const m = LAYER_META[o.phenomenon], v = describeVoice(o);
              const color = o.phenomenon === 'sst' ? (o.value >= 0 ? 'var(--warm)' : 'var(--cold)') : m.color;
              return (
                <li key={o.id}>
                  <button onClick={() => onSelect(o)} className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-[var(--panel-2)] cursor-pointer">
                    <div className="flex items-baseline gap-2">
                      <span className="dot translate-y-[-1px]" style={{ background: color }} />
                      <span className="font-semibold truncate">{placeLabel(o.regionName, lang)}</span>
                      <span className="ml-auto tnum text-sm whitespace-nowrap">{o.value > 0 && o.phenomenon === 'sst' ? '+' : ''}{(Math.round(o.value * 10) / 10).toLocaleString()} {o.unit}</span>
                    </div>
                    <div className="pl-4 text-xs text-[var(--ink-3)] tnum">
                      {t(m.sound)} · {where(v.pan)} · {Math.round(v.pitchHz)} Hz{v.ratePerSec ? ` · ${v.ratePerSec.toFixed(1)} ${t('rate')}` : ''} · {trend(o)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="text-[11px] text-[var(--ink-3)] mt-2 leading-snug">
            {lang === 'bn'
              ? 'অবস্থান = দ্রাঘিমাংশ। মান বাড়লে আগুন দ্রুত ও উজ্জ্বল চটচট করে, বৃষ্টির ফোঁটা ঘন ও উঁচু হয়, গরম সমুদ্রের গুঞ্জন উঁচু সুরে বাজে।'
              : 'Position follows longitude. Higher values make fire crackle faster and brighter, rain drip denser and higher, and warm-ocean drones rise in pitch.'}
          </p>
        </>
      )}
    </section>
  );
};
