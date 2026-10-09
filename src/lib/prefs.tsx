import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS, type Lang, type StringKey } from './strings';

export interface Prefs {
  lang: Lang;
  reduceMotion: boolean;
  highContrast: boolean;
  narration: boolean;
  calmBackground: boolean; // pauses non-essential motion (starfield, idle globe spin, clouds) without changing the rest
}

const DEFAULTS: Prefs = { lang: 'en', reduceMotion: false, highContrast: false, narration: false, calmBackground: false };
const KEY = 'sea-prefs-v1';

function load(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    const osReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    return { ...DEFAULTS, reduceMotion: osReduce, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULTS;
  }
}

interface Ctx extends Prefs {
  set: (p: Partial<Prefs>) => void;
  t: (k: StringKey, vars?: Record<string, string | number>) => string;
}

const PrefsContext = createContext<Ctx | null>(null);

export const PrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<Prefs>(load);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
    const root = document.documentElement;
    root.lang = prefs.lang;
    root.classList.toggle('rm', prefs.reduceMotion);
    root.classList.toggle('hc', prefs.highContrast);
    root.classList.toggle('calm', prefs.calmBackground);
  }, [prefs]);

  const value = useMemo<Ctx>(() => ({
    ...prefs,
    set: (p) => setPrefs((old) => ({ ...old, ...p })),
    t: (k, vars) => {
      let s: string = STRINGS[prefs.lang][k] ?? STRINGS.en[k] ?? k;
      if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, String(b));
      return s;
    },
  }), [prefs]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function usePrefs(): Ctx {
  const c = useContext(PrefsContext);
  if (!c) throw new Error('usePrefs outside PrefsProvider');
  return c;
}

/** Speak a short line with the browser's speech engine, if narration is on and a voice exists. */
// eslint-disable-next-line react-refresh/only-export-components
export function speak(text: string, lang: Lang) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const want = lang === 'bn' ? 'bn' : 'en';
    const v = window.speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith(want));
    if (v) u.voice = v;
    u.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    u.rate = 1.02;
    window.speechSynthesis.speak(u);
  } catch { /* speech unavailable */ }
}
