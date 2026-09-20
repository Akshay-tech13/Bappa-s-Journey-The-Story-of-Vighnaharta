// js/art.js — all vector drawing helpers for Bappa's Journey
// Every visual element is drawn here with Canvas 2D paths.
// No images, no SVG files — pure procedural art.
//
// Convention:
//   drawFoo(ctx, x, y, t, opts)
//   x,y  = centre-bottom of the character (feet position)
//   t    = elapsed time in seconds (drives idle/walk animation)
//   opts = { state:'idle'|'walk'|'celebrate', dir:1|-1, squash:0, scale:1 }

'use strict';

G.art = (function () {

  var C = G.COL;   // shorthand

  // ── Utility helpers ───────────────────────────────────────────────────

  // Fill the canvas with a solid colour
  function clearBg(ctx, color) {
    ctx.fillStyle = color || C.darkBg;
    ctx.fillRect(0, 0, G.W, G.H);
  }

  // Draw text centred at (x, y)
  function centeredText(ctx, text, x, y, size, color) {
    ctx.font = 'bold ' + size + 'px -apple-system,"Segoe UI",system-ui,sans-serif';
    ctx.fillStyle = color || C.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // Draw a filled circle
  function circle(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Soft oval ground shadow centred at (x,y)
  function ovalShadow(ctx, x, y, rx, ry) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();
    ctx.restore();
  }

  // drawWithTilt: apply a slight Y-skew to simulate 3/4 view,
  // then call drawFn(ctx). Wrap every top-down character with this.
  function drawWithTilt(ctx, x, y, drawFn) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, -0.06, 0, 1, 0, 0);  // subtle horizontal tilt
    drawFn(ctx);
    ctx.restore();
  }

  // ── Shared shape helpers ──────────────────────────────────────────────

  // Filled ellipse at (cx,cy) with radii rx,ry
  function ellipse(ctx, cx, cy, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Stroke outline on the last path (thin, dark-brown)
  function outline(ctx, width) {
    ctx.strokeStyle = 'rgba(60,20,10,0.35)';
    ctx.lineWidth   = width || 1.5;
    ctx.stroke();
  }

  // Rounded rect helper
  function roundRect(ctx, x, y, w, h, r, color) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  GANESHA (Bal Ganesha — young, dignified, cute)             ║
  // ║  x,y = centre-bottom (feet). Base height ~100 px.           ║
  // ╚══════════════════════════════════════════════════════════════╝
  //
  // Layers drawn back→front:
  //   1. Ground shadow
  //   2. Feet / ankles
  //   3. Dhoti (saffron)
  //   4. Belly (round, cream-skin)
  //   5. Body / chest
  //   6. Right arm (modak side)
  //   7. Left arm (blessing side)
  //   8. Neck + head (elephant, big and round)
  //   9. Large ears (left + right)
  //  10. Trunk (curled)
  //  11. Tusk (one small white tusk on right)
  //  12. Eyes + forehead dot
  //  13. Crown (small, jewelled)
  //  14. Modak in right hand

  function drawGanesha(ctx, x, y, t, opts) {
    opts = opts || {};
    var state   = opts.state  || 'idle';
    var dir     = opts.dir    || 1;       // 1=right, -1=left (facing)
    var squash  = opts.squash || 0;       // 0-1 extra squash
    var sc      = (opts.scale || 1) * (1 - squash * 0.08);

    // Idle bob: gentle vertical sine
    var bob = (state === 'idle' || state === 'celebrate')
              ? Math.sin(t * 2.2) * 2.5
              : 0;

    // Walk sway: slight rotation + side bob
    var walkLean = (state === 'walk') ? Math.sin(t * 5) * 0.06 : 0;

    // Celebrate: bigger bob + arms up
    var celebBob = (state === 'celebrate') ? Math.abs(Math.sin(t * 4)) * 6 : 0;

    ovalShadow(ctx, x, y, 28 * sc, 7 * sc);

    ctx.save();
    ctx.translate(x, y + bob - celebBob);
    ctx.scale(dir * sc, sc);
    ctx.rotate(walkLean);

    // ── Feet (two small rounded bumps) ────────────────────────────────
    ellipse(ctx, -10, -4, 9, 5, C.skinLight);
    ellipse(ctx,  10, -4, 9, 5, C.skinLight);

    // ── Dhoti (saffron, dome-shaped) ──────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(0, -22, 22, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.saffron;
    ctx.fill();
    // Dhoti fold lines
    ctx.strokeStyle = 'rgba(180,80,20,0.35)';
    ctx.lineWidth = 1;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -10);
      ctx.lineTo(i * 4, -36);
      ctx.stroke();
    }

    // ── Belly (big round, cream) ───────────────────────────────────────
    ellipse(ctx, 0, -46, 18, 17, C.skinLight);
    // Navel dot
    circle(ctx, 0, -46, 2.5, 'rgba(180,120,80,0.5)');

    // ── Body / chest ──────────────────────────────────────────────────
    ellipse(ctx, 0, -60, 15, 12, C.skinLight);

    // Sacred thread (janeu) — thin diagonal line
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    ctx.lineTo(8, -70);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Arms ──────────────────────────────────────────────────────────
    var armSwing = (state === 'walk') ? Math.sin(t * 5) * 8 : 0;
    var armUp    = (state === 'celebrate') ? -20 : 0;

    // Right arm (holds modak) — forward arm
    ctx.save();
    ctx.translate(16, -60 + armSwing);
    ctx.rotate(0.4 + (state === 'celebrate' ? -0.8 : 0));
    roundRect(ctx, 0, -6, 10, 20, 5, C.skinLight);
    // Hand
    ellipse(ctx, 5, 14, 7, 6, C.skinLight);
    ctx.restore();

    // Left arm (blessing gesture) — raised slightly
    ctx.save();
    ctx.translate(-16, -60 - armSwing + armUp);
    ctx.rotate(-0.3 + (state === 'celebrate' ? 0.8 : 0));
    roundRect(ctx, -10, -6, 10, 20, 5, C.skinLight);
    // Blessing hand — open palm
    ellipse(ctx, -5, 14, 7, 6, C.skinLight);
    // Small fingers (3 lines)
    ctx.strokeStyle = 'rgba(180,120,80,0.4)';
    ctx.lineWidth = 1;
    for (var f = -3; f <= 3; f += 3) {
      ctx.beginPath();
      ctx.moveTo(-5 + f, 12);
      ctx.lineTo(-5 + f, 18);
      ctx.stroke();
    }
    ctx.restore();

    // ── Neck ──────────────────────────────────────────────────────────
    ellipse(ctx, 0, -72, 8, 6, C.skinLight);

    // ── Head (large, round — elephant) ────────────────────────────────
    // Head is the most important feature — big and clearly elephant
    ellipse(ctx, 0, -88, 24, 22, C.skinLight);
    outline(ctx, 1.2);

    // ── Ears (large, flat, fanning out) ───────────────────────────────
    // Right ear
    ctx.beginPath();
    ctx.ellipse(22, -88, 14, 18, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.skinLight;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(22, -88, 9, 12, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#F4C0A0';
    ctx.fill();
    // Left ear
    ctx.beginPath();
    ctx.ellipse(-22, -88, 14, 18, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.skinLight;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-22, -88, 9, 12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#F4C0A0';
    ctx.fill();

    // ── Trunk (curled downward, signature feature) ─────────────────────
    ctx.beginPath();
    ctx.moveTo(4, -76);                        // base of trunk on nose
    ctx.bezierCurveTo(16, -68, 22, -60, 18, -52); // curve out
    ctx.bezierCurveTo(14, -44, 6,  -42,  2, -48); // curl back
    ctx.bezierCurveTo(-2, -54, -2, -58,  4, -56); // tip curl
    ctx.strokeStyle = C.skinLight;
    ctx.lineWidth   = 7;
    ctx.lineCap     = 'round';
    ctx.stroke();
    // Trunk tip (darker)
    circle(ctx, 3, -55, 4, '#D9A882');

    // ── One small tusk (right side, white, curved) ────────────────────
    ctx.beginPath();
    ctx.moveTo(8, -78);
    ctx.quadraticCurveTo(18, -74, 16, -66);
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // ── Eyes (kind, slightly upturned) ────────────────────────────────
    // Left eye
    circle(ctx, -9, -92, 4.5, C.white);
    circle(ctx, -9, -92, 2.5, '#3A2010');
    circle(ctx, -8, -93, 1,   C.white);  // highlight
    // Right eye
    circle(ctx, 9,  -92, 4.5, C.white);
    circle(ctx, 9,  -92, 2.5, '#3A2010');
    circle(ctx, 10, -93, 1,   C.white);

    // ── Forehead bindi / tilak ────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(0, -99, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = C.maroon;
    ctx.fill();
    // Gold centre dot
    circle(ctx, 0, -99, 1.5, C.gold);

    // ── Crown (small, jewelled) ────────────────────────────────────────
    ctx.beginPath();
    // Crown band
    ctx.fillStyle = C.gold;
    ctx.fillRect(-14, -107, 28, 6);
    // Three crown points
    for (var p = -1; p <= 1; p++) {
      ctx.beginPath();
      ctx.moveTo(p * 9 - 4, -107);
      ctx.lineTo(p * 9,     -116);
      ctx.lineTo(p * 9 + 4, -107);
      ctx.fillStyle = C.gold;
      ctx.fill();
    }
    // Gem on centre point
    circle(ctx, 0, -113, 3, C.maroon);
    circle(ctx, 0, -113, 1.5, '#FF6B6B');

    // ── Modak in right hand ───────────────────────────────────────────
    var modakY = -60 + armSwing + (state === 'celebrate' ? -8 : 0);
    ctx.save();
    ctx.translate(26, modakY);
    ctx.scale(0.7, 0.7);
    _drawModakShape(ctx, 0, 0);
    ctx.restore();

    ctx.restore();  // end character transform
  }

  // ── Modak shape (standalone, also used inline) ────────────────────────
  function _drawModakShape(ctx, x, y) {
    // Modak: teardrop / dumpling shape — cream with gold ridges
    ctx.save();
    ctx.translate(x, y);
    // Body
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(14, -18, 16, -4, 10, 4);
    ctx.bezierCurveTo(6, 10, -6, 10, -10, 4);
    ctx.bezierCurveTo(-16, -4, -14, -18, 0, -18);
    ctx.fillStyle = C.cream;
    ctx.fill();
    // Top knot
    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.bezierCurveTo(-6, -24, 6, -24, 4, -18);
    ctx.fillStyle = C.marigold;
    ctx.fill();
    // Ridges
    ctx.strokeStyle = 'rgba(180,120,40,0.4)';
    ctx.lineWidth = 1;
    for (var r = -6; r <= 6; r += 6) {
      ctx.beginPath();
      ctx.moveTo(r, -16);
      ctx.bezierCurveTo(r + 2, -8, r - 2, 0, r, 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Public drawModak (used in levels)
  function drawModak(ctx, x, y, sc) {
    sc = sc || 1;
    ovalShadow(ctx, x, y, 12 * sc, 4 * sc);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    _drawModakShape(ctx, 0, 0);
    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  MUSHAK the Mouse                                           ║
  // ╚══════════════════════════════════════════════════════════════╝
  function drawMushak(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc  = opts.scale || 1;
    var dir = opts.dir   || 1;
    var bob = Math.sin(t * 3) * 1.5;

    ovalShadow(ctx, x, y, 18 * sc, 5 * sc);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(dir * sc, sc);

    // Body
    ellipse(ctx, 0, -14, 16, 12, '#C8A8A0');
    // Head
    ellipse(ctx, 14, -20, 11, 9, '#C8A8A0');
    // Ears
    circle(ctx, 20, -28, 6, '#C8A8A0');
    circle(ctx, 20, -28, 3.5, '#E8C0C0');
    // Eye
    circle(ctx, 18, -22, 2.5, '#2A1A1A');
    circle(ctx, 19, -23, 1,   C.white);
    // Nose tip
    circle(ctx, 24, -19, 2, '#D08080');
    // Tail
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.bezierCurveTo(-24, -6, -26, 2, -18, 4);
    ctx.strokeStyle = '#A08080';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    // Legs
    for (var i = -1; i <= 1; i += 2) {
      ellipse(ctx, i * 8, -4, 4, 3, '#B89890');
    }

    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  MAA PARVATI                                                ║
  // ╚══════════════════════════════════════════════════════════════╝
  function drawParvati(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc  = opts.scale || 1;
    var dir = opts.dir   || 1;
    var bob = Math.sin(t * 1.8) * 2;

    ovalShadow(ctx, x, y, 22 * sc, 6 * sc);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(dir * sc, sc);

    // Saree — maroon / deep red lower
    ctx.beginPath();
    ctx.ellipse(0, -28, 18, 28, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.maroon;
    ctx.fill();

    // Saree drape (gold border)
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -28, 18, 28, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Body / torso
    ellipse(ctx, 0, -54, 13, 14, C.skinLight);

    // Arms
    ctx.save();
    ctx.translate(14, -56);
    ctx.rotate(0.3);
    roundRect(ctx, 0, -4, 8, 16, 4, C.skinLight);
    ctx.restore();
    ctx.save();
    ctx.translate(-14, -56);
    ctx.rotate(-0.3);
    roundRect(ctx, -8, -4, 8, 16, 4, C.skinLight);
    ctx.restore();

    // Neck
    ellipse(ctx, 0, -68, 6, 5, C.skinLight);

    // Head
    ellipse(ctx, 0, -80, 14, 16, C.skinLight);
    outline(ctx, 1);

    // Hair (dark, up-do)
    ctx.beginPath();
    ctx.ellipse(0, -90, 13, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0A00';
    ctx.fill();
    // Hair bun
    circle(ctx, 0, -97, 6, '#1A0A00');

    // Eyes (kind, almond shaped)
    ctx.fillStyle = '#2A1A0A';
    ctx.beginPath(); ctx.ellipse(-5, -80, 4, 2.5, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5,  -80, 4, 2.5, 0.2,  0, Math.PI*2); ctx.fill();
    // Eye whites
    circle(ctx, -5, -80, 2, C.white);
    circle(ctx,  5, -80, 2, C.white);
    // Pupils
    circle(ctx, -5, -80, 1.2, '#2A1A0A');
    circle(ctx,  5, -80, 1.2, '#2A1A0A');

    // Bindi
    circle(ctx, 0, -86, 2.5, C.maroon);

    // Smile
    ctx.beginPath();
    ctx.arc(0, -76, 5, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  LORD SHIVA (seated, serene)                                ║
  // ╚══════════════════════════════════════════════════════════════╝
  function drawShiva(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc  = opts.scale || 1;
    var bob = Math.sin(t * 1.5) * 1.5;

    ovalShadow(ctx, x, y, 26 * sc, 7 * sc);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(sc, sc);

    // Seated cross-legged base (tiger skin — ochre)
    ctx.beginPath();
    ctx.ellipse(0, -18, 24, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#C8A050';
    ctx.fill();
    // Tiger stripes
    ctx.strokeStyle = 'rgba(80,40,0,0.3)';
    ctx.lineWidth = 1.5;
    for (var s = -14; s <= 14; s += 7) {
      ctx.beginPath();
      ctx.moveTo(s - 4, -8);
      ctx.lineTo(s + 4, -28);
      ctx.stroke();
    }

    // Lower body / dhoti (white)
    ellipse(ctx, 0, -34, 16, 16, C.white);

    // Torso
    ellipse(ctx, 0, -54, 14, 16, '#D0C8C0');

    // Vibhuti lines (3 horizontal white stripes on forehead)
    // (drawn later on face)

    // Arms (meditating — hands in lap / mudra)
    ellipse(ctx, -16, -50, 8, 5, '#D0C8C0');
    ellipse(ctx,  16, -50, 8, 5, '#D0C8C0');
    ellipse(ctx,   0, -42, 14, 6, '#D0C8C0'); // hands in lap

    // Neck
    ellipse(ctx, 0, -68, 7, 5, '#D0C8C0');

    // Blue throat (neelakantha)
    ellipse(ctx, 0, -72, 7, 3, '#6090C8');

    // Head
    ellipse(ctx, 0, -82, 15, 17, '#D0C8C0');
    outline(ctx, 1);

    // Jata (matted hair — tall, indigo)
    ctx.beginPath();
    ctx.moveTo(-12, -90);
    ctx.bezierCurveTo(-16, -106, -8, -118, 0, -120);
    ctx.bezierCurveTo(8, -118, 16, -106, 12, -90);
    ctx.fillStyle = '#3A2870';
    ctx.fill();
    // Crescent moon in jata
    ctx.beginPath();
    ctx.arc(0, -112, 7, 0.3, Math.PI - 0.3);
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Eyes (slightly closed, meditative)
    ctx.fillStyle = '#2A1A0A';
    ctx.beginPath(); ctx.ellipse(-5, -82, 4, 2, -0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5,  -82, 4, 2, 0.1,  0, Math.PI*2); ctx.fill();

    // Vibhuti (3 white stripes) on forehead
    ctx.fillStyle = C.white;
    for (var v = 0; v < 3; v++) {
      ctx.fillRect(-7, -92 + v * 3, 14, 1.5);
    }

    // Third eye (dot)
    circle(ctx, 0, -88, 2.5, C.maroon);

    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  KARTIKEYA with peacock                                     ║
  // ╚══════════════════════════════════════════════════════════════╝
  function drawKartikeya(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc  = opts.scale || 1;
    var dir = opts.dir   || 1;
    var bob = Math.sin(t * 2.5) * 2;

    ovalShadow(ctx, x, y, 30 * sc, 7 * sc);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(dir * sc, sc);

    // ── Peacock (behind, offset left) ─────────────────────────────────
    ctx.save();
    ctx.translate(-22, -10);
    // Body
    ellipse(ctx, 0, -16, 12, 10, '#2A7A3A');
    // Neck
    ellipse(ctx, 8, -26, 4, 8, '#1A5A8A');
    // Head
    circle(ctx, 10, -33, 5, '#1A5A8A');
    // Crown feathers
    for (var pf = -1; pf <= 1; pf++) {
      ctx.beginPath();
      ctx.moveTo(10 + pf * 4, -38);
      ctx.lineTo(10 + pf * 3, -46);
      ctx.strokeStyle = '#2A9A4A';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      circle(ctx, 10 + pf * 3, -47, 2, '#2A9A4A');
    }
    // Tail feathers (fan)
    var featherColors = ['#2A7A3A', '#1A5A8A', '#3AB04A', '#1A7AAA'];
    for (var fi = -3; fi <= 3; fi++) {
      ctx.save();
      ctx.translate(-6, -18);
      ctx.rotate(fi * 0.25);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-2, -26);
      ctx.lineTo(2, -26);
      ctx.closePath();
      ctx.fillStyle = featherColors[Math.abs(fi) % featherColors.length];
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      // Eye on feather
      circle(ctx, 0, -22, 3, '#1A5A8A');
      circle(ctx, 0, -22, 1.5, '#FFD700');
      ctx.restore();
    }
    ctx.restore();

    // ── Kartikeya body ────────────────────────────────────────────────
    // Dhoti (red / maroon)
    ctx.beginPath();
    ctx.ellipse(0, -24, 14, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#A01020';
    ctx.fill();

    // Torso
    ellipse(ctx, 0, -50, 12, 14, C.skinLight);

    // Arms (warrior, slightly muscular)
    ctx.save();
    ctx.translate(13, -52);
    ctx.rotate(0.25);
    roundRect(ctx, 0, -4, 9, 18, 4, C.skinLight);
    ctx.restore();
    ctx.save();
    ctx.translate(-13, -52);
    ctx.rotate(-0.25);
    roundRect(ctx, -9, -4, 9, 18, 4, C.skinLight);
    ctx.restore();

    // Neck + head
    ellipse(ctx, 0, -64, 7, 5, C.skinLight);
    ellipse(ctx, 0, -76, 13, 15, C.skinLight);
    outline(ctx, 1);

    // Hair (dark, styled)
    ctx.beginPath();
    ctx.ellipse(0, -86, 12, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0A00';
    ctx.fill();

    // Crown / peacock feather in hair
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.bezierCurveTo(-4, -100, 4, -102, 0, -106);
    ctx.strokeStyle = '#2A9A4A';
    ctx.lineWidth = 2;
    ctx.stroke();
    circle(ctx, 0, -107, 3.5, '#1A5A8A');
    circle(ctx, 0, -107, 1.5, C.gold);

    // Eyes
    circle(ctx, -5, -76, 3.5, C.white);
    circle(ctx,  5, -76, 3.5, C.white);
    circle(ctx, -5, -76, 2,   '#2A1A0A');
    circle(ctx,  5, -76, 2,   '#2A1A0A');

    // Smile
    ctx.beginPath();
    ctx.arc(0, -72, 5, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  DEVOTEE SILHOUETTE (generic festival-goer)                 ║
  // ╚══════════════════════════════════════════════════════════════╝
  function drawDevotee(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc  = opts.scale || 1;
    var col = opts.color || C.maroon;
    var bob = Math.sin(t * 2 + (opts.phase || 0)) * 1.5;

    ovalShadow(ctx, x, y, 14 * sc, 4 * sc);
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(sc, sc);

    // Simple silhouette — body
    ctx.beginPath();
    ctx.ellipse(0, -28, 12, 28, 0, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    // Head
    circle(ctx, 0, -58, 10, C.skinLight);
    // Hair dot
    circle(ctx, 0, -66, 6, '#2A1A00');
    // Hands up (celebrating)
    if (opts.handsUp) {
      ellipse(ctx, -16, -52, 5, 4, C.skinLight);
      ellipse(ctx,  16, -52, 5, 4, C.skinLight);
    }

    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  PROPS                                                      ║
  // ╚══════════════════════════════════════════════════════════════╝

  // Diya (clay lamp) — lit or unlit
  function drawDiya(ctx, x, y, lit, t) {
    ovalShadow(ctx, x, y, 10, 3);
    ctx.save();
    ctx.translate(x, y);
    // Clay body
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.bezierCurveTo(-12, -8, 12, -8, 10, 0);
    ctx.closePath();
    ctx.fillStyle = '#C87040';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -2, 9, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#A05030';
    ctx.fill();
    if (lit) {
      // Oil pool
      ctx.beginPath();
      ctx.ellipse(0, -4, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#D0A040';
      ctx.fill();
      // Wick
      ctx.beginPath();
      ctx.moveTo(5, -5);
      ctx.lineTo(6, -10);
      ctx.strokeStyle = '#4A2A00';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Flame (flicker with time)
      var flicker = Math.sin(t * 8) * 1.5;
      ctx.save();
      ctx.translate(6, -10);
      // Outer flame
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-4 + flicker, -5, -3, -12, 0, -14 + flicker * 0.5);
      ctx.bezierCurveTo(3, -12, 4 - flicker, -5, 0, 0);
      ctx.fillStyle = C.marigold;
      ctx.fill();
      // Inner flame
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.bezierCurveTo(-2, -6, -1.5, -10, 0, -11);
      ctx.bezierCurveTo(1.5, -10, 2, -6, 0, -2);
      ctx.fillStyle = C.cream;
      ctx.fill();
      ctx.restore();
      // Glow
      var grd = ctx.createRadialGradient(6, -14, 2, 6, -14, 16);
      grd.addColorStop(0, 'rgba(255,200,80,0.35)');
      grd.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.beginPath();
      ctx.arc(6, -14, 16, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
    ctx.restore();
  }

  // Marigold petal / flower
  function drawPetal(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t + x) * 0.3);
    var petals = 6;
    for (var i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i / petals) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -6, 3, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? C.marigold : C.saffron;
      ctx.fill();
      ctx.restore();
    }
    circle(ctx, 0, 0, 3, C.gold);
    ctx.restore();
  }

  // Clay pot
  function drawPot(ctx, x, y) {
    ovalShadow(ctx, x, y, 16, 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.bezierCurveTo(-16, -10, -16, -28, -8, -34);
    ctx.bezierCurveTo(-4, -38, 4, -38, 8, -34);
    ctx.bezierCurveTo(16, -28, 16, -10, 12, 0);
    ctx.closePath();
    ctx.fillStyle = '#C87040';
    ctx.fill();
    // Rim
    ellipse(ctx, 0, -34, 8, 3, '#A05030');
    // Decoration band
    ctx.strokeStyle = C.maroon;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.bezierCurveTo(-8, -16, 8, -16, 14, -18);
    ctx.stroke();
    ctx.restore();
  }

  // Wooden stool
  function drawStool(ctx, x, y) {
    ovalShadow(ctx, x, y, 18, 5);
    ctx.save();
    ctx.translate(x, y);
    // Legs
    ctx.fillStyle = C.brown;
    ctx.fillRect(-14, -18, 4, 18);
    ctx.fillRect( 10, -18, 4, 18);
    // Seat
    roundRect(ctx, -16, -24, 32, 8, 4, '#8B5A30');
    ctx.restore();
  }

  // Table
  function drawTable(ctx, x, y) {
    ovalShadow(ctx, x, y, 36, 8);
    ctx.save();
    ctx.translate(x, y);
    // Legs
    ctx.fillStyle = C.brown;
    ctx.fillRect(-30, -22, 5, 22);
    ctx.fillRect( 25, -22, 5, 22);
    // Top surface
    roundRect(ctx, -34, -32, 68, 12, 5, '#8B5A30');
    // Table cloth (cream stripe)
    roundRect(ctx, -30, -32, 60, 5, 3, C.cream);
    ctx.restore();
  }

  // Rock
  function drawRock(ctx, x, y) {
    ovalShadow(ctx, x, y, 18, 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.bezierCurveTo(-18, -10, -12, -22, 0, -24);
    ctx.bezierCurveTo(12, -22, 18, -10, 16, 0);
    ctx.closePath();
    ctx.fillStyle = '#8A8A8A';
    ctx.fill();
    // Highlight
    ctx.beginPath();
    ctx.ellipse(-4, -16, 5, 4, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.restore();
  }

  // Log
  function drawLog(ctx, x, y) {
    ovalShadow(ctx, x, y, 22, 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.save();
    ctx.rotate(-0.15);
    // Log body
    roundRect(ctx, -22, -14, 44, 14, 7, C.brown);
    // End grain
    ctx.beginPath();
    ctx.ellipse(22, -7, 7, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4A2010';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(22, -7, 4, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6B3A20';
    ctx.fill();
    // Bark lines
    ctx.strokeStyle = 'rgba(40,10,0,0.3)';
    ctx.lineWidth = 1;
    for (var bl = -14; bl <= 14; bl += 7) {
      ctx.beginPath();
      ctx.moveTo(bl, -14);
      ctx.lineTo(bl - 2, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  // Thorny bush
  function drawBush(ctx, x, y) {
    ovalShadow(ctx, x, y, 20, 5);
    ctx.save();
    ctx.translate(x, y);
    // Main blob
    ctx.beginPath();
    ctx.arc(0, -18, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#3A6030';
    ctx.fill();
    // Spines
    ctx.strokeStyle = '#A06030';
    ctx.lineWidth = 1.5;
    var spineAngles = [-1.2, -0.7, -0.1, 0.5, 1.0, 1.6, 2.2, 2.8];
    spineAngles.forEach(function (a) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 14, -18 + Math.sin(a) * 14);
      ctx.lineTo(Math.cos(a) * 22, -18 + Math.sin(a) * 22);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Wisdom fruit (golden mango / fruit of wisdom)
  function drawWisdomFruit(ctx, x, y, t) {
    var glow = 0.5 + Math.sin(t * 3) * 0.2;
    // Glow aura
    var grd = ctx.createRadialGradient(x, y - 18, 4, x, y - 18, 26);
    grd.addColorStop(0, 'rgba(255,210,50,' + glow + ')');
    grd.addColorStop(1, 'rgba(255,210,50,0)');
    ctx.beginPath();
    ctx.arc(x, y - 18, 26, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ovalShadow(ctx, x, y, 12, 4);
    ctx.save();
    ctx.translate(x, y);
    // Fruit body (mango shape)
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(14, -8, 16, -26, 6, -34);
    ctx.bezierCurveTo(2, -38, -2, -38, -6, -34);
    ctx.bezierCurveTo(-16, -26, -14, -8, 0, -6);
    ctx.fillStyle = C.gold;
    ctx.fill();
    // Highlight
    ctx.beginPath();
    ctx.ellipse(-4, -26, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,200,0.5)';
    ctx.fill();
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(0, -42);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Leaf
    ctx.beginPath();
    ctx.ellipse(5, -42, 5, 3, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();
    ctx.restore();
  }

  // Finish flag / banner
  function drawFinishFlag(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Pole
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -60);
    ctx.strokeStyle = C.brown;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Flag
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(28, -52);
    ctx.lineTo(0, -44);
    ctx.closePath();
    ctx.fillStyle = C.marigold;
    ctx.fill();
    // Om symbol on flag (simple)
    G.art.centeredText(ctx, 'ॐ', 14, -52, 10, C.maroon);
    ctx.restore();
  }

  // Small clay murti (Ganesha idol)
  function drawMurti(ctx, x, y, t) {
    ovalShadow(ctx, x, y, 14, 4);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.45, 0.45);
    // Draw a mini Ganesha using same function
    drawGanesha(ctx, 0, 0, t, { state: 'idle', scale: 1 });
    ctx.restore();
  }

  // Plate of modaks
  function drawModakPlate(ctx, x, y, t) {
    ovalShadow(ctx, x, y, 20, 5);
    ctx.save();
    ctx.translate(x, y);
    // Plate
    ctx.beginPath();
    ctx.ellipse(0, -4, 20, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#D0C8B0';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -6, 16, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E8E0C8';
    ctx.fill();
    // 3 modaks on plate
    var positions = [[-8, -10], [0, -12], [8, -10]];
    positions.forEach(function (p) {
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.scale(0.55, 0.55);
      _drawModakShape(ctx, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    // Utilities
    clearBg:        clearBg,
    centeredText:   centeredText,
    circle:         circle,
    ellipse:        ellipse,
    roundRect:      roundRect,
    ovalShadow:     ovalShadow,
    drawWithTilt:   drawWithTilt,
    outline:        outline,
    // Characters
    drawGanesha:    drawGanesha,
    drawMushak:     drawMushak,
    drawParvati:    drawParvati,
    drawShiva:      drawShiva,
    drawKartikeya:  drawKartikeya,
    drawDevotee:    drawDevotee,
    // Props
    drawModak:      drawModak,
    drawModakPlate: drawModakPlate,
    drawDiya:       drawDiya,
    drawPetal:      drawPetal,
    drawPot:        drawPot,
    drawStool:      drawStool,
    drawTable:      drawTable,
    drawRock:       drawRock,
    drawLog:        drawLog,
    drawBush:       drawBush,
    drawWisdomFruit:drawWisdomFruit,
    drawFinishFlag: drawFinishFlag,
    drawMurti:      drawMurti,
  };

})();
