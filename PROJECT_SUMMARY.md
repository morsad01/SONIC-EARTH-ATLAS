# PROJECT SUMMARY — SONIC EARTH ATLAS
**NASA Space Apps Challenge 2026**

### Executive Overview (185 Words)

**Sonic Earth Atlas** is an interactive planetary spatial auditory instrument that transforms geographically distributed NASA Earth observations into an explorable 3D auditory map. Traditional Earth data interfaces present satellite telemetry as complex 2D charts and visual overlays, creating cognitive overload and excluding visually impaired researchers. 

Sonic Earth Atlas translates machine-readable measurements into a multi-sensory environment across three core dimensions: **WHERE** (longitude mapped to stereo panning; latitude to spatial elevation), **WHAT** (wildfire combustion crackles, precipitation droplet cascades, ocean temperature drones), and **HOW IT CHANGES** (temporal velocity $\Delta v$ modulating pitch and tempo).

Built on authoritative NASA FIRMS (VIIRS active fire radiative power), NASA GPM IMERG (precipitation rate), and NOAA/NASA GHRSST (sea surface temperature anomalies), the platform includes a 35-second choreographed Guided Demo with smooth camera focus transitions, an Audio-First screen reader console, an accessible 2D map, and an isolated Auditory Legend.

By unifying spatial audio, WebGL planetary telemetry, and accessibility-first design, Sonic Earth Atlas offers a novel perceptual gateway for judges, scientists, and the public to listen to environmental change happening across Earth.

---

### Key Differentiators & Impact

1. **Deterministic Scientific Pipeline:** Converts actual physical satellite measurements ($\text{MW}$, $\text{mm/hr}$, $^\circ\text{C}$) into spatial audio parameters through rigorous logarithmic and square-root normalization formulas.
2. **True Spatial Audio Mapping:** Uses Web Audio HRTF 3D positioning and stereo panning to align audio location with physical planetary coordinates.
3. **Accessibility-First Engineering:** Features a dedicated screen reader console with Web Speech API narration and a keyboard-navigable 2D map.
4. **Honest Data Integrity:** Explicitly distinguishes between verified `NASA/NOAA BASELINE` benchmark datasets and live meteorological reanalysis proxies.
