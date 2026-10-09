export interface Dot { lat: number; lon: number; w?: number }

/** Equirectangular canvas (1024×512) with the data points drawn on it: used as a 3D overlay texture, or as a CSS background. null where canvas is unavailable. */
export function dotCanvas(dots: readonly Dot[], color: string): HTMLCanvasElement | null {
  if (!dots.length || typeof document === 'undefined') return null;
  try {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d'); if (!g) return null;
    g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 6;
    for (const d of dots) { g.globalAlpha = 0.55 + 0.45 * (d.w ?? 1); g.beginPath(); g.arc(((d.lon + 180) / 360) * 1024, ((90 - d.lat) / 180) * 512, 1.6 + 1.8 * (d.w ?? 1), 0, 7); g.fill(); }
    return c;
  } catch { return null; }
}

/** The same layer as a data URL (CSS fallback spheres). '' where canvas is unavailable. */
export function dotLayer(dots: readonly Dot[], color: string): string {
  try { return dotCanvas(dots, color)?.toDataURL('image/png') ?? ''; } catch { return ''; }
}
