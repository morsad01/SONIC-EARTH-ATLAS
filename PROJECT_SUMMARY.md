# Submission text

**Project name:** Sonic Earth Atlas: an Earth Information Jukebox

**Challenge:** The Earth Information Jukebox (NASA Space Apps Challenge 2026)

**Short description (≈100 words):**
Sonic Earth Atlas plays real NASA Earth observations and NASA imagery as sound, generated live in the browser. Explore the globe and pick any country: its profile lists only the data that truly exists there, with source, unit, period and method. The Data Jukebox puts each data story on one timeline (global temperature, CO₂, sea ice, fires, EIC frames, the Bangladesh monsoon, and each country's 45 years of NASA POWER temperature and rain) and plays it: chart, caption and a "What you hear" legend move with the sound. Wildfires, rain and ocean heat play in stereo on the globe, and EIC frames are swept into sound. Everything works by keyboard, screen reader, and in English or Bangla.

**NASA data used:**
NASA FIRMS VIIRS S-NPP 375 m active fires (2–7 Oct 2026); NASA POWER daily PRECTOTCORR and climatology; NASA JPL MUR SST monthly anomaly (Sep 2026, via NOAA CoastWatch ERDDAP); NASA GISS GISTEMP v4; NOAA GML Mauna Loa CO₂ and NSIDC Sea Ice Index (as shown on NASA Vital Signs); NASA POWER monthly API (live, any point); NASA Earth Information Center frames (earth.gov: greenhouse gas index, ocean heat content, El Niño crop yields, GEOS Earth Now); NASA GIBS / Worldview imagery (VIIRS true colour and thermal anomalies, GPM IMERG, MUR SST anomaly, OMI NO₂, MODIS AOD and NDVI, VIIRS Day/Night Band).

**Tools:** React, TypeScript, Vite, three.js, Web Audio API, Web Speech API, Tailwind CSS, Natural Earth borders (world-atlas, d3-geo). Tests: Vitest, Testing Library, Playwright, axe-core.

**What makes it different:** several real datasets at once in spatial sound; a country view that only shows data that really exists there and says how each number was computed; a deterministic, documented sonification where every note can be explained ("0.61 °C → A4, 4 pulses, warm: above the 1951–1980 baseline"); NASA imagery and measured values of the same days; a local Bangladesh story; accessibility and Bangla built in and tested (automated axe checks on every view).
