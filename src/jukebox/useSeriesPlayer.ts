import { useEffect, useState } from 'react';
import { AudioContextManager } from '../audio/audioContext';
import { SeriesPlayer } from '../sonification/series/SeriesPlayer';
import type { PlayerState } from '../sonification/series/playbackState';

/** One series player per Jukebox, on the shared context and limiter. Disposed (every node disconnected) on unmount. */
export function useSeriesPlayer() {
  const [player] = useState(() => new SeriesPlayer({ context: () => AudioContextManager.getContext(), destination: () => AudioContextManager.getMasterNode() }));
  const [state, setState] = useState<PlayerState>(player.state);
  useEffect(() => {
    const off = player.listen({ state: setState });
    return () => { off(); player.dispose(); };
  }, [player]);
  return [player, state] as const;
}
