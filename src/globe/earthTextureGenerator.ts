import * as THREE from 'three';

/**
 * Generates an offline-safe, photo-realistic NASA Blue Marble equirectangular CanvasTexture.
 * Uses realistic satellite color gradients (ocean bathymetry, rainforests, desert sands,
 * polar glaciers, and continuous atmospheric cloud bands) without blocky disk artifacts.
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Deep Ocean Base Color Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a1d37'); // Arctic Ocean
  oceanGrad.addColorStop(0.15, '#0d2b45');
  oceanGrad.addColorStop(0.5, '#0f3860'); // Equatorial Deep Ocean
  oceanGrad.addColorStop(0.85, '#0d2b45');
  oceanGrad.addColorStop(1, '#0a1d37'); // Southern Ocean
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper lat/lon to canvas coordinates
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. Coastal Shelf Shallow Aqua Layer
  const drawCoastalMargin = (coords: [number, number][]) => {
    ctx.fillStyle = 'rgba(0, 180, 216, 0.35)';
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.5)';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    coords.forEach(([lat, lon], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  };

  // 3. Smooth Satellite Biome Landmass Rendering
  const drawSatelliteLand = (
    coords: [number, number][],
    baseColor: string,
    innerDetailColor?: string
  ) => {
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = 'rgba(20, 40, 20, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

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

    if (innerDetailColor) {
      ctx.fillStyle = innerDetailColor;
      ctx.beginPath();
      coords.forEach(([lat, lon], idx) => {
        const x = toX(lon);
        const y = toY(lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    }
  };

  // Detailed Coastline Outlines (Lat, Lon)
  const africa: [number, number][] = [
    [37, -6], [36, 0], [35, 11], [32, 25], [30, 32], [28, 34], [22, 37], [12, 44],
    [12, 51], [9, 50], [4, 42], [-4, 40], [-11, 41], [-17, 39], [-26, 33], [-34, 18],
    [-34, 26], [-30, 17], [-17, 12], [-5, 12], [4, 9], [5, 2], [6, -3], [4, -8],
    [9, -13], [14, -17], [21, -17], [28, -13], [36, -6]
  ];

  const eurasia: [number, number][] = [
    [70, 28], [72, 40], [75, 60], [77, 85], [75, 100], [72, 130], [70, 175],
    [65, 180], [60, 165], [55, 160], [45, 145], [40, 140], [35, 130], [22, 115],
    [10, 105], [1, 104], [10, 98], [15, 95], [22, 90], [15, 80], [25, 65],
    [25, 57], [12, 44], [22, 37], [30, 35], [37, 36], [42, 28], [45, 13],
    [36, -6], [40, -9], [44, -1], [48, -4], [50, 2], [54, 10], [58, 6], [62, 5],
    [65, 14], [70, 20]
  ];

  const northAmerica: [number, number][] = [
    [72, -155], [70, -120], [70, -70], [60, -64], [50, -55], [44, -64], [41, -70],
    [30, -82], [25, -80], [22, -97], [18, -96], [16, -92], [9, -78], [15, -92],
    [22, -105], [32, -117], [38, -123], [48, -125], [58, -140], [65, -165], [72, -155]
  ];

  const southAmerica: [number, number][] = [
    [12, -72], [10, -62], [8, -60], [5, -52], [-5, -35], [-12, -37], [-20, -40],
    [-23, -43], [-30, -50], [-35, -55], [-45, -65], [-55, -67], [-52, -75],
    [-40, -72], [-35, -72], [-18, -70], [-5, -80], [4, -77], [12, -72]
  ];

  const australia: [number, number][] = [
    [-11, 142], [-15, 145], [-25, 153], [-37, 150], [-38, 140], [-34, 135],
    [-32, 116], [-22, 114], [-15, 124], [-12, 135], [-11, 142]
  ];

  const greenland: [number, number][] = [
    [82, -35], [76, -18], [68, -25], [60, -44], [65, -52], [75, -58], [82, -35]
  ];

  const antarctica: [number, number][] = [
    [-65, -180], [-68, -120], [-72, -60], [-70, 0], [-68, 60], [-66, 120],
    [-68, 180], [-89, 180], [-89, -180]
  ];

  // Draw Coastal Shelf Shallow Turquoise
  [africa, eurasia, northAmerica, southAmerica, australia, greenland].forEach(drawCoastalMargin);

  // Draw Base Landmasses with Natural Satellite Vegetation Green
  drawSatelliteLand(eurasia, '#2d5a27');
  drawSatelliteLand(africa, '#345e2a');
  drawSatelliteLand(northAmerica, '#2f5224');
  drawSatelliteLand(southAmerica, '#1b4332');
  drawSatelliteLand(australia, '#4a6741');

  // Draw Deserts (Sahara, Arabian Peninsula, Gobi, Australian Outback)
  drawSatelliteLand([
    [35, -12], [32, 25], [28, 34], [22, 37], [15, 45], [12, 51], [15, 55], [25, 57],
    [30, 50], [30, 35], [20, 25], [16, -10], [25, -16]
  ], '#d4a373');

  drawSatelliteLand([
    [45, 60], [48, 90], [42, 110], [35, 105], [35, 70]
  ], '#c68b59');

  drawSatelliteLand([
    [-18, 118], [-20, 140], [-30, 138], [-30, 118]
  ], '#c68b59');

  drawSatelliteLand([
    [42, -118], [35, -115], [30, -105], [32, -95], [38, -105]
  ], '#d4a373');

  // Polar Glaciers & Ice Caps (Greenland & Antarctica)
  drawSatelliteLand(greenland, '#f8fafc');
  drawSatelliteLand(antarctica, '#f1f5f9');

  // 4. Smooth Continuous Atmospheric Cloud Bands (No disk blobs)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  // Equatorial & Mid-latitude continuous cloud bands
  for (let lat = -50; lat <= 50; lat += 25) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.rect(0, y - 15, width, 30);
    ctx.fill();
  }

  // 5. Scientific Latitude/Longitude Graticules (Subtle & Elegant)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 6]);

  for (let lat = -60; lat <= 60; lat += 30) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let lon = -135; lon <= 135; lon += 45) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.setLineDash([]);
  const eqY = toY(0);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an offline-safe procedural cloud CanvasTexture.
 */
export function createProceduralCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smooth continuous atmospheric cloud wisps
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  for (let y = 50; y < canvas.height - 50; y += 80) {
    ctx.fillRect(0, y, canvas.width, 25);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
