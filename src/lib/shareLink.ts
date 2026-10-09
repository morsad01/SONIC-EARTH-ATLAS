import { isAlpha3 } from '../countries/iso';

/** A small, versioned URL hash that restores a view: `#v1&track=frames&frame=eic-ghg&col=40&lang=bn`.
 *  New keys and track ids are only ever added, so older links keep decoding. */
export const TRACK_IDS = ['atlas', 'frames', 'monsoon', 'pulse', 'about', 'jukebox'] as const;
/** Story ids are checked for shape here and against the story list by the Jukebox; `t` is a year, month or day stamp. */
const STORY_RE = /^[a-z0-9-]{2,40}$/, TIME_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
export type ShareTrack = (typeof TRACK_IDS)[number];

export interface ShareState {
  track?: ShareTrack;
  frame?: string; // single-picture view
  pair?: string; // "then and now" preset, or "custom" with a + b
  a?: string;
  b?: string;
  col?: number; // needle column, 0..127
  lang?: 'en' | 'bn';
  c?: string; // selected country, ISO alpha-3
  story?: string; // Data Jukebox story id
  t?: string; // Data Jukebox timeline cursor: YYYY, YYYY-MM or YYYY-MM-DD
}

export interface ShareChoices { frames: string[]; pairs: string[] }

export function encodeShare(s: ShareState): string {
  const p = new URLSearchParams();
  if (s.track) p.set('track', s.track);
  if (s.pair) { p.set('pair', s.pair); if (s.a) p.set('a', s.a); if (s.b) p.set('b', s.b); }
  else if (s.frame) p.set('frame', s.frame);
  if (s.col !== undefined && s.col > 0) p.set('col', String(Math.round(s.col)));
  if (s.lang) p.set('lang', s.lang);
  if (s.c && isAlpha3(s.c)) p.set('c', s.c);
  if (s.story && STORY_RE.test(s.story)) p.set('story', s.story);
  if (s.t && TIME_RE.test(s.t)) p.set('t', s.t);
  return `v1&${p.toString()}`;
}

/** Reads a hash (with or without the leading #). Unknown versions, keys and ids are ignored, never trusted. */
export function decodeShare(hash: string, ok: ShareChoices): ShareState | null {
  const raw = hash.replace(/^#/, '');
  if (!raw.startsWith('v1&')) return null;
  const p = new URLSearchParams(raw.slice(3));
  const out: ShareState = {};
  const track = p.get('track');
  if (track && (TRACK_IDS as readonly string[]).includes(track)) out.track = track as ShareTrack;
  const frame = p.get('frame');
  if (frame && ok.frames.includes(frame)) out.frame = frame;
  const pair = p.get('pair');
  if (pair && ok.pairs.includes(pair)) {
    out.pair = pair;
    delete out.frame;
    const a = p.get('a'), b = p.get('b');
    if (pair === 'custom' && a && b && ok.frames.includes(a) && ok.frames.includes(b)) { out.a = a; out.b = b; }
    else if (pair === 'custom') delete out.pair;
  }
  const col = Number(p.get('col'));
  if (p.get('col') !== null && Number.isInteger(col) && col >= 0 && col <= 127) out.col = col;
  const lang = p.get('lang');
  if (lang === 'en' || lang === 'bn') out.lang = lang;
  const c = p.get('c');
  if (c && isAlpha3(c)) out.c = c;
  const story = p.get('story'), t = p.get('t');
  if (story && STORY_RE.test(story)) out.story = story;
  if (t && TIME_RE.test(t)) out.t = t;
  return Object.keys(out).length ? out : null;
}
