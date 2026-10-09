import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { NORMALIZATION_SPECS } from '../sonification/normalizer';
import { usePrefs } from '../lib/prefs';

interface Props { open: boolean; onClose: () => void; onAbout?: () => void; sstGlobal?: { areaWeightedMeanAnomalyC: number; fractionWarmerThanNormal: number } }

const Row: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-4 py-2 border-t border-[var(--line)]"><dt className="label">{k}</dt><dd className="text-sm leading-relaxed">{children}</dd></div>
);

export const DataMethodDialog: React.FC<Props> = ({ open, onClose, onAbout, sstGlobal }) => {
  const { t } = usePrefs();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  const F = NORMALIZATION_SPECS;
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 grid place-items-center p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="data-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl max-h-[92dvh] overflow-y-auto panel-solid p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="data-title" className="font-display text-3xl font-extrabold">Data and method</h2>
            <p className="mt-2 text-[var(--ink-2)] max-w-[70ch]">Everything you hear comes from public NASA sources (plus the NOAA CO₂ and NSIDC sea-ice records that NASA itself uses on its Vital Signs pages). Raw extracts and the scripts that turn them into the app's files are in the repository (<code>scripts/raw/</code>, <code>scripts/build-snapshots.mjs</code>). No value was typed in by hand or smoothed.</p>
            {onAbout && <button className="btn mt-3" onClick={onAbout}>{t('readAbout')}</button>}
          </div>
          <button className="btn btn-ghost btn-icon shrink-0" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <section className="mt-6">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2"><span className="dot" style={{ background: 'var(--fire)' }} />Wildfires</h3>
          <dl className="mt-2">
            <Row k="Source">NASA FIRMS, VIIRS S-NPP 375 m near-real-time active fire detections (requires a free FIRMS map key; <code>npm run fetch:firms</code>).</Row>
            <Row k="Sampling">World, 2–7 Oct 2026. Detections grouped into 2° cells; the value is the maximum fire radiative power (MW) in the cell; the 80 strongest cells are kept. The Atlas plays 2–5 Oct, the days every daily layer shares.</Row>
            <Row k="To sound"><code>{F.fire.formulaString}</code>. Higher values give faster crackles (4–20 per second) and a brighter filter (800–3000 Hz).</Row>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2"><span className="dot" style={{ background: 'var(--rain)' }} />Rain</h3>
          <dl className="mt-2">
            <Row k="Source">NASA POWER Daily API v2.10, <code>PRECTOTCORR</code> (bias-corrected precipitation from MERRA-2), mm/day.</Row>
            <Row k="Sampling">A 10° global grid, 396 points from 50°S to 50°N, all fetched. The 48 points with the highest single-day rain during 2–5 Oct are kept, so this layer is a sample of wet places, not a full rain map. The Frame Jukebox shows the full GPM IMERG rain image.</Row>
            <Row k="To sound"><code>{F.precipitation.formulaString}</code>. Higher values give denser droplets (about 3–18 per second) at higher pitch (340–700 Hz).</Row>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2"><span className="dot" style={{ background: 'var(--warm)' }} />Ocean heat</h3>
          <dl className="mt-2">
            <Row k="Source">NASA JPL MUR sea surface temperature anomaly, monthly (ERDDAP dataset <code>jplMURSST41anommday</code>, NOAA CoastWatch), September 2026.</Row>
            <Row k="Sampling">1° grid, 32,095 valid ocean cells. Cells within 3° of land or ice and beyond 58° latitude are skipped. The 40 most anomalous cells are chosen with at least 12° between them, so both warm and cold extremes around the world are heard.{sstGlobal && <> Across all valid cells the area-weighted mean anomaly is +{sstGlobal.areaWeightedMeanAnomalyC.toFixed(2)} °C and {Math.round(sstGlobal.fractionWarmerThanNormal * 100)}% of the ocean was warmer than normal.</>}</Row>
            <Row k="To sound">A sustained drone at 110 Hz shifted by 4 semitones per 3 °C of anomaly; <code>{F.sst.formulaString}</code> sets brightness. Warm cells are pink, cold cells blue. Monthly product, so it does not change between days.</Row>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-xl font-semibold">Other tracks</h3>
          <dl className="mt-2">
            <Row k="NASA image frames">NASA GIBS (Worldview) WMS images requested live for the same week: VIIRS true colour, VIIRS thermal anomalies, GPM IMERG rain rate, MUR SST anomaly, OMI NO₂, MODIS aerosol, MODIS NDVI, VIIRS night lights. The needle reads pixel brightness and colour, so this track sonifies the picture, not calibrated values.</Row>
            <Row k="Bangladesh">NASA POWER daily <code>PRECTOTCORR</code> for 8 divisional cities, 1 Jun–5 Oct 2026 and the same days of 2025, compared with POWER's 2001–2020 monthly climatology. Model-based estimates for roughly 50 km cells, not rain-gauge readings.</Row>
            <Row k="Vital signs">NASA GISS GISTEMP v4 global annual anomaly (1880–2025, vs 1951–1980); NOAA GML Mauna Loa annual CO₂ (1959–2025), the record on NASA's Vital Signs page; NSIDC Sea Ice Index v4.0 Arctic September extent (1979–2026; 2025–26 near-real-time). Raw files in <code>scripts/raw/</code>. "Your data" plays any two-column CSV locally in the browser.</Row>
            <Row k="Any place">Clicking the globe asks the NASA POWER monthly API live for that point (T2M and PRECTOTCORR, 1981–2025) and plays one note per year. The trend is a least-squares slope. Values are model-based for a roughly 50 km cell.</Row>
          </dl>
        </section>

        <section className="mt-6">
          <h3 className="font-display text-xl font-semibold">Where on Earth, and what the stereo means</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)] max-w-[75ch]">Pan = longitude ÷ 180, so 180°W is hard left and 180°E hard right. In 3D (HRTF) mode latitude also lifts the sound up or down. Place names come from Natural Earth country shapes; ocean cells get the name of their basin. A 12-voice limit keeps the mix clear: the strongest values in the enabled layers are the ones you hear.</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-3)] max-w-[75ch]">This is an independent Space Apps entry, not an official NASA product. Imagery and data courtesy of NASA ESDIS, FIRMS, LaRC POWER, JPL PO.DAAC (via NOAA CoastWatch ERDDAP), GISS and GIBS. Globe texture: three.js example maps.</p>
        </section>
      </div>
    </div>
  );
};
