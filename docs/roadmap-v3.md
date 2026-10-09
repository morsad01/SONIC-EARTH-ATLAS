# Sonic Earth Atlas — Roadmap v3 (implementation plan)

**Source:** the team's brief in [`roadmap-v3-brief.md`](roadmap-v3-brief.md) ("EarthSound" master prompt), applied to the existing Sonic Earth Atlas codebase.
**Status:** Phases 0 (audit and plan), 1 (design foundation), 2 (country selection), 3 (data registry and country profile) and 4 (Data Jukebox) done. **Current phase: 5, series sonification.**
**Scope:** the whole asked roadmap, Features A–G, Phases 0–7. Where I adapt something to the codebase, the reason is in §3.

---

## 1. Existing architecture and feature inventory

### 1.1 Stack and tooling

| Area | Current state |
|---|---|
| Framework | React 19, TypeScript 6, Vite 8, single-page app, no router |
| Styling | Tailwind 4 plus hand-written CSS in `src/index.css` / `src/App.css` |
| 3D | Plain three.js 0.186 in `src/globe/GlobeCanvas.tsx` (lazy chunk, 546 kB / 137 kB gzip), textures in `public/textures/` (1024 and 2048 px) |
| Geo | `world-atlas` (Natural Earth 110m), `topojson-client`, `d3-geo`. Used only for reverse lookup in `src/lib/power.ts` |
| Audio | Web Audio. Shared context, master gain and limiter in `src/audio/audioContext.ts` |
| Icons | lucide-react |
| Package manager | npm (`package-lock.json`) |
| Scripts | `dev`, `build` (`tsc -b && vite build`), `lint` (oxlint), `test` (vitest run), `preview`, data fetchers `fetch:*`, `build:data` |
| CI | GitHub Actions: `npm ci → lint → test → build` on PRs and on `main` |
| Deploy | Vercel (static `dist/`). No server functions, no environment variables in the app. |
| Health (audit run) | `npm test` **47/47 pass** (5 files) · `npm run lint` **2 warnings** (`set-state-in-effect` in `VitalSigns.tsx:70`, `FrameJukebox.tsx:131`) · `npm run build` **passes**, with a >500 kB warning for the `GlobeCanvas` chunk |
| Git | `main` = `fd1ed4a`. PRs #1–#6 (all of roadmap-v2) merged. Local checkout is clean and matches `main`. |

### 1.2 App structure

`App.tsx` holds all state. A landing hero (`LandingHero`) sits on top of four "tracks" chosen in `Header`, and the state is mirrored to a URL-hash share link (`src/lib/shareLink.ts`).

| Track / area | Files | Status |
|---|---|---|
| **A1 Atlas:** globe / 2D map / audio-first, fire, rain and SST, 2–5 Oct timeline, hear-the-change | `globe/GlobeCanvas`, `map/Accessible2DMap`, `accessibility/AudioFirstMode`, `atlas/*` (`TimelineBar`, `LayersPanel`, `HearingPanel`, `PlacePanel`), `audio/sonificationEngine` + 3 synths | Complete |
| **A2 Frame Jukebox:** 4 EIC frames + 8 GIBS layers, pixel sweep, scrub, loop, speed, click-to-listen, silent regions, legend, readout, EIC story mode, any-two-frame compare, own-image upload | `tracks/FrameJukebox`, `lib/frameSweep`, `lib/eicFrames`, `lib/gibs` | Complete |
| **B1 Bangladesh monsoon:** 8 divisions, 2026 vs 2025 vs 2001–2020 normal | `tracks/BangladeshMonsoon`, `public/data/bangladesh_monsoon.json` | Complete |
| **B2 Vital signs:** GISTEMP, CO₂, sea ice as a three-voice chord, CSV upload | `tracks/VitalSigns`, `public/data/vital_signs.json`, `gistemp_global.json` | Complete |
| Hear any place | `atlas/PlacePanel`, `lib/power` (live NASA POWER monthly point API, annual values only) | Complete (needs internet) |
| Landing | `components/LandingHero`: Listen now, tour, explore silently, track "records" with real-data waveforms | Complete |
| Dialogs | `DataMethodDialog`, `SettingsDialog`, `DiagnosticsPanel`, `InspectLocationModal` | Complete |
| Tour | `demo/TourBar` | Complete |
| A11y | Keyboard shortcuts, list view, narration, বাংলা strings (`lib/strings.ts`), reduced motion, high contrast (`html.hc`), 44 px targets, contrast tests | Complete |
| Country selection | — | **Missing** |
| Unified data registry / time-series adapters | `datasets/adapter.ts` serves only the Atlas slices; the other tracks fetch their own JSON | **Partial** |
| Generic time-series sonifier with a state machine | `types/sonification.ts` has `PlaybackState = 'playing' \| 'paused' \| 'stopped'`; each track has its own player | **Partial** |
| Synchronized three-column timeline, horizontal story row, topic carousel | — | **Missing** |
| About / how-it-works page, footer | Content lives only in `DataMethodDialog` | **Partial** |

### 1.3 Data sources (real capability)

| Source | Where | Type | Temporal | Spatial |
|---|---|---|---|---|
| NASA FIRMS VIIRS | `public/data/firms_snapshot.json` | Bundled snapshot | Daily, 2–7 Oct 2026 (Atlas plays 2–5) | 375 m detections → 2° cells (max FRP) |
| NASA POWER precipitation | `precip_snapshot.json` | Bundled snapshot | Daily | 2° grid |
| SST anomaly | `sst_snapshot.json` | Bundled snapshot | Monthly | 2° grid, area-weighted global mean |
| Bangladesh monsoon (POWER) | `bangladesh_monsoon.json` | Bundled snapshot | Daily + 2001–2020 normal | 8 division points |
| GISTEMP v4 | `gistemp_global.json`, `vital_signs.json` | Bundled snapshot | Annual, 1880– | Global mean |
| CO₂, sea ice | `vital_signs.json` | Bundled snapshot | Annual | Global |
| EIC frames | `public/eic/*.webp`, `lib/eicFrames.ts` | Bundled images with credit | Per frame | Global charts / map |
| NASA GIBS | `lib/gibs.ts` | Live WMTS images | Daily | Global imagery |
| NASA POWER point | `lib/power.ts` | Live API (CORS, no key) | Monthly 1981–2025 (currently only annual "month 13" is read) | Single point |
| Offline fallback | `datasets/demoDatasets.ts` | Hand-made sample, already labelled as such | — | — |

