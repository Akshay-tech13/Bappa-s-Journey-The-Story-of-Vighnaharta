// js/ui.js — HUD helpers, fade overlay, buttons
// M0 stub: only the fade-overlay draw function.
// More UI helpers are added in M2+.

'use strict';

G.ui = (function () {

  // Draw a full-canvas black rectangle at alpha 0-1.
  // Used by sceneManager for fade-in / fade-out transitions.
  function drawFade(ctx, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.restore();
  }

  return {
    drawFade: drawFade,
  };

})();
