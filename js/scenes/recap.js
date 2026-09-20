// js/scenes/recap.js — Recap slides (M6)
// 4 slides that quickly re-tell the whole story with mini illustrations.
// Last slide shows the player's per-level stats for this run.
// Skippable, tap/Space to advance.
'use strict';

// ── Slide definitions ─────────────────────────────────────────────────────────
var _RECAP_SLIDES = [
  { title: 'Born of Sandalwood',    caption: 'Maa Parvati shaped Ganesha with love on Mount Kailash.' },
  { title: 'Blessing of an Elephant Head', caption: 'Lord Shiva blessed the faithful guardian with a divine glow.' },
  { title: 'Modak Mischief & The Race', caption: 'Ganesha snuck tasty modaks — then chose wisdom over speed!' },
  { title: 'Farewell at the River', caption: 'With lit diyas and flower petals, Bappa returned home. See you next year!' },
];

// ── Module-level state (reset in init) ────────────────────────────────────────
var _rcSlide    = 0;
var _rcT        = 0;
var _rcTotalT   = 0;
var _rcAlpha    = 0;
var _rcSkipRect = null;
var _rcHandler  = null;
var _rcIgnore   = 0;
var _RC_AUTO    = 4.5;   // seconds per slide before auto-advance

function _rcAdvance() {
  if (_rcSlide < _RECAP_SLIDES.length - 1) {
    _rcSlide++;
    _rcT    = 0;
    _rcAlpha = 0;
  } else {
    G.sceneManager.goto('end');
  }
}

