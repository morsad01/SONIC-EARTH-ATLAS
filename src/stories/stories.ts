import type { DatasetId } from '../datasets/registry';
import type { Track } from '../lib/nav';
import { EIC_FRAMES } from '../lib/eicFrames';

/** Data stories for the Jukebox (roadmap Phase 4). Each one names the registry datasets it plays; nothing here holds a number. */
export type Topic = 'temperature' | 'greenhouse' | 'ice' | 'ocean' | 'fire' | 'rain' | 'agriculture';
export type SourceKey = 'giss' | 'noaa' | 'nsidc' | 'jpl' | 'firms' | 'power' | 'eic';
export type RegionKind = 'global' | 'bangladesh' | 'country';
export type StoryKind = 'gistemp' | 'co2' | 'ice' | 'sst' | 'fire-week' | 'eic' | 'monsoon' | 'country-temp' | 'country-rain' | 'country-fire';

export interface Story {
  id: string;
  kind: StoryKind;
  topic: Topic;
  region: RegionKind;
  country?: string; // alpha-3, country stories only
  countryName?: string; // English name, for the region label
  datasetIds: DatasetId[];
  source: SourceKey;
  period: string; // the span the files are built for; the panel shows the period actually present
  visual: 'chart' | 'eic';
  isSample: boolean;
  title: string;
  titleBn: string;
  blurb: string;
  blurbBn: string;
  collection?: Track; // the full existing track that plays the same data
  frameId?: string; // EIC frame
  division?: string; // Bangladesh division (monsoon file city name)
}

export const TOPICS: Topic[] = ['temperature', 'greenhouse', 'ice', 'ocean', 'fire', 'rain', 'agriculture'];
export const SOURCES: { key: SourceKey; label: string }[] = [
  { key: 'giss', label: 'NASA GISS' }, { key: 'noaa', label: 'NOAA GML' }, { key: 'nsidc', label: 'NSIDC' }, { key: 'jpl', label: 'NASA JPL MUR' },
  { key: 'firms', label: 'NASA FIRMS' }, { key: 'power', label: 'NASA POWER' }, { key: 'eic', label: 'Earth Information Center' },
];

const EIC_TOPIC: Record<string, Topic> = { 'eic-ghg': 'greenhouse', 'eic-ocean-heat': 'ocean', 'eic-elnino': 'agriculture', 'eic-geos-rain': 'rain' };
const EIC_BN: Record<string, string> = {
  'eic-ghg': 'প্রতি বছর একটি দণ্ড, উঁচু মানে বেশি উষ্ণায়ন প্রভাব। লাল CO₂, বেগুনি মিথেন, নীল নাইট্রাস অক্সাইড, হলুদ অন্যান্য গ্যাস।',
  'eic-ocean-heat': 'কমলা রেখাটি ১৯৫৭ থেকে ২০২০ পর্যন্ত সমুদ্রে জমা তাপের মোট বৃদ্ধি, জেটাজুলে। ০ থেকে প্রায় ৩৫০ পর্যন্ত ওঠে।',
  'eic-elnino': 'বিশ্বের চাষের জমিতে কমলা মানে ফলন কম, বেগুনি মানে বেশি। ধূসর জমি দেখানো হয়নি।',
  'eic-geos-rain': 'GEOS আবহাওয়া মডেলের দৃশ্য। সবুজ, নীল ও গোলাপি বৃষ্টি, সাদা মেঘ। এটি মডেল, স্যাটেলাইট ছবি নয়।',
};

