/** Where the Atlas globe sits. x/y move the globe group, z is the camera distance. (The landing page no longer uses a 3D globe.) */
export type Framing = 'explore';
export interface FrameTarget { x: number; y: number; z: number }

export function framingTarget(_f: Framing, aspect: number): FrameTarget {
  return { x: 0, y: 0, z: aspect < 0.8 ? 10.5 : 7.2 };
}

/** Idle spin per frame at 60 fps (radians); none with reduced motion. */
export const idleSpin = (_f: Framing, reduce: boolean) => (reduce ? 0 : 0.0015);

/** Frame-rate-independent easing factor: the same point is reached at the same time at 30 or 60 fps. `tau` is the time constant in ms. */
export const easeK = (dtMs: number, tauMs: number) => 1 - Math.exp(-Math.max(0, dtMs) / tauMs);
