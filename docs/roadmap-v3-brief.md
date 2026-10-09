# roadmapv3.md

# Master Claude Prompt --- EarthSound / The Earth Information Jukebox

## Upgrade the Existing Deployed NASA Space Apps Challenge Project Without Breaking It

> **Role:** Act as a senior product designer, creative frontend
> engineer, geospatial visualization engineer, data engineer,
> audio/sonification specialist, accessibility reviewer, and cautious
> refactoring lead.
>
> **Mission:** Upgrade my already-deployed and actively developed NASA
> Space Apps Challenge project for **"The Earth Information Jukebox"**
> into a polished, immersive, professional website. The existing project
> is the source of truth. Do not replace it with a fresh template or
> rebuild blindly. First inspect the repository, understand the current
> architecture and working features, then implement the design and
> feature upgrades in small, testable phases.

------------------------------------------------------------------------

## 0. Critical Project-Safety Rules

1.  **Audit before editing.** Inspect the full repository structure,
    `package.json` and lockfile, framework, routing, existing
    components, styles, data flow, environment variables, API
    integrations, tests, deployment configuration, and current Git
    state.
2.  **Preserve working functionality.** The app is already deployed and
    development is ongoing. Do not delete, rename, or rewrite existing
    features just to fit this plan. Map every existing feature and
    identify how it will be preserved.
3.  **Do not overwrite blindly.** Before substantial changes, summarize
    the architecture, current features, risks, and proposed
    implementation sequence. Keep changes incremental and compatible
    with the existing stack unless there is a compelling technical
    reason to change it.
4.  **No fake integrations.** Do not claim that "all NASA data" is
    loaded for a country unless the available data sources genuinely
    support that scope. Show source, units, time range, update date, and
    limitations. Never invent scientific values or API responses.
5.  **No secrets in frontend code.** Do not expose private API keys,
    tokens, or credentials. Respect existing environment-variable
    patterns.
6.  **No breaking deployment changes.** Check build commands, routing
    fallback, asset paths, environment variables, and hosting
    constraints before changing configuration.
7.  **Do not remove the existing design or feature set without
    approval.** Reuse and improve existing components where sensible.
8.  **Build a functioning product, not a mockup.** Buttons, country
    selection, filters, timeline controls, audio controls, navigation,
    and loading/error states must work.
9.  **Use progressive enhancement.** The site must remain usable on
    ordinary laptops and mobile devices, even if WebGL is unavailable or
    reduced-motion preferences are enabled.
10. **Use the current challenge brief as the product constraint.** The
    central experience must pair Earth Information Center visual frames
    / suitable Earth science information with dynamic sonification
    generated from data. A generic space-themed website alone is not
    sufficient.
11. **Do not start with a huge all-at-once refactor.** Create and
    execute a phased plan; run relevant checks after each phase.
12. **Avoid adding dependencies without justification.** Prefer existing
    libraries. If a new dependency is needed, explain why, check
    compatibility, and add only what is necessary.

------------------------------------------------------------------------

## 1. Start With a Repository Audit

Before coding, inspect the existing project and report:

-   Framework, language, package manager, build system, router, styling
    approach, and deployment platform.
-   Current pages, main components, reusable UI, and responsive
    behavior.
-   Current NASA / Earth data integrations and their real capabilities.
-   Current audio or sonification implementation, if any.
-   Current 3D / map / globe implementation, if any.
-   Current authentication, backend, persistence, and environment
    variables, if any.
-   Tests, linting, type checking, build status, known errors, and Git
    changes.
-   Which features are complete, partial, mocked, or missing.

Then create/update `roadmapv3.md` in the repository with: 1. Existing
architecture and feature inventory. 2. Risks and compatibility
constraints. 3. A file-by-file implementation plan. 4. A feature
acceptance checklist. 5. A test and verification plan.

Do not claim to have run commands unless they were actually run. Do not
discard uncommitted changes. If there are existing user modifications,
preserve them.

