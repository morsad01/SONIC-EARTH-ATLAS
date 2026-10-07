import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { createProceduralEarthTexture, createProceduralCloudTexture } from './earthTextureGenerator';
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
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
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
    renderer.toneMappingExposure = 1.25;
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

    // Realistic Earth Sphere
    const earthRadius = 2.0;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.45,
      metalness: 0.15,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Revolving Atmospheric Cloud Sphere Layer
    const cloudGeometry = new THREE.SphereGeometry(earthRadius * 1.008, 64, 64);
    const cloudTexture = createProceduralCloudTexture();
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.45,
      roughness: 0.9,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudMesh);
    cloudMeshRef.current = cloudMesh;

    // Volumetric Atmospheric Horizon Glow Shader Layer
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.025, 64, 64);
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
          gl_FragColor = vec4(0.22, 0.65, 0.98, 1.0) * intensity * 0.95;
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
    const ambientLight = new THREE.AmbientLight(0x071329, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 2.2);
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

      // Revolving cloud layer rotation
      if (cloudMeshRef.current) {
        cloudMeshRef.current.rotation.y += 0.0003;
      }

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
      ringMesh.position.set(x * 1.028, y * 1.028, z * 1.028);
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
    const zoomFactor = e.deltaY * 0.003;
    cameraRef.current.position.z = Math.max(3.6, Math.min(9.0, cameraRef.current.position.z + zoomFactor));
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
      {/* Dynamic Hover Tooltip */}
      {hoveredObs && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none p-2.5 rounded-lg bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md text-white text-xs font-mono animate-fade-in -translate-x-1/2 -translate-y-full"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 12}px` }}
        >
          <div className="font-bold text-cyan-300 flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
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
          <div className="text-[11px] text-slate-300 mt-0.5">
            {hoveredObs.value} {hoveredObs.unit} (Norm: {hoveredObs.normalizedValue.toFixed(2)})
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {hoveredObs.latitude.toFixed(1)}°, {hoveredObs.longitude.toFixed(1)}° • Click to sonify
          </div>
        </div>
      )}

      {/* Touch & Keyboard Navigation Hint Overlay */}
      <div className="absolute bottom-3 left-4 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800/60 backdrop-blur-sm hidden sm:block">
        <span>Drag to rotate Earth • Scroll to zoom • Click point to explore</span>
      </div>
    </div>
  );
};
