import { useCallback, useEffect, useMemo, useState } from 'react';
import { countryById, loadCountries, representativePoint, type Country } from './countries';

/** Selected-country state. `initial` is the alpha-3 from the share hash (`c=BGD`); the list loads lazily and the id is dropped if it is not in it. */
export function useCountry(initial?: string) {
  const [list, setList] = useState<Country[]>([]);
  const [id, setId] = useState<string | null>(initial ?? null);
  const [pt, setPt] = useState<{ id: string; lat: number; lon: number } | null>(null);
  useEffect(() => { let on = true; loadCountries('110m').then((l) => on && setList(l)); return () => { on = false; }; }, []);
  const country = useMemo(() => countryById(list, id), [list, id]);
  useEffect(() => {
    if (!country) return;
    let on = true;
    representativePoint(country).then((p) => on && setPt({ id: country.id, ...p }));
    return () => { on = false; };
  }, [country]);
  const select = useCallback((c: Country | null) => setId(c ? c.id : null), []);
  const point = country && pt?.id === country.id ? { lat: pt.lat, lon: pt.lon } : null;
  return { list, country, point, select, id };
}
