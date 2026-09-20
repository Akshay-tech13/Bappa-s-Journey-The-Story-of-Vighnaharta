# PLAN.md — Bappa's Journey

Read GAME_BRIEF.md before every coding session. This file is the authoritative build guide.

---

## Architecture (say this aloud at a code walkthrough)

One global object `G` holds all shared state (scene, score, input, audio context). Every scene is a plain object with three methods — `init()`, `update(dt)`, `draw(ctx)` — registered in `G.scenes`. The game loop in `main.js` calls `requestAnimationFrame`, computes `dt`, then delegates to the active scene. Scene switches trigger a 300 ms black-fade managed by `G.sceneManager.goto(name)`. All drawing goes through helper functions in `art.js`; no scene draws shapes directly. Input from keyboard and touch is normalised into one `G.input` object so scenes never touch DOM events. Audio is unlocked on the first user gesture and every sound is a short Web Audio API call or a scheduled dhol pattern — no audio files.

---

## Scoring

| Level | Formula | Star thresholds |
|-------|---------|----------------|
| Level 1 | `modaks × 10 + stars × 100 + timeBonus` | ★★★ spotted 0×; ★★ spotted 1–2×; ★ spotted 3+× |
| Level 1 time bonus | up to +100 pts; full 100 if finished ≤ 45 s, 50 if ≤ 75 s, 0 otherwise | — |
| Level 2 | `modaks × 10 + stars × 100` | ★★★ ≤ 1 obstacle hit; ★★ 2–4 hits; ★ 5+ hits |
| Level 3 | `modaks × 10 + stars × 100` (modaks = petals + diyas lit) | ★★★ ≥ 80 % diyas lit; ★★ 50–79 %; ★ < 50 % |
| Blessing Score | sum of all three level points | shown on End screen; best saved in localStorage |

---

## Milestones

### M0 — Scaffold (10:15–10:45, 30 min)
**Goal:** Repo is live on GitHub Pages with a blank canvas, game loop, scene manager, and input working.

**Files created:** `index.html`, `css/style.css`, `js/config.js`, `js/main.js`, `js/input.js`, `js/audio.js` (stub), `js/art.js` (stub), `js/ui.js` (stub), `js/scenes/title.js` (placeholder), all other scene files as empty stubs.

**Acceptance tests:**
1. Open GitHub Pages URL on phone and laptop — canvas fills screen with letterboxing, no scroll.
2. Open browser console — no errors.
3. Press any key / tap canvas — `G.input` log shows direction or action flag.
4. Canvas is 1280×720 logical; looks sharp on a Retina display (no blur).

**Fallback (> 45 min):** Skip joystick for now; add touch only as button taps; joystick can come in M3.

**Commit:** `M0: scaffold, game loop, responsive canvas, input, live on Pages`

---

### M1 — Art Kit (10:45–11:25, 40 min)
**Goal:** All characters and props drawn as vector shapes; a debug "gallery" scene shows them all.

**Files changed:** `js/art.js`, `js/config.js` (palette constants), `js/scenes/title.js` (add gallery shortcut key `G`).

**Acceptance tests:**
1. Press `G` on title — gallery scene shows: Ganesha, Mushak, Parvati, Shiva, Kartikeya, modak, diya, rock, log, bush.
2. Ganesha idle bob animates visibly (no jitter).
3. All shapes use only the brief's palette (saffron, marigold, maroon, cream, leaf green, river teal, indigo).
4. Ganesha silhouette is ~100 px tall on the 1280×720 canvas.

**Fallback (> 60 min):** Reduce gallery to Ganesha + Parvati + modak only; add remaining art inline in each level.

**Commit:** `M1: vector art kit, character gallery debug scene`

---

### M2 — Title + Story slides (11:25–11:50, 25 min)
**Goal:** Title screen and 4 story slides with skip, auto-advance and fade transitions work end-to-end.

