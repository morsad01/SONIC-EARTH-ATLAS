# Sonic Earth Atlas — plan

The full plan, risks and progress log live in [`docs/roadmap-v3.md`](docs/roadmap-v3.md). This page is the short version.

## Current phase

**Phase 9 — Landing carousel: done (steps A–E, 9F real 3D planets, 9G the four movements).** Plan: [`docs/landing-carousel-plan.md`](docs/landing-carousel-plan.md). The old landing globe is replaced by a horizontal carousel of four 3D Earths (one per track) with three levels: L1 Overview (centred planet, neighbours peeking in at the edges, serif name, one line, Get started) → L2 Detail (planet glides right, title + paragraph + Learn more / ▶ data preview) → L3 Immersive (the camera dives towards the surface, the limb stays in view, educational text + source + Open this track). **9F:** the planets are real three.js spheres in one WebGL canvas (`src/landing/WorldScene.tsx`, 5 kB chunk sharing three.js): Blue Marble colour, relief and specular maps, a moving cloud layer, an atmosphere rim, the track's data points (FIRMS fires, the eight monsoon cities) on the surface, a slow spin and a pointer lean. CSS keeps the layout: each planet follows an invisible anchor per frame. Software GL gets a light mode (~20 fps, DPR 1); reduced motion stops spin, lean and redraws. CSS discs + the flat NASA picture are only the no-WebGL fallback. **9G movement (team spec):** (1) hero anchor: Earth half below the fold, bottom centre, the other Earth views peeking at the edges; (2) split: Earth translates right and rotates continuously on its axis (faster than at rest), with real key numbers on the left (fire detections and strongest fire, EIC pictures, 8 cities + Sylhet rain total, latest GISTEMP anomaly + years of record); (3) dive: a fast camera zoom until Earth fills the screen, then a soft blur, as the backdrop of the reading card; (4) sweep: switching pushes the current Earth out of frame and the next one slides in from the side it comes from (levels 1 and 2). The 3D scene does the easing itself; CSS anchors jump. Checks: lint 0 warnings, test 211/211 (21 files), build ✅, Playwright 57/57 with 3 workers + `carousel` 6/6 after adding the sweep test.

Previous: **Phase 8 — UI audit and fixes: done (steps A–E).** Plan and findings: [`docs/ui-fix-plan.md`](docs/ui-fix-plan.md). Checks: see the §7 progress log row for Phase 8.
- **A Dialogs:** Settings, Data, Inspect, Diagnostics and the Atlas sheet render in `#overlay-root` (portal), so they show on the landing page. Shared `useDialog` (focus once, Tab trap, Esc, `inert` on `#root`, focus restored). Shortcuts stop under a dialog; `?` works on the landing page. Inspect modal: dialog semantics, whole-percent pan, tokens, EN + বাংলা.
- **B Globe perf:** the globe keeps one fixed size and position while scrolling (a zooming globe looked broken), spins live at a time-based speed, reads the scroll through a ref (`LandingSignal`), no rendering when covered or hidden, DPR 1.5 at rest and 1.0 while scrolling, fire markers only in the hero, one starfield at a time (pre-rendered 2D layer). Parallax: stars, Milky Way and nebula layers drift at three depths and the section copy lags the scroll a little (`src/landing/parallax.ts`, one write per frame, off with reduced motion or calm background). Frame trace on software GL: 289 ms → 158 ms average while scrolling.
- **C Glass and layout:** `.glass` / `.glass-strong` / `.glass-flat` tokens, a fixed glass header with a scrolled state (`--header-h` follows its real height), raw colours → tokens, Atlas phone controls no longer overlap, image fallbacks, aligned track cards, faded scroll rows, stacked About tables, A2 legend moved out of the picture.
- **D Fonts:** self-hosted Bricolage / Plex Sans / Plex Mono / Noto Bengali (`public/fonts`, about 300 kB), type-scale tokens, 12 px (EN) / 13 px (বাংলা) floor, no synthetic bold, `fmtNum`, the remaining English strings translated.

Phases 0–9 are done.

## Next roadmap

| Step | Goal | Status |
|---|---|---|
| 8A Dialogs | Portal overlays, `useDialog`, shortcuts under dialogs, `e2e/dialogs.pw.ts` | ✅ |
| 8B Globe perf | Scroll-linked framing, time-based easing, pause when covered, DPR cap, one starfield | ✅ (a real-GPU trace on a phone is still a team check) |
| 8C Glass + layout | Glass tokens, fixed glass header, layout fixes T1–T7, CSS clean-up | ✅ |
| 8D Fonts | Self-hosted fonts, type scale, EN/বাংলা floors, `fmtNum`, strings | ✅ (self-hosted, as recommended) |
| 8E Verify | lint / test / build / e2e / a11y, one PR | ✅ checks run · ☐ push and PR (team) |
| 9A Worlds + sphere | `worlds.ts`, `EarthSphere`, serif font, CSS tokens, unit tests | ✅ |
| 9B Carousel L1 | Browse / swipe / keys / a11y; landing stops mounting `GlobeCanvas` | ✅ |
| 9C Levels 2–3 | Detail glide + preview ▶; immersive zoom with real still + source caption | ✅ |
| 9D Clean-up | Remove `LandingSignal` / framing / scroll-stage code; e2e, a11y, বাংলা, HC, reduced motion | ✅ |
| 9E Verify | lint / test / build / e2e / a11y, screenshots, docs, PR | ✅ checks run · ☐ push and PR (team) |
| 9F 3D planets | three.js planets in the carousel, L3 dive into the surface, software-GL light mode | ✅ |
| 9G Movement | Hero anchor, split translate + axial rotation + key numbers, Z-zoom dive + blur backdrop, carousel sweep out of frame | ✅ |
| Release (team) | Push, PR, screen-reader pass, user-test quotes, production check, video, submission | ☐ |