------------------------------------------------------------------------

## 2. Product Vision

Build an immersive, polished, dark-themed scientific exploration
experience tentatively named **EarthSound --- Hear Our Changing
Planet**. Preserve the existing project brand if it already has one;
treat "EarthSound" as a working name, not an instruction to rebrand
automatically.

The product should help a visitor:

1.  Explore Earth through an interactive 3D globe.
2.  Select a country or region.
3.  Discover the Earth-science datasets genuinely available for that
    selection.
4.  Explore time-based changes through a synchronized timeline.
5.  hear those changes as meaningful, controllable, dynamically
    generated sound.
6.  Understand what the data and sound mean, including units, sources,
    and uncertainty or limitations.

The visual design should feel premium, editorial, cinematic, and
scientific---not like a generic admin dashboard, game launcher, or a
collection of disconnected cards.

### Design principles

-   Deep-space dark mode with carefully restrained blue, cyan, teal, and
    warm amber accents.
-   High-contrast typography, strong hierarchy, generous spacing, subtle
    borders, and refined micro-interactions.
-   A few visually striking 3D moments, balanced with readable
    scientific content.
-   Parallax and scroll-linked transitions only where they improve
    orientation and storytelling.
-   Motion should be smooth, intentional, and lightweight; never make
    content hard to read.
-   Consistent visual language across globe exploration, country
    details, timeline, and audio player.
-   Mobile-first fallbacks for interactions that work best with a mouse
    or large screen.
-   Avoid excessive glow, constant animation, cluttered gradients,
    unnecessary glassmorphism, and decorative effects that obscure data.

------------------------------------------------------------------------

## 3. Global Navigation and Page Structure

Create or refine a persistent global navigation bar that matches the
existing application architecture.

### Navigation requirements

-   Brand mark / wordmark.
-   Primary links such as **Explore Earth**, **Data Jukebox**, **About
    the Science** (adapt names to current routes).
-   A clearly visible primary CTA such as **Start Exploring** or
    **Listen to Earth**.
-   Current section / active navigation state.
-   Responsive mobile navigation with accessible keyboard behavior.
-   Optional compact playback indicator if audio is playing.
-   Do not add a registration/enrollment CTA unless it is relevant to
    the actual project.

### Proposed experience flow

1.  **Immersive hero:** A 3D Earth or high-quality fallback image, a
    concise value proposition, a one-line explanation of data-to-sound,
    and a clear CTA.
2.  **Explore Earth:** Interactive globe with country/region selection
    and data availability.
3.  **Country science profile:** Selected location, available
    indicators, data coverage, time range, and source attribution.
4.  **Earth Data Jukebox:** Synchronized vertical timeline and
    horizontally browsable sound/data stories.
5.  **Listen and compare:** Play, pause, scrub, compare periods, and
    inspect the data-to-sound mapping.
6.  **How it works / accessibility:** Explain sonification, data
    sources, scientific limitations, and accessible controls.
7.  **Footer:** Project credits, data-source links, repository/demo
    links if appropriate, and attribution.

Integrate these into the existing routes and components where possible.
Do not force every section onto one giant page if the current
architecture has a good multi-page structure.

------------------------------------------------------------------------

## 4. Feature A --- Immersive Hero With Progressive Depth

Create a cinematic entry point that invites users to explore rather than
overwhelming them with controls immediately.

### Visual behavior

-   Large, high-quality 3D Earth as the main visual anchor.
-   Subtle starfield / deep-space atmosphere only if performance allows.
-   Slow, restrained Earth rotation when idle.
-   Scroll-linked progression:
    1.  Initial hero with headline and CTA.
    2.  As the user scrolls, transition into a split layout with
        explanatory copy on the left and Earth on the right.
    3.  Continue into a more immersive Earth view with short educational
        copy or an exploration prompt.
