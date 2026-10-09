/** "Fri 2 Oct" / বাংলা day labels for the Atlas timeline. */
const BN = '০১২৩৪৫৬৭৮৯';
const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

export function formatDay(iso: string, lang: 'en' | 'bn', long = false) {
  const d = new Date(iso + 'T12:00:00Z');
  if (isNaN(d.getTime())) return iso;
  if (lang === 'bn') return `${DAYS_BN[d.getUTCDay()]} ${String(d.getUTCDate()).replace(/\d/g, (x) => BN[+x])} ${MONTHS_BN[d.getUTCMonth()]}`;
  return d.toLocaleDateString('en-GB', { weekday: long ? 'long' : 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}
