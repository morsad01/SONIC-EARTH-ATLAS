import type { PhenomenonType } from '../types/dataset';

export interface Step {
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
