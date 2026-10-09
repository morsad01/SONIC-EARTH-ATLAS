import { AudioContextManager } from '../audio/audioContext';
import { melodyHz, toMelody } from './worlds';

const NOTE = 0.2; // seconds per value

/** Plays a short melody made from `values` (the same numbers drawn on the card): higher value, higher pitch. Returns a stop function; `onEnd` fires when it finishes or is stopped. */
export async function playPreview(values: readonly number[], onEnd: () => void): Promise<() => void> {
  const notes = toMelody(values);
  if (!notes.length) { onEnd(); return () => {}; }
  const ctx = await AudioContextManager.init(), out = AudioContextManager.getMasterNode() ?? ctx.destination;
  const t0 = ctx.currentTime + 0.05, nodes: OscillatorNode[] = [];
  notes.forEach((v, k) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), at = t0 + k * NOTE;
    o.type = 'sine'; o.frequency.setValueAtTime(melodyHz(v), at);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.22, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + NOTE * 0.95);
    o.connect(g).connect(out); o.start(at); o.stop(at + NOTE);
    nodes.push(o);
  });
  let done = false;
  const finish = () => { if (!done) { done = true; onEnd(); } };
  nodes[nodes.length - 1].onended = finish;
  return () => { nodes.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } }); finish(); };
}
