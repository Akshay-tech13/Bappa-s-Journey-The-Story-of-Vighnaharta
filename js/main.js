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
  // Registered in G.scenes by each scene file.
  G.scenes = {};

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
    levelScores: {},   // { level1: 300, level3: 450, … }
    levelStars:  {},   // { level1: 3, … }
    blessingScore: 0,
  };

  G.resetRun = function () {
    G.run.levelScores  = {};
    G.run.levelStars   = {};
    G.run.blessingScore = 0;
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

  // ── Game loop ─────────────────────────────────────────────────────────
  var lastTime = 0;
  var MAX_DT   = 0.05;  // cap delta time at 50 ms to avoid spiral-of-death

  function loop(timestamp) {
    requestAnimationFrame(loop);

    var dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;

    // Update input first
    G.input.update();

    // ── Fade transition logic ─────────────────────────────────────────
    if (fadeState === 'out') {
      fadeTimer += dt;
      fadeAlpha  = fadeTimer / FADE_SECS;
      if (fadeAlpha >= 1) {
        fadeAlpha = 1;
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
    if (currentScene && currentScene.draw) {
      currentScene.draw(ctx);
    } else {
      // Fallback: dark background while no scene is set
      G.art.clearBg(ctx, G.COL.darkBg);
    }

    // Draw fade overlay on top of the scene
    if (fadeAlpha > 0) {
      G.ui.drawFade(ctx, fadeAlpha);
    }
    ctx.restore();
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  // Check URL for ?debug=art to open the art gallery directly.
  window.addEventListener('load', function () {
    lastTime = performance.now();
    requestAnimationFrame(loop);
    var params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'art') {
      G.sceneManager.goto('artGallery');
    } else {
      G.sceneManager.goto('test');
    }
  });

})();
