# Video script (about 3 min 45 s) and submission checklist

Record at 1920×1080 with system audio. Wear headphones while recording and say so on screen. Add captions.

| Time | Screen | Say |
|---|---|---|
| 0:00–0:25 | Landing page, scroll once: the globe moves from the hero into the split view | "Sonic Earth Atlas turns NASA Earth data into sound you can explore. Every sound is generated live from real observations. Nothing is pre-recorded." |
| 0:25–0:55 | **Explore the globe**, type "Bangladesh" in the country search with the keyboard, press Enter | "Pick any country by clicking or by typing. The globe flies there and outlines the border. The profile lists only what we really have: here, no fire cell or rain point falls inside the border this week, and it says so instead of inventing one. It has the monsoon story and 45 years of NASA POWER at a labelled point." |
| 0:55–1:20 | Press **Explore its sound**: the Data Jukebox opens on the country's temperature story | "The Data Jukebox puts each story on one timeline. Every value shows its source, unit, period and method." |
| 1:20–2:05 | Choose **Global temperature since 1880**, set Filters to 1951–1980, tick **Compare two periods**, B = 1996–2025, A left / B right, press **Play** | "Same mapping in both ears. 1951–1980 plays around B3 to E4. The last thirty years sit around G4 to E5, almost an octave higher. That is the warming you just heard." |
| 2:05–2:30 | Pause, click a year in the timeline, read the **What you hear** legend | "Nothing is a black box. 1998: 0.61 °C, so A4. Four pulses, because it jumped from the year before. A warm tone, because it is above the 1951–1980 average." |
| 2:30–2:55 | Story row → an **EIC frame** (ocean heat content) → **Hear it in EIC frames + NASA imagery** | "This is the challenge's core pairing: a NASA Earth Information Center frame, swept left to right into sound." |
| 2:55–3:20 | **B1 Bangladesh monsoon**, switch to বাংলা | "Our home. Eight divisions, eight voices. Sylhet got 118% of its normal monsoon rain. Everything also works in Bangla." |
| 3:20–3:45 | Settings: reduced motion, high contrast; then About the Science; then a user quote | "Keyboard only, text captions, reduced motion, high contrast, and it still works with WebGL off. Sound gives another way into Earth data; it supports the visuals, it does not replace them. Our limits are written down: snapshots, point samples, coarse borders. [User quote.]" |

## Before you submit

- [ ] `npm run lint && npm test && npm run build` pass, then `npm run test:e2e && npm run test:a11y` pass (CI runs the same).
- [ ] The deployed site opens in an incognito window; check `#v1&track=jukebox&story=gistemp&t=1998` and a country link such as `#v1&track=atlas&c=BGD`.
- [ ] GitHub repository is public, includes `public/data/` and `scripts/raw/`, and contains no API key (search for your FIRMS key).
- [ ] The NASA image frames load on the deployed site (needs internet).
- [ ] Test once with a phone and once with a screen reader (NVDA + Firefox or VoiceOver + Safari): country search, the Jukebox player and the “What you hear” legend. Not yet done.
- [ ] Video uploaded and public; link pasted into the form.
- [ ] Project name and description match PROJECT_SUMMARY.md.
- [ ] Submit early, not at 11:50 PM.
