// js/scenes/end.js — End screen (M6)
// Shows Blessing Score, stars per level, best score, Play Again,
// Replay Level buttons (only for levels in LEVEL_ORDER), mute toggle.
// Saves best score + best stars per level to localStorage (try/catch).
'use strict';

// ── Module-level state ────────────────────────────────────────────────────────
var _endHandler  = null;
var _endIgnore   = 0;
var _endBtns     = [];    // { label, action, rect } — rebuilt each draw frame
var _endT        = 0;

// ── localStorage helpers (same pattern as main.js G.storage) ─────────────────
var _LS_BEST_SCORE = 'bappa_bestScore';
var _LS_BEST_STARS = 'bappa_bestStars';  // JSON object { level1:3, level2:2, … }

function _loadBest() {
  return {
    score: G.storage.get(_LS_BEST_SCORE, 0),
    stars: G.storage.get(_LS_BEST_STARS, {}),
  };
}

function _saveBest(runScore, runStars) {
  var prev = _loadBest();

  // Only update the total score when this run covered ALL levels
  // (partial replay runs have lower totals and should not overwrite the best)
  var fullRun = G.LEVEL_ORDER.every(function (lvl) {
    return G.run.levelScores[lvl] !== undefined;
  });
  if (fullRun && runScore > prev.score) {
    G.storage.set(_LS_BEST_SCORE, runScore);
  }

  // Always update best stars per level (keep highest — safe for partial runs)
  var newStars = {};
  for (var k in prev.stars) newStars[k] = prev.stars[k];
  for (var lvl in runStars) {
    if (runStars[lvl]) newStars[lvl] = Math.max(newStars[lvl] || 0, runStars[lvl]);
  }
  G.storage.set(_LS_BEST_STARS, newStars);
}

