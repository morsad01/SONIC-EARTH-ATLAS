# SONIC EARTH ATLAS
### *Hear Where Earth Is Changing.*

> **NASA Space Apps Challenge 2026 Submission**  
> *"SONIC EARTH ATLAS transforms geographically distributed NASA Earth observations into an explorable spatial auditory environment — allowing people to hear WHERE Earth is changing, WHAT phenomenon is occurring, and HOW it evolves over time."*

---

## 🌍 Executive Summary & Problem Statement

### The Problem
Traditional satellite data portals present Earth observations through 2D visual maps, complex spectral charts, and high-density telemetry tables. While visually rich, these interfaces create major barriers:
1. **Cognitive Overload:** Synthesizing simultaneous multi-layer environmental phenomena (e.g., thermal combustion, convective rainfall, and ocean heat anomalies) requires switching between disconnected visual dashboards.
2. **Accessibility Barriers:** Millions of blind, visually impaired, or neurodivergent researchers and enthusiasts are excluded from experiencing planetary satellite telemetry.
3. **Temporal Obscurity:** Multi-temporal climate trends are often presented as static snapshots rather than perceptual dynamic processes.

### The Solution: Sonic Earth Atlas
**Sonic Earth Atlas** is an interactive planetary spatial auditory instrument. It converts machine-readable satellite observations into an explorable 3D auditory map across three perceptual dimensions:

```
AUTHORITATIVE SATELLITE DATA
            ↓
     SCIENTIFIC VALUE
            ↓
NORMALIZATION & DELTA FORMULAS
            ↓
   SONIFICATION PARAMETERS
            ↓
    SPATIAL AUDIO SYNTHESIS
            ↓
   PLANETARY PERCEPTION
```

---

## 🔭 The Three Core Dimensions

| Dimension | Physical Meaning | Acoustic & Spatial Mapping |
| :--- | :--- | :--- |
| **WHERE** | Geographic Location | **Longitude** maps directly to stereo panning (`pan = clamp(lon / 180, -1, 1)`). **Latitude** controls high-shelf acoustic elevation tilt and 3D HRTF spatial positioning on a bounding sphere ($R = 2.5$). |
| **WHAT** | Environmental Phenomenon | **Wildfires:** Physically modeled thermal crackle bursts ($800–3000\text{ Hz}$).<br>**Precipitation:** Resonant droplet cascades ($340–700\text{ Hz}$) with downward pitch glides.<br>**Ocean Heat:** Harmonic pad drones ($92–138\text{ Hz}$) with sub-ocean swell modulation. |
| **HOW IT CHANGES** | Temporal Dynamics | **"Hear The Change" Mode:** Calculates differential velocity ($\Delta v = v_t - v_{t-1}$). Acceleration increases pitch and pulse density to highlight environmental rates of change. |

---

## 📡 NASA / NOAA Datasets & Data Provenance

Sonic Earth Atlas integrates three core Earth observation domains:

1. **Active Wildfires — NASA FIRMS / VIIRS**
   - **Variable**: Fire Radiative Power (FRP)
   - **Unit**: Megawatts ($\text{MW}$)
   - **Algorithm**: VIIRS $375\text{m}$ Active Fire Algorithm detecting $4\mu\text{m}$ middle-infrared thermal radiance spikes.
   - **Logarithmic Normalization**:
     $$\text{norm} = \text{clamp}\left(\frac{\log_{10}(\text{FRP}) - \log_{10}(5)}{\log_{10}(800) - \log_{10}(5)}, 0, 1\right)$$

2. **Precipitation Dynamics — NASA GPM IMERG**
   - **Variable**: Surface Precipitation Rate
   - **Unit**: Millimeters per hour ($\text{mm/hr}$)
   - **Algorithm**: Integrated Multi-satellitE Retrievals for GPM (IMERG) combining passive microwave radiometers and infrared sounders.
   - **Square-Root Normalization**:
     $$\text{norm} = \text{clamp}\left(\sqrt{\frac{\text{RainRate}}{45}}, 0, 1\right)$$

3. **Sea Surface Temperature Anomaly — NOAA / NASA PO.DAAC / GHRSST**
   - **Variable**: Sea Surface Temperature (SST) Anomaly
   - **Unit**: Degrees Celsius ($^\circ\text{C}$)
   - **Algorithm**: Daily Multi-scale Ultra-high Resolution (MUR) SST compared against $1985\text{--}2012$ climatological baseline.
   - **Bipolar Zero-Centered Normalization**:
     $$\text{norm} = \text{clamp}\left(\frac{\text{Anomaly} - (-3.0)}{3.0 - (-3.0)}, 0, 1\right)$$

