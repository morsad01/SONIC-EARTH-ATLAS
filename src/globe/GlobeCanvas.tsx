import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { createProceduralEarthTexture } from './earthTextureGenerator';
import { SonificationEngine } from '../audio/sonificationEngine';

interface GlobeCanvasProps {
  observations: EarthObservation[];
  enabledPhenomena: Record<PhenomenonType, boolean>;
  selectedObservation: EarthObservation | null;
  onSelectObservation: (obs: EarthObservation | null) => void;
  autoRotate?: boolean;
  targetFocus?: { lat: number; lon: number } | null;
}

export const GlobeCanvas: React.FC<GlobeCanvasProps> = ({
  observations,
  enabledPhenomena,
  selectedObservation,
  onSelectObservation,
  autoRotate = false,
  targetFocus = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredObs, setHoveredObs] = useState<EarthObservation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // References to keep across re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const soundWavesGroupRef = useRef<THREE.Group | null>(null);
  const markerMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const waveMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Mouse & Focus interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const targetFocusRef = useRef(targetFocus);
  targetFocusRef.current = targetFocus;
  const selectedObservationRef = useRef(selectedObservation);
  selectedObservationRef.current = selectedObservation;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Starfield Background ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = -15 - Math.random() * 40;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x88aacc,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // --- Globe Group ---
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Earth Sphere
    const earthRadius = 2.0;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Subtle Atmospheric Glow Layer
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.025, 48, 48);
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0) * intensity * 0.75;
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

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xddeeff, 1.4);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x0055ff, 0.6);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // --- Animation Loop ---
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation toward guided demo target region
      if (targetFocusRef.current && !isDraggingRef.current && globeGroupRef.current) {
        const target = targetFocusRef.current;
        const targetY = -target.lon * (Math.PI / 180);
        const targetX = Math.max(-0.65, Math.min(0.65, target.lat * (Math.PI / 180)));

        let diffY = (targetY - globeGroupRef.current.rotation.y) % (Math.PI * 2);
        if (diffY > Math.PI) diffY -= Math.PI * 2;
        if (diffY < -Math.PI) diffY += Math.PI * 2;

        globeGroupRef.current.rotation.y += diffY * 0.045;
        globeGroupRef.current.rotation.x += (targetX - globeGroupRef.current.rotation.x) * 0.045;
      } else if (autoRotateRef.current && !isDraggingRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.0015;
      }

      // Synchronize visual acoustic beacon rings and pin highlights with actively playing voices
      const activeVoices = SonificationEngine.getInstance().getActiveVoiceDetails();
      const now = performance.now();

      waveMeshesRef.current.forEach((ringMesh, obsId) => {
        const voice = activeVoices.get(obsId);
        const markerMesh = markerMeshesRef.current.get(obsId);
        const isSelected = selectedObservationRef.current?.id === obsId;

        if (voice) {
          // Actively producing sound: show synchronized pulsing acoustic wave
          ringMesh.visible = true;
          const elapsedSec = (now - voice.startedAt) * 0.001;

          // Pulse rhythm tied to actual phenomenon dynamics:
          // Fire: crackle burst rhythm (~2.4 Hz)
          // Rain: precipitation droplet cadence (~1.9 Hz)
          // Ocean: slow thermal glissando swell (~0.8 Hz)
          const pulseFreq = voice.phenomenon === 'fire' ? 2.4 : voice.phenomenon === 'precipitation' ? 1.9 : 0.8;
          const phase = (elapsedSec * pulseFreq) % 1.0;

          // Expanding acoustic ring
          const maxExpand = 1.5 + voice.intensity * 1.2;
          const ringScale = 1.0 + phase * maxExpand;
          ringMesh.scale.set(ringScale, ringScale, 1);
          const ringMat = ringMesh.material as THREE.MeshBasicMaterial;
          ringMat.opacity = Math.max(0, (0.75 + voice.intensity * 0.25) * (1.0 - phase));

          // Highlight geographic pin beacon
          if (markerMesh) {
            const beaconPulse = Math.sin(phase * Math.PI * 2) * 0.25;
            const baseScale = isSelected ? 1.8 : 1.0;
            const pulseScale = baseScale * (1.1 + beaconPulse * (0.2 + voice.intensity * 0.35));
            markerMesh.scale.setScalar(pulseScale);
          }
        } else {
          // Voice is silent/stopped: hide ring completely and return pin to resting scale
          ringMesh.visible = false;
          if (markerMesh) {
            markerMesh.scale.setScalar(isSelected ? 1.8 : 1.0);
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync refs when props change
  useEffect(() => {
    targetFocusRef.current = targetFocus;
  }, [targetFocus]);

  useEffect(() => {
    selectedObservationRef.current = selectedObservation;
  }, [selectedObservation]);

  // --- Update Markers & Sound Waves when Observations or Active Phenomena change ---
  useEffect(() => {
    const markersGroup = markersGroupRef.current;
    const wavesGroup = soundWavesGroupRef.current;
    if (!markersGroup || !wavesGroup) return;

    // Clear old markers
    while (markersGroup.children.length > 0) {
      const obj = markersGroup.children[0];
      markersGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
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
      const phi = (90 - obs.latitude) * (Math.PI / 180);
      const theta = (obs.longitude + 180) * (Math.PI / 180);

      const x = -earthRadius * Math.sin(phi) * Math.sin(theta);
      const y = earthRadius * Math.cos(phi);
      const z = earthRadius * Math.sin(phi) * Math.cos(theta);

      // Color mapping
      let colorHex = 0xff4d00;
      if (obs.phenomenon === 'precipitation') colorHex = 0x00d0ff;
      else if (obs.phenomenon === 'sst') colorHex = obs.value >= 0 ? 0xbf5af2 : 0x0077ff;

      const markerRadius = 0.035 + obs.normalizedValue * 0.035;
      const markerGeo = new THREE.SphereGeometry(markerRadius, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: colorHex,
      });

      const isSelected = selectedObservation?.id === obs.id;
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(x * 1.015, y * 1.015, z * 1.015);
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
      ringMesh.position.set(x * 1.018, y * 1.018, z * 1.018);
      ringMesh.lookAt(x * 2, y * 2, z * 2);
      ringMesh.visible = false; // Initially dormant; driven dynamically by audio voice state
      wavesGroup.add(ringMesh);
      waveMeshesRef.current.set(obs.id, ringMesh);
    });
  }, [observations, enabledPhenomena, selectedObservation]);

  // --- Mouse & Touch Controls ---
  const handlePointerDown = (e: React.PointerEvent) => {
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
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(3.2, Math.min(9.0, cameraRef.current.position.z + e.deltaY * 0.004));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-slate-950"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
      role="region"
      aria-label="3D Interactive Earth Sonification Globe"
    >
      {/* Floating HUD Tooltip */}
      {hoveredObs && tooltipPos && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-700 text-xs shadow-2xl backdrop-blur-md"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  hoveredObs.phenomenon === 'fire'
                    ? '#ff4d00'
                    : hoveredObs.phenomenon === 'precipitation'
                    ? '#00d0ff'
                    : '#bf5af2',
              }}
            />
            {hoveredObs.regionName || hoveredObs.variable}
          </div>
          <div className="text-slate-300 font-mono mt-1">
            {hoveredObs.value} {hoveredObs.unit}
            {hoveredObs.delta !== undefined && (
              <span className={`ml-2 text-[10px] ${hoveredObs.delta >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                (Δ {hoveredObs.delta > 0 ? `+${hoveredObs.delta.toFixed(1)}` : hoveredObs.delta.toFixed(1)})
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Lat: {hoveredObs.latitude.toFixed(2)}° | Lon: {hoveredObs.longitude.toFixed(2)}° (Pan: {(hoveredObs.longitude / 180).toFixed(2)})
          </div>
          <div className="text-[9px] text-cyan-400 mt-1 italic">Click to focus & hear location</div>
        </div>
      )}

      {/* Mini orientation/interaction hint */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[11px] font-mono text-slate-400/80 bg-slate-900/60 backdrop-blur-sm px-2.5 py-1.5 rounded border border-slate-800 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Drag to rotate Earth • Scroll to zoom • Click markers to hear</span>
      </div>
    </div>
  );
};
