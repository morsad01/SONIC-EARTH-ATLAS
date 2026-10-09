import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { EarthObservation, PhenomenonType } from '../types/dataset';
import { SonificationEngine } from '../audio/sonificationEngine';
import { findCountrySync, outlinePath, type Country } from '../countries/countries';
import { useGeoContains } from '../countries/useGeoContains';
import { usePrefs } from '../lib/prefs';
import { countryLabel } from '../lib/placesBn';
import { ZoomIn, ZoomOut, RotateCcw, Volume2, Navigation } from 'lucide-react';

interface Accessible2DMapProps {
  observations: EarthObservation[];
  enabledPhenomena: Record<PhenomenonType, boolean>;
  selectedObservation: EarthObservation | null;
  onSelectObservation: (obs: EarthObservation | null) => void;
  countries?: Country[];
  country?: Country | null;
  onSelectCountry?: (c: Country) => void;
}

export const Accessible2DMap: React.FC<Accessible2DMapProps> = ({
  observations,
  enabledPhenomena,
  selectedObservation,
  onSelectObservation,
  countries,
  country = null,
  onSelectCountry,
}) => {
  const { t, lang } = usePrefs();
  const geoContains = useGeoContains();
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState<{ lat: number; lon: number }>(() => (selectedObservation ? { lat: selectedObservation.latitude, lon: selectedObservation.longitude } : { lat: 0, lon: 0 }));
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

  // Country under a point (null over open ocean, or until borders have loaded)
  const countryAt = useCallback((lat: number, lon: number) => (geoContains && countries ? findCountrySync(geoContains, countries, lat, lon) : null), [geoContains, countries]);

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
    } else if (e.key.toLowerCase() === 'c' && onSelectCountry) {
      e.preventDefault();
      const c = countryAt(crosshair.lat, crosshair.lon);
      if (c) onSelectCountry(c);
      return;
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

    const c = onSelectCountry ? countryAt(geo.lat, geo.lon) : null;
    if (c) onSelectCountry?.(c);

    const nearest = findNearestObservation(geo.lat, geo.lon);
    if (nearest) {
      onSelectObservation(nearest);
      SonificationEngine.getInstance().playObservation(nearest);
    }
  };

  // Sync crosshair when selectedObservation changes externally (adjusted during render, not in an effect)
  const [prevSel, setPrevSel] = useState(selectedObservation);
  if (selectedObservation !== prevSel) {
    setPrevSel(selectedObservation);
    if (selectedObservation) setCrosshair({ lat: selectedObservation.latitude, lon: selectedObservation.longitude });
  }

  const nearestActive = findNearestObservation(crosshair.lat, crosshair.lon);
  const focusCountry = useMemo(() => countryAt(crosshair.lat, crosshair.lon), [countryAt, crosshair.lat, crosshair.lon]);
  const selPath = useMemo(() => (country ? outlinePath(country) : ''), [country]);
  const lblPt = country ? { x: ((country.bbox[0] <= country.bbox[2] ? (country.bbox[0] + country.bbox[2]) / 2 : 180) + 180) / 360 * 1000, y: (90 - (country.bbox[1] + country.bbox[3]) / 2) / 180 * 500 } : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      className="relative w-full h-full overflow-hidden bg-[#071019] select-none outline-none"
      aria-label={t('mapLabel')}
      role="application"
    >
      {/* Zoom / Pan Navigation Toolbar */}
      <div className="absolute top-16 right-3 z-20 flex flex-col gap-1.5 panel p-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(3.5, z + 0.3));
          }}
          className="p-2 text-[var(--ink-2)] hover:text-white hover:bg-[var(--panel-2)] rounded transition"
          title={t('zoomIn')}
          aria-label={t('zoomIn')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(1, z - 0.3));
          }}
          className="p-2 text-[var(--ink-2)] hover:text-white hover:bg-[var(--panel-2)] rounded transition"
          title={t('zoomOut')}
          aria-label={t('zoomOut')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="p-2 text-[var(--ink-2)] hover:text-white hover:bg-[var(--panel-2)] rounded transition"
          title={t('resetMap')}
          aria-label={t('resetMap')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Coordinate & Audio Focus Crosshair Status HUD */}
      <div className="hidden md:block absolute top-16 right-16 z-20 panel px-3.5 py-2.5 text-xs max-w-[260px]">
        <div className="text-[var(--ink-3)] flex items-center gap-1.5 mb-1 font-sans text-xs font-semibold">
          <Navigation className="w-3.5 h-3.5 text-[var(--rain)]" />
          <span>Keyboard focus point · arrows move, Enter listens{onSelectCountry ? ', C selects the country' : ''}</span>
        </div>
        <div className="text-[var(--ink)] flex items-center gap-2">
          <span>Lat: {crosshair.lat >= 0 ? `+${crosshair.lat.toFixed(1)}°N` : `${crosshair.lat.toFixed(1)}°S`}</span>
          <span className="text-[var(--ink-3)]">|</span>
          <span>Lon: {crosshair.lon >= 0 ? `+${crosshair.lon.toFixed(1)}°E` : `${crosshair.lon.toFixed(1)}°W`}</span>
        </div>
        <div className="text-2xs text-[var(--rain)] mt-1 flex items-center gap-1.5">
          <Volume2 className="w-3 h-3" />
          <span>Stereo Pan: {(crosshair.lon / 180).toFixed(2)} ({-crosshair.lon > 0 ? 'Left' : 'Right'})</span>
        </div>
        {onSelectCountry && countries && (
          <div className="mt-1.5 text-2xs text-[var(--ink-2)]" aria-live="polite">
            <span className="text-[var(--ink-3)]">{t('countryUnderFocus')}: </span>
            <span className="font-semibold text-white">{focusCountry ? countryLabel(focusCountry.id, focusCountry.name, lang) : t('countryOcean')}</span>
            {focusCountry && focusCountry.id !== country?.id && <span className="text-[var(--rain)]"> · {t('countrySelectKey')}</span>}
          </div>
        )}
        {nearestActive && (
          <div className="mt-2 pt-1.5 border-t border-[var(--line)] text-2xs text-[var(--ink-2)]">
            <span className="text-[var(--ink-3)]">{t('nearestObs')} </span>
            <span className="font-semibold text-white">{nearestActive.regionName}</span>
            <span className="ml-1 text-[var(--rain)]">({nearestActive.value} {nearestActive.unit})</span>
          </div>
        )}
      </div>

      {/* Keyboard Controls Accessible Help */}


      {/* Map Content Layer with Transform */}
      <div
        className="w-full h-full relative origin-center transition-transform duration-75"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        }}
      >
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Deep Space / Ocean Background */}
          <rect x="0" y="0" width="1000" height="500" fill="#040b17" />
          <image href="/textures/earth_atmos_2048.jpg" x="0" y="0" width="1000" height="500" preserveAspectRatio="none" opacity="0.9" />
          <rect x="0" y="0" width="1000" height="500" fill="#020817" opacity="0.28" />

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

          {/* Sound-Source Observation Markers */}
          {visibleObs.map((obs) => {
            const cx = ((obs.longitude + 180) / 360) * 1000;
            const cy = ((90 - obs.latitude) / 180) * 500;
            const isSelected = selectedObservation?.id === obs.id;

            let color = '#ff7a3d';
            if (obs.phenomenon === 'precipitation') color = '#4cc3ff';
            else if (obs.phenomenon === 'sst') color = obs.value >= 0 ? '#f25c8a' : '#5b8cff';

            const baseRadius = 3 + obs.normalizedValue * 6;

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
                {/* Visual acoustic radiating ring (selected point only) */}
                {isSelected && <circle
                  cx={cx}
                  cy={cy}
                  r={baseRadius * 1.8}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={isSelected ? '0.9' : '0.4'}
                  className="animate-ping"
                  style={{ animationDuration: `${2.5 - obs.normalizedValue * 1.2}s` }}
                />}

                {/* Core observation beacon */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={baseRadius}
                  fill={color}
                  stroke={isSelected ? '#e9c46a' : 'rgba(255,255,255,0.7)'}
                  strokeWidth={isSelected ? '2.5' : '0.6'}
                  opacity="0.92"
                />

                {/* Label on selection or high intensity */}
                {isSelected && (
                  <text
                    x={cx + baseRadius + 5}
                    y={cy + 4}
                    fill="#ffffff"
                    fontSize="12"
                    paintOrder="stroke"
                    stroke="#071019"
                    strokeWidth="3"
                    className="select-none pointer-events-none"
                  >
                    {obs.regionName}: {obs.value} {obs.unit}
                  </text>
                )}
              </g>
            );
          })}

          {/* Selected country: brass outline, plus a text label (never colour alone) */}
          {country && selPath && (
            <g pointerEvents="none">
              <path d={selPath} fill="rgba(233,196,106,0.12)" stroke="#071019" strokeWidth="4.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={selPath} fill="none" stroke="#e9c46a" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {lblPt && <text x={lblPt.x} y={lblPt.y} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700" paintOrder="stroke" stroke="#071019" strokeWidth="3.5">{countryLabel(country.id, country.name, lang)} · {t('selectedBadge')}</text>}
            </g>
          )}

          {/* Audio Focus Reticle / Crosshair */}
          <g>
            <circle
              cx={((crosshair.lon + 180) / 360) * 1000}
              cy={((90 - crosshair.lat) / 180) * 500}
              r="16"
              fill="none"
              stroke="#e9c46a"
              strokeWidth="2"
              strokeDasharray="4, 3"
            />
            <line
              x1={((crosshair.lon + 180) / 360) * 1000 - 24}
              y1={((90 - crosshair.lat) / 180) * 500}
              x2={((crosshair.lon + 180) / 360) * 1000 + 24}
              y2={((90 - crosshair.lat) / 180) * 500}
              stroke="#e9c46a"
              strokeWidth="1.5"
            />
            <line
              x1={((crosshair.lon + 180) / 360) * 1000}
              y1={((90 - crosshair.lat) / 180) * 500 - 24}
              x2={((crosshair.lon + 180) / 360) * 1000}
              y2={((90 - crosshair.lat) / 180) * 500 + 24}
              stroke="#e9c46a"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
