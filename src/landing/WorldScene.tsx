import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { easeK } from '../globe/framing';
import { WORLDS, type WorldId } from './worlds';
import { dotCanvas, type Dot } from './dotLayer';

interface Props {
  /** The carousel stage: the canvas fills it, and each `.world-sphere[data-world]` inside it says where its planet goes. */
  stage: RefObject<HTMLElement | null>;
  dots: Partial<Record<WorldId, readonly Dot[]>>;
  onFail: () => void;
}

const FOV = 22, CAM_Z = 12, MAX_R = 9;
const ATMOS_VS = 'varying vec3 vN; void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const ATMOS_FS = 'uniform float uDim; varying vec3 vN; void main() { float i = pow(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(0.25, 0.6, 1.0, 1.0) * i * 1.15 * uDim; }';

/**
 * The landing carousel's four Earths in 3D: one WebGL canvas, four lit planets (Blue Marble colour, relief and specular maps, a moving cloud layer,
 * an atmosphere rim and the track's data points on the surface). Layout stays in CSS: every frame each planet follows its invisible anchor
 * (`.world-sphere`, moved by the level / carousel transitions), so the 3D scene and the text can never drift apart. Level 3's anchor grows past
 * the screen, so the camera ends up skimming the surface: a real dive into the planet.
 */
export function WorldScene({ stage, dots, onFail }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const overlays = useRef<Map<WorldId, THREE.Mesh>>(new Map());
  const dirty = useRef(true); // something changed that the next frame must draw, even when nothing moves
  const failRef = useRef(onFail);
  useEffect(() => { failRef.current = onFail; }, [onFail]);

  useEffect(() => {
    const el = host.current, root = stage.current, ov = overlays.current;
    if (!el || !root) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { failRef.current(); return; }
    // Software GL (no GPU: SwiftShader, llvmpipe) gets a light scene and ~20 fps, so the page stays responsive.
    const ctx = renderer.getContext(), info = ctx.getExtension('WEBGL_debug_renderer_info');
    const soft = /swiftshader|llvmpipe|software/i.test(String(info ? ctx.getParameter(info.UNMASKED_RENDERER_WEBGL) : ''));
    const light = soft || window.matchMedia('(max-width: 640px)').matches;
    const tex = light ? 1024 : 2048, seg = soft ? 32 : light ? 48 : 72, minFrame = soft ? 50 : 0;
    renderer.setPixelRatio(soft ? 1 : Math.min(window.devicePixelRatio, light ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(renderer.domElement);
    const lost = (e: Event) => { e.preventDefault(); failRef.current(); };
    renderer.domElement.addEventListener('webglcontextlost', lost);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 100);
    camera.position.set(0, 0, CAM_Z);
    scene.add(new THREE.AmbientLight(0x7a9cd0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff8e7, 2.6); sun.position.set(-7, 3.5, 4.5); scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x38bdf8, 0x02040a, 0.35));
    const rim = new THREE.DirectionalLight(0x0088ff, 0.9); rim.position.set(6, -2, -4); scene.add(rim);

    const loader = new THREE.TextureLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
    const load = (f: string, srgb = false) => { const t = loader.load(`/textures/${f}`); t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
    const map = load(`earth_atmos_${tex}.jpg`, true), clouds = load('earth_clouds_1024.png', true);
    const textures: THREE.Texture[] = [map, clouds];
    const sphere = new THREE.SphereGeometry(1, seg, seg), shell = new THREE.SphereGeometry(1.012, seg, seg), dotShell = new THREE.SphereGeometry(1.004, seg, seg), halo = new THREE.SphereGeometry(1.03, 48, 48);
    const disposables: { dispose: () => void }[] = [sphere, shell, dotShell, halo];

    const planets = WORLDS.map((w) => {
      const group = new THREE.Group();
      group.rotation.z = 0.41; // Earth's axial tilt
      const spin = new THREE.Group();
      spin.rotation.y = -w.face * Math.PI * 2;
      group.add(spin);
      const tint = new THREE.Color(w.tint3d);
      const surface = new THREE.MeshPhongMaterial({ map, color: tint.clone(), specular: new THREE.Color(0x26384a), shininess: 38, normalScale: new THREE.Vector2(0.85, 0.85) });
      const cloudMat = new THREE.MeshPhongMaterial({ map: clouds, transparent: true, opacity: 0.85, depthWrite: false });
      const atmos = new THREE.ShaderMaterial({ vertexShader: ATMOS_VS, fragmentShader: ATMOS_FS, uniforms: { uDim: { value: 1 } }, blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false });
      const overlay = new THREE.Mesh(dotShell, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, visible: false }));
      const cloudMesh = new THREE.Mesh(shell, cloudMat);
      spin.add(new THREE.Mesh(sphere, surface), overlay, cloudMesh);
      group.add(new THREE.Mesh(halo, atmos));
      group.visible = false;
      scene.add(group);
      ov.set(w.id, overlay);
      disposables.push(surface, cloudMat, atmos, overlay.material as THREE.Material);
      const anchor = root.querySelector<HTMLElement>(`.world-sphere[data-world="${w.id}"]`);
      return { w, group, spin, cloudMesh, surface, cloudMat, atmos, tint, anchor, x: 0, y: 0, r: 0, op: -1, ready: false };
    });

    // Relief and specular maps only shade the surface: fetch them when the browser is idle.
    const idle = typeof window.requestIdleCallback === 'function';
    const detail = () => {
      const spec = load(`earth_specular_${tex}.jpg`), normal = load(`earth_normal_${tex}.jpg`);
      textures.push(spec, normal);
      for (const p of planets) { p.surface.specularMap = spec; p.surface.normalMap = normal; p.surface.needsUpdate = true; }
      spec.onUpdate = normal.onUpdate = () => { dirty.current = true; };
    };
    const later = idle ? window.requestIdleCallback(detail, { timeout: 1500 }) : window.setTimeout(detail, 600);

    let W = 1, H = 1, unit = 1; // world units per CSS pixel at the planets' depth
    const resize = () => {
      dirty.current = true;
      W = Math.max(1, root.clientWidth); H = Math.max(1, root.clientHeight);
      renderer.setSize(W, H, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camera.aspect = W / H; camera.updateProjectionMatrix();
      unit = (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / H;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(root);
    let onScreen = true;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }) : null;
    io?.observe(root);

    // The active planet leans a little towards the pointer (off with reduced motion / calm background).
    const ptr = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => { ptr.x = (e.clientX / window.innerWidth) * 2 - 1; ptr.y = (e.clientY / window.innerHeight) * 2 - 1; };
    window.addEventListener('pointermove', onPointer, { passive: true });
    const still = () => document.documentElement.classList.contains('rm') || document.documentElement.classList.contains('calm');
    let raf = 0, last = 0;
    map.onUpdate = clouds.onUpdate = () => { dirty.current = true; }; // redraw once the textures arrive
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      if (document.hidden || !onScreen || now - last < minFrame) return;
      const dt = Math.min(100, now - last);
      last = now;
      let moved = false;
      const box = root.getBoundingClientRect(), calm = still(), level = root.dataset.level ?? '1';
      const k = calm ? 1 : easeK(dt, level === '3' ? 160 : 240), kOp = calm ? 1 : easeK(dt, 220), edge = W / 2;
      // Spin: a slow turn at the hero anchor, a clear continuous rotation in the split view, a slow drift once we are inside.
      const spinRate = level === '2' ? 0.0045 : level === '3' ? 0.0006 : 0.0012;
      for (const p of planets) {
        if (!p.anchor) continue;
        const a = p.anchor.getBoundingClientRect(), opT = Number(getComputedStyle(p.anchor).opacity) || 0;
        const tx = (a.left + a.width / 2 - box.left - W / 2) * unit, ty = -(a.top + a.height / 2 - box.top - H / 2) * unit, tr = Math.min(MAX_R, (a.width / 2) * unit);
        if (!p.ready) { p.x = tx; p.y = ty; p.r = tr; p.op = opT; p.ready = true; moved = true; } // first frame: no fly-in from the centre
        // Carousel sweep: a planet waiting out of frame on one side enters from the side it is heading to (never across the screen).
        const out = Math.abs(p.x / unit) > edge + p.r / unit;
        if (out && Math.sign(tx) !== Math.sign(p.x) && Math.abs(tx / unit) < edge + tr / unit) { p.x = Math.sign(tx || 1) * (edge + tr / unit + 4) * unit; p.y = ty; p.r = tr; }
        if (Math.abs(tx - p.x) + Math.abs(ty - p.y) + Math.abs(tr - p.r) > 1e-4 || Math.abs(opT - p.op) > 1e-3) moved = true;
        p.op += (opT - p.op) * kOp;
        const op = p.op;
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k; p.r += (tr - p.r) * k;
        p.group.visible = op > 0.01 && p.r > 0.001 && Math.abs(p.x / unit) < edge + p.r / unit + 2;
        if (!p.group.visible) continue;
        p.group.position.set(p.x, p.y, 0);
        p.group.scale.setScalar(p.r);
        p.surface.color.copy(p.tint).multiplyScalar(op);
        p.cloudMat.opacity = 0.85 * op;
        p.atmos.uniforms.uDim.value = op;
        const active = p.anchor.dataset.pos === 'active', lean = active && !calm && level !== '3' ? 0.18 : 0, ke = calm ? 1 : easeK(dt, 400);
        p.group.rotation.x += (ptr.y * lean - p.group.rotation.x) * ke;
        p.group.rotation.y += (ptr.x * lean - p.group.rotation.y) * ke;
        if (!calm && active) { p.spin.rotation.y += spinRate * (dt / 16.7); p.cloudMesh.rotation.y += spinRate * 0.35 * (dt / 16.7); moved = true; }
      }
      if (moved || dirty.current) { renderer.render(scene, camera); dirty.current = false; } // nothing moves under reduced motion: no redraw
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (idle) window.cancelIdleCallback(later as number); else window.clearTimeout(later as number);
      ro?.disconnect(); io?.disconnect();
      window.removeEventListener('pointermove', onPointer);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      for (const o of ov.values()) (o.material as THREE.MeshBasicMaterial).map?.dispose();
      ov.clear();
      disposables.forEach((d) => d.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [stage]);

  // The data points: redrawn when the data arrives (fires come with the first snapshot, cities with the monsoon file).
  useEffect(() => {
    for (const w of WORLDS) {
      const mesh = overlays.current.get(w.id);
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshBasicMaterial, c = dotCanvas(dots[w.id] ?? [], w.dotColor);
      mat.map?.dispose();
      mat.map = c ? new THREE.CanvasTexture(c) : null;
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.visible = !!c; mat.needsUpdate = true;
      dirty.current = true;
    }
  }, [dots]);

  return <div ref={host} className="world-gl" />;
}
