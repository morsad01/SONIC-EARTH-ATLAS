import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, ImagePlus, Loader2, AlertTriangle, Repeat, BookOpen, Link2 } from 'lucide-react';
import { FRAMES, gibsUrl, loadFileCanvases, loadFrameCanvases, type NasaFrame } from '../lib/gibs';
import { EIC_FRAMES, EIC_STORY } from '../lib/eicFrames';
import { decodeShare, encodeShare } from '../lib/shareLink';
import { activeColumns, colAt, nextColumn, noteName, orderRange, rowAt, stepMs, timbreWord } from '../lib/frameSweep';
import { AudioContextManager } from '../audio/audioContext';
import { usePrefs, speak } from '../lib/prefs';
import { usePlaybackReport } from '../lib/playbackContext';

const ALL_FRAMES: NasaFrame[] = [...EIC_FRAMES, ...FRAMES];
const COLS = 128, ROWS = 12, SWEEP_SEC = 20;
const PENTA = [0, 2, 4, 7, 9];
// Top row (north) is the highest pitch, like the globe's latitude tilt.
const rowHz = (row: number) => { const i = ROWS - 1 - row; return 130.81 * Math.pow(2, (PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12); };

interface Grid { lum: Float32Array; warm: Float32Array; green: Float32Array; rgb: Uint8ClampedArray }
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
  return { lum, warm, green, rgb: px };
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
  { id: 'eic', label: 'EIC: greenhouse gases (left ear) → ocean heat (right ear)', a: EIC_FRAMES[0], b: EIC_FRAMES[1] },
  { id: 'sst', label: 'Ocean heat anomaly: Sep 2025 → Sep 2026', a: { ...FRAMES[3], date: '2025-09-30', title: '30 Sep 2025' }, b: { ...FRAMES[3], title: '30 Sep 2026' } },
  { id: 'veg', label: 'Vegetation: March → September 2026', a: { ...FRAMES[6], date: '2026-03-22', title: '22 Mar 2026' }, b: { ...FRAMES[6], title: '22 Sep 2026' } },
  { id: 'fire', label: 'Fires: 3 Oct 2025 → 3 Oct 2026', a: { ...FRAMES[1], date: '2025-10-03', title: '3 Oct 2025' }, b: { ...FRAMES[1], title: '3 Oct 2026' } },
];

interface JukeboxProps { autoPlay?: boolean; onAutoPlayed?: () => void; onPlay?: () => void }