**Files changed:** `js/scenes/title.js`, `js/scenes/story.js`, `js/ui.js` (fade, button helpers), `js/audio.js` (unlock on click).

**Acceptance tests:**
1. Page loads → title shows game name + Play button within 1 s.
2. Click Play → slide 1 appears with text from brief §5.
3. Tap/Space → advances slides; Skip button jumps to Level 1 scene (stub OK).
4. Slide auto-advances after 4 s without any input.
5. Audio context unlocks on first tap (no console warning after that).

**Fallback (> 37 min):** Remove auto-advance; keep manual tap/click only.

**Commit:** `M2: title screen, 4 story slides, fade transitions, audio unlock`

---

### M3 — Level 1 Modak Mischief (11:50–13:00, 70 min)
**Goal:** Full top-down stealth level playable start-to-finish with stars.

**Files changed:** `js/scenes/level1.js`, `js/art.js` (kitchen room, cover objects), `js/input.js` (virtual joystick).

**Acceptance tests:**
1. Enter Level 1 — kitchen room renders; Ganesha at start, Parvati patrolling, 5 modaks visible.
2. Walk into Parvati's gold cone — spotted message appears, Ganesha returns to start, modak count unchanged.
3. Collect all 5 modaks → reach exit → level ends with star count and points shown.
4. Use Blessing near a stool — it disappears; shortcut opens.
5. Virtual joystick works on phone; page does not scroll.

**Fallback (> 105 min):** Lite — 3 modaks, one patrol route, no Blessing shortcut removal.

**Commit:** `M3: Level 1 Modak Mischief complete`

---

### M5 — Level 3 Visarjan Walk (13:15–13:55, 40 min)
**Goal:** Top-down night walk to the river with diya lighting and petal collection.

**Files changed:** `js/scenes/level3.js`, `js/art.js` (path, diyas, petals, river).

**Acceptance tests:**
1. Enter Level 3 — winding night path renders with unlit diyas and floating petals.
2. Walk near a diya — it lights up (warm glow); diya count in HUD increases.
3. Use Blessing — nearby diyas light in a radius.
4. Reach river — ripple animation plays, Marathi chant appears on screen, level ends with stars.
5. No fail state — walking without collecting still completes the level.

**Fallback (> 60 min):** Lite — 45 s path, fewer diyas, skip Blessing radius; river ending stays.

**Commit:** `M5: Level 3 Visarjan Walk complete`

---

### M6 — Recap + End screen + Scoring + Storage (13:55–14:20, 25 min)
**Goal:** Recap slides, End screen with Blessing Score, stars per level, localStorage save, Play Again, and Replay buttons all work with `LEVEL_ORDER = ['level1','level3']`.

**Files changed:** `js/scenes/recap.js`, `js/scenes/end.js`, `js/config.js` (`LEVEL_ORDER`), `js/ui.js` (score display).

**Acceptance tests:**
1. Complete Level 3 → recap slides play (4 slides, skippable).
2. End screen shows Blessing Score, stars for Level 1 and Level 3, best score from a previous run.
3. Click Play Again → returns to Title.
4. Click Replay Level 1 → goes directly to Level 1.
5. Refresh page → best score and star counts persist.
6. Block localStorage in DevTools → game still runs and ends without errors.

**Fallback (> 37 min):** Skip "Replay Level" buttons; keep Play Again and score display only.

**Commit:** `M6: recap, End screen, scoring, localStorage — full game loop live`

---

### CHECKPOINT 14:20
Verify: Title → Story → Level 1 → Level 3 → Recap → End → Play Again works on phone and laptop with no console errors. If anything is broken, fix it now before M4.

---

### M4 — Level 2 The Race (14:20–15:20, 60 min)
**Goal:** Fake-3D lane runner + parents-circle finale; insert `'level2'` into `LEVEL_ORDER`.

**Files changed:** `js/scenes/level2.js`, `js/art.js` (runner perspective helpers, Kartikeya on peacock), `js/config.js` (`LEVEL_ORDER` updated).

