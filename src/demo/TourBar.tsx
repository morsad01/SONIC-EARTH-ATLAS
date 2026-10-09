import React, { useEffect, useState } from 'react';
import { Pause, Play, X, SkipForward } from 'lucide-react';
import type { PhenomenonType } from '../types/dataset';
import { usePrefs, speak } from '../lib/prefs';

interface Step {
  ms: number;
  layers: Record<PhenomenonType, boolean>;
  day: number;
  change: boolean;
  focus: { lat: number; lon: number };
  en: string;
  bn: string;
}

const L = (fire: boolean, precipitation: boolean, sst: boolean) => ({ fire, precipitation, sst });

// Every number below comes from the bundled snapshots (FIRMS 2–5 Oct, POWER 2–5 Oct, MUR Sep 2026).
export const TOUR: Step[] = [
  { ms: 5000, layers: L(false, false, false), day: 0, change: false, focus: { lat: 10, lon: 0 },
    en: 'Sound is on. This is Earth on 2 October 2026. Every voice you will hear is one real NASA observation.',
    bn: 'শব্দ চালু। এটি ২ অক্টোবর ২০২৬-এর পৃথিবী। প্রতিটি শব্দ নাসার একটি আসল পর্যবেক্ষণ।' },
  { ms: 8000, layers: L(true, false, false), day: 0, change: false, focus: { lat: -9, lon: 15 },
    en: 'Wildfires from VIIRS. Faster, brighter crackle means more fire radiative power. Angola and Congo burn to your right, Brazil to your left.',
    bn: 'VIIRS স্যাটেলাইটের দাবানল। দ্রুত ও উজ্জ্বল চটচট মানে বেশি আগুনের শক্তি। অ্যাঙ্গোলা ও কঙ্গো ডানে, ব্রাজিল বামে।' },
  { ms: 7000, layers: L(true, false, false), day: 0, change: false, focus: { lat: 40, lon: -110 },
    en: 'The strongest fire cell that day: Idaho, United States, 675 megawatts. Far to your left, because it is far west.',
    bn: 'সেদিনের সবচেয়ে শক্তিশালী আগুন: আইডাহো, যুক্তরাষ্ট্র, ৬৭৫ মেগাওয়াট। অনেক পশ্চিমে, তাই অনেক বামে।' },
  { ms: 8000, layers: L(false, true, false), day: 3, change: false, focus: { lat: 20, lon: 105 },
    en: 'Rain, 5 October. Northern Vietnam got 93 millimetres in one day. Denser, higher droplets mean heavier rain.',
    bn: 'বৃষ্টি, ৫ অক্টোবর। উত্তর ভিয়েতনামে এক দিনে ৯৩ মিলিমিটার। ঘন ও উঁচু ফোঁটা মানে বেশি বৃষ্টি।' },
  { ms: 8500, layers: L(false, false, true), day: 0, change: false, focus: { lat: -1, lon: -100 },
    en: 'Ocean heat, September 2026. The eastern equatorial Pacific is up to 7 degrees above normal, a pattern typical of El Niño. Warmer water hums higher.',
    bn: 'সমুদ্রের তাপ, সেপ্টেম্বর ২০২৬। পূর্ব নিরক্ষীয় প্রশান্ত মহাসাগর স্বাভাবিকের চেয়ে ৭ ডিগ্রি পর্যন্ত গরম, এল নিনোর মতো। গরম পানি উঁচু সুরে গুঞ্জন করে।' },
  { ms: 8000, layers: L(true, true, true), day: 3, change: true, focus: { lat: -5, lon: 20 },
    en: 'All three together, in Hear the change mode: places that grew since the day before now play louder and faster. Congo jumped to 572 megawatts.',
    bn: 'তিনটি একসাথে, পরিবর্তন মোডে: আগের দিনের চেয়ে যেখানে বেড়েছে সেখানে শব্দ জোরালো ও দ্রুত। কঙ্গো লাফিয়ে ৫৭২ মেগাওয়াট।' },
  { ms: 6500, layers: L(true, true, true), day: 3, change: false, focus: { lat: 23, lon: 90 },
    en: 'Next, try the other tracks: NASA image frames, the Bangladesh monsoon, and 146 years of warming.',
    bn: 'এবার অন্য ট্র্যাক শুনুন: নাসার ছবি, বাংলাদেশের বর্ষা, আর ১৪৬ বছরের উষ্ণায়ন।' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (layers: Record<PhenomenonType, boolean>, day: number, change: boolean, focus: { lat: number; lon: number }) => void;
}

export const TourBar: React.FC<Props> = ({ open, onClose, onApply }) => {
  const { lang, narration } = usePrefs();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { if (open) { setI(0); setElapsed(0); setPaused(false); } }, [open]);

  useEffect(() => {
    if (!open) return;
    const s = TOUR[i];
    onApply(s.layers, s.day, s.change, s.focus);
    if (narration) speak(lang === 'bn' ? s.bn : s.en, lang);
    setElapsed(0);
  }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || paused) return;
    const id = window.setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(id);
  }, [open, paused]);

  useEffect(() => {
    if (!open || elapsed < TOUR[i].ms) return;
    if (i < TOUR.length - 1) setI(i + 1); else onClose();
  }, [elapsed, i, open, onClose]);

  if (!open) return null;
  const s = TOUR[i];
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-3 z-30 w-[min(720px,calc(100%-24px))] panel p-3 sm:p-4 shadow-2xl" role="region" aria-label="Guided tour">
      <div className="flex items-start gap-3">
        <span className="tnum text-xs font-semibold rounded-full border border-[var(--brass)] text-[var(--brass)] px-2 py-0.5 mt-0.5 shrink-0">{i + 1}/{TOUR.length}</span>
        <p className="flex-1 text-[15px] leading-snug" aria-live="polite">{lang === 'bn' ? s.bn : s.en}</p>
        <div className="flex gap-1 shrink-0">
          <button className="btn btn-ghost btn-icon" onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume tour' : 'Pause tour'}>{paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
          <button className="btn btn-ghost btn-icon" onClick={() => (i < TOUR.length - 1 ? setI(i + 1) : onClose())} aria-label="Next step"><SkipForward className="w-4 h-4" /></button>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="End tour"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="mt-2 h-1 rounded bg-[var(--line)] overflow-hidden"><div className="h-full bg-[var(--brass)]" style={{ width: `${Math.min(100, (elapsed / s.ms) * 100)}%` }} /></div>
    </div>
  );
};
