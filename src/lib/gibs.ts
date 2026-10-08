/** NASA GIBS (Global Imagery Browse Services) WMS snapshots. GIBS sends CORS headers, so the pixels can be read for sonification. */
import { silentRects, type Rect } from './frameSweep';

export interface NasaFrame {
  id: string;
  layer: string;
  date?: string;
  format: 'jpeg' | 'png';
  title: string;
  titleBn: string;
  what: string; // what the colours mean
  credit: string;
  overlayOn?: string; // draw this transparent data layer over another layer
  src?: string; // a bundled local image (used by the Earth Information Center frames); `layer` is then unused
  sourceUrl?: string; // page the picture comes from
  longEn?: string; // a full description for people who cannot see the picture
  longBn?: string;
  soundRegion?: Rect; // only this part of a bundled image makes sound (fractions of the image), e.g. the chart without its axes
  soundIgnore?: Rect[]; // parts inside the region that stay silent, e.g. a title
}

export const GIBS_WMS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';

export function gibsUrl(layer: string, date: string | undefined, format: 'jpeg' | 'png', width = 1024) {
  const p = new URLSearchParams({
    SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0', LAYERS: layer, CRS: 'EPSG:4326',
    BBOX: '-90,-180,90,180', WIDTH: String(width), HEIGHT: String(width / 2), FORMAT: `image/${format}`,
  });
  if (date) p.set('TIME', date);
  return `${GIBS_WMS}?${p.toString()}`;
}

// All layer ids and dates below were test-requested from GIBS on 2026-10-08 and returned images.
export const FRAMES: NasaFrame[] = [
  { id: 'truecolor', layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', date: '2026-10-03', format: 'jpeg', title: 'Earth from orbit, 3 Oct 2026', titleBn: 'কক্ষপথ থেকে পৃথিবী, ৩ অক্টোবর ২০২৬', what: 'True colour from VIIRS on Suomi NPP: white is cloud, blue ocean, green and brown land.', credit: 'NASA GIBS / Worldview, VIIRS SNPP Corrected Reflectance' },
  { id: 'fires', layer: 'VIIRS_SNPP_Thermal_Anomalies_375m_All', overlayOn: 'BlueMarble_ShadedRelief_Bathymetry', date: '2026-10-03', format: 'png', title: 'Fires detected, 3 Oct 2026', titleBn: 'শনাক্ত আগুন, ৩ অক্টোবর ২০২৬', what: 'Red and orange dots are VIIRS 375 m thermal anomalies (active fires) over a Blue Marble base.', credit: 'NASA GIBS, VIIRS SNPP Thermal Anomalies 375 m (FIRMS)' },
  { id: 'rain', layer: 'IMERG_Precipitation_Rate', overlayOn: 'BlueMarble_ShadedRelief_Bathymetry', date: '2026-10-03', format: 'png', title: 'Rain rate, 3 Oct 2026', titleBn: 'বৃষ্টির হার, ৩ অক্টোবর ২০২৬', what: 'GPM IMERG precipitation rate. Brighter, warmer colours mean heavier rain.', credit: 'NASA GIBS, GPM IMERG Precipitation Rate' },
  { id: 'sstanom', layer: 'GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies', date: '2026-09-30', format: 'png', title: 'Ocean heat anomaly, 30 Sep 2026', titleBn: 'সমুদ্রের তাপ বিচ্যুতি, ৩০ সেপ্টেম্বর ২০২৬', what: 'MUR sea surface temperature anomaly. Red is warmer than normal, blue colder.', credit: 'NASA GIBS, GHRSST L4 MUR SST Anomalies (JPL)' },
  { id: 'no2', layer: 'OMI_Nitrogen_Dioxide_Tropo_Column', overlayOn: 'BlueMarble_ShadedRelief_Bathymetry', date: '2026-10-01', format: 'png', title: 'Air pollution (NO₂), 1 Oct 2026', titleBn: 'বায়ু দূষণ (NO₂), ১ অক্টোবর ২০২৬', what: 'OMI tropospheric nitrogen dioxide, a marker of traffic, industry and fires.', credit: 'NASA GIBS, Aura OMI NO₂ Tropospheric Column' },
  { id: 'aod', layer: 'MODIS_Combined_Value_Added_AOD', overlayOn: 'BlueMarble_ShadedRelief_Bathymetry', date: '2026-10-03', format: 'png', title: 'Smoke and dust (aerosols), 3 Oct 2026', titleBn: 'ধোঁয়া ও ধুলা (অ্যারোসল), ৩ অক্টোবর ২০২৬', what: 'MODIS aerosol optical depth: haze from smoke, dust and pollution.', credit: 'NASA GIBS, MODIS Combined Value-Added AOD' },
  { id: 'ndvi', layer: 'MODIS_Terra_NDVI_8Day', date: '2026-09-22', format: 'png', title: 'Green vegetation, late Sep 2026', titleBn: 'সবুজ উদ্ভিদ, সেপ্টেম্বর ২০২৬', what: 'MODIS Terra NDVI 8-day: deeper green means denser, healthier vegetation.', credit: 'NASA GIBS, MODIS Terra NDVI 8-Day' },
  { id: 'night', layer: 'VIIRS_SNPP_DayNightBand_At_Sensor_Radiance', date: '2026-10-03', format: 'png', title: 'Earth at night, 3 Oct 2026', titleBn: 'রাতের পৃথিবী, ৩ অক্টোবর ২০২৬', what: 'VIIRS Day/Night Band: city lights, fires and moonlit cloud.', credit: 'NASA GIBS, VIIRS SNPP Day/Night Band' },
];

export const BASE_BLUE_MARBLE = { layer: 'BlueMarble_ShadedRelief_Bathymetry', format: 'jpeg' as const };

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('NASA GIBS image did not load'));
    i.src = src;
  });
}

