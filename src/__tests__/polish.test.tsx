// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { TourBar } from '../demo/TourBar';
import { TOUR } from '../demo/tour';
import { SettingsDialog } from '../components/SettingsDialog';

afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); document.documentElement.className = ''; });
const wrap = (ui: React.ReactNode) => render(<PrefsProvider>{ui}</PrefsProvider>);

describe('TourBar', () => {
  it('applies each step, advances on its timer, skips with Next, and closes after the last step', () => {
    vi.useFakeTimers();
    const onApply = vi.fn(), onClose = vi.fn();
    wrap(<TourBar open onClose={onClose} onApply={onApply} />);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`1/${TOUR.length}`)).toBeTruthy();
    act(() => { vi.advanceTimersByTime(TOUR[0].ms + 100); });
    expect(screen.getByText(`2/${TOUR.length}`)).toBeTruthy();
    expect(onApply).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Pause tour' }));
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByText(`2/${TOUR.length}`)).toBeTruthy();
    for (let k = 2; k <= TOUR.length; k++) fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('starts again from step 1 when reopened', () => {
    vi.useFakeTimers();
    const props = { onClose: () => {}, onApply: () => {} };
    const r = wrap(<TourBar open {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(`2/${TOUR.length}`)).toBeTruthy();
    r.rerender(<PrefsProvider><TourBar open={false} {...props} /></PrefsProvider>);
    r.rerender(<PrefsProvider><TourBar open {...props} /></PrefsProvider>);
    expect(screen.getByText(`1/${TOUR.length}`)).toBeTruthy();
  });
});

describe('Settings', () => {
  it('“Pause background motion” is a labelled switch that sets html.calm', () => {
    const noop = () => {};
    wrap(<SettingsDialog open onClose={noop} volume={0.8} onVolume={noop} spatialMode="stereo-panning" onToggleSpatial={noop} showDiagnostics={false} onToggleDiagnostics={noop} />);
    const sw = screen.getByRole('switch', { name: /Pause background motion/ });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.classList.contains('calm')).toBe(true);
    expect(screen.getByRole('switch', { name: 'Performance diagnostics' })).toBeTruthy();
  });
});