G.scenes['recap'] = {

  init: function () {
    _rcSlide    = 0;
    _rcT        = 0;
    _rcTotalT   = 0;
    _rcAlpha    = 0;
    _rcSkipRect = null;
    _rcIgnore   = performance.now() + 400;

    _rcHandler = function (e) {
      if (performance.now() < _rcIgnore) return;
      e.preventDefault();
      var p = G.ui.toLogical(e);
      if (_rcSkipRect && G.ui.isButtonHit(p.x, p.y, _rcSkipRect)) {
        G.sceneManager.goto('end');
        return;
      }
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
    _rcAlpha   = Math.min(1, _rcT / 0.5);
    if (G.input.state.actionPressed) { _rcAdvance(); return; }
    if (_rcT >= _RC_AUTO) _rcAdvance();
  },

  draw: function (ctx) {
    var t = _rcTotalT;

    // ── Background gradient (warm dark) ──────────────────────────────────
    var bg = ctx.createLinearGradient(0, 0, 0, G.H);
    bg.addColorStop(0, '#1A1230');
    bg.addColorStop(1, '#2C1A08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, G.W, G.H);

    // ── Mini illustration panel (left half) ──────────────────────────────
    ctx.save();
    ctx.globalAlpha = _rcAlpha;

    var ilX = G.W * 0.25;   // illustration centre X
    var ilY = G.H * 0.48;   // illustration centre Y

    if (_rcSlide === 0) {
      // Sandalwood birth: Parvati + glowing form
      var grd0 = ctx.createRadialGradient(ilX, ilY - 60, 4, ilX, ilY - 60, 50);
      grd0.addColorStop(0, 'rgba(255,200,80,0.9)');
      grd0.addColorStop(1, 'rgba(255,180,50,0)');
      ctx.beginPath(); ctx.arc(ilX, ilY - 60, 50, 0, Math.PI * 2);
      ctx.fillStyle = grd0; ctx.fill();
      G.art.drawParvati(ctx, ilX, ilY + 30, t, { scale: 0.85 });
      // Small glowing figure
      G.art.ellipse(ctx, ilX + 30, ilY - 60, 12, 16, '#D2A679');

    } else if (_rcSlide === 1) {
      // Blessing: Shiva + gold glow head silhouette
      var pulse1 = 0.5 + Math.sin(t * 2) * 0.2;
      var grd1 = ctx.createRadialGradient(ilX, ilY - 40, 6, ilX, ilY - 40, 70);
      grd1.addColorStop(0, 'rgba(255,220,60,' + pulse1 + ')');
      grd1.addColorStop(1, 'rgba(255,180,30,0)');
      ctx.beginPath(); ctx.arc(ilX, ilY - 40, 70, 0, Math.PI * 2);
      ctx.fillStyle = grd1; ctx.fill();
      G.art.drawShiva(ctx, ilX - 60, ilY + 30, t, { scale: 0.8 });
      // Elephant head silhouette in glow
      ctx.save();
      ctx.translate(ilX + 30, ilY - 40);
      ctx.globalAlpha = pulse1 * 0.8 * _rcAlpha;
      G.art.ellipse(ctx, 0, -8, 22, 20, G.COL.gold);
      G.art.ellipse(ctx, 24, -6, 12, 15, G.COL.gold);
      G.art.ellipse(ctx, -24, -6, 12, 15, G.COL.gold);
      ctx.restore();

    } else if (_rcSlide === 2) {
      // Modak + race: Ganesha celebrate left, Kartikeya right
      G.art.drawGanesha(ctx, ilX - 50, ilY + 30, t, { state: 'celebrate', scale: 0.75 });
      G.art.drawKartikeya(ctx, ilX + 60, ilY + 30, t, { scale: 0.65, dir: -1 });
      // Modaks floating above
      for (var mi = 0; mi < 3; mi++) {
        G.art.drawModak(ctx,
          ilX - 60 + mi * 55,
          ilY - 60 + Math.sin(t * 2 + mi) * 8, 0.8);
      }

    } else if (_rcSlide === 3) {
      // Visarjan: Ganesha at river, diyas floating, devotees
      // River rectangle
      ctx.fillStyle = '#1A6070';
      ctx.fillRect(ilX - 130, ilY - 10, 260, 60);
      // Ripples
      for (var ri = 0; ri < 4; ri++) {
        ctx.beginPath();
        ctx.ellipse(ilX - 60 + ri * 40, ilY + 20, 22, 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,215,0,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // Floating diyas
      for (var di = 0; di < 3; di++) {
        G.art.drawDiya(ctx,
          ilX - 40 + di * 40,
          ilY + 10 + Math.sin(t * 1.2 + di) * 6,
          true, t);
      }
      G.art.drawGanesha(ctx, ilX, ilY - 40, t, { state: 'celebrate', scale: 0.75 });
      G.art.drawDevotee(ctx, ilX - 110, ilY - 30, t, { scale: 0.6, color: G.COL.maroon, handsUp: true });
      G.art.drawDevotee(ctx, ilX + 110, ilY - 30, t, { scale: 0.6, color: G.COL.teal,   handsUp: true });
    }

    ctx.restore();

    // ── Text panel (right half or last-slide full-width) ──────────────────
    ctx.save();
    ctx.globalAlpha = _rcAlpha;

    var isLast = (_rcSlide === _RECAP_SLIDES.length - 1);
    var txX = isLast ? G.W / 2 : G.W * 0.67;
    var txW = isLast ? 700 : 460;

    // Panel
    G.art.roundRect(ctx,
      txX - txW / 2, G.H * 0.28 - 18, txW,
      isLast ? 340 : 120,
      14, 'rgba(0,0,0,0.55)');

    // Title
    G.art.centeredText(ctx,
      _RECAP_SLIDES[_rcSlide].title,
      txX, G.H * 0.28 + 14, 24, G.COL.marigold);

    // Caption
    var words = _RECAP_SLIDES[_rcSlide].caption.split(' ');
    var lines = _wrapWords(ctx, words, txW - 40, 20);
    for (var li = 0; li < lines.length; li++) {
      G.art.centeredText(ctx, lines[li],
        txX, G.H * 0.28 + 52 + li * 30, 20, G.COL.cream);
    }

    // ── Stats on last slide ────────────────────────────────────────────
    if (isLast) {
      _rcDrawStats(ctx, txX, G.H * 0.28 + 130);
    }

    ctx.restore();

    // ── Slide counter (top-left) ──────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Recap ' + (_rcSlide + 1) + ' / ' + _RECAP_SLIDES.length, 18, 18);

    // ── Progress bar ──────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(245,166,35,0.4)';
    ctx.fillRect(0, 0, Math.min((_rcT / _RC_AUTO) * G.W, G.W), 3);

    // ── Slide dots ────────────────────────────────────────────────────────
    for (var si = 0; si < _RECAP_SLIDES.length; si++) {
      ctx.beginPath();
      ctx.arc(G.W / 2 - (_RECAP_SLIDES.length - 1) * 10 + si * 20,
              G.H - 18, si === _rcSlide ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = si === _rcSlide ? G.COL.gold : 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    // ── Skip button ───────────────────────────────────────────────────────
    _rcSkipRect = G.ui.drawButton(ctx, 'Skip ▶▶', G.W - 90, 36, 130, 44, {
      color: 'rgba(0,0,0,0.5)', textColor: G.COL.cream, fontSize: 18, radius: 10
    });
  },

};

// ── Helper: naive word-wrap into lines ────────────────────────────────────────
function _wrapWords(ctx, words, maxW, fontSize) {
  ctx.font = fontSize + 'px -apple-system,sans-serif';
  var lines = [];
  var cur   = '';
  for (var i = 0; i < words.length; i++) {
    var test = cur ? cur + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = words[i];
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Per-level stats block ────────────────────────────────────────────────────
function _rcDrawStats(ctx, cx, topY) {
  var levelLabels = { level1: 'Modak Mischief', level2: 'The Race', level3: 'Visarjan Walk' };
  var y = topY;
  var total = 0;

  G.LEVEL_ORDER.forEach(function (lvl) {
    var sc = G.run.levelScores[lvl] || 0;
    var st = G.run.levelStars[lvl]  || 0;
    total += sc;

    var label = levelLabels[lvl] || lvl;
    var stars = '';
    for (var i = 0; i < 3; i++) stars += (i < st ? '★' : '☆');

    G.art.centeredText(ctx, label + '  ' + stars + '  ' + sc + ' pts',
      cx, y, 20, G.COL.cream);
    y += 32;
  });

  // Divider
  ctx.strokeStyle = G.COL.marigold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 220, y - 2); ctx.lineTo(cx + 220, y - 2);
  ctx.stroke();
  y += 14;

  G.art.centeredText(ctx, 'Blessing Score: ' + total,
    cx, y, 26, G.COL.gold);
}
