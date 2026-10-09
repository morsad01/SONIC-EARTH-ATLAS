import type { Lang } from '../lib/strings';

/** Number and date labels for the Jukebox in English or বাংলা digits. */
const BN = '০১২৩৪৫৬৭৮৯';
const MON = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], bn: ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'] };
export const digits = (s: string | number, lang: Lang) => (lang === 'bn' ? String(s).replace(/\d/g, (d) => BN[+d]) : String(s));

/** "1998", "Mar 1998", "2 Oct 2026". */
export function timeLabel(t: string, lang: Lang): string {
  const [y, m, d] = t.split('-');
  const s = !m ? y : !d ? `${MON[lang][+m - 1]} ${y}` : `${+d} ${MON[lang][+m - 1]} ${y}`;
  return digits(s, lang);
}

/** Up to 2 decimals, fewer for big numbers; "no data" is left to the caller. */
export function valueLabel(v: number, unit: string, lang: Lang): string {
  const s = Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
  return `${digits(s, lang)} ${unit}`;
}
