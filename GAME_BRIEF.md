# GAME_BRIEF.md — "Bappa's Journey"

Save this file in the repo root. Every Bob prompt says "read GAME_BRIEF.md", so keep it up to date.
Final title: **Bappa's Journey** (subtitle: *The Story of Vighnaharta*). It lives in ONE constant (`GAME_TITLE` in `js/config.js`) so it can be renamed any time.

## 0. One-liner
A short story-driven browser game. You play young Lord Ganesha: 4 story slides -> 3 playable levels -> recap slides.
About 5 minutes per playthrough, built to be replayed for stars. Works on phone and laptop. No login, no backend.

## 1. Contest constraints (hard requirements)
- Theme: Vinayaka Chaturthi. Must clearly connect to Ganesha's stories / the festival.
- Easy to start, working gameplay, clear result, proper ending, Play Again.
- Works on common mobile and laptop browsers. Opens with no login and no campus restriction.
- Safe + respectful: Ganesha is NEVER shown hurt, attacked or mocked. No combat, no enemies, no violence, no beheading, no laughing NPCs.
- Only assets we have permission to use: EVERYTHING is drawn in code (vector shapes) and sounds are synthesized with Web Audio. No downloaded images, sounds, fonts or 3D models. Do not copy any other game's art.
- No personal data collected. No passwords, no payments, no network calls at runtime.
- Leaderboard-friendly: one clear number = Blessing Score (see section 6).
- Judges score: fun/replay, creativity, completeness (start -> result -> restart), ease of use + look, technical quality, demo/explanation.

## 2. Tech stack (locked)
- Plain HTML + CSS + JavaScript, HTML5 Canvas 2D. No engine, no bundler, no npm.
- Classic `<script>` tags loaded in order, one global namespace (e.g. `const G = {}`). NO ES modules, so index.html also works by double-click.
- No external libraries or CDNs. System font stack only.
- Hosted on GitHub Pages from `main`, root folder. Commit after every milestone.
- Base resolution 1280x720 (16:9), scaled to fit the screen with letterboxing, crisp on high-DPI screens.
- 60 fps target. Total download under ~1 MB.
- Code must be simple, commented and split into small files: the developer must be able to explain it in a live code walkthrough.
- Level order lives in ONE array in `js/config.js`: `LEVEL_ORDER`. It starts as `['level1','level3']` and Level 2 is inserted between them later (M4). The flow, recap and End screen must work with or without `'level2'`.

Suggested files:
```
index.html
css/style.css
js/config.js     (constants: title, colors, sizes, score rules)
js/main.js       (game loop, scene manager)
js/input.js      (keyboard + virtual joystick + action button + swipe)
js/audio.js      (Web Audio synth: chime, pop, soft thud, dhol loop, mute)
js/art.js        (all vector drawing: characters, props, backgrounds)
js/ui.js         (buttons, HUD, text, transitions, particles)
js/scenes/title.js, story.js, level1.js, level2.js, level3.js, recap.js, end.js
README.md
```

## 3. Controls (same "move + one action" everywhere)
- Laptop: WASD or Arrow keys to move. Space (or J) = Blessing. Mouse click for menus. M = mute.
- Mobile: on-screen virtual joystick (left thumb) and one big Blessing button (right thumb). Buttons >= 64 px. Menus by tap.
- Level 2 (runner): Left/Right arrows or A/D, on-screen left/right buttons, or swipe left/right.
- Block page scroll, pull-to-refresh, double-tap zoom and text selection (`touch-action: none`, viewport meta).
- Portrait phone: show a friendly "Rotate your phone for the best view" overlay.
- Audio starts only after the first tap/click (browser autoplay policy). Mute button always visible.

## 4. Visual style (flat vector, top-down 3/4 view)
- Camera: fixed high 3/4 top-down angle, camera follows Ganesha (translate, clamped to level bounds). Sprites are drawn with a slight tilt and sorted by Y so objects overlap correctly. Soft oval ground shadows under everything.
- Look: flat colors, one shade layer, no outlines or thin dark-brown outlines. Warm festival palette: saffron, marigold yellow, maroon, cream, leaf green, river teal, night indigo for Level 3.
- Characters are built from layered shapes (paper-doll) with procedural animation: idle bob, walk sway, squash/stretch on stop/start.
- Ganesha: friendly young "Bal Ganesha", big round head with large ears, curled trunk, one small tusk, round belly, saffron dhoti, small crown, holds a modak in one hand, other hand in a blessing gesture. Two arms are enough. Big readable silhouette (about 90-110 px tall on the 1280x720 canvas). Dignified and cute, never comic or caricatured.
- Other characters in the same style, simple and respectful: Mushak (mouse), Parvati, Shiva, Kartikeya (with a peacock), devotees (simple silhouettes).
- HUD is minimal: modak counter, Blessing cooldown ring, mute button, pause. Text size >= 18 px. Icons distinguishable by shape, not only color. No flashing lights.

