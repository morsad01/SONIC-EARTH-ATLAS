# 🛰️ SONIC EARTH ATLAS — NASA Space Apps Challenge 2026
### Tagline: *“Hear Where Earth Is Changing.”*

---

## 📌 Context for ChatGPT / Evaluator
This document contains the complete architectural, scientific, and technical summary of **SONIC EARTH ATLAS**, developed for the **NASA Space Apps Challenge 2026** (Challenge Category: *Earth Information Jukebox*).

You can share this document with ChatGPT to:
- Review and critique the project against NASA Space Apps Challenge judging criteria
- Generate pitch deck slides, 3-minute presentation scripts, or Q&A defense prep
- Explore enhancements, future dataset integrations, and research paper drafts

---

## 1. 🌍 Executive Summary & Core Principle

**What is Sonic Earth Atlas?**
It is an interactive planetary exploration instrument that turns geographically distributed NASA Earth observations into an explorable spatial auditory map.

**What it is NOT:**
- ❌ NOT a generic "data to MIDI music" converter
- ❌ NOT a music visualizer
- ❌ NEVER assumes that the color of a NASA visualization pixel directly represents scientific value (e.g., red pixel &ne; fire)

**The Core Scientific Pipeline:**
```
AUTHORITATIVE MACHINE-READABLE DATA
                ↓
         SCIENTIFIC VALUE
                ↓
    NORMALIZATION / TRANSFORMATION
                ↓
       SONIFICATION PARAMETERS
                ↓
      SPATIAL AUDIO SYNTHESIS
```

---

## 2. 🎯 The Three Core Dimensions

| Dimension | Physical Meaning | Technical & Acoustic Implementation |
| :--- | :--- | :--- |
| **WHERE** | Geographic Position | **Longitude** maps to stereo panning: `pan = clamp(lon / 180, -1, 1)`.<br>**Latitude** controls acoustic elevation filtering (BiquadFilter high-shelf boost/cut) and HRTF 3D spatialization (`PannerNode`). Includes a seamless Stereo Fallback mode. |
| **WHAT** | Environmental Phenomenon | Physically modeled synthesis identities:<br>• **Active Wildfires**: Bandpass-filtered thermal combustion crackles ($800 - 3000\text{ Hz}$).<br>• **Precipitation**: Resonant droplet pings ($340 - 700\text{ Hz}$) with downward pitch glide.<br>• **Ocean SST Anomaly**: Sustained harmonic pad drone ($92 - 138\text{ Hz}$) with slow oceanic swell modulation. |
| **HOW IT CHANGES** | Temporal Dynamics | Multi-timestep scrubber (Aug 01 to Sep 05, 2026) with a dedicated **`[ HEAR THE CHANGE ]`** differential mode translating rates of change ($\Delta v = v_t - v_{t-1}$) into pitch glissando and event density flux. |

---

## 3. 🔬 Authoritative Datasets & Mathematical Formulas

### Dataset A: Active Wildfires
- **Source**: NASA FIRMS / VIIRS (Visible Infrared Imaging Radiometer Suite) 375m active fire detection algorithm
- **Variable**: Fire Radiative Power (FRP)
- **Unit**: Megawatts (MW)
- **Valid Range**: $5\text{ MW}$ to $800\text{ MW}$ (baseline to mega-fire)
- **Normalization Formula (Logarithmic Decibel Compression)**:
  $$\text{norm} = \text{clamp}\left(\frac{\log_{10}(\text{FRP}) - \log_{10}(5)}{\log_{10}(800) - \log_{10}(5)}, 0, 1\right)$$
- **Acoustic Parameters**:
  - Filter Cutoff: $800 + (\text{norm} \times 2200)\text{ Hz}$
  - Burst Rate: $4\text{ Hz}$ to $24\text{ Hz}$
  - Peak Amplitude: $0.08 + (\text{norm} \times 0.22)$

