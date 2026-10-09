# Sonic Earth Atlas — UI audit and fix plan (Phase 8)

**Date:** 2026-10-09 · **Branch for the fixes:** `fix/ui-polish` (one PR, four commits, one per track below)
**Scope:** bugs, text layout, the Settings button, glass surfaces, a glass header, landing-page globe lag and a site-wide font system. This document is the plan only. No app code was changed in the audit.

---

## 0. How the audit was run

| Check | Result |
|---|---|
| `npm run lint` | 0 warnings |
| `npm test` | 184 / 184 pass |
| `npm run build` | passes. `GlobeCanvas` 553 kB and `countries-50m` 757 kB are over the 500 kB warning |
| `npm run test:e2e` + `test:a11y` | 27 / 27 pass |
| Extra Playwright audit (scratch only, not committed) | Settings on 7 views × 2 widths; Data dialog and mobile menu on the landing page; focus and keyboard while dialogs are open; frame timing while scrolling the landing page with the globe and the starfield on or off; a text overflow and clipping scan on 7 views × 320/768/1280 px × EN/বাংলা; screenshots of every view |

The existing suites are green, but none of them opens a dialog from the landing page or measures scrolling. That is why the bugs below got through.

---

## 1. Findings

Severity: **P0** = broken for users, **P1** = visibly wrong or hard to use, **P2** = polish.

### 1.1 Settings button ("doesn't open sometimes") · P0

Reproduced. Clicking Settings on the landing page did nothing visible at 1400 px and 390 px, every time. It works on the other six views.

| # | Cause | Evidence |
|---|---|---|
| S1 | **Root cause.** `index.css` hides every direct child of the app root except `main`, `.hero-layer` and `header` while the landing page is open (`.hero-open > :not(main):not(.hero-layer):not(header) { visibility: hidden }`). `SettingsDialog`, `DataMethodDialog`, `InspectLocationModal` and `DiagnosticsPanel` are direct children, so on the landing page they open but stay invisible. | Dialog in the DOM, `visible=false`. Click Settings on the landing page, then "Explore Earth", and **the Settings panel appears out of nowhere**. That is the "sometimes". The Data (database icon) button has the same bug. |
| S2 | `SettingsDialog`'s effect depends on `onClose`, which `App.tsx` passes as a new arrow function on every render. The effect runs again on every App render (each Atlas day tick, data load, playback report) and moves focus back to the first button. | Code: `App.tsx:312` and `SettingsDialog.tsx:36-42` |
| S3 | App shortcuts keep running while a dialog is open. With Settings open, pressing `m` switched the Atlas to the map behind it. | Audit: `aria-pressed=true` on Map after pressing `m` |
| S4 | No focus trap and no focus return. After 25 Tabs, focus had left the dialog. After Esc, focus went to `body`, not back to the gear. | Audit |
| S5 | On phones the mobile menu stays open underneath Settings. | Audit: both visible |
| S6 | `?` (open Settings) is ignored on the landing page because the shortcut handler returns early on `showHero`. | Audit: dialog count 0 |

### 1.2 Landing-page globe lag while scrolling · P0

Measured frame time while scrolling (SwiftShader, so the absolute numbers are inflated but the ratios hold): **530 ms** average with everything on, **460 ms** with the 2D starfield hidden, **40 ms** with the WebGL globe hidden, **35 ms** with both hidden. The globe is about 92 % of the scroll cost.

