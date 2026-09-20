// js/scenes/recap.js — Recap slides (M6, redesigned)
// 4 full-canvas slides that re-tell the whole story.
// Last slide (4) adds the player's per-level stats.
// Skippable, tap/Space to advance, auto-advance after 4.5 s.
//
// Layout: illustration fills 1280×720. Caption panel sits at BOTTOM CENTRE
// (y 560-690). 24 px safe margins on all sides. Golden vignette + thin
// golden frame on every slide.
'use strict';

// ── Slide definitions ─────────────────────────────────────────────────────────
var _RECAP_SLIDES = [
  { title: 'Born of Sandalwood',          caption: 'Maa Parvati shaped Ganesha with love on Mount Kailash.' },
  { title: 'Blessing of an Elephant Head',caption: 'Lord Shiva blessed the faithful guardian with a divine glow.' },
  { title: 'Modak Mischief & The Race',   caption: 'Ganesha snuck tasty modaks — then chose wisdom over speed!' },
  { title: 'Farewell at the River',       caption: 'With lit diyas and flower petals, Bappa returned home. See you next year!' },
];

// ── Module-level state (reset in init) ────────────────────────────────────────
var _rcSlide    = 0;
var _rcT        = 0;          // seconds on this slide
var _rcTotalT   = 0;          // seconds in scene (drives idle animation)
var _rcAlpha    = 0;          // caption fade 0→1
var _rcSkipRect = null;
var _rcHandler  = null;
var _rcIgnore   = 0;
var _RC_AUTO    = 4.5;        // seconds per slide before auto-advance

// Particles for slide 1 and 2 (petals / sparkles)
var _rcPetals   = [];
var _rcSparks   = [];

function _rcSeedParticles() {
  _rcPetals = [];
  _rcSparks = [];
  for (var i = 0; i < 18; i++) {
    _rcPetals.push({ x: Math.random() * 1280, y: Math.random() * 520, phase: Math.random() * Math.PI * 2 });
  }
  for (var j = 0; j < 14; j++) {
    _rcSparks.push({ x: 300 + Math.random() * 680, phase: Math.random() * Math.PI * 2 });
  }
}

function _rcAdvance() {
  if (_rcSlide < _RECAP_SLIDES.length - 1) {
    _rcSlide++;
    _rcT     = 0;
    _rcAlpha = 0;
    _rcSeedParticles();
  } else {
    G.sceneManager.goto('end');
  }
}

