import type { StringKey, Lang } from '../lib/strings';
import { countryLabel } from '../lib/placesBn';
import type { RegionKind, Story, Topic } from './stories';

/** String keys and labels shared by the story row, filters and carousel. */
export const topicKey = (tp: Topic) => `topic_${tp}` as StringKey;
export const regionKey = (r: RegionKind) => `region_${r}` as StringKey;
export const regionLabel = (s: Story, lang: Lang, t: (k: StringKey) => string) =>
  s.region === 'country' && s.country ? countryLabel(s.country, s.countryName ?? s.country, lang) : t(regionKey(s.region));
