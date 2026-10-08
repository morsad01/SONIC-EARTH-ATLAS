import React from 'react';
import type { EarthObservation, PhenomenonType } from '../types/dataset';

const LABEL: Record<PhenomenonType, string> = { fire: 'Wildfire', precipitation: 'Heavy rain', sst: 'Warm ocean' };

/** Says in words what the loudest sound on screen currently is, so sound and meaning stay linked. */
export const LiveCaption: React.FC<{ observations: EarthObservation[]; enabled: Record<PhenomenonType, boolean> }> = ({ observations, enabled }) => {
  const top = observations.filter((o) => enabled[o.phenomenon]).sort((a, b) => b.normalizedValue - a.normalizedValue)[0];
  if (!top) return null;
  const trend = top.delta === undefined || Math.abs(top.delta) < 1e-6 ? 'steady' : top.delta > 0 ? 'rising' : 'easing';
  return (
    <div role="status" aria-live="polite"
      className="max-md:sr-only absolute left-1/2 -translate-x-1/2 top-3 z-10 w-max max-w-[92vw] rounded-lg bg-slate-950/80 backdrop-blur border border-slate-700/70 px-3 py-2 text-sm">
      <div className="text-slate-400 text-xs">Loudest right now</div>
      <div className="font-semibold text-white">{LABEL[top.phenomenon]}: {top.regionName ?? `${top.latitude.toFixed(0)}°, ${top.longitude.toFixed(0)}°`}</div>
      <div className="text-slate-300">{top.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} {top.unit}, {trend}</div>
    </div>
  );
};