/**
 * Loads a frame. `display` is what people see (data over a dimmed Blue Marble when the layer is transparent);
 * `sound` holds only the data layer on black, so the base map never makes noise.
 */
export async function loadFrameCanvases(frame: NasaFrame, width = 1024): Promise<{ display: HTMLCanvasElement; sound: HTMLCanvasElement }> {
  const mk = () => { const cv = document.createElement('canvas'); cv.width = width; cv.height = width / 2; return cv; };
  if (frame.src) return loadLocalCanvases(frame, width);
  const display = mk(), sound = mk();
  const d = display.getContext('2d')!, s = sound.getContext('2d', { willReadFrequently: true })!;
  const top = await loadImg(gibsUrl(frame.layer, frame.date, frame.format, width));
  s.fillStyle = '#000'; s.fillRect(0, 0, width, width / 2);
  s.drawImage(top, 0, 0, width, width / 2);
  if (frame.overlayOn) {
    const base = await loadImg(gibsUrl(frame.overlayOn, undefined, 'jpeg', width));
    d.drawImage(base, 0, 0, width, width / 2);
    d.fillStyle = 'rgba(4,12,20,0.55)'; d.fillRect(0, 0, width, width / 2);
  } else {
    d.fillStyle = '#000'; d.fillRect(0, 0, width, width / 2);
  }
  d.drawImage(top, 0, 0, width, width / 2);
  return { display, sound };
}

/**
 * A bundled image of any shape, fitted inside the 2:1 frame on black, so the needle and pitch rows stay the same.
 * The black margins are silent.
 */
async function loadLocalCanvases(frame: NasaFrame, width: number) {
  const img = await loadImg(frame.src!);
  const h = width / 2;
  const scale = Math.min(width / img.naturalWidth, h / img.naturalHeight);
  const w = img.naturalWidth * scale, ih = img.naturalHeight * scale;
  const ox = (width - w) / 2, oy = (h - ih) / 2;
  const paint = () => {
    const cv = document.createElement('canvas'); cv.width = width; cv.height = h;
    const c = cv.getContext('2d', { willReadFrequently: true })!;
    c.fillStyle = '#000'; c.fillRect(0, 0, width, h);
    c.drawImage(img, ox, oy, w, ih);
    return { cv, c };
  };
  const display = paint().cv;
  const { cv: sound, c } = paint();
  // Axis labels, titles and legends stay silent so the sound follows the data, not the text.
  for (const r of silentRects(frame.soundRegion, frame.soundIgnore)) c.fillRect(ox + r.x * w, oy + r.y * ih, r.w * w, r.h * ih);
  return { display, sound };
}

/** Same pipeline for a user-supplied image file (no base layer). */
export async function loadFileCanvases(file: File, width = 1024) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const h = Math.round(width * (img.naturalHeight / img.naturalWidth)) || width / 2;
    const cv = document.createElement('canvas'); cv.width = width; cv.height = h;
    cv.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, width, h);
    return { display: cv, sound: cv };
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
