// Bangla names for every place that appears in the bundled snapshots.
const BN: Record<string, string> = {
  'Agulhas region, off South Africa': 'দক্ষিণ আফ্রিকার কাছে আগুলহাস অঞ্চল', Angola: 'অ্যাঙ্গোলা', 'Arabian Sea': 'আরব সাগর', Australia: 'অস্ট্রেলিয়া',
  Bolivia: 'বলিভিয়া', Brazil: 'ব্রাজিল', 'Central Equatorial Pacific': 'মধ্য নিরক্ষীয় প্রশান্ত মহাসাগর', 'Central North Pacific': 'মধ্য উত্তর প্রশান্ত মহাসাগর',
  China: 'চীন', 'Coast of Australia': 'অস্ট্রেলিয়ার উপকূল', 'Coast of Canada': 'কানাডার উপকূল', 'Coast of Costa Rica': 'কোস্টা রিকার উপকূল',
  'Coast of Guinea': 'গিনির উপকূল', 'Coast of Indonesia': 'ইন্দোনেশিয়ার উপকূল', 'Coast of Madagascar': 'মাদাগাস্কারের উপকূল', 'Coast of Mexico': 'মেক্সিকোর উপকূল',
  'Coast of Mozambique': 'মোজাম্বিকের উপকূল', 'Coast of Russia': 'রাশিয়ার উপকূল', Congo: 'কঙ্গো', 'Coral Sea': 'প্রবাল সাগর', "Côte d'Ivoire": 'আইভরি কোস্ট',
  'DR Congo': 'ডিআর কঙ্গো', 'Eastern Equatorial Pacific': 'পূর্ব নিরক্ষীয় প্রশান্ত মহাসাগর', 'Eastern North Pacific': 'পূর্ব উত্তর প্রশান্ত মহাসাগর',
  'Eastern South Pacific': 'পূর্ব দক্ষিণ প্রশান্ত মহাসাগর', 'Equatorial Atlantic': 'নিরক্ষীয় আটলান্টিক', 'Equatorial Indian Ocean': 'নিরক্ষীয় ভারত মহাসাগর',
  'Equatorial Pacific near the Galápagos': 'গালাপাগোসের কাছে নিরক্ষীয় প্রশান্ত মহাসাগর', Ethiopia: 'ইথিওপিয়া', 'French Guiana': 'ফরাসি গায়ানা',
  Indonesia: 'ইন্দোনেশিয়া', Madagascar: 'মাদাগাস্কার', Mauritania: 'মৌরিতানিয়া', Mexico: 'মেক্সিকো', 'North Atlantic': 'উত্তর আটলান্টিক',
  'Papua New Guinea': 'পাপুয়া নিউ গিনি', Peru: 'পেরু', 'South Atlantic': 'দক্ষিণ আটলান্টিক', 'Southern Indian Ocean': 'দক্ষিণ ভারত মহাসাগর',
  'Southern Ocean': 'দক্ষিণ মহাসাগর', Tanzania: 'তানজানিয়া', 'Tasman Sea': 'তাসমান সাগর', Uganda: 'উগান্ডা', 'United States': 'যুক্তরাষ্ট্র',
  Vietnam: 'ভিয়েতনাম', 'Western North Pacific': 'পশ্চিম উত্তর প্রশান্ত মহাসাগর', 'Western South Pacific': 'পশ্চিম দক্ষিণ প্রশান্ত মহাসাগর',
  Zambia: 'জাম্বিয়া', eSwatini: 'এসওয়াতিনি', 'Bay of Bengal': 'বঙ্গোপসাগর',
};
export const placeLabel = (name: string | undefined, lang: 'en' | 'bn') => (name ? (lang === 'bn' ? BN[name] ?? name : name) : '');