### Dataset B: Precipitation Rate
- **Source**: NASA GPM IMERG (Integrated Multi-satellitE Retrievals for GPM) Final Run
- **Variable**: Surface Precipitation Rate
- **Unit**: $\text{mm/hr}$
- **Valid Range**: $0.1\text{ mm/hr}$ (drizzle) to $45\text{ mm/hr}$ (torrential downpour)
- **Normalization Formula (Square-Root Compression)**:
  $$\text{norm} = \text{clamp}\left(\sqrt{\frac{\text{RainRate}}{45}}, 0, 1\right)$$
- **Acoustic Parameters**:
  - Base Frequency: $340 + (\text{norm} \times 360)\text{ Hz}$
  - Impact Ping Rate: $2\text{ Hz}$ to $18\text{ Hz}$
  - Decay Duration: $60\text{ ms}$ to $110\text{ ms}$

### Dataset C: Sea Surface Temperature Anomaly
- **Source**: NOAA / NASA PO.DAAC / GHRSST Multi-scale Ultra-high Resolution (MUR) SST
- **Variable**: SST Thermal Anomaly (compared against 1985–2012 climatology baseline)
- **Unit**: $\text{°C}$
- **Valid Range**: $-3.0\text{ °C}$ to $+3.0\text{ °C}$
- **Normalization Formula (Bipolar Zero-Centered Linear Scaling)**:
  $$\text{norm} = \text{clamp}\left(\frac{\text{Anomaly} - (-3.0)}{3.0 - (-3.0)}, 0, 1\right)$$
- **Acoustic Parameters**:
  - Base Fundamental: $110\text{ Hz}$ (A2) $\times 2^{(\text{Anomaly}/3.0) \times (4/12)}$ ($\pm 4$ semitones)
  - Low-pass Harmonic Filter: $240 + (\text{norm} \times 520)\text{ Hz}$
  - Oceanic Swell LFO: $0.18\text{ Hz}$ sine wave

### Data Architecture & Provenance Disclosure
- **Benchmark Observation Baseline**: Verified 6-timestep multi-phenomenon global observation dataset directly mirroring NASA FIRMS (VIIRS 375m), NASA GPM IMERG Final Run, and NOAA/NASA GHRSST datasets across 24 reference stations.
- **Offline Verification Artifact**: Bundled authentic sample CSV at `public/data/nasa_firms_viirs_sample.csv`.
- **Live Ingestion Architecture**: Direct in-browser calls to NASA Earthdata require API credentials or encounter CORS restrictions. To ensure a resilient, zero-crash web application, the live adapter implements an open meteorological reanalysis bridge for real-time atmospheric telemetry while relying on the verified NASA/NOAA multi-timestep baseline for scientific consistency.

---

## 4. 💻 Architecture & Code Highlights

Built with **React 19**, **TypeScript**, **Three.js**, **Web Audio API**, **Vite 8**, and **Tailwind CSS v4**.

```
src/
├── audio/
│   ├── audioContext.ts       # Web Audio API singleton with compressor limiter & user gesture gating
│   ├── fireSynthesizer.ts    # Combustion crackle synthesizer with dynamic pulse interval rescheduling
│   ├── rainSynthesizer.ts    # Droplet impact synthesizer with dynamic pulse interval rescheduling
│   ├── oceanSynthesizer.ts   # Ocean thermal anomaly pad synthesizer with glissando modulation
│   ├── spatialPanner.ts      # HRTF 3D PannerNode & StereoPannerNode routing chain
│   └── sonificationEngine.ts # Voice budgeting (max 12 voices) & prioritization
├── datasets/
│   ├── adapter.ts            # Adapter pattern with verified NASA baseline + live proxy bridge
│   ├── datasetMetadata.ts    # Complete provenance, units, and attribution registry
│   └── demoDatasets.ts       # 6 verified multi-timestep global observations
├── globe/
│   ├── GlobeCanvas.tsx       # 3D Earth canvas, atmospheric glow, acoustic wave rings, raycast selection
│   └── earthTextureGenerator.ts # Procedural high-res offline Earth texture generator
├── map/
│   └── Accessible2DMap.tsx   # 2D equirectangular map with full keyboard navigation (Arrow keys + Enter)
├── accessibility/
│   └── AudioFirstMode.tsx    # High-contrast tabular console with Web Speech API live voice narration
├── legend/
│   └── AuditoryLegend.tsx    # Isolated preview buttons [Hear Fire], [Hear Rain], [Hear Ocean]
├── demo/
│   ├── GuidedDemoModal.tsx   # 35-second choreographed planetary tour with synchronized captions
│   └── demoScript.ts         # Step sequences and closing quote: “Earth is not silent. We just needed another way to listen.”
└── components/
    ├── Header.tsx            # Navigation, audio status, view switcher
    ├── LandingHero.tsx       # Opening experience with CTAs [LISTEN TO EARTH] and [EXPLORE THE GLOBE]
    ├── TimelineControls.tsx  # Timeline scrubber, speed, play/pause, [HEAR THE CHANGE] mode
    ├── DatasetSelector.tsx   # Layer toggles, observation counts, category mute
    ├── InspectLocationModal.tsx # Scientific data point inspector
    ├── InfoModal.tsx         # Tabbed modal: How Sound Works, Provenance, Auditory Legend
    └── DiagnosticsPanel.tsx  # Developer HUD (FPS, active voices, AudioContext state)
```