| # | Cause | Where |
|---|---|---|
| G1 | The globe isn't tied to scroll position. `useScrollStage` reports one of three discrete stages from an IntersectionObserver. The globe only starts moving when the most visible section changes, then trails behind the scroll. | `landing/useScrollStage.ts`, `globe/framing.ts` |
| G2 | The easing depends on frame rate: a fixed `k = 0.06` per frame. When frames drop during a scroll, the globe slows down even more. That is why the lag gets worse exactly when it shows. | `GlobeCanvas.tsx:287` |
| G3 | The globe renders every frame at DPR up to 2 with antialiasing, a 64-segment sphere, clouds, atmosphere, 1,800 stars and every fire, rain and SST marker (`ALL_ON` in the hero). It keeps rendering after the globe is covered by sections 4–6 (95 % opaque background). | `GlobeCanvas.tsx:122-128`, `App.tsx:225` |
| G4 | Two starfields animate at once: the full-screen 2D `#stars` canvas (~1,700 `arc()` fills per frame at 1400×860) and the WebGL `Points` starfield. | `space-background.js`, `GlobeCanvas.tsx:134-162` |
| G5 | Each stage change sets state in `App`, so the whole tree re-renders, including `Landing`, `Header` and the globe props. | `Landing.tsx:47`, `App.tsx:53` |
| G6 | `.panel` uses `backdrop-filter: blur(14px)` over a canvas that changes every frame, so the blur has to be recomputed every frame. That matters for the glass work in §2.2. | `index.css` `.panel` |

### 1.3 Header and glass · P1

| # | Finding |
|---|---|
| H1 | The header is `relative`, in normal flow, and the landing layer starts **below** it (`top-[var(--header-h)]`). Nothing ever scrolls under the header, so its `backdrop-blur-md` is never visible. A glass header needs content to pass underneath it. |
| H2 | No scrolled state. The header looks the same at the top of the page and in the middle of it. |
| H3 | Cards use four different surface recipes: `.panel` (92 % + blur), `.panel-solid`, an inline `bg-[color-mix(...85%)]` on the track cards, and `bg-[var(--abyss)]` on the mobile sheets, the mobile menu and the Jukebox drawer. Nothing shares a token. |
| H4 | `InspectLocationModal`, `DiagnosticsPanel`, `AudioFirstMode`, `HearingPanel`, `LayersPanel`, `PlacePanel`, `TourBar`, `Accessible2DMap`, `CountryPicker` and `GlobeBoundary` still use about 110 raw Tailwind `slate-*`, `cyan-*`, `amber-*`, `emerald-*` and `sky-*` classes instead of tokens. This breaks the visual system and only partly follows high contrast (`html.hc` patches three slate classes). |

### 1.4 Text, alignment and layout · P1/P2

