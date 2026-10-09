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
