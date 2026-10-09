import type { DataSeries } from '../../datasets/series';

export type ProvenanceBadge = 'snapshot' | 'live' | 'context' | 'sample';

/** Which badge a series earns. A snapshot never shows "Live", and a sample is always called one. */
export function badgeOf(s: Pick<DataSeries, 'isLive' | 'isSample' | 'coverage'>): ProvenanceBadge {
  return s.isSample ? 'sample' : s.coverage === 'global-context' ? 'context' : s.isLive ? 'live' : 'snapshot';
}