### 1.4 Design system today

There are two token sets in `src/index.css`:
- **Current (used by the UI):** `--abyss --panel --panel-2 --line --ink --ink-2 --ink-3 --brass --fire --rain --warm --cold`, `--font-display` (Bricolage Grotesque) and `--font-body` (IBM Plex Sans / Noto Sans Bengali), plus the `.btn`, `.panel`, `.chip` classes.
- **Legacy (top of file):** `--bg-space-*`, `--accent-*`, `--text-*`, and an `Outfit` / `JetBrains Mono` font stack. Neither font is loaded in `index.html`.

The current set already matches v3's palette: deep navy, restrained cyan (`--rain`) and warm amber (`--brass`).

---

## 2. Risks and compatibility constraints

| # | Risk | Mitigation |
|---|---|---|
| R1 | `App.tsx` holds all state; adding a track, a country and the Jukebox can tangle it. | New features get their own reducers/hooks (`useCountry`, `useJukebox`). `App.tsx` only wires them in. |
| R2 | `GlobeCanvas.tsx` (559 lines) is fragile, and the hero and Atlas share one globe instance. | Add outline, fly-to and hero framing as small, separately testable functions behind props. Keep the existing raycast and render loop. Wrap it in an error boundary. |
| R3 | Share links already exist in the wild. | Version the hash: decode the old keys unchanged, add new keys (`c`, `story`, `t`), ignore unknown keys. Round-trip tests cover both. |
| R4 | Scroll, timeline selection and playback can feed back into each other. | One reducer is the source of truth, and every action carries its origin (`user`, `scroll`, `playback`). Scroll sync ignores programmatic scrolls. See §4 Phase 4. |
| R5 | Audio node leaks from repeated play, seek and country changes. | Lookahead scheduler with a bounded window (≤ 2 s ahead), every node routed through one per-player bus that is disconnected on stop, and a node counter exposed in `DiagnosticsPanel`. |
| R6 | 110m borders are coarse, and 2° cells don't follow borders. | Optional 50m borders loaded lazily for selection and outline. Every country figure says how it was computed. There are no area-weighted country averages (see §3, D6). |
| R7 | Scroll-linked hero motion could hurt readability or accessibility. | Use CSS scroll-driven animations, with an IntersectionObserver class-toggle fallback. No wheel hijacking. `prefers-reduced-motion` gives static stages. |
| R8 | Teammates push to the same repo. | One branch per phase, a PR, green CI, a Vercel preview check, and a rebase on `main` before each PR. |
| R9 | Bundle growth. | Lazy-load the Jukebox, the carousel, the About page and the 50m borders. No new runtime dependencies are planned. |
| R10 | Existing tracks get lost in the new navigation. | Every current track stays reachable: A1 under "Explore Earth", and A2 / B1 / B2 as collections inside "Data Jukebox" with their full current UI. |

**Dependencies.** No new **runtime** dependencies. The following **dev** dependencies are proposed, each justified:
- `@testing-library/react` + `jsdom`: component tests for the combobox, timeline and carousel keyboard behaviour. Vitest is already set up.
- `@playwright/test` + `@axe-core/playwright`: browser smoke and a11y checks for the acceptance checklist. These are only added in Phase 7, and kept optional in CI if run time is a problem.

---

## 3. Decisions where I adapt the asked roadmap

| # | v3 says | Decision for this codebase | Why |
|---|---|---|---|
| D1 | Working name "EarthSound" | Keep **Sonic Earth Atlas**. Use "Hear our changing planet" as the hero headline. | v3 §2: preserve the existing brand |
| D2 | Global navigation with Explore Earth / Data Jukebox / About the Science | Nav becomes **Explore Earth** (A1) · **Data Jukebox** (new, contains A2/B1/B2 as collections) · **About the Science** (new). A "Listen now" CTA stays in the header. | Every existing feature is kept and mapped to a v3 section |
| D3 | Suggested `src/features/` tree | Keep the existing domain folders, and add `src/jukebox/`, `src/stories/`, `src/sonification/series/`, `src/datasets/adapters/`, `src/countries/`. | v3 §9: "adapt names to the current codebase" |
| D4 | Router / multiple pages | Keep hash state (no router dependency). Add the views `jukebox` and `about` to the existing `Track` union, with deep links via the share hash. | Works with Vercel's static hosting, no rewrite rules |
| D5 | "Planet" carousel (Feature D) | Build it as an **Earth topic carousel** (ocean heat, greenhouse gases, rain, fire, sea ice, temperature), each with a real visual. It lives on the landing page and feeds into the Jukebox. | v3 §7 allows "planet/topic/region" and asks not to duplicate the globe |
| D6 | Country aggregation | Points (fire) → count / max inside the border. Grid cells → "N cells whose centre falls inside", with their mean labelled as such. POWER → a labelled single-point series. No area-weighted averages. | v3 §5 / §9: make the method clear and don't overstate |
| D7 | Long time series per country | Read the **monthly** POWER values that `fetchPlaceClimate` already downloads (it currently keeps only the annual value). This gives real monthly T2M and precipitation for 1981–2025 at the country's representative point. | It's real, timestamped data for the Jukebox timeline without a new source |
| D8 | One primary sonification mode first | A new **series sonifier** for the Jukebox. The existing A1/A2/B1/B2 engines are left alone, and B2 moves to the new sonifier only after parity tests. | Preserves working audio |

---

## 4. Phases and file-by-file plan

**Protocol for every phase** (from v3 §16): state the goal and files → implement only that phase on its branch → `npm run lint && npm test && npm run build` → keyboard and reduced-motion check of the new UI → review the diff for deletions, secrets and unrelated formatting → EN + বাংলা strings → one local commit → update §7 of this file. Stop and ask before any destructive or architecture-level change not listed here.

