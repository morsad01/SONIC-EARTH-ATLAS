// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { dataFile } from './fixtures';
import { PrefsProvider } from '../lib/prefs';
import { CountryProfile } from '../countries/CountryProfile';
import { ProfileDataContext, type ProfileData } from '../countries/profileContext';
import { ProvenanceCard } from '../components/data-status/ProvenanceCard';
import { DataState } from '../components/data-status/DataState';
import { loadCountries, countryById } from '../countries/countries';
import { clearPowerCache } from '../datasets/adapters/power';
import { DatasetAdapter } from '../datasets/adapter';
import { parseGistemp } from '../datasets/adapters/gistemp';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearPowerCache(); sessionStorage.clear(); });
const file = (u: string) => dataFile(u);

function powerJson() {
  const T: Record<string, number> = {}, P: Record<string, number> = {};
  for (let y = 1981; y <= 2025; y++) { for (let m = 1; m <= 12; m++) { T[`${y}${String(m).padStart(2, '0')}`] = 20; P[`${y}${String(m).padStart(2, '0')}`] = 1; } T[`${y}13`] = 20 + (y - 1981) / 20; P[`${y}13`] = 1; }
  return { properties: { parameter: { T2M: T, PRECTOTCORR: P } } };
}
async function setup(id: string, power: 'ok' | 'fail', pd: Partial<ProfileData> = {}) {
  vi.stubGlobal('fetch', async (u: string) => (u.includes('power.larc') ? (power === 'ok' ? { ok: true, status: 200, json: async () => powerJson() } : { ok: false, status: 404, json: async () => ({}) }) : { ok: true, status: 200, json: async () => file(u) }));
  const r = await DatasetAdapter.loadDatasets('live');
  const list = await loadCountries('110m'), country = countryById(list, id)!;
  const onExplore = vi.fn();
  render(<PrefsProvider><ProfileDataContext.Provider value={{ slices: r.slices, snapshotDates: r.snapshotDates, isFallback: false, loading: false, onExplore, ...pd }}><CountryProfile country={country} point={{ lat: 10, lon: 20 }} /></ProfileDataContext.Provider></PrefsProvider>);
  return { onExplore };
}

describe('CountryProfile', () => {
  it('shows fire figures with source and method for Papua New Guinea, and POWER with a live badge', async () => {
    const { onExplore } = await setup('PNG', 'ok');
    expect(await screen.findByText(/Fire detections/)).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole('article').some((a) => a.getAttribute('data-badge') === 'live')).toBe(true));
    const fire = screen.getAllByRole('article').find((a) => a.getAttribute('aria-label')?.includes('fire detection'))!;
    expect(fire.getAttribute('data-badge')).toBe('snapshot');
    expect(fire.textContent).toContain('Snapshot 2026-10-08');
    expect(fire.textContent).toContain('NASA FIRMS VIIRS');
    expect(screen.getByRole('img', { name: /Annual mean temperature/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Explore its sound/ }));
    expect(onExplore).toHaveBeenCalledWith('PNG');
  });
  it('lists nothing from gridded layers for Luxembourg and says so, with the global records only as context', async () => {
    await setup('LUX', 'ok');
    expect(await screen.findByText(/Fire detections: no cell or point inside the border/)).toBeTruthy();
    expect(screen.queryByRole('article', { name: /fire/i })).toBeNull();
    expect(screen.getAllByText('Global context').length).toBeGreaterThan(0);
  });
  it('shows the empty state, not filler, when nothing is available at all', async () => {
    await setup('LUX', 'fail');
    expect(await screen.findByText(/Nothing is shown rather than a stand-in/)).toBeTruthy();
  });
  it('shows an error with retry when POWER fails', async () => {
    await setup('LUX', 'fail');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Could not load/);
    expect(screen.getByRole('button', { name: /Try again/ })).toBeTruthy();
  });
  it('does not compute country figures from the offline sample', async () => {
    await setup('PNG', 'ok', { isFallback: true });
    expect(await screen.findByText(/offline sample is playing/)).toBeTruthy();
    expect(screen.queryByText(/Fire detections:/)).toBeNull();
  });
});

describe('ProvenanceCard / DataState', () => {
  it('expands method and limits with aria-expanded', () => {
    render(<PrefsProvider><ProvenanceCard series={parseGistemp(file('/data/gistemp_global.json'))} /></PrefsProvider>);
    const b = screen.getByRole('button', { name: /Method and limits/ });
    expect(b.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(b);
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/One global number per year/)).toBeTruthy();
    expect(screen.getByText('1880 to 2025')).toBeTruthy();
  });
  it('renders every state with text and offers retry on errors', () => {
    const retry = vi.fn();
    render(<PrefsProvider><DataState status="error" onRetry={retry} /><DataState status="loading" /><DataState status="empty" /><DataState status="stale" /><DataState status="offline" /></PrefsProvider>);
    fireEvent.click(screen.getAllByRole('button', { name: /Try again/ })[0]);
    expect(retry).toHaveBeenCalled();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getAllByRole('status')).toHaveLength(3);
  });
});
