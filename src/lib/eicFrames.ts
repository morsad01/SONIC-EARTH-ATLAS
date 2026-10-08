import type { NasaFrame } from './gibs';

/**
 * Frames taken from NASA's Earth Information Center (earth.gov). They are bundled in public/eic/ so they work offline.
 * Each `sourceUrl` is the earth.gov page the picture appears on.
 */
export const EIC_FRAMES: NasaFrame[] = [
  {
    id: 'eic-ghg', layer: '', src: '/eic/greenhouse-gas-index.webp', format: 'png',
    title: 'Greenhouse gas warming index, 1979 to 2021',
    titleBn: 'গ্রিনহাউস গ্যাসের উষ্ণায়ন সূচক, ১৯৭৯ থেকে ২০২১',
    what: 'One bar per year, taller means more warming effect. Red is CO₂, purple methane, blue nitrous oxide, yellow other gases. The ring shows each gas’s share.',
    credit: 'NASA Earth Information Center (earth.gov), Greenhouse Gases theme; data: NOAA Annual Greenhouse Gas Index',
    soundRegion: { x: 0.01, y: 0.09, w: 0.66, h: 0.84 }, soundIgnore: [{ x: 0.02, y: 0.1, w: 0.37, h: 0.1 }],
    sourceUrl: 'https://earth.gov/themes/greenhouse-gases',
  },
  {
    id: 'eic-ocean-heat', layer: '', src: '/eic/ocean-heat-content.webp', format: 'png',
    title: 'Ocean heat content since 1957',
    titleBn: '১৯৫৭ সাল থেকে সমুদ্রের তাপ',
    what: 'The orange line is the cumulative increase in ocean heat from 1957 to 2020, in zettajoules. It climbs from 0 to about 350, fastest since the 1980s.',
    credit: 'NASA Earth Information Center (earth.gov), Sea Level Change theme',
    soundRegion: { x: 0.23, y: 0.29, w: 0.58, h: 0.44 },
    sourceUrl: 'https://earth.gov/themes/sea-level-change',
  },
  {
    id: 'eic-elnino', layer: '', src: '/eic/el-nino-crop-yields.webp', format: 'png',
    title: 'Forecast El Niño impact on crop yields',
    titleBn: 'ফসলের ফলনে এল নিনোর পূর্বাভাসিত প্রভাব',
    what: 'Orange shades mean lower yields, purple shades higher yields, on farmland around the world. Grey land is not shown.',
    credit: 'NASA Earth Information Center (earth.gov), Agriculture theme',
    soundRegion: { x: 0.02, y: 0.02, w: 0.96, h: 0.86 },
    sourceUrl: 'https://earth.gov/themes/agriculture',
  },
  {
    id: 'eic-geos-rain', layer: '', src: '/eic/geos-earth-now-rain.webp', format: 'png',
    title: 'Global weather: rain and cloud (GEOS Earth Now)',
    titleBn: 'বিশ্বের আবহাওয়া: বৃষ্টি ও মেঘ (GEOS Earth Now)',
    what: 'A preview of the GEOS weather model view. Green, blue and pink patches mark rain over a satellite base map, and white is cloud. This is a model, not a satellite photo.',
    credit: 'NASA Earth Information Center (earth.gov), GEOS Earth Now interactive',
    sourceUrl: 'https://earth.gov',
  },
];

/** A short guided listen across the EIC frames: each step plays one sweep with a caption (spoken if narration is on). */
export interface StoryStep { frameId: string; en: string; bn: string }
export const EIC_STORY: StoryStep[] = [
  { frameId: 'eic-ghg', en: 'Greenhouse gases. Each bar is a year, from 1979. The sound grows louder and brighter as the warming effect climbs.', bn: 'গ্রিনহাউস গ্যাস। প্রতিটি দণ্ড একটি বছর, ১৯৭৯ থেকে। উষ্ণায়নের প্রভাব বাড়লে শব্দও জোরালো হয়।' },
  { frameId: 'eic-ocean-heat', en: 'Ocean heat since 1957. The orange line is the extra heat stored in the ocean. Listen for the pitch rising, fastest in recent decades.', bn: '১৯৫৭ থেকে সমুদ্রের তাপ। কমলা রেখাটি সমুদ্রে জমা বাড়তি তাপ। সুর কীভাবে চড়ছে শুনুন, সাম্প্রতিক দশকে সবচেয়ে দ্রুত।' },
  { frameId: 'eic-elnino', en: 'A forecast of how El Niño changes crop yields. Orange farmland loses harvest, purple gains. Notice where the sound clusters.', bn: 'এল নিনো ফসলের ফলন কীভাবে বদলায় তার পূর্বাভাস। কমলা অঞ্চলে ফলন কমে, বেগুনিতে বাড়ে। শব্দ কোথায় জমে লক্ষ করুন।' },
  { frameId: 'eic-geos-rain', en: 'Today’s weather from a NASA model. Green, blue and pink are rain, white is cloud. This is a model, not a photograph.', bn: 'নাসার মডেল থেকে আজকের আবহাওয়া। সবুজ, নীল ও গোলাপি বৃষ্টি, সাদা মেঘ। এটি মডেল, ছবি নয়।' },
];
