// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useDialog } from '../lib/useDialog';

afterEach(cleanup);

function Demo({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useDialog(open, () => { onClose(); setOpen(false); }, ref);
  return (
    <div>
      <div id="root"><button onClick={() => setOpen(true)}>opener</button><button onClick={() => setN(n + 1)}>rerender {n}</button></div>
      {open && <div ref={ref} role="dialog"><button>first</button><input aria-label="mid" /><button>last</button></div>}
    </div>
  );
}

describe('useDialog', () => {
  it('focuses the first control once, traps Tab, closes on Esc and restores focus', () => {
    const onClose = vi.fn();
    const r = render(<Demo onClose={onClose} />);
    const root = document.createElement('div'); root.id = 'root'; r.container.prepend(root);
    const opener = screen.getByText('opener');
    opener.focus();
    fireEvent.click(opener);
    const first = screen.getByText('first'), last = screen.getByText('last');
    expect(document.activeElement).toBe(first);
    (screen.getByLabelText('mid') as HTMLElement).focus();
    fireEvent.keyDown(document, { key: 'Tab' }); // a re-render must not steal focus back
    expect(document.activeElement).toBe(screen.getByLabelText('mid'));
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it('does not move focus again when the parent re-renders with a new onClose', () => {
    render(<Demo onClose={() => {}} />);
    fireEvent.click(screen.getByText('opener'));
    (screen.getByLabelText('mid') as HTMLElement).focus();
    // The dialog is not inert in jsdom, so the re-render button is clickable.
    fireEvent.click(screen.getByText(/rerender/));
    expect(document.activeElement).toBe(screen.getByLabelText('mid'));
  });
});
