import React, { useMemo } from 'react';
import type { World } from './worlds';
import { dotLayer, type Dot } from './dotLayer';

/** A CSS Earth: the bundled NASA Blue Marble texture scrolled behind a round, shaded window. No WebGL. Only the active one spins. */
export const EarthSphere: React.FC<{ world: World; spin: boolean; dots?: readonly Dot[]; dotColor?: string }> = ({ world, spin, dots = [], dotColor = '#ff7a3d' }) => {
  const layer = useMemo(() => dotLayer(dots, dotColor), [dots, dotColor]);
  const bg = layer ? `url(${layer}), url(/textures/earth_atmos_2048.jpg)` : 'url(/textures/earth_atmos_2048.jpg)';
  return (
    <div className="earth" data-spin={spin} style={{ '--f': world.face } as React.CSSProperties} aria-hidden="true">
      <div className="earth-map" style={{ backgroundImage: bg, filter: world.tint }} />
      <div className="earth-shade" />
    </div>
  );
};
