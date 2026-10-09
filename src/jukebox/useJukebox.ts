import { useReducer } from 'react';
import { remapStoryId, type StoryFilters } from '../stories/stories';

/**
 * One reducer owns the Jukebox (roadmap R4): the story, the timeline cursor, filters and step-through.
 * Every cursor change carries its origin. The timeline only scrolls itself for non-scroll origins, a scroll never
 * overrides playback, and a cursor set to its current value returns the same state, so views cannot feed back into each other.
 */
export type Origin = 'user' | 'scroll' | 'playback' | 'load';
export interface Filters extends StoryFilters { from: string | null; to: string | null } // years, inclusive
export interface JukeboxState {
  storyId: string | null;
  stories: string[]; // ids currently available (country-dependent)
  times: string[]; // timestamps of the loaded series for storyId (empty while loading or for a picture)
  cursor: string | null;
  origin: Origin;
  seq: number; // bumps on every cursor move, so views can react to "same value, new request"
  filters: Filters;
  playing: boolean;
}
export type Action =
  | { type: 'setStories'; ids: string[] }
  | { type: 'selectStory'; id: string }
  | { type: 'seriesLoaded'; storyId: string; times: string[] }
  | { type: 'setCursor'; t: string; origin: Origin }
  | { type: 'step'; by: 1 | -1; origin: Origin }
  | { type: 'setFilter'; patch: Partial<Filters> }
  | { type: 'resetFilters' }
  | { type: 'setPlaying'; playing: boolean };

export const DEFAULT_FILTERS: Filters = { topic: 'all', source: 'all', region: 'all', from: null, to: null };
export const initialState = (storyId: string | null = null, cursor: string | null = null): JukeboxState =>
  ({ storyId, stories: [], times: [], cursor, origin: 'load', seq: 0, filters: DEFAULT_FILTERS, playing: false });

const year = (t: string) => t.slice(0, 4);
export const visibleTimes = (s: Pick<JukeboxState, 'times' | 'filters'>) =>
  s.times.filter((t) => (!s.filters.from || year(t) >= s.filters.from) && (!s.filters.to || year(t) <= s.filters.to));

/** The time itself, or the first one at or after it (works across granularities: "1998" → "1998-01"), or the last one. */
export function nearestTime(times: string[], t: string | null): string | null {
  if (!times.length) return null;
  if (t === null) return times[times.length - 1];
  return times.includes(t) ? t : times.find((x) => x >= t) ?? times[times.length - 1];
}

const moveTo = (s: JukeboxState, t: string | null, origin: Origin): JukeboxState => (t === s.cursor ? s : { ...s, cursor: t, origin, seq: s.seq + 1 });

export function jukeboxReducer(s: JukeboxState, a: Action): JukeboxState {
  switch (a.type) {
    case 'setStories': {
      if (s.stories.length === a.ids.length && s.stories.every((x, i) => x === a.ids[i])) return s;
      const next = { ...s, stories: a.ids };
      if (s.storyId && a.ids.includes(s.storyId)) return next;
      // Country changed: keep the same kind of story and the cursor; seriesLoaded snaps the cursor to the new series.
      const mapped = s.storyId ? remapStoryId(s.storyId, a.ids) : null;
      if (mapped) return { ...next, storyId: mapped, times: [], playing: false };
      return { ...next, storyId: a.ids[0] ?? null, times: [], cursor: null, playing: false, filters: { ...s.filters, from: null, to: null } };
    }
    case 'selectStory':
      if (a.id === s.storyId || !s.stories.includes(a.id)) return s;
      return { ...s, storyId: a.id, times: [], cursor: null, playing: false, filters: { ...s.filters, from: null, to: null } };
    case 'seriesLoaded': {
      if (a.storyId !== s.storyId) return s; // a late answer for a story that is no longer shown
      const ys = new Set(a.times.map(year));
      const filters = { ...s.filters, from: s.filters.from && ys.has(s.filters.from) ? s.filters.from : null, to: s.filters.to && ys.has(s.filters.to) ? s.filters.to : null };
      const next = { ...s, times: a.times, filters };
      return moveTo(next, nearestTime(visibleTimes(next), s.cursor), 'load');
    }
    case 'setCursor': {
      if (a.origin === 'scroll' && s.playing) return s; // playback owns the cursor while it runs
      if (!visibleTimes(s).includes(a.t)) return s;
      return moveTo(s, a.t, a.origin);
    }
    case 'step': {
      const v = visibleTimes(s), i = s.cursor ? v.indexOf(s.cursor) : -1, j = Math.min(v.length - 1, Math.max(0, i + a.by));
      if (!v.length) return s;
      if (j === i) return a.origin === 'playback' && s.playing ? { ...s, playing: false } : s; // the end stops step-through
      return moveTo(s, v[j], a.origin);
    }
    case 'setFilter': {
      let f = { ...s.filters, ...a.patch };
      if (f.from && f.to && f.from > f.to) f = { ...f, from: f.to, to: f.from };
      const next = { ...s, filters: f };
      if (!('from' in a.patch) && !('to' in a.patch)) return next;
      const v = visibleTimes(next);
      return moveTo(next, s.cursor && v.includes(s.cursor) ? s.cursor : nearestTime(v, s.cursor), 'user');
    }
    case 'resetFilters':
      return { ...s, filters: DEFAULT_FILTERS };
    case 'setPlaying': {
      const v = visibleTimes(s);
      if (a.playing === s.playing || (a.playing && v.length < 2)) return s;
      // Starting from the last item replays from the first.
      return a.playing && s.cursor === v[v.length - 1] ? { ...moveTo(s, v[0], 'playback'), playing: true } : { ...s, playing: a.playing };
    }
  }
}

export function useJukebox(initialStory: string | null = null, initialCursor: string | null = null) {
  return useReducer(jukeboxReducer, null, () => initialState(initialStory, initialCursor));
}
