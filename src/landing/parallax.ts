/** Landing parallax: far layers move less than near ones. Pure, so it can be tested; `applyParallax` writes the result to the DOM. */
export interface Parallax { stars: number; milky: number; nebula: number; copy: (sectionTop: number) => number; fade: (sectionTop: number, sectionH: number) => number }
const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

/** `y` is the landing scroll position in px. Offsets are px; background layers move up slowly (the sky is far away), copy lags the scroll a little. */
export function parallaxAt(y: number): Parallax {
  return {
    stars: -clamp(y * 0.06, 80),
    milky: -clamp(y * 0.12, 160),
    nebula: -clamp(y * 0.2, 240),
    // Only once a section scrolls past: its whole block lags behind and fades, so it never piles up under the header.
    copy: (top) => Math.max(0, Math.min(140, (y - top) * 0.3)),
    fade: (top, h) => (y <= top ? 1 : Math.max(0, 1 - (y - top) / Math.max(1, h * 0.6))),
  };
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('rm') || document.documentElement.classList.contains('calm');

/** Writes the offsets: CSS variables on #space-bg (its subtree is tiny, so no page-wide style recalc) and `translate` + `opacity` on the section blocks marked `data-parallax` (`translate` is not part of their `transform` transition). */
export function applyParallax(y: number, copies: { el: HTMLElement; top: number; h: number }[]) {
  const bg = document.getElementById('space-bg');
  const off = reduced();
  const p = parallaxAt(off ? 0 : y);
  if (bg) {
    bg.style.setProperty('--par-stars', `${p.stars}px`);
    bg.style.setProperty('--par-milky', `${p.milky}px`);
    bg.style.setProperty('--par-nebula', `${p.nebula}px`);
  }
  for (const c of copies) {
    const past = !off && y > c.top;
    c.el.style.translate = past ? `0 ${p.copy(c.top).toFixed(1)}px` : '';
    c.el.style.opacity = past ? p.fade(c.top, c.h).toFixed(3) : ''; // cleared otherwise, so the stage dimming in CSS still applies
  }
}
