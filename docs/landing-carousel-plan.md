# Phase 9 — Landing carousel (plan) · ✅ done

Branch: `feat/landing-carousel`. Replaces the landing page's WebGL globe with a horizontal "world carousel" and a three-level progressive disclosure, as in the team's reference frames (Overview → Detail → Immersive). The Atlas (`track=atlas`) keeps `GlobeCanvas`; only the landing page stops using it.

## 0. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **The carousel items are the four tracks, each shown as its own Earth** (A1 Fire Earth, A2 True-colour Earth, A3 Monsoon Earth, A4 Warming Earth), not Venus / Mars. | The challenge is the *Earth* Information Jukebox. Other planets would be decoration with no data behind them (CLAUDE.md: no fabricated data). Four "faces of Earth" keep the reference's layout and each one leads to a real track. |
| D2 | **No WebGL on the landing page.** Each Earth is a CSS/SVG sphere: `public/textures/earth_atmos_1024.jpg` as an equirectangular `background-image`, scrolled on `background-position-x` for the spin, with a `radial-gradient` terminator, rim glow and the track's data drawn on top (fire points / GIBS true colour / rain cities / anomaly tint). | Removes the 3D scene, the `LandingSignal` loop and the >500 kB `GlobeCanvas` chunk from first load. Works with WebGL off, so `GlobeStill` is no longer needed on the landing. No new runtime dependency. |
| D3 | **One page, no scroll-jacking.** Levels are UI state (`level: 1 | 2 | 3`), not scroll stages. The topic carousel, "how data becomes sound" and the footer stay below, reached by the ↓ button or normal scroll. | The old scroll-staged globe was the main source of jank (Phase 8B). State-driven levels are testable and keyboard-friendly. |
| D4 | **Serif display face for headings only:** self-host **Cormorant Garamond** 500/600 (Latin, OFL, ~60 kB) for the carousel name and level titles. বাংলা headings keep Noto Sans Bengali (no Bengali serif added: +200 kB for a heading is not worth it; revisit if the team wants Noto Serif Bengali). Body/UI stay IBM Plex Sans. | Matches the reference (serif titles, sans body) with one extra file. |
| D5 | **Level 3 is a zoom into real imagery**, not a fake surface: the planet scales to cover the viewport, then cross-fades to a full-bleed still that belongs to the track (A2: GIBS VIIRS true colour of the date shown; A1: GIBS fire overlay; A3: `eic/geos-earth-now-rain.webp`; A4: the GISTEMP map/series). Each still carries source, date and method in a caption. | Keeps "show source, unit, period and method" and the "no live badge on snapshots" rule. |

## 1. Information per level (all strings EN + বাংলা in `strings.ts`)

| Level | Layout | Content | Actions |
|---|---|---|---|
| **1 Overview** | Active Earth centred and large (≈ 62 vmin, partly below the fold like the reference); neighbours peek at left/right edges (≈ 18 vmin, 40 % opacity) with their names in small caps. Kicker ("PLANET" → track code e.g. `A1 · FIRE`), serif name, one sentence, primary button **Get started**, ↓ at the bottom. Space Apps logo + "independent team entry" line stay in the header area. | `carouselKicker*`, `carouselName*`, `carouselLine*` | ← / → buttons, swipe, ArrowLeft/Right, dots; **Get started** → L2; ↓ scrolls to the sections below |
| **2 Detail** | Earth glides to the right half (transform only); left column: kicker ("THE BURNING PLANET" etc.), serif title, a brass rule, a 3–4 sentence paragraph with the real numbers of that track (count, period, source), **Learn more** + a round ▶ "Play a preview" button. | `carouselTitle*`, `carouselBody*` | **Learn more** → L3; ▶ plays a 5 s data preview through the existing engine; Back / Esc → L1 |
| **3 Immersive** | Earth scales up to fill the screen (`scale` + `clip-path` circle → inset), then the real still fades in; an overlay text block bottom-right with the educational copy, a source caption, and **Open this track** (goes to the track as `pickTrack` does today). | `carouselDeep*`, `carouselSource*`, `openTrack` | **Open this track**, Back / Esc → L2 |