-   Use CSS transforms and/or the existing animation library when
    sufficient. Use a scroll-animation library only if already installed
    or clearly justified.
-   Avoid hijacking the scroll wheel, trapping users in horizontal
    sections, or forcing long animations before interaction.
-   The page must work when JavaScript animation or WebGL fails.

### Hero copy direction

Use concise, science-led copy. Example only:

**Hear Our Changing Planet**\
"Explore Earth science through interactive data and sound."

CTA: **Explore the Globe**\
Secondary CTA: **Listen to a Data Story**

Do not make unsupported claims such as "live data from every NASA
mission."

------------------------------------------------------------------------

## 5. Feature B --- Interactive 3D Earth and Country Selection

This is a core feature, not merely a decorative rotating sphere.

### Globe experience

-   Use the existing globe/map library if it is sound. Otherwise
    evaluate Three.js / React Three Fiber or a suitable globe library
    compatible with the current project.
-   Show a visually polished Earth with appropriate land/ocean textures
    and restrained lighting.
-   Allow drag-to-rotate, zoom where appropriate, and reset-to-home.
-   Support country selection by:
    -   clicking/tapping a country polygon when reliable country
        boundary data is available;
    -   a searchable country selector as an accessible and reliable
        fallback.
-   Clearly highlight the selected country/region.
-   Show hover/focus states and a small tooltip/label for country names.
-   Prevent accidental globe rotation from interfering with controls.
-   Provide keyboard-accessible country selection outside the canvas.
-   Respect reduced-motion settings.
-   If WebGL is unavailable or fails, show a static Earth/map fallback
    plus the same country search/selection controls.

### Country data contract

Selecting a country should not pretend that all NASA data is available
for that country. Instead:

1.  Store the selected country using a stable identifier such as ISO
    3166-1 alpha-3 where applicable.
2.  Determine which supported datasets can be queried for that
    country/region.
3.  Display the indicators and time periods actually available.
4.  Explain whether a dataset is:
    -   country-level;
    -   regional or gridded data aggregated over a country boundary;
    -   a global product shown in context;
    -   unavailable for the selected location.
5.  Make aggregation method and spatial resolution clear when relevant.
6.  Keep source attribution and units visible.

### Data panel for a selected country

Show: - Country name and identifier. - Available data categories. - Data
coverage / selected date range. - Latest source timestamp when supplied
by the source. - A compact trend or summary visualization. - **Explore
its sound** action. - A clear empty state when no supported dataset
exists.

Do not hardcode fabricated statistics to make the UI look populated. If
fixtures are needed for development, label them as demo/sample data and
keep them separate from production data.

------------------------------------------------------------------------

## 6. Feature C --- Earth Data Jukebox: Synchronized Timeline Interface

Build a distinctive browsing interface inspired by a dark, three-column
editorial timeline. It should feel like an immersive data-story browser,
not a clone of a commercial game catalog.

### Desktop layout

Use three coordinated columns, adapting widths to the existing design
system:

**Left column --- Time and filters** - Month/year or time-period
selector when supported by the dataset. - Available
indicators/categories. - Country/region selection summary. - Optional
data-source filter. - Clear/reset filters control.

**Center column --- Timeline** - Exact release/observation date where
available from the source. - Vertical time rail or stacked time
markers. - Active date clearly highlighted. - Scrollable date list /
timeline. - Date changes update the active story, charts, and audio
state. - Use real observation dates or explicitly labelled time buckets;
never invent "release dates" for datasets that do not have them.

**Right column --- Story and player** - Current data-story title and
short scientific explanation. - Relevant visualization or imagery. -
Data summary and source attribution. - Play / pause / stop controls. -
Audio progress and time navigation. - Volume and mute. - Current
sound-mapping legend. - Loading, unavailable-data, and error states.

### Synchronized behavior

-   Selecting a date updates the story and data visualization.
-   Scrolling the timeline updates the active item predictably.
-   Playback progression may advance the timeline only if that behavior
    is intentional and communicated.
