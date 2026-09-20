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

  // ── drawOrnateGateDoor(ctx, cx, groundY, t) ──────────────────────────────
  // A big carved wooden door in a stone wall: arched, brass studs, gold frame,
  // marigold torana, warm lit edges, stone steps and two pillar diyas.
  // (cx, groundY) = centre of door base.
  function drawOrnateGateDoor(ctx, cx, groundY, t) {
    var flicker = Math.sin(t * 2.8) * 0.08;  // lamp flicker

    // ── Stone wall behind the door ────────────────────────────────────
    ctx.beginPath();
    ctx.rect(cx - 320, groundY - 480, 640, 480);
    ctx.fillStyle = '#6A5848'; ctx.fill();
    // Stone coursing lines (horizontal)
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
    for (var wy = groundY - 460; wy < groundY; wy += 32) {
      ctx.beginPath(); ctx.moveTo(cx - 320, wy); ctx.lineTo(cx + 320, wy); ctx.stroke();
    }
    // Vertical joints (alternating offset per row)
    for (var row = 0; row < 15; row++) {
      var ry  = groundY - 32 * (row + 1);
      var off = (row % 2 === 0) ? 0 : 48;
      for (var jx = cx - 320 + off; jx < cx + 320; jx += 96) {
        ctx.beginPath(); ctx.moveTo(jx, ry); ctx.lineTo(jx, ry + 32); ctx.stroke();
      }
    }

    // ── Stone steps (two, wider at bottom) ───────────────────────────
    ctx.beginPath(); ctx.rect(cx - 130, groundY - 14, 260, 14); ctx.fillStyle = '#8A7860'; ctx.fill();
    ctx.strokeStyle = '#3A2A18'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - 100, groundY - 26, 200, 12); ctx.fillStyle = '#9A8870'; ctx.fill();
    ctx.strokeStyle = '#3A2A18'; ctx.lineWidth = 1; ctx.stroke();

    // ── Two stone pillars with decorative capitals ────────────────────
    for (var ps = -1; ps <= 1; ps += 2) {
      var px = cx + ps * 110;
      // Pillar shaft
      ctx.beginPath(); ctx.rect(px - 14, groundY - 440, 28, 400); ctx.fillStyle = '#C8B898'; ctx.fill();
      ctx.strokeStyle = '#4A3820'; ctx.lineWidth = 1.2; ctx.stroke();
      // Capital
      ctx.beginPath(); ctx.ellipse(px, groundY - 440, 20, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#B0A080'; ctx.fill(); ctx.stroke();
      // Decorative carved bands
      ctx.strokeStyle = 'rgba(60,40,15,0.3)'; ctx.lineWidth = 1;
      for (var cb = groundY - 420; cb > groundY - 440; cb -= 8) {
        ctx.beginPath(); ctx.moveTo(px - 12, cb); ctx.lineTo(px + 12, cb); ctx.stroke();
      }
      // Diya on top of pillar capital
      G.art.drawDiya(ctx, px, groundY - 450, true, t);
    }

    // ── Garland between pillar tops ────────────────────────────────────
    // (two garlands: one high, one mid)
    for (var gl = 0; gl < 2; gl++) {
      var glY = groundY - 440 + gl * 30;
      var glSag = 22 + gl * 10 + Math.sin(t * 0.5 + gl) * 3;
      ctx.beginPath();
      ctx.moveTo(cx - 96, glY);
      ctx.quadraticCurveTo(cx, glY + glSag, cx + 96, glY);
      ctx.strokeStyle = G.COL.marigold; ctx.lineWidth = 3; ctx.stroke();
      var garSteps = 7;
      for (var gsi = 0; gsi <= garSteps; gsi++) {
        var gf = gsi / garSteps;
        var gx2 = cx - 96 + gf * 192;
        var gy2 = glY + 4 * gf * (1 - gf) * glSag;
        ctx.beginPath(); ctx.arc(gx2, gy2, 5, 0, Math.PI * 2);
        ctx.fillStyle = gsi % 2 === 0 ? G.COL.marigold : G.COL.saffron; ctx.fill();
        ctx.beginPath(); ctx.arc(gx2, gy2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFEEAA'; ctx.fill();
      }
    }

    // ── Torana arch above the door (marigold flower arch) ─────────────
    var toranaSag = 16 + Math.sin(t * 0.4) * 4;
    ctx.beginPath();
    ctx.moveTo(cx - 80, groundY - 390);
    ctx.quadraticCurveTo(cx, groundY - 390 + toranaSag, cx + 80, groundY - 390);
    ctx.strokeStyle = '#F28C28'; ctx.lineWidth = 5; ctx.stroke();
    // Torana flowers
    for (var tf = 0; tf <= 6; tf++) {
      var tfrac = tf / 6;
      var tx2 = cx - 80 + tfrac * 160;
      var ty2 = groundY - 390 + 4 * tfrac * (1 - tfrac) * toranaSag;
      ctx.beginPath(); ctx.arc(tx2, ty2, 7, 0, Math.PI * 2);
      ctx.fillStyle = tf % 2 === 0 ? G.COL.marigold : '#FF6622'; ctx.fill();
      ctx.beginPath(); ctx.arc(tx2, ty2, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFEEAA'; ctx.fill();
    }

    // ── Door frame and gold surround ──────────────────────────────────
    // Gold outer frame
    ctx.beginPath();
    ctx.rect(cx - 86, groundY - 388, 172, 362);
    ctx.fillStyle = '#4A3010'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, groundY - 388, 86, Math.PI, 0);
    ctx.fillStyle = '#4A3010'; ctx.fill();
    // Gold arch ring
    ctx.beginPath(); ctx.arc(cx, groundY - 388, 86, Math.PI, 0);
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - 86, groundY - 388, 172, 362);
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 4; ctx.stroke();

    // Warm light leaking around door edges (glowing seams)
    var leakAlpha = 0.30 + flicker;
    ctx.save(); ctx.globalAlpha = leakAlpha;
    var leakGrad = ctx.createLinearGradient(cx - 86, 0, cx - 72, 0);
    leakGrad.addColorStop(0, 'rgba(255,180,60,0.9)');
    leakGrad.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = leakGrad;
    ctx.fillRect(cx - 88, groundY - 390, 16, 364);
    var leakGradR = ctx.createLinearGradient(cx + 86, 0, cx + 72, 0);
    leakGradR.addColorStop(0, 'rgba(255,180,60,0.9)');
    leakGradR.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = leakGradR;
    ctx.fillRect(cx + 72, groundY - 390, 16, 364);
    ctx.restore();

    // Warm floor glow from door light
    var floorGlow = ctx.createRadialGradient(cx, groundY - 26, 10, cx, groundY - 26, 120);
    floorGlow.addColorStop(0, 'rgba(255,200,80,' + (0.22 + flicker) + ')');
    floorGlow.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.beginPath(); ctx.ellipse(cx, groundY - 26, 120, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = floorGlow; ctx.fill();

    // ── Door panels — dark carved wood ────────────────────────────────
    // Two door halves
    for (var dh = -1; dh <= 1; dh += 2) {
      var dhx = cx + dh * 40;
      // Door face
      ctx.beginPath();
      ctx.rect(dhx - 38, groundY - 382, 76, 356);
      ctx.fillStyle = '#3A2010'; ctx.fill();
      // Carved panel insets (3 per half)
      for (var dp = 0; dp < 3; dp++) {
        var dpy = groundY - 360 + dp * 110;
        ctx.beginPath(); ctx.rect(dhx - 28, dpy, 56, 90); ctx.fillStyle = '#2E1808'; ctx.fill();
        ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 1.5; ctx.stroke();
        // Panel motif: a simple diamond
        ctx.beginPath();
        ctx.moveTo(dhx, dpy + 8); ctx.lineTo(dhx + 20, dpy + 45);
        ctx.lineTo(dhx, dpy + 82); ctx.lineTo(dhx - 20, dpy + 45);
        ctx.closePath(); ctx.strokeStyle = 'rgba(255,200,80,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      // Brass studs (4x4 grid per half)
      ctx.fillStyle = G.COL.goldDark;
      for (var sr = 0; sr < 4; sr++) {
        for (var sc2 = 0; sc2 < 2; sc2++) {
          var sx = dhx - 22 + sc2 * 44;
          var sy = groundY - 370 + sr * 90;
          ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fillStyle = G.COL.goldLight; ctx.fill();
          ctx.fillStyle = G.COL.goldDark;
        }
      }
    }
    // Arch panel (top)
    ctx.beginPath(); ctx.arc(cx, groundY - 388, 78, Math.PI, 0);
    ctx.fillStyle = '#2E1808'; ctx.fill();
    // Arch decoration: concentric arcs
    for (var ar2 = 0; ar2 < 3; ar2++) {
      ctx.beginPath(); ctx.arc(cx, groundY - 388, 68 - ar2 * 16, Math.PI, 0);
      ctx.strokeStyle = 'rgba(255,200,80,' + (0.4 - ar2 * 0.1) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // ── drawShivaSilhouette(ctx, x, groundY, alpha) ───────────────────────────
  // Small distant silhouette of Shiva walking calmly on a path.
  // Used far-right in slide 1 (anticipation, no drama).
  function drawShivaSilhouette(ctx, x, groundY, alpha, t) {
    alpha = alpha !== undefined ? alpha : 0.55;
    var bob = Math.sin(t * 1.2) * 1.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, groundY + bob);
    ctx.scale(0.45, 0.45);  // small and distant

    // Soft glow behind the silhouette
    var sg = ctx.createRadialGradient(0, -80, 10, 0, -80, 70);
    sg.addColorStop(0, 'rgba(255,220,120,0.35)');
    sg.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.beginPath(); ctx.arc(0, -80, 70, 0, Math.PI * 2);
    ctx.fillStyle = sg; ctx.fill();

    // Simple dark silhouette: dhoti + tall jata + trishul beside
    // Dhoti oval
    ctx.beginPath(); ctx.ellipse(0, -20, 18, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0A00'; ctx.fill();
    // Torso
    ctx.beginPath(); ctx.ellipse(0, -55, 13, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0A00'; ctx.fill();
    // Head
    ctx.beginPath(); ctx.ellipse(0, -82, 12, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0A00'; ctx.fill();
    // Jata (tall top-knot bump)
    ctx.beginPath(); ctx.moveTo(-8, -90); ctx.bezierCurveTo(-8, -114, 8, -114, 8, -90);
    ctx.fillStyle = '#1A0A00'; ctx.fill();
    // Trishul line (simple vertical + 3 tips)
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(22, -110);
    ctx.strokeStyle = 'rgba(255,210,80,0.65)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -110); ctx.lineTo(18, -126); ctx.lineTo(22, -122);
    ctx.lineTo(26, -126); ctx.lineTo(22, -110);
    ctx.strokeStyle = 'rgba(255,210,80,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── drawElephantHeadOfLight(ctx, cx, cy, progress, t) ────────────────────
  // For slide 2: a glowing elephant-head silhouette assembles above the boy
  // then "settles" down as progress goes 0→1.  progress = _storySlideT / 3.
  function drawElephantHeadOfLight(ctx, cx, cy, progress, t) {
    var prog = Math.max(0, Math.min(1, progress));
    if (prog <= 0) return;

    var alpha = Math.min(1, prog * 1.5);
    // Position: starts 80px above centre, drifts down to cy as progress→1
    var headY = cy - 80 * (1 - prog);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, headY);

    // Pulse ring
    var pulse = 0.7 + Math.sin(t * 3) * 0.15;
    var size = (prog < 0.5) ? prog * 2 : 1;  // scale in from 0 to 1

    ctx.scale(size * 1.8, size * 1.8);

    // Outer light aura
    var aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
    aura.addColorStop(0,   'rgba(255,230,80,' + pulse * 0.6 + ')');
    aura.addColorStop(0.5, 'rgba(255,180,40,' + pulse * 0.3 + ')');
    aura.addColorStop(1,   'rgba(255,160,20,0)');
    ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fillStyle = aura; ctx.fill();

    // Petal ring orbiting the head (8 petals)
    for (var pi4 = 0; pi4 < 8; pi4++) {
      var pa = (pi4 / 8) * Math.PI * 2 + t * 1.2;
      var pr = 44;
      ctx.save();
      ctx.translate(Math.cos(pa) * pr, Math.sin(pa) * pr * 0.5);
      ctx.rotate(pa);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = pi4 % 2 === 0 ? G.COL.goldLight : G.COL.marigold;
      ctx.fill();
      ctx.restore();
    }

    // Head shape (light silhouette: round head + big ears + trunk suggestion)
    ctx.fillStyle = 'rgba(255,230,100,' + (pulse * 0.8) + ')';
    // Main head
    ctx.beginPath(); ctx.ellipse(0, -4, 24, 22, 0, 0, Math.PI * 2); ctx.fill();
    // Left ear
    ctx.beginPath(); ctx.ellipse(-28, -6, 14, 18, -0.25, 0, Math.PI * 2); ctx.fill();
    // Right ear
    ctx.beginPath(); ctx.ellipse(28, -6, 14, 18, 0.25, 0, Math.PI * 2); ctx.fill();
    // Trunk curl
    ctx.beginPath();
    ctx.moveTo(6, 12);
    ctx.bezierCurveTo(18, 22, 22, 34, 14, 38);
    ctx.bezierCurveTo(8, 42, 4, 38, 6, 34);
    ctx.strokeStyle = 'rgba(255,230,100,' + (pulse * 0.8) + ')';
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  // ── drawNightCourtyard(ctx, groundY, accentColor, t) ─────────────────────
  // Warm amber-to-indigo night sky + courtyard floor used by slides 3 and 4.
  // accentColor changes the horizon glow tint per slide.
  function drawNightCourtyard(ctx, groundY, accentColor, t) {
    accentColor = accentColor || '#C87020';
    // Sky gradient
    var skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0,   '#1B1F4B');
    skyGrad.addColorStop(0.55,'#2D1F5E');
    skyGrad.addColorStop(0.85,'#5A3010');
    skyGrad.addColorStop(1,    accentColor);
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, G.W, groundY);

    // Stars in upper half
    drawStars(ctx, 0, groundY * 0.55, t);

    // Warm horizon glow
    var hGlow = ctx.createLinearGradient(0, groundY - 60, 0, groundY);
    hGlow.addColorStop(0, 'rgba(200,120,20,0)');
    hGlow.addColorStop(1, 'rgba(200,120,20,0.35)');
    ctx.fillStyle = hGlow; ctx.fillRect(0, groundY - 60, G.W, 60);

    // Courtyard floor
    var floorGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 200);
    floorGrad.addColorStop(0, '#5A3A1A');
    floorGrad.addColorStop(1, '#2A1808');
    ctx.fillStyle = floorGrad; ctx.fillRect(0, groundY, G.W, G.H - groundY);

    // Subtle stone tile lines on floor
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (var tfx = 0; tfx < G.W; tfx += 100) {
      ctx.beginPath(); ctx.moveTo(tfx, groundY); ctx.lineTo(tfx, groundY + 200); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, groundY + 40); ctx.lineTo(G.W, groundY + 40); ctx.stroke();
  }

  // ── drawModakPlateTable(ctx, cx, groundY, t) ─────────────────────────────
  // A long low wooden table with a brass plate of 6-7 golden modaks and steam.
  // (cx, groundY) = centre-bottom of the table.
  function drawModakPlateTable(ctx, cx, groundY, t) {
    // Table legs
    for (var tl = -1; tl <= 1; tl += 2) {
      ctx.beginPath(); ctx.rect(cx + tl * 120 - 7, groundY - 38, 14, 38);
      ctx.fillStyle = '#6A3A10'; ctx.fill();
      ctx.strokeStyle = '#3A1808'; ctx.lineWidth = 1; ctx.stroke();
    }
    // Table top
    ctx.beginPath(); ctx.rect(cx - 145, groundY - 46, 290, 16);
    ctx.fillStyle = '#8B5020'; ctx.fill();
    ctx.strokeStyle = '#4A2808'; ctx.lineWidth = 1.5; ctx.stroke();
    // Wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.8;
    for (var wg = cx - 130; wg < cx + 130; wg += 18) {
      ctx.beginPath(); ctx.moveTo(wg, groundY - 46); ctx.lineTo(wg + 4, groundY - 30); ctx.stroke();
    }
    // Table front face
    ctx.beginPath(); ctx.rect(cx - 145, groundY - 30, 290, 10);
    ctx.fillStyle = '#6A3A10'; ctx.fill();

    // ── Brass plate ───────────────────────────────────────────────────
    // Plate ellipse (shiny brass)
    var plateY = groundY - 52;
    ctx.beginPath(); ctx.ellipse(cx, plateY, 110, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#C88030'; ctx.fill();
    ctx.strokeStyle = '#7A4808'; ctx.lineWidth = 2; ctx.stroke();
    // Inner rim (lighter)
    ctx.beginPath(); ctx.ellipse(cx, plateY, 100, 21, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E0A040'; ctx.fill();
    // Plate highlight
    ctx.beginPath(); ctx.ellipse(cx - 30, plateY - 6, 30, 8, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,100,0.40)'; ctx.fill();

    // ── 7 modaks arranged on the plate ────────────────────────────────
    // Positions: spread across plate in two rows (5 front, 2 back)
    var mCoords = [
      [-72, 0], [-38, 0], [0, 0], [38, 0], [72, 0],   // front row
      [-28, -14], [28, -14],                             // back row
    ];
    for (var mk = 0; mk < mCoords.length; mk++) {
      var mx = cx + mCoords[mk][0];
      var my = plateY + mCoords[mk][1];
      var msc = mk >= 5 ? 0.8 : 1.0;  // back row slightly smaller
      ctx.save();
      ctx.translate(mx, my);
      ctx.scale(msc, msc);
      // Modak body (cream-gold)
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.bezierCurveTo(12, -16, 14, -4, 9, 4);
      ctx.bezierCurveTo(5, 9, -5, 9, -9, 4);
      ctx.bezierCurveTo(-14, -4, -12, -16, 0, -16);
      ctx.fillStyle = '#F5E8B0'; ctx.fill();
      ctx.strokeStyle = '#9A6820'; ctx.lineWidth = 1; ctx.stroke();
      // Pleat lines (3 ridges)
      ctx.strokeStyle = 'rgba(150,100,20,0.45)'; ctx.lineWidth = 0.9;
      for (var pl2 = -1; pl2 <= 1; pl2++) {
        ctx.beginPath();
        ctx.moveTo(pl2 * 4, -14); ctx.bezierCurveTo(pl2 * 3, -6, pl2 * 2, 0, pl2 * 3, 7);
        ctx.stroke();
      }
      // Top knot
      ctx.beginPath();
      ctx.moveTo(-3, -16); ctx.bezierCurveTo(-5, -22, 5, -22, 3, -16);
      ctx.fillStyle = '#E0A840'; ctx.fill();
      // Sparkle dot on top knot
      var spA = 0.4 + Math.sin(t * 3.5 + mk) * 0.3;
      ctx.beginPath(); ctx.arc(0, -20, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,120,' + spA + ')'; ctx.fill();
      ctx.restore();
    }

    // ── Steam wisps above the plate ────────────────────────────────────
    for (var sw = 0; sw < 5; sw++) {
      var swx = cx - 60 + sw * 30;
      var swPhase = (t * 0.6 + sw * 0.4) % 1;
      var swy = plateY - 10 - swPhase * 55;
      var swA = (1 - swPhase) * 0.35;
      if (swA > 0.04) {
        var swGrad = ctx.createRadialGradient(swx, swy, 1, swx, swy, 12);
        swGrad.addColorStop(0, 'rgba(255,255,255,' + swA + ')');
        swGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(swx, swy, 12, 0, Math.PI * 2);
        ctx.fillStyle = swGrad; ctx.fill();
      }
    }
  }

  // ── drawParvatiDoorway(ctx, x, groundY, t) ────────────────────────────────
  // Warm glowing kitchen doorway with Parvati's soft silhouette inside.
  // (x, groundY) = centre-bottom of the doorway.
  function drawParvatiDoorway(ctx, x, groundY, t) {
    var flicker = 0.70 + Math.sin(t * 2.3) * 0.12;

    // Wall section
    ctx.beginPath(); ctx.rect(x - 90, groundY - 340, 180, 340);
    ctx.fillStyle = '#6A5848'; ctx.fill();
    // Stone texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.8;
    for (var sw2 = groundY - 320; sw2 < groundY; sw2 += 28) {
      ctx.beginPath(); ctx.moveTo(x - 90, sw2); ctx.lineTo(x + 90, sw2); ctx.stroke();
    }

    // Door arch opening (kitchen glow fills it)
    var kitchenGlow = ctx.createRadialGradient(x, groundY - 140, 10, x, groundY - 140, 85);
    kitchenGlow.addColorStop(0, 'rgba(255,200,80,' + flicker + ')');
    kitchenGlow.addColorStop(0.6, 'rgba(220,140,40,' + (flicker * 0.6) + ')');
    kitchenGlow.addColorStop(1, 'rgba(180,80,10,0)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 55, groundY - 270, 110, 270);
    ctx.arc(x, groundY - 270, 55, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = kitchenGlow; ctx.fill();
    ctx.restore();

    // Door frame (dark carved wood)
    ctx.beginPath(); ctx.rect(x - 58, groundY - 272, 116, 272);
    ctx.fillStyle = '#2E1808'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, groundY - 272, 58, Math.PI, 0);
    ctx.fillStyle = '#2E1808'; ctx.fill();
    // Frame outline gold
    ctx.strokeStyle = G.COL.goldDark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(x - 58, groundY - 272, 116, 272); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, groundY - 272, 58, Math.PI, 0); ctx.stroke();

    // Opening inside
    ctx.beginPath(); ctx.rect(x - 52, groundY - 268, 104, 268);
    ctx.fillStyle = 'rgba(200,130,40,' + (flicker * 0.8) + ')'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, groundY - 268, 52, Math.PI, 0);
    ctx.fillStyle = 'rgba(200,130,40,' + (flicker * 0.8) + ')'; ctx.fill();

    // Parvati silhouette inside — simple, just a shape, no detail (distance)
    ctx.save();
    ctx.translate(x - 5, groundY);
    ctx.globalAlpha = 0.65;
    // Saree skirt
    ctx.beginPath(); ctx.ellipse(0, -60, 22, 60, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0808'; ctx.fill();
    // Torso
    ctx.beginPath(); ctx.ellipse(0, -130, 14, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0808'; ctx.fill();
    // Head
    ctx.beginPath(); ctx.ellipse(0, -168, 14, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0808'; ctx.fill();
    // Hair bun
    ctx.beginPath(); ctx.ellipse(0, -182, 9, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0808'; ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Torana garland above door
    var torSag = 12 + Math.sin(t * 0.5) * 2;
    ctx.beginPath();
    ctx.moveTo(x - 56, groundY - 272);
    ctx.quadraticCurveTo(x, groundY - 272 + torSag, x + 56, groundY - 272);
    ctx.strokeStyle = G.COL.marigold; ctx.lineWidth = 3; ctx.stroke();
    for (var tg = 0; tg <= 5; tg++) {
      var tgf = tg / 5;
      var tgx = x - 56 + tgf * 112;
      var tgy = groundY - 272 + 4 * tgf * (1 - tgf) * torSag;
      ctx.beginPath(); ctx.arc(tgx, tgy, 5, 0, Math.PI * 2);
      ctx.fillStyle = tg % 2 === 0 ? G.COL.marigold : G.COL.saffron; ctx.fill();
    }

    // Floor glow spilling from doorway
    var fgGlow = ctx.createRadialGradient(x, groundY, 2, x, groundY, 80);
    fgGlow.addColorStop(0, 'rgba(255,180,60,' + (flicker * 0.35) + ')');
    fgGlow.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.beginPath(); ctx.ellipse(x, groundY + 10, 80, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = fgGlow; ctx.fill();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    drawSky:                 drawSky,
    drawStars:               drawStars,
    drawMoon:                drawMoon,
    drawGlow:                drawGlow,
    drawMountainRange:       drawMountainRange,
    drawKailashHome:         drawKailashHome,
    drawDiya:                drawDiya,
    drawMarigoldGarland:     drawMarigoldGarland,
    drawFloatingPetals:      drawFloatingPetals,
    drawMandala:             drawMandala,
    drawOrnateGateDoor:      drawOrnateGateDoor,
    drawShivaSilhouette:     drawShivaSilhouette,
    drawElephantHeadOfLight: drawElephantHeadOfLight,
    drawModakPlateTable:     drawModakPlateTable,
    drawParvatiDoorway:      drawParvatiDoorway,
    drawNightCourtyard:      drawNightCourtyard,
  };

}());