export const FrameJukebox: React.FC<JukeboxProps> = ({ autoPlay, onAutoPlayed, onPlay }) => {
  const { t, lang, narration } = usePrefs();
  // A shared link (#v1&track=frames&...) restores the picture, the comparison and the needle.
  const [share] = useState(() => {
    const s = decodeShare(window.location.hash, { frames: ALL_FRAMES.map((f) => f.id), pairs: [...PAIRS.map((p) => p.id), 'custom'] });
    return s?.track === 'frames' ? s : null;
  });
  const pendingCol = useRef<number | null>(share?.col ?? null);
  const [mode, setMode] = useState<'single' | 'pair'>(share?.pair ? 'pair' : 'single');
  const [frameId, setFrameId] = useState(share?.frame ?? EIC_FRAMES[0].id);
  const [pairId, setPairId] = useState(share?.pair ?? PAIRS[0].id);
  const [customA, setCustomA] = useState(share?.a ?? EIC_FRAMES[0].id);
  const [customB, setCustomB] = useState(share?.b ?? EIC_FRAMES[1].id);
  const [story, setStory] = useState<number | null>(null);
  const [loadedFor, setLoadedFor] = useState('');
  const lastAnnounce = useRef(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playing, setPlaying] = useState(false);
  const [col, setCol] = useState(0);
  const [readout, setReadout] = useState('');
  const [srText, setSrText] = useState('');
  const [legend, setLegend] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [heard, setHeard] = useState<{ note: string; hz: number; level: number; color: string; timbre: string } | null>(null);
  const viewA = useRef<HTMLCanvasElement>(null), viewB = useRef<HTMLCanvasElement>(null);
  const grids = useRef<{ a: Grid | null; b: Grid | null }>({ a: null, b: null });
  const banks = useRef<{ a: Bank | null; b: Bank | null }>({ a: null, b: null });
  const timer = useRef<number | null>(null);
  const probeTimer = useRef<number | null>(null);
  const stepRef = useRef<() => void>(() => {});
  const endRef = useRef<() => void>(() => {});
  const savedLoop = useRef(true);
  const colRef = useRef(0);
  const [speed, setSpeedState] = useState(1);
  const [loop, setLoopState] = useState(true);
  const [region, setRegionState] = useState<[number, number] | null>(null);
  const speedRef = useRef(1), loopRef = useRef(true), regionRef = useRef<[number, number] | null>(null);
  const setSpeed = (v: number) => { speedRef.current = v; setSpeedState(v); };
  const setLoop = (v: boolean) => { loopRef.current = v; setLoopState(v); };
  const setRegion = (v: [number, number] | null) => { regionRef.current = v; setRegionState(v); };
  const frameBox = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x0: number; moved: boolean } | null>(null);

  const frame = ALL_FRAMES.find((f) => f.id === frameId)!;
  const pair = useMemo(() => pairId === 'custom'
    ? { id: 'custom', label: '', a: ALL_FRAMES.find((f) => f.id === customA)!, b: ALL_FRAMES.find((f) => f.id === customB)! }
    : PAIRS.find((p) => p.id === pairId)!, [pairId, customA, customB]);

  /** Timers and audio only; `stop` also flips the playing flag. */
  const silence = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (probeTimer.current) window.clearTimeout(probeTimer.current);
    probeTimer.current = null;
    disposeBank(banks.current.a); disposeBank(banks.current.b);
    banks.current = { a: null, b: null };
  }, []);
  const stop = useCallback(() => { silence(); setPlaying(false); }, [silence]);
  usePlaybackReport('frames', t('track2'), playing, stop);

  // A new selection resets the view during render (not in an effect); the effect below silences the audio and loads the images.
  const selKey = `${mode}|${frameId}|${pairId}|${customA}|${customB}`;
  const [prevSel, setPrevSel] = useState<{ key: string; file: File | null }>({ key: selKey, file: userFile });
  if (prevSel.key !== selKey || prevSel.file !== userFile) {
    setPrevSel({ key: selKey, file: userFile });
    setPlaying(false); setStatus('loading'); setCol(0); setRegionState(null); setReadout(''); setSrText(''); setHeard(null);
  }

  useEffect(() => {
    let cancelled = false;
    silence(); colRef.current = 0; regionRef.current = null;
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
          // Frames with a sound region start on the part that actually has sound, not on the silent margin.
          const live = !userFile && frame.soundRegion ? activeColumns(grids.current.a!.lum, COLS, ROWS) : null;
          if (live) { setRegion(live); colRef.current = live[0]; setCol(live[0]); }
        } else {
          const [a, b] = await Promise.all([loadFrameCanvases(pair.a), loadFrameCanvases(pair.b)]);
          if (cancelled) return;
          paint(viewA.current, a.display); paint(viewB.current, b.display);
          grids.current = { a: toGrid(a.sound), b: toGrid(b.sound) };
        }
        setStatus('ready');
        setLoadedFor(mode === 'single' && !userFile ? frame.id : '');
        if (pendingCol.current !== null) { colRef.current = pendingCol.current; setCol(pendingCol.current); pendingCol.current = null; }
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [mode, frameId, pairId, userFile, frame, pair, silence]);

  useEffect(() => () => stop(), [stop]);

  const geo = mode === 'pair' ? !pair.a.src : (!!userFile || !frame.src);
  const where = (c: number, r?: number) => {
    const x = geo ? fmtLon(lonAt(c)) : `${Math.round(((c + 0.5) / COLS) * 100)}% across`;
    if (r === undefined) return x;
    return `${x} · ${geo ? fmtLat(latAt(r)) : `band ${r + 1} of ${ROWS} from the top`}`;
  };

  const openBanks = (ctx: AudioContext, dest: AudioNode) => {
    banks.current.a = makeBank(ctx, dest);
    if (mode === 'pair') { banks.current.b = makeBank(ctx, dest); banks.current.a.pan.pan.value = -0.9; banks.current.b.pan.pan.value = 0.9; }
  };

  /** Sound one column of the picture (and move the needle there). */
  const driveCol = (ctx: AudioContext, c: number) => {
    const ga = grids.current.a, bank = banks.current.a;
    if (!ga || !bank) return;
    const now = ctx.currentTime;
    const drive = (bk: Bank, g: Grid, panByCol: boolean) => {
      if (panByCol) bk.pan.pan.setTargetAtTime((c / (COLS - 1)) * 1.8 - 0.9, now, 0.05);
      for (let r = 0; r < ROWS; r++) {
        const i = r * COLS + c;
        const amp = Math.pow(g.lum[i], 1.5) * 0.06;
        bk.gains[r].gain.setTargetAtTime(amp, now, 0.05);
        // Warm colours open the filter (brighter buzz); green and blue stay soft.
        bk.filters[r].frequency.setTargetAtTime(350 + g.warm[i] * 3200 + g.green[i] * 400, now, 0.05);
      }
    };
    drive(bank, ga, mode === 'single');
    if (mode === 'pair' && banks.current.b && grids.current.b) drive(banks.current.b, grids.current.b, false);
    setCol(c);
  };

  const describe = (c: number, r?: number) => {
    const ga = grids.current.a; if (!ga) return;
    let best = 0, bestR = 0;
    for (let rr = 0; rr < ROWS; rr++) { const v = ga.lum[rr * COLS + c]; if (v > best) { best = v; bestR = rr; } }
    const row = r ?? bestR;
    const level = Math.round(ga.lum[row * COLS + c] * 100);
    const line = r === undefined ? `${where(c)} · loudest band ${geo ? fmtLat(latAt(bestR)) : `${bestR + 1} from the top`}` : `${where(c, r)} · brightness ${level}%`;
    setReadout(line);
    const i = row * COLS + c;
    setHeard({ note: noteName(rowHz(row)), hz: Math.round(rowHz(row)), level, color: `rgb(${ga.rgb[i * 4]},${ga.rgb[i * 4 + 1]},${ga.rgb[i * 4 + 2]})`, timbre: timbreWord(ga.warm[i], ga.green[i]) });
    return line;
  };

  const start = async () => {
    if (!grids.current.a) return;
    let ctx: AudioContext;
    try {
      ctx = await AudioContextManager.init();
      if (ctx.state !== 'running') await ctx.resume();
    } catch { setAudioBlocked(true); return; }
    if (ctx.state !== 'running') { setAudioBlocked(true); return; }
    setAudioBlocked(false);
    onPlay?.();
    const dest = AudioContextManager.getMasterNode()!;
    if (probeTimer.current) window.clearTimeout(probeTimer.current);
    probeTimer.current = null;
    disposeBank(banks.current.a); disposeBank(banks.current.b);
    banks.current = { a: null, b: null };
    openBanks(ctx, dest);
    setPlaying(true);
    const [lo0, hi0] = regionRef.current ?? [0, COLS - 1];
    if (colRef.current < lo0 || colRef.current > hi0) colRef.current = lo0;
    stepRef.current = () => {
      const [lo, hi] = regionRef.current ?? [0, COLS - 1];
      const c = colRef.current;
      driveCol(ctx, c);
      const line = describe(c);
      if (c % 16 === 0 && line) setSrText(`Needle at ${where(c)}.`);
      const n = nextColumn(c, { lo, hi, loop: loopRef.current });
      if (n === null) { colRef.current = lo; stop(); endRef.current(); return; }
      colRef.current = n;
    };
    stepRef.current();
    timer.current = window.setInterval(() => stepRef.current(), stepMs(SWEEP_SEC, COLS, speedRef.current));
  };

  // "Listen now" from the landing page: play as soon as the first picture is ready.
  useEffect(() => {
    if (autoPlay && status === 'ready' && !timer.current) { onAutoPlayed?.(); start(); }
  }, [autoPlay, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // A new speed takes effect straight away, without restarting the sweep.
  useEffect(() => {
    if (!timer.current) return;
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => stepRef.current(), stepMs(SWEEP_SEC, COLS, speed));
  }, [speed]);

  /** Move the needle. While playing the sweep carries on from there; otherwise play a short probe so you can hear the spot. */
  const seek = async (c: number, r?: number) => {
    if (status !== 'ready') return;
    colRef.current = c;
    setCol(c);
    const line = describe(c, r);
    // Holding an arrow key moves the needle many times a second; announce at most once a second.
    if (line && Date.now() - lastAnnounce.current > 1000) { lastAnnounce.current = Date.now(); setSrText(line); }
    if (timer.current) { const ctx = AudioContextManager.getContext(); if (ctx) driveCol(ctx, c); return; }
    const ctx = await AudioContextManager.init();
    if (timer.current) return;
    if (!banks.current.a) openBanks(ctx, AudioContextManager.getMasterNode()!);
    driveCol(ctx, c);
    if (probeTimer.current) window.clearTimeout(probeTimer.current);
    probeTimer.current = window.setTimeout(() => {
      probeTimer.current = null;
      if (timer.current) return;
      disposeBank(banks.current.a); disposeBank(banks.current.b);
      banks.current = { a: null, b: null };
    }, 450);
  };

  // --- EIC story: one sweep per bundled frame, with a caption (spoken when narration is on). ---
  const endStory = () => {
    if (story === null) return;
    setStory(null); setLoop(savedLoop.current);
    try { window.speechSynthesis?.cancel(); } catch { /* speech unavailable */ }
    stop();
  };
  const goStory = (k: number) => {
    if (k >= EIC_STORY.length) { endStory(); return; }
    if (story === null) savedLoop.current = loopRef.current;
    setLoop(false); setMode('single'); setUserFile(null); setFrameId(EIC_STORY[k].frameId); setStory(k);
  };
  useEffect(() => { endRef.current = () => { if (story !== null) goStory(story + 1); }; });
  useEffect(() => {
    if (story === null || status !== 'ready' || timer.current) return;
    const step = EIC_STORY[story];
    if (loadedFor !== step.frameId || mode !== 'single') return;
    colRef.current = regionRef.current?.[0] ?? 0; setCol(colRef.current);
    if (narration) speak(lang === 'bn' ? step.bn : step.en, lang);
    start();
  }, [story, status, loadedFor]); // eslint-disable-line react-hooks/exhaustive-deps
  // Choosing anything by hand ends the story.
  const pickFrame = (id: string) => { endStory(); setUserFile(null); setFrameId(id); };
  const chooseMode = (m: 'single' | 'pair') => { endStory(); setMode(m); };

  const copyLink = async () => {
    const hash = encodeShare({ track: 'frames', ...(mode === 'pair' ? { pair: pairId, ...(pairId === 'custom' ? { a: customA, b: customB } : {}) } : { frame: frameId }), col, lang });
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    try { await navigator.clipboard.writeText(url); setCopied(t('linkCopied')); } catch { setCopied(url); }
    window.setTimeout(() => setCopied(null), 4000);
  };

  const fractionIn = (e: React.PointerEvent) => {
    const r = frameBox.current!.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };
  const onFrameDown = (e: React.PointerEvent) => {
    if (status !== 'ready') return;
    drag.current = { x0: e.clientX, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onFrameMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x0) < 8) return;
    d.moved = true;
    const r = frameBox.current!.getBoundingClientRect();
    const a = colAt((d.x0 - r.left) / r.width, COLS), b = colAt(fractionIn(e).fx, COLS);
    setRegion(orderRange(a, b, COLS));
  };
  const onFrameUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const { fx, fy } = fractionIn(e);
    if (d.moved) {
      const reg = regionRef.current;
      if (reg) { colRef.current = reg[0]; seek(reg[0]); }
      return;
    }
    // In "then and now" the two pictures are stacked, so the row is measured inside one of them.
    seek(colAt(fx, COLS), rowAt(mode === 'pair' ? (fy * 2) % 1 : fy, ROWS));
  };

  const needle = `${((col + 0.5) / COLS) * 100}%`;
  const meta = mode === 'single' ? (userFile ? { title: userFile.name, what: 'Your image', credit: 'Uploaded by you', url: undefined } : { title: lang === 'bn' ? frame.titleBn : frame.title, what: frame.what, credit: frame.credit, url: frame.sourceUrl }) : null;

  return (
    <section className="h-full overflow-y-auto px-4 sm:px-8 py-6" aria-labelledby="frames-title">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <h1 id="frames-title" className="font-display text-3xl sm:text-4xl font-extrabold">{t('framesTitle')}</h1>
          <p className="mt-2 max-w-[68ch] text-[var(--ink-2)]">{t('framesLead')}</p>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Mode">
            <button type="button" className="btn" aria-pressed={mode === 'single'} onClick={() => chooseMode('single')}>One image</button>
            <button type="button" className="btn" aria-pressed={mode === 'pair'} onClick={() => chooseMode('pair')}>{t('beforeAfter')}</button>
          </div>

          <div ref={frameBox} className="mt-4 relative rounded-xl overflow-hidden border border-[var(--line)] bg-black cursor-crosshair touch-pan-y select-none"
            onPointerDown={onFrameDown} onPointerMove={onFrameMove} onPointerUp={onFrameUp} onPointerCancel={() => { drag.current = null; }}>
            {mode === 'pair' && <div className="absolute left-2 top-2 z-10 chip bg-black/70">◀ {pair.a.title}</div>}
            <canvas ref={viewA} className="w-full aspect-[2/1] block" aria-label={meta ? `${meta.title}. ${meta.what}` : pair.a.title} role="img" />
            {mode === 'pair' && (
              <div className="relative border-t border-[var(--line)]">
                <div className="absolute left-2 top-2 z-10 chip bg-black/70">{pair.b.title} ▶</div>
                <canvas ref={viewB} className="w-full aspect-[2/1] block" role="img" aria-label={pair.b.title} />
              </div>
            )}
            {legend && status === 'ready' && (
              <div className="absolute inset-0 pointer-events-none text-[11px] leading-none text-white/90" aria-hidden="true">
                <div className="absolute left-1.5 top-1.5 bottom-1.5 flex flex-col items-center justify-between">
                  <span className="chip bg-black/70">▲ high</span>
                  <span className="w-[2px] flex-1 my-1 bg-gradient-to-b from-white/80 to-white/10" />
                  <span className="chip bg-black/70">▼ low</span>
                </div>
                <div className="absolute right-1.5 bottom-1.5 hidden sm:flex flex-wrap gap-1 justify-end max-w-[70%]">
                  <span className="chip bg-black/70">brighter = louder</span>
                  <span className="chip bg-black/70"><i className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: '#ff7a1a' }} />warm = buzzy</span>
                  <span className="chip bg-black/70"><i className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: '#2f7fd8' }} />cool = soft</span>
                </div>
              </div>
            )}
            {region && <div className="absolute top-0 bottom-0 pointer-events-none border-x-2 border-[var(--brass)] bg-[var(--brass)]/10" style={{ left: `${(region[0] / COLS) * 100}%`, width: `${((region[1] - region[0] + 1) / COLS) * 100}%` }} />}
            <div className="absolute top-0 bottom-0 w-[2px] bg-[var(--brass)] shadow-[0_0_14px_var(--brass)] pointer-events-none" style={{ left: needle, opacity: playing || status === 'ready' ? 1 : 0 }} />
            {status !== 'ready' && (
              <div className="absolute inset-0 grid place-items-center bg-black/60 text-sm text-[var(--ink-2)] p-6 text-center">
                {status === 'loading' ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {frame.src && !userFile ? 'Loading Earth Information Center image…' : 'Loading NASA imagery from GIBS…'}</span>
                  : (
                    <div className="flex flex-col items-center gap-3" role="alert">
                      <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[var(--brass)]" /> {frame.src && !userFile ? 'This picture could not be loaded.' : 'NASA GIBS did not respond. Check the internet connection, or load an image file below.'}</span>
                      {!(frame.src && !userFile) && <button className="btn btn-brass" onClick={() => { setMode('single'); setUserFile(null); setFrameId(EIC_FRAMES[0].id); }}>{t('tryEic')}</button>}
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={playing ? (story !== null ? endStory : stop) : start} disabled={status !== 'ready'} className="btn btn-brass min-w-[120px] disabled:opacity-50">
              {playing ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> {t('play')}</>}
            </button>
            {mode === 'single' && (
              <label className="btn cursor-pointer">
                <ImagePlus className="w-4 h-4" /> {t('loadOwn')}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUserFile(f); }} />
              </label>
            )}
            <button className="btn" aria-pressed={legend} onClick={() => setLegend(!legend)}>{t('legend')}</button>
            {mode === 'single' && !userFile && (story === null
              ? <button className="btn" disabled={status !== 'ready' && story === null} onClick={() => goStory(0)}><BookOpen className="w-4 h-4" /> {t('story')}</button>
              : <button className="btn" onClick={endStory}>{t('storyStop')}</button>)}
            <button className="btn" onClick={copyLink}><Link2 className="w-4 h-4" /> {t('shareLink')}</button>
            <span className="tnum text-sm text-[var(--ink-2)]" aria-hidden="true">{readout}</span>
            <span className="sr-only" aria-live="polite">{srText}</span>
          </div>

          {heard && (
            <div className="mt-3 panel-solid p-3 max-w-[70ch] flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" role="group" aria-label={t('nowHearing')}>
              <span className="label">{t('nowHearing')}</span>
              <span><strong className="tnum">{heard.note}</strong> <span className="text-[var(--ink-3)] tnum">{heard.hz} Hz</span></span>
              <span className="flex items-center gap-2">{t('loudness')}
                <span className="inline-block w-24 h-2 rounded bg-[var(--line)] overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={heard.level}>
                  <span className="block h-full bg-[var(--brass)]" style={{ width: `${heard.level}%` }} />
                </span>
                <span className="tnum text-[var(--ink-3)]">{heard.level}%</span>
              </span>
              <span className="flex items-center gap-2"><i className="inline-block w-4 h-4 rounded border border-white/30" style={{ background: heard.color }} aria-hidden="true" />{heard.timbre}</span>
            </div>
          )}

          {copied && <p role="status" className="mt-2 text-sm text-[var(--ink-2)] max-w-[70ch] break-all">{copied.startsWith('http') ? <input readOnly value={copied} onFocus={(e) => e.currentTarget.select()} aria-label={t('shareLink')} className="w-full bg-transparent border border-[var(--line)] rounded px-2 py-1" /> : copied}</p>}
          {story !== null && (
            <div className="mt-3 panel-solid p-3 max-w-[70ch]" aria-live="polite">
              <div className="label">{story + 1} / {EIC_STORY.length}</div>
              <p className="mt-1 text-sm text-[var(--ink)]">{lang === 'bn' ? EIC_STORY[story].bn : EIC_STORY[story].en}</p>
              <button className="btn mt-2" onClick={() => goStory(story + 1)}>{t('storyNext')}</button>
            </div>
          )}
          {audioBlocked && <p role="alert" className="mt-3 text-sm text-[var(--brass)] max-w-[70ch]">{t('audioBlocked')}</p>}

          <div className="mt-3 max-w-[70ch]">
            <label htmlFor="frame-scrub" className="label">{t('scrub')}</label>
            <input id="frame-scrub" type="range" min={0} max={COLS - 1} value={col} disabled={status !== 'ready'}
              onChange={(e) => seek(+e.target.value)} aria-valuetext={where(col)} aria-describedby="frame-scrub-hint"
              className="w-full accent-[var(--brass)] disabled:opacity-50" />
            <p id="frame-scrub-hint" className="text-xs text-[var(--ink-3)]">{t('scrubHint')} {t('regionHint')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className="btn" aria-pressed={loop} onClick={() => setLoop(!loop)}><Repeat className="w-4 h-4" /> {t('loop')}</button>
              <span className="label" id="frame-speed">{t('speed')}</span>
              <div role="group" aria-labelledby="frame-speed" className="flex gap-1">
                {[0.5, 1, 2].map((v) => <button key={v} className="btn" aria-pressed={speed === v} onClick={() => setSpeed(v)}>{v}×</button>)}
              </div>
              <button className="btn" disabled={status !== 'ready'} onClick={() => { const [, hi] = regionRef.current ?? [0, COLS - 1]; setRegion(orderRange(col, Math.max(hi, col), COLS)); }}>{t('loopStart')}</button>
              <button className="btn" disabled={status !== 'ready'} onClick={() => { const [lo] = regionRef.current ?? [0, COLS - 1]; setRegion(orderRange(Math.min(lo, col), col, COLS)); }}>{t('loopEnd')}</button>
              {region && <button className="btn" onClick={() => setRegion(null)}>{t('clearRegion')}</button>}
            </div>
          </div>
          {mode === 'pair' && <p className="mt-2 text-sm text-[var(--ink-3)]">{t('beforeAfterHint')}</p>}
          {mode === 'single' && !userFile && (
            <details className="mt-3 max-w-[70ch] text-sm text-[var(--ink-2)]">
              <summary className="cursor-pointer font-semibold text-[var(--ink)]">{t('describeFrame')}</summary>
              <p className="mt-2 leading-relaxed">{(lang === 'bn' ? frame.longBn : frame.longEn) ?? `${lang === 'bn' ? frame.titleBn : frame.title}. ${frame.what}`}</p>
            </details>
          )}
          <details className="mt-3 max-w-[70ch] text-sm text-[var(--ink-2)]">
            <summary className="cursor-pointer font-semibold text-[var(--ink)]">{t('whatHearing')}</summary>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>{t('hearNeedle')}</li>
              <li>{t('hearPitch')}</li>
              <li>{t('hearLoud')}</li>
              <li>{t('hearColour')}</li>
              <li>{t('hearScrub')}</li>
            </ul>
          </details>
          {meta && <p className="mt-3 text-sm text-[var(--ink-2)] max-w-[70ch]"><strong className="text-[var(--ink)]">{meta.title}.</strong> {meta.what} <span className="text-[var(--ink-3)]">Source: {meta.credit}.</span>{meta.url && <> <a href={meta.url} target="_blank" rel="noreferrer" className="underline text-[var(--brass)]">See it on earth.gov</a></>}</p>}
        </div>

        <section className="space-y-3" aria-label="Choose an image">
          {mode === 'single' ? (
            <>
              <div className="label">{t('eicGroup')}</div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {EIC_FRAMES.map((f) => (
                  <button key={f.id} onClick={() => pickFrame(f.id)} aria-pressed={!userFile && frameId === f.id}
                    className={`text-left rounded-lg border p-2 flex gap-3 items-center cursor-pointer transition ${!userFile && frameId === f.id ? 'border-[var(--brass)] bg-[var(--panel-2)]' : 'border-[var(--line)] hover:border-[#3b5a72]'}`}>
                    <img src={f.src} alt="" loading="lazy" className="w-16 h-8 object-cover rounded bg-black shrink-0 hidden lg:block" />
                    <span className="text-sm leading-snug">{lang === 'bn' ? f.titleBn : f.title}</span>
                  </button>
                ))}
              </div>
              <div className="label pt-2">Live from NASA GIBS, same week as the Atlas data</div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {FRAMES.map((f) => (
                  <button key={f.id} onClick={() => pickFrame(f.id)} aria-pressed={!userFile && frameId === f.id}
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
              <button onClick={() => setPairId('custom')} aria-pressed={pairId === 'custom'}
                className={`w-full text-left rounded-lg border p-3 text-sm cursor-pointer ${pairId === 'custom' ? 'border-[var(--brass)] bg-[var(--panel-2)]' : 'border-[var(--line)] hover:border-[#3b5a72]'}`}>{t('chooseAny')}</button>
              {pairId === 'custom' && (
                <div className="space-y-2">
                  {([['leftEar', customA, setCustomA], ['rightEar', customB, setCustomB]] as const).map(([k, val, setVal]) => (
                    <label key={k} className="block text-sm">
                      <span className="label">{t(k)}</span>
                      <select value={val} onChange={(e) => setVal(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] p-2 text-[var(--ink)]">
                        <optgroup label={t('eicGroup')}>{EIC_FRAMES.map((f) => <option key={f.id} value={f.id}>{lang === 'bn' ? f.titleBn : f.title}</option>)}</optgroup>
                        <optgroup label="NASA GIBS">{FRAMES.map((f) => <option key={f.id} value={f.id}>{lang === 'bn' ? f.titleBn : f.title}</option>)}</optgroup>
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="panel-solid p-3 text-sm text-[var(--ink-2)] leading-relaxed">
            <div className="font-semibold text-[var(--ink)] mb-1">How the image becomes sound</div>
            The image is a world map, so the needle travels west to east around the planet. Each of 12 bands is one pitch, north highest.
            Brighter pixels are louder. Red and orange pixels sound brighter and buzzier; blue and dark ones stay soft.
            This is sonification of the picture, so it tells you where the image is bright, not a measured value.
            On Earth Information Center charts, the titles, axis labels and legends are muted so the sound follows the data. Other text inside a picture can still make sound.
          </div>
        </section>
      </div>
    </section>
  );
};