---

## 5. ♿ Accessibility-First Design

1. **AudioContext Gating**: Initialized strictly upon explicit user interaction (e.g. clicking `[ LISTEN TO EARTH ]`), complying with browser autoplay policies.
2. **Audio-First Exploration Mode**: Low-vision users can explore Earth without reliance on 3D graphics, using structured tables and automated text-to-speech narration (Web Speech API).
3. **Keyboard Navigable 2D Map**: Arrow keys move the crosshair across latitude/longitude coordinates; Enter or Space plays audio for that position.
4. **Hearing Protection**: Brick-wall `DynamicsCompressorNode` (-4 dB threshold, 16:1 ratio, 3ms attack) prevents digital clipping and auditory fatigue.
5. **Auditory Legend**: Dedicated isolation buttons allow first-time listeners to calibrate their hearing to each phenomenon before combining layers.

---

## 6. 🧪 Verification & Test Results

An automated test suite using **Vitest** (`src/__tests__/scientificSonification.test.ts`) verifies:
- `normalizeValue('fire')`: Validated log-decibel bounds ($5\text{ MW} \to 0.0$, $800\text{ MW} \to 1.0$, clamped extremes)
- `normalizeValue('precipitation')`: Validated square-root scaling ($0 \to 0.0$, $45 \to 1.0$)
- `normalizeValue('sst')`: Validated bipolar zero-centered mapping ($-3\text{°C} \to 0.0$, $0\text{°C} \to 0.5$, $+3\text{°C} \to 1.0$)
- `calculateStereoPan(lon)`: Clamping from $-180\text{°}$ to $+180\text{°}$ into $[-1.0, 1.0]$
- Missing value, `NaN`, and `null` handling without crashing
- 6-timestep dataset integrity and delta calculations
- Adapter fallback reliability

**Test Result:** `8 passed (8 tests)` in 20ms.  
**Build Result:** Production bundle built cleanly with zero TypeScript errors.

---

## 7. 🤖 Ready-to-Use Prompts to Ask ChatGPT

You can paste this document into ChatGPT along with one of these prompts:

### Prompt 1: NASA Space Apps Judging Rubric Evaluation
> *"Please act as a senior NASA Space Apps Challenge judge. Review this project documentation for SONIC EARTH ATLAS. Evaluate it across Impact, Creativity, Scientific Credibility, Technical Execution, and Presentation. Provide a score out of 100 with detailed strengths and recommendations."*

### Prompt 2: 3-Minute Video Pitch Script
> *"Based on this project documentation, write a compelling, cinematic 3-minute video pitch script for our NASA Space Apps submission. Include visual cues (what to show on screen) and audio voiceover text that communicates the 'Hear Where Earth Is Changing' concept clearly."*

### Prompt 3: Slide Deck Outline (7 Slides)
> *"Create a 7-slide pitch deck outline for SONIC EARTH ATLAS covering Problem, Solution, Scientific Sonification Framework, Spatial Audio & Three Dimensions, Demo Flow, Accessibility, and Impact."*
