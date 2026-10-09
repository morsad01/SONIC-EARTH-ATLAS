import React from 'react';
import { AudioLines } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { REPO_URL, SOURCE_LINKS } from '../lib/nav';

export const Footer: React.FC<{ onAbout?: () => void }> = ({ onAbout }) => {
  const { t } = usePrefs();
  return (
    <footer className="glass rounded-none border-x-0 border-b-0 text-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 py-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="flex items-start gap-2 text-[var(--ink)] font-medium"><AudioLines className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent)]" />{t('footerSonification')}</p>
          <p className="mt-3 text-[var(--ink-2)] leading-relaxed max-w-[70ch]">{t('footerCredits')}</p>
          <p className="mt-3 text-[var(--ink-3)]">{t('footerNotNasa')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onAbout && <button className="btn" onClick={onAbout}>{t('navAbout')}</button>}
            <a className="btn btn-ghost" href={REPO_URL} target="_blank" rel="noreferrer">{t('footerRepo')}</a>
          </div>
        </div>
        <div>
          <h2 className="label uppercase tracking-wider">{t('footerSources')}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {SOURCE_LINKS.map((s) => <li key={s.url}><a className="link" href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
};
