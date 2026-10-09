/**
 * One sonification spec per dataset (roadmap Phase 5). The reference range is fixed per dataset, not taken from the
 * period on screen, so the same value always gets the same note whatever range or country is chosen.
 */
export interface SonificationSpec {
  id: string;
  label: { en: string; bn: string };
  unit: string;
  ref: [number, number]; // value at the lowest and highest note, in the series unit
  curve: 'linear' | 'sqrt'; // sqrt spreads skewed rain values over more notes
  baseline: number | null; // anomaly datasets: above / below changes the timbre
  baselineLabel?: string;
  rateRef: number; // |change from the previous value| that gives the most pulses
  stepMs: number; // one step at speed 1 in even-step mode
  legend: { en: string; bn: string };
  fixed: boolean; // false only for the fallback, whose range comes from the series itself
}

const S = (id: string, o: Omit<SonificationSpec, 'id' | 'fixed'>): SonificationSpec => ({ id, fixed: true, ...o });

export const SPECS: Record<string, SonificationSpec> = {
  gistemp: S('gistemp', { label: { en: 'Global temperature anomaly', bn: 'বৈশ্বিক তাপমাত্রার বিচ্যুতি' }, unit: '°C', ref: [-0.6, 1.4], curve: 'linear', baseline: 0, baselineLabel: '1951–1980', rateRef: 0.25, stepMs: 160,
    legend: { en: 'Higher note = warmer year. Warm triangle above the 1951–1980 average, soft sine below. More pulses = a bigger jump from the year before.', bn: 'উঁচু সুর = উষ্ণ বছর। ১৯৫১–১৯৮০ গড়ের ওপরে উষ্ণ ত্রিভুজ-তরঙ্গ, নিচে নরম সাইন। বেশি স্পন্দন = আগের বছরের চেয়ে বড় লাফ।' } }),
  'vital-co2': S('vital-co2', { label: { en: 'CO₂ at Mauna Loa', bn: 'মাউনা লোয়ায় CO₂' }, unit: 'ppm', ref: [310, 430], curve: 'linear', baseline: null, rateRef: 3, stepMs: 220,
    legend: { en: 'Higher note = more CO₂ at Mauna Loa (310–430 ppm range). More pulses = a faster rise that year.', bn: 'উঁচু সুর = মাউনা লোয়ায় বেশি CO₂ (৩১০–৪৩০ ppm পরিসর)। বেশি স্পন্দন = সেই বছর দ্রুত বৃদ্ধি।' } }),
  'vital-ice': S('vital-ice', { label: { en: 'Arctic sea ice, September', bn: 'আর্কটিক সামুদ্রিক বরফ, সেপ্টেম্বর' }, unit: 'million km²', ref: [3, 8], curve: 'linear', baseline: null, rateRef: 1, stepMs: 220,
    legend: { en: 'Higher note = more September ice (3–8 million km² range), so the melody falls as the ice shrinks. More pulses = a bigger change from the year before.', bn: 'উঁচু সুর = সেপ্টেম্বরে বেশি বরফ (৩–৮ মিলিয়ন কিমি² পরিসর), তাই বরফ কমলে সুর নামে। বেশি স্পন্দন = আগের বছরের চেয়ে বড় পরিবর্তন।' } }),
  'sst-month': S('sst-month', { label: { en: 'Ocean surface temperature anomaly', bn: 'সমুদ্রপৃষ্ঠের তাপমাত্রার বিচ্যুতি' }, unit: '°C', ref: [-1, 1.5], curve: 'linear', baseline: 0, baselineLabel: 'MUR climatology', rateRef: 0.3, stepMs: 700,
    legend: { en: 'One note for the month. Higher = warmer ocean surface than normal. Warm triangle above normal, soft sine below.', bn: 'মাসের জন্য একটি সুর। উঁচু = স্বাভাবিকের চেয়ে উষ্ণ সমুদ্রপৃষ্ঠ। স্বাভাবিকের ওপরে উষ্ণ ত্রিভুজ, নিচে নরম সাইন।' } }),
  'fire-week': S('fire-week', { label: { en: 'Strongest fire of the day', bn: 'দিনের সবচেয়ে জোরালো আগুন' }, unit: 'MW', ref: [0, 1000], curve: 'linear', baseline: null, rateRef: 300, stepMs: 600,
    legend: { en: 'Higher note = a stronger fire that day (0–1000 MW range). More pulses = a bigger change from the day before.', bn: 'উঁচু সুর = সেদিন আরও জোরালো আগুন (০–১০০০ MW পরিসর)। বেশি স্পন্দন = আগের দিনের চেয়ে বড় পরিবর্তন।' } }),
  monsoon: S('monsoon', { label: { en: 'Bangladesh daily rain', bn: 'বাংলাদেশের দৈনিক বৃষ্টি' }, unit: 'mm/day', ref: [0, 150], curve: 'sqrt', baseline: null, rateRef: 60, stepMs: 110,
    legend: { en: 'Higher note = more rain that day (0–150 mm/day, square-root scale so light rain is still heard). A dry day is the lowest note; a missing day is silent.', bn: 'উঁচু সুর = সেদিন বেশি বৃষ্টি (০–১৫০ মিমি/দিন, বর্গমূল স্কেল, তাই হালকা বৃষ্টিও শোনা যায়)। শুকনো দিন সবচেয়ে নিচু সুর; ডেটা না থাকলে নীরবতা।' } }),
  'power-t2m': S('power-t2m', { label: { en: 'Country monthly temperature', bn: 'দেশের মাসিক তাপমাত্রা' }, unit: '°C', ref: [-40, 40], curve: 'linear', baseline: null, rateRef: 10, stepMs: 130,
    legend: { en: 'Higher note = warmer month (−40 to 40 °C, the same range for every country). The yearly cycle is heard as a rising and falling melody. More pulses = a bigger change from the month before.', bn: 'উঁচু সুর = উষ্ণ মাস (−৪০ থেকে ৪০ °C, সব দেশের জন্য একই পরিসর)। বছরের চক্র ওঠা-নামা সুরে শোনা যায়। বেশি স্পন্দন = আগের মাসের চেয়ে বড় পরিবর্তন।' } }),
  'power-prectotcorr': S('power-prectotcorr', { label: { en: 'Country monthly rain', bn: 'দেশের মাসিক বৃষ্টি' }, unit: 'mm/day', ref: [0, 30], curve: 'sqrt', baseline: null, rateRef: 10, stepMs: 130,
    legend: { en: 'Higher note = a wetter month (0–30 mm/day mean, square-root scale, the same for every country). More pulses = a bigger change from the month before.', bn: 'উঁচু সুর = বেশি বৃষ্টির মাস (০–৩০ মিমি/দিন গড়, বর্গমূল স্কেল, সব দেশে একই)। বেশি স্পন্দন = আগের মাসের চেয়ে বড় পরিবর্তন।' } }),
  'country-fire': S('country-fire', { label: { en: 'Fire cells inside a border', bn: 'সীমানার ভেতরে আগুনের ঘর' }, unit: 'cells', ref: [0, 20], curve: 'linear', baseline: null, rateRef: 5, stepMs: 600,
    legend: { en: 'Higher note = more 2° cells with fire inside the border that day (0–20 range). More pulses = a bigger change from the day before.', bn: 'উঁচু সুর = সেদিন সীমানার ভেতরে আগুনসহ বেশি ২° ঘর (০–২০ পরিসর)। বেশি স্পন্দন = আগের দিনের চেয়ে বড় পরিবর্তন।' } }),
};

/** The spec for a series id. Unknown series get a range from their own values and say so (`fixed: false`). */
export function specFor(seriesId: string, values: (number | null)[] = []): SonificationSpec {
  if (SPECS[seriesId]) return SPECS[seriesId];
  if (seriesId.startsWith('monsoon-')) return SPECS.monsoon;
  if (/^coverage-.+-fire$/.test(seriesId)) return SPECS['country-fire'];
  const v = values.filter((x): x is number => x !== null);
  const lo = v.length ? Math.min(...v) : 0, hi = v.length ? Math.max(...v) : 1;
  return { id: 'fallback', label: { en: 'Other series', bn: 'অন্য সারি' }, unit: '', ref: [lo, hi > lo ? hi : lo + 1], curve: 'linear', baseline: null, rateRef: Math.max((hi - lo) / 4, 1e-9), stepMs: 200, fixed: false,
    legend: { en: 'Higher note = higher value. The range is this series’ own lowest to highest value.', bn: 'উঁচু সুর = বড় মান। পরিসরটি এই সারিরই সর্বনিম্ন থেকে সর্বোচ্চ মান।' } };
}