G.scenes['recap'] = {

  init: function () {
    _rcSlide  = 0;
    _rcT      = 0;
    _rcTotalT = 0;
    _rcAlpha  = 0;
    _rcSkipRect = null;
    _rcIgnore   = performance.now() + 400;
    _rcSeedParticles();
    if (G.Music) G.Music.play('recap');

    // Support ?debug=recap&slide=N
    var params = (typeof URLSearchParams !== 'undefined')
      ? new URLSearchParams(window.location.search) : null;
    if (params && params.get('debug') === 'recap') {
      var n = parseInt(params.get('slide') || '1', 10);
      _rcSlide = Math.max(0, Math.min(n - 1, _RECAP_SLIDES.length - 1));
    }

    _rcHandler = function (e) {
      if (performance.now() < _rcIgnore) return;
      e.preventDefault();
      var p = G.ui.toLogical(e);
      if (_rcSkipRect && G.ui.isButtonHit(p.x, p.y, _rcSkipRect)) {
        G.sceneManager.goto('end');
        return;
      }
      _rcIgnore = performance.now() + 300;
      _rcAdvance();
    };
    G.canvas.addEventListener('click',      _rcHandler);
    G.canvas.addEventListener('touchstart', _rcHandler, { passive: false });
  },

  destroy: function () {
    if (_rcHandler) {
      G.canvas.removeEventListener('click',      _rcHandler);
      G.canvas.removeEventListener('touchstart', _rcHandler);
      _rcHandler = null;
    }
  },

  update: function (dt) {
    _rcT      += dt;
    _rcTotalT += dt;
    // Caption reaches full opacity by 0.4 s
    _rcAlpha = Math.min(1, _rcT / 0.4);
    if (G.input.state.actionPressed) { _rcAdvance(); return; }
    if (_rcT >= _RC_AUTO) _rcAdvance();
  },

  draw: function (ctx) {
    var t  = _rcTotalT;
    var cx = G.W / 2;
    var GROUND_Y = 520;

    // ── Dispatch to per-slide illustration ───────────────────────────────
    if      (_rcSlide === 0) { _rcDrawSlide0(ctx, t, cx, GROUND_Y); }
    else if (_rcSlide === 1) { _rcDrawSlide1(ctx, t, cx, GROUND_Y); }
    else if (_rcSlide === 2) { _rcDrawSlide2(ctx, t, cx, GROUND_Y); }
    else                     { _rcDrawSlide3(ctx, t, cx, GROUND_Y); }

    // ── Golden vignette (warm corner darken) ─────────────────────────────
    _rcDrawVignette(ctx);

    // ── Thin golden frame ─────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(255,200,60,0.45)';
    ctx.lineWidth   = 3;
    ctx.strokeRect(12, 12, G.W - 24, G.H - 24);
    ctx.restore();

    // ── Caption panel (bottom centre, y 558–692) ─────────────────────────
    ctx.save();
    ctx.globalAlpha = _rcAlpha;
    _rcDrawCaption(ctx, cx);
    ctx.restore();

    // ── Slide counter (top-left, safe margin 24 px) ───────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '16px -apple-system,sans-serif';
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Recap ' + (_rcSlide + 1) + ' / ' + _RECAP_SLIDES.length, 24, 24);

    // ── Progress bar ──────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(245,166,35,0.45)';
    ctx.fillRect(0, 0, Math.min((_rcT / _RC_AUTO) * G.W, G.W), 3);

    // ── Slide dots (bottom centre, above caption, y ≈ 546) ───────────────
    var dotY = 546;
    for (var si = 0; si < _RECAP_SLIDES.length; si++) {
      ctx.beginPath();
      ctx.arc(cx - (_RECAP_SLIDES.length - 1) * 12 + si * 24,
              dotY, si === _rcSlide ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = si === _rcSlide ? G.COL.gold : 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    // ── Skip button (top-right, safe margin 24 px) ────────────────────────
    _rcSkipRect = G.ui.drawButton(ctx, 'Skip ▶▶', G.W - 90, 36, 130, 44, {
      color: 'rgba(0,0,0,0.5)', textColor: G.COL.cream, fontSize: 18, radius: 10
    });
  },

};

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 0 — "Born of Sandalwood" — reuse story slide 0 finished state
// (mountains, Kailash home, big Parvati, fully-formed boy + breath-of-life)
// ════════════════════════════════════════════════════════════════════════════
function _rcDrawSlide0(ctx, t, cx, GROUND_Y) {
  // Night sky + stars + moon
  G.scenery.drawSky(ctx, 0, GROUND_Y, t);
  G.scenery.drawStars(ctx, 0, GROUND_Y, t);
  G.scenery.drawMoon(ctx, 160, 90, 44, t);

  // Mountain range with snow + fog
  G.scenery.drawMountainRange(ctx, GROUND_Y, t);
  G.scenery.drawGlow(ctx, 640, GROUND_Y - 310, 120, '#A090FF', 0.18);

  // Floor
  ctx.fillStyle = '#2A1A0E';
  ctx.fillRect(0, GROUND_Y, G.W, G.H - GROUND_Y);

  // Kailash home
  G.scenery.drawKailashHome(ctx, 220, GROUND_Y, t);

  // Stone slab + sandalwood paste bowl
  var slabX = cx - 20;
  ctx.beginPath();
  ctx.ellipse(slabX, GROUND_Y - 6, 40, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7A6A50'; ctx.fill();
  ctx.strokeStyle = '#3A2A10'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(slabX, GROUND_Y - 14, 14, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#C07030'; ctx.fill();
  ctx.beginPath();
  ctx.ellipse(slabX, GROUND_Y - 16, 10, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#D2A679'; ctx.fill();

  // Parvati — big, warm smile (fixed-in "finished" pose: build done, boy fully formed)
  G.art.drawParvati(ctx, cx + 200, GROUND_Y, t, { scale: 2.4, pose: 'idle' });

  // Breath-of-life glow + fully-formed boy
  G.scenery.drawGlow(ctx, slabX + 30, GROUND_Y - 140, 110, '#FFD86B', 0.45);
  G.art.drawBoy(ctx, slabX + 30, GROUND_Y, t, { state: 'idle', scale: 2.7 });

  // Gentle petals
  _rcAnimPetals(ctx, t, GROUND_Y);
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — "Blessing of an Elephant Head"
// (mandala, Shiva calm + blessing hand, Ganesha celebrate, Parvati doorway)
// ════════════════════════════════════════════════════════════════════════════
function _rcDrawSlide1(ctx, t, cx, GROUND_Y) {
  // Purple → gold dusk sky
  var s1sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  s1sky.addColorStop(0,    '#2A1040');
  s1sky.addColorStop(0.55, '#5A2060');
  s1sky.addColorStop(1,    '#C87820');
  ctx.fillStyle = s1sky; ctx.fillRect(0, 0, G.W, GROUND_Y);

  // Temple floor (warm stone)
  ctx.beginPath(); ctx.rect(0, GROUND_Y - 30, G.W, G.H - GROUND_Y + 30);
  var s1fl = ctx.createLinearGradient(0, GROUND_Y - 30, 0, G.H);
  s1fl.addColorStop(0, '#7A5828'); s1fl.addColorStop(1, '#3A2A10');
  ctx.fillStyle = s1fl; ctx.fill();

  // Large golden mandala
  G.scenery.drawMandala(ctx, cx, GROUND_Y - 200, 280, t, 0.28);

  // Falling petals
  _rcAnimPetals(ctx, t, GROUND_Y);

  // Rising sparkles from ground
  for (var rk = 0; rk < 12; rk++) {
    var rkP = (t * 0.4 + rk * 0.083) % 1;
    var rkx = cx - 200 + rk * 36 + Math.sin(t * 1.2 + rk) * 18;
    var rky = GROUND_Y - rkP * 320;
    var rkA = (1 - rkP) * 0.65;
    if (rkA > 0.05) {
      ctx.beginPath(); ctx.arc(rkx, rky, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,230,80,' + rkA + ')'; ctx.fill();
    }
  }

  // Shiva — left, scale 2.5, bless pose
  G.art.drawShiva(ctx, cx - 300, GROUND_Y, t, { scale: 2.5, pose: 'bless' });

  // Blessing glow from his raised hand
  var handX = cx - 250, handY = GROUND_Y - 300;
  G.scenery.drawGlow(ctx, handX, handY, 180, '#FFD86B', 0.45 + Math.sin(t * 2.5) * 0.15);

  // Golden bridge (static in recap)
  var boyX1 = cx + 60;
  ctx.save();
  ctx.globalAlpha = 0.28;
  var bridge = ctx.createLinearGradient(handX, handY, boyX1, GROUND_Y - 260);
  bridge.addColorStop(0, 'rgba(255,220,80,0.8)'); bridge.addColorStop(1, 'rgba(255,200,60,0)');
  ctx.beginPath();
  ctx.moveTo(handX - 8, handY);
  ctx.quadraticCurveTo((handX + boyX1) / 2, handY - 30, boyX1, GROUND_Y - 260);
  ctx.lineTo(boyX1 + 8, GROUND_Y - 260);
  ctx.quadraticCurveTo((handX + boyX1) / 2 + 8, handY - 22, handX + 8, handY);
  ctx.closePath();
  ctx.fillStyle = bridge; ctx.fill();
  ctx.restore();

  // Ganesha — celebrate, big, centre-right (transformation complete)
  G.scenery.drawGlow(ctx, boyX1, GROUND_Y - 150, 160, '#FFD86B', 0.55);
  G.art.drawGanesha(ctx, boyX1, GROUND_Y, t, { state: 'celebrate', scale: 2.7 });

  // Parvati — far right, folded hands, smiling
  G.art.drawParvati(ctx, G.W - 180, GROUND_Y, t, { scale: 2.4, pose: 'smile' });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — "Modak Mischief & The Race"
// Left half: kitchen doorway, Ganesha + golden modak, Parvati smiling
// Right half: sunny path, Kartikeya on peacock ahead, Ganesha on Mushak,
//             glowing wisdom fruit at far end
// ════════════════════════════════════════════════════════════════════════════
function _rcDrawSlide2(ctx, t, cx, GROUND_Y) {
  var MID = 620;  // dividing line between left (kitchen) and right (race)

  // ── LEFT HALF: warm kitchen scene ──────────────────────────────────
  // Warm saffron-dawn sky on left
  var bgL = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  bgL.addColorStop(0, '#3A1A08'); bgL.addColorStop(1, '#8A4018');
  ctx.fillStyle = bgL; ctx.fillRect(0, 0, MID, GROUND_Y);

  // Kitchen floor (warm terracotta)
  var floorL = ctx.createLinearGradient(0, GROUND_Y - 20, 0, G.H);
  floorL.addColorStop(0, '#9A5020'); floorL.addColorStop(1, '#4A2010');
  ctx.fillStyle = floorL; ctx.fillRect(0, GROUND_Y - 20, MID, G.H - GROUND_Y + 20);

  // Warm glow patch near doorway (right side of left half)
  G.scenery.drawGlow(ctx, MID - 60, GROUND_Y - 60, 180, '#FFB050', 0.35);

  // Parvati kitchen doorway (silhouette arch)
  _rcDrawKitchenDoor(ctx, 90, GROUND_Y, t);

  // Parvati in doorway — smiling
  G.art.drawParvati(ctx, 90, GROUND_Y, t, { scale: 1.85, pose: 'smile' });

  // A diya on each side of the doorway
  G.art.drawDiya(ctx, 190, GROUND_Y, true, t);

  // Ganesha — centre-left of screen, holding modak
  G.art.drawGanesha(ctx, 360, GROUND_Y, t, { state: 'idle', scale: 2.3 });

  // Golden cream modak held in front of Ganesha (elevated near hand)
  var modPulse = 0.9 + Math.sin(t * 2.8) * 0.1;
  ctx.save();
  ctx.translate(360 + 55, GROUND_Y - 200);
  ctx.scale(modPulse * 2.2, modPulse * 2.2);
  G.art.drawModak(ctx, 0, 0, 1);
  ctx.restore();

  // ── SOFT DIVIDER ──────────────────────────────────────────────────
  var divider = ctx.createLinearGradient(MID - 30, 0, MID + 30, 0);
  divider.addColorStop(0, 'rgba(0,0,0,0)');
  divider.addColorStop(0.5, 'rgba(0,0,0,0.22)');
  divider.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = divider;
  ctx.fillRect(MID - 30, 0, 60, G.H);

  // ── RIGHT HALF: sunny race path ───────────────────────────────────
  var bgR = ctx.createLinearGradient(MID, 0, G.W, 0);
  bgR.addColorStop(0, '#4A7A28'); bgR.addColorStop(1, '#2A4A18');
  var skyR = ctx.createLinearGradient(MID, 0, MID, GROUND_Y);
  skyR.addColorStop(0, '#5090E0'); skyR.addColorStop(1, '#90C8F0');
  ctx.fillStyle = skyR; ctx.fillRect(MID, 0, G.W - MID, GROUND_Y);

  // Sunny path (green verge + dirt track)
  var pathR = ctx.createLinearGradient(MID, GROUND_Y - 20, G.W, GROUND_Y + 60);
  pathR.addColorStop(0, '#7AB040'); pathR.addColorStop(1, '#3A6020');
  ctx.fillStyle = pathR; ctx.fillRect(MID, GROUND_Y - 20, G.W - MID, G.H - GROUND_Y + 20);

  // Dirt track strip
  ctx.fillStyle = '#C8A060';
  ctx.beginPath();
  ctx.moveTo(MID + 80, GROUND_Y - 10); ctx.lineTo(G.W - 20, GROUND_Y - 10);
  ctx.lineTo(G.W - 20, GROUND_Y + 10); ctx.lineTo(MID + 80, GROUND_Y + 10);
  ctx.fill();

  // Wisdom fruit glowing at far right
  G.art.drawWisdomFruit(ctx, G.W - 70, GROUND_Y - 40, t);
  G.scenery.drawGlow(ctx, G.W - 70, GROUND_Y - 60, 60, '#FFD86B', 0.5);

  // Trees on horizon (simple silhouettes)
  _rcTreeSilhouettes(ctx, MID, GROUND_Y);

  // Kartikeya slightly ahead (right side, dir -1 = facing left)
  G.art.drawKartikeya(ctx, G.W - 200, GROUND_Y, t, { scale: 1.9, dir: -1 });

  // Ganesha on Mushak behind Kartikeya
  G.art.drawGaneshaOnMushak(ctx, G.W - 390, GROUND_Y, t, { scale: 1.6, dir: 1 });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — "Farewell at the River" (Visarjan)
// Night river scene: moon, devotee silhouettes, Ganesha waving, floating
// diyas, golden ripples, chant text, eco note, then player results.
// ════════════════════════════════════════════════════════════════════════════
function _rcDrawSlide3(ctx, t, cx, GROUND_Y) {
  // Night sky
  G.scenery.drawSky(ctx, 0, GROUND_Y, t);
  G.scenery.drawStars(ctx, 0, GROUND_Y, t);
  // Large moon upper-right
  G.scenery.drawMoon(ctx, G.W - 160, 90, 58, t);

  // ── River ─────────────────────────────────────────────────────────
  var riverY = GROUND_Y - 20;
  // River body
  ctx.save();
  var riv = ctx.createLinearGradient(0, riverY, 0, riverY + 130);
  riv.addColorStop(0, '#103858'); riv.addColorStop(1, '#0A2030');
  ctx.fillStyle = riv;
  ctx.fillRect(0, riverY, G.W, 130);

  // Moon reflection column
  var moonRefl = ctx.createLinearGradient(cx - 30, riverY, cx + 30, riverY + 130);
  moonRefl.addColorStop(0, 'rgba(255,250,200,0.28)');
  moonRefl.addColorStop(1, 'rgba(255,250,200,0)');
  ctx.fillStyle = moonRefl;
  ctx.fillRect(cx - 30, riverY, 60, 130);

  // Animated ripples
  for (var ri = 0; ri < 6; ri++) {
    var ripPhase = (t * 0.4 + ri * 0.17) % 1;
    var ripW     = 30 + ripPhase * 100;
    var ripA     = (1 - ripPhase) * 0.3;
    var ripX     = 160 + ri * 160 + Math.sin(t * 0.6 + ri) * 20;
    ctx.beginPath();
    ctx.ellipse(ripX, riverY + 20 + ripPhase * 60, ripW, ripW * 0.22, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,215,80,' + ripA + ')';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // River bank (ground before water)
  var bankGrd = ctx.createLinearGradient(0, GROUND_Y - 80, 0, riverY);
  bankGrd.addColorStop(0, '#2A1A08'); bankGrd.addColorStop(1, '#4A3018');
  ctx.fillStyle = bankGrd;
  ctx.fillRect(0, GROUND_Y - 80, G.W, 80);

  // Bank grass edge
  ctx.fillStyle = '#3A5018';
  ctx.fillRect(0, riverY - 6, G.W, 6);

  // Floating diyas on the water
  for (var di = 0; di < 7; di++) {
    var diyaX = 80 + di * 160 + Math.sin(t * 0.7 + di * 1.1) * 18;
    var diyaY = riverY + 14 + Math.sin(t * 1.0 + di * 0.9) * 5;
    // Diya reflection
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.scale(1, -0.35);
    G.art.drawDiya(ctx, diyaX, -(diyaY + 28), true, t + di * 0.3);
    ctx.restore();
    // Diya itself
    G.art.drawDiya(ctx, diyaX, diyaY, true, t + di * 0.3);
  }

  // Devotee silhouettes on the bank (behind Ganesha)
  _rcDevoteeSilhouettes(ctx, t, GROUND_Y);

  // Ground diyas on the bank
  G.art.drawDiya(ctx, 340, GROUND_Y - 4, true, t);
  G.art.drawDiya(ctx, G.W - 340, GROUND_Y - 4, true, t);

  // Marigold garlands on the bank
  G.scenery.drawMarigoldGarland(ctx, 0, GROUND_Y - 60, 460, GROUND_Y - 60, t);
  G.scenery.drawMarigoldGarland(ctx, 820, GROUND_Y - 60, G.W, GROUND_Y - 60, t);

  // Ganesha — centre, waving farewell (celebrate pose), big golden glow
  G.scenery.drawGlow(ctx, cx, GROUND_Y - 160, 200, '#FFD86B', 0.45);
  G.art.drawGanesha(ctx, cx, GROUND_Y, t, { state: 'celebrate', scale: 2.7 });

  // Falling flower petals
  _rcAnimPetals(ctx, t, GROUND_Y);

  // ── Chant + eco note ──────────────────────────────────────────────
  // Drawn before caption panel so panel covers them on last slide
  ctx.save();
  ctx.globalAlpha = _rcAlpha * 0.9;
  ctx.fillStyle   = G.COL.gold;
  ctx.font        = 'bold 22px -apple-system,sans-serif';
  ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Ganpati Bappa Morya! Pudhchya Varshi Lavkar Ya!', cx, 470);
  ctx.fillStyle = G.COL.cream;
  ctx.font      = '18px -apple-system,sans-serif';
  ctx.fillText('"Natural clay returns to the river, until next year."', cx, 498);
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════════════════
// CAPTION PANEL — bottom centre y 558–692
// On last slide also shows per-level stats inline.
// ════════════════════════════════════════════════════════════════════════════
function _rcDrawCaption(ctx, cx) {
  var isLast = (_rcSlide === _RECAP_SLIDES.length - 1);
  var panelH = isLast ? 190 : 118;
  var panelY = G.H - panelH - 16;  // ≈ 514 (last) or 586 (others)
  var panelW = isLast ? 900 : 760;

  // Dark semi-transparent panel
  ctx.fillStyle = 'rgba(15,8,2,0.72)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cx - panelW / 2, panelY, panelW, panelH, 16);
    ctx.fill();
  } else {
    ctx.fillRect(cx - panelW / 2, panelY, panelW, panelH);
  }

  // Gold top border line
  ctx.strokeStyle = 'rgba(255,200,60,0.55)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cx - panelW / 2, panelY, panelW, panelH, 16);
  } else {
    ctx.rect(cx - panelW / 2, panelY, panelW, panelH);
  }
  ctx.stroke();

  // Slide title (marigold, bold)
  G.art.centeredText(ctx, _RECAP_SLIDES[_rcSlide].title,
    cx, panelY + 30, 24, G.COL.marigold);

  // Caption text (word-wrapped, cream)
  var words = _RECAP_SLIDES[_rcSlide].caption.split(' ');
  var lines = _rcWrapWords(ctx, words, panelW - 60, 19);
  for (var li = 0; li < lines.length; li++) {
    G.art.centeredText(ctx, lines[li], cx, panelY + 62 + li * 28, 19, G.COL.cream);
  }

  // ── Per-level stats on last slide ─────────────────────────────────
  if (isLast) {
    _rcDrawStats(ctx, cx, panelY + 100);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VIGNETTE — warm corner darken + golden fade at edges
// ════════════════════════════════════════════════════════════════════════════
function _rcDrawVignette(ctx) {
  // Top and bottom fade
  var topFade = ctx.createLinearGradient(0, 0, 0, 80);
  topFade.addColorStop(0, 'rgba(10,4,0,0.45)');
  topFade.addColorStop(1, 'rgba(10,4,0,0)');
  ctx.fillStyle = topFade; ctx.fillRect(0, 0, G.W, 80);

  var botFade = ctx.createLinearGradient(0, G.H - 80, 0, G.H);
  botFade.addColorStop(0, 'rgba(10,4,0,0)');
  botFade.addColorStop(1, 'rgba(10,4,0,0.55)');
  ctx.fillStyle = botFade; ctx.fillRect(0, G.H - 80, G.W, 80);

  // Left and right fade
  var leftFade = ctx.createLinearGradient(0, 0, 60, 0);
  leftFade.addColorStop(0, 'rgba(10,4,0,0.40)');
  leftFade.addColorStop(1, 'rgba(10,4,0,0)');
  ctx.fillStyle = leftFade; ctx.fillRect(0, 0, 60, G.H);

  var rightFade = ctx.createLinearGradient(G.W - 60, 0, G.W, 0);
  rightFade.addColorStop(0, 'rgba(10,4,0,0)');
  rightFade.addColorStop(1, 'rgba(10,4,0,0.40)');
  ctx.fillStyle = rightFade; ctx.fillRect(G.W - 60, 0, 60, G.H);
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS — shared small drawing utilities for recap slides
// ════════════════════════════════════════════════════════════════════════════

// Animated drifting petals (uses _rcPetals seed array)
function _rcAnimPetals(ctx, t, GROUND_Y) {
  for (var i = 0; i < _rcPetals.length; i++) {
    var p = _rcPetals[i];
    var px = (p.x + t * (18 + i * 4)) % G.W;
    var py = p.y + Math.sin(t * 0.7 + p.phase) * 18;
    if (py > 10 && py < GROUND_Y - 10) {
      G.art.drawPetal(ctx, px, py, t + p.phase);
    }
  }
}

// Simple kitchen doorway arch (slide 2 left side)
function _rcDrawKitchenDoor(ctx, cx, groundY, t) {
  var dw = 140, dh = 280;
  var dx = cx - dw / 2, dy = groundY - dh;
  // Warm orange glow spilling through
  G.scenery.drawGlow(ctx, cx, groundY - dh * 0.4, 130, '#FF9820', 0.38);
  // Door frame (dark wood)
  ctx.fillStyle = '#3A2010';
  ctx.beginPath();
  ctx.rect(dx - 14, dy - 20, dw + 28, dh + 20);
  ctx.fill();
  // Door interior (warm golden)
  ctx.fillStyle = '#C07818';
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.fill();
  // Arch top
  ctx.fillStyle = '#3A2010';
  ctx.beginPath();
  ctx.arc(cx, dy, dw / 2 + 14, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#C07818';
  ctx.beginPath();
  ctx.arc(cx, dy, dw / 2, Math.PI, 0);
  ctx.fill();
  // Flickering warm light inside
  var flicker = 0.6 + Math.sin(t * 7.3) * 0.08;
  G.scenery.drawGlow(ctx, cx, groundY - 80, 80, '#FFB850', flicker * 0.45);
}

// Devotee silhouettes on the river bank
function _rcDevoteeSilhouettes(ctx, t, GROUND_Y) {
  var silhouettes = [
    { x: 140,  scale: 0.85, handsUp: true,  color: '#1A0808' },
    { x: 260,  scale: 0.80, handsUp: false, color: '#1A0808' },
    { x: G.W - 140, scale: 0.85, handsUp: true,  color: '#1A0808' },
    { x: G.W - 260, scale: 0.80, handsUp: false, color: '#1A0808' },
  ];
  for (var i = 0; i < silhouettes.length; i++) {
    var s = silhouettes[i];
    G.art.drawDevotee(ctx, s.x, GROUND_Y, t, {
      scale: s.scale, color: s.color, handsUp: s.handsUp
    });
  }
}

// Simple tree silhouettes on sunny horizon (slide 2 right half)
function _rcTreeSilhouettes(ctx, startX, groundY) {
  var trees = [640, 720, 830, 910, 1000, 1090, 1160];
  for (var i = 0; i < trees.length; i++) {
    var tx = trees[i];
    var th = 90 + (i % 3) * 20;
    // Trunk
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(tx - 5, groundY - th, 10, th);
    // Canopy
    ctx.beginPath();
    ctx.arc(tx, groundY - th - 20, 28 + (i % 2) * 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2A6020';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx - 14, groundY - th - 6, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#3A7028';
    ctx.fill();
  }
}

// ── Per-level stats block (used inside caption panel on slide 4) ──────────
function _rcDrawStats(ctx, cx, topY) {
  var levelLabels = { level1: 'Modak Mischief', level2: 'The Race', level3: 'Visarjan Walk' };
  var y = topY;
  var total = 0;

  G.LEVEL_ORDER.forEach(function (lvl) {
    var sc = G.run.levelScores[lvl] || 0;
    var st = G.run.levelStars[lvl]  || 0;
    total += sc;

    var label = levelLabels[lvl] || lvl;
    // Draw star icons (★ gold for earned, ☆ muted for empty)
    var starStr = '';
    for (var i = 0; i < 3; i++) {
      starStr += (i < st ? '★' : '☆');
    }
    G.art.centeredText(ctx, label + '  ' + starStr + '  ' + sc + ' pts',
      cx, y, 19, G.COL.cream);
    y += 28;
  });

  // Divider line
  ctx.strokeStyle = G.COL.marigold;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 240, y);
  ctx.lineTo(cx + 240, y);
  ctx.stroke();
  y += 22;

  // Blessing Score big
  G.art.centeredText(ctx, 'Blessing Score:  ' + total,
    cx, y, 26, G.COL.gold);
}

// ── Word-wrap helper ──────────────────────────────────────────────────────
function _rcWrapWords(ctx, words, maxW, fontSize) {
  ctx.font = fontSize + 'px -apple-system,sans-serif';
  var lines = [], cur = '';
  for (var i = 0; i < words.length; i++) {
    var test = cur ? cur + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur); cur = words[i];
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
