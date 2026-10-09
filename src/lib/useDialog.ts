import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let open = 0; // dialogs currently open; #root stays inert until the last one closes

/**
 * Modal behaviour in one place: focus the first control once per open, trap Tab, close on Esc,
 * make the app (`#root`) inert and give focus back to the opener. `onClose` is read through a ref,
 * so a new function on every render never re-runs the effect.
 */
export function useDialog(isOpen: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    if (open++ === 0) root?.setAttribute('inert', '');
    const items = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    (items()[0] ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const list = items(), first = list[0], last = list[list.length - 1];
      if (!first) { e.preventDefault(); return; }
      const a = document.activeElement;
      if (!ref.current?.contains(a)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (--open === 0) root?.removeAttribute('inert');
      if (opener?.isConnected) opener.focus();
    };
  }, [isOpen, ref]);
}
