import React from 'react';

/** True when this browser can create a WebGL context. Cached: probing creates a throwaway canvas. */
let webglOk: boolean | null = null;
// eslint-disable-next-line react-refresh/only-export-components
export function hasWebGL(): boolean {
  if (webglOk !== null) return webglOk;
  try {
    const c = document.createElement('canvas');
    webglOk = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { webglOk = false; }
  return webglOk;
}

interface Props { fallback: React.ReactNode; children: React.ReactNode; onFail?: () => void }
interface State { failed: boolean }

/** Renders the globe only when WebGL works, and swaps in `fallback` if it throws later (lost context, driver error). */
export class GlobeBoundary extends React.Component<Props, State> {
  state: State = { failed: !hasWebGL() };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidMount() { if (this.state.failed) this.props.onFail?.(); }
  componentDidCatch(err: unknown) { console.warn('Globe failed, showing the fallback.', err); this.props.onFail?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Static stand-in for the hero globe: the same NASA Blue Marble texture on a shaded disc. No WebGL, no motion. */
export const GlobeStill: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full h-full relative overflow-hidden">
    <div role="img" aria-label={label}
      className="absolute aspect-square rounded-full w-[min(80vw,520px)] left-1/2 -translate-x-1/2 bottom-[-12%] opacity-60 md:opacity-100 md:w-[min(44vw,620px)] md:left-auto md:translate-x-0 md:right-[6%] md:bottom-auto md:top-1/2 md:-translate-y-1/2"
      style={{
        backgroundImage: 'url(/textures/earth_atmos_2048.jpg)', backgroundSize: 'auto 100%', backgroundPosition: '38% 50%',
        boxShadow: 'inset -40px -20px 90px 10px rgba(2,6,14,.85), inset 12px 6px 40px rgba(120,190,255,.25), 0 0 60px 6px rgba(76,195,255,.18)',
      }} />
  </div>
);
