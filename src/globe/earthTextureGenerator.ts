import * as THREE from 'three';

/**
 * Generates an offline-safe, high-resolution (4096x2048) realistic satellite Earth texture map.
 * Uses smooth quadratic curve interpolation for natural, organic, non-polygonal coastlines,
 * realistic land biomes (Amazon/Congo rainforests, Sahara/Gobi deserts, Siberian tundra, polar ice),
 * inland seas, and delicate scientific graticules.
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Deep Ocean Base with Realistic Bathymetry Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#061427'); // Arctic Ocean
  oceanGrad.addColorStop(0.15, '#0b2545');
  oceanGrad.addColorStop(0.5, '#0e315d'); // Equatorial Deep Pacific/Atlantic
  oceanGrad.addColorStop(0.85, '#0b2545');
  oceanGrad.addColorStop(1, '#061427'); // Southern Ocean
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper lat/lon to canvas coordinates
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  /**
   * Draws a landmass with smooth quadratic curve interpolation between vertices,
   * eliminating all sharp polygon edges and straight line segments.
   */
  const drawSmoothContinent = (
    coords: [number, number][],
    fillColor: string,
    strokeColor = 'rgba(15, 35, 18, 0.4)',
    lineWidth = 2
  ) => {
    if (coords.length < 3) return;
    const pts = coords.map(([lat, lon]) => ({ x: toX(lon), y: toY(lat) }));

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    const firstMidX = (pts[0].x + pts[pts.length - 1].x) / 2;
    const firstMidY = (pts[0].y + pts[pts.length - 1].y) / 2;
    ctx.moveTo(firstMidX, firstMidY);

    for (let i = 0; i < pts.length; i++) {
      const pCurrent = pts[i];
      const pNext = pts[(i + 1) % pts.length];
      const midX = (pCurrent.x + pNext.x) / 2;
      const midY = (pCurrent.y + pNext.y) / 2;
      ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, midX, midY);
    }

    ctx.closePath();
    ctx.fill();
    if (strokeColor !== 'none') ctx.stroke();
  };

  /**
   * Draws shallow coastal shelf margins with soft turquoise blending.
   */
  const drawShallowShelf = (coords: [number, number][]) => {
    if (coords.length < 3) return;
    const pts = coords.map(([lat, lon]) => ({ x: toX(lon), y: toY(lat) }));
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
    ctx.lineWidth = 16;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const firstMidX = (pts[0].x + pts[pts.length - 1].x) / 2;
    const firstMidY = (pts[0].y + pts[pts.length - 1].y) / 2;
    ctx.moveTo(firstMidX, firstMidY);

    for (let i = 0; i < pts.length; i++) {
      const pCurrent = pts[i];
      const pNext = pts[(i + 1) % pts.length];
      const midX = (pCurrent.x + pNext.x) / 2;
      const midY = (pCurrent.y + pNext.y) / 2;
      ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, midX, midY);
    }
    ctx.closePath();
    ctx.stroke();
  };

  // -------------------------------------------------------------
  // DENSE REALISTIC GEOGRAPHIC CONTINENT COORDINATES
  // -------------------------------------------------------------

  const africa: [number, number][] = [
    [37.3, -5.9], [36.8, 1.2], [35.8, 10.8], [33.5, 11.2], [32.0, 24.9], [31.5, 31.8],
    [29.8, 32.5], [27.5, 33.8], [22.0, 36.8], [15.5, 41.8], [11.8, 43.5], [11.8, 51.2],
    [9.5, 50.8], [7.0, 47.5], [4.2, 42.0], [0.0, 42.5], [-4.7, 39.5], [-11.8, 40.5],
    [-15.0, 40.8], [-17.3, 38.5], [-23.0, 35.5], [-26.0, 32.8], [-33.0, 27.8], [-34.8, 20.0],
    [-34.8, 18.5], [-32.5, 17.5], [-30.0, 17.0], [-26.5, 15.0], [-22.5, 14.5], [-17.0, 11.8],
    [-12.5, 13.5], [-8.8, 13.2], [-5.5, 12.2], [-1.0, 9.5], [4.5, 9.2], [5.2, 2.5],
    [6.0, -3.2], [4.5, -8.0], [7.5, -12.5], [9.5, -13.8], [12.0, -16.0], [14.8, -17.5],
    [20.8, -17.0], [24.0, -15.8], [28.0, -13.0], [33.0, -9.0], [35.8, -5.8]
  ];

  const eurasia: [number, number][] = [
    [70.0, 28.0], [71.0, 32.0], [69.0, 40.0], [68.0, 50.0], [71.0, 58.0], [73.0, 70.0],
    [76.0, 95.0], [77.5, 105.0], [75.0, 115.0], [72.0, 130.0], [71.0, 140.0], [70.0, 150.0],
    [68.0, 160.0], [66.0, 170.0], [65.0, 180.0], [62.0, 175.0], [60.0, 165.0], [55.0, 160.0],
    [53.0, 142.0], [48.0, 135.0], [43.0, 132.0], [38.0, 118.0], [35.0, 120.0], [30.0, 122.0],
    [25.0, 118.0], [22.0, 114.0], [21.0, 108.0], [16.0, 108.0], [10.0, 104.0], [1.3, 103.8],
    [6.0, 100.0], [10.0, 98.0], [14.0, 98.0], [18.0, 94.0], [21.5, 89.5], [19.0, 85.0],
    [15.8, 80.2], [10.0, 79.8], [8.0, 77.5], [12.0, 75.0], [15.0, 73.5], [20.0, 70.0],
    [23.5, 68.5], [25.0, 62.0], [25.2, 57.0], [20.0, 57.5], [15.0, 52.0], [12.8, 43.5],
    [16.0, 41.5], [22.0, 37.0], [28.0, 34.5], [30.0, 34.5], [33.0, 35.0], [37.0, 36.0],
    [41.0, 29.0], [40.0, 23.0], [38.0, 20.0], [36.5, -5.2], [37.0, -9.0], [40.0, -8.8],
    [43.5, -9.3], [43.8, -1.8], [46.0, -1.2], [48.5, -4.5], [51.0, 1.8], [54.0, 9.0],
    [55.0, 12.0], [58.0, 6.0], [60.0, 5.0], [62.0, 5.0], [65.0, 12.0], [68.0, 16.0], [70.0, 20.0]
  ];

  const northAmerica: [number, number][] = [
    [71.5, -156.5], [71.0, -145.0], [70.0, -135.0], [69.0, -115.0], [68.0, -90.0],
    [62.0, -78.0], [60.0, -64.0], [58.0, -62.0], [53.0, -56.0], [47.0, -53.0],
    [44.0, -63.0], [41.0, -71.0], [38.0, -75.0], [35.0, -75.5], [30.0, -81.0],
    [25.0, -80.0], [29.0, -85.0], [29.5, -95.0], [25.8, -97.5], [22.0, -97.8],
    [18.5, -96.0], [15.8, -93.0], [14.0, -90.0], [9.0, -79.0], [8.5, -83.0],
    [13.5, -89.0], [16.0, -94.0], [20.0, -105.0], [25.0, -110.0], [31.0, -114.0],
    [34.0, -119.0], [38.0, -123.0], [42.0, -124.5], [48.5, -125.0], [52.0, -130.0],
    [55.0, -133.0], [60.0, -145.0], [65.0, -168.0], [71.5, -156.5]
  ];

  const southAmerica: [number, number][] = [
    [12.5, -71.8], [10.5, -62.0], [8.0, -60.0], [6.0, -55.0], [2.0, -50.0],
    [-2.5, -44.0], [-5.2, -35.0], [-9.0, -35.5], [-12.0, -37.2], [-18.0, -39.0],
    [-23.0, -43.0], [-28.0, -48.5], [-34.8, -58.0], [-40.0, -62.0], [-42.0, -64.0],
    [-50.0, -68.0], [-54.8, -68.3], [-53.0, -74.0], [-46.0, -75.0], [-42.0, -74.0],
    [-35.0, -72.0], [-30.0, -71.5], [-23.0, -70.5], [-18.5, -70.3], [-12.0, -77.0],
    [-5.0, -81.0], [1.5, -79.0], [5.0, -77.5], [8.8, -77.2], [12.5, -71.8]
  ];

  const australia: [number, number][] = [
    [-11.5, 142.5], [-14.0, 144.0], [-15.0, 145.5], [-20.0, 149.0], [-24.5, 153.2],
    [-30.0, 153.0], [-37.5, 150.0], [-39.0, 146.0], [-38.0, 140.0], [-35.0, 137.0],
    [-34.0, 135.0], [-32.0, 130.0], [-35.0, 117.0], [-32.0, 115.0], [-26.0, 113.5],
    [-21.8, 114.0], [-18.0, 121.0], [-14.5, 125.0], [-12.0, 131.0], [-11.5, 142.5]
  ];

  const greenland: [number, number][] = [
    [83.0, -35.0], [81.0, -18.0], [76.0, -19.0], [70.0, -22.0], [68.0, -26.0],
    [64.0, -40.0], [60.0, -43.0], [64.0, -52.0], [68.0, -54.0], [72.0, -56.0],
    [78.0, -72.0], [83.0, -35.0]
  ];

  const antarctica: [number, number][] = [
    [-63.0, -57.0], [-66.0, -70.0], [-72.0, -100.0], [-75.0, -150.0],
    [-78.0, 180.0], [-75.0, 150.0], [-68.0, 100.0], [-66.0, 60.0],
    [-68.0, 20.0], [-70.0, -20.0], [-63.0, -57.0], [-89.0, -180.0], [-89.0, 180.0]
  ];

  // Islands & Archipelagos
  const madagascar: [number, number][] = [
    [-12.2, 49.3], [-16.0, 49.8], [-21.0, 48.0], [-25.2, 47.0], [-25.5, 45.2],
    [-22.0, 43.2], [-20.0, 43.8], [-15.0, 46.5], [-12.2, 49.3]
  ];

  const japan: [number, number][] = [
    [45.5, 142.0], [42.0, 144.0], [40.0, 140.0], [36.0, 140.5], [35.0, 136.0],
    [31.5, 130.5], [34.0, 132.0], [37.0, 137.0], [41.5, 141.5], [45.5, 142.0]
  ];

  const ukAndIreland: [number, number][] = [
    [58.5, -5.0], [57.5, -2.0], [56.0, -2.5], [52.5, 1.8], [51.5, 1.5],
    [50.0, -5.0], [51.5, -9.5], [53.5, -9.0], [55.0, -7.5], [58.5, -5.0]
  ];

  const newZealand: [number, number][] = [
    [-34.5, 172.8], [-38.0, 178.0], [-41.5, 174.5], [-46.5, 168.0],
    [-44.0, 169.0], [-41.0, 172.0], [-34.5, 172.8]
  ];

  // 2. Draw Shallow Coastal Shelf Margins (Ocean turquoise depth transitions)
  [africa, eurasia, northAmerica, southAmerica, australia, greenland, madagascar, japan, ukAndIreland, newZealand].forEach(drawShallowShelf);

  // 3. Draw Base Landmasses with Natural Satellite Vegetation Green
  drawSmoothContinent(eurasia, '#264e29');
  drawSmoothContinent(africa, '#2d572c');
  drawSmoothContinent(northAmerica, '#274b29');
  drawSmoothContinent(southAmerica, '#16431f');
  drawSmoothContinent(australia, '#3c5a32');
  drawSmoothContinent(madagascar, '#234925');
  drawSmoothContinent(japan, '#2a542e');
  drawSmoothContinent(ukAndIreland, '#2b582e');
  drawSmoothContinent(newZealand, '#244d27');

  // 4. Draw Detailed Regional Biomes

  // Tropical Rainforests (Amazon Basin, Congo Basin, SE Asia)
  drawSmoothContinent([
    [5.0, -75.0], [3.0, -60.0], [2.0, -50.0], [-5.0, -45.0], [-10.0, -52.0], [-15.0, -60.0], [-8.0, -75.0], [5.0, -75.0]
  ], '#0f3818', 'none');

  drawSmoothContinent([
    [5.0, 9.0], [4.0, 20.0], [3.0, 28.0], [-2.0, 26.0], [-5.0, 18.0], [-5.0, 12.0], [5.0, 9.0]
  ], '#123d1b', 'none');

  drawSmoothContinent([
    [16.0, 98.0], [10.0, 98.0], [1.0, 104.0], [-5.0, 115.0], [5.0, 118.0], [16.0, 105.0]
  ], '#113c1a', 'none');

  // Deserts & Arid Lands (Sahara, Arabian Peninsula, Gobi, Australian Outback, Kalahari)
  drawSmoothContinent([
    [32.0, -15.0], [32.0, 33.0], [28.0, 34.0], [22.0, 37.0], [14.0, 42.0], [12.0, 51.0],
    [16.0, 54.0], [25.0, 56.0], [28.0, 50.0], [30.0, 35.0], [18.0, 15.0], [18.0, -15.0], [32.0, -15.0]
  ], '#c4995f', 'none');

  drawSmoothContinent([
    [48.0, 60.0], [48.0, 90.0], [46.0, 110.0], [38.0, 105.0], [36.0, 70.0], [48.0, 60.0]
  ], '#bfa06b', 'none');

  drawSmoothContinent([
    [-18.0, 118.0], [-20.0, 140.0], [-32.0, 138.0], [-30.0, 116.0]
  ], '#ba844d', 'none');

  drawSmoothContinent([
    [40.0, -120.0], [35.0, -115.0], [32.0, -105.0], [26.0, -100.0], [32.0, -115.0]
  ], '#bc9864', 'none');

  // Boreal Tundra & Alpine Regions (Siberia, Northern Canada)
  drawSmoothContinent([
    [75.0, 60.0], [75.0, 170.0], [60.0, 160.0], [60.0, 60.0]
  ], '#456449', 'none');

  drawSmoothContinent([
    [70.0, -140.0], [70.0, -70.0], [55.0, -70.0], [55.0, -130.0]
  ], '#415f45', 'none');

  // Polar Ice Sheets (Greenland, Antarctica, High Arctic)
  drawSmoothContinent(greenland, '#f0f6f9', 'rgba(200, 220, 235, 0.6)');
  drawSmoothContinent(antarctica, '#f4f9fc', 'rgba(200, 220, 235, 0.6)');

  // 5. Inland Seas & Major Water Bodies
  const mediterranean: [number, number][] = [
    [37.0, 5.0], [43.0, 12.0], [40.0, 25.0], [31.0, 34.0], [31.0, 28.0], [36.0, -5.0]
  ];
  const blackSea: [number, number][] = [
    [46.0, 30.0], [45.0, 38.0], [41.0, 40.0], [42.0, 29.0]
  ];
  const caspianSea: [number, number][] = [
    [46.0, 50.0], [45.0, 54.0], [37.0, 54.0], [38.0, 50.0]
  ];
  const redSea: [number, number][] = [
    [28.0, 33.0], [27.0, 35.0], [13.0, 43.0], [15.0, 41.0]
  ];
  [mediterranean, blackSea, caspianSea, redSea].forEach((sea) => drawSmoothContinent(sea, '#0e315d', 'none'));

  // 6. Scientific Latitude/Longitude Graticules (Subtle, Dashed lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 10]);

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

  // Equator and Prime Meridian (Solid subtle cyan lines)
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
  ctx.setLineDash([]);
  const eqY = toY(0);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  const primeX = toX(0);
  ctx.beginPath();
  ctx.moveTo(primeX, 0);
  ctx.lineTo(primeX, height);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Returns null or empty canvas texture for clear Earth viewing without obscuring clouds.
 */
export function createProceduralCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}


