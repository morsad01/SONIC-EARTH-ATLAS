import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { ZoomIn, ZoomOut, RotateCcw, Volume2, Navigation } from 'lucide-react';

interface Accessible2DMapProps {
  observations: EarthObservation[];
  enabledPhenomena: Record<PhenomenonType, boolean>;
  selectedObservation: EarthObservation | null;
  onSelectObservation: (obs: EarthObservation | null) => void;
}

export const Accessible2DMap: React.FC<Accessible2DMapProps> = ({
  observations,
  enabledPhenomena,
  selectedObservation,
  onSelectObservation,
}) => {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState<{ lat: number; lon: number }>({ lat: 0, lon: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter observations to currently enabled layers
  const visibleObs = observations.filter((o) => enabledPhenomena[o.phenomenon]);

  // Convert container pixel coordinate to Lat/Lon
  const pixelToGeo = useCallback((px: number, py: number, width: number, height: number) => {
    // Account for zoom and panOffset
    const centerX = width / 2;
    const centerY = height / 2;

    const unshiftedX = (px - centerX - panOffset.x) / zoom + centerX;
    const unshiftedY = (py - centerY - panOffset.y) / zoom + centerY;

    const lon = (unshiftedX / width) * 360 - 180;
    const lat = 90 - (unshiftedY / height) * 180;
    return {
      lat: Math.max(-90, Math.min(90, lat)),
      lon: Math.max(-180, Math.min(180, lon)),
    };
  }, [panOffset.x, panOffset.y, zoom]);

  // Find nearest observation to coordinates
  const findNearestObservation = useCallback((lat: number, lon: number): EarthObservation | null => {
    if (visibleObs.length === 0) return null;
    let closest = visibleObs[0];
    let minD = Infinity;
    for (const obs of visibleObs) {
      const dLat = obs.latitude - lat;
      const dLon = obs.longitude - lon;
      const dist = dLat * dLat + dLon * dLon;
      if (dist < minD) {
        minD = dist;
        closest = obs;
      }
    }
    return closest;
  }, [visibleObs]);

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 5;
    let newLat = crosshair.lat;
    let newLon = crosshair.lon;

    if (e.key === 'ArrowUp') {
      newLat = Math.min(90, crosshair.lat + step);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      newLat = Math.max(-90, crosshair.lat - step);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      newLon = Math.max(-180, crosshair.lon - step);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      newLon = Math.min(180, crosshair.lon + step);
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const nearest = findNearestObservation(crosshair.lat, crosshair.lon);
      if (nearest) {
        onSelectObservation(nearest);
        SonificationEngine.getInstance().playObservation(nearest);
      }
      return;
    } else {
      return;
    }

    setCrosshair({ lat: newLat, lon: newLon });
    const nearest = findNearestObservation(newLat, newLon);
    if (nearest) {
      onSelectObservation(nearest);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const geo = pixelToGeo(px, py, rect.width, rect.height);
    setCrosshair(geo);

    const nearest = findNearestObservation(geo.lat, geo.lon);
    if (nearest) {
      onSelectObservation(nearest);
      SonificationEngine.getInstance().playObservation(nearest);
    }
  };

  // Sync crosshair when selectedObservation changes externally
  useEffect(() => {
    if (selectedObservation) {
      setCrosshair({
        lat: selectedObservation.latitude,
        lon: selectedObservation.longitude,
      });
    }
  }, [selectedObservation]);

  const nearestActive = findNearestObservation(crosshair.lat, crosshair.lon);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      className="relative w-full h-full overflow-hidden bg-slate-950 select-none outline-none focus:ring-1 focus:ring-cyan-500/50"
      aria-label="Accessible 2D Equirectangular Auditory Map. Use arrow keys to navigate coordinates and press Enter or Space to hear data."
      role="application"
    >
      {/* Zoom / Pan Navigation Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-lg shadow-xl backdrop-blur-md">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(3.5, z + 0.3));
          }}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(1, z - 0.3));
          }}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title="Reset Map View"
          aria-label="Reset Map View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Coordinate & Audio Focus Crosshair Status HUD */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-mono">
        <div className="text-slate-400 flex items-center gap-1.5 mb-1 font-sans text-xs font-semibold">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>AUDIO FOCUS POINT</span>
        </div>
        <div className="text-slate-100 flex items-center gap-2">
          <span>Lat: {crosshair.lat >= 0 ? `+${crosshair.lat.toFixed(1)}°N` : `${crosshair.lat.toFixed(1)}°S`}</span>
          <span className="text-slate-500">|</span>
          <span>Lon: {crosshair.lon >= 0 ? `+${crosshair.lon.toFixed(1)}°E` : `${crosshair.lon.toFixed(1)}°W`}</span>
        </div>
        <div className="text-[11px] text-cyan-400/90 mt-1 flex items-center gap-1.5">
          <Volume2 className="w-3 h-3" />
          <span>Stereo Pan: {(crosshair.lon / 180).toFixed(2)} ({-crosshair.lon > 0 ? 'Left' : 'Right'})</span>
        </div>
        {nearestActive && (
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-slate-300">
            <span className="text-slate-400">Nearest Observation: </span>
            <span className="font-semibold text-white">{nearestActive.regionName}</span>
            <span className="ml-1 text-cyan-300">({nearestActive.value} {nearestActive.unit})</span>
          </div>
        )}
      </div>

      {/* Keyboard Controls Accessible Help */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded text-[11px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
        <span className="text-cyan-400 font-bold">Arrow Keys</span>: Move audio focus • <span className="text-cyan-400 font-bold">Enter/Space</span>: Listen
      </div>

      {/* Map Content Layer with Transform */}
      <div
        className="w-full h-full relative origin-center transition-transform duration-75"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        }}
      >
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          {/* Deep Space / Ocean Background */}
          <rect x="0" y="0" width="1000" height="500" fill="#040b17" />

          {/* Graticule Grid */}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <line
              key={`lat-${lat}`}
              x1="0"
              y1={((90 - lat) / 180) * 500}
              x2="1000"
              y2={((90 - lat) / 180) * 500}
              stroke={lat === 0 ? 'rgba(70, 160, 240, 0.4)' : 'rgba(70, 130, 180, 0.15)'}
              strokeWidth={lat === 0 ? 1.5 : 0.8}
              strokeDasharray={lat === 0 ? '' : '4, 6'}
            />
          ))}
          {[-120, -60, 0, 60, 120].map((lon) => (
            <line
              key={`lon-${lon}`}
              x1={((lon + 180) / 360) * 1000}
              y1="0"
              x2={((lon + 180) / 360) * 1000}
              y2="500"
              stroke={lon === 0 ? 'rgba(70, 160, 240, 0.4)' : 'rgba(70, 130, 180, 0.15)'}
              strokeWidth={lon === 0 ? 1.5 : 0.8}
              strokeDasharray={lon === 0 ? '' : '4, 6'}
            />
          ))}

          {/* Continental Outlines (Equirectangular polygons) */}
          {/* North America */}
          <polygon
            points="70,50 300,50 380,120 320,180 250,220 220,260 210,310 170,260 120,200 90,140 70,50"
            fill="#132438"
            stroke="#23456b"
            strokeWidth="1.2"
          />
          {/* South America */}
          <polygon
            points="300,260 360,280 400,320 380,390 320,440 280,480 270,410 280,340 300,260"
            fill="#132438"
            stroke="#23456b"
            strokeWidth="1.2"
          />
          {/* Eurasia */}
          <polygon
            points="480,60 880,60 920,130 830,190 750,230 650,230 580,210 500,160 480,90 480,60"
            fill="#132438"
            stroke="#23456b"
            strokeWidth="1.2"
          />
          {/* Africa */}
          <polygon
            points="480,170 580,180 630,230 630,290 580,370 540,400 500,360 460,250 480,170"
            fill="#132438"
            stroke="#23456b"
            strokeWidth="1.2"
          />
          {/* Australia */}
          <polygon
            points="810,330 910,330 920,390 890,420 820,410 800,360 810,330"
            fill="#132438"
            stroke="#23456b"
            strokeWidth="1.2"
          />
          {/* Antarctica */}
          <polygon
            points="0,470 1000,470 1000,500 0,500"
            fill="#182c44"
            stroke="#284e78"
            strokeWidth="1"
          />

          {/* Sound-Source Observation Markers */}
          {visibleObs.map((obs) => {
            const cx = ((obs.longitude + 180) / 360) * 1000;
            const cy = ((90 - obs.latitude) / 180) * 500;
            const isSelected = selectedObservation?.id === obs.id;

            let color = '#ff4d00';
            if (obs.phenomenon === 'precipitation') color = '#00d0ff';
            else if (obs.phenomenon === 'sst') color = obs.value >= 0 ? '#bf5af2' : '#0077ff';

            const baseRadius = 6 + obs.normalizedValue * 8;

            return (
              <g
                key={obs.id}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObservation(obs);
                  SonificationEngine.getInstance().playObservation(obs);
                }}
              >
                {/* Visual acoustic radiating ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={baseRadius * 1.8}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={isSelected ? '0.9' : '0.4'}
                  className="animate-ping"
                  style={{ animationDuration: `${2.5 - obs.normalizedValue * 1.2}s` }}
                />

                {/* Core observation beacon */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={baseRadius}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? '2.5' : '1'}
                  opacity="0.9"
                />

                {/* Label on selection or high intensity */}
                {(isSelected || obs.normalizedValue > 0.8) && (
                  <text
                    x={cx + baseRadius + 4}
                    y={cy + 4}
                    fill="#ffffff"
                    fontSize="11"
                    fontFamily="monospace"
                    className="select-none pointer-events-none drop-shadow"
                  >
                    {obs.value} {obs.unit}
                  </text>
                )}
              </g>
            );
          })}

          {/* Audio Focus Reticle / Crosshair */}
          <g>
            <circle
              cx={((crosshair.lon + 180) / 360) * 1000}
              cy={((90 - crosshair.lat) / 180) * 500}
              r="16"
              fill="none"
              stroke="#00ffff"
              strokeWidth="2"
              strokeDasharray="4, 3"
              className="animate-spin"
              style={{ animationDuration: '8s' }}
            />
            <line
              x1={((crosshair.lon + 180) / 360) * 1000 - 24}
              y1={((90 - crosshair.lat) / 180) * 500}
              x2={((crosshair.lon + 180) / 360) * 1000 + 24}
              y2={((90 - crosshair.lat) / 180) * 500}
              stroke="#00ffff"
              strokeWidth="1.5"
            />
            <line
              x1={((crosshair.lon + 180) / 360) * 1000}
              y1={((90 - crosshair.lat) / 180) * 500 - 24}
              x2={((crosshair.lon + 180) / 360) * 1000}
              y2={((90 - crosshair.lat) / 180) * 500 + 24}
              stroke="#00ffff"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