-   Changing country or dataset resets or remaps incompatible
    timeline/audio state safely.
-   Use `IntersectionObserver` or the project's established scroll
    mechanism where useful, with a non-scroll fallback.
-   Avoid state feedback loops between scrolling, selection, and audio
    playback.
-   Keep keyboard focus visible.
-   On mobile, convert the three-column layout into a clear stacked or
    tabbed flow. Do not shrink three desktop columns into unreadable
    slivers.

### Horizontal Jukebox row

Add a separate horizontally browsable row of sound/data-story items
where appropriate: - Cards show the story topic, region, period, and a
meaningful visual. - The active card is centered or clearly
emphasized. - Neighboring cards can remain partially visible on wide
screens to suggest lateral navigation. - Support swipe/drag, trackpad,
keyboard navigation, and visible arrow buttons. - Use snap points
thoughtfully. - Do not hide essential information off-screen. -
Horizontal scrolling must not trap vertical scrolling. - Each item must
represent a real supported story or a clearly labelled demo story.

------------------------------------------------------------------------

## 7. Feature D --- Progressive Planet / Data Exploration Carousel

Implement a second exploration pattern inspired by a centered horizontal
planet carousel. Use it only where it adds value; do not duplicate the
globe and timeline navigation without a clear reason.

### Carousel behavior

-   Center the active planet/topic/region item.
-   Neighboring items are partially visible on wider screens.
-   Use scale, opacity, and depth sparingly to establish hierarchy.
-   Provide visible previous/next controls and accessible item labels.
-   Selecting an item updates a corresponding information panel.
-   Keep the carousel usable with touch, mouse, keyboard, and
    reduced-motion preferences.

### Three progressive information stages

1.  **Overview:** The selected topic is shown with a short description
    and one clear action.
2.  **Split-screen detail:** Scientific explanation and data summary on
    the left; large planet/globe visualization on the right.
3.  **Immersive detail:** A larger visual backdrop with a concise
    educational annotation and an action to explore or listen.

Transitions should feel connected, but the user must always be able to
navigate back and skip animations. Avoid excessive zooms or
scroll-jacking.

------------------------------------------------------------------------

## 8. Feature E --- Data-Driven Sonification Engine (The Core of the Challenge)

This feature is the product's defining purpose. It must be implemented
and validated as a deterministic mapping from real data to sound, rather
than merely playing a music track alongside a chart.

### Core requirements

-   Create a clearly separated sonification module with typed
    input/output contracts.
-   Accept normalized, validated data series with timestamps, values,
    units, and source metadata.
-   Support one high-quality primary sonification mode first.
-   Use Web Audio API or a compatible library already present in the
    project.
-   Include explicit user interaction before starting audio where
    browser autoplay restrictions require it.
-   Ensure the engine can start, pause, resume, stop, seek where
    feasible, and clean up audio nodes/resources.
-   Avoid clipping, excessively loud output, sudden volume jumps, and
    unpleasant high-frequency defaults.
-   Provide a volume slider, mute control, and clear playback state.
-   Never imply that the generated sound is an actual recording of the
    Earth. Label it as data sonification.

### Mapping design

Define a documented, understandable mapping. For example: - normalized
data value → pitch within a safe musical range; - magnitude or rate of
change → rhythm density or pulse frequency; - categorical data → a
limited set of timbres, only when scientifically defensible; -
missing/invalid values → silence or a clearly documented neutral
treatment, not fabricated values.

These are examples, not universal scientific truths. Select the mapping
that fits the actual dataset and user comprehension. Keep the mapping
stable when comparing periods. Show the mapping legend and let users
replay or compare the same data consistently.

### Playback synchronization

-   Keep timeline cursor, active timestamp, chart highlight, and sound
    playback synchronized where technically practical.
-   On seeking, update the data cursor and audio schedule safely.
-   Handle missing values and uneven time intervals explicitly.
-   Avoid scheduling unbounded audio nodes or leaking resources during
    repeated playback.
