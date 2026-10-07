import * as THREE from 'three';

/**
 * Generates an offline-safe, high-resolution (4096x2048) realistic satellite Earth texture map.
 * Renders precise geographic coastlines, true land biomes (Amazon/Congo rainforests, Sahara/Gobi deserts,
 * Siberian tundra, polar ice sheets), inland seas, and delicate scientific graticules.
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Deep Ocean Base with Realistic Bathymetry Gradients
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#061324'); // Arctic Ocean
  oceanGrad.addColorStop(0.12, '#09213d');
  oceanGrad.addColorStop(0.5, '#0b2b4e'); // Equatorial Deep Pacific/Atlantic
  oceanGrad.addColorStop(0.88, '#09213d');
  oceanGrad.addColorStop(1, '#061324'); // Southern Ocean
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Convert lat/lon degrees to canvas coordinates
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Helper to draw filled landmass/feature polygon
  const drawPolygon = (
    coords: [number, number][],
    fillColor: string,
    strokeColor = 'rgba(10, 30, 15, 0.4)',
    lineWidth = 2
  ) => {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    coords.forEach(([lat, lon], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    if (strokeColor !== 'none') ctx.stroke();
  };

  // Helper for Coastal Shelf Turquoise Glow
  const drawShallowShelf = (coords: [number, number][]) => {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 14;
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
  };

  // -------------------------------------------------------------
  // DETAILED CONTINENTAL COASTLINE DATA
  // -------------------------------------------------------------

  const africa: [number, number][] = [
    [37.3, -5.9], [36.8, 3.8], [35.8, 10.8], [32.0, 24.9], [31.5, 31.8],
    [27.5, 33.8], [22.0, 36.8], [15.5, 41.8], [11.8, 43.5], [11.8, 51.2],
    [9.5, 50.8], [4.2, 42.0], [-1.0, 41.5], [-4.7, 39.5], [-11.8, 40.5],
    [-17.3, 38.5], [-26.0, 32.8], [-33.0, 27.8], [-34.8, 20.0], [-34.8, 18.5],
    [-30.0, 17.0], [-22.5, 14.5], [-17.0, 11.8], [-12.5, 13.5], [-5.5, 12.2],
    [-1.0, 9.5], [4.5, 9.2], [5.2, 2.5], [6.0, -3.2], [4.5, -8.0],
    [9.5, -13.8], [14.8, -17.5], [20.8, -17.0], [28.0, -13.0], [35.8, -5.8],
    [37.3, -5.9]
  ];

  const eurasia: [number, number][] = [
    [70.0, 28.0], [71.0, 32.0], [69.0, 40.0], [68.0, 50.0], [73.0, 70.0],
    [76.0, 95.0], [77.5, 105.0], [72.0, 130.0], [70.0, 150.0], [66.0, 170.0],
    [65.0, 180.0], [60.0, 165.0], [55.0, 160.0], [53.0, 142.0], [43.0, 132.0],
    [38.0, 118.0], [35.0, 120.0], [30.0, 122.0], [22.0, 114.0], [21.0, 108.0],
    [10.0, 104.0], [1.3, 103.8], [6.0, 100.0], [14.0, 98.0], [21.5, 89.5],
    [15.8, 80.2], [8.0, 77.5], [15.0, 73.5], [23.5, 68.5], [25.0, 62.0],
    [25.2, 57.0], [12.8, 43.5], [22.0, 37.0], [30.0, 34.5], [37.0, 36.0],
    [41.0, 29.0], [40.0, 23.0], [36.5, -5.2], [37.0, -9.0], [43.5, -9.3],
    [43.8, -1.8], [48.5, -4.5], [51.0, 1.8], [54.0, 9.0], [58.0, 6.0],
    [62.0, 5.0], [65.0, 12.0], [70.0, 20.0]
  ];

  const northAmerica: [number, number][] = [
    [71.5, -156.5], [70.0, -135.0], [69.0, -115.0], [68.0, -90.0], [60.0, -64.0],
    [53.0, -56.0], [47.0, -53.0], [44.0, -63.0], [41.0, -71.0], [35.0, -75.5],
    [25.0, -80.0], [29.0, -85.0], [29.5, -95.0], [25.8, -97.5], [22.0, -97.8],
    [18.5, -96.0], [15.8, -93.0], [9.0, -79.0], [8.5, -83.0], [13.5, -89.0],
    [16.0, -94.0], [20.0, -105.0], [31.0, -114.0], [34.0, -119.0], [42.0, -124.5],
    [48.5, -125.0], [55.0, -133.0], [60.0, -145.0], [65.0, -168.0], [71.5, -156.5]
  ];

  const southAmerica: [number, number][] = [
    [12.5, -71.8], [10.5, -62.0], [6.0, -55.0], [-2.5, -44.0], [-5.2, -35.0],
    [-12.0, -37.2], [-23.0, -43.0], [-34.8, -58.0], [-42.0, -64.0], [-54.8, -68.3],
    [-53.0, -74.0], [-42.0, -74.0], [-30.0, -71.5], [-18.5, -70.3], [-5.0, -81.0],
    [1.5, -79.0], [8.8, -77.2], [12.5, -71.8]
  ];

  const australia: [number, number][] = [
    [-11.5, 142.5], [-15.0, 145.5], [-24.5, 153.2], [-37.5, 150.0], [-39.0, 146.0],
    [-38.0, 140.0], [-34.0, 135.0], [-35.0, 117.0], [-32.0, 115.0], [-21.8, 114.0],
    [-14.5, 125.0], [-12.0, 131.0], [-11.5, 142.5]
  ];

  const greenland: [number, number][] = [
    [83.0, -35.0], [81.0, -18.0], [76.0, -19.0], [68.0, -26.0], [60.0, -43.0],
    [64.0, -52.0], [72.0, -56.0], [78.0, -72.0], [83.0, -35.0]
  ];

  const antarctica: [number, number][] = [
    [-63.0, -57.0], [-66.0, -70.0], [-72.0, -100.0], [-75.0, -150.0],
    [-78.0, 180.0], [-75.0, 150.0], [-68.0, 100.0], [-66.0, 60.0],
    [-68.0, 20.0], [-70.0, -20.0], [-63.0, -57.0], [-89.0, -180.0], [-89.0, 180.0]
  ];

  // Islands & Archipelagos
  const madagascar: [number, number][] = [
    [-12.2, 49.3], [-16.0, 49.8], [-25.2, 47.0], [-25.5, 45.2], [-20.0, 43.8], [-12.2, 49.3]
  ];
  const japan: [number, number][] = [
    [45.5, 142.0], [40.0, 140.0], [35.0, 136.0], [31.5, 130.5], [34.0, 132.0],
    [37.0, 137.0], [41.5, 141.5], [45.5, 142.0]
  ];
  const ukAndIreland: [number, number][] = [
    [58.5, -5.0], [56.0, -2.5], [51.5, 1.5], [50.0, -5.0], [53.0, -4.5], [58.5, -5.0]
  ];
  const newZealand: [number, number][] = [
    [-34.5, 172.8], [-38.0, 178.0], [-41.5, 174.5], [-46.5, 168.0], [-41.0, 172.0], [-34.5, 172.8]
  ];

  // 2. Draw Shallow Coastal Shelf Rings (Ocean turquoise margins)
  [africa, eurasia, northAmerica, southAmerica, australia, greenland, madagascar, japan, ukAndIreland, newZealand].forEach(drawShallowShelf);

  // 3. Draw Base Landmasses with Lush Satellite Temperate Forest Green
  drawPolygon(eurasia, '#264e29');
  drawPolygon(africa, '#2d572c');
  drawPolygon(northAmerica, '#274b29');
  drawPolygon(southAmerica, '#16431f');
  drawPolygon(australia, '#3c5a32');
  drawPolygon(madagascar, '#234925');
  drawPolygon(japan, '#2a542e');
  drawPolygon(ukAndIreland, '#2b582e');
  drawPolygon(newZealand, '#244d27');

  // 4. Draw Specific Land Biomes for Natural Realism

  // Tropical Rainforests (Amazon Basin, Congo, Southeast Asia)
  drawPolygon([
    [5.0, -75.0], [2.0, -50.0], [-10.0, -45.0], [-15.0, -60.0], [-8.0, -75.0], [5.0, -75.0]
  ], '#0f3818', 'none'); // Amazon Rainforest
  drawPolygon([
    [5.0, 9.0], [3.0, 28.0], [-5.0, 28.0], [-5.0, 12.0], [5.0, 9.0]
  ], '#123d1b', 'none'); // Congo Rainforest
  drawPolygon([
    [10.0, 98.0], [1.0, 104.0], [-5.0, 115.0], [5.0, 118.0], [16.0, 105.0]
  ], '#113c1a', 'none'); // SE Asia Jungle

  // Deserts & Arid Plateaus (Sahara, Arabian Peninsula, Gobi, Australian Outback, US Southwest)
  drawPolygon([
    [32.0, -15.0], [32.0, 33.0], [22.0, 37.0], [14.0, 42.0], [12.0, 51.0],
    [16.0, 54.0], [28.0, 50.0], [30.0, 35.0], [18.0, 15.0], [18.0, -15.0], [32.0, -15.0]
  ], '#c4995f', 'none'); // Sahara & Arabian Desert
  drawPolygon([
    [48.0, 60.0], [46.0, 110.0], [38.0, 105.0], [36.0, 70.0], [48.0, 60.0]
  ], '#bfa06b', 'none'); // Gobi & Central Asian Steppe
  drawPolygon([
    [-18.0, 118.0], [-20.0, 140.0], [-32.0, 138.0], [-30.0, 116.0]
  ], '#ba844d', 'none'); // Australian Outback
  drawPolygon([
    [40.0, -120.0], [32.0, -105.0], [26.0, -100.0], [32.0, -115.0]
  ], '#bc9864', 'none'); // North American Desert

  // Boreal Tundra & Alpine Regions (Siberia, Northern Canada)
  drawPolygon([
    [75.0, 60.0], [75.0, 170.0], [60.0, 160.0], [60.0, 60.0]
  ], '#456449', 'none'); // Siberian Boreal
  drawPolygon([
    [70.0, -140.0], [70.0, -70.0], [55.0, -70.0], [55.0, -130.0]
  ], '#415f45', 'none'); // Canadian Shield Boreal

  // Polar Ice Caps (Greenland, Antarctica, High Arctic)
  drawPolygon(greenland, '#f0f6f9', 'rgba(200, 220, 235, 0.6)');
  drawPolygon(antarctica, '#f4f9fc', 'rgba(200, 220, 235, 0.6)');

  // 5. Inland Seas & Lakes
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
  [mediterranean, blackSea, caspianSea, redSea].forEach((sea) => drawPolygon(sea, '#0b2b4e', 'none'));

  // 6. Scientific Latitude/Longitude Graticule Lines (Subtle & Professional)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 10]);

  // Parallels every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Meridians every 45 degrees
  for (let lon = -135; lon <= 135; lon += 45) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator and Prime Meridian (Solid subtle cyan lines)
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
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
 * Generates a clean, subtle procedural cloud CanvasTexture.
 */
export function createProceduralCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Very subtle white atmospheric wisps
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let y = 100; y < canvas.height - 100; y += 120) {
    ctx.fillRect(0, y, canvas.width, 18);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

