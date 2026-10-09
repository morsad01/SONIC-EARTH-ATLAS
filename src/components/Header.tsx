import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Settings, Database, Compass, Menu, X, Pause, Play } from 'lucide-react';
import { usePrefs } from '../lib/prefs';
import { usePlayback } from '../lib/playbackContext';
import { JUKEBOX_TRACKS, sectionOf, type Section, type Track } from '../lib/nav';
import type { StringKey } from '../lib/strings';

/** Collections row: the Jukebox's own stories view, then A2/B1/B2. */
const COLLECTIONS: { id: Track; key: StringKey; code: string }[] = [{ id: 'jukebox', key: 'jbStoriesNav', code: '♪' }, ...JUKEBOX_TRACKS];

interface Props {
  track: Track;
  onLanding: boolean;
  onTrack: (t: Track) => void;
  lastJukebox: Track;
  audioReady: boolean;
  onToggleAudio: () => void;
  onHome: () => void;
  onListen: () => void;
  onTour: () => void;
  onData: () => void;
  onSettings: () => void;
  settingsOpen?: boolean;
}

export const Header: React.FC<Props> = ({ track, onLanding, onTrack, lastJukebox, audioReady, onToggleAudio, onHome, onListen, onTour, onData, onSettings, settingsOpen }) => {
  const { t } = usePrefs();
  const { active, pause } = usePlayback();
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const section = onLanding ? null : sectionOf(track);
  const headerRef = useRef<HTMLElement>(null);
  const viewKey = `${track}|${onLanding}`;
  const [scrollState, setScrollState] = useState({ key: '', on: false }); // valid for one view only: a new view starts at the top
  const scrolled = scrollState.key === viewKey && scrollState.on;

  // The header is fixed and content scrolls under it. Publish its real height (the Jukebox adds a second row) as --header-h.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(set) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  // Denser glass once a page-sized scroller has moved (scroll events don't bubble, so listen in the capture phase).
  useEffect(() => {
    const on = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el?.nodeType === 1 && el.clientHeight > window.innerHeight * 0.5) setScrollState({ key: viewKey, on: el.scrollTop > 8 });
    };
    document.addEventListener('scroll', on, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', on, { capture: true });
  }, [viewKey]);

  const sections: { id: Section; label: string; go: Track }[] = [
    { id: 'explore', label: t('navExplore'), go: 'atlas' },
    { id: 'jukebox', label: t('navJukebox'), go: lastJukebox },
    { id: 'about', label: t('navAbout'), go: 'about' },
  ];
  const go = (tr: Track) => { setMenu(false); onTrack(tr); };

  // Mobile menu: focus the first item, trap Tab inside, Esc closes and returns focus to the button.
  useEffect(() => {
    if (!menu) return;
    const panel = menuPanel.current;
    const items = () => Array.from(panel?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setMenu(false); menuBtn.current?.focus(); return; }
      if (e.key !== 'Tab') return;
      const list = items(), first = list[0], last = list[list.length - 1];
      if (!first) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <header ref={headerRef} data-scrolled={scrolled ? 'true' : 'false'} className="site-header z-40">
      <div className="flex items-center gap-2 px-3 sm:px-4 h-[var(--header-row)]">
        <button ref={menuBtn} className="btn btn-ghost btn-icon lg:hidden" aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu(!menu)} aria-label={t('menu')}>
          {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <button onClick={onHome} className="flex items-center gap-2 cursor-pointer shrink-0" aria-label={`${t('appName')}, ${t('home')}`}>
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="12.5" fill="none" stroke="var(--brass)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="8" fill="none" stroke="var(--brass)" strokeOpacity=".55" />
            <circle cx="14" cy="14" r="3.2" fill="var(--brass)" />
          </svg>
          <span className="font-display font-bold text-lg hidden sm:inline whitespace-nowrap">{t('appName')}</span>
        </button>

        <nav className="hidden lg:flex items-center gap-1 ml-4" aria-label={t('mainNav')}>
          {sections.map((s) => (
            <button key={s.id} className="nav-link" onClick={() => go(s.go)} aria-current={section === s.id ? 'page' : undefined}>{s.label}</button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 min-w-0">
          {active && (
            <button className="chip max-w-[11rem] sm:max-w-[16rem] min-h-[36px] cursor-pointer border-[var(--brass)] text-[var(--ink)]" onClick={pause} aria-label={t('pausePlayback', { label: active.label })}>
              <Pause className="w-3.5 h-3.5 shrink-0 text-[var(--brass)]" />
              <span className="truncate">{t('playingNow', { label: active.label })}</span>
            </button>
          )}
          {!active && <button className="btn btn-brass hidden md:inline-flex" onClick={onListen}><Play className="w-4 h-4" />{t('listenNow')}</button>}
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onTour} aria-label={t('tour')}><Compass className="w-4 h-4" /><span className="hidden 2xl:inline">{t('tour')}</span></button>
          <button className="btn btn-ghost btn-icon" onClick={() => { setMenu(false); onData(); }} aria-haspopup="dialog" aria-label={t('data')} title={t('data')}><Database className="w-4 h-4" /></button>
          <button className="btn btn-ghost btn-icon" onClick={() => { setMenu(false); onSettings(); }} aria-haspopup="dialog" aria-expanded={!!settingsOpen} aria-label={t('settings')}><Settings className="w-4.5 h-4.5" /></button>
          <button className="btn" onClick={onToggleAudio} aria-pressed={audioReady} title={`${audioReady ? t('soundOn') : t('soundOff')} (S)`} aria-label={audioReady ? t('soundOn') : t('soundOff')}>
            {audioReady ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xl:inline">{audioReady ? t('soundOn') : t('soundOff')}</span>
          </button>
        </div>
      </div>

      {/* Jukebox collections: a second row only inside the Data Jukebox */}
      {section === 'jukebox' && (
        <nav className="flex gap-1 px-2 sm:px-4 pb-2 pe-7 overflow-x-auto scroll-snap-x fade-x" aria-label={t('collections')}>
          {COLLECTIONS.map((tr) => (
            <button key={tr.id} onClick={() => go(tr.id)} aria-current={track === tr.id ? 'page' : undefined} className="nav-link shrink-0">
              <span className="tnum text-2xs font-semibold">{tr.code}</span>{t(tr.key)}
            </button>
          ))}
        </nav>
      )}

      {menu && (
        <div ref={menuPanel} id="site-menu" className="lg:hidden absolute left-0 right-0 top-full glass-pop rounded-none p-3 max-h-[calc(100dvh-var(--header-h))] overflow-y-auto">
          <nav aria-label={t('mainNav')}>
            <ul className="flex flex-col gap-1">
              <li><button className="nav-link w-full min-h-[44px]" onClick={() => go('atlas')} aria-current={section === 'explore' ? 'page' : undefined}>{t('navExplore')}</button></li>
              <li>
                <button className="nav-link w-full min-h-[44px]" onClick={() => go(lastJukebox)} aria-current={section === 'jukebox' ? 'page' : undefined}>{t('navJukebox')}</button>
                <ul className="ml-4 mt-1 flex flex-col gap-1 border-l border-[var(--line)] pl-2" aria-label={t('collections')}>
                  {COLLECTIONS.map((tr) => (
                    <li key={tr.id}><button className="nav-link w-full min-h-[44px]" onClick={() => go(tr.id)} aria-current={track === tr.id && !onLanding ? 'page' : undefined}><span className="tnum text-2xs font-semibold">{tr.code}</span>{t(tr.key)}</button></li>
                  ))}
                </ul>
              </li>
              <li><button className="nav-link w-full min-h-[44px]" onClick={() => go('about')} aria-current={section === 'about' ? 'page' : undefined}>{t('navAbout')}</button></li>
            </ul>
          </nav>
          <div className="mt-3 pt-3 border-t border-[var(--line)] flex flex-wrap gap-2">
            <button className="btn btn-brass" onClick={() => { setMenu(false); onListen(); }}><Play className="w-4 h-4" />{t('listenNow')}</button>
            <button className="btn" onClick={() => { setMenu(false); onTour(); }}><Compass className="w-4 h-4" />{t('tour')}</button>
            <button className="btn" onClick={() => { setMenu(false); onData(); }}><Database className="w-4 h-4" />{t('data')}</button>
          </div>
        </div>
      )}
    </header>
  );
};
