import { countryAliases } from '../lib/placesBn';
import type { Country } from './countries';

/** Matches by prefix first, then by substring, over English + Bangla names and the ISO code. */
export function searchCountries(list: Country[], q: string): Country[] {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  const starts: Country[] = [], has: Country[] = [];
  for (const c of list) {
    const a = countryAliases(c.id, c.name);
    if (a.some((n) => n.startsWith(s) || n.split(/[\s-]+/).some((w) => w.startsWith(s)))) starts.push(c);
    else if (a.some((n) => n.includes(s))) has.push(c);
  }
  return [...starts, ...has];
}