-   Use a predictable state machine such as idle → loading → ready →
    playing → paused → ended / error.
-   Add tests for the mapping function, normalization, edge cases, and
    playback-state transitions.

### Scientific integrity

For every sonification: - Show the original variable, units, source,
period, and spatial/temporal resolution. - Explain the sound mapping in
plain language. - Do not overstate causal relationships. - Make it
possible to compare the original data with the generated sound. - Make
limitations and data gaps visible.

------------------------------------------------------------------------

## 9. Feature F --- NASA Data Integration and Source Transparency

First reuse existing data integrations. Only add new sources after
checking current code and the challenge's intended relationship to NASA
Earth Information Center visual frames.

### Data integration process

1.  Inventory the current APIs, local datasets, static files, and data
    fixtures.
2.  Confirm each source's official endpoint, usage terms, data format,
    units, temporal coverage, spatial resolution, rate limits, and
    attribution requirements.
3.  Choose a small, scientifically coherent set of datasets suitable for
    the prototype.
4.  Implement a typed data adapter per source rather than mixing API
    calls directly into UI components.
5.  Add loading, empty, stale-data, error, retry, and offline states.
6.  Cache responses responsibly if the current stack supports it.
7.  Keep secrets server-side when required.
8.  Provide source links and "last updated" only when the source
    provides reliable timestamp information.
9.  Keep sample fixtures distinct from live/official data.

### Avoid these pitfalls

-   Do not claim the site contains "all NASA data."
-   Do not assume every dataset is available at country resolution.
-   Do not confuse EIC visual frames with a universal query API; verify
    what the actual source offers.
-   Do not build a dependency on a single API without error handling.
-   Do not show a live-data badge when the data is cached, static, or
    mocked.
-   Do not invent a source timestamp when it is missing.
-   If a country boundary intersects gridded data, explain how the
    values are summarized.

### Suggested data architecture

Adapt names to the current codebase; do not force these exact files if a
better existing pattern is present.

``` text
src/
  features/
    globe/
      GlobeView
      CountrySelector
      countryBoundaries
    earth-data/
      dataTypes
      dataRegistry
      adapters/
      normalization
      countryAggregation
    timeline/
      TimelineView
      TimelineFilters
      useTimelineState
    sonification/
      mapping
      SonificationEngine
      playbackState
      mappingLegend
    stories/
      StoryCard
      StoryDetail
  components/
    navigation/
    accessible-controls/
    data-status/
  styles/
```

Keep business logic out of presentation components wherever practical.

------------------------------------------------------------------------

## 10. Feature G --- Visual Design System and Motion

Create or extend design tokens compatible with the existing styles. Do
not replace an established design system without checking it first.

### Design tokens to consider

-   Background: near-black / deep navy.
-   Surface: slightly lighter navy/charcoal.
-   Primary text: high-contrast off-white.
-   Secondary text: cool gray with accessible contrast.
-   Accent: restrained cyan/blue; optional teal and amber for data
    meaning.
-   Border: subtle neutral border with visible focus state.
-   Radius and spacing: consistent scale.
-   Typography: one strong display face paired with a highly legible
    body face; load fonts efficiently.

### Motion guidelines

-   Hero: slow, subtle Earth rotation.
-   Scroll: restrained parallax / opacity / transform transitions.
-   Cards: small hover elevation or scale change.
-   Timeline: clear active-state transition.
-   Carousel: short, smooth movement with reduced-motion alternative.
-   Audio: restrained waveform or visualizer tied to playback state only
    if it does not misrepresent the underlying data.

Avoid: - heavy animation on every element; - infinite distracting
particle effects; - layout shifts; - forced horizontal scroll; -
scroll-jacking; - expensive full-screen blur effects; - autoplay
sound; - motion that blocks navigation or content.

