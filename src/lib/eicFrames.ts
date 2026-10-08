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
    sourceUrl: 'https://earth.gov/themes/greenhouse-gases',
  },
  {
    id: 'eic-ocean-heat', layer: '', src: '/eic/ocean-heat-content.webp', format: 'png',
    title: 'Ocean heat content since 1957',
    titleBn: '১৯৫৭ সাল থেকে সমুদ্রের তাপ',
    what: 'The orange line is the cumulative increase in ocean heat from 1957 to 2020, in zettajoules. It climbs from 0 to about 350, fastest since the 1980s.',
    credit: 'NASA Earth Information Center (earth.gov), Sea Level Change theme',
    sourceUrl: 'https://earth.gov/themes/sea-level-change',
  },
  {
    id: 'eic-elnino', layer: '', src: '/eic/el-nino-crop-yields.webp', format: 'png',
    title: 'Forecast El Niño impact on crop yields',
    titleBn: 'ফসলের ফলনে এল নিনোর পূর্বাভাসিত প্রভাব',
    what: 'Orange shades mean lower yields, purple shades higher yields, on farmland around the world. Grey land is not shown.',
    credit: 'NASA Earth Information Center (earth.gov), Agriculture theme',
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
