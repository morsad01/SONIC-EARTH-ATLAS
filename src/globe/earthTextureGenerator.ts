import * as THREE from 'three';

/**
 * Generates an offline-safe, high-aesthetic CanvasTexture representing Earth's
 * continents, bathymetry, and latitude/longitude graticules.
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep dark oceanic space blue
  ctx.fillStyle = '#060d1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle ocean bathymetry gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#040b17');
  oceanGrad.addColorStop(0.5, '#08172c');
  oceanGrad.addColorStop(1, '#040b17');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper to convert lat/lon to canvas coordinates
  const toX = (lon: number) => ((lon + 180) / 360) * canvas.width;
  const toY = (lat: number) => ((90 - lat) / 180) * canvas.height;

  // Draw simplified high-fidelity continental landmass polygons
  ctx.fillStyle = '#17283c';
  ctx.strokeStyle = '#223e60';
  ctx.lineWidth = 1.5;

  const drawPolygon = (coords: [number, number][]) => {
    ctx.beginPath();
    coords.forEach(([lat, lon], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Africa
  drawPolygon([
    [37, -6], [32, 25], [12, 44], [12, 51], [-4, 40], [-26, 33], [-34, 18],
    [-34, 26], [-17, 12], [4, 9], [5, 2], [14, -17], [28, -13], [36, -6]
  ]);

  // Eurasia
  drawPolygon([
    [70, 28], [75, 100], [70, 175], [60, 160], [45, 145], [35, 130], [22, 115],
    [10, 105], [15, 80], [25, 65], [30, 50], [37, 36], [42, 28], [45, 13],
    [40, -5], [52, -5], [60, 5], [70, 20]
  ]);

  // North America
  drawPolygon([
    [72, -155], [70, -70], [50, -55], [44, -64], [30, -82], [25, -80], [18, -96],
    [16, -92], [9, -78], [15, -92], [22, -105], [32, -117], [38, -123], [48, -125],
    [58, -140], [65, -165], [72, -155]
  ]);

  // South America
  drawPolygon([
    [12, -72], [10, -62], [5, -52], [-5, -35], [-20, -40], [-35, -55], [-55, -67],
    [-52, -75], [-35, -72], [-18, -70], [-5, -80], [4, -77], [12, -72]
  ]);

  // Australia
  drawPolygon([
    [-11, 142], [-15, 145], [-25, 153], [-37, 150], [-38, 140], [-32, 116],
    [-22, 114], [-15, 124], [-12, 135], [-11, 142]
  ]);

  // Antarctica
  drawPolygon([
    [-65, -180], [-68, -120], [-72, -60], [-70, 0], [-68, 60], [-66, 120],
    [-68, 180], [-89, 180], [-89, -180]
  ]);

  // Draw delicate scientific latitude/longitude graticules
  ctx.strokeStyle = 'rgba(70, 130, 180, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);

  // Parallels every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Meridians every 45 degrees
  for (let lon = -135; lon <= 135; lon += 45) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Equator and Prime Meridian (solid, slightly brighter)
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
  ctx.setLineDash([]);
  const eqY = toY(0);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(canvas.width, eqY);
  ctx.stroke();

  const primeX = toX(0);
  ctx.beginPath();
  ctx.moveTo(primeX, 0);
  ctx.lineTo(primeX, canvas.height);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
