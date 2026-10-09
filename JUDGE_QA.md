# Judge questions and honest answers

**1. Is the data real?**
Yes, all of it. FIRMS VIIRS fire radiative power (2–7 Oct 2026, the Atlas plays 2–5 Oct), NASA POWER daily rain, JPL MUR SST anomaly for September 2026, NASA POWER for 8 Bangladeshi cities, GISTEMP v4 (1880–2025), Mauna Loa CO₂ and NSIDC Arctic sea ice (the records NASA shows on its Vital Signs pages). Hear any place asks NASA POWER live for the exact point you click. Raw extracts are in `scripts/raw/`; tests check that the numbers the tour speaks match the files.

**2. What is sampled and what is not?**
Fire: 80 strongest 2° cells per day. Rain: 48 wettest of 396 points on a 10° grid, so it is a sample of wet places. SST: 40 most anomalous open-ocean cells at least 12° apart, out of 32,095 valid 1° cells. The full fields are visible as NASA GIBS images in the Frame Jukebox.

**3. How does this answer the Earth Information Jukebox challenge?**
The challenge asks for EIC-style visuals paired with sound generated in real time. Track A2 does exactly that: it opens on four NASA Earth Information Center frames (earth.gov, bundled so they work offline) and sweeps them into sound with a needle, and it also plays NASA GIBS imagery of the same week; track A1 goes further and sonifies the measured values behind those images; you can switch the globe to the same day's NASA imagery with one button. No audio file is pre-recorded.

**4. Why spatial audio?**
Location is the first thing people ask about Earth data. Longitude becomes left–right, so a fire in Idaho sounds far left and one in Congo slightly right. With headphones you can find hotspots without looking.

**5. How exactly does a value become sound?**
Fire: log-scaled FRP drives crackle rate (4–20/s) and brightness. Rain: square-root-scaled mm/day drives droplet density (≈3–18/s) and pitch (340–700 Hz). Ocean: anomaly shifts a 110 Hz drone 4 semitones per 3 °C. The "What you are hearing" panel shows these numbers live for each voice.

**6. Who is it for, and what did you test?**
Blind and low-vision learners, people who think better with sound, and anyone in a classroom. Every view has a text equivalent (List view, live descriptions, spoken narration in English or Bangla), full keyboard control (`?` lists shortcuts), reduced motion and high contrast. Automated checks: axe-core finds no violations on any of the seven views, on desktop and on a phone in Bangla with high contrast and reduced motion, and a browser smoke test runs every view at 320 px with WebGL off. *[Add your own test here: who tried it, what they said. A VoiceOver or NVDA pass is still to be done by the team.]*

**7. Why Bangladesh?**
We are a Bangladeshi team and the monsoon is the climate story people here live. Track B1 shows, for example, that Sylhet received 2,840 mm from 1 June to 5 October 2026, 118% of its 2001–2020 normal, with the wettest day on 8 July (138 mm). These are POWER model estimates, not gauge readings.

**8. What are the limits?**
Snapshot data, not a live feed (FIRMS needs a key; we refresh with scripts). POWER is reanalysis, not observation. Image sonification reads pixels, not calibrated values. Web Audio HRTF varies by browser; stereo is the default. The voice limit is 12.

**9. Has image sonification been done before?**
Yes, for example NASA's Chandra sonifications and past Space Apps projects that turned telescope images into music. Our contribution is the combination: several real Earth datasets at once, positioned in space, with an explanation of every sound, NASA imagery of the same days, a local (Bangladesh) story, and accessibility built in.

**10. Can I explore my own place or my own data?**
Yes. Click anywhere on the globe (or pick a city) and the app fetches 1981–2025 NASA POWER temperature and rain for that point and plays them, with the warming trend per decade. In Earth's vital signs, "Your data" plays any two-column CSV, so a teacher can sonify a NASA time series of their choice. Files never leave the browser.

**11. Can I pick a country? What do you show for it?**
Yes, on the globe, the 2D map, or by typing its name (English or Bangla). We only list what exists there: fire cells whose centre is inside the border (count and strongest value), rain and SST grid points inside it ("mean of N", never an area-weighted average), and 45 years of monthly NASA POWER temperature and rain at one labelled representative point. Global records are shown as "global context". If nothing falls inside the border, the profile says so instead of showing filler.

**12. How does the Data Jukebox turn a series into sound, and is it repeatable?**
Each dataset has a fixed range, so a value always gets the same note whatever period or country you choose. The value picks a note on a pentatonic scale from G3 to G5. The change since the last real value gives 1–6 pulses. Above or below an anomaly baseline switches between a warm and a soft timbre. Gaps are silent. The mapping is a pure function. A snapshot test fixes the exact notes for GISTEMP 1990–2025, and the "What you hear" legend explains each note in words. You can also compare two periods, one in each ear.

**13. How did you test it?**
Lint, 184 unit and component tests (data adapters, country coverage, sonification mapping, the player state machine, the scheduler against a fake audio context that checks no audio nodes are leaked, keyboard behaviour), a browser smoke test and axe accessibility scans on every view (`npm run test:e2e`, `npm run test:a11y`). CI runs all of them on each pull request.

**14. What next?**
Daily automatic refresh, more layers (aerosols), user testing with a blind students' organisation, a screen-reader pass with VoiceOver and NVDA, and an offline classroom pack.
