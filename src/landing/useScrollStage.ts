import { useEffect, useRef, useState } from 'react';

export type Stage = 0 | 1 | 2;

/** The stage whose section shows the most. Ties keep the current stage, so the globe doesn't jitter at a boundary. */
export function pickStage(ratios: readonly number[], current: Stage): Stage {
  let best = current, top = ratios[current] ?? 0;
  ratios.forEach((r, i) => { if (r > top + 0.001) { best = i as Stage; top = r; } });
  return best;
}

/**
 * Watches elements marked `data-stage-index="0|1|2"` inside the returned ref and reports which one
 * is most visible. IntersectionObserver only: no wheel or scroll listeners, so scrolling stays native.
 */
export function useScrollStage<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [stage, setStage] = useState<Stage>(0);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-stage-index]'));
    const ratios = els.map(() => 0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) ratios[Number((e.target as HTMLElement).dataset.stageIndex)] = e.isIntersecting ? e.intersectionRatio : 0;
      setStage((s) => pickStage(ratios, s));
    }, { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return { ref, stage };
}
