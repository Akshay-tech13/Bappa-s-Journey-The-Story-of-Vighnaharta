// js/scenes/level3.js — Level 3: Visarjan Walk (M5)
// Top-down night walk along a festival path. Walk to the river.
// Collect flower petals for points. Light diyas by proximity or Blessing.
// No fail state. Stars based on % diyas lit.
'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
var L3_WORLD_W    = 3200;   // logical world width (camera scrolls horizontally)
var L3_WORLD_H    = G.H;    // same as canvas height
var L3_DIYA_COUNT = 14;     // total diyas along the path
var L3_PETAL_COUNT= 18;     // collectible petals
var L3_LIGHT_R    = 55;     // proximity radius to auto-light a diya (px)
var L3_BLESS_R    = 130;    // radius for Blessing glow (px)
var L3_BLESS_CD   = 2.0;    // Blessing cooldown seconds
var L3_RIVER_X    = 3050;   // world X where the river starts
var L3_PATH_Y     = G.H / 2;// centre Y of the walking path
var L3_PATH_H     = 220;    // path height (walkable strip)

// ── Scene object ─────────────────────────────────────────────────────────────
G.scenes['level3'] = {

  // ── init ──────────────────────────────────────────────────────────────────
  init: function () {
    var i;

    // Player
    this.px        = 120;          // world X
    this.py        = L3_PATH_Y;    // world Y (stays near centre path)
    this.playerDir = 1;
    this.t         = 0;            // elapsed time
    this.blessCd   = 0;
    this.blessAnim = 0;            // glow ring timer
    this.ignoreUntil = performance.now() + 400;

    // Diyas: placed along the path at irregular intervals
    this.diyas = [];
    for (i = 0; i < L3_DIYA_COUNT; i++) {
      var wx = 280 + i * ((L3_RIVER_X - 400) / (L3_DIYA_COUNT - 1));
      var wy = L3_PATH_Y + (((i % 3) - 1) * 60);
      this.diyas.push({ x: wx, y: wy, lit: false });
    }

    // Petals: scattered along the path
    this.petals = [];
    for (i = 0; i < L3_PETAL_COUNT; i++) {
      var px2 = 180 + i * ((L3_RIVER_X - 300) / (L3_PETAL_COUNT - 1));
      var py2 = L3_PATH_Y + (Math.sin(i * 1.3) * 70);
      this.petals.push({ x: px2, y: py2, collected: false });
    }

    // Devotees: simple walking silhouettes at fixed world positions, walk in place
    this.devotees = [
      { x: 350,  y: L3_PATH_Y - 50, col: '#8B1A1A', phase: 0   },
      { x: 600,  y: L3_PATH_Y + 40, col: '#4A7C59', phase: 1.2 },
      { x: 950,  y: L3_PATH_Y - 30, col: '#F26B38', phase: 0.6 },
      { x: 1250, y: L3_PATH_Y + 55, col: '#8B1A1A', phase: 2.1 },
      { x: 1550, y: L3_PATH_Y - 45, col: '#4A7C59', phase: 0.3 },
      { x: 1850, y: L3_PATH_Y + 30, col: '#F26B38', phase: 1.8 },
      { x: 2150, y: L3_PATH_Y - 20, col: '#8B1A1A', phase: 0.9 },
      { x: 2450, y: L3_PATH_Y + 50, col: '#4A7C59', phase: 1.5 },
      { x: 2750, y: L3_PATH_Y - 35, col: '#F26B38', phase: 0.4 },
    ];

    // Scoring
    this.petalsCollected = 0;
    this.dyasLit         = 0;
    this.points          = 0;

    // Phase: 'walk' | 'river' | 'result'
    this.phase     = 'walk';
    this.riverT    = 0;    // timer for river ending sequence
    this.chantAlpha= 0;    // fade-in for chant text
    this.resultBtn = null;

    // Camera
    this.camX = 0;

    // Attach input
    this._onTap = null;
    this._attachInput();

    // Start dhol loop
    if (G.audio.startDhol) G.audio.startDhol();
  },

  // ── destroy ───────────────────────────────────────────────────────────────
  destroy: function () {
    if (this._onTap) {
      G.canvas.removeEventListener('click',      this._onTap);
      G.canvas.removeEventListener('touchstart', this._onTap);
      this._onTap = null;
    }
    if (G.audio.stopDhol) G.audio.stopDhol();
  },

  // ── _attachInput ──────────────────────────────────────────────────────────
  _attachInput: function () {
    var self = this;
    this._onTap = function (e) {
      if (performance.now() < self.ignoreUntil) return;
      e.preventDefault();
      var pt = G.ui.toLogical(e);
      if (self.phase === 'result' && self.resultBtn) {
        if (G.ui.isButtonHit(pt.x, pt.y, self.resultBtn)) {
          self._finish();
        }
      }
    };
    G.canvas.addEventListener('click',      this._onTap);
    G.canvas.addEventListener('touchstart', this._onTap, { passive: false });
  },

  // ── update ────────────────────────────────────────────────────────────────
  update: function (dt) {
    this.t += dt;

    if (this.phase === 'walk') {
      this._updateWalk(dt);
    } else if (this.phase === 'river') {
      this._updateRiver(dt);
    }
    // 'result' phase: no game logic
  },

  _updateWalk: function (dt) {
    var inp = G.input.state;
    var i;

    // ── Movement ───────────────────────────────────────────────────────
    var mvx = inp.move.x;
    var mvy = inp.move.y;

    if (mvx !== 0 || mvy !== 0) {
      this.px += mvx * G.PLAYER_SPEED * dt;
      this.py += mvy * G.PLAYER_SPEED * dt;
      if (mvx !== 0) this.playerDir = mvx > 0 ? 1 : -1;
    }

    // Clamp player to path strip
    this.px = Math.max(60, Math.min(L3_RIVER_X + 80, this.px));
    this.py = Math.max(L3_PATH_Y - L3_PATH_H / 2 + 30,
              Math.min(L3_PATH_Y + L3_PATH_H / 2 - 30, this.py));

    // ── Blessing ───────────────────────────────────────────────────────
    this.blessCd = Math.max(0, this.blessCd - dt);
    if ((inp.actionPressed || inp.actionHeld) && this.blessCd <= 0) {
      this.blessCd   = L3_BLESS_CD;
      this.blessAnim = 0.6;  // seconds of ring anim
      G.audio.blessingShimmer();
      // Light diyas in blessing radius
      for (i = 0; i < this.diyas.length; i++) {
        var d = this.diyas[i];
        if (!d.lit) {
          var dx2 = d.x - this.px;
          var dy2 = d.y - this.py;
          if (Math.sqrt(dx2*dx2 + dy2*dy2) <= L3_BLESS_R) {
            d.lit = true;
            this.dyasLit++;
            G.audio.chime();
          }
        }
      }
    }
    if (this.blessAnim > 0) this.blessAnim -= dt;

    // ── Proximity diya lighting ────────────────────────────────────────
    for (i = 0; i < this.diyas.length; i++) {
      var diya = this.diyas[i];
      if (!diya.lit) {
        var ddx = diya.x - this.px;
        var ddy = diya.y - this.py;
        if (Math.sqrt(ddx*ddx + ddy*ddy) <= L3_LIGHT_R) {
          diya.lit = true;
          this.dyasLit++;
          G.audio.chime();
        }
      }
    }

    // ── Petal collection ───────────────────────────────────────────────
    for (i = 0; i < this.petals.length; i++) {
      var pet = this.petals[i];
      if (!pet.collected) {
        var pdx = pet.x - this.px;
        var pdy = pet.y - this.py;
        if (Math.sqrt(pdx*pdx + pdy*pdy) <= 30) {
          pet.collected = true;
          this.petalsCollected++;
          this.points += G.SCORE.modakPts;
          G.audio.chime();
        }
      }
    }

    // ── Camera follow ──────────────────────────────────────────────────
    var targetCam = this.px - G.W / 3;
    targetCam = Math.max(0, Math.min(L3_WORLD_W - G.W, targetCam));
    this.camX += (targetCam - this.camX) * Math.min(1, dt * 6);

    // ── Reach river ────────────────────────────────────────────────────
    if (this.px >= L3_RIVER_X) {
      this.phase   = 'river';
      this.riverT  = 0;
      G.audio.levelComplete();
    }
  },

  _updateRiver: function (dt) {
    this.riverT   += dt;
    this.chantAlpha = Math.min(1, this.riverT / 2.0);

    // After 4 s of river scene, show result
    if (this.riverT >= 4.5 && this.phase !== 'result') {
      this._showResult();
    }
  },

  _showResult: function () {
    this.phase = 'result';

    // Calculate stars
    var pct   = L3_DIYA_COUNT > 0 ? this.dyasLit / L3_DIYA_COUNT : 0;
    var stars = 1;
    if      (pct >= G.SCORE.l3Stars[0]) stars = 3;
    else if (pct >= G.SCORE.l3Stars[1]) stars = 2;

    var pts = this.points + stars * G.SCORE.starPts;

    // Save to run state
    G.run.levelScores['level3'] = pts;
    G.run.levelStars ['level3'] = stars;
    G.run.blessingScore = (G.run.blessingScore || 0) + pts;

    this._stars  = stars;
    this._pts    = pts;
    this._pct    = pct;
  },

  _finish: function () {
    // Find next scene in LEVEL_ORDER after level3
    var order = G.LEVEL_ORDER;
    var idx   = order.indexOf('level3');
    var next  = (idx >= 0 && idx < order.length - 1) ? order[idx + 1] : 'recap';
    G.sceneManager.goto(next);
  },

  // ── draw ──────────────────────────────────────────────────────────────────
  draw: function (ctx) {
    if (this.phase === 'river' || this.phase === 'result') {
      this._drawRiverScene(ctx);
    } else {
      this._drawWalkScene(ctx);
    }
    if (this.phase === 'result') {
      this._drawResult(ctx);
    }
  },

  // ── _drawWalkScene ────────────────────────────────────────────────────────
  _drawWalkScene: function (ctx) {
    var i;
    ctx.save();
    ctx.translate(-this.camX, 0);

    // ── Night sky background ───────────────────────────────────────────
    ctx.fillStyle = G.COL.indigo;
    ctx.fillRect(0, 0, L3_WORLD_W, G.H);

    // Stars in sky (top portion)
    this._drawNightStars(ctx);

    // ── Path (ground strip) ────────────────────────────────────────────
    // Dirt/cobblestone path
    ctx.fillStyle = '#2E2060';
    ctx.fillRect(0, L3_PATH_Y - L3_PATH_H / 2, L3_WORLD_W, L3_PATH_H);
    // Path edge highlights
    ctx.strokeStyle = '#F5A62340';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, L3_PATH_Y - L3_PATH_H / 2);
    ctx.lineTo(L3_WORLD_W, L3_PATH_Y - L3_PATH_H / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, L3_PATH_Y + L3_PATH_H / 2);
    ctx.lineTo(L3_WORLD_W, L3_PATH_Y + L3_PATH_H / 2);
    ctx.stroke();

    // ── Marigold garland decorations along path edges ──────────────────
    for (i = 0; i < 20; i++) {
      var gx = i * 160 + 80;
      // Top garland swag
      this._drawGarland(ctx, gx, L3_PATH_Y - L3_PATH_H / 2 - 8);
      // Bottom garland swag
      this._drawGarland(ctx, gx, L3_PATH_Y + L3_PATH_H / 2 + 8);
    }

    // ── Diyas ──────────────────────────────────────────────────────────
    for (i = 0; i < this.diyas.length; i++) {
      G.art.drawDiya(ctx, this.diyas[i].x, this.diyas[i].y, this.diyas[i].lit, this.t);
    }

    // ── Petals ────────────────────────────────────────────────────────
    for (i = 0; i < this.petals.length; i++) {
      if (!this.petals[i].collected) {
        G.art.drawPetal(ctx, this.petals[i].x, this.petals[i].y, this.t);
      }
    }

    // ── Devotees ──────────────────────────────────────────────────────
    for (i = 0; i < this.devotees.length; i++) {
      var dev = this.devotees[i];
      G.art.drawDevotee(ctx, dev.x, dev.y, this.t, {
        color: dev.col, phase: dev.phase, handsUp: false
      });
    }

    // ── Blessing glow ring ────────────────────────────────────────────
    if (this.blessAnim > 0) {
      var ringAlpha = this.blessAnim / 0.6;
      var ringR     = (1 - ringAlpha) * L3_BLESS_R + 20;
      var grd = ctx.createRadialGradient(this.px, this.py, ringR * 0.5, this.px, this.py, ringR);
      grd.addColorStop(0, 'rgba(255,210,80,' + (ringAlpha * 0.45) + ')');
      grd.addColorStop(1, 'rgba(255,210,80,0)');
      ctx.beginPath();
      ctx.arc(this.px, this.py, ringR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // ── Ganesha (player) ──────────────────────────────────────────────
    var moving = (G.input.state.move.x !== 0 || G.input.state.move.y !== 0);
    G.art.drawGanesha(ctx, this.px, this.py, this.t, {
      state: moving ? 'walk' : 'idle',
      dir:   this.playerDir,
    });

    // ── River entrance hint (glow at far end) ─────────────────────────
    var hintAlpha = 0.3 + Math.sin(this.t * 2) * 0.2;
    var hgrd = ctx.createRadialGradient(L3_RIVER_X, L3_PATH_Y, 10, L3_RIVER_X, L3_PATH_Y, 120);
    hgrd.addColorStop(0, 'rgba(42,171,184,' + hintAlpha + ')');
    hgrd.addColorStop(1, 'rgba(42,171,184,0)');
    ctx.beginPath();
    ctx.arc(L3_RIVER_X, L3_PATH_Y, 120, 0, Math.PI * 2);
    ctx.fillStyle = hgrd;
    ctx.fill();

    ctx.restore();  // end camera transform

    // ── HUD (fixed — not scrolled) ────────────────────────────────────
    this._drawHUD(ctx);
  },

  // ── _drawNightStars ───────────────────────────────────────────────────────
  _drawNightStars: function (ctx) {
    // Pre-seeded star positions so they're consistent
    var stars = [
      [80,30],[210,55],[400,25],[560,45],[750,20],[920,60],[1100,35],
      [1300,50],[1500,28],[1700,48],[1900,32],[2100,58],[2300,22],[2500,44],
      [2700,36],[2900,52],[3100,28],[180,65],[620,38],[1040,62],[1460,24],
      [1880,56],[2300,40],[2720,68],[80,78],[450,88],[820,72],[1200,84],
      [1580,76],[1960,90],[2340,70],[2680,82]
    ];
    ctx.fillStyle = 'rgba(255,255,220,0.75)';
    for (var i = 0; i < stars.length; i++) {
      var r = (i % 3 === 0) ? 2 : 1.2;
      ctx.beginPath();
      ctx.arc(stars[i][0], stars[i][1], r, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ── _drawGarland ─────────────────────────────────────────────────────────
  _drawGarland: function (ctx, cx, cy) {
    // Small marigold cluster on the garland line — simple + cheap
    ctx.beginPath();
    ctx.arc(cx,     cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = G.COL.marigold;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 12, cy + 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = G.COL.saffron;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 12, cy + 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = G.COL.marigold;
    ctx.fill();
    // String between clusters
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy);
    ctx.quadraticCurveTo(cx, cy + 14, cx + 80, cy);
    ctx.strokeStyle = '#5A3A10';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },

  // ── _drawHUD ──────────────────────────────────────────────────────────────
  _drawHUD: function (ctx) {
    var A = G.art;
    // Diya counter
    A.centeredText(ctx,
      '🪔 ' + this.dyasLit + ' / ' + L3_DIYA_COUNT,
      110, 34, G.HUD_FONT_SIZE, G.COL.marigold);
    // Petal counter
    A.centeredText(ctx,
      '🌸 ' + this.petalsCollected,
      110, 62, G.HUD_FONT_SIZE - 2, G.COL.cream);

    // Blessing cooldown
    var cd = Math.max(0, this.blessCd);
    var cdPct = 1 - cd / L3_BLESS_CD;
    ctx.save();
    ctx.strokeStyle = G.COL.gold;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(G.W - 40, 40, 18, -Math.PI / 2, -Math.PI / 2 + cdPct * Math.PI * 2);
    ctx.stroke();
    A.centeredText(ctx, '✨', G.W - 40, 40, 18, G.COL.gold);
    ctx.restore();

    // Progress arrow (show how far to the river)
    var prog = Math.min(1, this.px / L3_RIVER_X);
    var barW = 200;
    var barX = G.W / 2 - barW / 2;
    G.art.roundRect(ctx, barX, 12, barW, 12, 6, 'rgba(255,255,255,0.15)');
    G.art.roundRect(ctx, barX, 12, barW * prog, 12, 6, G.COL.teal);
    A.centeredText(ctx, '🏞️', barX + barW * prog, 12, 14, G.COL.white);
  },

  // ── _drawRiverScene ───────────────────────────────────────────────────────
  _drawRiverScene: function (ctx) {
    var i;
    // Draw the walk scene one last time with camera near river
    this.camX = Math.max(0, Math.min(L3_WORLD_W - G.W, L3_RIVER_X - G.W / 2));

    ctx.save();
    ctx.translate(-this.camX, 0);

    // Night sky
    ctx.fillStyle = G.COL.indigo;
    ctx.fillRect(0, 0, L3_WORLD_W, G.H);
    this._drawNightStars(ctx);

    // Path
    ctx.fillStyle = '#2E2060';
    ctx.fillRect(0, L3_PATH_Y - L3_PATH_H / 2, L3_WORLD_W, L3_PATH_H);

    // ── River ─────────────────────────────────────────────────────────
    // River body (teal, gradient)
    var riverGrd = ctx.createLinearGradient(L3_RIVER_X, 0, L3_WORLD_W, 0);
    riverGrd.addColorStop(0, '#1A6070');
    riverGrd.addColorStop(1, '#0A3040');
    ctx.fillStyle = riverGrd;
    ctx.fillRect(L3_RIVER_X, 0, L3_WORLD_W - L3_RIVER_X, G.H);

    // Golden ripples on the river
    for (i = 0; i < 6; i++) {
      var rRippleX = L3_RIVER_X + 60 + i * 90;
      var rRippleY = 200 + i * 70 + Math.sin(this.t * 1.5 + i) * 12;
      var rAlpha   = 0.25 + Math.sin(this.t * 2 + i * 0.8) * 0.15;
      ctx.beginPath();
      ctx.ellipse(rRippleX, rRippleY, 40 + i * 10, 8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,215,0,' + rAlpha + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Floating diyas on river
    for (i = 0; i < 5; i++) {
      var fdx = L3_RIVER_X + 50 + i * 80 + Math.sin(this.t * 0.8 + i * 1.3) * 20;
      var fdy = 150 + i * 90 + Math.sin(this.t * 1.2 + i) * 15;
      G.art.drawDiya(ctx, fdx, fdy, true, this.t);
    }

    // Diyas still on path (lit)
    for (i = 0; i < this.diyas.length; i++) {
      G.art.drawDiya(ctx, this.diyas[i].x, this.diyas[i].y, this.diyas[i].lit, this.t);
    }

    // Devotees (handsUp in celebration)
    for (i = 0; i < this.devotees.length; i++) {
      var dev = this.devotees[i];
      G.art.drawDevotee(ctx, dev.x, dev.y, this.t, {
        color: dev.col, phase: dev.phase, handsUp: true
      });
    }

    // Ganesha at river edge, celebrating
    G.art.drawGanesha(ctx, L3_RIVER_X - 50, L3_PATH_Y, this.t, {
      state: 'celebrate', dir: 1,
    });

    ctx.restore();  // end camera transform

    // ── Chant text (fades in) ──────────────────────────────────────────
    if (this.chantAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.chantAlpha);

      // Dark panel
      G.art.roundRect(ctx,
        G.W / 2 - 360, G.H / 2 - 70, 720, 140,
        16, 'rgba(10,20,40,0.78)');

      // Eco note
      G.art.centeredText(ctx,
        'Natural clay returns to the river, until next year.',
        G.W / 2, G.H / 2 - 28, 22, G.COL.cream);

      // Chant
      G.art.centeredText(ctx,
        'Ganpati Bappa Morya!',
        G.W / 2, G.H / 2 + 12, 28, G.COL.marigold);
      G.art.centeredText(ctx,
        'Pudhchya Varshi Lavkar Ya!',
        G.W / 2, G.H / 2 + 46, 24, G.COL.gold);

      ctx.restore();
    }
  },

  // ── _drawResult ───────────────────────────────────────────────────────────
  _drawResult: function (ctx) {
    var i;
    // Semi-transparent panel
    G.art.roundRect(ctx,
      G.W / 2 - 300, G.H / 2 - 160, 600, 320,
      20, 'rgba(10,20,40,0.88)');

    G.art.centeredText(ctx, 'Visarjan Complete!', G.W/2, G.H/2 - 120, 30, G.COL.marigold);

    // Stars
    var sx = G.W / 2 - 42;
    for (i = 0; i < 3; i++) {
      var filled = (i < this._stars);
      G.art.centeredText(ctx, filled ? '★' : '☆',
        sx + i * 42, G.H / 2 - 74, 38,
        filled ? G.COL.gold : 'rgba(255,255,255,0.3)');
    }

    // Stats
    var pctText = Math.round((this._pct || 0) * 100) + '% diyas lit';
    G.art.centeredText(ctx, pctText,             G.W/2, G.H/2 - 20, 22, G.COL.cream);
    G.art.centeredText(ctx, 'Petals: ' + this.petalsCollected, G.W/2, G.H/2 + 16, 22, G.COL.cream);
    G.art.centeredText(ctx, 'Points: ' + this._pts,            G.W/2, G.H/2 + 50, 26, G.COL.gold);

    // Next button
    this.resultBtn = G.ui.drawButton(ctx, 'Next ▶', G.W/2, G.H/2 + 112, 200, 56, {
      color: G.COL.teal, textColor: G.COL.white, fontSize: 26
    });
  },

};