Carousel arrows are disabled in L2/L3 (the reference only browses at L1); changing track from L2/L3 goes back to L1 first.

## 2. Files

| File | Change |
|---|---|
| `src/landing/WorldCarousel.tsx` (new) | State `{ index, level }`, prev/next, swipe (pointer events, 40 px threshold), keys, `aria-roledescription="carousel"`, each slide `role="group"` + `aria-label="2 of 4: …"`, live region announcing the active track. |
| `src/landing/EarthSphere.tsx` (new) | The CSS sphere: texture, terminator, glow, spin (CSS `@keyframes` on `background-position`, paused with `.rm` / `.calm` / reduced motion / tab hidden), optional data overlay (SVG points projected on the visible hemisphere from the real observations already loaded in App). |
| `src/landing/worlds.ts` (new) | The four world configs: track id, string keys, overlay kind, level-3 still + source meta. Pure, unit-tested. |
| `src/landing/Landing.tsx` | Hero + split + immersive sections → `<WorldCarousel>`. Keep the track records? **No**: the carousel *is* the track picker, so section 4 goes; topic carousel, how-it-works and footer stay. Remove `signal`, `onStage`, `useScrollStage`, `data-stage-index`. |
| `src/landing/useScrollStage.ts`, `src/landing/parallax.ts` | Delete `useScrollStage` (and its test). Keep `parallax.ts` for the star layers only (copy parallax goes). |
| `src/App.tsx` | Landing no longer mounts `GlobeCanvas`: condition becomes `track === 'atlas' && !showHero`. Remove `signal`, `stage`, `STAGE_FRAMING`, `HERO_ON`. The space background (`#space-bg`) stays behind the landing. |
| `src/globe/framing.ts`, `GlobeCanvas.tsx` | Drop the `landing` prop, `LandingSignal`, `framingAt`, the hero/split/immersive framings and the landing DPR/cover branches. Atlas path untouched (roadmap R2). |
| `src/components/GlobeBoundary.tsx` | `GlobeStill` stays for the Atlas-off case only if still used; otherwise removed. |
| `src/index.css` | `--font-serif`, `.font-serif`, `.carousel-*`, `.earth` classes; level transitions on `transform`/`opacity` only (`translate`, `scale`, 600 ms `cubic-bezier(.2,.7,.2,1)`; L3 zoom 900 ms); all instant under `.rm` / reduced motion; high contrast: neighbours at full opacity with a border, text on a solid scrim. |
| `public/fonts/cormorant-garamond-latin.woff2`, `index.html` | New font file + `@font-face` + fallback metrics; preload only on the landing. |
| `src/lib/strings.ts` | ~30 new keys × 2 languages. |
| `e2e/no-webgl.pw.ts`, `e2e/layout.pw.ts`, `e2e/helpers.ts` | Landing WebGL-off test now asserts the carousel renders (no still globe needed); waveform-alignment test moves to the topic carousel or is removed with section 4. |
| `src/__tests__/landingScroll.test.ts` | Replaced by `worldCarousel.test.tsx`. |

## 3. Behaviour details

- **Keyboard:** Tab order = prev, active slide CTA, next, dots. ←/→ change world at L1 only; Enter on CTA goes deeper; Esc goes up one level; focus moves to the new level's heading. Existing shortcuts (`?`, `g/m/l`, …) keep working; ←/→ are only captured while focus is inside the carousel.
- **Share links:** `?world=fire&level=2` (optional) so a demo can open straight on a level; old links unchanged.
- **Reduced motion / calm:** no spin, no glide, no zoom; levels switch with a 120 ms fade.
- **Phone (≤ 640 px):** L1 neighbours show as thin slivers (12 vmin); L2 stacks Earth on top (40 vh) and text below instead of left/right; L3 text sits at the bottom on a scrim. No horizontal page scroll at 320 px.
- **Performance:** only the active sphere spins; neighbours are static. Target: landing first load without the `GlobeCanvas` chunk, ≥ 55 fps during L2/L3 transitions (transform/opacity only, no layout).
- **Data honesty:** every number in L2/L3 comes from files already bundled (`fire`, `bangladesh_monsoon.json`, `gistemp_global.json`, GIBS date) and is labelled "snapshot · date · source".

