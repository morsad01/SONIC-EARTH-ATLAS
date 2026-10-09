import { RotateCcw } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { usePrefs } from '../lib/prefs';
import { framingTarget, idleSpin, type Framing } from './framing';
import { findCountrySync, latLonToXYZ, outlineSegments, xyzToLatLon, type Country } from '../countries/countries';
import { countryLabel } from '../lib/placesBn';

interface GlobeCanvasProps {
  observations: EarthObservation[];
  enabledPhenomena: Record<PhenomenonType, boolean>;
  selectedObservation: EarthObservation | null;
  onSelectObservation: (obs: EarthObservation | null) => void;
  autoRotate?: boolean;
  targetFocus?: { lat: number; lon: number } | null;
  imageryUrl?: string | null;
  onPickPlace?: (p: { lat: number; lon: number }) => void;
  pickedPlace?: { lat: number; lon: number } | null;
  framing?: Framing;
  countries?: Country[]; // borders for hover/click selection
  country?: Country | null; // selected: brass outline
  countryPoint?: { lat: number; lon: number } | null; // fly-to target
  onSelectCountry?: (c: Country) => void;
}

// Selected outline is drawn as stacked rings just above the surface (WebGL lines are 1 px, this reads as one thicker line).
const OUTLINE_R = [2.012, 2.015, 2.018];
function makeOutline(c: Country, color: number, radii: number[], opacity: number) {
  const g = new THREE.Group();
  for (const r of radii) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(outlineSegments(c, r), 3));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })));
  }
  return g;
}
function disposeGroup(g: THREE.Group) {
  g.children.forEach((o) => { const m = o as THREE.LineSegments; m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
}

export const GlobeCanvas: React.FC<GlobeCanvasProps> = ({
  observations,
  enabledPhenomena,
  selectedObservation,
  onSelectObservation,
  autoRotate = false,
  targetFocus = null,
  imageryUrl = null,
  onPickPlace,
  pickedPlace = null,
  framing = 'explore',
  countries,
  country = null,
  countryPoint = null,
  onSelectCountry,
}) => {
  const { reduceMotion, lang, t } = usePrefs();
  const flyRef = useRef<{ lat: number; lon: number; until: number } | null>(null);
  const selOutlineRef = useRef<THREE.Group | null>(null);
  const hoverOutlineRef = useRef<THREE.Group | null>(null);
  const geoContainsRef = useRef<Parameters<typeof findCountrySync>[0] | null>(null);
  const hoverIdRef = useRef<string | null>(null);
  const lastHoverRef = useRef(0);
  const [hoverCountry, setHoverCountry] = useState<{ c: Country; x: number; y: number } | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const pinRef = useRef<THREE.Mesh | null>(null);
  const downPosRef = useRef({ x: 0, y: 0 });
  const earthMatRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const baseMapRef = useRef<THREE.Texture | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredObs, setHoveredObs] = useState<EarthObservation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // References to keep across re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const soundWavesGroupRef = useRef<THREE.Group | null>(null);
  const markerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const waveMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Mouse & Focus interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(autoRotate);
  const targetFocusRef = useRef(targetFocus);
  const selectedObservationRef = useRef(selectedObservation);
  const framingRef = useRef(framing);
  const reduceRef = useRef(reduceMotion);
  const frameRef = useRef(framingTarget(framing, 1.6)); // eased toward every frame
  // Keep the latest props where the animation loop and event handlers can read them.
  useLayoutEffect(() => {
    autoRotateRef.current = autoRotate;
    targetFocusRef.current = targetFocus;
    selectedObservationRef.current = selectedObservation;
    framingRef.current = framing;
    reduceRef.current = reduceMotion;
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    frameRef.current = framingTarget(framingRef.current, width / height);
    camera.position.set(0, 0, frameRef.current.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    // Phones and data-saver users get smaller textures, a lighter sphere and a lower pixel ratio.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const light = window.matchMedia('(max-width: 640px)').matches || !!nav.connection?.saveData;
    const texSize = light ? 1024 : 2048, segments = light ? 32 : 64;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, light ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Deep Space & Cosmic Starfield Background ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 110;
      starPositions[i + 1] = (Math.random() - 0.5) * 110;
      starPositions[i + 2] = -15 - Math.random() * 50;

      // Color variation: cyan, deep space blue, warm white, cosmic purple
      const c = Math.random();
      if (c > 0.85) {
        starColors[i] = 0.49; starColors[i + 1] = 0.83; starColors[i + 2] = 0.98; // Cyan
      } else if (c > 0.65) {
        starColors[i] = 0.75; starColors[i + 1] = 0.52; starColors[i + 2] = 0.99; // Purple
      } else if (c > 0.4) {
        starColors[i] = 0.25; starColors[i + 1] = 0.55; starColors[i + 2] = 0.95; // Blue
      } else {
        starColors[i] = 0.98; starColors[i + 1] = 0.96; starColors[i + 2] = 0.92; // Warm White
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // --- Globe Group ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;
    globeGroup.position.set(frameRef.current.x, frameRef.current.y, 0);

    // Realistic Earth Sphere (100% Opaque, Solid Earth surface)
    const earthRadius = 2.0;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, segments, segments);
    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const load = (f: string, srgb = false) => {
      const t = loader.load(`/textures/${f}`);
      t.anisotropy = maxAniso;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const earthTexture = load(`earth_atmos_${texSize}.jpg`, true);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specularMap: load(`earth_specular_${texSize}.jpg`),
      normalMap: load(`earth_normal_${texSize}.jpg`),
      normalScale: new THREE.Vector2(0.85, 0.85),
      specular: new THREE.Color(0x4a6a8a),
      shininess: 22,
    });
    earthMatRef.current = earthMaterial;
    baseMapRef.current = earthTexture;
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;
    // Pin for "Hear any place"
    const pin = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.075, 32), new THREE.MeshBasicMaterial({ color: 0xe9c46a, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
    pin.visible = false;
    globeGroup.add(pin);
    pinRef.current = pin;

    // Revolving Atmospheric Cloud Sphere Layer (Clean & Transparent)
    const cloudGeometry = new THREE.SphereGeometry(earthRadius * 1.008, segments, segments);
    const cloudTexture = load('earth_clouds_1024.png', true);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudMesh);
    cloudMeshRef.current = cloudMesh;

    // Volumetric Atmospheric Horizon Glow Shader Layer
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.018, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.25, 0.6, 1.0, 1.0) * intensity * 1.1;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // Markers & Sound Waves Groups
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    const soundWavesGroup = new THREE.Group();
    globeGroup.add(soundWavesGroup);
    soundWavesGroupRef.current = soundWavesGroup;

    // --- Planetarium Directional Sun Lighting ---
    const ambientLight = new THREE.AmbientLight(0x7a9cd0, 1.05);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.4);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x02040a, 0.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x0088ff, 0.85);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // --- Animation Loop ---
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const reduce = reduceRef.current;
      // Revolving cloud layer rotation (non-essential, off with reduced motion)
      if (cloudMeshRef.current && !reduce) {
        cloudMeshRef.current.rotation.y += 0.00045;
      }

      // Ease the framing (landing stages / Atlas). Reduced motion jumps.
      const ft = frameRef.current, k = reduce ? 1 : 0.06;
      globeGroup.position.x += (ft.x - globeGroup.position.x) * k;
      globeGroup.position.y += (ft.y - globeGroup.position.y) * k;
      camera.position.z += (ft.z - camera.position.z) * k;

      // Smooth camera interpolation toward guided demo target region
      const fly = flyRef.current && performance.now() < flyRef.current.until ? flyRef.current : null; // runs until it arrives (or the safety timeout)
      if ((targetFocusRef.current || fly) && !isDraggingRef.current && globeGroupRef.current) {
        const target = (targetFocusRef.current ?? fly)!;
        const targetY = -(target.lon + 90) * (Math.PI / 180); // turns lon to face the camera (+z)
        const targetX = Math.max(-0.65, Math.min(0.65, target.lat * (Math.PI / 180)));

        let diffY = (targetY - globeGroupRef.current.rotation.y) % (Math.PI * 2);
        if (diffY > Math.PI) diffY -= Math.PI * 2;
        if (diffY < -Math.PI) diffY += Math.PI * 2;

        const kf = reduce ? 1 : 0.045;
        globeGroupRef.current.rotation.y += diffY * kf;
        globeGroupRef.current.rotation.x += (targetX - globeGroupRef.current.rotation.x) * kf;
        if (fly && Math.abs(diffY) < 0.004 && Math.abs(targetX - globeGroupRef.current.rotation.x) < 0.004) flyRef.current = null;
      } else if (autoRotateRef.current && !isDraggingRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += idleSpin(framingRef.current, reduce);
      }

      // Synchronize visual acoustic emission beacons on Earth surface with Web Audio active voices
      const voiceDetails = SonificationEngine.getInstance().getActiveVoiceDetails();
      waveMeshesRef.current.forEach((mesh, obsId) => {
        const voiceInfo = voiceDetails.get(obsId);
        if (voiceInfo) {
          mesh.visible = true;
          const elapsedSec = (performance.now() - voiceInfo.startedAt) / 1000;

          // Pulse expansion rhythm based on intensity
          const pulseScale = 1.0 + ((elapsedSec * (1.8 + voiceInfo.intensity * 2.0)) % 1.6);
          const opacity = Math.max(0, 0.95 - (pulseScale - 1.0) / 1.6);

          mesh.scale.set(pulseScale, pulseScale, 1);
          (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
        } else {
          const isSelected = selectedObservationRef.current?.id === obsId;
          if (isSelected) {
            mesh.visible = true;
            mesh.scale.set(1.4, 1.4, 1);
            (mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
          } else {
            mesh.visible = false;
          }
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      frameRef.current = framingTarget(framingRef.current, w / h);
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      if (selOutlineRef.current) disposeGroup(selOutlineRef.current);
      if (hoverOutlineRef.current) disposeGroup(hoverOutlineRef.current);
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      cloudTexture.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  // --- New framing: set the target; the loop eases toward it ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !el.clientHeight) return;
    frameRef.current = framingTarget(framing, el.clientWidth / el.clientHeight);
  }, [framing]);

  // --- Pin position for the picked place ---
  useEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;
    if (!pickedPlace) { pin.visible = false; return; }
    const [x, y, z] = latLonToXYZ(pickedPlace.lat, pickedPlace.lon, 2.03);
    pin.position.set(x, y, z);
    pin.lookAt(x * 2, y * 2, z * 2);
    pin.visible = true;
  }, [pickedPlace]);

  // --- d3-geo's geoContains, loaded once for hover/click lookups ---
  useEffect(() => { let on = true; import('d3-geo').then((m) => { if (on) geoContainsRef.current = m.geoContains as never; }); return () => { on = false; }; }, []);

  // --- Selected country: brass outline, and a fly-to (a jump with reduced motion, see the animation loop) ---
  useEffect(() => {
    const gg = globeGroupRef.current;
    if (!gg) return;
    if (selOutlineRef.current) { gg.remove(selOutlineRef.current); disposeGroup(selOutlineRef.current); selOutlineRef.current = null; }
    if (!country) return;
    const o = makeOutline(country, 0xe9c46a, OUTLINE_R, 1);
    gg.add(o); selOutlineRef.current = o;
  }, [country]);
  useEffect(() => {
    if (countryPoint) flyRef.current = { ...countryPoint, until: performance.now() + 12000 };
  }, [countryPoint]);

  // --- Hover country: thin cyan outline ---
  useEffect(() => {
    const gg = globeGroupRef.current;
    if (!gg) return;
    if (hoverOutlineRef.current) { gg.remove(hoverOutlineRef.current); disposeGroup(hoverOutlineRef.current); hoverOutlineRef.current = null; }
    if (!hoverCountry || hoverCountry.c.id === country?.id) return;
    const o = makeOutline(hoverCountry.c, 0x7dd3fc, [2.011], 0.9);
    gg.add(o); hoverOutlineRef.current = o;
  }, [hoverCountry, country]);

  // --- Optional NASA GIBS imagery of the selected day as the globe surface ---
  useEffect(() => {
    const mat = earthMatRef.current;
    if (!mat) return;
    if (!imageryUrl) {
      if (baseMapRef.current) { mat.map = baseMapRef.current; mat.needsUpdate = true; }
      if (cloudMeshRef.current) cloudMeshRef.current.visible = true;
      return;
    }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(imageryUrl, (tex) => {
      if (cancelled) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace;
      mat.map = tex; mat.needsUpdate = true;
      if (cloudMeshRef.current) cloudMeshRef.current.visible = false; // real clouds are already in the image
    });
    return () => { cancelled = true; };
  }, [imageryUrl]);

  // --- Observation Markers & Wave Rings Re-rendering ---
  useEffect(() => {
    if (!markersGroupRef.current || !soundWavesGroupRef.current) return;
    const markersGroup = markersGroupRef.current;
    const wavesGroup = soundWavesGroupRef.current;

    // Clear existing markers and wave rings
    while (markersGroup.children.length > 0) {
      const obj = markersGroup.children[0];
      markersGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    }
    while (wavesGroup.children.length > 0) {
      const obj = wavesGroup.children[0];
      wavesGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    }
    markerMeshesRef.current.clear();
    waveMeshesRef.current.clear();

    const earthRadius = 2.0;

    // Filter visible observations
    const visibleObs = observations.filter((o) => enabledPhenomena[o.phenomenon]);

    visibleObs.forEach((obs) => {
      // Calculate 3D position from lat/lon
      const [x, y, z] = latLonToXYZ(obs.latitude, obs.longitude, earthRadius);

      // Color mapping
      let colorHex = 0xff7a3d;
      if (obs.phenomenon === 'precipitation') colorHex = 0x4cc3ff;
      else if (obs.phenomenon === 'sst') colorHex = obs.value >= 0 ? 0xf25c8a : 0x5b8cff;

      const markerRadius = 0.022 + obs.normalizedValue * 0.04;
      const markerGeo = new THREE.SphereGeometry(markerRadius, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: colorHex,
      });

      const isSelected = selectedObservation?.id === obs.id;
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(x * 1.025, y * 1.025, z * 1.025);
      if (isSelected) {
        markerMesh.scale.set(1.8, 1.8, 1.8);
      }
      markerMesh.userData = { observation: obs };
      markersGroup.add(markerMesh);
      markerMeshesRef.current.set(obs.id, markerMesh);

      // Add visual acoustic sound rings radiating from data source
      const ringGeo = new THREE.RingGeometry(0.04, 0.055, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.6,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      // Soft halo so markers read as glowing points, not plastic beads
      const haloGeo = new THREE.CircleGeometry(markerRadius * 2.4, 24);
      const haloMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(x * 1.021, y * 1.021, z * 1.021);
      halo.lookAt(x * 2, y * 2, z * 2);
      wavesGroup.add(halo);
      ringMesh.position.set(x * 1.028, y * 1.028, z * 1.028);
      ringMesh.lookAt(x * 2, y * 2, z * 2);
      ringMesh.visible = false; // Initially dormant; driven dynamically by audio voice state
      wavesGroup.add(ringMesh);
      waveMeshesRef.current.set(obs.id, ringMesh);
    });
  }, [observations, enabledPhenomena, selectedObservation]);

  // --- Mouse & Touch Controls ---
  /** Surface lat/lon under a screen point, or null when it misses the globe. */
  const hitLatLon = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !cameraRef.current || !earthMeshRef.current || !globeGroupRef.current) return null;
    const rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), cameraRef.current);
    const hit = rc.intersectObject(earthMeshRef.current)[0];
    if (!hit) return null;
    const local = globeGroupRef.current.worldToLocal(hit.point.clone()).normalize();
    return xyzToLatLon(local.x, local.y, local.z);
  };
  const countryAt = (clientX: number, clientY: number) => {
    const ll = hitLatLon(clientX, clientY), gc = geoContainsRef.current;
    return ll && gc && countries ? findCountrySync(gc, countries, ll.lat, ll.lon) : null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    flyRef.current = null; // the user took over
    downPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current && globeGroupRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      globeGroupRef.current.rotation.y += deltaX * 0.005;
      globeGroupRef.current.rotation.x += deltaY * 0.005;
      // Clamp vertical tilt
      globeGroupRef.current.rotation.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, globeGroupRef.current.rotation.x));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast for hover tooltip
    if (!rendererRef.current || !cameraRef.current || !markersGroupRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(markersGroupRef.current.children);

    if (intersects.length > 0) {
      const obs = intersects[0].object.userData.observation as EarthObservation;
      setHoveredObs(obs);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredObs(null);
      setTooltipPos(null);
      // No marker under the pointer: outline the country there (mouse only, throttled; touch has no hover)
      if (countries && e.pointerType === 'mouse') {
        const now = performance.now();
        if (now - lastHoverRef.current > 70) {
          lastHoverRef.current = now;
          const c = countryAt(e.clientX, e.clientY);
          if (c?.id !== hoverIdRef.current) { hoverIdRef.current = c?.id ?? null; setHoverCountry(c ? { c, x: e.clientX - rect.left, y: e.clientY - rect.top } : null); }
          else if (c) setHoverCountry({ c, x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current || !markersGroupRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(markersGroupRef.current.children);

    if (intersects.length > 0) {
      const obs = intersects[0].object.userData.observation as EarthObservation;
      onSelectObservation(obs);
      // Immediately trigger sonification of this clicked point
      SonificationEngine.getInstance().playObservation(obs);
      return;
    }
    // Empty spot on Earth (and not the end of a drag): pick that place
    const moved = Math.hypot(e.clientX - downPosRef.current.x, e.clientY - downPosRef.current.y);
    if (!onPickPlace || moved > 6 || !earthMeshRef.current || !globeGroupRef.current) return;
    const ll = hitLatLon(e.clientX, e.clientY);
    if (!ll) return;
    const c = countryAt(e.clientX, e.clientY);
    if (c) onSelectCountry?.(c);
    onPickPlace({ lat: Math.round(ll.lat * 100) / 100, lon: Math.round(ll.lon * 100) / 100 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const zoomFactor = e.deltaY * 0.003;
    const z = Math.max(3.6, Math.min(Math.max(9.0, frameRef.current.z), frameRef.current.z + zoomFactor));
    frameRef.current = { ...frameRef.current, z };
    cameraRef.current.position.z = z;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      {onSelectCountry && (
        <button type="button" className="btn panel absolute z-20 left-1/2 -translate-x-1/2 top-[236px] sm:top-3 min-h-[40px]" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); flyRef.current = { lat: 0, lon: 0, until: performance.now() + 12000 }; frameRef.current = framingTarget(framingRef.current, (containerRef.current?.clientWidth ?? 1) / (containerRef.current?.clientHeight || 1)); }}>
          <RotateCcw className="w-4 h-4" aria-hidden="true" />{t('resetView')}
        </button>
      )}
      {hoverCountry && !hoveredObs && (
        <div className="absolute z-30 pointer-events-none px-2.5 py-1.5 rounded-lg panel-solid shadow-2xl text-sm -translate-x-1/2 -translate-y-full" style={{ left: hoverCountry.x, top: hoverCountry.y - 14 }}>
          {t('countryHover', { name: countryLabel(hoverCountry.c.id, hoverCountry.c.name, lang) })}
        </div>
      )}
      {/* Dynamic Hover Tooltip */}
      {hoveredObs && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none p-2.5 rounded-lg panel-solid shadow-2xl text-sm -translate-x-1/2 -translate-y-full"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 12}px` }}
        >
          <div className="font-semibold flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  hoveredObs.phenomenon === 'fire'
                    ? '#ff7a3d'
                    : hoveredObs.phenomenon === 'precipitation'
                    ? '#4cc3ff'
                    : '#f25c8a',
              }}
            />
            {hoveredObs.regionName || hoveredObs.variable}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            {hoveredObs.value} {hoveredObs.unit} · {hoveredObs.variable}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {String(hoveredObs.metadata?.cell ?? `${hoveredObs.latitude}°, ${hoveredObs.longitude}°`)} · click to hear
          </div>
        </div>
      )}


    </div>
  );
};