Respect `prefers-reduced-motion` and provide pause/stop behavior for
nonessential motion.

------------------------------------------------------------------------

## 11. Responsive Design and Accessibility

Target WCAG 2.2 AA principles where feasible.

-   Semantic landmarks, headings, buttons, labels, and links.
-   Full keyboard operation, visible focus, and logical focus order.
-   Text and control contrast appropriate for dark mode.
-   Do not communicate selected state using color alone.
-   Screen-reader-friendly country selector and timeline controls.
-   Accessible names for globe and carousel controls.
-   Captions / textual interpretation for sound.
-   User-controlled volume and no surprise autoplay.
-   Reduced-motion support.
-   Touch targets sized appropriately.
-   Mobile fallback if 3D rendering is slow or unsupported.
-   Clear loading and error messages.
-   Test browser zoom and narrow viewports.

The globe cannot be the only way to select a country. Always provide a
searchable, keyboard-accessible alternative.

------------------------------------------------------------------------

## 12. Performance and Reliability

-   Lazy-load heavy 3D components and large textures.
-   Optimize image sizes and use appropriate formats.
-   Dispose of WebGL resources, textures, geometry, and audio nodes when
    no longer needed.
-   Avoid unnecessary rerenders during globe movement or audio playback.
-   Use memoization only where it improves measured performance.
-   Keep animations near a smooth 60 FPS target on reasonable modern
    devices, but prioritize functionality over a rigid number.
-   Add an error boundary around fragile 3D views if the current
    framework supports it.
-   Provide a useful static fallback for WebGL failure.
-   Check for memory leaks during repeated country changes and playback.
-   Test at desktop, tablet, and mobile sizes.
-   Avoid unnecessary large dependencies and unoptimized video
    backgrounds.

------------------------------------------------------------------------

## 13. Testing and Acceptance Criteria

Do not mark a feature complete just because the page renders.

### Functional acceptance

-   [ ] Existing deployed functionality remains available.
-   [ ] Global navigation works on all relevant routes.
-   [ ] Country can be selected using both globe interaction and
    searchable controls.
-   [ ] Selected country is clearly indicated.
-   [ ] The app lists only datasets genuinely available for the selected
    region.
-   [ ] Dataset source, units, period, and limitations are visible.
-   [ ] Timeline selection updates the active data story.
-   [ ] Timeline, chart, and audio remain synchronized.
-   [ ] Sonification mapping is deterministic and documented.
-   [ ] Playback, pause, resume, stop, volume, and error handling work.
-   [ ] No audio starts unexpectedly.
-   [ ] Horizontal story row supports keyboard, pointer, and touch.
-   [ ] Responsive layout works without horizontal overflow.
-   [ ] Reduced-motion preference is respected.
-   [ ] WebGL failure does not prevent basic country exploration.
-   [ ] Empty, loading, stale, and API-error states are usable.
-   [ ] No fabricated data is presented as official.
-   [ ] Production build and available automated tests pass.

### Technical checks

Use the existing package manager and scripts. Discover the actual
commands first; do not assume npm if the project uses pnpm, yarn, or
another tool.

Run applicable: - formatter / lint; - TypeScript or static checks; -
unit tests; - integration tests; - production build; - smoke test for
important routes; - browser test for country selection, timeline
changes, and audio playback where tooling exists.

Report actual results and unresolved failures. Do not suppress errors or
weaken tests simply to achieve a passing build.

------------------------------------------------------------------------

## 14. Implementation Phases --- Work Incrementally

Execute these phases in order, adapting to the existing application.

### Phase 0 --- Audit and safety

-   Inspect repository and Git state.
-   Identify existing working features and integrations.
-   Confirm framework and deployment constraints.
-   Produce the current architecture summary and file-by-file plan.
-   Do not perform a broad rewrite.

**Gate:** The plan clearly explains what will be preserved and what will
change.

### Phase 1 --- Design foundation

-   Establish design tokens, typography, spacing, navigation, and
    responsive behavior.