export const GLOBAL_STORIES: Story[] = [
  { id: 'gistemp', kind: 'gistemp', topic: 'temperature', region: 'global', datasetIds: ['gistemp'], source: 'giss', period: '1880–2025', visual: 'chart', isSample: false, collection: 'pulse',
    title: 'Global temperature since 1880', titleBn: '১৮৮০ থেকে বৈশ্বিক তাপমাত্রা',
    blurb: 'One value per year: how much warmer or cooler the whole planet was than the 1951–1980 average.', blurbBn: 'প্রতি বছর একটি মান: পুরো পৃথিবী ১৯৫১–১৯৮০ গড়ের চেয়ে কতটা উষ্ণ বা শীতল ছিল।' },
  { id: 'co2', kind: 'co2', topic: 'greenhouse', region: 'global', datasetIds: ['vital-signs'], source: 'noaa', period: '1959–2025', visual: 'chart', isSample: false, collection: 'pulse',
    title: 'Carbon dioxide in the air since 1959', titleBn: '১৯৫৯ থেকে বাতাসে কার্বন ডাই-অক্সাইড',
    blurb: 'The yearly mean of the Mauna Loa record, the longest direct measurement of CO₂.', blurbBn: 'মাউনা লোয়া রেকর্ডের বার্ষিক গড়, CO₂-এর সবচেয়ে দীর্ঘ সরাসরি পরিমাপ।' },
  { id: 'sea-ice', kind: 'ice', topic: 'ice', region: 'global', datasetIds: ['vital-signs'], source: 'nsidc', period: '1979–2025', visual: 'chart', isSample: false, collection: 'pulse',
    title: 'Arctic sea ice each September since 1979', titleBn: '১৯৭৯ থেকে প্রতি সেপ্টেম্বরে আর্কটিকের সামুদ্রিক বরফ',
    blurb: 'September is when the ice is smallest. One value per year, from satellites.', blurbBn: 'সেপ্টেম্বরে বরফ সবচেয়ে কম থাকে। স্যাটেলাইট থেকে প্রতি বছর একটি মান।' },
  { id: 'sst-month', kind: 'sst', topic: 'ocean', region: 'global', datasetIds: ['sst'], source: 'jpl', period: 'September 2026', visual: 'chart', isSample: false, collection: 'atlas',
    title: 'Ocean surface heat, last month', titleBn: 'সমুদ্রপৃষ্ঠের তাপ, গত মাস',
    blurb: 'One month of sea surface temperature against normal, as a global area-weighted mean from a 1° sample.', blurbBn: 'এক মাসের সমুদ্রপৃষ্ঠের তাপমাত্রা স্বাভাবিকের তুলনায়, ১° নমুনা থেকে এলাকা-ভারিত বৈশ্বিক গড়।' },
  { id: 'fire-week', kind: 'fire-week', topic: 'fire', region: 'global', datasetIds: ['fire'], source: 'firms', period: 'October 2026', visual: 'chart', isSample: false, collection: 'atlas',
    title: 'The strongest fire each day this week', titleBn: 'এই সপ্তাহে প্রতিদিনের সবচেয়ে জোরালো আগুন',
    blurb: 'The highest fire radiative power any 2° cell reached each day, from VIIRS satellite detections.', blurbBn: 'VIIRS স্যাটেলাইট শনাক্তকরণ থেকে প্রতিদিন যেকোনো ২° ঘরের সর্বোচ্চ অগ্নি-বিকিরণ শক্তি।' },
  ...EIC_FRAMES.map((f): Story => ({
    id: f.id, kind: 'eic', topic: EIC_TOPIC[f.id] ?? 'temperature', region: 'global', datasetIds: ['eic'], source: 'eic', period: 'Picture', visual: 'eic', isSample: false, collection: 'frames', frameId: f.id,
    title: f.title, titleBn: f.titleBn, blurb: f.what, blurbBn: EIC_BN[f.id] ?? f.titleBn,
  })),
];

/** City names exactly as in public/data/bangladesh_monsoon.json. */
export const BGD_DIVISIONS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'] as const;
const BN_DIV: Record<string, string> = { Dhaka: 'ঢাকা', Chattogram: 'চট্টগ্রাম', Sylhet: 'সিলেট', Rajshahi: 'রাজশাহী', Khulna: 'খুলনা', Barishal: 'বরিশাল', Rangpur: 'রংপুর', Mymensingh: 'ময়মনসিংহ' };