// Bangla names for the countries people look for most, by ISO alpha-3. Any other country keeps its English name in বাংলা mode.
const COUNTRY_BN: Record<string, string> = {
  AFG: 'আফগানিস্তান', ARG: 'আর্জেন্টিনা', AUS: 'অস্ট্রেলিয়া', AUT: 'অস্ট্রিয়া', BGD: 'বাংলাদেশ', BEL: 'বেলজিয়াম', BTN: 'ভুটান', BOL: 'বলিভিয়া',
  BRA: 'ব্রাজিল', BGR: 'বুলগেরিয়া', MMR: 'মিয়ানমার', KHM: 'কম্বোডিয়া', CMR: 'ক্যামেরুন', CAN: 'কানাডা', TCD: 'চাদ', CHL: 'চিলি', CHN: 'চীন',
  COL: 'কলম্বিয়া', COD: 'ডিআর কঙ্গো', COG: 'কঙ্গো', CUB: 'কিউবা', CZE: 'চেকিয়া', DNK: 'ডেনমার্ক', EGY: 'মিশর', ETH: 'ইথিওপিয়া', FIN: 'ফিনল্যান্ড',
  FRA: 'ফ্রান্স', DEU: 'জার্মানি', GHA: 'ঘানা', GRC: 'গ্রিস', GRL: 'গ্রিনল্যান্ড', IND: 'ভারত', IDN: 'ইন্দোনেশিয়া', IRN: 'ইরান', IRQ: 'ইরাক',
  IRL: 'আয়ারল্যান্ড', ISR: 'ইসরায়েল', ITA: 'ইতালি', CIV: 'আইভরি কোস্ট', JPN: 'জাপান', JOR: 'জর্ডান', KAZ: 'কাজাখস্তান', KEN: 'কেনিয়া',
  PRK: 'উত্তর কোরিয়া', KOR: 'দক্ষিণ কোরিয়া', KWT: 'কুয়েত', LAO: 'লাওস', LBN: 'লেবানন', LBY: 'লিবিয়া', MDG: 'মাদাগাস্কার', MYS: 'মালয়েশিয়া',
  MLI: 'মালি', MRT: 'মৌরিতানিয়া', MEX: 'মেক্সিকো', MNG: 'মঙ্গোলিয়া', MAR: 'মরক্কো', MOZ: 'মোজাম্বিক', NPL: 'নেপাল', NLD: 'নেদারল্যান্ডস',
  NZL: 'নিউজিল্যান্ড', NGA: 'নাইজেরিয়া', NOR: 'নরওয়ে', OMN: 'ওমান', PAK: 'পাকিস্তান', PNG: 'পাপুয়া নিউ গিনি', PER: 'পেরু', PHL: 'ফিলিপাইন',
  POL: 'পোল্যান্ড', PRT: 'পর্তুগাল', QAT: 'কাতার', ROU: 'রোমানিয়া', RUS: 'রাশিয়া', SAU: 'সৌদি আরব', SEN: 'সেনেগাল', SGP: 'সিঙ্গাপুর',
  SOM: 'সোমালিয়া', ZAF: 'দক্ষিণ আফ্রিকা', ESP: 'স্পেন', LKA: 'শ্রীলঙ্কা', SDN: 'সুদান', SWE: 'সুইডেন', CHE: 'সুইজারল্যান্ড', SYR: 'সিরিয়া',
  TWN: 'তাইওয়ান', TZA: 'তানজানিয়া', THA: 'থাইল্যান্ড', TUN: 'তিউনিসিয়া', TUR: 'তুরস্ক', UGA: 'উগান্ডা', UKR: 'ইউক্রেন', ARE: 'সংযুক্ত আরব আমিরাত',
  GBR: 'যুক্তরাজ্য', USA: 'যুক্তরাষ্ট্র', VEN: 'ভেনেজুয়েলা', VNM: 'ভিয়েতনাম', YEM: 'ইয়েমেন', ZMB: 'জাম্বিয়া', ZWE: 'জিম্বাবুয়ে', MDV: 'মালদ্বীপ',
  ECU: 'ইকুয়েডর', ATA: 'অ্যান্টার্কটিকা', ISL: 'আইসল্যান্ড', DZA: 'আলজেরিয়া', AGO: 'অ্যাঙ্গোলা', FJI: 'ফিজি', HTI: 'হাইতি',
  PRY: 'প্যারাগুয়ে', URY: 'উরুগুয়ে', UZB: 'উজবেকিস্তান', TKM: 'তুর্কমেনিস্তান', TJK: 'তাজিকিস্তান', KGZ: 'কিরগিজস্তান', BRN: 'ব্রুনাই', TLS: 'পূর্ব তিমুর',
  AZE: 'আজারবাইজান', ARM: 'আর্মেনিয়া', GEO: 'জর্জিয়া', BLR: 'বেলারুশ', HUN: 'হাঙ্গেরি', SRB: 'সার্বিয়া', HRV: 'ক্রোয়েশিয়া', NIC: 'নিকারাগুয়া',
  GTM: 'গুয়াতেমালা', CRI: 'কোস্টা রিকা', PAN: 'পানামা', DOM: 'ডমিনিকান প্রজাতন্ত্র', JAM: 'জামাইকা', SLE: 'সিয়েরা লিওন', LBR: 'লাইবেরিয়া', GIN: 'গিনি',
  NER: 'নাইজার', BFA: 'বুরকিনা ফাসো', BEN: 'বেনিন', TGO: 'টোগো', GAB: 'গ্যাবন', NAM: 'নামিবিয়া', BWA: 'বতসোয়ানা', MWI: 'মালাউই', RWA: 'রুয়ান্ডা',
  BDI: 'বুরুন্ডি', ERI: 'ইরিত্রিয়া', DJI: 'জিবুতি', SSD: 'দক্ষিণ সুদান', SWZ: 'এসওয়াতিনি', LSO: 'লেসোথো', MUS: 'মরিশাস', BHR: 'বাহরাইন', PSE: 'ফিলিস্তিন',
};
/** Display name of a country (alpha-3 id, English fallback) in the chosen language. */
export const countryLabel = (id: string, name: string, lang: 'en' | 'bn') => (lang === 'bn' ? COUNTRY_BN[id] ?? name : name);
/** Every searchable name of a country, lower-cased: English plus Bangla when known. */
export const countryAliases = (id: string, name: string) => [name.toLowerCase(), id.toLowerCase(), ...(COUNTRY_BN[id] ? [COUNTRY_BN[id]] : [])];
