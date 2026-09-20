// js/ui.js — HUD helpers, buttons, fade overlay, shared UI utilities
// M0: drawFade
// M2: toLogical, drawButton, isButtonHit, drawSlideText

'use strict';

G.ui = (function () {

  // ── Fade overlay ──────────────────────────────────────────────────────
  // Draw a full-canvas black rect at alpha 0-1.
  // Called by sceneManager for fade-in / fade-out transitions.
  function drawFade(ctx, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, G.W, G.H);
    ctx.restore();
  }

  // ── toLogical: convert a DOM mouse/touch event to logical canvas coords
  // All scenes call this instead of duplicating the math.
  function toLogical(e) {
    var rect   = G.canvas.getBoundingClientRect();
    var scaleX = G.W / rect.width;
    var scaleY = G.H / rect.height;
    var src    = (e.touches && e.touches[0]) ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }

  // ── drawButton: draw a filled rounded-rect button with centred label.
  // Returns the hit-rect { x, y, w, h } so callers can do hit tests.
  // opts = { color, textColor, fontSize, radius }
  function drawButton(ctx, label, cx, cy, w, h, opts) {
    opts = opts || {};
    var r    = opts.radius    || 12;
    var bg   = opts.color     || G.COL.saffron;
    var fg   = opts.textColor || G.COL.white;
    var fs   = opts.fontSize  || 22;
    var x    = cx - w / 2;
    var y    = cy - h / 2;
    G.art.roundRect(ctx, x, y, w, h, r, bg);
    G.art.centeredText(ctx, label, cx, cy, fs, fg);
    return { x: x, y: y, w: w, h: h };
  }

  // ── isButtonHit: returns true if logical point (px,py) is inside rect
  function isButtonHit(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  }

  // ── drawSlideText: draw up to 2 lines of text with a semi-transparent
  // panel behind them, centered on (cx, cy).  Used by story slides.
  function drawSlideText(ctx, lines, cx, cy, alpha) {
    var lineH  = 42;
    var padX   = 60;
    var padY   = 20;
    var maxW   = 0;
    ctx.font = 'bold 28px -apple-system,"Segoe UI",system-ui,sans-serif';
    lines.forEach(function (l) {
      var m = ctx.measureText(l).width;
      if (m > maxW) maxW = m;
    });
    var boxW = maxW + padX * 2;
    var boxH = lines.length * lineH + padY * 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    // Panel
    ctx.fillStyle = 'rgba(20,8,0,0.55)';
    G.art.roundRect(ctx, cx - boxW/2, cy - boxH/2, boxW, boxH, 14, 'rgba(20,8,0,0.55)');
    // Lines
    lines.forEach(function (l, i) {
      G.art.centeredText(ctx, l, cx, cy - (lines.length - 1) * lineH / 2 + i * lineH, 28, G.COL.cream);
    });
    ctx.restore();
  }

  return {
    drawFade:     drawFade,
    toLogical:    toLogical,
    drawButton:   drawButton,
    isButtonHit:  isButtonHit,
    drawSlideText:drawSlideText,
  };

})();