export const BGD_STORIES: Story[] = BGD_DIVISIONS.map((d) => ({
  id: `bgd-${d.toLowerCase()}`, kind: 'monsoon', topic: 'rain', region: 'bangladesh', country: 'BGD', datasetIds: ['monsoon'], source: 'power', period: 'June–October 2026', visual: 'chart', isSample: false, collection: 'monsoon', division: d,
  title: `Monsoon rain in ${d}`, titleBn: `${BN_DIV[d]}-এ বর্ষার বৃষ্টি`,
  blurb: `Daily rain at the ${d} division point, June to October 2026.`, blurbBn: `${BN_DIV[d]} বিভাগের বিন্দুতে দৈনিক বৃষ্টি, জুন থেকে অক্টোবর ২০২৬।`,
}));

/** Stories built on demand for a country: POWER monthly temperature and rain at its representative point, and fire only when a cell lies inside the border. */
export function countryStories(id: string, name: string, nameBn: string, o: { fireInside: boolean }): Story[] {
  const c = id.toLowerCase();
  const out: Story[] = [
    { id: `c-${c}-temp`, kind: 'country-temp', topic: 'temperature', region: 'country', country: id, countryName: name, datasetIds: ['power-monthly'], source: 'power', period: '1981–2025', visual: 'chart', isSample: false,
      title: `${name}: monthly temperature`, titleBn: `${nameBn}: মাসিক তাপমাত্রা`,
      blurb: 'Monthly air temperature at one representative point, 1981–2025. Not an average of the country.', blurbBn: 'একটি প্রতিনিধি বিন্দুতে মাসিক বাতাসের তাপমাত্রা, ১৯৮১–২০২৫। দেশের গড় নয়।' },
    { id: `c-${c}-rain`, kind: 'country-rain', topic: 'rain', region: 'country', country: id, countryName: name, datasetIds: ['power-monthly'], source: 'power', period: '1981–2025', visual: 'chart', isSample: false,
      title: `${name}: monthly rain`, titleBn: `${nameBn}: মাসিক বৃষ্টি`,
      blurb: 'Monthly mean daily rain at the same point, 1981–2025.', blurbBn: 'একই বিন্দুতে মাসিক গড় দৈনিক বৃষ্টি, ১৯৮১–২০২৫।' },
  ];
  if (o.fireInside) out.push({ id: `c-${c}-fire`, kind: 'country-fire', topic: 'fire', region: 'country', country: id, countryName: name, datasetIds: ['fire'], source: 'firms', period: 'October 2026', visual: 'chart', isSample: false, collection: 'atlas',
    title: `${name}: fire cells each day`, titleBn: `${nameBn}: প্রতিদিন আগুনের ঘর`,
    blurb: 'How many 2° cells with a fire detection have their centre inside the border, per day.', blurbBn: 'প্রতিদিন কতগুলো আগুন-শনাক্ত ২° ঘরের কেন্দ্র সীমানার ভেতরে।' });
  return out;
}

/** Country stories first, then Bangladesh when it is the country, then the global ones, then Bangladesh otherwise. */
export function storiesFor(country: { id: string; name: string; nameBn: string; fireInside: boolean } | null): Story[] {
  const own = country ? countryStories(country.id, country.name, country.nameBn, { fireInside: country.fireInside }) : [];
  return country?.id === 'BGD' ? [...own, ...BGD_STORIES, ...GLOBAL_STORIES] : [...own, ...GLOBAL_STORIES, ...BGD_STORIES];
}

/** `c-npl-temp` → `c-bgd-temp`: the same kind of story for another country, so the cursor can be kept (roadmap R4). */
export function remapStoryId(id: string, ids: string[]): string | null {
  const m = /^c-[a-z]{3}-(\w+)$/.exec(id);
  return m ? ids.find((x) => x.endsWith(`-${m[1]}`) && x.startsWith('c-')) ?? null : null;
}

export interface StoryFilters { topic: Topic | 'all'; source: SourceKey | 'all'; region: RegionKind | 'all' }
export const matchesFilters = (s: Story, f: StoryFilters) => (f.topic === 'all' || s.topic === f.topic) && (f.source === 'all' || s.source === f.source) && (f.region === 'all' || s.region === f.region);