### Phase 0 — Audit and safety ✅
This document. **Gate met:** §1 lists what exists, §2–§3 say what will be kept and what will change.

### Phase 1 — Design foundation · branch `feat/design-foundation` ✅

Goal: one token set, the new navigation, the landing page structure with the scroll-linked hero (Feature A), the About page and the footer.

| File | Change |
|---|---|
| `src/index.css` | Make the current set the only token set. Add `--surface`, `--accent` (cyan, = `--rain`), `--accent-warm` (= `--brass`), `--teal`, `--radius-*`, `--space-*`, `--ease-*`, `--dur-*`. Map the legacy `--bg-space-*` / `--accent-*` / `--text-*` names as aliases, then remove them once a grep finds no users. Remove the unused `Outfit` / `JetBrains Mono` stack. Add a `@media (prefers-reduced-motion)` block that zeroes the `--dur-*` tokens. |
| `src/App.css`, `src/space-background.css`, `src/space-background.js` | Audit the starfield. Keep it only if it's cheap. Pause it on `prefers-reduced-motion` and when the tab is hidden. |
| `src/components/Header.tsx` | New nav (D2) with `aria-current`, a mobile disclosure menu (focus trap, Esc closes, returns focus), and a compact playback indicator when any player is active (reads a new `usePlayback()` context). The sound chip, settings, data and record buttons stay. |
| `src/lib/playbackContext.tsx` (new) | A small context so the Header can show "playing: <story>" and pause it. |
| `src/components/LandingHero.tsx` → `src/landing/Landing.tsx` (new folder; the old component becomes its first section) | Sections: (1) hero: headline, one line on data→sound, CTAs **Explore the globe** and **Listen to a data story** (the existing "Listen now" flow); (2) split: copy left, globe right; (3) immersive globe with an exploration prompt; (4) the existing track "records" with real waveforms; (5) topic carousel (Phase 4); (6) footer. |
| `src/landing/useScrollStage.ts` (new) | IntersectionObserver → stage `0..2` as a data attribute. CSS `animation-timeline: view()` where supported. No wheel listeners. |
| `src/globe/GlobeCanvas.tsx` | A `framing` prop (`'hero' \| 'split' \| 'immersive' \| 'explore'`) that eases the camera offset and zoom. Idle rotation slows down, and stops under reduced motion. |
| `src/components/GlobeBoundary.tsx` (new) | Error boundary + WebGL check. Falls back to a still globe in the hero (`GlobeStill`; see the Phase 1 notes on why not `sonic_earth_hero.jpg`) and to `Accessible2DMap` in the Atlas. |
| `src/about/AboutPage.tsx` (new) | Sections: how sonification works, mapping tables (from `DATASET_CATALOG`), data sources, limitations, accessibility controls, credits. `DataMethodDialog` stays and links here. |
| `src/components/Footer.tsx` (new) | Credits, NASA source links, repo link, "sound is data sonification, not a recording". |
| `src/components/Header.tsx` (`Track` union), `src/lib/shareLink.ts` | Add `about` (and later `jukebox`) views. Old hashes still decode. |
| `src/lib/strings.ts` | EN + বাংলা for everything above. |

**Gate:** all four existing tracks open from the new nav. The landing page reads well at 320 px with WebGL off and reduced motion on. Old share links still work.

### Phase 2 — Globe and country selection (Feature B, part 1) · branch `feat/country-selection`

