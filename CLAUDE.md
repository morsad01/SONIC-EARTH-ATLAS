# Sonic Earth Atlas — notes for Claude

NASA Space Apps "Earth Information Jukebox" entry. React 19 + TypeScript + Vite + three.js + Web Audio, deployed on Vercel from `main`.

## Current plan

Work from **`docs/roadmap-v3.md`** (the original team brief is `docs/roadmap-v3-brief.md`).
- Read §1–§3 before changing anything. They hold the architecture, risks and the decisions that adapt the brief.
- Do **one phase per session**, in order, on the branch named in §4 / §7.
- At the end of a phase, update the §5 checklist and the §7 progress log (status, checks run, notes, next safe action).

## Working rules

- Act as project manager: pick the next task in the current phase and do it. Don't ask for confirmation at every step. Do stop and ask before destructive operations or architecture changes that the roadmap doesn't list.
- Never commit or push to `main`. Use a branch per phase, push that branch, and open a PR against `main`.
- Before every commit run `npm run lint && npm test && npm run build`. Report actual results and never weaken tests to get a green run.
- Commit and PR messages must **not** include `Co-Authored-By: Claude` trailers or "Generated with Claude Code" lines.
- Keep existing features working (all four tracks, share links, keyboard shortcuts, বাংলা strings, reduced motion, high contrast).
- Add every new UI string in both English and বাংলা (`src/lib/strings.ts`).
- No fabricated data: label samples as samples, show source, unit, period and method, and never show a "live" badge on snapshot data.
- No new runtime dependencies without a written reason. Dev-only test tools are listed in roadmap §2.
- Match the surrounding code style (dense, terse comments; existing CSS tokens and `.btn` / `.panel` / `.chip` classes).

## Commands

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```