## 4. Steps

| Step | What | Size |
|---|---|---|
| 9A | `worlds.ts`, `EarthSphere`, font file, CSS tokens; unit tests | S |
| 9B | `WorldCarousel` L1 (browse, swipe, keys, a11y) and swap it into `Landing`; remove WebGL from the landing in `App` | M |
| 9C | L2 detail (glide, copy, preview ▶) and L3 immersive (zoom, real still, caption, Open this track) | M |
| 9D | Clean-up: delete landing signal / framing / scroll-stage code, update e2e + a11y, বাংলা, high contrast, reduced motion | S–M |
| 9E | `npm run lint && npm test && npm run build`, `test:e2e`, `test:a11y`; screenshots 320 / 768 / 1280 EN + বাংলা; roadmap §5/§7 + `plan.md`; PR | S |

**Gate:** no WebGL context is created on the landing page; all three levels work by mouse, touch and keyboard; every existing check green.

## 5. Open questions for the team (answered with the recommended defaults)

1. D1: four Earths (recommended) vs. adding Moon/Mars as non-data "neighbours".
2. D4: is a serif without a Bengali serif acceptable, or add Noto Serif Bengali (~200 kB)?
3. Keep the old track-records waveform section below the carousel, or drop it (plan: drop)?

## 6. As built (differences from the plan)

- Sphere overlay: fire observations and the eight Bangladesh cities are drawn into a 1024×512 canvas once and used as a second background layer, so the points turn with the texture. A2 and B2 have no overlay (no per-place data).
- The ▶ preview is a 16-note melody resampled from the series on the card (fire values, Sylhet 2026 rain, GISTEMP anomalies); A2 has no series, so it has no ▶ button.
- `?world=` / `?level=` are read on load only (not written back).
- The headphones tip moved from level 1 to level 2 so it never sits on the Earth.
- Deleted: `useScrollStage`, `GlobeStill`, `LandingHero` (unused), the landing parts of `framing.ts` / `GlobeCanvas`. `parallax.ts` stays for the starfield layers.

## 7. 9F: real 3D planets (after team feedback)

The CSS discs read as flat images, so D2 is reversed: the four Earths are three.js spheres in one WebGL canvas (`WorldScene.tsx`), with relief and specular maps, clouds, an atmosphere rim, data points on the surface, spin and a pointer lean. Layout stays in CSS (invisible `.world-sphere` anchors); the scene reads each anchor's box every frame, so the 3D and the text move together. Level 3 keeps the planet and dives towards its surface (limb in view) instead of showing a flat picture; the caption says what the planet texture is. Software GL is detected (`WEBGL_debug_renderer_info`) and drawn at ~20 fps / DPR 1 / 32 segments. The CSS discs and the flat NASA picture remain as the no-WebGL fallback.

## 8. 9G: the four movements (team spec, Earth only)

1. **Hero anchor:** Earth sits half below the fold at the bottom centre; the neighbouring Earth views peek in at the left and right edges.
2. **Split view (Get started):** Earth translates to the right and rotates continuously on its axis (0.0045 rad per frame instead of 0.0012 at rest); the left column carries the title, the paragraph and key numbers counted from the bundled files.
3. **Dive (Learn more):** a fast camera zoom (scale 3.4, eased in the scene) until Earth fills the screen, then the canvas blurs (6 px) and dims into the backdrop of the reading card.
4. **Sweep:** prev / next at levels 1 and 2 push the current Earth out of frame on one side; the next one enters from the other side, never across the screen (the scene teleports a planet waiting off-screen to the edge it enters from).

The CSS anchors jump (no transition) in 3D mode and `WorldScene` eases position, size and brightness, so motion is frame-rate independent. Reduced motion: no spin, no lean, instant moves, no blur transition.