## 5. Flow and levels
Screens: TITLE -> STORY (4 slides) -> LEVEL 1 -> LEVEL 2 -> LEVEL 3 -> RECAP (3-4 slides) -> END (score, stars, Play Again, Replay a level).

### Title (5 seconds to first action)
Title, a big Play button, sound toggle, one-line "how to play". Play goes straight to the story.

### Story slides (skippable)
Tap / click / Space to advance, auto-advance after 4 s, a visible Skip button. One or two short lines per slide, gentle animation.
1. "On Mount Kailash, Maa Parvati shaped a little boy from sandalwood paste and gave him life."
2. "She asked him to guard her door. He stood there, brave and faithful."
3. "When Lord Shiva came home, moved by the boy's courage, he blessed him with the gentle head of an elephant."
4. "Named Ganapati, first among all and remover of obstacles, little Ganesha is now hungry for modaks!"
No violence is shown or described. Slide 3 is a soft "blessing" glow moment, not a fight.

### Level 1 — "Modak Mischief" (top-down stealth, about 60-90 s)
- Story: the young Ganesha playfully sneaks modaks from Maa Parvati's puja kitchen before the aarti. Do NOT call it stealing or robbery anywhere in the game.
- World: one kitchen room about 1.5 screens wide (camera follows). Walls, tables, big pots and stools as cover.
- Goal: collect 5 modaks, then reach Mushak's little exit at the far side.
- Maa Parvati patrols between waypoints. She has a soft golden "gaze" cone (warm light, NOT scary red). Walls and big objects block her line of sight (simple segment/rectangle intersection). She pauses and turns at waypoints.
- If spotted: Parvati smiles, says "Wait for the puja, Ganesha!", and Ganesha walks back to the start. Modaks already collected are kept. No game over, no lives.
- Blessing (action button): clears one small obstacle (stool / pot) within reach so a shortcut opens. Short cooldown.
- Stars: 3 stars = spotted 0 times, 2 = spotted 1-2 times, 1 = more. Small time bonus.

### Level 2 — "The Race" (Subway-Surfers-style lane runner, about 60 s + 10 s finale)
- Story: Ganesha and his brother Kartikeya race for the fruit of wisdom. Kartikeya rides his peacock. Friendly rivalry, Kartikeya is never mocked or shown hurt.
- Ganesha rides Mushak. 3 lanes, fake-3D perspective (objects scale up and move down as they approach). Auto-run.
- Move: switch lanes (keys / buttons / swipe). Blessing clears the obstacle in your lane ahead (cooldown about 1.5 s). Obstacles: rocks, logs, thorny bushes. Collect modaks in lanes.
- Hitting an obstacle: Mushak wobbles and slows for 1 s. No lives, no game over.
- Race HUD: a small track bar at the top with Ganesha and Kartikeya icons. Kartikeya is scripted (rubber-banded) to be slightly AHEAD at the line, so the player cannot win by speed alone.
- Obstacle waves are hand-authored/patterned so every wave can be passed (an open lane, or blockable by Blessing). No unfair patterns.
- After about 60 s the player reaches the finish line at the gates of Kailash where Shiva and Parvati wait. Kartikeya's icon is ahead. Text: "Kartikeya is faster... but Ganesha knows a wiser way. His parents are his world."
- Finale (about 10 s): a top-down view with Shiva and Parvati seated in the centre. Hold the action button (Space / on-screen button) to walk around them. 3 laps with a visible lap counter. Reward: the fruit of wisdom glows and Kartikeya arrives, smiling and bowing to his brother.
- Stars: by modaks collected and obstacles hit (fewer = better). Never by beating Kartikeya.

### Level 3 — "Visarjan Walk" (top-down, about 60-75 s)
- Story: Ganesha walks with the devotees to the river to return home.
- World: a long, gently winding festival path at night, camera follows. Devotees, dhol beat, marigold garlands, floating diya lights.
- Goal: walk to the river. Optional: light unlit diyas by walking close (more diyas lit = more stars). Collect flower petals for points. No fail state.
- Blessing: sends a soft glow that lights nearby diyas from a distance.
- Ending beat at the river: golden ripples and floating diyas. One-line eco note: "Natural clay returns to the river, until next year." Chant on screen: "Ganpati Bappa Morya! Pudhchya Varshi Lavkar Ya!" Gentle, celebratory, no dramatic sinking or breaking.

