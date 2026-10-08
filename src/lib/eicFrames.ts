import type { NasaFrame } from './gibs';

/**
 * Frames taken from NASA's Earth Information Center (earth.gov). They are bundled in public/eic/ so they work offline.
 * Each `sourceUrl` is the earth.gov page the picture appears on.
 */
export const EIC_FRAMES: NasaFrame[] = [
  {
    id: 'eic-ghg', layer: '', src: '/eic/greenhouse-gas-index.webp', format: 'png',
    longEn: `A black background with a bar chart on the left and a ring chart on the right. The title at the top left reads NOAA Annual Greenhouse Gas Index. There is one bar for each year from 1979 to 2021, and the bars climb steadily from left to right, so the last bar is nearly twice as tall as the first. Each bar is stacked in colours: red-orange at the bottom for carbon dioxide, which is the biggest part, then purple for methane, a thin blue band for nitrous oxide, and yellow on top for other gases. The ring on the right is labelled Warming Contributions. Carbon dioxide takes roughly two thirds of the ring, methane is the next largest slice, and nitrous oxide and other gases share the rest.`,
    longBn: `কালো পটভূমিতে বাঁ দিকে একটি দণ্ডচিত্র আর ডান দিকে একটি বলয়চিত্র। উপরে বাঁয়ে শিরোনাম: NOAA Annual Greenhouse Gas Index। ১৯৭৯ থেকে ২০২১ পর্যন্ত প্রতি বছরের জন্য একটি দণ্ড, আর দণ্ডগুলো বাঁ থেকে ডানে ধীরে ধীরে উঁচু হয়েছে, ফলে শেষ দণ্ড প্রথমটির প্রায় দ্বিগুণ। প্রতিটি দণ্ডে রং সাজানো: নিচে লালচে-কমলা কার্বন ডাই-অক্সাইড, যা সবচেয়ে বড় অংশ, তার উপরে বেগুনি মিথেন, সরু নীল নাইট্রাস অক্সাইড, আর একদম উপরে হলুদ অন্যান্য গ্যাস। ডানের বলয়ের নাম Warming Contributions। কার্বন ডাই-অক্সাইড বলয়ের প্রায় দুই-তৃতীয়াংশ, মিথেন পরের বড় অংশ, বাকিটা নাইট্রাস অক্সাইড ও অন্যান্য গ্যাসের।`,
    title: 'Greenhouse gas warming index, 1979 to 2021',
    titleBn: 'গ্রিনহাউস গ্যাসের উষ্ণায়ন সূচক, ১৯৭৯ থেকে ২০২১',
    what: 'One bar per year, taller means more warming effect. Red is CO₂, purple methane, blue nitrous oxide, yellow other gases. The ring shows each gas’s share.',
    credit: 'NASA Earth Information Center (earth.gov), Greenhouse Gases theme; data: NOAA Annual Greenhouse Gas Index',
    soundRegion: { x: 0.01, y: 0.09, w: 0.66, h: 0.84 }, soundIgnore: [{ x: 0.02, y: 0.1, w: 0.37, h: 0.1 }],
    sourceUrl: 'https://earth.gov/themes/greenhouse-gases',
  },
  {
    id: 'eic-ocean-heat', layer: '', src: '/eic/ocean-heat-content.webp', format: 'png',
    longEn: `A dark, square image with a blue-grey map of the world's oceans, drawn as one connected shape with the continents left out in black. A line graph is laid over it. The vertical axis is ocean heat increase since 1957 in zettajoules, from 0 to 350, and the horizontal axis runs from 1960 to 2020. An orange line starts at zero in 1957, wobbles up and down at low values until the late 1960s, then climbs. It reaches about 100 around 1990 and keeps rising faster, ending near 350 around 2020.`,
    longBn: `একটি অন্ধকার চৌকো ছবি, তাতে পৃথিবীর মহাসাগরগুলোর নীলচে-ধূসর মানচিত্র, একটি সংযুক্ত আকারে আঁকা, মহাদেশগুলো কালো। তার উপর একটি রেখাচিত্র। খাড়া অক্ষে ১৯৫৭ থেকে সমুদ্রের তাপ বৃদ্ধি, জেটাজুলে, ০ থেকে ৩৫০; আনুভূমিক অক্ষ ১৯৬০ থেকে ২০২০। একটি কমলা রেখা ১৯৫৭ সালে শূন্য থেকে শুরু, ষাটের দশকের শেষ পর্যন্ত কম মানে ওঠানামা করে, তারপর উঠতে থাকে। ১৯৯০-এর কাছাকাছি প্রায় ১০০ ছোঁয়, তারপর আরও দ্রুত উঠে ২০২০-এর কাছাকাছি প্রায় ৩৫০-এ পৌঁছায়।`,
    title: 'Ocean heat content since 1957',
    titleBn: '১৯৫৭ সাল থেকে সমুদ্রের তাপ',
    what: 'The orange line is the cumulative increase in ocean heat from 1957 to 2020, in zettajoules. It climbs from 0 to about 350, fastest since the 1980s.',
    credit: 'NASA Earth Information Center (earth.gov), Sea Level Change theme',
    soundRegion: { x: 0.23, y: 0.29, w: 0.58, h: 0.44 },
    sourceUrl: 'https://earth.gov/themes/sea-level-change',
  },
  {
    id: 'eic-elnino', layer: '', src: '/eic/el-nino-crop-yields.webp', format: 'png',
    longEn: `A dark grey world map. Only farmland is coloured, and the legend at the bottom runs from orange for a negative effect on crop yields, through cream and pale lilac, to purple for a positive effect. Large parts of the United States are pale lilac. India, eastern China and parts of Southeast Asia are cream to orange. Southern Africa and parts of West Africa and Morocco are orange. Argentina and Uruguay are lilac to purple, and Australia's southern coast is cream. Everything else is grey because it is not shown.`,
    longBn: `গাঢ় ধূসর একটি বিশ্বমানচিত্র। শুধু চাষের জমি রঙিন, আর নিচের নির্দেশিকায় ফসলের ফলনে নেতিবাচক প্রভাব কমলা থেকে ক্রিম ও হালকা ফিকে বেগুনি হয়ে ইতিবাচক প্রভাব গাঢ় বেগুনি। যুক্তরাষ্ট্রের বড় অংশ হালকা বেগুনি। ভারত, পূর্ব চীন ও দক্ষিণ-পূর্ব এশিয়ার কিছু অংশ ক্রিম থেকে কমলা। দক্ষিণ আফ্রিকা, পশ্চিম আফ্রিকার কিছু অংশ ও মরক্কো কমলা। আর্জেন্টিনা ও উরুগুয়ে বেগুনি, অস্ট্রেলিয়ার দক্ষিণ উপকূল ক্রিম। বাকি সবকিছু ধূসর, কারণ তা দেখানো হয়নি।`,
    title: 'Forecast El Niño impact on crop yields',
    titleBn: 'ফসলের ফলনে এল নিনোর পূর্বাভাসিত প্রভাব',
    what: 'Orange shades mean lower yields, purple shades higher yields, on farmland around the world. Grey land is not shown.',
    credit: 'NASA Earth Information Center (earth.gov), Agriculture theme',
    soundRegion: { x: 0.02, y: 0.02, w: 0.96, h: 0.86 },
    sourceUrl: 'https://earth.gov/themes/agriculture',
  },
  {
    id: 'eic-geos-rain', layer: '', src: '/eic/geos-earth-now-rain.webp', format: 'png',
    longEn: `A very wide strip of the whole world, seen as a satellite picture with dark blue oceans and brown and green land. On top, bright green patches mark rain, with blue and pink spots where it is heaviest, and white swirls are cloud. Rain is thickest across Southeast Asia and the Bay of Bengal side, central Africa, northern South America, and along storm bands over the Pacific and Atlantic. The Sahara, Arabia and central Australia are mostly dry and brown. A few round storm swirls can be seen over the Atlantic and Pacific.`,
    longBn: `পুরো পৃথিবীর একটি খুব চওড়া ফালি, স্যাটেলাইট ছবির মতো: গাঢ় নীল সাগর আর বাদামি ও সবুজ স্থলভাগ। তার উপর উজ্জ্বল সবুজ ছোপ বৃষ্টি বোঝায়, সবচেয়ে ভারী জায়গায় নীল ও গোলাপি বিন্দু, আর সাদা পাক মেঘ। বৃষ্টি সবচেয়ে ঘন দক্ষিণ-পূর্ব এশিয়া ও বঙ্গোপসাগরের দিকে, মধ্য আফ্রিকায়, দক্ষিণ আমেরিকার উত্তরে, আর প্রশান্ত ও আটলান্টিকের ঝড়ের ফিতেয়। সাহারা, আরব ও মধ্য অস্ট্রেলিয়া বেশির ভাগ শুকনো ও বাদামি। আটলান্টিক ও প্রশান্ত মহাসাগরে কয়েকটি গোল ঝড়ের পাক দেখা যায়।`,
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