### Honest Data Provenance Distinction
- **`NASA/NOAA BASELINE` (Primary Benchmark):** Curated 6-timestep benchmark slices matching NASA FIRMS VIIRS $375\text{m}$ and GPM IMERG schemas across major global monitoring stations (Amazon Basin, Ganges Delta, Equatorial Pacific ENSO zone, Mediterranean, California).
- **`LIVE REANALYSIS PROXY` (Secondary Feed):** Real-time meteorological reanalysis proxy (Open-Meteo stream) used to ensure zero CORS errors or token failures during browser exploration.
- **Disclaimer:** *Sonic Earth Atlas is an independent submission built for the NASA Space Apps Challenge 2026. It is not an official NASA product and is not operated by NASA.*

---

## 🎧 Interactive & Accessibility Features

- **35-Second Guided Cinematic Tour:** Choreographed golden-path tour with automated regional camera focus tracking South America (Fire), South Asia (Rain), and the Equatorial Pacific (Ocean).
- **Audio-Driven Visual Beacons:** Marker rings and pin highlight pulses are dynamically driven by Web Audio voice emissions (`SonificationEngine.getInstance().getActiveVoiceDetails()`). Silent points emit zero visual rings.
- **First-Load Acoustic Calibration:** Initial load defaults to Active Wildfires only at gentle master volume ($0.65$) to avoid acoustic clutter.
- **Audio-First Screen Reader Console:** High-contrast, tabular console (`AudioFirstMode.tsx`) with Web Speech API live voice narration for visually impaired users.
- **Accessible 2D Equirectangular Map:** Keyboard-navigable map (`Accessible2DMap.tsx`) with arrow key navigation, crosshair pan, and audio focus.
- **Auditory Legend:** Isolated audition buttons (`[ Hear Fire ]`, `[ Hear Rain ]`, `[ Hear Ocean ]`) to audition sound signatures before exploring full soundscapes.

---

## 🛠 Technology Stack

- **Frontend Core:** React 19 + TypeScript 6 + Vite 8
- **3D Planetary Canvas:** Three.js (Procedural Canvas Texture + Custom GLSL Atmosphere Shader)
- **Sonification Engine:** Web Audio API (`SpatialPanner`, `HRTF PannerNode`, `StereoPannerNode`, `BiquadFilterNode`, `DynamicsCompressorNode` Brick-wall Limiter)
- **Iconography:** Lucide React
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest Automated Unit Test Suite

---

## 🚀 Local Setup & Demo Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
git clone https://github.com/your-org/sonic-earth-atlas.git
cd sonic-earth-atlas
npm install
```

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Test Suite
```bash
npm test
```

### Production Build & Typecheck
```bash
npm run build
```

---

## ⚠️ Known Limitations

1. **Browser HRTF Support:** While spatial HRTF is built-in using Web Audio `PannerNode`, legacy browser engines fall back to high-clarity stereo panning.
2. **Audio Gesture Gating:** Modern web browsers require explicit user interaction before starting Web Audio. Audio starts only after clicking `[ EXPERIENCE 35-SECOND GUIDED TOUR ]` or `[ LISTEN TO EARTH ]`.
3. **Voice Ceiling:** The sonification engine enforces a deterministic 12-voice ceiling ($N_{\text{max}} = 12$) to protect CPU performance and prevent acoustic overlap.

---

## 📜 Attribution & License

*Data and public domain satellite telemetry provided by NASA ESDIS, FIRMS, GPM, and NOAA GHRSST. Built for the NASA Space Apps Challenge 2026.*

---
## Data honesty (updated)
- **Default sample mode** uses hand-made illustrative values modeled on FIRMS / GPM IMERG / GHRSST. They are *not* real observations and are labeled that way in the UI.
- **Real mode:** get a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/ then run `FIRMS_MAP_KEY=your_key npm run fetch:firms`. This writes `public/data/firms_snapshot.json` (6 days of real VIIRS detections, top 80 2° cells). Toggle the data source in the app to hear real fires. GPM and SST remain illustrative.

## Earth imagery credit
Earth surface, specular, normal and cloud maps in `public/textures/` come from the three.js examples (MIT repo). For the final release swap in NASA Blue Marble (https://visibleearth.nasa.gov) under the same file names.
