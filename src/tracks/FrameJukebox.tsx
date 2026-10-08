import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square, ImagePlus, Loader2, AlertTriangle } from 'lucide-react';
import { FRAMES, gibsUrl, loadFileCanvases, loadFrameCanvases, type NasaFrame } from '../lib/gibs';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs } from '../lib/prefs';

const COLS = 128, ROWS = 12, SWEEP_SEC = 20;
const PENTA = [0, 2, 4, 7, 9];
// Top row (north) is the highest pitch, like the globe's latitude tilt.
const rowHz = (row: number) => { const i = ROWS - 1 - row; return 130.81 * Math.pow(2, (PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12); };

interface Grid { lum: Float32Array; warm: Float32Array; green: Float32Array }
function toGrid(cv: HTMLCanvasElement): Grid {
  const g = document.createElement('canvas'); g.width = COLS; g.height = ROWS;
  const c = g.getContext('2d', { willReadFrequently: true })!;
  c.imageSmoothingQuality = 'high';
  c.drawImage(cv, 0, 0, COLS, ROWS);
  const px = c.getImageData(0, 0, COLS, ROWS).data;
  const n = COLS * ROWS, lum = new Float32Array(n), warm = new Float32Array(n), green = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const R = px[i * 4] / 255, G = px[i * 4 + 1] / 255, B = px[i * 4 + 2] / 255;
    lum[i] = 0.299 * R + 0.587 * G + 0.114 * B;
    warm[i] = Math.max(0, R - B); green[i] = Math.max(0, G - Math.max(R, B));
  }
  return { lum, warm, green };
}

interface Bank { oscs: OscillatorNode[]; gains: GainNode[]; filters: BiquadFilterNode[]; pan: StereoPannerNode; out: GainNode }
function makeBank(ctx: AudioContext, dest: AudioNode): Bank {
  const out = ctx.createGain(); out.gain.value = 0.9;
  const pan = ctx.createStereoPanner(); pan.connect(out); out.connect(dest);
  const oscs: OscillatorNode[] = [], gains: GainNode[] = [], filters: BiquadFilterNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = rowHz(r);
    f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 0.7;
    g.gain.value = 0;
    o.connect(f); f.connect(g); g.connect(pan); o.start();
    oscs.push(o); gains.push(g); filters.push(f);
  }
  return { oscs, gains, filters, pan, out };
}
function disposeBank(b: Bank | null) {
  if (!b) return;
  b.oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
  b.out.disconnect();
}

const lonAt = (col: number) => Math.round(-180 + ((col + 0.5) / COLS) * 360);
const latAt = (row: number) => Math.round(90 - ((row + 0.5) / ROWS) * 180);
const fmtLon = (l: number) => `${Math.abs(l)}°${l < 0 ? 'W' : l > 0 ? 'E' : ''}`;
const fmtLat = (l: number) => `${Math.abs(l)}°${l < 0 ? 'S' : l > 0 ? 'N' : ''}`;

// Pairs for "then and now". Same layer and day of year, one year apart (or season apart for vegetation).
const PAIRS: { id: string; label: string; a: NasaFrame; b: NasaFrame }[] = [
  { id: 'sst', label: 'Ocean heat anomaly: Sep 2025 → Sep 2026', a: { ...FRAMES[3], date: '2025-09-30', title: '30 Sep 2025' }, b: { ...FRAMES[3], title: '30 Sep 2026' } },
  { id: 'veg', label: 'Vegetation: March → September 2026', a: { ...FRAMES[6], date: '2026-03-22', title: '22 Mar 2026' }, b: { ...FRAMES[6], title: '22 Sep 2026' } },
  { id: 'fire', label: 'Fires: 3 Oct 2025 → 3 Oct 2026', a: { ...FRAMES[1], date: '2025-10-03', title: '3 Oct 2025' }, b: { ...FRAMES[1], title: '3 Oct 2026' } },
];

