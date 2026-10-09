import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/** Which player (if any) is making sound, so the header can show "Playing: …" and pause it. */
interface Active { id: string; label: string }
interface Ctx {
  active: Active | null;
  pause: () => void;
  report: (id: string, label: string | null, stop?: () => void) => void;
}

const PlaybackContext = createContext<Ctx | null>(null);

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState<Active | null>(null);
  const stops = useRef(new Map<string, () => void>());
  const last = useRef<string | null>(null);
  const report = useCallback((id: string, label: string | null, stop?: () => void) => {
    if (label && stop) { stops.current.set(id, stop); last.current = id; setActive({ id, label }); }
    else { stops.current.delete(id); if (last.current === id) last.current = null; setActive((a) => (a?.id === id ? null : a)); }
  }, []);
  // The player's own stop() flips its `playing` flag, which clears the entry through report().
  const pause = useCallback(() => { if (last.current) stops.current.get(last.current)?.(); }, []);
  const value = useMemo(() => ({ active, pause, report }), [active, pause, report]);
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
};

const NOOP: Ctx = { active: null, pause: () => {}, report: () => {} };
// eslint-disable-next-line react-refresh/only-export-components
export function usePlayback(): Ctx { return useContext(PlaybackContext) ?? NOOP; }

/** One line per player: `usePlaybackReport('monsoon', t('track3'), playing, stop)`. */
// eslint-disable-next-line react-refresh/only-export-components
export function usePlaybackReport(id: string, label: string, playing: boolean, stop: () => void) {
  const { report } = usePlayback();
  const stopRef = useRef(stop);
  useEffect(() => { stopRef.current = stop; });
  useEffect(() => {
    report(id, playing ? label : null, () => stopRef.current());
    return () => report(id, null);
  }, [id, label, playing, report]);
}
