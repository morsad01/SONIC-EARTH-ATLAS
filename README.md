# Sonic Earth Atlas: an Earth Information Jukebox

**NASA Space Apps Challenge 2026 · The Earth Information Jukebox.** Independent team entry, not an official NASA product.

NASA's Earth Information Center makes striking pictures of a changing planet, but pictures only reach people who can see them. Sonic Earth Atlas plays real NASA Earth observations and NASA imagery as sound, live in the browser, so the same science can be explored by ear, keyboard or screen reader.

The site has three sections:

* **Explore Earth.** The globe (or a 2D map, or an accessible list). Pick a **country** on the globe, on the map or by typing its name. Its profile lists only the data that really exists for it, each with source, unit, period and method.
* **Data Jukebox.** Data stories on one synchronized timeline: global temperature, CO₂, sea ice, ocean heat, the week's strongest fires, the four EIC frames, eight Bangladesh divisions, and, for the chosen country, monthly temperature and rain (NASA POWER, 1981–2025) and fire cells inside its border. Each series can be **played**: the timeline, chart, caption and a "What you hear" legend move with the sound. The four original tracks below live here as collections.
* **About the Science.** How data becomes sound, the exact mappings, sources, limits and accessibility controls.

## Four tracks

| | Track | What you hear | NASA data |
|---|---|---|---|
| A1 | **Planet this week** | Fires crackle, rain drips, warm and cold ocean cells hum, each placed in stereo by longitude (3D/HRTF optional) on a globe, a map or an accessible list. | FIRMS VIIRS 375 m fire radiative power (2–5 Oct 2026); POWER PRECTOTCORR daily rain; JPL MUR SST anomaly (Sep 2026) |
| A2 | **EIC frames + NASA imagery** | A needle sweeps a NASA Earth Information Center (earth.gov) frame, or a NASA satellite image, west to east. Height = pitch, brightness = loudness, colour = timbre. "Before / after" plays two images at once, one per ear. | Four bundled EIC frames from earth.gov (greenhouse gas index, ocean heat content, El Niño crop-yield forecast, GEOS Earth Now rain), credited in the app; plus NASA GIBS (Worldview) live imagery: VIIRS true colour, thermal anomalies, IMERG rain, MUR SST anomaly, OMI NO₂, MODIS aerosol, NDVI, night lights |
| B1 | **Bangladesh monsoon** | Eight divisional cities as eight voices across the stereo field, June to October 2026, against 2025 and the 2001–2020 normal. | POWER daily PRECTOTCORR and POWER climatology |
| B2 | **Earth's vital signs** | Global temperature (1880–2025), CO₂ (1959–2025) and Arctic September sea ice (1979–2026), one note per year, alone or as a three-voice chord (temperature left, CO₂ centre, ice right). "Your data" plays any two-column CSV. | GISS GISTEMP v4; NOAA GML Mauna Loa CO₂ and NSIDC Sea Ice Index (the records on NASA's Vital Signs pages) |

Also: a landing page with a three-level carousel of four 3D Earths (overview → detail → immersive dive) and an Earth topic carousel, **Hear any place** (click anywhere on the globe or pick a city and hear 45 years of its NASA POWER temperature and rain, fetched live), a guided 40-second tour, "What you are hearing" panel that names every audible voice and its exact sound parameters, English and বাংলা interface, spoken narration, reduced motion, high contrast, keyboard shortcuts (press `?`), and a Record button that saves 30 seconds of the app's own audio.

## Data honesty

* Every value comes from a NASA source. Raw extracts are in `scripts/raw/`, and `npm run build:data` turns them into `public/data/*.json` without changing any value.
* The rain layer is a 10° global sample (the 48 wettest of 396 points), not a full rain map. SST is a monthly product, so it does not change between days. POWER values are model-based (MERRA-2), not rain gauges.
* Frame Jukebox sonifies image pixels, not calibrated values. On EIC chart frames, titles, axis labels and legends are muted; other text inside a picture can still make sound.
* If the snapshots fail to load, the app falls back to a hand-made sample and labels it "Sample" in the Layers panel.
* **Country figures** are never area-weighted averages. Fire = the 2° cells whose centre lies inside the border (count, strongest value). Rain and SST = the grid points inside the border, shown as "mean of N". Temperature and rain stories = one representative point inside the country (NASA POWER, a ~50 km model cell), labelled as a point sample. Borders are Natural Earth 1:110m, so a cell within ~100 km of a border can land on either side. A country with nothing inside its border shows an empty state, not filler.
* Every number carries a badge: **Snapshot (date)**, **Live**, **Global context** or **Sample**. Snapshot data never shows "Live".

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173
npm run lint       # oxlint, 0 warnings
npm test           # Vitest: data integrity, adapters, mappings, reducers, player, components (184 tests)
npm run build      # type-check + production build in dist/

# Browser checks against the production build (needs Chromium: npx playwright install chromium)
npm run test:e2e   # smoke: every view, navigation, country search, Jukebox timeline + Play, old share links, WebGL off
npm run test:a11y  # axe-core on all seven views, desktop and phone (বাংলা, high contrast, reduced motion)
```

The browser tests block every request outside localhost, so they run offline and give the same result each time.

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

**Data Jukebox series** (`src/sonification/series/`). Each dataset has a fixed reference range (the same for every period and country). The value picks a note on a G-major pentatonic scale from G3 (196 Hz) to G5 (784 Hz). The change from the previous real value gives 1–6 pulses. For anomaly datasets, above the baseline is a warm triangle wave and below is a soft sine. A missing value is silence, never filled. Loudness is capped and never jumps more than 6 dB between notes. Two periods can be compared, one in each ear or one after the other. The mapping is a pure function with a snapshot test, and the full table is on the About page.

| Series | Fixed range | Baseline |
|---|---|---|
| Global temperature anomaly (GISTEMP) | −0.6 to 1.4 °C | 1951–1980 |
| CO₂ at Mauna Loa | 310–430 ppm | — |
| Arctic sea ice, September | 3–8 million km² | — |
| Ocean surface temperature anomaly (MUR) | −1 to 1.5 °C | MUR climatology |
| Strongest fire of the day (FIRMS) | 0–1000 MW | — |
| Bangladesh daily rain (POWER) | 0–150 mm/day, square-root scale | — |
| Country monthly temperature (POWER) | −40 to 40 °C | — |
| Country monthly rain (POWER) | 0–30 mm/day, square-root scale | — |
| Fire cells inside a border | 0–20 cells | — |

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, three.js, Web Audio API, Web Speech API. Tests: Vitest, Testing Library, Playwright, axe-core. Borders and place names: Natural Earth via `world-atlas`, `topojson-client`, `d3-geo`.

The implementation plan, decisions and progress log are in [`docs/roadmap-v3.md`](docs/roadmap-v3.md).

## Credits

Data and imagery: NASA FIRMS / LANCE, NOAA GML (Mauna Loa CO₂), NSIDC (Sea Ice Index), NASA LaRC POWER, NASA JPL PO.DAAC MUR SST (via NOAA CoastWatch ERDDAP), NASA GISS GISTEMP, NASA GIBS / Worldview. Globe textures from the three.js examples (MIT).
