// js/config.js — shared constants for Bappa's Journey
// Loaded first so every other file can read these values.

'use strict';

// One global namespace — no ES modules so everything lives on G.
var G = {};

// ── Game identity ──────────────────────────────────────────────────────────
G.GAME_TITLE    = "Bappa's Journey";
G.GAME_SUBTITLE = "The Story of Vighnaharta";

// ── Virtual canvas size (logical pixels) ──────────────────────────────────
G.W = 1280;   // width
G.H = 720;    // height

// ── Level order — level2 inserted in M4 ────────────────────────────────────
G.LEVEL_ORDER = ['level1', 'level2', 'level3'];

// ── Warm festival colour palette ──────────────────────────────────────────
G.COL = {
  saffron:   '#F26B38',   // Ganesha dhoti, accents
  marigold:  '#F5A623',   // collect rings, HUD highlights
  maroon:    '#8B1A1A',   // borders, text shadows
  cream:     '#FFF8E7',   // background panels, skin tones
  green:     '#4A7C59',   // leaf, path borders
  teal:      '#2AABB8',   // river, water elements
  indigo:    '#1A1A4E',   // Level 3 night sky
  gold:      '#FFD700',   // stars, blessing glow
  white:     '#FFFFFF',
  black:     '#000000',
  darkBg:    '#1A1A2E',   // letterbox / overlay background
  skinLight: '#FDDBB4',   // character skin (legacy)
  brown:     '#6B3A2A',   // tree trunks, wooden objects

  // ── New Ganesha palette (added for richer character art) ──────────────
  peachSkin:  '#F2B98F',  // Ganesha base skin — warm golden-peach
  peachShade: '#E3A87C',  // darker shade (chin, ear inner, trunk underside)
  peachHi:    '#FDE0C0',  // lighter forehead highlight
  blush:      '#F29A8C',  // rosy cheek circles
  innerEar:   '#F4A5A0',  // inner ear soft pink
  dhotiBdr:   '#8E1F2E',  // dhoti maroon border (same as maroon)
  goldLight:  '#FFD86B',  // crown gradient highlight
  goldDark:   '#E39A1E',  // crown gradient shadow
  ivoryTusk:  '#F5F0D8',  // tusk ivory
  outline:    '#5A3320',  // warm dark-brown outline (2 px, rounded)

  // ── Boy (Parvati's son, pre-Ganesha) palette ──────────────────────────
  boySkin:    '#D9A66E',  // sandalwood base skin
  boyShade:   '#B8834A',  // darker shade (underside)
  boyHi:      '#EEC48C',  // lighter highlight (forehead, chest centre)
  boyHair:    '#1A0A00',  // near-black hair topknot
  boyRibbon:  '#F26B38',  // saffron-orange topknot ribbon

  // ── Maa Parvati palette ────────────────────────────────────────────────
  parSkin:    '#F0C29A',  // warm medium skin base
  parShade:   '#D8A07A',  // skin shade (chin, neck, underarm)
  parHi:      '#FDE8C8',  // forehead / highlight
  parSaree:   '#F28C28',  // saffron-orange saree
  parBlouse:  '#FFF1D6',  // cream-yellow blouse
  parHair:    '#2A1200',  // dark-brown hair / braid
  lotPink:    '#F49AC2',  // lotus petal pink
  lotGreen:   '#4E8B3F',  // lotus stem green
};

// ── Scoring ────────────────────────────────────────────────────────────────
// Points = modaks × 10 + stars × 100 (+ Level 1 time bonus up to 100)
G.SCORE = {
  modakPts: 10,
  starPts:  100,
  // Level 1 time bonus thresholds (seconds)
  l1TimeBonusFull:  45,   // ≤ 45 s → +100
  l1TimeBonusHalf:  75,   // ≤ 75 s → +50
  // Level 1 star thresholds (times spotted)
  l1Stars: [0, 3],        // 0 spotted → 3★; 1-2 → 2★; 3+ → 1★
  // Level 2 star thresholds (obstacles hit)
  l2Stars: [1, 4],        // ≤1 hit → 3★; 2-4 → 2★; 5+ → 1★
  // Level 3 star thresholds (% diyas lit, 0-1)
  l3Stars: [0.8, 0.5],    // ≥80% → 3★; 50-79% → 2★; <50% → 1★
};

// ── Physics / tuning ──────────────────────────────────────────────────────
G.PLAYER_SPEED   = 220;   // px per second (logical)
G.BLESSING_REACH = 90;    // px radius for Blessing action

// ── Fade transition ────────────────────────────────────────────────────────
G.FADE_MS = 300;          // milliseconds for black fade in/out

// ── Scene registry — created here so scene files can register before main.js runs
G.scenes = {};

// ── HUD ────────────────────────────────────────────────────────────────────
G.HUD_FONT_SIZE = 22;     // px — must stay ≥ 18 px per brief
