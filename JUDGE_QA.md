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
Blind and low-vision learners, people who think better with sound, and anyone in a classroom. Every view has a text equivalent (List view, live descriptions, spoken narration in English or Bangla), full keyboard control (`?` lists shortcuts), reduced motion and high contrast. *[Add your own test here: who tried it, what they said.]*

**7. Why Bangladesh?**
We are a Bangladeshi team and the monsoon is the climate story people here live. Track B1 shows, for example, that Sylhet received 2,840 mm from 1 June to 5 October 2026, 118% of its 2001–2020 normal, with the wettest day on 8 July (138 mm). These are POWER model estimates, not gauge readings.

**8. What are the limits?**
Snapshot data, not a live feed (FIRMS needs a key; we refresh with scripts). POWER is reanalysis, not observation. Image sonification reads pixels, not calibrated values. Web Audio HRTF varies by browser; stereo is the default. The voice limit is 12.

**9. Has image sonification been done before?**
Yes, for example NASA's Chandra sonifications and past Space Apps projects that turned telescope images into music. Our contribution is the combination: several real Earth datasets at once, positioned in space, with an explanation of every sound, NASA imagery of the same days, a local (Bangladesh) story, and accessibility built in.

**10. Can I explore my own place or my own data?**
Yes. Click anywhere on the globe (or pick a city) and the app fetches 1981–2025 NASA POWER temperature and rain for that point and plays them, with the warming trend per decade. In Earth's vital signs, "Your data" plays any two-column CSV, so a teacher can sonify a NASA time series of their choice. Files never leave the browser.

**11. What next?**
Daily automatic refresh, more layers (aerosols, sea ice), user testing with a blind students' organisation, and an offline classroom pack.
