import { useEffect, useState } from 'react';
import type { findCountrySync } from './countries';

/** d3-geo's geoContains, loaded on first use (keeps d3-geo out of the first paint). */
export function useGeoContains() {
  const [fn, setFn] = useState<Parameters<typeof findCountrySync>[0] | null>(null);
  useEffect(() => { let on = true; import('d3-geo').then((m) => on && setFn(() => m.geoContains as never)); return () => { on = false; }; }, []);
  return fn;
}
