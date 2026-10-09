// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PrefsProvider } from '../lib/prefs';
import { CountryPicker } from '../countries/CountryPicker';
import { searchCountries } from '../countries/search';
import { loadCountries, type Country } from '../countries/countries';

afterEach(cleanup);
const setup = async (selected: Country | null = null) => {
  const list = await loadCountries('110m'), onSelect = vi.fn();
  render(<PrefsProvider><CountryPicker list={list} selected={selected} onSelect={onSelect} /></PrefsProvider>);
  return { list, onSelect, input: screen.getByRole('combobox') as HTMLInputElement };
};

describe('searchCountries', () => {
  it('ranks prefix matches first, matches the ISO code and the Bangla name', async () => {
    const list = await loadCountries('110m');
    expect(searchCountries(list, 'ban')[0].id).toBe('BGD');
    expect(searchCountries(list, 'ban').map((c) => c.id)).toContain('BGD');
    expect(searchCountries(list, 'bgd')[0].id).toBe('BGD');
    expect(searchCountries(list, 'বাংলা')[0].id).toBe('BGD');
    expect(searchCountries(list, 'republic').map((c) => c.id)).toContain('DOM'); // substring after prefix matches
    expect(searchCountries(list, 'zzzz')).toEqual([]);
    expect(searchCountries(list, '  ')).toBe(list);
  });
});

describe('CountryPicker (ARIA 1.2 combobox)', () => {
  it('exposes combobox + listbox roles and wires aria-expanded / controls', async () => {
    const { input } = await setup();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    fireEvent.change(input, { target: { value: 'nep' } });
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const lb = screen.getByRole('listbox');
    expect(input.getAttribute('aria-controls')).toBe(lb.id);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Nepal')]));
  });

  it('keyboard only: type, arrow, Enter selects; the live region reports the count', async () => {
    const { input, onSelect } = await setup();
    fireEvent.change(input, { target: { value: 'ban' } });
    expect(screen.getByRole('status').textContent).toMatch(/countries found/);
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[1].id);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe('BGD');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.value).toBe('');
  });

  it('ArrowDown on a closed list opens it; Enter on a closed list selects nothing', async () => {
    const { input, onSelect } = await setup();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Escape closes first, then clears the text', async () => {
    const { input } = await setup();
    fireEvent.change(input, { target: { value: 'chi' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.value).toBe('chi');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });

  it('says so when nothing matches and selects nothing on Enter', async () => {
    const { input, onSelect } = await setup();
    fireEvent.change(input, { target: { value: 'qqq' } });
    expect(screen.getByRole('status').textContent).toMatch(/No country matches/);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('click selects, marks the current selection with text, and shows its name as the placeholder', async () => {
    const list = await loadCountries('110m');
    const { input, onSelect } = await setup(list.find((c) => c.id === 'BGD')!);
    expect(input.placeholder).toBe('Bangladesh');
    fireEvent.change(input, { target: { value: 'bang' } });
    const opt = screen.getAllByRole('option').find((o) => o.textContent?.includes('Bangladesh'))!;
    expect(opt.getAttribute('aria-selected')).toBe('true');
    expect(opt.textContent).toMatch(/Selected/);
    fireEvent.click(screen.getAllByRole('option')[0]);
    expect(onSelect).toHaveBeenCalled();
  });
});
