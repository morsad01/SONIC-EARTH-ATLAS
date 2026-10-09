import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { geoContains } from 'd3-geo';
import { loadCountries, findCountry, findCountrySync, representativePoint, outlineSegments, outlinePath, latLonToXYZ, countryById, inBbox, xyzToLatLon } from '../countries/countries';
import { ISO_ALPHA3, isAlpha3 } from '../countries/iso';

describe('countries', () => {
  it('loads every 110m country that has an ISO code, sorted, with unique alpha-3 ids', async () => {
    const l = await loadCountries('110m');
    expect(l.length).toBe(174); // 177 shapes minus N. Cyprus, Somaliland, Kosovo (no ISO numeric id)
    expect(new Set(l.map((c) => c.id)).size).toBe(l.length);
    expect(l.map((c) => c.name)).toEqual([...l.map((c) => c.name)].sort((a, b) => a.localeCompare(b)));
    expect(l.every((c) => isAlpha3(c.id))).toBe(true);
    expect(countryById(l, 'BGD')?.name).toBe('Bangladesh');
    expect(countryById(l, 'USA')?.name).toBe('United States');
    expect(countryById(l, null)).toBeNull();
  });

  it('50m loads lazily, drops shapes without an ISO id and keeps one entry per id', async () => {
    const l = await loadCountries('50m');
    expect(l.length).toBeGreaterThan(200);
    expect(new Set(l.map((c) => c.id)).size).toBe(l.length);
    expect(l.filter((c) => c.id === 'AUS')).toHaveLength(1);
  });

  it('ISO map has no duplicate alpha-3 codes', () => {
    const v = Object.values(ISO_ALPHA3);
    expect(new Set(v).size).toBe(v.length);
    expect(isAlpha3('BGD')).toBe(true);
    expect(isAlpha3('XXX')).toBe(false);
    expect(isAlpha3('bgd')).toBe(false);
  });

  it('finds the country at a point, and null over open ocean', async () => {
    expect((await findCountry(23.8, 90.4))?.id).toBe('BGD'); // Dhaka
    expect((await findCountry(48.85, 2.35))?.id).toBe('FRA');
    expect((await findCountry(-33.9, 151.2))?.id).toBe('AUS');
    expect((await findCountry(0, -140))).toBeNull(); // Pacific
    expect((await findCountry(23.8, 90.4 + 360))?.id).toBe('BGD'); // longitude wraps
  });

  it('bbox pre-filter handles boxes that cross the antimeridian', async () => {
    const l = await loadCountries('110m');
    const rus = countryById(l, 'RUS')!, fji = countryById(l, 'FJI')!;
    expect(findCountrySync(geoContains as never, l, 66, 179)?.id).toBe('RUS');
    expect(findCountrySync(geoContains as never, l, 66, -175)?.id).toBe('RUS'); // Chukotka east of 180
    expect(inBbox(rus.bbox, 60, 100)).toBe(true);
    expect(inBbox(fji.bbox, -17.8, 178.0)).toBe(true);
    expect(inBbox(fji.bbox, 40, 0)).toBe(false);
  });

  it('representative point lies inside the country, for every country', async () => {
    const l = await loadCountries('110m');
    for (const c of l) {
      const p = await representativePoint(c);
      expect(geoContains(c.feature, [p.lon, p.lat]), `${c.id} ${c.name} ${p.lat},${p.lon}`).toBe(true);
    }
  });

  it('representative point of multi-part and odd shapes is sensible', async () => {
    const l = await loadCountries('110m');
    const usa = await representativePoint(countryById(l, 'USA')!);
    expect(usa.lat).toBeGreaterThan(30); expect(usa.lat).toBeLessThan(50); expect(usa.lon).toBeLessThan(-80); // mainland, not Alaska or Hawaii
    const bgd = await representativePoint(countryById(l, 'BGD')!);
    expect(bgd.lat).toBeGreaterThan(21); expect(bgd.lat).toBeLessThan(26); expect(bgd.lon).toBeGreaterThan(88); expect(bgd.lon).toBeLessThan(93);
    const idn = await representativePoint(countryById(l, 'IDN')!);
    expect(geoContains(countryById(l, 'IDN')!.feature, [idn.lon, idn.lat])).toBe(true);
  });

  it('outline segments sit on the sphere, come in pairs and subdivide long edges', async () => {
    const l = await loadCountries('110m');
    const c = countryById(l, 'BGD')!;
    const seg = outlineSegments(c, 2.01);
    expect(seg.length % 6).toBe(0);
    for (let i = 0; i < seg.length; i += 3) expect(Math.hypot(seg[i], seg[i + 1], seg[i + 2])).toBeCloseTo(2.01, 4);
    expect(outlineSegments(c, 2.01, 0.5).length).toBeGreaterThan(seg.length);
    expect(latLonToXYZ(90, 0, 2)[1]).toBeCloseTo(2, 6);
  });

  it('flat-map path starts each ring with M and never draws across the antimeridian', async () => {
    const l = await loadCountries('110m');
    const d = outlinePath(countryById(l, 'RUS')!);
    expect(d.startsWith('M')).toBe(true);
    const pts = [...d.matchAll(/([ML])([\d.]+) ([\d.]+)/g)];
    for (let i = 1; i < pts.length; i++) if (pts[i][1] === 'L') expect(Math.abs(+pts[i][2] - +pts[i - 1][2])).toBeLessThan(500);
  });

  it('lat/lon → xyz matches where three places that texel on the globe sphere, and inverts', () => {
    const g = new THREE.SphereGeometry(2, 72, 36), pos = g.attributes.position, uv = g.attributes.uv;
    for (const [lat, lon] of [[0, 0], [0, 90], [0, -90], [0, 180], [45, 30], [-30, -60], [23.8, 90.4]]) {
      let best = Infinity, k = 0; const u = lon / 360 + 0.5, v = lat / 180 + 0.5;
      for (let i = 0; i < uv.count; i++) { const d = (uv.getX(i) - u) ** 2 + (uv.getY(i) - v) ** 2; if (d < best) { best = d; k = i; } }
      const [x, y, z] = latLonToXYZ(lat, lon, 2);
      expect(Math.hypot(x - pos.getX(k), y - pos.getY(k), z - pos.getZ(k)), `${lat},${lon}`).toBeLessThan(0.12); // texel grid is 5°
      const back = xyzToLatLon(x, y, z);
      expect(back.lat).toBeCloseTo(lat, 6); expect(Math.abs(((back.lon - lon + 540) % 360) - 180)).toBeLessThan(1e-6);
    }
  });
});
