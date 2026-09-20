// js/scenery.js — reusable background scenery helpers for Bappa's Journey
// All helpers take (ctx, ..., t) where t = elapsed seconds.
// Designed for the 1280x720 logical canvas.  No image files, no external assets.
// Load this BEFORE any scene files (after art.js) in index.html.
//
// Shared night sky palette:
//   SKY_TOP     #1B1F4B  — deep indigo
//   SKY_MID     #3B2A6B  — mid purple
//   SKY_HORIZON #F2A65A  — warm saffron glow at horizon

'use strict';

G.scenery = (function () {

  // ── Internal shortcuts ────────────────────────────────────────────────────
  var W = G.W;   // 1280
  var H = G.H;   // 720

  // Fixed star seed positions (x 0-1, y 0-1, size 0-1, twinkle phase 0-1)
  // Pre-computed so no per-frame allocations.
  var _stars = (function () {
    var s = [];
    var seed = 0;
    function rng() { seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF; return (seed >>> 0) / 0xFFFFFFFF; }
    for (var i = 0; i < 80; i++) {
      s.push({ x: rng(), y: rng() * 0.72, sz: 0.6 + rng() * 1.6, ph: rng() * 6.28, sp: 0.8 + rng() * 1.4 });
    }
    return s;
  }());

  // ── drawSky(ctx, yTop, yHorizon, t) ──────────────────────────────────────
  // Fills a vertical gradient from deep indigo to warm saffron at the horizon.
  // yTop = top of sky region (usually 0). yHorizon = y of horizon line.
  function drawSky(ctx, yTop, yHorizon, t) {
    yTop     = yTop     !== undefined ? yTop     : 0;
    yHorizon = yHorizon !== undefined ? yHorizon : H * 0.72;
    var grad = ctx.createLinearGradient(0, yTop, 0, yHorizon);
    grad.addColorStop(0,    '#1B1F4B');
    grad.addColorStop(0.45, '#2D1F5E');
    grad.addColorStop(0.78, '#3B2A6B');
    grad.addColorStop(1,    '#6B3A2A');  // warm saffron-brown at horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, yTop, W, yHorizon - yTop);

    // Faint auroral glow band midway — very subtle, not distracting
    var gy = yTop + (yHorizon - yTop) * 0.6;
    var aGrad = ctx.createLinearGradient(0, gy - 30, 0, gy + 30);
    aGrad.addColorStop(0,   'rgba(80,50,140,0)');
    aGrad.addColorStop(0.5, 'rgba(90,60,160,' + (0.06 + Math.sin(t * 0.25) * 0.03) + ')');
    aGrad.addColorStop(1,   'rgba(80,50,140,0)');
    ctx.fillStyle = aGrad;
    ctx.fillRect(0, gy - 30, W, 60);
  }

  // ── drawStars(ctx, yTop, yHorizon, t) ────────────────────────────────────
  // Draws 80 twinkling stars plus a handful of 4-point sparkle stars.
  function drawStars(ctx, yTop, yHorizon, t) {
    yTop     = yTop     !== undefined ? yTop     : 0;
    yHorizon = yHorizon !== undefined ? yHorizon : H * 0.72;
    var rangeY = yHorizon - yTop;
    for (var i = 0; i < _stars.length; i++) {
      var st = _stars[i];
      var sx = st.x * W;
      var sy = yTop + st.y * rangeY;
      var alpha = 0.5 + Math.sin(t * st.sp + st.ph) * 0.35;
      if (alpha <= 0) continue;
      // 4-point sparkle for larger stars, simple circle for small ones
      if (st.sz > 1.6) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFF8D0';
        var arm = st.sz * 2.8;
        ctx.beginPath();
        ctx.moveTo(sx, sy - arm); ctx.lineTo(sx + arm * 0.28, sy);
        ctx.lineTo(sx, sy + arm); ctx.lineTo(sx - arm * 0.28, sy);
        ctx.closePath(); ctx.fill();
        // Horizontal arm
        ctx.beginPath();
        ctx.moveTo(sx - arm, sy); ctx.lineTo(sx, sy - arm * 0.28);
        ctx.lineTo(sx + arm, sy); ctx.lineTo(sx, sy + arm * 0.28);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, st.sz, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,248,208,' + alpha + ')';
        ctx.fill();
      }
    }
  }

  // ── drawMoon(ctx, cx, cy, r, t) ──────────────────────────────────────────
  // Crescent moon with a soft halo glow.
  function drawMoon(ctx, cx, cy, r, t) {
    r = r || 36;
    // Outer glow
    var halo = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.8);
    halo.addColorStop(0,   'rgba(255,240,180,0.22)');
    halo.addColorStop(0.5, 'rgba(255,220,120,0.08)');
    halo.addColorStop(1,   'rgba(255,200,80,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();

    // Full disc (cream)
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#F5F1D0'; ctx.fill();

    // "Shadow" disc to cut crescent — offset slightly left
    var off = r * 0.42;
    ctx.beginPath(); ctx.arc(cx - off, cy, r * 1.02, 0, Math.PI * 2);
    ctx.fillStyle = '#2D1F5E'; ctx.fill();  // matches sky mid colour

    // Gentle surface texture — two faint arc strokes
    ctx.strokeStyle = 'rgba(200,190,140,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + r * 0.25, cy - r * 0.1, r * 0.35, 0.3, 1.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + r * 0.1,  cy + r * 0.3, r * 0.2, 0.6, 2.0); ctx.stroke();
  }

  // ── drawGlow(ctx, x, y, r, color, alpha) ─────────────────────────────────
  // Simple radial gradient glow blob. color = css hex string.
  function drawGlow(ctx, x, y, r, color, alpha) {
    alpha = alpha !== undefined ? alpha : 0.5;
    // Parse hex colour to rgb components for rgba stops
    var hex = color.replace('#', '');
    var ri  = parseInt(hex.substring(0,2), 16);
    var gi  = parseInt(hex.substring(2,4), 16);
    var bi  = parseInt(hex.substring(4,6), 16);
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0,   'rgba(' + ri + ',' + gi + ',' + bi + ',' + alpha + ')');
    g.addColorStop(0.45,'rgba(' + ri + ',' + gi + ',' + bi + ',' + (alpha * 0.5) + ')');
    g.addColorStop(1,   'rgba(' + ri + ',' + gi + ',' + bi + ',0)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
  }

  // ── drawMountainRange(ctx, groundY, t) ────────────────────────────────────
  // Three layered bezier mountain ranges with jagged peaks, snow cap, fog bands.
  // groundY = y of the ground/horizon line (characters stand here).
  function drawMountainRange(ctx, groundY, t) {
    groundY = groundY !== undefined ? groundY : 520;

    // Layer data: [fillColor, yBase, peakScale, fogAlpha]
    var layers = [
      { fill: '#1A1438', base: groundY - 20, peak: 1.00, fog: 0.14 },  // far, darkest
      { fill: '#251850', base: groundY - 10, peak: 0.75, fog: 0.10 },  // mid
      { fill: '#38246A', base: groundY,      peak: 0.52, fog: 0.07 },  // near, lightest
    ];

    for (var li = 0; li < layers.length; li++) {
      var lay  = layers[li];
      var base = lay.base;

      ctx.beginPath();
      ctx.moveTo(0, base);

      // Hand-authored irregular peak points (x, relY relative to groundY)
      // Peaks go higher for far layers (layer 0).
      var pkH = lay.peak;  // scale factor

      // Points across the width: [x, y-offset-from-base]
      var pts = [
        0,    0,
        80,   -80  * pkH,
        180,  -160 * pkH,
        260,  -110 * pkH,
        340,  -220 * pkH,  // first tall peak
        420,  -155 * pkH,
        500,  -100 * pkH,
        560,  -185 * pkH,
        640,  -310 * pkH,  // TALLEST peak — near centre
        720,  -200 * pkH,
        800,  -270 * pkH,
        880,  -140 * pkH,
        950,  -195 * pkH,
        1040, -90  * pkH,
        1120, -160 * pkH,
        1200, -70  * pkH,
        1280, 0,
      ];

      // Build a bezier path through the peak points with jagged tension
      ctx.moveTo(pts[0], base + pts[1]);
      for (var pi2 = 2; pi2 < pts.length - 2; pi2 += 2) {
        var mx = (pts[pi2] + pts[pi2 - 2]) / 2;
        var my = base + (pts[pi2 + 1] + pts[pi2 - 1]) / 2;
        ctx.quadraticCurveTo(pts[pi2 - 2], base + pts[pi2 - 1], mx, my);
      }
      ctx.quadraticCurveTo(pts[pts.length - 4], base + pts[pts.length - 3],
                           pts[pts.length - 2], base + pts[pts.length - 1]);
      ctx.lineTo(W, base);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = lay.fill;
      ctx.fill();

      // Snow cap on the tallest peak (far layer only)
      if (li === 0) {
        _drawSnowCap(ctx, 640, base - 310 * pkH, 58, 40);
      }

      // Drifting fog band between layers
      _drawFogBand(ctx, base - 20, lay.fog, t + li * 1.8);
    }
  }

  // ── helper: snow cap with shade ───────────────────────────────────────────
  function _drawSnowCap(ctx, peakX, peakY, capW, capH) {
    // Snow base fill
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.bezierCurveTo(peakX + capW * 0.5, peakY + capH * 0.4,
                      peakX + capW,       peakY + capH,
                      peakX + capW * 0.6, peakY + capH * 1.05);
    ctx.bezierCurveTo(peakX,              peakY + capH * 0.9,
                      peakX - capW * 0.6, peakY + capH * 1.05,
                      peakX - capW,       peakY + capH);
    ctx.bezierCurveTo(peakX - capW * 0.5, peakY + capH * 0.4,
                      peakX, peakY, peakX, peakY);
    ctx.fillStyle = '#E8EEF8'; ctx.fill();
    // Snow shade (right side)
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.bezierCurveTo(peakX + capW * 0.3, peakY + capH * 0.3,
                      peakX + capW * 0.8, peakY + capH * 0.7,
                      peakX + capW * 0.6, peakY + capH * 1.05);
    ctx.bezierCurveTo(peakX + capW * 0.1, peakY + capH * 0.7, peakX, peakY, peakX, peakY);
    ctx.fillStyle = 'rgba(150,180,220,0.45)'; ctx.fill();
    // Snow highlight (left crest)
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.bezierCurveTo(peakX - capW * 0.2, peakY + capH * 0.2,
                      peakX - capW * 0.3, peakY + capH * 0.5,
                      peakX - capW * 0.25, peakY + capH * 0.55);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5;
    ctx.lineCap = 'round'; ctx.stroke();
  }

  // ── helper: drifting fog band ─────────────────────────────────────────────
  function _drawFogBand(ctx, y, alpha, t) {
    var drift = Math.sin(t * 0.18) * 40;
    var grad = ctx.createLinearGradient(0, y - 18, 0, y + 18);
    grad.addColorStop(0,   'rgba(200,190,230,0)');
    grad.addColorStop(0.5, 'rgba(200,190,230,' + alpha + ')');
    grad.addColorStop(1,   'rgba(200,190,230,0)');
    ctx.save();
    ctx.translate(drift, 0);
    ctx.fillStyle = grad;
    ctx.fillRect(-60, y - 18, W + 120, 36);
    ctx.restore();
  }

  // ── drawKailashHome(ctx, x, groundY, t) ──────────────────────────────────
  // A small stone and carved-wood house: tiered curved roof, pillars,
  // warm lit windows, arched door, marigold garlands on eaves, diyas on steps.
  // (x, groundY) = centre-bottom of the house.
  function drawKailashHome(ctx, x, groundY, t) {
    ctx.save();
    ctx.translate(x, groundY);

    // ── Stone foundation step ─────────────────────────────────────────────
    ctx.beginPath();
    ctx.rect(-56, -12, 112, 12);
    ctx.fillStyle = '#6A5A48'; ctx.fill();
    ctx.strokeStyle = '#3A2A1A'; ctx.lineWidth = 1; ctx.stroke();
    // Stone lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (var sx2 = -40; sx2 <= 40; sx2 += 28) {
      ctx.beginPath(); ctx.moveTo(sx2, -12); ctx.lineTo(sx2, 0); ctx.stroke();
    }

    // ── Pillars (two either side of door) ────────────────────────────────
    for (var pi = -1; pi <= 1; pi += 2) {
      var px = pi * 28;
      // Pillar shaft
      ctx.beginPath();
      ctx.rect(px - 5, -85, 10, 73);
      ctx.fillStyle = '#C8B898'; ctx.fill();
      ctx.strokeStyle = '#5A4030'; ctx.lineWidth = 1; ctx.stroke();
      // Capital at top
      ctx.beginPath();
      ctx.ellipse(px, -88, 10, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#A8987A'; ctx.fill();
      // Carved grooves
      ctx.strokeStyle = 'rgba(80,50,20,0.3)'; ctx.lineWidth = 0.8;
      for (var gy2 = -70; gy2 > -82; gy2 -= 6) {
        ctx.beginPath(); ctx.moveTo(px - 4, gy2); ctx.lineTo(px + 4, gy2); ctx.stroke();
      }
    }

    // ── Arched door ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.rect(-18, -78, 36, 54);
    ctx.fillStyle = '#3A2010'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -78, 18, Math.PI, 0);
    ctx.fillStyle = '#3A2010'; ctx.fill();
    // Door warm glow (window lit)
    var dGlow = ctx.createRadialGradient(0, -60, 2, 0, -60, 20);
    dGlow.addColorStop(0, 'rgba(255,200,80,0.55)');
    dGlow.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.beginPath(); ctx.rect(-18, -78, 36, 54);
    ctx.beginPath(); ctx.arc(0, -78, 18, Math.PI, 0);
    ctx.fillStyle = dGlow; ctx.fill();
    // Door frame
    ctx.strokeStyle = '#7A5030'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(-18, -78, 36, 54); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -78, 18, Math.PI, 0); ctx.stroke();

    // ── Walls (stone texture) ──────────────────────────────────────────────
    ctx.beginPath();
    ctx.rect(-55, -88, 110, 76);
    ctx.fillStyle = '#B0A080'; ctx.fill();
    ctx.strokeStyle = '#5A4030'; ctx.lineWidth = 1.2; ctx.stroke();
    // Stone brick pattern
    ctx.strokeStyle = 'rgba(60,40,15,0.22)'; ctx.lineWidth = 0.8;
    for (var wy = -76; wy < -12; wy += 12) {
      var offset = ((wy + 76) / 12 % 2 < 1) ? 0 : 18;
      for (var wx = -55 + offset; wx < 55; wx += 36) {
        ctx.beginPath(); ctx.rect(wx, wy, 34, 11); ctx.stroke();
      }
    }

    // ── Side windows (two, warm glow) ─────────────────────────────────────
    for (var wi = -1; wi <= 1; wi += 2) {
      var winX = wi * 38;
      var winY = -62;
      // Window surround
      ctx.beginPath(); ctx.rect(winX - 10, winY - 12, 20, 18); ctx.fillStyle = '#7A5A2A'; ctx.fill();
      ctx.beginPath(); ctx.arc(winX, winY - 12, 10, Math.PI, 0); ctx.fillStyle = '#7A5A2A'; ctx.fill();
      // Warm glow inside
      var wGlow = ctx.createRadialGradient(winX, winY - 6, 1, winX, winY - 6, 14);
      var flicker = 0.55 + Math.sin(t * 2.2 + wi) * 0.12;
      wGlow.addColorStop(0, 'rgba(255,200,80,' + flicker + ')');
      wGlow.addColorStop(1, 'rgba(255,160,40,0)');
      ctx.beginPath(); ctx.rect(winX - 10, winY - 12, 20, 18);
      ctx.beginPath(); ctx.arc(winX, winY - 12, 10, Math.PI, 0);
      ctx.fillStyle = wGlow; ctx.fill();
      ctx.strokeStyle = '#4A3010'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(winX - 10, winY - 12, 20, 18); ctx.stroke();
    }

    // ── Tiered curved roof ────────────────────────────────────────────────
    _drawTieredRoof(ctx, 0, -88, 110, t);

    // ── Marigold garlands on eaves ────────────────────────────────────────
    _drawEaveGarland(ctx, -55, -88, 110, t);

    // ── Diyas on front steps ──────────────────────────────────────────────
    G.art.drawDiya(ctx, -26, 0, true, t);
    G.art.drawDiya(ctx,  26, 0, true, t);

    ctx.restore();
  }

  // ── helper: tiered curved temple-style roof ───────────────────────────────
  function _drawTieredRoof(ctx, cx, wallTopY, wallW, t) {
    // Tier 1 (widest, bottom)
    ctx.beginPath();
    ctx.moveTo(-wallW * 0.56, wallTopY);
    ctx.bezierCurveTo(-wallW * 0.56, wallTopY - 14, -wallW * 0.38, wallTopY - 28, cx, wallTopY - 30);
    ctx.bezierCurveTo(wallW * 0.38, wallTopY - 28, wallW * 0.56, wallTopY - 14, wallW * 0.56, wallTopY);
    ctx.closePath();
    ctx.fillStyle = '#8B2020'; ctx.fill();
    ctx.strokeStyle = '#4A1010'; ctx.lineWidth = 1.5; ctx.stroke();
    // Gold trim on tier 1
    ctx.beginPath();
    ctx.moveTo(-wallW * 0.56, wallTopY);
    ctx.bezierCurveTo(-wallW * 0.56, wallTopY - 14, -wallW * 0.38, wallTopY - 28, cx, wallTopY - 30);
    ctx.bezierCurveTo(wallW * 0.38, wallTopY - 28, wallW * 0.56, wallTopY - 14, wallW * 0.56, wallTopY);
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 2; ctx.stroke();

    // Tier 2 (narrower)
    var t2y = wallTopY - 28;
    ctx.beginPath();
    ctx.moveTo(-wallW * 0.32, t2y);
    ctx.bezierCurveTo(-wallW * 0.32, t2y - 12, -wallW * 0.18, t2y - 24, cx, t2y - 26);
    ctx.bezierCurveTo(wallW * 0.18, t2y - 24, wallW * 0.32, t2y - 12, wallW * 0.32, t2y);
    ctx.closePath();
    ctx.fillStyle = '#A02828'; ctx.fill();
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 1.5; ctx.stroke();

    // Spire / kalash finial on top
    var spireY = t2y - 26;
    ctx.beginPath();
    ctx.moveTo(cx - 6, spireY);
    ctx.lineTo(cx, spireY - 22);
    ctx.lineTo(cx + 6, spireY);
    ctx.fillStyle = G.COL.goldDark; ctx.fill();
    ctx.strokeStyle = '#4A2800'; ctx.lineWidth = 1; ctx.stroke();
    // Kalash pot
    ctx.beginPath();
    ctx.ellipse(cx, spireY - 22, 6, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = G.COL.goldLight; ctx.fill();
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 1; ctx.stroke();
  }

  // ── helper: marigold garland sag along eaves ──────────────────────────────
  function _drawEaveGarland(ctx, leftX, y, width, t) {
    var sag   = 10 + Math.sin(t * 0.6) * 2;  // gentle sway
    var right = leftX + width;
    var mid   = leftX + width / 2;

    // Garland string (saffron)
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.quadraticCurveTo(mid, y + sag, right, y);
    ctx.strokeStyle = G.COL.marigold; ctx.lineWidth = 2.5; ctx.stroke();

    // Marigold blobs along the string
    var steps = 9;
    for (var gi = 0; gi <= steps; gi++) {
      var gfrac = gi / steps;
      var gx = leftX + gfrac * width;
      var gy = y + 4 * gfrac * (1 - gfrac) * sag;
      // Marigold circle cluster
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fillStyle = (gi % 2 === 0) ? G.COL.marigold : G.COL.saffron;
      ctx.fill();
      // Small petal ring
      ctx.beginPath();
      ctx.arc(gx, gy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFEEAA'; ctx.fill();
    }
  }

  // ── drawDiya(ctx, x, y, lit, t) ──────────────────────────────────────────
  // Standalone diya — identical interface to G.art.drawDiya but accessible here.
  // Defers to G.art.drawDiya so we don't duplicate code.
  function drawDiya(ctx, x, y, lit, t) {
    G.art.drawDiya(ctx, x, y, lit, t);
  }

  // ── drawMarigoldGarland(ctx, x1, y1, x2, y2, t) ─────────────────────────
  // Draws a natural sagging garland between two anchor points.
  function drawMarigoldGarland(ctx, x1, y1, x2, y2, t) {
    var sag   = Math.abs(x2 - x1) * 0.18 + Math.sin(t * 0.5) * 4;
    var midX  = (x1 + x2) / 2;
    var midY  = (y1 + y2) / 2 + sag;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.strokeStyle = G.COL.marigold; ctx.lineWidth = 2.5; ctx.stroke();

    // Flower blobs along curve
    var steps = Math.max(4, Math.floor(Math.abs(x2 - x1) / 28));
    for (var gi = 0; gi <= steps; gi++) {
      var frac = gi / steps;
      var gx = x1 + frac * (x2 - x1);
      var gy = y1 + frac * (y2 - y1) + 4 * frac * (1 - frac) * sag;
      ctx.beginPath(); ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fillStyle = gi % 2 === 0 ? G.COL.marigold : G.COL.saffron; ctx.fill();
      ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFEEAA'; ctx.fill();
    }
  }

  // ── drawFloatingPetals(ctx, petalArray, t) ────────────────────────────────
  // petalArray is an array of {x,y,vx,vy,phase} objects (managed by caller).
  // Call G.art.drawPetal for each.
  function drawFloatingPetals(ctx, petalArray, t) {
    for (var i = 0; i < petalArray.length; i++) {
      G.art.drawPetal(ctx, petalArray[i].x, petalArray[i].y, t + petalArray[i].phase);
    }
  }

  // ── drawMandala(ctx, cx, cy, r, t, alpha) ─────────────────────────────────
  // Slowly rotating golden mandala: rings, rays and petal shapes.
  function drawMandala(ctx, cx, cy, r, t, alpha) {
    r     = r     !== undefined ? r     : 120;
    alpha = alpha !== undefined ? alpha : 0.18;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;

    // Outer ring
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = G.COL.goldLight; ctx.lineWidth = 1.5; ctx.stroke();

    // Middle ring
    ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 1; ctx.stroke();

    // Slowly rotating outer petal ring (8 petals)
    ctx.rotate(t * 0.08);
    var PETALS = 8;
    for (var pi3 = 0; pi3 < PETALS; pi3++) {
      var ang = (pi3 / PETALS) * Math.PI * 2;
      var px2 = Math.cos(ang) * r * 0.82;
      var py2 = Math.sin(ang) * r * 0.82;
      ctx.save();
      ctx.translate(px2, py2);
      ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.12, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = G.COL.goldLight; ctx.fill();
      ctx.restore();
    }

    // Faster counter-rotating inner rays (12 rays)
    ctx.rotate(-t * 0.18);
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 1;
    var RAYS = 12;
    for (var ri2 = 0; ri2 < RAYS; ri2++) {
      var rang = (ri2 / RAYS) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rang) * r * 0.18, Math.sin(rang) * r * 0.18);
      ctx.lineTo(Math.cos(rang) * r * 0.60, Math.sin(rang) * r * 0.60);
      ctx.stroke();
    }

    // Inner dot cluster (static relative to outer)
    ctx.globalAlpha = alpha * 1.2;
    for (var di2 = 0; di2 < 6; di2++) {
      var da = (di2 / 6) * Math.PI * 2 + t * 0.12;
      ctx.beginPath();
      ctx.arc(Math.cos(da) * r * 0.28, Math.sin(da) * r * 0.28, r * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = G.COL.goldLight; ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    drawSky:            drawSky,
    drawStars:          drawStars,
    drawMoon:           drawMoon,
    drawGlow:           drawGlow,
    drawMountainRange:  drawMountainRange,
    drawKailashHome:    drawKailashHome,
    drawDiya:           drawDiya,
    drawMarigoldGarland: drawMarigoldGarland,
    drawFloatingPetals: drawFloatingPetals,
    drawMandala:        drawMandala,
  };

}());
