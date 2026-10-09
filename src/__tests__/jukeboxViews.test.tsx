// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { dataFile } from './fixtures';
import { PrefsProvider } from '../lib/prefs';
import { TimelineView } from '../jukebox/TimelineView';
import { StoryRow } from '../stories/StoryRow';
import { TopicCarousel } from '../stories/TopicCarousel';
import { JukeboxView } from '../jukebox/JukeboxView';
import { GLOBAL_STORIES } from '../stories/stories';
import { clearStoryCache } from '../stories/loadStory';
import type { Origin } from '../jukebox/useJukebox';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearStoryCache(); window.history.replaceState(null, '', '/'); });
const stubFiles = () => vi.stubGlobal('fetch', async (u: string) => ({ ok: true, status: 200, json: async () => dataFile(u) }));
const wrap = (ui: React.ReactNode) => render(<PrefsProvider>{ui}</PrefsProvider>);

function Timeline({ points, onCursor }: { points: { t: string; v: number | null }[]; onCursor?: (t: string, o: Origin) => void }) {
  const [c, setC] = useState(points[0].t);
  return <TimelineView points={points} cursor={c} origin="load" seq={0} unit="°C" label="Test" onCursor={(t, o) => { setC(t); onCursor?.(t, o); }} />;
}

describe('TimelineView', () => {
  it('roving tabindex: one tab stop, ↓ / End / Home select with origin "user", the active item has aria-current', () => {
    const spy = vi.fn();
    wrap(<Timeline points={[{ t: '2001', v: 1 }, { t: '2002', v: null }, { t: '2003', v: 3 }]} onCursor={spy} />);
    const items = screen.getAllByRole('button');
    expect(items.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(items[0].getAttribute('aria-current')).toBe('true');
    expect(items[1].textContent).toContain('no data');
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(spy).toHaveBeenLastCalledWith('2002', 'user');
    expect(screen.getAllByRole('button')[1].getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(screen.getAllByRole('button')[1], { key: 'End' });
    expect(spy).toHaveBeenLastCalledWith('2003', 'user');
    expect(document.activeElement).toBe(screen.getAllByRole('button')[2]);
    fireEvent.keyDown(screen.getAllByRole('button')[2], { key: 'Home' });
    expect(spy).toHaveBeenLastCalledWith('2001', 'user');
  });

  it('groups long series into buckets; the cursor bucket is open and → / ← open and close others', () => {
    const pts = Array.from({ length: 24 * 12 }, (_, i) => ({ t: `${2000 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`, v: i }));
    wrap(<Timeline points={pts} />);
    const b2000 = screen.getByRole('button', { name: /^2000/ }), b2001 = screen.getByRole('button', { name: /^2001/ });
    expect(b2000.getAttribute('aria-expanded')).toBe('true');
    expect(b2001.getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(b2001, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: /^2001/ }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(screen.getByRole('button', { name: /^2001/ }), { key: 'ArrowLeft' });
    expect(screen.getByRole('button', { name: /^2001/ }).getAttribute('aria-expanded')).toBe('false');
  });
});

describe('StoryRow', () => {
  it('moves focus with ← / → / End, selects on click, and marks the active card in text', () => {
    const onSelect = vi.fn(), stories = GLOBAL_STORIES.slice(0, 4);
    wrap(<StoryRow stories={stories} activeId="co2" onSelect={onSelect} sparks={{}} />);
    const cards = within(screen.getByRole('list', { name: 'Data stories' })).getAllByRole('button');
    expect(cards.filter((c) => c.tabIndex === 0)).toEqual([cards[1]]);
    expect(cards[1].getAttribute('aria-pressed')).toBe('true');
    expect(cards[1].textContent).toContain('Showing');
    cards[1].focus();
    fireEvent.keyDown(cards[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cards[2]);
    fireEvent.keyDown(cards[2], { key: 'End' });
    expect(document.activeElement).toBe(cards[3]);
    fireEvent.click(cards[0]);
    expect(onSelect).toHaveBeenCalledWith('gistemp');
  });
});

describe('TopicCarousel', () => {
  it('walks Overview → Split → Immersive with Back at each stage, wraps prev/next, and Listen opens the story', () => {
    stubFiles();
    const onListen = vi.fn();
    wrap(<TopicCarousel onListen={onListen} />);
    expect(screen.getByRole('heading', { name: 'Temperature' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Look closer' }));
    expect(screen.getByRole('heading', { name: 'Global temperature since 1880' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Full view' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Full view' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Look closer' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous topic' }));
    expect(screen.getByRole('heading', { name: 'Rain' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open in the Jukebox' }));
    expect(onListen).toHaveBeenCalledWith('bgd-sylhet');
    const skip = screen.getByRole('button', { name: 'Skip animation' });
    fireEvent.click(skip);
    expect(skip.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('JukeboxView', () => {
  const countries = { list: [], country: null, point: null, onSelect: () => {} };
  it('opens on the shared story and cursor; a timeline click updates chart, caption and hash together', async () => {
    stubFiles();
    window.history.replaceState(null, '', '/#v1&track=jukebox');
    wrap(<JukeboxView countries={countries} initialStory="gistemp" initialT="1998" onOpenCollection={() => {}} />);
    await waitFor(() => expect(document.querySelector('[data-caption]')?.textContent).toContain('1998: Global surface temperature anomaly was'));
    expect(document.querySelector('[data-cursor]')?.getAttribute('data-cursor')).toBe('1998');
    expect(window.location.hash).toContain('story=gistemp');
    expect(window.location.hash).toContain('t=1998');
    fireEvent.click(screen.getByRole('button', { name: /^2016:/ }));
    expect(document.querySelector('[data-caption]')?.textContent).toMatch(/^2016: .* (Up|Down|Same)/);
    expect(document.querySelector('[data-cursor]')?.getAttribute('data-cursor')).toBe('2016');
    expect(window.location.hash).toContain('t=2016');
    expect(screen.getByRole('button', { name: /^2016:/ }).getAttribute('aria-current')).toBe('true');
  });

  it('switching story through the row reloads the panel; a picture story says it has no timeline', async () => {
    stubFiles();
    const open = vi.fn();
    wrap(<JukeboxView countries={countries} onOpenCollection={open} />);
    const row = await screen.findByRole('list', { name: 'Data stories' });
    fireEvent.click(within(row).getByRole('button', { name: /Arctic sea ice/ }));
    await waitFor(() => expect(document.querySelector('[data-caption]')?.textContent).toContain('Arctic sea ice extent'));
    fireEvent.click(within(row).getByRole('button', { name: /Ocean heat content/ }));
    expect(await screen.findByText(/one picture, so it has no timeline/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Hear it in/ }));
    expect(open).toHaveBeenCalledWith('frames', 'eic-ocean-heat');
  });

  it('a failed file shows an error with retry, not a stand-in', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }));
    wrap(<JukeboxView countries={countries} onOpenCollection={() => {}} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
