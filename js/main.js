// js/main.js — game loop, scene manager, responsive canvas
// This file runs last (loaded last in index.html).

'use strict';

(function () {

  // ── Canvas setup ──────────────────────────────────────────────────────
  var canvas = document.getElementById('gameCanvas');
  var ctx    = canvas.getContext('2d');

  G.canvas = canvas;
  G.ctx    = ctx;

  // Resize canvas to fill screen while keeping 16:9 and accounting for DPR.
  function resize() {
    var dpr   = window.devicePixelRatio || 1;
    var scale = Math.min(window.innerWidth / G.W, window.innerHeight / G.H);

    // Physical pixel size
    canvas.width  = Math.round(G.W * scale * dpr);
    canvas.height = Math.round(G.H * scale * dpr);

    // CSS display size (letterboxed)
    canvas.style.width  = Math.round(G.W * scale) + 'px';
    canvas.style.height = Math.round(G.H * scale) + 'px';

    // Scale context so we always draw at logical 1280×720
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // ── Scene manager ─────────────────────────────────────────────────────
  // Each scene is a plain object: { init(), update(dt), draw(ctx) }
  // G.scenes is created in config.js so scene files can register before this runs.

  var currentScene  = null;
  var currentName   = '';
  var pendingName   = null;

  // Fade state: 'none', 'out', 'in'
  var fadeState  = 'none';
  var fadeAlpha  = 0;       // 0 = transparent, 1 = fully black
  var fadeTimer  = 0;
  var FADE_SECS  = G.FADE_MS / 1000;

  G.sceneManager = {
    // Switch to a named scene with a fade transition.
    goto: function (name) {
      if (pendingName !== null) return;   // already transitioning
      pendingName = name;
      fadeState   = 'out';
      fadeTimer   = 0;
      fadeAlpha   = 0;
    },
    // Jump to a scene instantly with no fade (useful for game-over resets).
    jumpTo: function (name) {
      var scene = G.scenes[name];
      if (!scene) { console.warn('Scene not found:', name); return; }
      currentScene = scene;
      currentName  = name;
      if (scene.init) scene.init();
    },
    current: function () { return currentName; },
  };

  // ── Score / persistent state ──────────────────────────────────────────
  // Shared score bucket reset at the start of each full run.
  G.run = {
    levelScores:  {},   // { level1: 300, level3: 450, … }
    levelStars:   {},   // { level1: 3, … }
    blessingScore: 0,
    returnTo:     null, // if set, level "Next" returns here instead of following LEVEL_ORDER
  };

  G.resetRun = function () {
    G.run.levelScores   = {};
    G.run.levelStars    = {};
    G.run.blessingScore = 0;
    G.run.returnTo      = null;
  };

  // Safe localStorage helpers
  G.storage = {
    get: function (key, def) {
      try { var v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
      catch (e) { return def; }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    },
  };

  // ── Camera shake ──────────────────────────────────────────────────────
  // G.shake(magnitude) — scenes call this; the draw loop applies the offset.
  var _shakeMag   = 0;   // current shake magnitude (px)
  var _shakeDecay = 12;  // how fast shake decays per second

  G.shake = function (mag) {
    _shakeMag = Math.max(_shakeMag, mag);  // don't reduce an existing shake
  };

  // ── Game loop ─────────────────────────────────────────────────────────
  var lastTime = 0;
  var MAX_DT   = 0.05;  // cap delta time at 50 ms to avoid spiral-of-death

  function loop(timestamp) {
    requestAnimationFrame(loop);

    var dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;

    // Decay shake
    _shakeMag = Math.max(0, _shakeMag - _shakeDecay * dt);

    // Update input first
    G.input.update();

    // ── Fade transition logic ─────────────────────────────────────────
    if (fadeState === 'out') {
      fadeTimer += dt;
      fadeAlpha  = fadeTimer / FADE_SECS;
      if (fadeAlpha >= 1) {
        fadeAlpha = 1;
        // Call destroy on outgoing scene before switching
        if (currentScene && currentScene.destroy) currentScene.destroy();
        // Switch scene at the black frame
        var next = G.scenes[pendingName];
        if (next) {
          currentScene = next;
          currentName  = pendingName;
          if (next.init) next.init();
        } else {
          console.warn('Scene not found:', pendingName);
        }
        pendingName = null;
        fadeState   = 'in';
        fadeTimer   = 0;
      }
    } else if (fadeState === 'in') {
      fadeTimer += dt;
      fadeAlpha  = 1 - fadeTimer / FADE_SECS;
      if (fadeAlpha <= 0) {
        fadeAlpha = 0;
        fadeState = 'none';
      }
    }

    // ── Update current scene ──────────────────────────────────────────
    if (currentScene && currentScene.update) {
      currentScene.update(dt);
    }

    // ── Draw current scene ────────────────────────────────────────────
    ctx.save();
    // Apply camera shake as a small random translate
    if (_shakeMag > 0.5) {
      var sx = (Math.random() * 2 - 1) * _shakeMag;
      var sy = (Math.random() * 2 - 1) * _shakeMag;
      ctx.translate(sx, sy);
    }
    if (currentScene && currentScene.draw) {
      currentScene.draw(ctx);
    } else {
      G.art.clearBg(ctx, G.COL.darkBg);
    }

    // Draw fade overlay on top of the scene
    if (fadeAlpha > 0) {
      G.ui.drawFade(ctx, fadeAlpha);
    }
    ctx.restore();
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  // ?debug=art        → art gallery
  // ?debug=test       → M0 test circle
  // ?debug=recap&slide=N (N=1-4) → jump straight to recap slide N
  // (default)         → real title screen
  // ── ?debug=audio scene ────────────────────────────────────────────────
  G.scenes['audioDebug'] = {
    init: function () {
      // nothing — the draw loop renders the UI
    },
    update: function () {},
    draw: function (ctx) {
      G.art.clearBg(ctx, '#1A0E05');
      ctx.fillStyle = '#FFD700';
      ctx.font      = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Audio Debug — ?debug=audio', G.W / 2, 50);
      ctx.font      = '18px sans-serif';
      ctx.fillStyle = '#FFF8E7';
      var moods = ['title','story','level1','level2','level3','recap','end','stop'];
      var bw = 140, bh = 48, gap = 16;
      var cols = 4;
      var startX = G.W / 2 - (cols * (bw + gap)) / 2 + bw / 2;
      for (var i = 0; i < moods.length; i++) {
        var col = i % cols, row = Math.floor(i / cols);
        var bx = startX + col * (bw + gap);
        var by = 110 + row * (bh + gap);
        ctx.fillStyle = '#3B2010';
        ctx.beginPath();
        ctx.roundRect(bx - bw/2, by, bw, bh, 8);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(moods[i], bx, by + bh * 0.65);
      }
      // collectPop row
      ctx.fillStyle = '#FFF8E7';
      ctx.fillText('collectPop (click 1-5):', G.W / 2, 300);
      for (var n = 1; n <= 5; n++) {
        var px = G.W / 2 - 250 + (n - 1) * 120;
        ctx.fillStyle = '#1A3B10';
        ctx.beginPath();
        ctx.roundRect(px - 44, 316, 88, 44, 8);
        ctx.fill();
        ctx.fillStyle = '#A8F080';
        ctx.fillText('n=' + n, px, 344);
      }
      ctx.textAlign = 'left';
    },
    _onClick: function (e) {
      G.audio.unlock();
      var p = G.ui.toLogical(e);
      // Mood buttons
      var moods = ['title','story','level1','level2','level3','recap','end','stop'];
      var bw = 140, bh = 48, gap = 16;
      var cols = 4;
      var startX = G.W / 2 - (cols * (bw + gap)) / 2 + bw / 2;
      for (var i = 0; i < moods.length; i++) {
        var col = i % cols, row = Math.floor(i / cols);
        var bx = startX + col * (bw + gap);
        var by = 110 + row * (bh + gap);
        if (p.x > bx - bw/2 && p.x < bx + bw/2 && p.y > by && p.y < by + bh) {
          if (moods[i] === 'stop') { if (G.Music) G.Music.stop(); }
          else                     { if (G.Music) G.Music.play(moods[i]); }
          return;
        }
      }
      // collectPop buttons
      for (var n = 1; n <= 5; n++) {
        var px = G.W / 2 - 250 + (n - 1) * 120;
        if (p.x > px - 44 && p.x < px + 44 && p.y > 316 && p.y < 360) {
          if (G.Music) G.Music.collectPop(n);
          return;
        }
      }
    },
    _handler: null,
    destroy: function () {
      if (this._handler) {
        G.canvas.removeEventListener('click', this._handler);
        G.canvas.removeEventListener('touchstart', this._handler);
        this._handler = null;
      }
    },
  };
  // Attach click on artGallery-style lazy init
  var _origAudioDebugInit = G.scenes['audioDebug'].init;
  G.scenes['audioDebug'].init = function () {
    _origAudioDebugInit.call(this);
    var self = this;
    this._handler = function (e) { self._onClick(e); };
    G.canvas.addEventListener('click',      this._handler);
    G.canvas.addEventListener('touchstart', this._handler, { passive: false });
  };

  window.addEventListener('load', function () {
    lastTime = performance.now();
    requestAnimationFrame(loop);
    var params = new URLSearchParams(window.location.search);
    var dbg    = params.get('debug');
    if      (dbg === 'art')    { G.sceneManager.goto('artGallery'); }
    else if (dbg === 'test')   { G.sceneManager.goto('test'); }
    else if (dbg === 'recap')  { G.sceneManager.goto('recap'); }
    else if (dbg === 'level2') { G.sceneManager.goto('level2'); }
    else if (dbg === 'audio')  { G.sceneManager.goto('audioDebug'); }
    else                       { G.sceneManager.goto('title'); }
  });

})();
