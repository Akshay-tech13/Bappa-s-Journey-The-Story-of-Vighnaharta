// js/art.js — all vector drawing helpers for Bappa's Journey
// Scenes never draw shapes directly — they call functions from here.
// M0: stub with background fill and a simple circle (test player).
// More drawing functions are added in M1.

'use strict';

G.art = (function () {

  // Fill the canvas with a solid colour (used by the scene background)
  function clearBg(ctx, color) {
    ctx.fillStyle = color || G.COL.darkBg;
    ctx.fillRect(0, 0, G.W, G.H);
  }

  // Draw a simple filled circle — used as the M0 test player
  function circle(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Draw text centred at (x, y)
  function centeredText(ctx, text, x, y, size, color) {
    ctx.font = 'bold ' + size + 'px -apple-system,"Segoe UI",system-ui,sans-serif';
    ctx.fillStyle = color || G.COL.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  return {
    clearBg:      clearBg,
    circle:       circle,
    centeredText: centeredText,
  };

})();