// ── Scene ─────────────────────────────────────────────────────────────────────
G.scenes['end'] = {

  init: function () {
    _endT      = 0;
    _endBtns   = [];
    _endIgnore = performance.now() + 400;
    if (G.Music) G.Music.play('end');

    // Compute total blessing score from this run
    var total = 0;
    G.LEVEL_ORDER.forEach(function (lvl) {
      total += G.run.levelScores[lvl] || 0;
    });
    G.run.blessingScore = total;

    // Persist best
    _saveBest(total, G.run.levelStars);

    // Load best for display
    this._best = _loadBest();
    this._runTotal = total;

    // ── Build button list once in init (not every draw frame) ─────────
    var btnY    = G.H - 100;
    var rxStart = 480;
    var rxStep  = 200;

    // Play Again
    var r0 = { x: 220 - 110, y: btnY - 27, w: 220, h: 54 };
    _endBtns.push({ rect: r0, action: function () {
      G.resetRun();
      G.sceneManager.goto('title');
    }});

    // Replay per level
    G.LEVEL_ORDER.forEach(function (lvl, idx) {
      var rx = rxStart + idx * rxStep;
      var r  = { x: rx - 85, y: btnY - 27, w: 170, h: 54 };
      _endBtns.push({ rect: r, action: (function (l) {
        return function () {
          delete G.run.levelScores[l];
          delete G.run.levelStars[l];
          G.run.returnTo = 'end';
          G.sceneManager.goto(l);
        };
      })(lvl)});
    });

    // Mute button rect (stable position)
    var rm = { x: G.W - 80 - 65, y: 36 - 22, w: 130, h: 44 };
    _endBtns.push({ rect: rm, action: function () { G.audio.toggleMute(); }});

    // Attach tap / click handler
    _endHandler = function (e) {
      if (performance.now() < _endIgnore) return;
      e.preventDefault();
      var p = G.ui.toLogical(e);
      for (var i = 0; i < _endBtns.length; i++) {
        if (G.ui.isButtonHit(p.x, p.y, _endBtns[i].rect)) {
          _endBtns[i].action();
          return;
        }
      }
    };
    G.canvas.addEventListener('click',      _endHandler);
    G.canvas.addEventListener('touchstart', _endHandler, { passive: false });
  },

  destroy: function () {
    if (_endHandler) {
      G.canvas.removeEventListener('click',      _endHandler);
      G.canvas.removeEventListener('touchstart', _endHandler);
      _endHandler = null;
    }
  },

  update: function (dt) {
    _endT += dt;
  },

  draw: function (ctx) {
    var t = _endT;

    // ── Background ────────────────────────────────────────────────────────
    var bg = ctx.createLinearGradient(0, 0, 0, G.H);
    bg.addColorStop(0, '#1A1230');
    bg.addColorStop(1, '#2C1A08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, G.W, G.H);

    // Floating petals in background (cheap ambience)
    for (var pi = 0; pi < 10; pi++) {
      var px = ((pi * 137 + t * 30) % G.W);
      var py = ((pi * 93  + t * 18) % G.H);
      G.art.drawPetal(ctx, px, py, t + pi * 0.5);
    }

    // ── Ganesha (celebrating, right side) ─────────────────────────────────
    G.art.drawGanesha(ctx, G.W - 150, G.H / 2 + 80, t, {
      state: 'celebrate', scale: 1.1
    });

    // ── Title ─────────────────────────────────────────────────────────────
    G.art.centeredText(ctx, "Bappa's Journey Complete!", G.W / 2 - 80, 52, 30, G.COL.marigold);
    G.art.centeredText(ctx, G.GAME_SUBTITLE, G.W / 2 - 80, 88, 18, G.COL.cream);

    // ── Blessing Score (big) ──────────────────────────────────────────────
    G.art.centeredText(ctx, 'Blessing Score', G.W / 2 - 80, 138, 20, G.COL.cream);
    G.art.centeredText(ctx, '' + this._runTotal, G.W / 2 - 80, 186, 52, G.COL.gold);

    // Best score
    var bestLabel = 'Best: ' + this._best.score;
    if (this._runTotal > this._best.score) bestLabel += '  ← New Best!';
    G.art.centeredText(ctx, bestLabel, G.W / 2 - 80, 222, 18, G.COL.marigold);

    // ── Per-level stars ───────────────────────────────────────────────────
    var levelLabels = { level1: 'Modak Mischief', level2: 'The Race', level3: 'Visarjan Walk' };
    var lyStart = 268;
    G.LEVEL_ORDER.forEach(function (lvl, idx) {
      var sc  = G.run.levelScores[lvl] || 0;
      var st  = G.run.levelStars[lvl]  || 0;
      var bst = (this._best.stars[lvl] || 0);
      var label  = levelLabels[lvl] || lvl;
      var stars  = '';
      for (var i = 0; i < 3; i++) stars += (i < st ? '★' : '☆');
      var bestStr = 'best ' + bst + '★';

      G.art.centeredText(ctx,
        label + '   ' + stars + '   ' + sc + ' pts   (' + bestStr + ')',
        G.W / 2 - 80, lyStart + idx * 36, 20, G.COL.cream);
    }, this);

    // ── Buttons (rects built in init; drawn here each frame) ──────────────
    var btnY   = G.H - 100;

    // Play Again
    G.ui.drawButton(ctx, '▶ Play Again', 220, btnY, 220, 54, {
      color: G.COL.saffron, textColor: G.COL.white, fontSize: 22
    });

    // Replay buttons — one per level in LEVEL_ORDER
    var rxStart = 480;
    var rxStep  = 200;
    var shortLabels = { level1: 'Level 1', level2: 'Level 2', level3: 'Level 3' };
    G.LEVEL_ORDER.forEach(function (lvl, idx) {
      var short = shortLabels[lvl] || lvl;
      var rx = rxStart + idx * rxStep;
      G.ui.drawButton(ctx, '↺ ' + short, rx, btnY, 170, 54, {
        color: G.COL.teal, textColor: G.COL.white, fontSize: 20
      });
    });

    // Mute toggle — label refreshes each frame (mute state can change)
    var muteLabel = G.audio.isMuted() ? '🔇 Unmute' : '🔊 Mute';
    G.ui.drawButton(ctx, muteLabel, G.W - 80, 36, 130, 44, {
      color: 'rgba(0,0,0,0.5)', textColor: G.COL.cream, fontSize: 18, radius: 10
    });

    // ── Bottom note ───────────────────────────────────────────────────────
    G.art.centeredText(ctx,
      'Ganpati Bappa Morya!',
      G.W / 2 - 80, G.H - 26, 18, G.COL.marigold);
  },

};