| # | View | Finding | Sev |
|---|---|---|---|
| T1 | Atlas, phone (320–390 px) | The four left buttons (Layers / What you're hearing / Country / Any place) **overlap** the right view switch (Globe/Map/List) and the imagery/spin group. "Reset view" (`top-[236px]`) sits on top of the globe and touches the button stack. | P1 |
| T2 | Landing, track cards | Titles wrap to one or two lines, so the waveforms sit at different heights across the four cards. The A2 card shows a **broken-image icon** when GIBS doesn't load (no `onError` fallback). Same for `StoryRow` and `TopicCarousel` images. | P1 |
| T3 | Landing, topic carousel | At 320 px the chip row starts scrolled, so "Temperature" is cut off at −37 px. "Skip animation" doesn't line up with the section heading. The subtitle sits right under the h2 with no spacing. | P2 |
| T4 | Jukebox and collections, phone | The collections row in the header is cut off mid-word ("EIC frames + NASA imagery" runs off the edge). It has no fade or arrow, so nothing shows it scrolls. | P2 |
| T5 | Jukebox, desktop | Collections appear twice: the header's second row and the "Collections" card in the filters column. | P2 |
| T6 | About, 320 px | The five-column mapping table needs sideways scrolling (`code` cells 150 px wide). At ≤640 px it should become stacked cards. | P2 |
| T7 | A2 Frames, 768 px | The `▲ high` / `▼ low` chips sit on top of the frame's own title text ("NOAA Annual Greenhouse Gas Index"). | P2 |
| T8 | Inspect modal | The pan label shows float noise (`28.999999999999996% Left`) because of `Math.abs(Number(x)) * 100`. It has no `role="dialog"`, no Esc, no click-outside, and uses an undefined class `animate-fade-in`. | P1 |
| T9 | বাংলা | Strings still in English: B1 "Circle size = rain that day…", "mm/day · NASA POWER", "Dashed line: …" (`BangladeshMonsoon.tsx:141,148,157`); the B2 credit line; the whole Data & method dialog, including "Close" (`DataMethodDialog.tsx:27,31`); the Inspect modal; Atlas "Spin" / "Spin the globe" (`App.tsx:280`). Numerals are mixed in one line ("2025: ২৭৮৬ mm"). | P1 |
| T10 | Global | 28 × `text-[11px]` and 4 × `text-[10px]`, which is too small to read, especially in Bengali. The Layers panel description text runs at 11 px. | P1 |
| T11 | Global | `.landing-scrim` and `#space-bg` are each defined twice (`index.css` overrides `space-background.css` with `!important`). `html, body { background: transparent !important }` overrides the `body` background a few lines up. Dead or conflicting CSS. | P2 |

### 1.5 Fonts · P1

| # | Finding |
|---|---|
| F1 | `font-bold` (700) is used 40 times, but Google Fonts loads only Bricolage 400/600/800, Plex Sans 400/500/600 and Noto Bengali 400/600. Plex 700 doesn't exist in the load, so the browser fakes it (synthetic bold). Bricolage 700 falls back to 800. |
| F2 | `--font-display` sets `letter-spacing: -0.02em`, and in বাংলা that also applies to Noto Sans Bengali. Negative tracking squeezes conjuncts and matras. |
| F3 | There is no type scale: 14 different sizes plus 3 one-off `clamp()`s. Heading weights vary (`font-bold`, `font-semibold` and `font-extrabold` are all used for h2). |
| F4 | `code` / `kbd` (formulas in About and Data, shortcuts in Settings) fall back to the OS default monospace. `.font-mono` maps to the body font. |
| F5 | The fonts load from a render-blocking Google Fonts stylesheet with no fallback metric overrides, so text reflows when they arrive. The offline e2e suite blocks Google, so **the tests never render the real fonts**. |

---

## 2. Fix plan

Work in this order: the P0 fixes first, so they can ship alone if time runs out. Each step lists its files and the test that proves it.

### 2.1 Step A: dialogs and the Settings button (S1–S6, T8) · P0

1. **Portal every overlay.** Add `src/components/Overlay.tsx`, which `createPortal`s into a `#overlay-root` (created once in `main.tsx`), so no hiding rule on the app root can touch it. Move `SettingsDialog`, `DataMethodDialog`, `InspectLocationModal`, `DiagnosticsPanel` and the Atlas mobile sheet onto it. Narrow `.hero-open` to `main > :not(:first-child)` only.
2. **One `useDialog(open, onClose)` hook** (`src/lib/useDialog.ts`): focus the first control when it opens (once, not on every render), trap Tab, close on Esc, restore focus to the opener, and set `inert` on `#root` while open. Keep `onClose` in a ref so a new function each render doesn't re-run it. Use it in Settings, Data, Inspect, the Atlas sheet, the Jukebox filter drawer and the header menu (which replaces its own trap code).
3. **Shortcuts:** `App`'s key handler returns early if `document.querySelector('[aria-modal="true"]')`. Allow `?` (and `S`) on the landing page.
4. **Header:** the gear gets `aria-haspopup="dialog"` and `aria-expanded`. Opening Settings or Data closes the mobile menu.
5. **Inspect modal:** `role="dialog"`, `aria-modal`, `aria-labelledby`, close on click outside, round the pan to whole percent (`Math.round(Math.abs(lon / 180) * 100)`), drop `animate-fade-in`, move all text to `strings.ts` (EN + বাংলা), and switch to tokens.
- **Tests:** new `e2e/dialogs.pw.ts`: Settings and Data open and are visible from **every view, including the landing page**, at 1400 and 390 px; Esc closes and focus returns to the opener; Tab stays inside; `m` with Settings open doesn't change the view; landing Settings → Explore doesn't reopen it. Unit test `useDialog` (focus once, trap, restore).

### 2.2 Step B: landing globe performance (G1–G6) · P0

1. **Scroll-linked framing, without React.** `useScrollStage` also writes a continuous `progress` (0 → 2 across sections 1–3) into a ref from a passive `scroll` listener on `#landing`, read once per frame. `GlobeCanvas` takes a `framingProgressRef` and interpolates between the `hero` → `split` → `immersive` targets. The globe moves with the finger and never trails behind. The discrete `stage` stays only for copy dimming. `onStage` stops causing App re-renders during a scroll (state updates only when the stage index actually changes, and it's already in a ref for the globe). Reduced motion: snap to the nearest stage, no interpolation.
2. **Frame-rate-independent easing:** `k = 1 - Math.exp(-dt / τ)` with τ ≈ 120 ms (fly-to too).
3. **Pause when hidden:** an IntersectionObserver on section 4 sets `paused` in a ref. While paused, the loop skips `render()` (keep rAF alive only for state, or stop and restart). Same for `document.hidden`.
4. **Cheaper while scrolling:** cap DPR at 1.5 on the landing page; drop to 1.0 while a scroll is active (150 ms debounce) and restore after. In the hero, draw only fire markers (not `ALL_ON`), which are the ones the hero copy talks about.
5. **One starfield:** while the WebGL globe is mounted, the 2D `#stars` canvas stops animating (`html.globe-on` → a single static frame). Rewrite `space-background.js` to pre-render the stars once to an offscreen canvas and only twinkle about 120 stars per frame instead of 1,700 `arc()` calls.
6. **Glass over the canvas:** sections 1–3 of the landing page use the cheap gradient scrim, not `backdrop-filter`. Only the small "Turn it, then listen" card blurs (see §2.3 perf rules).
- **Tests and targets:** the Diagnostics FPS readout plus a scripted Chrome performance trace (scroll the landing page top → bottom over 3 s), before and after: ≥ 55 fps on a desktop, ≥ 45 fps on a mid-range Android, no long task over 50 ms caused by scroll. New unit tests: `framingAt(progress, aspect)` interpolation and the easing at 30 vs 60 fps reaching the same point at the same time.

### 2.3 Step C: glass system and a glass header (H1–H4, T1–T7, T11) · P1

**Tokens** (`index.css`, one place, with high-contrast and no-support fallbacks):

```css
--glass-bg: color-mix(in srgb, var(--panel) 58%, transparent);
--glass-bg-strong: color-mix(in srgb, var(--panel) 78%, transparent);
--glass-border: rgb(255 255 255 / .09);
--glass-hi: inset 0 1px 0 rgb(255 255 255 / .06);
--glass-shadow: 0 10px 30px -12px rgb(0 0 0 / .55);
--glass-blur: 16px;
.glass        { background: var(--glass-bg); border: 1px solid var(--glass-border); box-shadow: var(--glass-hi), var(--glass-shadow); backdrop-filter: blur(var(--glass-blur)) saturate(140%); border-radius: var(--radius-lg); }
.glass-strong { /* the same, with --glass-bg-strong and blur 22px: dialogs, drawers, menus */ }
@supports not (backdrop-filter: blur(1px)) { .glass, .glass-strong { background: var(--panel); } }
html.hc .glass, html.hc .glass-strong { background: #000; backdrop-filter: none; border-color: var(--line); }
```

- `.panel` becomes an alias of `.glass`, so every existing panel upgrades without touching each file. `.panel-solid` stays for long reading (Data dialog body, tables).
- **Header:** make it `position: fixed; inset-inline: 0; top: 0`. The landing layer becomes `top: 0` with `padding-top: var(--header-h)`, and `main` gets `padding-top: var(--header-h)`, so content scrolls **under** the glass. Background `color-mix(abyss 55%)`, `backdrop-filter: blur(14px) saturate(150%)`, and a 1 px hairline. `data-scrolled="true"` (set from the landing scroll ref, past 8 px) → 75 % plus a soft shadow. The mobile menu and the collections row use `.glass-strong`.
- **Where glass goes:** header, mobile menu, Settings drawer, Data and Inspect dialogs, Atlas side panels, view switch, timeline bar, mobile sheets, Jukebox player bar and drawer, track cards, topic-carousel card, story cards, the immersive landing card. **Not** on long text blocks (About prose, tables) or on anything stacked more than two deep.
- **Performance rules:** at most about 6 blurred surfaces on screen at once over the live globe. Blur 10 px on `(max-width: 640px)` and under `html.calm`. No blur when WebGL has failed (no need) or `html.hc`.
- **Tokens instead of raw colours:** replace the ~110 `slate-*` / `cyan-*` / `amber-*` classes in the ten files listed in H4 with `--ink*`, `--line`, `--panel*`, `--rain`, `--brass`. Then delete the `html.hc .text-slate-*` patch.
- **Layout fixes:**
  - T1: on phones, put the four Atlas buttons in a horizontal, scrollable glass bar under the header. Keep the view switch top-right on its own row. "Reset view" moves to the bottom-right above the timeline.
  - T2: give the track-card title a fixed two-line height (`min-h-[2.6em]`), so the waveforms line up. Add an `<ImgOr fallback>` helper: on error, show a labelled placeholder ("Image unavailable offline") instead of the broken icon. Use it in `Landing`, `StoryRow` and `TopicCarousel`.
  - T3: scroll the active chip into view with `inline: 'nearest'` only after user interaction, so it starts at 0. Put the heading, subtitle and "Skip animation" on one baseline grid.
  - T4: add an edge fade mask on the collections row and the story row (`mask-image: linear-gradient(...)`), plus scroll snap.
  - T5: remove the "Collections" card from the Jukebox filters column on desktop (the header row covers it). Keep it in the phone "Filters" tab, where there is no header row.
  - T6: at ≤640 px, the About mapping table shows as one card per layer (`<dl>` per row).
  - T7: put the A2 high/low chips in the gutter above the frame, not on top of it.
  - T11: delete the duplicate `#space-bg`, `.landing-scrim` and `background !important` rules. Keep one source.
- **Tests:** axe stays at 0 violations (glass text contrast is covered by `contrast.test.ts`: add the glass backgrounds composited over `--abyss` at 4.5:1). Screenshot spot checks at 320/768/1280. Extend the smoke test so no Atlas control overlaps another at 320 px (bounding-box test).

### 2.4 Step D: fonts and type scale (F1–F5, T9, T10) · P1

**Families (three roles, no new runtime npm dependency):**

| Role | Latin | বাংলা | Weights loaded | Used for |
|---|---|---|---|---|
| Display | **Bricolage Grotesque** (variable, opsz 12–96) | **Noto Sans Bengali** | 600, 700, 800 (one variable file) / Bengali 600, 700 | h1–h3, hero, card titles, big numbers |
| UI and body | **IBM Plex Sans** | **Noto Sans Bengali** | 400, 500, 600 / Bengali 400, 500, 600 | everything else |
| Data and code | **IBM Plex Mono** | — (falls back to Noto) | 400, 500 | `code`, `kbd`, formulas, Diagnostics |

- **Self-host** the `woff2` files in `public/fonts/` (Latin + Latin-ext + Bengali subsets, about 220 kB total). Use `@font-face` with `font-display: swap`, add `<link rel="preload">` for Plex 400 and Bricolage 800, and drop the Google Fonts `<link>`. Add fallback faces (`size-adjust`, `ascent-override`) so swapping causes no layout shift. Reason: it works offline and on venue Wi-Fi, has no third-party request, and the e2e and a11y runs finally render the real fonts.
- **Type scale tokens** (1.2 ratio, rem, fluid only for display):
  `--fs-2xs .75rem (12)` · `--fs-xs .8125rem (13)` · `--fs-sm .875rem (14)` · `--fs-base 1rem (16)` · `--fs-lg 1.125rem (18)` · `--fs-xl 1.25rem (20)` · `--fs-2xl 1.5rem (24)` · `--fs-3xl clamp(1.75rem, 3.5vw, 2.25rem)` · `--fs-4xl clamp(2rem, 5vw, 3rem)` · `--fs-hero clamp(2.5rem, 7.5vw, 5.25rem)`.
  Map them into Tailwind's `@theme` so `text-xs`, `text-sm` and so on use them. Replace every `text-[10px]` / `text-[11px]` with `text-2xs` (12 px). **Minimum 12 px in English and 13 px in বাংলা** (`html[lang=bn] { --fs-2xs: .8125rem }`).
- **Weights:** headings h1 800, h2 700, h3 600; UI labels 500; body 400; emphasis 600. Replace body-text `font-bold` with `font-semibold` and display `font-bold` with the loaded 700. No synthetic bold anywhere (`font-synthesis: none`).
- **Rhythm:** line-height 1.6 for body, 1.35 for UI, 1.15 for headings, 0.95 for the English hero. বাংলা gets **+0.1** on every line height, `letter-spacing: 0` on display, and the hero at 1.1.
- **Numbers:** `tabular-nums` on all data (`.tnum` everywhere a value updates). Add one `fmtNum(n, lang, opts)` helper in `lib/strings.ts`, so a line never mixes ২০২৫ and 2025. Years, units and values all go through it in বাংলা.
- **Strings:** move every English-only string in T9 into `strings.ts` with বাংলা. Extend the `strings` test so every key has both languages (it may already, so add a scan for JSX text literals in `src/**/*.tsx` outside `strings.ts`).
- **Tests:** `designFoundation.test.ts` asserts no `text-[10px]` / `text-[11px]` or raw `font-bold` on Plex. An e2e test checks `document.fonts.check('600 16px "IBM Plex Sans"')` after load, offline.

### 2.5 Step E: verify and ship

1. `npm run lint && npm test && npm run build`, `npm run test:e2e`, `npm run test:a11y`. All green, nothing skipped.
2. Before/after: a frame trace of the landing scroll plus screenshots at 320 / 768 / 1280 in EN and বাংলা, high contrast and reduced motion.
3. Manual pass: keyboard-only through Settings, Data and the Atlas sheet; phone in landscape; a Safari check of `backdrop-filter` (`-webkit-` prefix).
4. Update `docs/roadmap-v3.md` §7 and `plan.md`. Open one PR against `main`.

---

## 3. Order and size

| Step | What | Severity | Size | Risk |
|---|---|---|---|---|
| A | Dialog portal, `useDialog`, Settings fixes, Inspect modal | P0 | S–M | Low: the overlay moves out of the hide rule |
| B | Scroll-linked globe, pause when covered, one starfield, DPR | P0 | M | Medium: touches `GlobeCanvas`'s loop. Keep the raycast and render loop, and change only the framing inputs (roadmap R2) |
| C | Glass tokens, fixed glass header, layout fixes T1–T7, raw colours → tokens | P1 | M–L | Medium: the header becomes `fixed`, so every view needs a top offset. The e2e "one h1 / no h-scroll" suite catches regressions |
| D | Self-hosted fonts, type scale, weights, বাংলা numerals and strings | P1 | M | Low: visual only. Watch the bundle and `public/` size |
| E | Verify, docs, PR | — | S | — |

**Decision needed from the team before Step D:** self-host the fonts (recommended, about 220 kB of static files and no npm package), or keep Google Fonts and only fix the weights and scale.
