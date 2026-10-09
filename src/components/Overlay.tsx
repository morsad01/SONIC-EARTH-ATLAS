import React from 'react';
import { createPortal } from 'react-dom';

/** Dialogs render into #overlay-root, a sibling of #root, so no layout or hide rule on the app tree can touch them (and #root can go `inert`). */
function overlayHost(): HTMLElement {
  let el = document.getElementById('overlay-root');
  if (!el) { el = document.createElement('div'); el.id = 'overlay-root'; document.body.appendChild(el); }
  return el;
}

export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => createPortal(children, overlayHost());