-   Upgrade the hero and section transitions using the existing stack.
-   Preserve existing content and routes.

**Gate:** No existing route or feature is broken; layout works on
mobile.

### Phase 2 --- Earth globe and country selection

-   Integrate or improve the globe.
-   Add robust country search/selection.
-   Add country boundary highlighting and fallback behavior.
-   Connect selection to the actual data registry.

**Gate:** A user can select a country without relying on the 3D canvas.

### Phase 3 --- Data registry and country profile

-   Standardize supported data-source adapters.
-   Display only available data and clear provenance.
-   Add the country science profile and empty/error states.

**Gate:** Data source, units, time range, and limitations are traceable.

### Phase 4 --- Synchronized Jukebox timeline

-   Implement the three-column desktop layout.
-   Add time filters and active date/timeline behavior.
-   Add horizontal story carousel and mobile layout.
-   Connect timeline state to the selected dataset.

**Gate:** Changing time or story consistently updates the visible
content.

### Phase 5 --- Sonification engine

-   Implement documented data-to-sound mapping.
-   Connect playback state to timeline and visualization.
-   Add accessible controls and audio lifecycle cleanup.
-   Test mapping and playback edge cases.

**Gate:** Real supported data produces repeatable sound and the user can
understand why it sounds that way.

### Phase 6 --- Polish and accessibility

-   Refine parallax, progressive-depth transitions, and
    micro-interactions.
-   Audit keyboard navigation, contrast, reduced motion, and responsive
    behavior.
-   Optimize 3D assets and performance.

**Gate:** The site remains usable without animation and without WebGL.

### Phase 7 --- Testing and submission readiness

-   Run tests and production build.
-   Fix regressions and verify deployed routes.
-   Finalize README, architecture, source attribution, and demo
    narrative.
-   Verify official submission requirements and submit through the
    required platform.

**Gate:** A clean, reproducible build and a tested end-to-end demo.

------------------------------------------------------------------------

## 15. Final Demo Narrative

Prepare a short demonstration that answers a scientific question instead
of simply touring the UI.

Suggested flow:

1.  Open the immersive Earth hero and explain the concept in one
    sentence.
2.  Select a country using the globe or accessible search.
3.  Choose a supported Earth science indicator and inspect its source
    and time coverage.
4.  Select two dates or periods and show the real data change.
5.  Play the sonification and explain the mapping from data to sound.
6.  Change the selected time and demonstrate that the sound and
    visualization update together.
7.  Briefly demonstrate accessibility controls and explain who benefits.
8.  End with the scientific value: sound offers an additional way to
    explore and compare environmental information; it complements rather
    than replaces the data visualization.

Do not overpromise scientific conclusions. Keep the demonstration
focused and repeatable.

------------------------------------------------------------------------

## 16. Instructions for Claude While Implementing

For each phase:

1.  State the goal and the exact existing files you plan to modify.
2.  Explain compatibility risks briefly.
3.  Implement only the current phase.
4.  Run relevant checks using the project's real scripts.
5.  Inspect the diff for accidental deletions, secrets, unrelated
    formatting, and regressions.
6.  Summarize files changed, behavior added, tests actually run, and
    remaining issues.
7.  Update the checklist in `roadmapv3.md`.
8.  Stop at the phase gate and ask for approval before a risky
    architecture change or any destructive operation.

If context or session limits require stopping, leave the repository in a
working state and update `roadmapv3.md` with: - current phase; -
completed tasks; - exact remaining tasks; - files changed; - test/build
status; - known issues; - the next safe action.

### Start now

**Begin with Phase 0 only.** Inspect the existing repository, preserve
current work, and report the architecture and implementation plan before
making major code changes. Do not start implementing every phase in one
response.

The outcome should be a reliable, visually compelling, scientifically
honest, accessible, data-driven Earth Information Jukebox---not just a
beautiful space-themed landing page.