| File | Change |
|---|---|
| `src/countries/countries.ts` (new; `lib/power.ts` re-uses it) | `loadCountries(res: '110m' \| '50m')`, `findCountry(lat, lon)`, `representativePoint(country)` (largest polygon's centroid, falling back to an interior point checked with `geoContains`), `bbox`. The id is ISO 3166-1 numeric from world-atlas, with an alpha-3 map in `countries/iso.ts` for display and links. |
| `src/countries/useCountry.ts` (new) | Selected country state + share-hash key `c=<alpha3>`. |
| `src/countries/CountryPicker.tsx` (new) | ARIA 1.2 combobox: type-ahead over EN + বাংলা names, arrow keys, Enter, Esc, "n results" live region. Sits outside the canvas, in the Atlas side panel and the Jukebox left column. |
| `src/globe/GlobeCanvas.tsx` | Country outline as a separate `LineSegments` object (selected = brass, thick; hover = thin cyan + label tooltip), click/tap → select (raycast to lat/lon → `findCountry`), a drag threshold so rotating doesn't select, fly-to the representative point (jump when reduced motion is on), and a **Reset view** button. |
| `src/map/Accessible2DMap.tsx` | Same outline and selection on the 2D map. |
| `src/accessibility/AudioFirstMode.tsx` | Adds the picker. |
| `src/lib/placesBn.ts` | Bengali country names for the common set. |

Selected state is shown with outline + label + text in the panel, never colour alone.
**Gate:** a country can be chosen by keyboard only, without WebGL, on the globe, the 2D map and in audio-first mode, and the choice survives a share link.

### Phase 3 — Data registry and country science profile (Features B part 2, F) · branch `feat/data-registry` ✅

| File | Change |
|---|---|
| `src/datasets/series.ts` (new) | Types: `DataSeries { id, variable, unit, source, sourceUrl, attribution, coverage: 'country'\|'points-in-border'\|'cells-in-border'\|'point-sample'\|'global-context', spatialResolution, temporalResolution, period, points: {t: string; v: number \| null}[], snapshotDate?, isLive, isSample, method, limitations }`. |
| `src/datasets/adapters/` (new): `gistemp.ts`, `vitalSigns.ts`, `monsoon.ts`, `firms.ts`, `precip.ts`, `sst.ts`, `power.ts`, `eic.ts` | One typed adapter per source, reading the same files and APIs as today. Validation drops invalid values to `null` (never invented). `power.ts` adds monthly series (D7) with an in-memory + `sessionStorage` cache (try/catch), abort and retry. |
| `src/datasets/registry.ts` (new) | Lists the datasets with an `availableFor(country \| 'global')` answer following D6. Bangladesh → also the monsoon divisions. |
| `src/countries/countryCoverage.ts` (new) | Pure function: country + loaded observations → coverage rows (count, max or mean of N cells, period, method). |
| `src/components/data-status/ProvenanceCard.tsx` (new) | Variable, unit, period, resolution, source link, attribution, badge **Snapshot (date)** / **Live** / **Global context** / **Sample**, and an expandable "method and limits". |
| `src/components/data-status/DataState.tsx` (new) | Shared loading / empty / stale / error + retry / offline states. |
| `src/countries/CountryProfile.tsx` (new; `atlas/PlacePanel.tsx` reuses its parts) | Name + ISO code, the available categories with coverage labels, the selected range, the latest source timestamp only when the file has one, a sparkline (POWER monthly or annual), **Explore its sound** (opens the Jukebox on this country), and an empty state. |
| `src/datasets/adapter.ts` | Builds the Atlas slices through the new adapters. Output stays identical (checked by a snapshot test). |

**Gate:** every number on screen can be traced to a source, a unit, a period and a method. A country with no data shows the empty state, not filler.

### Phase 4 — Data Jukebox: synchronized timeline, story row and topic carousel (Features C, D) · branch `feat/data-jukebox` ✅

| File | Change |
|---|---|
| `src/stories/stories.ts` (new) | Story registry built from the data registry: global (temperature 1880–, CO₂, sea ice, SST month, FIRMS 2–5 Oct, each of the 4 EIC frames), Bangladesh (8 divisions), and per-country stories created on demand (POWER monthly temperature and rain, fire inside the border). Each story has `{id, topic, region, datasetIds, period, visual, isSample}`. A test asserts that every story resolves to a real dataset. |
| `src/jukebox/useJukebox.ts` (new) | Reducer with the state `{storyId, cursor, filters, playback}` and the actions `selectStory`, `setCursor(origin)`, `setFilter`, `resetFilters`, `country/dataset changed → remap or reset cursor`. The `origin` field breaks feedback loops (R4). |
| `src/jukebox/JukeboxView.tsx` (new, lazy) | Desktop: three columns (`grid-template-columns: minmax(220px,1fr) minmax(200px,0.8fr) minmax(360px,1.6fr)`). Tablet: two columns, with filters in a drawer. Phone: tabs **Filters / Timeline / Story** with the player pinned at the bottom. |
| `src/jukebox/TimelineFilters.tsx` (new) | Period selector (only the ranges the dataset has), categories, country summary + picker, source filter, Reset. |
| `src/jukebox/TimelineView.tsx` (new) | Vertical rail of real observation dates. When there are > 150 points it shows labelled buckets (year or decade) that expand. Gaps are marked. Roving tabindex, arrow keys / Home / End, the active item shown with a marker + bold + `aria-current`. IntersectionObserver syncs the active item while the user scrolls. Programmatic scroll is flagged and ignored. |
| `src/jukebox/StoryPanel.tsx` (new) | Title, a short explanation, the visual (EIC frame / GIBS tile / chart), a chart with the cursor highlight, `ProvenanceCard`, the player (Phase 5), the mapping legend and a text caption. |
| `src/jukebox/SeriesChart.tsx` (new) | Lightweight SVG line chart with a cursor, gaps drawn as breaks, a unit-labelled axis and a `<table>` alternative. |
| `src/stories/StoryRow.tsx` (new) | Horizontal row: `scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain`, arrow buttons, ←/→ keys, active card centred, neighbours partly visible ≥ 1024 px. Cards show the topic, region, period, a real visual, and a "sample" tag if needed. |
| `src/stories/TopicCarousel.tsx` (new, used on the landing page) | Feature D as D5: centred active topic, prev/next buttons, three stages **Overview → Split detail → Immersive detail** with Back at every stage and "Skip animation", reduced motion = crossfade. "Listen" opens that topic's story in the Jukebox. |
| `src/tracks/FrameJukebox.tsx`, `BangladeshMonsoon.tsx`, `VitalSigns.tsx` | Unchanged inside. Opened from Jukebox "collections" cards and still deep-linkable. |
| `src/App.tsx`, `src/components/Header.tsx`, `src/lib/shareLink.ts` | `jukebox` view, hash keys `story`, `t`, `c`. |

**Gate:** changing the story, filter, country or timeline item always updates the chart, panel and caption together, with no flicker and no loops (tested with the reducer). The layout works at 320 px with no horizontal page scroll, and the story row doesn't trap vertical scroll.

### Phase 5 — Series sonification engine (Feature E) · branch `feat/series-sonification`

| File | Change |
|---|---|
| `src/sonification/series/mapping.ts` (new, pure) | `mapPoint(value, prev, spec) → {freq, pulses, timbre, gain} \| silence`. Defaults: value normalized against a **fixed per-dataset reference range** (stable across periods) → pentatonic pitch G3–G5 (196–784 Hz); \|rate of change\| → 1–6 pulses per step; for anomaly datasets only, above / below the baseline → warm triangle / soft sine; `null` → silence + gap. Gain is capped and smoothed (no jumps > 6 dB). |
| `src/sonification/series/specs.ts` (new) | One `SonificationSpec` per dataset: reference range, baseline, scale, step duration, a plain-language legend (EN + বাংলা). |
| `src/sonification/series/playbackState.ts` (new, pure) | `idle → loading → ready → playing ⇄ paused → ended`, plus `error`. Invalid transitions are no-ops, and the event log is used in tests. Replaces the narrower type in `types/sonification.ts` (kept as an alias). |
| `src/sonification/series/SeriesPlayer.ts` (new) | Lookahead scheduler (25 ms tick, ≤ 2 s window) on the shared context through the existing limiter in `audio/audioContext.ts`. `start / pause / resume / stop / seek(index) / setVolume / setMute / setSpeed`, time mode **even steps** or **proportional to real time** (for uneven intervals), an `onCursor` callback (rAF-throttled) → `useJukebox.setCursor('playback')`, and `dispose()` disconnects the bus. The node counter is shown in Diagnostics. |
| `src/sonification/series/compare.ts` (new) | A/B two periods with the same spec: left ear / right ear, or one after the other. |
| `src/jukebox/PlayerControls.tsx` (new) | Play/pause, stop, seek slider (`role="slider"`, arrow keys), volume, mute, speed, time mode, compare, the state shown as text, and an "Audio is data sonification" note. Audio only starts from a click. |
| `src/jukebox/MappingLegend.tsx` (new) | Live legend: the current value and unit → note name, pulses, timbre, and why. Mirrored in an `aria-live` caption throttled to 1/s. |
| `src/components/DiagnosticsPanel.tsx` | Shows active nodes and the player state. |

**Gate:** the same story and range always produce the same note sequence (snapshot test of the scheduled events). Playing, seeking and switching country 20× leaves no growing node count. A listener can read why each sound happens.

### Phase 6 — Polish, accessibility and performance (Features G, §11, §12) · branch `feat/polish-a11y-perf`

- Motion: hero stage transitions, card hover (`translateY(-2px)`), timeline active transition, carousel easing. All of it goes through the `--dur-*` tokens, so reduced motion turns it off. Non-essential motion (starfield, idle rotation) has a pause control in Settings.
- A11y audit: landmarks and heading order on every view, focus order, visible focus, combobox / timeline / carousel / slider ARIA, selected state not shown by colour alone, contrast of the new tokens (extend `contrast.test.ts`), 200% zoom, 320 px, VoiceOver + Safari and NVDA + Firefox pass.
- Performance: split `GlobeCanvas` further (textures loaded after first paint), 50m borders only on demand, WebP/AVIF for the hero image and the EIC frames, `React.memo` only where the profiler shows rerenders during rotation or playback, and dispose geometry, materials and textures on unmount.
- Fix the 2 remaining lint warnings.

**Gate:** the site is fully usable with JavaScript animation off, with WebGL off and at 320 px. No lint warnings.

### Phase 7 — Testing and submission readiness · branch `chore/release-checks`

- Add the dev dependencies from §2. Add `test:e2e` and `test:a11y` scripts, and add the e2e job to CI (allowed to fail at first).
- Run the full test plan (§6), fix regressions, and check the Vercel preview and production.
- README, PROJECT_SUMMARY, JUDGE_QA, DEMO_SCRIPT: new structure, country coverage method, sonification specs, source list, limits.
- Demo narrative (§8). Check the official submission requirements and submit through the required platform (team decision on who submits).

**Gate:** a clean, reproducible build, all checks reported honestly, and an end-to-end demo rehearsed on production.

---

## 5. Feature acceptance checklist (v3 §13)

| Check | Phase | Status |
|---|---|---|
| Existing deployed functionality remains available | all | ✅ today; re-check each phase |
| Global navigation works on all views | 1 | ✅ (Explore Earth · Data Jukebox · About the Science; mobile menu) |
| Country selectable via globe **and** searchable control | 2 | ✅ (globe click, 2D-map click, combobox on globe / map / list views; also `C` on the 2D map's focus point) |
| Selected country clearly indicated (not colour alone) | 2 | ✅ (outline + “Selected country” card with name, code and point; “· Selected” label on the 2D map) |
| Only genuinely available datasets listed per region | 3 | ✅ (`availableFor`: gridded layers only with a cell or point inside the border, monsoon only for Bangladesh, global records labelled as context) |
| Source, units, period and limitations visible | 3 | ✅ (`ProvenanceCard` on every country figure; Data & Method dialog for the Atlas layers) |
| Timeline selection updates the active data story | 4 | ✅ (Jukebox: timeline, chart click, step bar and share link all drive one reducer; chart cursor, caption, table row and hash move together) |
| Timeline, chart and audio synchronized | 4–5 | ◐ (timeline + chart + caption ✅ in the Jukebox; audio for series stories is Phase 5) |
| Sonification mapping deterministic and documented | 5 | ◐ (existing tracks yes; series sonifier ☐) |
| Play, pause, resume, stop, volume and error handling | 5 | ◐ |
| No audio starts unexpectedly | 1–5 | ✅ today |
| Horizontal story row: keyboard, pointer, touch | 4 | ✅ (←/→/Home/End, arrow buttons, scroll-snap, `overscroll-behavior-x: contain`; vertical wheel over the row scrolls the page) |
| No horizontal overflow on responsive layouts | 1, 4, 6 | ✅ landing, About and Jukebox checked at 320 px (Jukebox: `scrollWidth` = 320) |
| Reduced motion respected | 1, 6 | ✅ `--dur-*` zeroed, globe framing jumps, idle spin, clouds and starfield stop; re-check in 6 |
| WebGL failure doesn't block country exploration | 2 | ✅ (WebGL off: 2D map in the Atlas with the same picker, outline and click selection; checked in Chromium with `--disable-webgl`) |
| Empty, loading, stale and API-error states usable | 3 | ✅ (`DataState`; profile empty state, POWER error + retry, offline sample) |
| No fabricated data presented as official | all | ✅ today (offline sample is labelled) |
| Production build and automated tests pass | each | ✅ today |

---

## 6. Test and verification plan

| Layer | What | Tool | Phase |
|---|---|---|---|
| Unit | `countries` lookup, representative point, ISO map | vitest | 2 |
| Unit | Share-hash v1 and v2 round-trip, unknown keys ignored | vitest | 1, 2, 4 |
| Unit | Every adapter with fixtures: units, `null` for invalid values, POWER monthly parsing, cache, error | vitest | 3 |
| Unit | `countryCoverage`: inside/outside, empty country, Bangladesh, a centroid outside its polygon | vitest | 3 |
| Unit | Atlas slices unchanged after the adapter refactor (snapshot) | vitest | 3 |
| Unit | Story registry integrity (each story → a real dataset; samples flagged) | vitest | 4 |
| Unit | `useJukebox` reducer: origin-tagged actions don't loop; country change remaps the cursor | vitest | 4 |
| Unit | `mapping`: normalization bounds, fixed reference range, gaps → silence, gain cap, determinism | vitest | 5 |
| Unit | `playbackState` transition table, including invalid ones | vitest | 5 |
| Unit | `SeriesPlayer` with a fake `AudioContext`: scheduling window, seek, dispose leaves 0 nodes | vitest | 5 |
| Unit | Contrast of all new token pairs | vitest (`contrast.test.ts`) | 1, 6 |
| Component | CountryPicker, TimelineView, StoryRow, TopicCarousel, PlayerControls keyboard behaviour | RTL + jsdom | 2, 4, 5 |
| Browser | Smoke: every view loads; select a country by search; timeline change updates the story; Play changes state to "playing"; no console errors | Playwright | 7 |
| Browser | axe scan of landing, Atlas, Jukebox and About | @axe-core/playwright | 7 |
| Manual | WebGL off, reduced motion, 320 px / tablet / desktop, 200% zoom, VoiceOver and NVDA pass, offline (POWER blocked), 20× country change + play/stop with the node counter and the memory tab | Browser | 6, 7 |
| Every phase | `npm run lint`, `npm test`, `npm run build`, Vercel preview | CI | all |

Results are reported as actually run. Failures are listed, not suppressed.

---

## 7. Progress log

| Phase | Status | Branch | Checks | Notes |
|---|---|---|---|---|
| 0 Audit and plan | ✅ Done | — | test 47/47 · lint 2 warnings · build ✅ | This document |
| 1 Design foundation | ✅ Done | `feat/design-foundation` | test 65/65 (6 files) · lint 0 errors, 11 warnings (`main` has 12 with this oxlint) · build ✅ (same >500 kB `GlobeCanvas` warning) · Playwright check (Chromium): landing stages 0→1→2, every nav item and collection, old `#v1&track=frames&frame=…&col=40` link, `#v1&track=about&lang=bn`, 320 px with no horizontal scroll, mobile menu focus trap + Esc, WebGL off, header playback chip pause, 0 page errors | See Phase 1 notes below |
| 2 Country selection | ✅ Done | `feat/country-selection` | test 83/83 (8 files) · lint 0 errors, 11 warnings (same count as Phase 1) · build ✅ (same >500 kB `GlobeCanvas` warning) · Playwright (Chromium, swiftshader): `#…&c=BGD` restores the selection, keyboard-only type → Enter selects and writes `c=NPL`, globe hover + click selects and fly-to arrives, WebGL off → 2D map + picker + click, list view has one picker, 360 px বাংলা sheet with no horizontal scroll, old `frame`/`col` link untouched, 0 page errors | See Phase 2 notes below |
| 3 Data registry and profile | ✅ Done | `feat/data-registry` | test 112/112 (11 files) · lint 0 errors, 11 warnings (same count as Phase 2) · build ✅ (same >500 kB `GlobeCanvas` warning) · Playwright (Chromium): `#…&c=PNG` shows 3 fire cells, strongest 286.91 MW, 4 days, snapshot badge and method; `c=BGD` shows “nothing inside the border” for all three layers, the monsoon line and global context; POWER blocked → error + retry; 0 page errors | See Phase 3 notes below |
| 4 Data Jukebox | ✅ Done | `claude/festive-feynman-0pz0ie` (session branch, in place of `feat/data-jukebox`) | test 139/139 (14 files) · lint 0 errors, 11 warnings (same count as Phase 3) · build ✅ (same >500 kB `GlobeCanvas` warning; main `index` chunk unchanged at 388 kB, Jukebox 26.5 kB and carousel 6 kB lazy) · Playwright (Chromium): `#…&track=jukebox&story=gistemp&t=1998` restores story + cursor, timeline click and ↓ update chart cursor, caption and hash together, wheel over the rail moves the cursor, country search adds Bangladesh stories, step-through runs and stops, tablet drawer opens with focus and Esc returns focus, 320 px বাংলা with reduced motion has no horizontal scroll, vertical wheel over the story row scrolls the page, carousel → Jukebox on `co2`, profile “Explore its sound” on PNG → `c-png-temp`, old `frame`/`col` link untouched, 0 page errors | See Phase 4 notes below |
| 5 Series sonification | ☐ | `feat/series-sonification` | | |
| 6 Polish, a11y, perf | ☐ | `feat/polish-a11y-perf` | | |
| 7 Testing and submission | ☐ | `chore/release-checks` | | |

**Phase 1 notes**
- One token set in `src/index.css`. Added `--surface`, `--accent`, `--accent-warm` (aliases, so high contrast flows through), `--teal`, `--radius-*`, `--space-*`, `--ease-*`, `--dur-*`, `--header-h`. Legacy `--bg-space-*` / `--accent-*` / `--text-*`, the `Outfit` / `JetBrains Mono` stack and unused utilities had no users (grep), so they were removed directly, not aliased. `src/App.css` was unimported Vite template CSS and is deleted. `contrast.test.ts` follows `var()` aliases and covers the new tokens.
- Starfield (`space-background.js`) kept: it is a cheap 2D canvas. It now draws one still frame under reduced motion (OS or the app's setting) and stops while the tab is hidden.
- Navigation: `src/lib/nav.ts` holds `Track`, `TRACKS`, `sectionOf`. The Data Jukebox is a section whose collections (A2/B1/B2) show as a second header row; it reopens the last collection. Below 1024 px a disclosure menu with a focus trap replaces the nav. "Listen now" stays in the header and becomes a "Playing: …" chip (pause) while any player runs (`src/lib/playbackContext.tsx`; each track reports with one `usePlaybackReport` line).
- Landing (`src/landing/`): hero → split → immersive drive the globe `framing` through `useScrollStage` (IntersectionObserver only, no wheel listeners). Records, "how data becomes sound" and the footer follow. Sections 4–5 use `animation-timeline: view()` where supported. The topic carousel slot is left for Phase 4. `LandingHero.tsx` was merged into `Landing.tsx`.
- **Deviation:** `public/images/sonic_earth_hero.jpg` is not used as the no-WebGL fallback. It shows a NASA logo, a "LIVE VISUALIZATION" label and charts with invented numbers, which breaks the no-fabricated-data and no-live-badge rules. `GlobeStill` draws the real Blue Marble texture on a static disc instead. The image is still in `public/` (unused). The team decides whether to delete it.
- The view is mirrored into the share hash (`#v1&track=…`). A hash that already names the current track is kept, so frame and column keys survive. `about` is a new track id, and unknown keys (`story`, `c`) are ignored.
- Not done here (by plan): component tests (RTL arrives with Phase 2's combobox), a VoiceOver/NVDA pass (Phase 6).

**Phase 2 notes**
- `src/countries/`: `iso.ts` (numeric → alpha-3 for every 110m/50m shape that has an ISO code), `countries.ts` (`loadCountries('110m'|'50m')`, `findCountry`, `representativePoint`, `outlineSegments`, `outlinePath`, `latLonToXYZ` / `xyzToLatLon`), `search.ts`, `useCountry.ts`, `CountryPicker.tsx` (ARIA 1.2 combobox, “n countries found” live region), `CountryPanel.tsx`. `lib/power.ts` `countryName` now uses the same list. Share hash gains `c=<alpha3>`, validated against the ISO table; old links decode unchanged.
- Shapes with no ISO id (N. Cyprus, Somaliland, Kosovo, Siachen, Indian Ocean Ter.) are not selectable. 174 countries at 110m. 50m is a separate lazy chunk (757 kB) that nothing requests yet, it is there for Phase 3 if the coarse 110m borders hurt.
- Globe: separate `LineSegments` outlines (selected = brass, three stacked rings because WebGL lines are 1 px; hover = thin cyan + a text tooltip), a click selects only when it was not a drag (6 px) and not on a marker, fly-to the representative point runs until it arrives (a jump under reduced motion), **Reset view** button. The Atlas still picks the place for “Hear any place” on the same click.
- **Pre-existing bug fixed:** the globe's lat/lon → xyz formula (pin, observation markers, click-to-place, tour fly-to) was 90° off from the texture, so markers sat in the wrong place and a click on the Sahara read as Myanmar. One shared `latLonToXYZ` / `xyzToLatLon` now matches three's sphere UV layout, with a unit test that compares it with `SphereGeometry` vertices. Fire/rain/SST markers and the tour regions now land on the right place.
- 2D map: selected outline + “Country · Selected” label, click selects, and `C` selects the country at the keyboard focus point (the HUD names it). Known, pre-existing: every arrow key / click on the map opens the observation modal, which takes focus. The picker is the reliable keyboard route there.
- List view (`AudioFirstMode`) has the picker; the side-column copy is hidden in that view so there is one combobox. On phones a “Country” button opens the same panel as a sheet.
- Dev dependencies added (planned in §2): `@testing-library/react`, `@testing-library/dom`, `jsdom` (component test uses a per-file `@vitest-environment jsdom`).
- Not done here: Bengali names cover ~150 common countries, the rest fall back to English in বাংলা mode. No VoiceOver/NVDA pass yet (Phase 6). The Jukebox left column gets the picker in Phase 4.

**Phase 3 notes**
- `src/datasets/series.ts`: `DataSeries` as in the plan, plus `cleanValue` (anything non-finite or ≤ −900 becomes `null`), `periodOf`, `getJson`. Adapters in `src/datasets/adapters/`: `gistemp`, `vitalSigns`, `monsoon` (8 division series), `firms`, `precip`, `sst` (loaders plus the source metadata the coverage rows cite), `eic` (provenance records, no numbers), `power` (monthly T2M and PRECTOTCORR 1981–2025, D7) and `common`. Same files and APIs as before.
- `power.ts`: pure `parsePowerMonthly`, then `fetchPowerMonthly` with a memory + `sessionStorage` cache (every storage call in try/catch), abort, and 2 retries with backoff on network and 5xx errors only (not on 4xx, not on abort). Fewer than 5 valid annual years throws rather than showing a thin series. `lib/power.ts` `fetchPlaceClimate` now reads the annual values from it, so “Hear any place” is unchanged and shares the cache.
- `datasets/registry.ts`: 8 entries and `availableFor(country | 'global', coverage)`. A gridded layer is listed only when `count > 0` inside the border. POWER monthly is listed for every country (a point on land, the representative point is checked to lie inside). The monsoon is Bangladesh only. Global records are returned as `global-context`.
- `countries/countryCoverage.ts` (pure, `geoContains` injected so d3-geo stays lazy): fire = distinct 2° cells whose centre is inside, strongest FRP, cells per day; rain = mean of the grid points inside, labelled “mean of N”; SST = cells inside, counted once (the monthly map repeats on each date). No area-weighted averages (D6). Tests cover inside, outside, a bounding box that is not the border (Chile vs Argentina), SST counted once, and an empty country.
- UI: `components/data-status/ProvenanceCard.tsx` (+ `badge.ts`: **Snapshot (date)** / **Live** / **Global context** / **Sample**, a snapshot never shows Live, a sample always says Sample), `DataState.tsx` (loading / empty / stale / error / offline, icon + text, retry), `countries/CountryProfile.tsx` (rendered under the picker card in `CountryPanel`, so the Atlas side column, the phone sheet and the list view all get it). It shows coverage rows, the plotted range, the latest file stamp, POWER annual-temperature sparkline with a table alternative and two provenance cards, global context, “Explore its sound”, and the empty state. While the offline sample is playing no country figures are computed. App data reaches it through `ProfileDataContext` (`countries/profileContext.ts`), so `AudioFirstMode` needed no new props. EN + বাংলা strings added.
- `DatasetAdapter.loadDatasets` now goes through the adapters and drops observations with a non-finite value or out-of-range coordinates (none in the bundled files). `src/__tests__/atlasSlices.test.ts` snapshots the slices, written on `main`'s code before the refactor, and still passes. `AdapterResult` gained `snapshotDates`. The data-fixture helper `src/__tests__/fixtures.ts` reads `public/data` through `import.meta.glob`, so no node typings were added.
- **Deviation:** “Explore its sound” opens the Data Jukebox on the last collection (Bangladesh opens the monsoon). Country stories, and therefore a Jukebox that opens on the country, arrive with Phase 4, and the button note says so. The other “latest source timestamp” fields show the file's `generated` date (the files carry no other stamp).
- Not done here: the 50m borders are still not requested (110m is enough for the cell-centre test; a cell within ~110 km of a border can fall on either side and the method text says so). No `PlacePanel` refactor to share profile parts beyond the POWER adapter. VoiceOver/NVDA pass is Phase 6.

**Phase 4 notes**
- `src/stories/stories.ts`: 17 fixed stories (5 global series, 4 EIC pictures, 8 Bangladesh divisions) plus per-country stories built on demand (`c-<a3>-temp`, `c-<a3>-rain` from POWER monthly at the representative point, `c-<a3>-fire` only when a fire cell lies inside the border). `remapStoryId` keeps the same kind of story across a country change. `src/stories/loadStory.ts` turns a story into a `DataSeries` from the same files and APIs (bundled files fetched once and shared), with pure `fireWeekSeries` (strongest cell per day) and `sstMonthSeries` (the file's own area-weighted mean). A test loads every global and Bangladesh story from the real files and asserts a non-sample, non-live series with source, unit, method and limits.
- `src/jukebox/useJukebox.ts`: one reducer (`setStories`, `selectStory`, `seriesLoaded`, `setCursor(origin)`, `step`, `setFilter`, `resetFilters`, `setPlaying`). Loop breakers: a cursor set to its current value returns the same state object, scroll-origin moves are ignored while step-through runs, late series answers for another story are dropped, the cursor snaps to the nearest real date (also across granularities, `1998` → `1998-01`), a period filter is swapped when reversed and cleared when the new series lacks those years. Tested, including an "echo every change back" fixed-point check.
- Views (`src/jukebox/`): `JukeboxView` (lazy; story row, then filters · timeline · story; tablet drawer with focus + Esc; phone Filters / Timeline / Story switch and a pinned step bar), `TimelineFilters` (country picker + summary, period from the years present, topic / region / source, Reset), `TimelineView` (roving tabindex, ↑/↓/Home/End, buckets above 150 points by year or decade with →/← and gap counts, `aria-current` + filled marker + bold; IntersectionObserver sync only on wheel / touch / scrollbar intent and never within 700 ms of a programmatic scroll or a pick), `SeriesChart` (SVG, breaks at gaps, unit axis, zero line for anomalies, click to set the cursor, table alternative), `StoryPanel` (title, blurb, EIC picture or chart, caption with the change from the last real value, `ProvenanceCard`, and a button to the collection that plays it). `src/stories/StoryRow.tsx` and `src/stories/TopicCarousel.tsx` (landing section 5, lazy; six topics with an EIC picture or a sparkline of the real series; Overview → Split → Immersive with Back, Skip animation, reduced motion = fade only).
- Navigation: `jukebox` is a new track id and the default target of “Data Jukebox”; the collections row starts with “Stories”, then A2/B1/B2 unchanged. Share hash gains `story` and `t` (shape-checked; unknown story ids fall back to the first story). The country profile's “Explore its sound” now opens the Jukebox on `c-<a3>-temp`.
- **Deviations:** (1) The work is on the session branch `claude/festive-feynman-0pz0ie`, not `feat/data-jukebox`. (2) Phase 4 makes no sound for series stories: “Step through” only moves the cursor and says so; each story with an existing player has “Hear it in …” (EIC pictures open the frame player on that frame). Country temperature/rain stories have no player until Phase 5 and say so. (3) The global fire story uses every day in `firms_snapshot.json` (2–7 Oct), not only the Atlas's 2–5. (4) The visual in the story panel is the EIC picture or the chart; no GIBS tile was added. (5) Bangladesh division stories are always listed (region “Bangladesh”), and come right after the country stories when Bangladesh is selected.
- Not done here: the series player, mapping legend and live caption throttle (Phase 5), a VoiceOver / NVDA pass (Phase 6). Story periods on cards are shown in English month names in বাংলা mode.

**Next safe action:** Phase 5. Branch from `main` after this PR merges. Start with the pure `src/sonification/series/mapping.ts` and `playbackState.ts` with their tests, then `SeriesPlayer` against a fake `AudioContext`, then replace the Jukebox step-through with `PlayerControls` (the reducer's `setPlaying` / `step('playback')` are the hook-in points).

---

## 8. Demo narrative (v3 §15)

1. Landing: "Sonic Earth Atlas turns NASA Earth data into sound you can explore." Scroll once: the globe moves from the hero into the split view.
2. **Explore the globe** → type "Myanmar" in the picker (keyboard). The globe flies there and the border is outlined.
3. The profile lists what we really have: fire detections inside the border (snapshot 2–5 Oct), monthly temperature and rain at a labelled point (NASA POWER 1981–2025), and EIC frames as global context. Each has a source card.
4. **Explore its sound** → the Jukebox opens on Myanmar temperature. Pick 1981–1990 and 2016–2025 and compare them: the same mapping, one in each ear, and the second sits higher.
5. Step the timeline: the chart cursor, the caption and the sound move together. The legend explains the note.
6. Open an EIC frame story in the row to show the challenge's core pairing, then Bangladesh → monsoon divisions.
7. Accessibility in a few seconds: keyboard-only picker, text captions, reduced motion, WebGL off still works.
8. Close: sound gives another way to compare Earth data. It supports the visuals and doesn't replace them. Limits: snapshots, point samples, 110m/50m borders.

---

## 9. Still open from earlier roadmaps (team-owned)

- User test results (`docs/user-testing.md`, `JUDGE_QA` §6, `[User quote]` in `DEMO_SCRIPT`).
- Video length and format rules, and who submits.
- `origin/docs/user-testing` and `origin/fix/lint-and-cleanup` aren't merged into `main` by ref. Their commits look like they were brought in another way ("docs: add user-testing kit", "fix: attach keyboard listener once…" are on `main`). Diff them against `main`, then merge or delete them.
