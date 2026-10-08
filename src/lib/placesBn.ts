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