### Recap slides (3-4)
Re-tell the whole story quickly using mini illustrations: Born of sandalwood -> elephant head -> modak mischief -> wisdom over speed -> farewell at the river. Show the player's stats on the last slide.

### End screen
Blessing Score, stars per level, best score, Play Again (full restart), Replay Level 1 / 2 / 3, mute toggle.

## 6. Scoring (leaderboard-friendly)
- Level points = modaks x 10 + stars x 100 (+ Level 1 time bonus up to 100).
- Blessing Score = sum of all three level points. Show it big on the End screen.
- Save the best score and best stars per level with `localStorage`, wrapped in try/catch (must still work if storage is blocked).
- Document exact star thresholds in PLAN.md and README.md.

## 7. Juice / polish (cheap, high impact)
- Web Audio: soft chime on collect, pop on modak, gentle thud on wobble/spotted, Blessing shimmer, level-complete jingle, light dhol loop on Levels 1-3 (quiet), mute toggle.
- Particles: marigold petals / modak sparkles on collect and on level complete.
- Small camera shake on Blessing clear, squash-and-stretch on Ganesha, smooth scene fade transitions, a "blessing meter" in the HUD that fills as the game goes.
- Instant retry everywhere, no loading screens.

## 8. Milestones and time boxes (Sunday 20 Sept. Start 10:00 AM. HARD contest deadline 5:00 PM. Submit by 4:30 PM)
BUILD ORDER: M0, M1, M2, M3, M5, M6, then M4, M7, M8, M9.
Level 2 (M4) is built after the recap ON PURPOSE, so a complete game is already live before the hardest level starts. This is only an order. It is NOT optional: all three levels ship.
- Setup 10:00-10:15 repo, brief in, Ask + Plan (time-boxed, no long discussions)
- M0 10:15-10:45 scaffold, loop, scene manager, responsive canvas, input, LIVE on GitHub Pages
- M1 10:45-11:25 vector art kit + art gallery debug scene (developer approves the look)
- M2 11:25-11:50 title + story slides + transitions
- M3 11:50-13:00 Level 1 Modak Mischief
- Break 13:00-13:15 eat, rest your eyes
- M5 13:15-13:55 Level 3 Visarjan Walk
- M6 13:55-14:20 recap + End screen + scoring + storage (works with LEVEL_ORDER = level1, level3 first)
- CHECKPOINT 14:20: the complete game (slides -> Level 1 -> Level 3 -> recap -> End) is live
- M4 14:20-15:20 Level 2 The Race, inserted into LEVEL_ORDER between level1 and level3 (hard stop 15:20)
- 15:20 FEATURE FREEZE. No new features after this.
- M7 15:20-15:45 dhol loop, polish, tuning, bug fixing
- M8 15:45-16:00 QA checklist on a real phone + laptop
- M9 16:00-16:30 README, demo video, submission form. SUBMIT by 16:30.
- 16:30-17:00 buffer only. Never build in the buffer.

## 9. Shipping rules (NO level is cancelled)
All three levels stay in the game. Nothing is dropped in advance. If a level runs late, it gets its LITE version, it is never deleted:
- Level 1 lite: 3 modaks, one Parvati patrol route, no Blessing-cleared shortcuts.
- Level 2 lite: 45 s run, fewer wave patterns. The parents-circle finale stays.
- Level 3 lite: 45 s walk, fewer diyas. The river ending stays.
Checkpoints:
1. If a milestone is more than 20 minutes late, switch that level to its lite version and move on.
2. If short on time, skip these polish items first: camera shake, blessing meter, extra particles.
3. At 15:20 the feature freeze starts. If Level 2 is still not fully working, switch it to its lite version and stop building. Do not remove it.
4. At 16:30 submit whatever is tested and working. Never submit an untested build. The last 40 minutes are for testing, the video and the form.
Never cut: story slides, the three level scenes, recap + Play Again, mobile controls, deployment.

## 10. Definition of Done (checked at M8)
- [ ] Live GitHub Pages link opens on a phone and a laptop with no login.
- [ ] Title -> story -> 3 levels -> recap -> End screen -> Play Again all work with no console errors.
- [ ] Controls work on keyboard and touch. Page never scrolls or zooms while playing.
- [ ] Every level has a clear result (stars + points). No dead ends, no way to get stuck.
- [ ] Ganesha never hurt/attacked/mocked. No violence anywhere. Text is respectful.
- [ ] All art and sound are original (drawn/synthesized in code). Nothing external.
- [ ] Works after a page refresh and with localStorage blocked.
- [ ] Runs smoothly (about 60 fps) on a mid-range phone.
- [ ] README with how to play, controls, tools used (including AI assistant), and how to run.