**Acceptance tests:**
1. Enter Level 2 — three lanes render with perspective scaling; obstacles approach and grow.
2. Press Left/Right (or swipe) — Ganesha switches lanes; hit detection works; Mushak wobbles on hit.
3. Race HUD bar shows both icons; Kartikeya icon is slightly ahead at finish.
4. Finish line reached → "Kartikeya is faster… but Ganesha knows a wiser way" text appears.
5. Hold action button in finale → Ganesha circles parents; lap counter reaches 3; reward glow plays.
6. Level ends with stars based on obstacles hit (not on beating Kartikeya).

**Fallback (> 90 min):** Lite — 45 s run, 3 wave patterns, full parents-circle finale stays.

**Commit:** `M4: Level 2 The Race + parents circle finale, full LEVEL_ORDER active`

---

### M7 — Polish + Dhol Loop (15:20–15:45, 25 min)
**Goal:** Web Audio SFX complete, dhol loop on Levels 1–3, particles on collect, camera shake on Blessing.

**Files changed:** `js/audio.js`, `js/ui.js` (particles), `js/main.js` (camera shake), all level scenes (wire up SFX calls).

**Acceptance tests:**
1. Collect a modak — chime plays and sparkle particles appear.
2. Use Blessing — shimmer sound and small camera shake happen.
3. Level music (dhol loop) plays quietly on Levels 1, 2, and 3; mute button silences everything.
4. Level-complete jingle plays on exit from each level.

**Fallback:** Skip camera shake and particles; keep SFX chime and dhol loop only.

**Commit:** `M7: dhol loop, SFX wired, particles, camera shake`

---

### M8 — QA on Phone + Laptop (15:45–16:00, 15 min)
**Goal:** Run the full Definition of Done checklist on a real phone and a laptop browser.

**Acceptance tests = Definition of Done (from brief §10):**
- [ ] GitHub Pages link opens on phone and laptop, no login required.
- [ ] Title → story → 3 levels → recap → End → Play Again, no console errors.
- [ ] Controls work on keyboard and touch; page never scrolls or zooms while playing.
- [ ] Every level shows stars + points; no dead ends or ways to get stuck.
- [ ] Ganesha never hurt, attacked, or mocked; no violence anywhere; text is respectful.
- [ ] All art and sound are original (drawn/synthesised in code); nothing external loaded.
- [ ] Works after page refresh and with localStorage blocked.
- [ ] Runs at ~60 fps on a mid-range phone.
- [ ] README has: how to play, controls, tools used (including AI), how to run locally.

**Fallback:** Fix only P0 bugs (game-breaking crashes, broken controls). Skip cosmetic issues.

**Commit:** `M8: QA pass, bug fixes`

---

### M9 — README, Video, Submit (16:00–16:30, 30 min)
**Goal:** README complete, demo video recorded, submission form filled by 16:30.

**Files changed:** `README.md`.

**Acceptance tests:**
1. README has a working GitHub Pages link, controls, tools used, and run instructions.
2. Demo video is under 3 min and shows Title → at least one full level → End screen.
3. Submission form submitted before 16:30.

**Commit:** `M9: README updated, submission ready`

---

## Risks and Shipping Rules

- **No level is cancelled.** If a milestone runs more than 20 min over, switch to its lite version and move on.
- **Lite versions** (from brief §9): Level 1 lite — 3 modaks, one patrol, no shortcut. Level 2 lite — 45 s, 3 wave patterns, finale stays. Level 3 lite — 45 s, fewer diyas, river ending stays.
- **Feature freeze at 15:20.** No new features. Incomplete Level 2 → switch to lite, stop building.
- **Polish cut order** if short on time: camera shake → blessing meter → extra particles.
- **Never cut:** story slides, three level scenes, recap, Play Again, mobile controls, deployment.
- **Submit at 16:30** whatever is tested and working. Never submit an untested build.
