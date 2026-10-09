// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { dataFile } from './fixtures';
import { PrefsProvider } from '../lib/prefs';
import { JukeboxView } from '../jukebox/JukeboxView';
import { Transport } from '../jukebox/PlayerControls';
import { clearStoryCache } from '../stories/loadStory';
import { AudioContextManager } from '../audio/audioContext';
import { seriesDiagnostics } from '../sonification/series/SeriesPlayer';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); clearStoryCache(); window.history.replaceState(null, '', '/'); });
const stubFiles = () => vi.stubGlobal('fetch', async (u: string) => ({ ok: true, status: 200, json: async () => dataFile(u) }));
const wrap = (ui: React.ReactNode) => render(<PrefsProvider>{ui}</PrefsProvider>);
const countries = { list: [], country: null, point: null, onSelect: () => {} };

/** A context whose clock is real time, with nodes that only record calls. */
function fakeAudio() {
  const t0 = performance.now();
  const param = () => ({ value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {} });
  const ctx = {
    get currentTime() { return (performance.now() - t0) / 1000; },
    destination: node(),
    createGain: () => ({ ...node(), gain: param() }),
    createStereoPanner: () => ({ ...node(), pan: param() }),
    createOscillator: () => ({ ...node(), type: 'sine', frequency: param(), start() {}, stop() {} }),
  } as unknown as AudioContext;
  vi.spyOn(AudioContextManager, 'init').mockResolvedValue(ctx);
  vi.spyOn(AudioContextManager, 'isReady').mockReturnValue(true);
  vi.spyOn(AudioContextManager, 'getContext').mockReturnValue(ctx);
  vi.spyOn(AudioContextManager, 'getMasterNode').mockReturnValue(ctx.destination as AudioNode);
}

describe('Transport', () => {
  it('seek slider has a time value text and calls onSeek; buttons follow the state', () => {
    const onSeek = vi.fn(), onPlay = vi.fn();
    wrap(<Transport state="ready" index={2} count={5} label={(i) => `Y${i}`} onPlay={onPlay} onPause={() => {}} onStop={() => {}} onStep={() => {}} onSeek={onSeek} />);
    const slider = screen.getByRole('slider', { name: 'Position in the series' });
    expect(slider.getAttribute('aria-valuetext')).toBe('Y2, 3 of 5');
    fireEvent.change(slider, { target: { value: '4' } });
    expect(onSeek).toHaveBeenCalledWith(4);
    expect((screen.getByRole('button', { name: 'Stop' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onPlay).toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Player: ready');
  });
});

describe('Jukebox series player', () => {
  it('no audio until Play; a blocked context says so instead of failing silently', async () => {
    stubFiles();
    wrap(<JukeboxView countries={countries} initialStory="gistemp" initialT="1998" onOpenCollection={() => {}} />);
    await waitFor(() => expect(document.querySelector('[data-player-state]')?.getAttribute('data-player-state')).toBe('ready'));
    expect(document.querySelector('[data-legend-now]')?.textContent).toMatch(/°C → [A-G][345] \(\d+ Hz\)/);
    expect(screen.getByText(/Fixed range for this dataset/)).toBeTruthy();
    expect(seriesDiagnostics().nodes).toBe(0);
    vi.spyOn(AudioContextManager, 'init').mockRejectedValue(new Error('blocked'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Play' })); });
    expect((await screen.findByRole('alert')).textContent).toMatch(/blocked the sound/);
  });

  it('Play moves the cursor from the chosen point with the sound; Pause holds it; unmount frees every node', async () => {
    stubFiles();
    fakeAudio();
    window.history.replaceState(null, '', '/#v1&track=jukebox');
    const view = wrap(<JukeboxView countries={countries} initialStory="gistemp" initialT="1998" onOpenCollection={() => {}} />);
    await waitFor(() => expect(document.querySelector('[data-player-state]')?.getAttribute('data-player-state')).toBe('ready'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Play' })); });
    expect(document.querySelector('[data-player-state]')?.getAttribute('data-player-state')).toBe('playing');
    await waitFor(() => expect(document.querySelector('[data-cursor]')?.getAttribute('data-cursor')).toBe('2000'), { timeout: 2000 });
    expect(seriesDiagnostics().nodes).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const held = document.querySelector('[data-cursor]')?.getAttribute('data-cursor');
    await new Promise((r) => setTimeout(r, 400));
    expect(document.querySelector('[data-cursor]')?.getAttribute('data-cursor')).toBe(held);
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy();
    expect(window.location.hash).toContain(`t=${held}`);
    view.unmount();
    await new Promise((r) => setTimeout(r, 150));
    expect(seriesDiagnostics().nodes).toBe(0);
  });
});
