/**
 * Player state machine (roadmap Phase 5): idle → loading → ready → playing ⇄ paused → ended, plus error.
 * Pure. An event that is not valid in the current state is a no-op (same state back).
 */
export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
export type PlayerEvent = 'load' | 'loaded' | 'fail' | 'play' | 'pause' | 'resume' | 'stop' | 'end' | 'reset';

export const TRANSITIONS: Record<PlayerState, Partial<Record<PlayerEvent, PlayerState>>> = {
  idle: { load: 'loading', fail: 'error' },
  loading: { loaded: 'ready', fail: 'error', load: 'loading' },
  ready: { play: 'playing', load: 'loading', fail: 'error' },
  playing: { pause: 'paused', stop: 'ready', end: 'ended', fail: 'error', load: 'loading' },
  paused: { resume: 'playing', play: 'playing', stop: 'ready', load: 'loading', fail: 'error' },
  ended: { play: 'playing', stop: 'ready', load: 'loading', fail: 'error' },
  error: { load: 'loading', play: 'playing' },
};

export function transition(s: PlayerState, e: PlayerEvent): PlayerState {
  return e === 'reset' ? 'idle' : TRANSITIONS[s][e] ?? s;
}

/** A small holder with an event log, used by the player and by tests. */
export function createMachine(onChange?: (s: PlayerState, prev: PlayerState) => void) {
  let state: PlayerState = 'idle';
  const log: { event: PlayerEvent; from: PlayerState; to: PlayerState }[] = [];
  return {
    get state() { return state; },
    log,
    send(e: PlayerEvent): boolean {
      const to = transition(state, e), from = state;
      log.push({ event: e, from, to });
      if (log.length > 200) log.shift();
      if (to === from) return e === 'load' && from === 'loading';
      state = to;
      onChange?.(to, from);
      return true;
    },
  };
}
