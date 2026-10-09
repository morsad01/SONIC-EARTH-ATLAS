# Sonic Earth Atlas: an Earth Information Jukebox

**NASA Space Apps Challenge 2026 · The Earth Information Jukebox.** Independent team entry, not an official NASA product.

NASA's Earth Information Center makes striking pictures of a changing planet, but pictures only reach people who can see them. Sonic Earth Atlas plays real NASA Earth observations and NASA imagery as sound, live in the browser, so the same science can be explored by ear, keyboard or screen reader.

## Four tracks

| | Track | What you hear | NASA data |
|---|---|---|---|
| A1 | **Planet this week** | Fires crackle, rain drips, warm and cold ocean cells hum, each placed in stereo by longitude (3D/HRTF optional) on a globe, a map or an accessible list. | FIRMS VIIRS 375 m fire radiative power (2–5 Oct 2026); POWER PRECTOTCORR daily rain; JPL MUR SST anomaly (Sep 2026) |
| A2 | **EIC frames + NASA imagery** | A needle sweeps a NASA Earth Information Center (earth.gov) frame, or a NASA satellite image, west to east. Height = pitch, brightness = loudness, colour = timbre. "Before / after" plays two images at once, one per ear. | Four bundled EIC frames from earth.gov (greenhouse gas index, ocean heat content, El Niño crop-yield forecast, GEOS Earth Now rain), credited in the app; plus NASA GIBS (Worldview) live imagery: VIIRS true colour, thermal anomalies, IMERG rain, MUR SST anomaly, OMI NO₂, MODIS aerosol, NDVI, night lights |
| B1 | **Bangladesh monsoon** | Eight divisional cities as eight voices across the stereo field, June to October 2026, against 2025 and the 2001–2020 normal. | POWER daily PRECTOTCORR and POWER climatology |
| B2 | **Earth's vital signs** | Global temperature (1880–2025), CO₂ (1959–2025) and Arctic September sea ice (1979–2026), one note per year, alone or as a three-voice chord (temperature left, CO₂ centre, ice right). "Your data" plays any two-column CSV. | GISS GISTEMP v4; NOAA GML Mauna Loa CO₂ and NSIDC Sea Ice Index (the records on NASA's Vital Signs pages) |

Also: **Hear any place** (click anywhere on the globe or pick a city and hear 45 years of its NASA POWER temperature and rain, fetched live), a guided 40-second tour, "What you are hearing" panel that names every audible voice and its exact sound parameters, English and বাংলা interface, spoken narration, reduced motion, high contrast, keyboard shortcuts (press `?`), and a Record button that saves 30 seconds of the app's own audio.

## Data honesty

* Every value comes from a NASA source. Raw extracts are in `scripts/raw/`, and `npm run build:data` turns them into `public/data/*.json` without changing any value.
* The rain layer is a 10° global sample (the 48 wettest of 396 points), not a full rain map. SST is a monthly product, so it does not change between days. POWER values are model-based (MERRA-2), not rain gauges.
* Frame Jukebox sonifies image pixels, not calibrated values. On EIC chart frames, titles, axis labels and legends are muted; other text inside a picture can still make sound.
* If the snapshots fail to load, the app falls back to a hand-made sample and labels it "Sample" in the Layers panel.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # data-integrity and mapping tests
npm run build      # production build in dist/
```

The NASA GIBS image frames and Hear any place (NASA POWER) are requested live, so they need an internet connection. Everything else, including the EIC frames, is bundled.

## Refresh the data

```bash
FIRMS_MAP_KEY=<your free key> npm run fetch:firms   # Windows PowerShell: $env:FIRMS_MAP_KEY="<key>"; npm run fetch:firms
npm run fetch:precip
npm run fetch:sst
npm run build:data
```

The Bangladesh, GISTEMP, CO₂ and sea-ice extracts in `scripts/raw/` were fetched on 2026-10-08 from NASA POWER, NASA GISS, NOAA GML and NSIDC.

## How sound is made

| Layer | Normalisation | Sound |
|---|---|---|
| Fire (MW) | `clamp((log10(FRP) − log10 5) / (log10 800 − log10 5), 0, 1)` | 4–20 crackles/s, band-pass 800–3000 Hz |
| Rain (mm/day) | `clamp(sqrt(rain / 100), 0, 1)` | ~3–18 droplets/s, 340–700 Hz |
| Ocean (°C) | `clamp((anomaly + 5) / 10, 0, 1)` | drone at 110 Hz × 2^((anomaly/3)·4/12) |
| All | pan = longitude / 180 | latitude tilts elevation in HRTF mode |

A 12-voice limit keeps the mix clear: the strongest values in the enabled layers play.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, three.js, Web Audio API, Web Speech API, Vitest. Place names: Natural Earth via `world-atlas`.

## Credits

Data and imagery: NASA FIRMS / LANCE, NOAA GML (Mauna Loa CO₂), NSIDC (Sea Ice Index), NASA LaRC POWER, NASA JPL PO.DAAC MUR SST (via NOAA CoastWatch ERDDAP), NASA GISS GISTEMP, NASA GIBS / Worldview. Globe textures from the three.js examples (MIT).
