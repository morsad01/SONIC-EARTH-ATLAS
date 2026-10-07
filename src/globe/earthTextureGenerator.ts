import * as THREE from 'three';

/**
 * Generates an offline-safe, realistic, high-fidelity CanvasTexture representing Earth's
 * oceans, vegetation, deserts, polar ice caps, and subtle scientific graticules.
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Oceanic Deep Blue Base Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0a2342'); // Arctic ocean
  oceanGrad.addColorStop(0.2, '#0d3b66');
  oceanGrad.addColorStop(0.5, '#0e407a'); // Equatorial ocean
  oceanGrad.addColorStop(0.8, '#0d3b66');
  oceanGrad.addColorStop(1, '#0a2342'); // Antarctic ocean
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper lat/lon to canvas coordinates
  const toX = (lon: number) => ((lon + 180) / 360) * canvas.width;
  const toY = (lat: number) => ((90 - lat) / 180) * canvas.height;

  // Draw polygon with fill and stroke
  const drawBiomeRegion = (
    coords: [number, number][],
    fillStyle: string,
    strokeStyle: string = 'rgba(0,0,0,0.15)',
    lineWidth: number = 1
  ) => {
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
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

  // 2. Coastal Shelf Shallow Turquoise Highlights
  const drawCoastalShelf = (coords: [number, number][]) => {
    ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    coords.forEach(([lat, lon], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  };

  // Continent Polygons Definition
  const africaPoly: [number, number][] = [
    [37, -6], [35, 11], [32, 25], [30, 32], [22, 37], [12, 44], [12, 51], [-4, 40],
    [-11, 41], [-26, 33], [-34, 18], [-34, 26], [-30, 17], [-17, 12], [-5, 12],
    [4, 9], [5, 2], [14, -17], [21, -17], [28, -13], [36, -6]
  ];

  const eurasiaPoly: [number, number][] = [
    [70, 28], [75, 60], [75, 100], [72, 130], [70, 175], [60, 165], [45, 145],
    [35, 130], [22, 115], [10, 105], [1, 104], [10, 98], [22, 90], [15, 80],
    [25, 65], [25, 57], [30, 50], [37, 36], [42, 28], [45, 13], [36, -6],
    [40, -9], [44, -1], [50, -4], [54, 10], [58, 6], [62, 5], [70, 20]
  ];

  const northAmericaPoly: [number, number][] = [
    [72, -155], [70, -120], [70, -70], [60, -64], [50, -55], [44, -64], [30, -82],
    [25, -80], [18, -96], [16, -92], [9, -78], [15, -92], [22, -105], [32, -117],
    [38, -123], [48, -125], [58, -140], [65, -165], [72, -155]
  ];

  const southAmericaPoly: [number, number][] = [
    [12, -72], [10, -62], [5, -52], [-5, -35], [-12, -37], [-20, -40], [-30, -50],
    [-35, -55], [-45, -65], [-55, -67], [-52, -75], [-40, -72], [-35, -72],
    [-18, -70], [-5, -80], [4, -77], [12, -72]
  ];

  const australiaPoly: [number, number][] = [
    [-11, 142], [-15, 145], [-25, 153], [-37, 150], [-38, 140], [-32, 116],
    [-22, 114], [-15, 124], [-12, 135], [-11, 142]
  ];

  const antarcticaPoly: [number, number][] = [
    [-65, -180], [-68, -120], [-72, -60], [-70, 0], [-68, 60], [-66, 120],
    [-68, 180], [-89, 180], [-89, -180]
  ];

  const greenlandPoly: [number, number][] = [
    [82, -35], [76, -18], [68, -25], [60, -44], [65, -52], [75, -58], [82, -35]
  ];

  // Draw Coastal Shelf Glows
  [africaPoly, eurasiaPoly, northAmericaPoly, southAmericaPoly, australiaPoly, greenlandPoly].forEach(drawCoastalShelf);

  // 3. Realistic Continent Base & Biome Fill
  // Eurasia: Lush European/Asian Forests + Desert Belts
  drawBiomeRegion(eurasiaPoly, '#2d5a27', '#1b4332');
  // Sahara & Arabian Deserts
  drawBiomeRegion([
    [32, -17], [30, 32], [22, 37], [15, 45], [12, 51], [15, 55], [25, 57], [30, 50],
    [30, 35], [20, 25], [16, -10], [25, -16]
  ], '#d4a373', '#bc6c25');
  // Gobi & Central Asian Steppe
  drawBiomeRegion([
    [45, 60], [48, 90], [42, 110], [35, 105], [35, 70]
  ], '#c68b59', '#a0522d');

  // Africa: Congo Jungle + Savanna
  drawBiomeRegion(africaPoly, '#2d5a27', '#1b4332');
  drawBiomeRegion([
    [35, -6], [32, 25], [22, 35], [15, 30], [12, 15], [15, -10], [25, -16]
  ], '#e9c46a', '#d4a373');

  // North America: Boreal Forests + Great Plains / Western Deserts
  drawBiomeRegion(northAmericaPoly, '#2b580c', '#1b4332');
  drawBiomeRegion([
    [42, -120], [35, -115], [30, -105], [32, -95], [40, -100]
  ], '#d4a373', '#bc6c25');

  // South America: Amazon Rainforest + Pampas
  drawBiomeRegion(southAmericaPoly, '#1b4332', '#081c15');
  drawBiomeRegion([
    [-15, -70], [-25, -65], [-40, -68], [-52, -70], [-40, -72]
  ], '#52796f', '#2f3e46');

  // Australia: Outback Desert + Coastal Vegetation
  drawBiomeRegion(australiaPoly, '#3a5a40', '#1b4332');
  drawBiomeRegion([
    [-18, 120], [-20, 140], [-30, 138], [-30, 120]
  ], '#c68b59', '#bc6c25');

  // Greenland Polar Ice Sheet
  drawBiomeRegion(greenlandPoly, '#f8fafc', '#e2e8f0');

  // Antarctica Polar Ice Cap
  drawBiomeRegion(antarcticaPoly, '#f8fafc', '#cbd5e1');

  // 4. Subtle Atmospheric Clouds Texture Overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (let i = 0; i < 180; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    const rw = 40 + Math.random() * 120;
    const rh = 15 + Math.random() * 45;
    ctx.beginPath();
    ctx.ellipse(rx, ry, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Delicate Scientific Latitude/Longitude Graticules
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 5]);

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

  // Equator & Prime Meridian (slightly brighter solid line)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
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

/**
 * Generates an offline-safe procedural cloud CanvasTexture for the revolving cloud sphere layer.
 */
export function createProceduralCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Wispy cloud bands & cyclonic patterns
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let i = 0; i < 220; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const rx = 30 + Math.random() * 110;
    const ry = 8 + Math.random() * 30;
    const angle = (Math.random() - 0.5) * 0.4;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
