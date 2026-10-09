/** Where the globe sits for each landing stage and for the Atlas. x/y move the globe group, z is the camera distance. */
export type Framing = 'hero' | 'split' | 'immersive' | 'explore';
export interface FrameTarget { x: number; y: number; z: number }

export function framingTarget(f: Framing, aspect: number): FrameTarget {
  const portrait = aspect < 0.8;
  switch (f) {
    case 'hero': return portrait ? { x: 0, y: -1.3, z: 11.5 } : { x: 2.3, y: 0, z: 8.4 };
    case 'split': return portrait ? { x: 0, y: -0.9, z: 10 } : { x: 2.0, y: 0, z: 6.6 };
    case 'immersive': return portrait ? { x: 0, y: 0.6, z: 9 } : { x: 0, y: 0.35, z: 5.6 };
    default: return { x: 0, y: 0, z: portrait ? 10.5 : 7.2 };
  }
}

/** Idle spin per frame (radians). Slower on the landing page; none with reduced motion. */
export const idleSpin = (f: Framing, reduce: boolean) => (reduce ? 0 : f === 'explore' ? 0.0015 : 0.0008);
