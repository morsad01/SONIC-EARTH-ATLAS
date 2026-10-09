import type { PlayerState } from './playbackState';

/** Module-wide counter of audio nodes held by series players, read by Diagnostics. Kept apart so the main chunk does not pull the player in. */
export const seriesStats = { nodes: 0, state: 'idle' as PlayerState };
export const seriesDiagnostics = () => ({ nodes: seriesStats.nodes, state: seriesStats.state });