export const FrameJukebox: React.FC = () => {
  const { t, lang } = usePrefs();
  const [mode, setMode] = useState<'single' | 'pair'>('single');
  const [frameId, setFrameId] = useState(FRAMES[0].id);
  const [pairId, setPairId] = useState(PAIRS[0].id);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);
  const [col, setCol] = useState(0);
  const [readout, setReadout] = useState('');
  const [srText, setSrText] = useState('');
  const viewA = useRef<HTMLCanvasElement>(null), viewB = useRef<HTMLCanvasElement>(null);
  const grids = useRef<{ a: Grid | null; b: Grid | null }>({ a: null, b: null });
  const banks = useRef<{ a: Bank | null; b: Bank | null }>({ a: null, b: null });
  const timer = useRef<number | null>(null);

  const frame = FRAMES.find((f) => f.id === frameId)!;
  const pair = PAIRS.find((p) => p.id === pairId)!;

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    disposeBank(banks.current.a); disposeBank(banks.current.b);
    banks.current = { a: null, b: null };
    setPlaying(false);
  }, []);

  // Load images whenever the selection changes.
  useEffect(() => {
    let cancelled = false;
    stop(); setStatus('loading'); setCol(0);
    const paint = (target: HTMLCanvasElement | null, src: HTMLCanvasElement) => {
      if (!target) return;
      target.width = src.width; target.height = src.height;
      target.getContext('2d')!.drawImage(src, 0, 0);
    };
    (async () => {
      try {
        if (mode === 'single') {
          const c = userFile ? await loadFileCanvases(userFile) : await loadFrameCanvases(frame);
          if (cancelled) return;
          paint(viewA.current, c.display);
          grids.current = { a: toGrid(c.sound), b: null };
        } else {
          const [a, b] = await Promise.all([loadFrameCanvases(pair.a), loadFrameCanvases(pair.b)]);
          if (cancelled) return;
          paint(viewA.current, a.display); paint(viewB.current, b.display);
          grids.current = { a: toGrid(a.sound), b: toGrid(b.sound) };
        }
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [mode, frameId, pairId, userFile, frame, pair, stop]);

  useEffect(() => () => stop(), [stop]);

  const start = async () => {
    const ga = grids.current.a; if (!ga) return;
    const ctx = await AudioContextManager.init();
    const dest = AudioContextManager.getMasterNode()!;
    banks.current.a = makeBank(ctx, dest);
    if (mode === 'pair') { banks.current.b = makeBank(ctx, dest); banks.current.a.pan.pan.value = -0.9; banks.current.b.pan.pan.value = 0.9; }
    setPlaying(true);
    let c = 0;
    const step = () => {
      const now = ctx.currentTime;
      const drive = (bank: Bank, g: Grid, panByCol: boolean) => {
        if (panByCol) bank.pan.pan.setTargetAtTime((c / (COLS - 1)) * 1.8 - 0.9, now, 0.05);
        for (let r = 0; r < ROWS; r++) {
          const i = r * COLS + c;
          const amp = Math.pow(g.lum[i], 1.5) * 0.06;
          bank.gains[r].gain.setTargetAtTime(amp, now, 0.05);
          // Warm colours open the filter (brighter buzz); green and blue stay soft.
          bank.filters[r].frequency.setTargetAtTime(350 + g.warm[i] * 3200 + g.green[i] * 400, now, 0.05);
        }
      };
      drive(banks.current.a!, ga, mode === 'single');
      if (mode === 'pair' && banks.current.b && grids.current.b) drive(banks.current.b, grids.current.b, false);
      // Words for what the needle is over.
      let best = 0, bestR = 0;
      for (let r = 0; r < ROWS; r++) { const v = ga.lum[r * COLS + c]; if (v > best) { best = v; bestR = r; } }
      const lon = lonAt(c);
      const line = `${fmtLon(lon)} · loudest band ${fmtLat(latAt(bestR))}`;
      setReadout(line);
      if (c % 16 === 0) setSrText(`Needle at ${fmtLon(lon)}. Loudest near ${fmtLat(latAt(bestR))}.`);
      setCol(c);
      c = (c + 1) % COLS;
    };
    step();
    timer.current = window.setInterval(step, (SWEEP_SEC * 1000) / COLS);
  };

  const needle = `${((col + 0.5) / COLS) * 100}%`;
  const meta = mode === 'single' ? (userFile ? { title: userFile.name, what: 'Your image', credit: 'Uploaded by you' } : { title: lang === 'bn' ? frame.titleBn : frame.title, what: frame.what, credit: frame.credit }) : null;

  return (
    <section className="h-full overflow-y-auto px-4 sm:px-8 py-6" aria-labelledby="frames-title">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <h2 id="frames-title" className="font-display text-3xl sm:text-4xl font-extrabold">{t('framesTitle')}</h2>
          <p className="mt-2 max-w-[68ch] text-[var(--ink-2)]">{t('framesLead')}</p>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Mode">
            <button role="tab" aria-selected={mode === 'single'} className="btn" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>One image</button>
            <button role="tab" aria-selected={mode === 'pair'} className="btn" aria-pressed={mode === 'pair'} onClick={() => setMode('pair')}>{t('beforeAfter')}</button>
          </div>

          <div className="mt-4 relative rounded-xl overflow-hidden border border-[var(--line)] bg-black">
            {mode === 'pair' && <div className="absolute left-2 top-2 z-10 chip bg-black/70">◀ {pair.a.title}</div>}
            <canvas ref={viewA} className="w-full aspect-[2/1] block" aria-label={meta ? `${meta.title}. ${meta.what}` : pair.a.title} role="img" />
            {mode === 'pair' && (
              <div className="relative border-t border-[var(--line)]">
                <div className="absolute left-2 top-2 z-10 chip bg-black/70">{pair.b.title} ▶</div>
                <canvas ref={viewB} className="w-full aspect-[2/1] block" role="img" aria-label={pair.b.title} />
              </div>
            )}
            <div className="absolute top-0 bottom-0 w-[2px] bg-[var(--brass)] shadow-[0_0_14px_var(--brass)] pointer-events-none" style={{ left: needle, opacity: playing ? 1 : 0 }} />
            {status !== 'ready' && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 text-sm text-[var(--ink-2)] p-6 text-center">
                {status === 'loading' ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading NASA imagery from GIBS…</span>
                  : <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[var(--brass)]" /> NASA GIBS did not respond. Check the internet connection, or load an image file below.</span>}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={playing ? stop : start} disabled={status !== 'ready'} className="btn btn-brass min-w-[120px] disabled:opacity-50">
              {playing ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> {t('play')}</>}
            </button>
            {mode === 'single' && (
              <label className="btn cursor-pointer">
                <ImagePlus className="w-4 h-4" /> {t('loadOwn')}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUserFile(f); }} />
              </label>
            )}
            <span className="tnum text-sm text-[var(--ink-2)]" aria-hidden="true">{playing ? readout : ''}</span>
            <span className="sr-only" aria-live="polite">{playing ? srText : ''}</span>
          </div>
          {mode === 'pair' && <p className="mt-2 text-sm text-[var(--ink-3)]">{t('beforeAfterHint')}</p>}
          {meta && <p className="mt-3 text-sm text-[var(--ink-2)] max-w-[70ch]"><strong className="text-[var(--ink)]">{meta.title}.</strong> {meta.what} <span className="text-[var(--ink-3)]">Source: {meta.credit}.</span></p>}
        </div>

        <aside className="space-y-3" aria-label="Choose an image">
          {mode === 'single' ? (
            <>
              <div className="label">Live from NASA GIBS, same week as the Atlas data</div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {FRAMES.map((f) => (
                  <button key={f.id} onClick={() => { setUserFile(null); setFrameId(f.id); }} aria-pressed={!userFile && frameId === f.id}
                    className={`text-left rounded-lg border p-2 flex gap-3 items-center cursor-pointer transition ${!userFile && frameId === f.id ? 'border-[var(--brass)] bg-[var(--panel-2)]' : 'border-[var(--line)] hover:border-[#3b5a72]'}`}>
                    <img src={gibsUrl(f.overlayOn && f.id !== 'sstanom' ? f.layer : f.layer, f.date, f.format, 128)} alt="" loading="lazy" className="w-16 h-8 object-cover rounded bg-black shrink-0 hidden lg:block" />
                    <span className="text-sm leading-snug">{lang === 'bn' ? f.titleBn : f.title}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="label">Then and now</div>
              {PAIRS.map((p) => (
                <button key={p.id} onClick={() => setPairId(p.id)} aria-pressed={pairId === p.id}
                  className={`w-full text-left rounded-lg border p-3 text-sm cursor-pointer ${pairId === p.id ? 'border-[var(--brass)] bg-[var(--panel-2)]' : 'border-[var(--line)] hover:border-[#3b5a72]'}`}>{p.label}</button>
              ))}
            </>
          )}
          <div className="panel-solid p-3 text-sm text-[var(--ink-2)] leading-relaxed">
            <div className="font-semibold text-[var(--ink)] mb-1">How the image becomes sound</div>
            The image is a world map, so the needle travels west to east around the planet. Each of 12 bands is one pitch, north highest.
            Brighter pixels are louder. Red and orange pixels sound brighter and buzzier; blue and dark ones stay soft.
            This is sonification of the picture, so it tells you where the image is bright, not a measured value.
          </div>
        </aside>
      </div>
    </section>
  );
};
