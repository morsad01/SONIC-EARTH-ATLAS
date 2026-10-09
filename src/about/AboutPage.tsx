import React from 'react';
import { DATASET_CATALOG } from '../datasets/datasetMetadata';
import { usePrefs } from '../lib/prefs';
import type { StringKey } from '../lib/strings';
import type { PhenomenonType } from '../types/dataset';
import { Footer } from '../components/Footer';
import { REPO_URL } from '../lib/nav';

const LAYERS: { id: PhenomenonType; name: StringKey; color: string }[] = [
  { id: 'fire', name: 'fire', color: 'var(--fire)' },
  { id: 'precipitation', name: 'rain', color: 'var(--rain)' },
  { id: 'sst', name: 'ocean', color: 'var(--warm)' },
];
const SOURCES: { name: string; url: string; what: StringKey }[] = [
  { name: 'NASA FIRMS (VIIRS S-NPP)', url: 'https://firms.modaps.eosdis.nasa.gov/', what: 'srcFirms' },
  { name: 'NASA POWER (LaRC)', url: 'https://power.larc.nasa.gov/', what: 'srcPower' },
  { name: 'NASA JPL MUR SST via NOAA CoastWatch ERDDAP', url: 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41anommday.html', what: 'srcMur' },
  { name: 'NASA GISS GISTEMP v4', url: 'https://data.giss.nasa.gov/gistemp/', what: 'srcGistemp' },
  { name: 'NOAA GML Mauna Loa CO₂', url: 'https://gml.noaa.gov/ccgg/trends/', what: 'srcGml' },
  { name: 'NSIDC Sea Ice Index v4', url: 'https://nsidc.org/data/g02135', what: 'srcNsidc' },
  { name: 'NASA GIBS (Worldview)', url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api', what: 'srcGibs' },
  { name: 'Earth Information Center', url: 'https://earth.gov/', what: 'srcEic' },
];

const H2: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="font-display text-2xl font-bold mt-12 mb-3 scroll-mt-4">{children}</h2>
);

/** "About the Science": method, mapping tables (from DATASET_CATALOG), sources, limits, a11y and credits. */
export const AboutPage: React.FC<{ onOpenMethod: () => void }> = ({ onOpenMethod }) => {
  const { t } = usePrefs();
  return (
    <div className="h-full overflow-y-auto">
      <article className="prose-sea max-w-5xl mx-auto px-5 sm:px-10 py-10" aria-labelledby="about-title">
        <h1 id="about-title" className="font-display font-extrabold text-[clamp(2rem,6vw,3.5rem)] leading-tight">{t('aboutTitle')}</h1>
        <p className="mt-3 text-lg">{t('aboutLead')}</p>

        <section aria-labelledby="a-how">
          <H2 id="a-how">{t('aboutHowTitle')}</H2>
          <p>{t('aboutHowP1')}</p>
          <p className="mt-3">{t('aboutHowP2')}</p>
          <ol className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {([['how1', 'how1d'], ['how2', 'how2d'], ['how3', 'how3d'], ['how4', 'how4d']] as const).map(([h, d], k) => (
              <li key={h} className="border-t-2 border-[var(--brass)] pt-2">
                <div className="font-semibold"><span className="tnum text-[var(--brass)] mr-1.5">{k + 1}</span>{t(h)}</div>
                <p className="mt-1 leading-snug">{t(d)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="a-map">
          <H2 id="a-map">{t('aboutMappingTitle')}</H2>
          <p>{t('aboutMappingLead')}</p>
          <div className="mt-4 overflow-x-auto panel-solid">
            <table className="w-full min-w-[720px] text-sm text-left align-top">
              <thead className="text-[var(--ink-3)]">
                <tr>{(['colLayer', 'colVariable', 'colResolution', 'colToNumber', 'colToSound'] as const).map((c) => <th key={c} scope="col" className="font-medium p-3 border-b border-[var(--line)]">{t(c)}</th>)}</tr>
              </thead>
              <tbody>
                {LAYERS.map((l) => {
                  const m = DATASET_CATALOG[l.id];
                  return (
                    <tr key={l.id} className="border-b border-[var(--line)] last:border-0 align-top">
                      <th scope="row" className="p-3 font-semibold whitespace-nowrap"><span className="dot mr-2" style={{ background: l.color }} aria-hidden="true" />{t(l.name)}</th>
                      <td className="p-3">{m.variableName}, {m.unit}<div className="label mt-1"><a className="link" href={m.sourceUrl} target="_blank" rel="noreferrer">{m.provider}</a></div></td>
                      <td className="p-3">{m.spatialResolution}<div className="label mt-1">{m.temporalResolution}</div></td>
                      <td className="p-3"><code className="text-xs break-words">{m.normalizationFormula}</code></td>
                      <td className="p-3 text-[var(--ink-2)]">{m.audioFormula}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <h3 className="font-display text-lg font-semibold mt-6">{t('aboutTracksTitle')}</h3>
          <dl className="mt-2 grid gap-3 text-sm">
            {([['A2', 'track2', 'aboutTrackFrames'], ['B1', 'track3', 'aboutTrackMonsoon'], ['B2', 'track4', 'aboutTrackPulse']] as const).map(([code, name, rule]) => (
              <div key={code} className="grid sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 py-2 border-t border-[var(--line)]">
                <dt className="font-semibold"><span className="tnum text-[var(--brass)] mr-1.5">{code}</span>{t(name)}</dt>
                <dd className="text-[var(--ink-2)] leading-relaxed">{t(rule)}</dd>
              </div>
            ))}
          </dl>
          <button className="mt-4 btn" onClick={onOpenMethod}>{t('fullMethod')}</button>
        </section>

        <section aria-labelledby="a-src">
          <H2 id="a-src">{t('aboutSourcesTitle')}</H2>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm">
            {SOURCES.map((s) => (
              <li key={s.name} className="panel-solid p-3">
                <a className="link font-medium" href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
                <p className="mt-1 text-[var(--ink-2)]">{t(s.what)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="a-lim">
          <H2 id="a-lim">{t('aboutLimitsTitle')}</H2>
          <ul className="grid gap-2 list-disc pl-5 text-[var(--ink-2)] max-w-[75ch]">
            {(['limit1', 'limit2', 'limit3', 'limit4', 'limit5', 'limit6'] as const).map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </section>

        <section aria-labelledby="a-a11y">
          <H2 id="a-a11y">{t('aboutA11yTitle')}</H2>
          <ul className="grid gap-2 list-disc pl-5 text-[var(--ink-2)] max-w-[75ch]">
            {(['a11y1', 'a11y2', 'a11y3', 'a11y4'] as const).map((k) => <li key={k}>{t(k)}</li>)}
          </ul>
        </section>

        <section aria-labelledby="a-cred">
          <H2 id="a-cred">{t('aboutCreditsTitle')}</H2>
          <p>{t('aboutCredits')}</p>
          <p className="mt-3">{t('footerNotNasa')} <a className="link" href={REPO_URL} target="_blank" rel="noreferrer">{t('footerRepo')}</a></p>
        </section>
      </article>
      <Footer />
    </div>
  );
};
