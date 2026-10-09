# Sonic Earth Atlas — plan

The full plan, risks and progress log live in [`docs/roadmap-v3.md`](docs/roadmap-v3.md). This page is the short version.

## Current phase

**Phase 7 — Testing and submission readiness: done (in-repo part).** Playwright smoke (13 tests: every view at 320 px, navigation, keyboard country search + share link, Jukebox timeline + Play/Pause, old share links, WebGL off) and axe scans (14: seven views × desktop / phone in বাংলা + high contrast + reduced motion), all offline and repeatable; `test:e2e` / `test:a11y` scripts; CI `e2e` job (allowed to fail at first); README, PROJECT_SUMMARY, JUDGE_QA and DEMO_SCRIPT refreshed. Checks: lint 0 warnings, test 184/184, build ✅, e2e 13/13, a11y 14/14.

All roadmap phases (0–7) are done. Phases 5, 6 and 7 are local commits only: GitHub push is refused (403) in this session, so they are shipped as a zip.

## Next roadmap (team-owned)

| Step | Goal | Status |
|---|---|---|
| Push + PR | Reconnect GitHub, push `claude/trusting-feynman-bc564j`, open the PR for Phases 5–7, green CI incl. the new `e2e` job | ☐ |
| Production check | Merge, then open the Vercel site in incognito with the links in the `DEMO_SCRIPT.md` checklist | ☐ |
| Screen reader | VoiceOver + Safari and NVDA + Firefox: country search, Jukebox player, “What you hear” legend | ☐ |
| User test | Quotes for `JUDGE_QA` Q6 and the video | ☐ |
| Submit | Record the 3:45 video (`DEMO_SCRIPT.md`), submit on the Space Apps platform | ☐ |
