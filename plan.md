# Sonic Earth Atlas — plan

The full plan, risks and progress log live in [`docs/roadmap-v3.md`](docs/roadmap-v3.md). This page is the short version.

## Current phase

**Phase 4 — Data Jukebox: done.** Story registry (global, Bangladesh, per-country), one origin-tagged reducer, synchronized timeline / chart / caption, horizontal story row, landing topic carousel, `story` + `t` share keys. Checks: test 139/139, lint 0 errors (11 old warnings), build ✅.

## Next roadmap

| Phase | Goal | Status |
|---|---|---|
| 5 Series sonification | Pure mapping + playback state machine, `SeriesPlayer` (lookahead scheduler, node counter), `PlayerControls`, `MappingLegend`, A/B compare; replaces Jukebox step-through | Next |
| 6 Polish, a11y, perf | Motion via `--dur-*`, VoiceOver/NVDA pass, contrast of new tokens, 200% zoom, split `GlobeCanvas`, fix remaining lint warnings | ☐ |
| 7 Testing and submission | Playwright + axe, README / JUDGE_QA / DEMO_SCRIPT refresh, demo rehearsal on production | ☐ |
