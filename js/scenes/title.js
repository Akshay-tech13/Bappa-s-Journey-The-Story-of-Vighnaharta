// js/scenes/title.js — Title screen (M2) + M0 test scene
// M0: registers a 'test' scene with a moveable saffron circle.
// M2: the real 'title' scene will be added here.

'use strict';

// ── M0 Test scene ─────────────────────────────────────────────────────────
// A saffron circle you can move with WASD/arrows or the virtual joystick.
// Press Space / Blessing button to toggle its colour.
// This scene is ONLY active during M0 testing; M2 replaces it with 'title'.
(function () {

  var x      = G.W / 2;
  var y      = G.H / 2;
  var color  = G.COL.saffron;
  var RADIUS = 40;

  var scene = {
    init: function () {
      x = G.W / 2;
      y = G.H / 2;
      color = G.COL.saffron;
    },

    update: function (dt) {
      var inp = G.input.state;
      // Move circle with normalised input vector
      x += inp.move.x * G.PLAYER_SPEED * dt;
      y += inp.move.y * G.PLAYER_SPEED * dt;
      // Clamp inside canvas
      x = Math.max(RADIUS, Math.min(G.W - RADIUS, x));
      y = Math.max(RADIUS, Math.min(G.H - RADIUS, y));
      // Toggle colour on action press
      if (inp.actionPressed) {
        color = (color === G.COL.saffron) ? G.COL.marigold : G.COL.saffron;
        G.audio.blessingShimmer();
      }
    },

    draw: function (ctx) {
      // Dark background
      G.art.clearBg(ctx, G.COL.darkBg);

      // Draw moveable circle
      G.art.circle(ctx, x, y, RADIUS, color);

      // Instructions
      G.art.centeredText(ctx,
        'M0 Test — Move with WASD / joystick  |  Space / Blessing = change colour',
        G.W / 2, 50, 20, G.COL.cream);

      G.art.centeredText(ctx,
        G.GAME_TITLE + ' — ' + G.GAME_SUBTITLE,
        G.W / 2, G.H - 40, 18, G.COL.marigold);

      // Show G.input state for debugging (open DevTools to see it too)
      var inp = G.input.state;
      var dbg = 'move(' + inp.move.x.toFixed(2) + ', ' + inp.move.y.toFixed(2) + ')' +
                '  action:' + inp.actionHeld;
      G.art.centeredText(ctx, dbg, G.W / 2, 80, 16, G.COL.gold);
    },
  };

  G.scenes['test'] = scene;

})();

// ── Title scene stub (filled in M2) ──────────────────────────────────────
G.scenes['title'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.darkBg);
    G.art.centeredText(ctx, G.GAME_TITLE, G.W / 2, G.H / 2 - 30, 48, G.COL.marigold);
    G.art.centeredText(ctx, 'Title scene coming in M2', G.W / 2, G.H / 2 + 30, 22, G.COL.cream);
  },
};
