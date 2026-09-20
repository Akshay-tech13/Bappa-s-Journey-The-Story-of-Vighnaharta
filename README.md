# Bappa's Journey — The Story of Vighnaharta

A short story-driven browser game for Vinayaka Chaturthi.
Play as young Lord Ganesha through 3 levels: stealth kitchen mischief, a wisdom race, and a festive farewell walk to the river.

**Live demo:** *(GitHub Pages URL goes here after first deploy)*

---

## How to play

| Control | Keyboard | Mobile |
|---------|----------|--------|
| Move | WASD or Arrow keys | Virtual joystick (bottom-left) |
| Blessing / Action | Space or J | Big button (bottom-right) |
| Mute | M | Mute button (top-right) |
| Menus | Click | Tap |

- **Level 1 – Modak Mischief:** Collect 5 modaks and reach Mushak without being spotted.
- **Level 2 – The Race:** Switch lanes to dodge obstacles while riding Mushak. Wisdom wins, not speed.
- **Level 3 – Visarjan Walk:** Walk to the river, light diyas, and collect flower petals.

**Blessing Score** = sum of points from all three levels (modaks × 10 + stars × 100 + bonuses).

### Star thresholds
| Level | ★★★ | ★★ | ★ |
|-------|-----|----|----|
| Level 1 | Spotted 0 times | Spotted 1–2× | Spotted 3+× |
| Level 2 | ≤ 1 obstacle hit | 2–4 hits | 5+ hits |
| Level 3 | ≥ 80 % diyas lit | 50–79 % | < 50 % |

---

## How to run locally

1. Clone or download this repo.
2. Open `index.html` directly in your browser (double-click works — no server needed).
3. Or serve it with any static server, e.g.: `python -m http.server 8080`

No build step, no npm, no dependencies.

---

## Tools used

- HTML5 Canvas 2D for all rendering (no engine)
- Web Audio API for all sounds (no audio files)
- Vanilla JavaScript — no libraries, no bundler
- IBM Bob AI assistant (code planning and generation)
- GitHub Pages for hosting

---

## Controls (full list)

- **WASD / Arrow keys** — move
- **Space / J** — Blessing action
- **M** — toggle mute
- **Mouse click / tap** — menus and buttons
- **Swipe left / right** — lane switch in Level 2
