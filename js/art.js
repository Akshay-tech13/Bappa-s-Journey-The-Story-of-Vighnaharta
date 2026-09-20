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

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  BAL GANESHA — redrawn chibi children's-book style              ║
  // ║  Signature: drawGanesha(ctx, x, y, t, opts)                     ║
  // ║  opts = { state, dir, scale, squash }                           ║
  // ║  All call-sites unchanged. Scale 1 ≈ 110 px tall.               ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // ── Helper: warm dark-brown outlined stroke on current path ───────────
  function _gnOutline(ctx, w) {
    ctx.strokeStyle = C.outline;
    ctx.lineWidth   = w || 1.8;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // ── Helper: gold radial gradient (crown, jewels) ──────────────────────
  function _gnGoldGrad(ctx, cx, cy, r) {
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1,
                                     cx, cy, r);
    g.addColorStop(0, C.goldLight);
    g.addColorStop(1, C.goldDark);
    return g;
  }

  // ── Feet + legs (short chibi legs, gold anklets) ─────────────────────
  function _gnFeet(ctx, legSwing, state) {
    // Two small round feet with a stub leg
    var lSwing = (state === 'walk') ? legSwing : 0;

    // Left leg/foot
    ctx.save();
    ctx.translate(-9, 0);
    ctx.rotate(-lSwing * 0.18);
    roundRect(ctx, -5, -16, 10, 14, 5, C.peachSkin);
    // Shade on leg
    ctx.fillStyle = C.peachShade;
    ctx.beginPath();
    ctx.ellipse(2, -10, 3, 5, 0.2, 0, Math.PI * 2); ctx.fill();
    // Foot
    ellipse(ctx, 0, 0, 8, 5, C.peachSkin);
    // Anklet
    ctx.beginPath();
    ctx.arc(0, -1, 7, Math.PI * 0.9, Math.PI * 2.1);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // Right leg/foot
    ctx.save();
    ctx.translate(9, 0);
    ctx.rotate(lSwing * 0.18);
    roundRect(ctx, -5, -16, 10, 14, 5, C.peachSkin);
    ctx.fillStyle = C.peachShade;
    ctx.beginPath();
    ctx.ellipse(-2, -10, 3, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    ellipse(ctx, 0, 0, 8, 5, C.peachSkin);
    ctx.beginPath();
    ctx.arc(0, -1, 7, Math.PI * 0.9, Math.PI * 2.1);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // ── Dhoti body + belly ────────────────────────────────────────────────
  function _gnDhotiBody(ctx, state, t) {
    // Dhoti: saffron dome from waist to knees
    ctx.beginPath();
    ctx.moveTo(-22, -16);
    ctx.bezierCurveTo(-26, -30, -22, -46, 0, -46);
    ctx.bezierCurveTo(22, -46, 26, -30, 22, -16);
    ctx.quadraticCurveTo(0, -10, -22, -16);
    ctx.closePath();
    ctx.fillStyle = '#F26B38';
    ctx.fill();
    _gnOutline(ctx, 1.5);

    // Three curved pleat lines on dhoti
    ctx.strokeStyle = 'rgba(140,50,10,0.35)';
    ctx.lineWidth = 1.2;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, -18);
      ctx.quadraticCurveTo(i * 6, -32, i * 4, -44);
      ctx.stroke();
    }

    // Maroon + gold hem border at the bottom of dhoti
    ctx.beginPath();
    ctx.moveTo(-22, -16);
    ctx.quadraticCurveTo(0, -8, 22, -16);
    ctx.strokeStyle = C.dhotiBdr; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22, -16);
    ctx.quadraticCurveTo(0, -8, 22, -16);
    ctx.strokeStyle = C.goldLight; ctx.lineWidth = 1.2; ctx.stroke();

    // Gold waist sash
    ctx.beginPath();
    ctx.moveTo(-20, -46);
    ctx.quadraticCurveTo(0, -50, 20, -46);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, -46);
    ctx.quadraticCurveTo(0, -50, 20, -46);
    ctx.strokeStyle = C.goldLight; ctx.lineWidth = 1.5; ctx.stroke();

    // Round belly (chibi proportions — big round tummy)
    var bellyBounce = (state === 'walk') ? Math.sin(t * 5) * 1.2 : 0;
    ctx.beginPath();
    ctx.ellipse(0, -58 + bellyBounce, 17, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
    _gnOutline(ctx, 1.5);
    // Belly shade (lower edge)
    ctx.beginPath();
    ctx.ellipse(0, -52 + bellyBounce, 13, 6, 0, 0, Math.PI);
    ctx.fillStyle = C.peachShade; ctx.fill();
    // Navel
    circle(ctx, 0, -56 + bellyBounce, 2.5, C.peachShade);
    circle(ctx, 0, -56 + bellyBounce, 1, C.peachSkin);

    // Chest / torso (connects belly to neck)
    ctx.beginPath();
    ctx.ellipse(0, -70, 13, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
    // Chest highlight
    ctx.beginPath();
    ctx.ellipse(-3, -74, 6, 5, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.peachHi; ctx.fill();

    // Sacred thread (janeu) — thin diagonal gold line
    ctx.beginPath();
    ctx.moveTo(-10, -62);
    ctx.quadraticCurveTo(0, -68, 10, -78);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 1.5; ctx.stroke();

    // Gold necklace with small pendant
    ctx.beginPath();
    ctx.arc(0, -76, 9, Math.PI * 1.15, Math.PI * 1.85);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2; ctx.stroke();
    circle(ctx, 0, -67, 3, C.goldLight);
    circle(ctx, 0, -67, 1.5, C.goldDark);
  }

  // ── Arms (right = modak side, left = blessing/idle) ───────────────────
  function _gnArms(ctx, state, t) {
    var swing    = (state === 'walk')      ? Math.sin(t * 5) * 10 : 0;
    var celebrate = (state === 'celebrate');

    // Gold armband helper (drawn after the arm shape)
    function armband(cy) {
      ctx.beginPath();
      ctx.arc(0, cy, 5, 0, Math.PI * 2);
      ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2.5; ctx.stroke();
    }

    // Right arm — holds modak (dir = 1 = right side)
    ctx.save();
    ctx.translate(17, -68 - (celebrate ? 10 : 0) + swing);
    ctx.rotate(celebrate ? -0.9 : 0.35);
    // Upper arm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(5, 4, 6, 14, 4, 22);
    ctx.bezierCurveTo(-2, 22, -6, 14, -4, 6);
    ctx.closePath();
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    // Shade on arm
    ctx.fillStyle = C.peachShade;
    ctx.beginPath(); ctx.ellipse(2, 12, 2.5, 5, 0.2, 0, Math.PI * 2); ctx.fill();
    armband(-2);
    // Hand (round palm + 4 finger bumps)
    ctx.fillStyle = C.peachSkin;
    ctx.beginPath(); ctx.ellipse(0, 26, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    _gnOutline(ctx, 1.5);
    // Bracelet
    ctx.beginPath(); ctx.arc(0, 20, 5, 0, Math.PI * 2);
    ctx.strokeStyle = C.goldLight; ctx.lineWidth = 2; ctx.stroke();
    // Finger bumps
    ctx.fillStyle = C.peachSkin;
    for (var fi = -3; fi <= 3; fi += 2) {
      ctx.beginPath(); ctx.arc(fi, 30, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // Modak in hand
    ctx.save();
    ctx.translate(0, 36); ctx.scale(0.65, 0.65);
    _drawModakShape(ctx, 0, 0);
    ctx.restore();
    ctx.restore();

    // Left arm — blessing gesture (palm out) or at side
    var bless = (state === 'bless' || state === 'celebrate');
    ctx.save();
    ctx.translate(-17, -68 - (celebrate ? 10 : 0) - swing);
    ctx.rotate(bless ? -0.9 : -0.35);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-5, 4, -6, 14, -4, 22);
    ctx.bezierCurveTo(2, 22, 6, 14, 4, 6);
    ctx.closePath();
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    ctx.fillStyle = C.peachShade;
    ctx.beginPath(); ctx.ellipse(-2, 12, 2.5, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    armband(-2);
    // Open palm (blessing) or relaxed fist
    ctx.fillStyle = C.peachSkin;
    ctx.beginPath(); ctx.ellipse(0, 26, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    _gnOutline(ctx, 1.5);
    ctx.beginPath(); ctx.arc(0, 20, 5, 0, Math.PI * 2);
    ctx.strokeStyle = C.goldLight; ctx.lineWidth = 2; ctx.stroke();
    if (bless) {
      // Upward-pointing fingers for blessing
      for (var bf = -3; bf <= 3; bf += 2) {
        ctx.fillStyle = C.peachSkin;
        ctx.beginPath(); ctx.arc(bf, 20, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // Relaxed — finger bumps at bottom of palm
      for (var rf = -3; rf <= 3; rf += 2) {
        ctx.fillStyle = C.peachSkin;
        ctx.beginPath(); ctx.arc(rf, 30, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // Blessing glow ring when in bless state
    if (state === 'bless') {
      var bPulse = 0.5 + Math.sin(t * 4) * 0.3;
      var bg = ctx.createRadialGradient(-17, -90, 4, -17, -90, 28);
      bg.addColorStop(0, 'rgba(255,216,107,' + bPulse + ')');
      bg.addColorStop(1, 'rgba(255,216,107,0)');
      ctx.beginPath(); ctx.arc(-17, -90, 28, 0, Math.PI * 2);
      ctx.fillStyle = bg; ctx.fill();
    }
  }

  // ── Ears (large fan ears with flap animation) ─────────────────────────
  function _gnEars(ctx, t) {
    // Gentle idle ear-flap
    var flapR =  Math.sin(t * 1.8) * 0.05;  // right ear rotation
    var flapL = -Math.sin(t * 1.8) * 0.05;  // left ear mirrors

    // RIGHT ear (from viewer = character's left when dir=1)
    ctx.save();
    ctx.translate(22, -92);
    ctx.rotate(flapR);
    // Outer fan shape (scalloped top approximated with bezier)
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(18, 6, 22, -8, 18, -20);
    ctx.bezierCurveTo(14, -30, 4, -32, -2, -28);
    ctx.bezierCurveTo(-10, -24, -12, -12, -8, 0);
    ctx.bezierCurveTo(-6, 6, -2, 10, 0, 10);
    ctx.closePath();
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    // Darker shade on outer rim
    ctx.fillStyle = C.peachShade;
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(14, 4, 18, -6, 15, -18);
    ctx.bezierCurveTo(13, -28, 5, -30, 0, -26);
    ctx.bezierCurveTo(-4, 8, 0, 8, 0, 8); ctx.closePath(); ctx.fill();
    // Inner ear (soft pink, smaller)
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(10, 2, 14, -6, 10, -16);
    ctx.bezierCurveTo(7, -24, 0, -24, -3, -18);
    ctx.bezierCurveTo(-7, -10, -6, 0, 0, 4);
    ctx.closePath();
    ctx.fillStyle = C.innerEar; ctx.fill();
    // Inner ear darker rim line
    ctx.strokeStyle = '#D4707A'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    // LEFT ear (mirror)
    ctx.save();
    ctx.translate(-22, -92);
    ctx.rotate(flapL);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-18, 6, -22, -8, -18, -20);
    ctx.bezierCurveTo(-14, -30, -4, -32, 2, -28);
    ctx.bezierCurveTo(10, -24, 12, -12, 8, 0);
    ctx.bezierCurveTo(6, 6, 2, 10, 0, 10);
    ctx.closePath();
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    ctx.fillStyle = C.peachShade;
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, 4, -18, -6, -15, -18);
    ctx.bezierCurveTo(-13, -28, -5, -30, 0, -26);
    ctx.bezierCurveTo(4, 8, 0, 8, 0, 8); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-10, 2, -14, -6, -10, -16);
    ctx.bezierCurveTo(-7, -24, 0, -24, 3, -18);
    ctx.bezierCurveTo(7, -10, 6, 0, 0, 4);
    ctx.closePath();
    ctx.fillStyle = C.innerEar; ctx.fill();
    ctx.strokeStyle = '#D4707A'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  // ── Head (round elephant head, eyes, trunk, tusk, face markings) ──────
  function _gnHead(ctx, state, t) {
    // Base head shape — wide rounded
    ctx.beginPath();
    ctx.ellipse(0, -92, 24, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 2);

    // Forehead highlight
    ctx.beginPath();
    ctx.ellipse(-4, -100, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.peachHi; ctx.fill();

    // Chin shade
    ctx.beginPath();
    ctx.ellipse(2, -76, 10, 5, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = C.peachShade; ctx.fill();

    // Blush circles on cheeks
    ctx.globalAlpha = 0.55;
    circle(ctx, -14, -84, 7, C.blush);
    circle(ctx,  14, -84, 7, C.blush);
    ctx.globalAlpha = 1;

    // Eyes — big round dark-brown with white catchlight
    // Blink every ~3.5 s for 0.12 s
    var blinkPhase = (t * 0.28) % 1;   // 0-1 cycle
    var isBlinking = (blinkPhase > 0.93);
    var eyeRY = isBlinking ? 1 : 4.5;

    // Left eye
    circle(ctx, -9, -93, 5.5, C.white);
    ctx.beginPath();
    ctx.ellipse(-9, -93, 4, eyeRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2A1408'; ctx.fill();
    if (!isBlinking) {
      circle(ctx, -7, -95, 1.5, C.white);  // top-right catchlight
    }
    // Left eyebrow (slightly raised = friendly)
    ctx.beginPath();
    ctx.moveTo(-14, -99); ctx.quadraticCurveTo(-9, -102, -4, -99);
    ctx.strokeStyle = '#4A2808'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();

    // Right eye
    circle(ctx, 9, -93, 5.5, C.white);
    ctx.beginPath();
    ctx.ellipse(9, -93, 4, eyeRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2A1408'; ctx.fill();
    if (!isBlinking) {
      circle(ctx, 11, -95, 1.5, C.white);
    }
    // Right eyebrow
    ctx.beginPath();
    ctx.moveTo(4, -99); ctx.quadraticCurveTo(9, -102, 14, -99);
    ctx.strokeStyle = '#4A2808'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();

    // Small smile crease beside trunk base
    if (state === 'celebrate') {
      ctx.beginPath();
      ctx.arc(8, -84, 5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.strokeStyle = '#8B4020'; ctx.lineWidth = 1.8; ctx.stroke();
    }

    // Trunk: starts wide between eyes, S-curve to the right, rounded tip
    // Underside darker for depth
    ctx.beginPath();
    ctx.moveTo(-4, -78);
    ctx.bezierCurveTo(-6, -72,  2, -62,  8, -60);  // S upper arc
    ctx.bezierCurveTo(14, -58, 16, -50, 12, -44);  // curve out
    ctx.bezierCurveTo( 8, -40,  2, -42,  0, -46);  // curl back left
    ctx.bezierCurveTo(-3, -50, -1, -54,  2, -54);  // tip curl
    ctx.strokeStyle = C.peachSkin;
    ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
    // Underside shade (narrower, darker)
    ctx.beginPath();
    ctx.moveTo(-3, -78);
    ctx.bezierCurveTo(-5, -72, 3, -63, 9, -61);
    ctx.bezierCurveTo(15, -59, 17, -51, 12, -44);
    ctx.strokeStyle = C.peachShade;
    ctx.lineWidth = 4; ctx.stroke();
    // Three faint wrinkle lines across trunk
    ctx.strokeStyle = 'rgba(200,150,100,0.35)';
    ctx.lineWidth = 1.2;
    var twrinkle = [[-1, -70, 7, -70], [5, -58, 14, -56], [8, -47, 14, -46]];
    for (var tw = 0; tw < twrinkle.length; tw++) {
      ctx.beginPath();
      ctx.moveTo(twrinkle[tw][0], twrinkle[tw][1]);
      ctx.lineTo(twrinkle[tw][2], twrinkle[tw][3]);
      ctx.stroke();
    }
    // Rounded tip dot
    circle(ctx, 2, -53, 4.5, C.peachShade);
    circle(ctx, 3, -55, 2.5, C.peachSkin);

    // One small ivory tusk beside trunk base (short, slightly curved)
    ctx.beginPath();
    ctx.moveTo(6, -80);
    ctx.quadraticCurveTo(14, -76, 13, -68);
    ctx.strokeStyle = C.ivoryTusk; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    // Tusk shading line
    ctx.beginPath();
    ctx.moveTo(7, -79);
    ctx.quadraticCurveTo(13, -76, 12, -70);
    ctx.strokeStyle = '#D4C89A'; ctx.lineWidth = 1.5; ctx.stroke();

    // Tilak mark: red-orange U-shape with dot on forehead
    ctx.save();
    ctx.translate(0, -104);
    // U shape
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.bezierCurveTo(-5, 2, -3, 5, 0, 5);
    ctx.bezierCurveTo(3, 5, 5, 2, 4, -2);
    ctx.strokeStyle = '#C03010'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
    // Centre dot
    circle(ctx, 0, -4, 2, '#C03010');
    ctx.restore();
  }

  // ── Crown (tall 3-tier mukut) ─────────────────────────────────────────
  function _gnCrown(ctx, t) {
    // Three tiers: bottom widest → top narrowest
    var tiers = [
      { w: 28, h: 8,  y: -110, r: 4 },
      { w: 22, h: 7,  y: -118, r: 3 },
      { w: 14, h: 8,  y: -125, r: 3 },
    ];

    // Draw tiers back to front (bottom first)
    for (var ti = 0; ti < tiers.length; ti++) {
      var tr = tiers[ti];
      var grad = _gnGoldGrad(ctx, 0, tr.y, tr.w);
      roundRect(ctx, -tr.w / 2, tr.y, tr.w, tr.h, tr.r, null);
      ctx.fillStyle = grad; ctx.fill(); _gnOutline(ctx, 1.5);
    }

    // Scalloped base band (decorative arc row)
    ctx.fillStyle = C.goldDark;
    for (var sc2 = -3; sc2 <= 3; sc2++) {
      ctx.beginPath(); ctx.arc(sc2 * 4.5, -110, 3, Math.PI, 0); ctx.fill();
    }

    // Row of small pearl dots on first tier
    for (var pe = -3; pe <= 3; pe++) {
      circle(ctx, pe * 4.5, -106, 1.5, C.cream);
    }

    // Red ruby in the centre of the second tier
    circle(ctx, 0, -122, 4.5, C.dhotiBdr);
    circle(ctx, 0, -122, 3,   '#D44060');
    circle(ctx, 1, -124, 1,   'rgba(255,200,200,0.8)');  // ruby highlight

    // Tiny top spire
    ctx.beginPath();
    ctx.moveTo(-4, -125);
    ctx.lineTo(0,  -132);
    ctx.lineTo(4,  -125);
    ctx.fillStyle = _gnGoldGrad(ctx, 0, -130, 5); ctx.fill(); _gnOutline(ctx, 1.5);
    circle(ctx, 0, -132, 2.5, C.goldLight);
  }

  // ── Back view (dir='up') — simple dignified back ──────────────────────
  function _gnBackView(ctx, state, t) {
    // Back of dhoti + feet visible
    ctx.beginPath();
    ctx.ellipse(0, -30, 22, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#F26B38'; ctx.fill(); _gnOutline(ctx, 1.5);
    // Dhoti hem border
    ctx.beginPath();
    ctx.moveTo(-20, -14); ctx.quadraticCurveTo(0, -8, 20, -14);
    ctx.strokeStyle = C.dhotiBdr; ctx.lineWidth = 3; ctx.stroke();
    // Feet peeking below
    ellipse(ctx, -9, 0, 8, 5, C.peachSkin);
    ellipse(ctx,  9, 0, 8, 5, C.peachSkin);
    // Back torso
    ctx.beginPath();
    ctx.ellipse(0, -56, 16, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    // Back of crown
    ctx.beginPath();
    ctx.ellipse(0, -92, 24, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 2);
    // Big ears from behind (outline only)
    ctx.beginPath();
    ctx.ellipse(-24, -96, 18, 22, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    ctx.beginPath();
    ctx.ellipse(24, -96, 18, 22, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill(); _gnOutline(ctx, 1.5);
    // Back crown tiers (simplified)
    var bg = _gnGoldGrad(ctx, 0, -116, 14);
    roundRect(ctx, -14, -116, 28, 8, 4, null);
    ctx.fillStyle = bg; ctx.fill(); _gnOutline(ctx, 1.5);
    roundRect(ctx, -10, -124, 20, 7, 3, null);
    ctx.fillStyle = _gnGoldGrad(ctx, 0, -124, 10); ctx.fill(); _gnOutline(ctx, 1.5);
    // Neck
    ctx.beginPath();
    ctx.ellipse(0, -76, 9, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
  }

  // ── Main drawGanesha — public, signature unchanged ─────────────────────
  // Call sites: drawGanesha(ctx, x, y, t, opts)
  // opts.state : 'idle'|'walk'|'celebrate'|'bless'
  // opts.dir   : 1 (right/front) | -1 (left) — mirrors horizontally
  // opts.scale : number (default 1, ≈110 px tall)
  // opts.squash: 0-1 subtle vertical squash
  function drawGanesha(ctx, x, y, t, opts) {
    opts = opts || {};
    var state  = opts.state  || 'idle';
    var dir    = opts.dir    || 1;      // +1 = front/right, -1 = left
    var squash = opts.squash || 0;
    var sc     = (opts.scale || 1) * (1 - squash * 0.08);

    // Animation values
    var bob      = (state === 'idle' || state === 'bless')
                   ? Math.sin(t * 2.0) * 2.5 : 0;
    var celebBob = (state === 'celebrate')
                   ? Math.abs(Math.sin(t * 4.5)) * 7 : 0;
    var walkLean = (state === 'walk') ? Math.sin(t * 5) * 0.055 : 0;
    var legSwing = (state === 'walk') ? Math.sin(t * 5) : 0;

    ovalShadow(ctx, x, y, 26 * sc, 7 * sc);

    ctx.save();
    ctx.translate(x, y + bob - celebBob);
    ctx.scale(dir * sc, sc);
    ctx.rotate(walkLean);

    if (state === 'up' || opts.dir === 0) {
      // Back view — no mirroring needed
      _gnBackView(ctx, state, t);
    } else {
      // Front / side view
      // Draw order: feet → dhoti/body → arms → ears → head/trunk/crown
      _gnFeet(ctx, legSwing, state);
      _gnDhotiBody(ctx, state, t);
      _gnArms(ctx, state, t);
      _gnEars(ctx, t);
      _gnHead(ctx, state, t);
      _gnCrown(ctx, t);
    }

    ctx.restore();
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

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  MAA PARVATI — redrawn graceful motherly style                  ║
  // ║  Signature: drawParvati(ctx, x, y, t, opts)  (UNCHANGED)        ║
  // ║  opts = { scale, dir, pose }                                     ║
  // ║    scale : number (default 1).  At scale 1 ≈ 165 px tall.       ║
  // ║    dir   : 1|-1 OR 'right'|'left'|'up' (back view)              ║
  // ║    pose  : 'idle'|'walk'|'look'|'smile'|'seated'|'bless'        ║
  // ║  (x,y) = centre-bottom between feet.                            ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // ── helper: warm outline stroke on current open path ─────────────────
  function _pvOutline(ctx, w) {
    ctx.strokeStyle = C.outline;
    ctx.lineWidth   = w || 1.8;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // ── helper: gold radial gradient for jewellery ────────────────────────
  function _pvGold(ctx, cx, cy, r) {
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, C.goldLight);
    g.addColorStop(1, C.goldDark);
    return g;
  }

  // ── helper: draw the saree skirt (lower body) ─────────────────────────
  // pose 'seated' draws a flat crossed-legs version instead.
  function _pvSaree(ctx, pose, sway) {
    var isSeated = (pose === 'seated');
    if (isSeated) {
      // Flat oval base for cross-legged sitting
      ctx.beginPath();
      ctx.ellipse(0, -12, 30, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.parSaree;
      ctx.fill();
      _pvOutline(ctx, 1.5);
      // Gold hem border
      ctx.beginPath();
      ctx.ellipse(0, -12, 30, 14, 0, 0, Math.PI * 2);
      ctx.strokeStyle = C.goldDark; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -12, 30, 14, 0, 0, Math.PI * 2);
      ctx.strokeStyle = C.goldLight; ctx.lineWidth = 1; ctx.stroke();
      // Crossed-leg shapes
      ellipse(ctx, -18, -8, 10, 7, C.parSaree);
      ellipse(ctx,  18, -8, 10, 7, C.parSaree);
      // Feet peeking out at the sides
      ellipse(ctx, -26, -6, 7, 4, C.parSkin);
      ellipse(ctx,  26, -6, 7, 4, C.parSkin);
    } else {
      // Standing saree: wide trapezoid/bell from waist to ankle
      var sw = sway; // gentle side sway offset for idle/walk
      ctx.beginPath();
      ctx.moveTo(-22 + sw, -16);
      ctx.bezierCurveTo(-28 + sw, -28, -20, -66, -14, -76);
      ctx.lineTo(14, -76);
      ctx.bezierCurveTo(20, -66, 28 - sw, -28, 22 - sw, -16);
      ctx.quadraticCurveTo(0, -8 + Math.abs(sw) * 0.5, -22 + sw, -16);
      ctx.closePath();
      ctx.fillStyle = C.parSaree;
      ctx.fill();
      _pvOutline(ctx, 1.5);
      // Gold border along hem
      ctx.beginPath();
      ctx.moveTo(-22 + sw, -16);
      ctx.quadraticCurveTo(0, -8 + Math.abs(sw) * 0.5, 22 - sw, -16);
      ctx.strokeStyle = C.goldDark; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-22 + sw, -16);
      ctx.quadraticCurveTo(0, -8 + Math.abs(sw) * 0.5, 22 - sw, -16);
      ctx.strokeStyle = C.goldLight; ctx.lineWidth = 1.2; ctx.stroke();
      // Pleat lines
      ctx.strokeStyle = 'rgba(120,40,0,0.28)'; ctx.lineWidth = 1.2;
      for (var pl = -1; pl <= 1; pl++) {
        ctx.beginPath();
        ctx.moveTo(pl * 6 + sw * 0.3, -18);
        ctx.quadraticCurveTo(pl * 8, -46, pl * 5, -72);
        ctx.stroke();
      }
      // Feet (small, peaking below skirt)
      ellipse(ctx, -10, -2, 7, 4, C.parSkin);
      ellipse(ctx,  10, -2, 7, 4, C.parSkin);
      // Toe highlight
      ellipse(ctx, -12, -2, 3, 2, C.parHi);
      ellipse(ctx,  12, -2, 3, 2, C.parHi);
    }
  }

  // ── helper: blouse (crop top) + waist + pallu drape ──────────────────
  function _pvTorso(ctx, pose) {
    var isSeated = (pose === 'seated');
    var torsoY = isSeated ? -46 : -92;  // waist centre Y

    // Cream-yellow blouse with gold trim
    ctx.beginPath();
    ctx.ellipse(0, torsoY, 13, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.parBlouse;
    ctx.fill();
    _pvOutline(ctx, 1.4);

    // Gold trim strip at blouse hem
    ctx.beginPath();
    ctx.ellipse(0, torsoY + 10, 13, 4, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2.5; ctx.stroke();

    // Shade on torso right side
    ctx.beginPath();
    ctx.ellipse(5, torsoY, 5, 10, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.parShade;
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Pallu drape over left shoulder (diagonal strip)
    ctx.save();
    ctx.translate(-8, torsoY - 6);
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.rect(-4, -20, 9, 26);
    ctx.fillStyle = C.parSaree;
    ctx.fill();
    // Gold border on pallu
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // Gold necklace arc below throat
    ctx.beginPath();
    ctx.arc(0, torsoY - 10, 10, Math.PI * 0.15, Math.PI * 0.85);
    ctx.strokeStyle = _pvGold(ctx, 0, torsoY - 10, 10);
    ctx.lineWidth = 3; ctx.stroke();
    // Pendant dot
    circle(ctx, 0, torsoY - 1, 2.5, C.goldDark);
  }

  // ── helper: neck + head + hair + face ─────────────────────────────────
  // headTurn: fraction -1..1 for 'look' pose; bigSmile for 'smile' pose
  function _pvHead(ctx, t, pose, headTurn, bigSmile, isBack) {
    var isSeated = (pose === 'seated');
    var baseY    = isSeated ? -62 : -108;  // centre-of-head Y

    // --- Back view: simple hair bun only --------------------------------
    if (isBack) {
      // Neck
      ellipse(ctx, 0, baseY + 20, 7, 7, C.parSkin);
      // Head blob
      ellipse(ctx, 0, baseY, 18, 20, C.parSkin);
      // Hair covering the whole head
      ctx.beginPath();
      ctx.ellipse(0, baseY - 2, 18, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.parHair; ctx.fill();
      // Hair braid draping down the back
      ctx.beginPath();
      ctx.moveTo(-4, baseY + 14);
      ctx.bezierCurveTo(-7, baseY + 30, -5, baseY + 50, -3, baseY + 66);
      ctx.bezierCurveTo(-1, baseY + 72, 4, baseY + 72, 4, baseY + 64);
      ctx.bezierCurveTo(5, baseY + 50, 6, baseY + 30, 4, baseY + 14);
      ctx.fillStyle = C.parHair; ctx.fill();
      _pvOutline(ctx, 1.4);
      // Maang tikka chain going up
      ctx.beginPath();
      ctx.moveTo(0, baseY - 18);
      ctx.lineTo(0, baseY - 30);
      ctx.strokeStyle = C.goldDark; ctx.lineWidth = 1.5; ctx.stroke();
      circle(ctx, 0, baseY - 30, 3, C.goldDark);
      return;
    }

    // --- Front / side view -----------------------------------------------
    // Neck
    ellipse(ctx, headTurn * 4, baseY + 22, 7, 8, C.parSkin);
    _pvOutline(ctx, 1.2);
    // Shade on neck
    ellipse(ctx, headTurn * 4 + 3, baseY + 22, 3, 6, C.parShade);
    ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;

    // Hair — main flowing mass behind head
    ctx.beginPath();
    ctx.ellipse(headTurn * 3, baseY - 4, 20, 22, headTurn * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = C.parHair; ctx.fill();
    // Braid tail down the left side
    ctx.beginPath();
    ctx.moveTo(-16 + headTurn * 2, baseY + 16);
    ctx.bezierCurveTo(-22, baseY + 32, -18, baseY + 54, -14, baseY + 68);
    ctx.bezierCurveTo(-12, baseY + 74, -8, baseY + 74, -8, baseY + 66);
    ctx.bezierCurveTo(-6, baseY + 54, -8, baseY + 32, -12, baseY + 14);
    ctx.closePath();
    ctx.fillStyle = C.parHair; ctx.fill();
    _pvOutline(ctx, 1.4);
    // Gold hairpin on braid
    ctx.beginPath();
    ctx.arc(-12, baseY + 32, 4, 0, Math.PI * 2);
    ctx.fillStyle = _pvGold(ctx, -12, baseY + 32, 4); ctx.fill();
    _pvOutline(ctx, 1);

    // Head base (skin)
    ellipse(ctx, headTurn * 3, baseY, 18, 20, C.parSkin);
    _pvOutline(ctx, 1.8);
    // Forehead highlight
    ellipse(ctx, headTurn * 2 - 1, baseY - 8, 8, 6, C.parHi);
    ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
    // Chin shade
    ellipse(ctx, headTurn * 3 + 2, baseY + 14, 7, 5, C.parShade);
    ctx.globalAlpha = 0.30; ctx.fill(); ctx.globalAlpha = 1;

    // Maang tikka: chain from hair parting down to bindi area
    var tikX = headTurn * 3;
    ctx.beginPath();
    ctx.moveTo(tikX, baseY - 18);
    ctx.lineTo(tikX, baseY - 9);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 1.5; ctx.stroke();
    circle(ctx, tikX, baseY - 19, 3.5, C.goldDark);
    // Small jewel at end of chain
    circle(ctx, tikX, baseY - 9, 2.5, C.parSaree);

    // Gold jhumka earrings (hanging drop)
    for (var side = -1; side <= 1; side += 2) {
      var ex = side * 17 + headTurn * 2;
      // Ear
      ellipse(ctx, ex, baseY + 2, 5, 6, C.parSkin);
      _pvOutline(ctx, 1);
      // Jhumka top disc
      ctx.beginPath();
      ctx.arc(ex, baseY + 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = _pvGold(ctx, ex, baseY + 4, 4); ctx.fill();
      _pvOutline(ctx, 1);
      // Jhumka hanging drop
      circle(ctx, ex, baseY + 12, 3, C.goldDark);
      ctx.beginPath();
      ctx.moveTo(ex, baseY + 8);
      ctx.lineTo(ex, baseY + 10);
      ctx.strokeStyle = C.goldDark; ctx.lineWidth = 1.2; ctx.stroke();
    }

    // Bindi (red dot on forehead)
    circle(ctx, headTurn * 3, baseY - 6, 3, C.maroon);

    // Eyes — almond shaped, kind and calm
    // Blink every ~3.5 s: open for 3 s, closed for 0.15 s
    var blinkPhase = (t % 3.5);
    var eyeH = (blinkPhase > 3.35) ? 0.4 : 2.8;  // squish to simulate blink
    var ex0 = headTurn * 3;
    for (var e = -1; e <= 1; e += 2) {
      var eyeX = ex0 + e * 6;
      var eyeY = baseY + 2;
      // White
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 5, eyeH, e * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = C.white; ctx.fill();
      // Iris (warm brown)
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 3, Math.max(0.2, eyeH - 0.8), 0, 0, Math.PI * 2);
      ctx.fillStyle = '#3D1A00'; ctx.fill();
      // Pupil
      circle(ctx, eyeX, eyeY, Math.max(0.1, eyeH * 0.5), '#0D0500');
      // Lash — small arc above eye
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.strokeStyle = '#3D1A00'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // Nose: tiny oval
    ellipse(ctx, ex0, baseY + 8, 2, 1.5, C.parShade);
    ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;

    // Smile
    var smileW = bigSmile ? 10 : 7;
    var smileD = bigSmile ? 5  : 3;
    ctx.beginPath();
    ctx.moveTo(ex0 - smileW, baseY + 13);
    ctx.quadraticCurveTo(ex0, baseY + 13 + smileD, ex0 + smileW, baseY + 13);
    ctx.strokeStyle = '#5A2010'; ctx.lineWidth = 1.8; ctx.stroke();
    // Cheek blush (subtle, kind)
    for (var bk = -1; bk <= 1; bk += 2) {
      ctx.beginPath();
      ctx.ellipse(ex0 + bk * 11, baseY + 12, 5, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.blush; ctx.globalAlpha = 0.32; ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // ── helper: arms + hands ─────────────────────────────────────────────
  // pose drives arm angles; rightHoldsLotus = true draws pink lotus in right hand
  function _pvArms(ctx, pose, t, isSeated, rightHoldsLotus) {
    var torsoY = isSeated ? -46 : -92;
    var walkSwing = (pose === 'walk') ? Math.sin(t * 4) * 0.22 : 0;
    var blessRaise = (pose === 'bless') ? -0.55 : 0;
    var smileRaise = (pose === 'smile') ? -0.25 : 0;

    // LEFT arm (holds lotus)
    var lAngle = -0.22 + walkSwing * 0.5 + smileRaise;
    if (rightHoldsLotus) lAngle = -0.18;
    ctx.save();
    ctx.translate(-13, torsoY - 2);
    ctx.rotate(lAngle);
    // Upper arm
    roundRect(ctx, -5, -4, 10, 22, 5, C.parSkin);
    _pvOutline(ctx, 1.2);
    // Shade
    ctx.beginPath();
    ctx.ellipse(2, 10, 3, 8, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.parShade; ctx.globalAlpha = 0.3; ctx.fill();
    ctx.globalAlpha = 1;
    // Gold bangle
    ctx.beginPath();
    ctx.arc(0, 14, 5, 0, Math.PI * 2);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2.5; ctx.stroke();
    // Forearm
    roundRect(ctx, -4, 18, 8, 18, 4, C.parSkin);
    _pvOutline(ctx, 1);
    // Hand
    ellipse(ctx, 0, 37, 5, 4, C.parSkin);
    _pvOutline(ctx, 1);
    // Lotus in left hand
    _pvLotus(ctx, 0, 44);
    ctx.restore();

    // RIGHT arm (side / bless / smile-hand-to-chest)
    var rAngle = 0.18 - walkSwing * 0.5 + blessRaise + smileRaise * 0.5;
    ctx.save();
    ctx.translate(13, torsoY - 2);
    ctx.rotate(rAngle);
    roundRect(ctx, -5, -4, 10, 22, 5, C.parSkin);
    _pvOutline(ctx, 1.2);
    ctx.beginPath();
    ctx.ellipse(-2, 10, 3, 8, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.parShade; ctx.globalAlpha = 0.3; ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 14, 5, 0, Math.PI * 2);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2.5; ctx.stroke();
    // Forearm (shorter for blessing raise)
    roundRect(ctx, -4, 18, 8, 18, 4, C.parSkin);
    _pvOutline(ctx, 1);
    ellipse(ctx, 0, 37, 5, 4, C.parSkin);
    _pvOutline(ctx, 1);
    // Bless pose: open palm glow
    if (pose === 'bless') {
      ctx.beginPath();
      ctx.arc(0, 37, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,216,80,0.35)'; ctx.fill();
    }
    ctx.restore();
  }

  // ── helper: pink lotus in one hand ────────────────────────────────────
  function _pvLotus(ctx, cx, cy) {
    // Green stem
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 10);
    ctx.strokeStyle = C.lotGreen; ctx.lineWidth = 2; ctx.stroke();
    // Three petals arranged in a fan
    var petalAngles = [-0.5, 0, 0.5];
    for (var p = 0; p < petalAngles.length; p++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(petalAngles[p]);
      ctx.beginPath();
      ctx.ellipse(0, -7, 4, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.lotPink; ctx.fill();
      _pvOutline(ctx, 1);
      ctx.restore();
    }
    // Yellow centre
    circle(ctx, cx, cy - 1, 3.5, C.marigold);
    _pvOutline(ctx, 1);
  }

  // ── Main drawParvati — orchestrates all helpers ───────────────────────
  function drawParvati(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc       = opts.scale || 1;
    // Accept numeric dir (legacy: 1 or -1) or string ('right','left','up')
    var dirRaw   = opts.dir !== undefined ? opts.dir : 'right';
    var isBack   = (dirRaw === 'up');
    var flipX    = (dirRaw === -1 || dirRaw === 'left') ? -1 : 1;
    var pose     = opts.pose || 'idle';
    var isSeated = (pose === 'seated');

    // Animation values
    var bob      = isSeated ? 0 : Math.sin(t * 1.8) * 2.5;   // idle/walk vertical bob
    var sway     = Math.sin(t * 1.8) * (pose === 'walk' ? 3.5 : 1.5); // skirt sway
    var headTurn = 0;
    if (pose === 'look') headTurn = 0.55; // head canted slightly

    // Scale factor — at scale 1, Parvati is ~165 px tall (about 1.5× Ganesha)
    var shadowRx = isSeated ? 32 * sc : 26 * sc;
    ovalShadow(ctx, x, y, shadowRx, 7 * sc);

    ctx.save();
    ctx.translate(x, y + bob * sc);
    ctx.scale(flipX * sc, sc);

    if (isBack) {
      // ── Back view ──────────────────────────────────────────────────
      _pvSaree(ctx, pose, sway);
      _pvTorso(ctx, pose);
      _pvHead(ctx, t, pose, 0, false, true);
    } else {
      // ── Front/side view — draw back-elements first (hair, braid) ──
      // Saree skirt (drawn first so arms overlap the hem)
      _pvSaree(ctx, pose, sway);
      // Arms (drawn before torso so pallu overlaps)
      _pvArms(ctx, pose, t, isSeated, true);
      // Torso + pallu + necklace (on top of arms at shoulder)
      _pvTorso(ctx, pose);
      // Head + face (on top of everything)
      _pvHead(ctx, t, pose, headTurn, pose === 'smile', false);
    }

    ctx.restore();
  }

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  LORD SHIVA — redrawn calm dignified style                      ║
  // ║  Signature: drawShiva(ctx, x, y, t, opts)  (UNCHANGED)          ║
  // ║  opts = { scale, dir, pose }                                     ║
  // ║    scale : number (default 1).  At scale 1 ≈ 176 px tall.       ║
  // ║    dir   : 1|-1 OR 'right'|'left'|'up' (back view)              ║
  // ║    pose  : 'idle'|'stand'|'seated'|'bless'                      ║
  // ║  (x,y) = centre-bottom between feet.                            ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // ── helper: warm brown outline stroke on current path ────────────────
  function _shvOutline(ctx, w) {
    ctx.strokeStyle = C.outline;
    ctx.lineWidth   = w || 1.8;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // ── helper: tall matted jata top-knot with crescent moon ─────────────
  // baseY = centre-of-head Y. sway = small horizontal offset from breathing.
  function _shvJata(ctx, baseY, sway) {
    // Outer jata mound — dark brownish-black matted coil
    ctx.beginPath();
    ctx.moveTo(-14, baseY + 12);
    ctx.bezierCurveTo(-20 + sway * 0.5, baseY - 8,  -16 + sway, baseY - 34, -4 + sway, baseY - 52);
    ctx.bezierCurveTo( 0  + sway, baseY - 58,  4 + sway, baseY - 58,  4 + sway, baseY - 52);
    ctx.bezierCurveTo( 16 + sway, baseY - 34,  20 - sway * 0.5, baseY - 8, 14, baseY + 12);
    ctx.fillStyle = C.shvJata;
    ctx.fill();
    _shvOutline(ctx, 1.4);

    // Coil texture — horizontal curved lines across jata
    ctx.strokeStyle = 'rgba(30,10,0,0.25)'; ctx.lineWidth = 1.2;
    for (var ji = 0; ji < 4; ji++) {
      var jy = baseY - 12 - ji * 10;
      ctx.beginPath();
      ctx.moveTo(-12 + sway * 0.3, jy);
      ctx.quadraticCurveTo(sway * 0.5, jy - 4, 12 - sway * 0.3, jy);
      ctx.stroke();
    }

    // Crescent moon tucked at the base of the jata (cream, thin arc)
    var moonY = baseY - 16;
    ctx.beginPath();
    ctx.arc(-2 + sway * 0.4, moonY, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = C.shvMoon; ctx.lineWidth = 3; ctx.stroke();
    // Inner crescent darker arc to make it look like a crescent shape
    ctx.beginPath();
    ctx.arc(1 + sway * 0.4, moonY - 1, 6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = C.shvJata; ctx.lineWidth = 2.5; ctx.stroke();

    // Small Ganga river trickle — a thin blue wavy line down the right side of jata
    ctx.beginPath();
    ctx.moveTo(10 + sway * 0.6, baseY - 48);
    ctx.quadraticCurveTo(14 + sway, baseY - 28, 12, baseY + 8);
    ctx.strokeStyle = '#88C8E8'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // ── helper: calm green cobra draped over shoulders ────────────────────
  // Drawn above torso so it sits at neck level. cx=0 = torso centre.
  function _shvCobra(ctx, torsoY) {
    // Body loop: S-curve across the left shoulder
    ctx.beginPath();
    ctx.moveTo(16, torsoY - 4);
    ctx.bezierCurveTo(20, torsoY - 18, 8, torsoY - 28, 0, torsoY - 20);
    ctx.bezierCurveTo(-10, torsoY - 12, -18, torsoY - 22, -20, torsoY - 10);
    ctx.strokeStyle = C.shvCobra; ctx.lineWidth = 5; ctx.stroke();
    // Lighter highlight stripe
    ctx.beginPath();
    ctx.moveTo(15, torsoY - 5);
    ctx.bezierCurveTo(19, torsoY - 18, 8, torsoY - 26, 0, torsoY - 20);
    ctx.strokeStyle = C.shvCobraHi; ctx.lineWidth = 2; ctx.stroke();

    // Hood (flattened fan shape) resting on the left shoulder
    ctx.save();
    ctx.translate(-20, torsoY - 10);
    ctx.rotate(0.6);
    ctx.beginPath();
    ctx.ellipse(0, -8, 7, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.shvCobra; ctx.fill();
    _shvOutline(ctx, 1);
    // Hood highlight
    ctx.beginPath();
    ctx.ellipse(-1, -9, 3, 6, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = C.shvCobraHi; ctx.globalAlpha = 0.55; ctx.fill();
    ctx.globalAlpha = 1;
    // Two small friendly eyes on hood
    circle(ctx, -3, -14, 1.5, '#1A0A00');
    circle(ctx,  3, -14, 1.5, '#1A0A00');
    // Tongue (tiny forked — just two short lines)
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(-2, -21);
    ctx.moveTo(0, -18); ctx.lineTo( 2, -21);
    ctx.strokeStyle = '#CC3030'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  // ── helper: dhoti lower body (tiger-stripe saffron wrap) ──────────────
  // pose 'seated' draws flat cross-legged base instead.
  function _shvDhoti(ctx, pose) {
    var isSeated = (pose === 'seated');
    if (isSeated) {
      // Flat meditation base — wide oval in ochre/saffron
      ctx.beginPath();
      ctx.ellipse(0, -14, 34, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.shvDhoti; ctx.fill();
      _shvOutline(ctx, 1.5);
      // Tiger stripes on base
      ctx.strokeStyle = 'rgba(80,30,0,0.22)'; ctx.lineWidth = 1.5;
      for (var ts = -20; ts <= 20; ts += 10) {
        ctx.beginPath();
        ctx.moveTo(ts - 6, -6);
        ctx.quadraticCurveTo(ts, -18, ts + 6, -6);
        ctx.stroke();
      }
      // Legs / feet poking out sides
      ellipse(ctx, -30, -10, 10, 6, C.shvSkin);
      ellipse(ctx,  30, -10, 10, 6, C.shvSkin);
      ellipse(ctx, -38, -8,  6,  4, C.shvSkin);
      ellipse(ctx,  38, -8,  6,  4, C.shvSkin);
    } else {
      // Standing wrap — saffron bell from waist to ankle
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.bezierCurveTo(-24, -30, -18, -76, -12, -86);
      ctx.lineTo(12, -86);
      ctx.bezierCurveTo(18, -76, 24, -30, 20, -18);
      ctx.quadraticCurveTo(0, -10, -20, -18);
      ctx.closePath();
      ctx.fillStyle = C.shvDhoti; ctx.fill();
      _shvOutline(ctx, 1.5);
      // Gold hem
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.quadraticCurveTo(0, -10, 20, -18);
      ctx.strokeStyle = C.goldDark; ctx.lineWidth = 3; ctx.stroke();
      // Tiger-stripe pattern: short curved marks
      ctx.strokeStyle = 'rgba(80,30,0,0.22)'; ctx.lineWidth = 1.5;
      for (var tv = -8; tv <= 8; tv += 8) {
        ctx.beginPath();
        ctx.moveTo(tv - 4, -30);
        ctx.quadraticCurveTo(tv, -48, tv + 4, -30);
        ctx.stroke();
      }
      // Feet peeking below
      ellipse(ctx, -10, -4, 8, 5, C.shvSkin);
      ellipse(ctx,  10, -4, 8, 5, C.shvSkin);
      ellipse(ctx, -12, -3, 3, 2, C.shvSkinHi);
      ellipse(ctx,  12, -3, 3, 2, C.shvSkinHi);
    }
  }

  // ── helper: torso + chest ash-lines + rudraksha ────────────────────────
  function _shvTorso(ctx, pose) {
    var isSeated = (pose === 'seated');
    var torsoY   = isSeated ? -46 : -104; // chest centre Y

    // Torso body
    ctx.beginPath();
    ctx.ellipse(0, torsoY, 16, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkin; ctx.fill();
    _shvOutline(ctx, 1.5);
    // Shade on right side
    ctx.beginPath();
    ctx.ellipse(6, torsoY + 2, 7, 13, 0.25, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkinSh; ctx.globalAlpha = 0.28; ctx.fill();
    ctx.globalAlpha = 1;
    // Highlight on chest centre
    ctx.beginPath();
    ctx.ellipse(-2, torsoY - 6, 5, 8, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkinHi; ctx.globalAlpha = 0.35; ctx.fill();
    ctx.globalAlpha = 1;

    // Three horizontal ash (vibhuti) lines across chest
    ctx.strokeStyle = 'rgba(240,240,230,0.80)'; ctx.lineWidth = 2;
    for (var al = 0; al < 3; al++) {
      var lineY = torsoY - 4 + al * 6;
      ctx.beginPath();
      ctx.moveTo(-12, lineY);
      ctx.lineTo( 12, lineY);
      ctx.stroke();
    }

    // Rudraksha necklace (small brown bead arc)
    ctx.beginPath();
    ctx.arc(0, torsoY - 14, 13, Math.PI * 0.12, Math.PI * 0.88);
    ctx.strokeStyle = C.shvRudra; ctx.lineWidth = 4; ctx.stroke();
    // Bead dots on necklace
    ctx.fillStyle = C.shvRudra;
    for (var rd = 0; rd <= 6; rd++) {
      var rAngle = Math.PI * 0.12 + rd * (Math.PI * 0.76 / 6);
      var rx = Math.cos(rAngle) * 13;
      var ry = torsoY - 14 + Math.sin(rAngle) * 13;
      ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Rudraksha armbands (drawn here since they're at torso level)
    var armY = torsoY + 2;
    for (var ab = -1; ab <= 1; ab += 2) {
      ctx.beginPath();
      ctx.arc(ab * 18, armY, 5, 0, Math.PI * 2);
      ctx.strokeStyle = C.shvRudra; ctx.lineWidth = 3; ctx.stroke();
    }
  }

  // ── helper: neck + Neelakantha blue-throat + head + face ─────────────
  function _shvFace(ctx, t, pose, headTurn, isBack) {
    var isSeated = (pose === 'seated');
    var headY    = isSeated ? -72 : -130; // centre-of-head Y
    var jataSway = Math.sin(t * 0.8) * 1.2; // very subtle jata sway

    if (isBack) {
      // ── Back view: just neck + head + jata ───────────────────────
      ellipse(ctx, 0, headY + 24, 8, 9, C.shvSkin);
      ellipse(ctx, 0, headY, 18, 21, C.shvSkin);
      _shvJata(ctx, headY, jataSway);
      return;
    }

    // ── Front/side view ───────────────────────────────────────────
    // Neelakantha blue throat
    ctx.beginPath();
    ctx.ellipse(headTurn * 3, headY + 28, 8, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.shvThroat; ctx.fill();
    _shvOutline(ctx, 1.2);

    // Neck
    ellipse(ctx, headTurn * 2, headY + 20, 8, 9, C.shvSkin);
    _shvOutline(ctx, 1.2);

    // Jata (drawn behind head)
    _shvJata(ctx, headY, jataSway + headTurn * 2);

    // Head base
    ellipse(ctx, headTurn * 3, headY, 18, 21, C.shvSkin);
    _shvOutline(ctx, 1.8);
    // Forehead highlight
    ctx.beginPath();
    ctx.ellipse(headTurn * 2 - 1, headY - 8, 9, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkinHi; ctx.globalAlpha = 0.40; ctx.fill();
    ctx.globalAlpha = 1;
    // Chin shade
    ctx.beginPath();
    ctx.ellipse(headTurn * 3 + 2, headY + 14, 8, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkinSh; ctx.globalAlpha = 0.28; ctx.fill();
    ctx.globalAlpha = 1;

    // Three horizontal tripundra ash lines on forehead
    var ex0 = headTurn * 3;
    ctx.strokeStyle = 'rgba(240,240,230,0.88)'; ctx.lineWidth = 1.8;
    for (var ti = 0; ti < 3; ti++) {
      ctx.beginPath();
      ctx.moveTo(ex0 - 8, headY - 4 + ti * 4);
      ctx.lineTo(ex0 + 8, headY - 4 + ti * 4);
      ctx.stroke();
    }

    // Third eye — a thin vertical red-orange teardrop mark
    ctx.beginPath();
    ctx.moveTo(ex0, headY - 14);
    ctx.bezierCurveTo(ex0 + 2, headY - 20, ex0 + 2, headY - 26, ex0, headY - 28);
    ctx.bezierCurveTo(ex0 - 2, headY - 26, ex0 - 2, headY - 20, ex0, headY - 14);
    ctx.fillStyle = C.shvThirdEye; ctx.fill();
    _shvOutline(ctx, 0.8);

    // Half-closed eyes — meditative, kind
    // Blink every ~5 s (slower than Parvati — deeper meditation)
    var blink = (t % 5) > 4.85;
    var eyeH  = blink ? 0.3 : 2.2;
    for (var ev = -1; ev <= 1; ev += 2) {
      var eyeX = ex0 + ev * 6;
      var eyeY = headY + 4;
      // White
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 5, eyeH, ev * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = C.white; ctx.fill();
      // Iris (very dark, almost black — introspective)
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeY, 3, Math.max(0.2, eyeH - 0.6), 0, 0, Math.PI * 2);
      ctx.fillStyle = '#180800'; ctx.fill();
      // Heavy lower lid (half-closed look)
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 5, 0, Math.PI);
      ctx.strokeStyle = C.shvSkinSh; ctx.lineWidth = 2.5; ctx.stroke();
    }

    // Gentle smile (very subtle, serene)
    ctx.beginPath();
    ctx.moveTo(ex0 - 6, headY + 11);
    ctx.quadraticCurveTo(ex0, headY + 14, ex0 + 6, headY + 11);
    ctx.strokeStyle = '#3A1800'; ctx.lineWidth = 1.5; ctx.stroke();

    // Earrings: simple rudraksha bead + small ring on each side
    for (var es = -1; es <= 1; es += 2) {
      var earX = ex0 + es * 17;
      ellipse(ctx, earX, headY + 4, 5, 6, C.shvSkin);
      _shvOutline(ctx, 0.9);
      circle(ctx, earX, headY + 8, 3.5, C.shvRudra);
      _shvOutline(ctx, 0.8);
    }
  }

  // ── helper: arms + hands (pose drives angles) ─────────────────────────
  function _shvArms(ctx, pose, t, isSeated) {
    var torsoY    = isSeated ? -46 : -104;
    var breathe   = Math.sin(t * 0.9) * 0.06; // very slow breathing swing
    var blessRise = (pose === 'bless') ? -0.7 : 0;

    // LEFT arm — rests down or in lap
    ctx.save();
    ctx.translate(-16, torsoY - 2);
    ctx.rotate(-0.18 + breathe);
    roundRect(ctx, -5, -2, 10, 22, 5, C.shvSkin);
    _shvOutline(ctx, 1.2);
    ctx.beginPath();
    ctx.ellipse(3, 10, 3, 8, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkinSh; ctx.globalAlpha = 0.25; ctx.fill();
    ctx.globalAlpha = 1;
    // Rudraksha armband
    ctx.beginPath();
    ctx.arc(0, 14, 5, 0, Math.PI * 2);
    ctx.strokeStyle = C.shvRudra; ctx.lineWidth = 2.5; ctx.stroke();
    // Forearm
    roundRect(ctx, -4, 18, 8, 18, 4, C.shvSkin);
    _shvOutline(ctx, 1);
    // Hand (open palm resting)
    ellipse(ctx, 0, 37, 5, 4, C.shvSkin);
    _shvOutline(ctx, 1);
    ctx.restore();

    // RIGHT arm — raised for bless, otherwise resting
    ctx.save();
    ctx.translate(16, torsoY - 2);
    ctx.rotate(0.18 - breathe + blessRise);
    roundRect(ctx, -5, -2, 10, 22, 5, C.shvSkin);
    _shvOutline(ctx, 1.2);
    ctx.beginPath();
    ctx.ellipse(-3, 10, 3, 8, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.shvSkinSh; ctx.globalAlpha = 0.25; ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 14, 5, 0, Math.PI * 2);
    ctx.strokeStyle = C.shvRudra; ctx.lineWidth = 2.5; ctx.stroke();
    roundRect(ctx, -4, 18, 8, 18, 4, C.shvSkin);
    _shvOutline(ctx, 1);
    ellipse(ctx, 0, 37, 5, 4, C.shvSkin);
    _shvOutline(ctx, 1);
    // Bless: open palm with soft golden glow
    if (pose === 'bless') {
      ctx.beginPath();
      ctx.arc(0, 37, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,216,80,0.40)'; ctx.fill();
    }
    ctx.restore();
  }

  // ── helper: tall golden trishul with damaru, beside Shiva's left ──────
  // Placed at x=+22 in local space (to his right in world = left on canvas before flip).
  function _shvTrishul(ctx, isSeated) {
    var staffBot = isSeated ? -4  : -4;   // bottom of staff (near feet)
    var staffTop = isSeated ? -110 : -184; // top of staff

    ctx.save();
    ctx.translate(24, 0);  // offset to Shiva's right side

    // Staff — gold rod
    ctx.beginPath();
    ctx.moveTo(0, staffBot);
    ctx.lineTo(0, staffTop);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 4; ctx.stroke();
    // Highlight stripe
    ctx.beginPath();
    ctx.moveTo(-1, staffBot);
    ctx.lineTo(-1, staffTop);
    ctx.strokeStyle = C.goldLight; ctx.lineWidth = 1.5; ctx.stroke();

    // Trident head at the top — three prongs
    var prongsY = staffTop;
    // Centre prong (tallest)
    ctx.beginPath();
    ctx.moveTo(0, prongsY);
    ctx.lineTo(-3, prongsY - 24);
    ctx.lineTo(3, prongsY - 24);
    ctx.closePath();
    ctx.fillStyle = C.goldDark; ctx.fill();
    _shvOutline(ctx, 1);
    // Left prong
    ctx.save(); ctx.translate(-7, prongsY + 2); ctx.rotate(-0.22);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-2, -16); ctx.lineTo(2, -16); ctx.closePath();
    ctx.fillStyle = C.goldDark; ctx.fill(); _shvOutline(ctx, 0.8);
    ctx.restore();
    // Right prong
    ctx.save(); ctx.translate(7, prongsY + 2); ctx.rotate(0.22);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-2, -16); ctx.lineTo(2, -16); ctx.closePath();
    ctx.fillStyle = C.goldDark; ctx.fill(); _shvOutline(ctx, 0.8);
    ctx.restore();

    // Damaru drum tied at mid-staff
    var dY = staffBot + (staffTop - staffBot) * 0.28;
    ctx.save();
    ctx.translate(8, dY);
    // Two small drum heads (hour-glass shape)
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(6, -2); ctx.lineTo(0, 4); ctx.lineTo(-6, -2); ctx.closePath();
    ctx.fillStyle = C.shvRudra; ctx.fill();
    _shvOutline(ctx, 1);
    // Binding thread
    ctx.beginPath();
    ctx.moveTo(-6, -2); ctx.lineTo(0, -8); ctx.moveTo(6, -2); ctx.lineTo(0, 4);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // ── Main drawShiva — orchestrates all helpers ─────────────────────────
  function drawShiva(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc     = opts.scale || 1;
    // Accept numeric dir (legacy: 1 or -1) or string ('right','left','up')
    var dirRaw = opts.dir !== undefined ? opts.dir : 'right';
    var isBack = (dirRaw === 'up');
    var flipX  = (dirRaw === -1 || dirRaw === 'left') ? -1 : 1;
    var pose   = opts.pose || 'idle';
    var isSeated = (pose === 'seated');

    // Slow breathing bob — much calmer than other characters
    var bob    = isSeated ? 0 : Math.sin(t * 0.9) * 1.8;

    var shadowRx = isSeated ? 36 * sc : 28 * sc;
    ovalShadow(ctx, x, y, shadowRx, 7 * sc);

    ctx.save();
    ctx.translate(x, y + bob * sc);
    ctx.scale(flipX * sc, sc);

    if (isBack) {
      // ── Back view: dhoti → arms → torso → trishul → head (back) ─
      _shvDhoti(ctx, pose);
      _shvTorso(ctx, pose);
      _shvArms(ctx, pose, t, isSeated);
      _shvTrishul(ctx, isSeated);
      _shvFace(ctx, t, pose, 0, true);
    } else {
      // ── Front view: draw from back to front ──────────────────────
      // Trishul goes behind Shiva so it appears to be held at his side
      _shvTrishul(ctx, isSeated);
      _shvDhoti(ctx, pose);
      _shvArms(ctx, pose, t, isSeated);
      _shvCobra(ctx, isSeated ? -46 : -104);
      _shvTorso(ctx, pose);
      _shvFace(ctx, t, pose, 0, false);
    }

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

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  GANESHA ON MUSHAK — Level 2 runner back view                   ║
  // ║  drawGaneshaOnMushak(ctx, x, y, t, opts)                        ║
  // ║  x,y = bottom centre of Mushak. opts = { scale, wobble }        ║
  // ╚══════════════════════════════════════════════════════════════════╝
  function drawGaneshaOnMushak(ctx, x, y, t, opts) {
    opts = opts || {};
    var sc = opts.scale || 1;
    var wobble = opts.wobble || 0;  // hit wobble 0-1

    ovalShadow(ctx, x, y, 30 * sc, 8 * sc);

    var bob     = Math.sin(t * 4) * (1.5 + wobble * 3);
    var wTilt   = Math.sin(t * 6) * wobble * 0.15;  // wobble tilt

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(wTilt);
    ctx.scale(sc, sc);

    // ── Mushak (simplified back view, same style as drawMushak) ──────
    // Body — grey-brown oval
    ctx.beginPath();
    ctx.ellipse(0, -14, 18, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#C8A8A0'; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5; ctx.stroke();
    // Rump highlight
    ctx.beginPath();
    ctx.ellipse(-4, -18, 8, 6, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#DCC0B8'; ctx.fill();
    // Tail curling to the right
    ctx.beginPath();
    ctx.moveTo(14, -12);
    ctx.bezierCurveTo(22, -8, 24, -2, 18, 2);
    ctx.bezierCurveTo(14, 4, 12, 2, 14, -2);
    ctx.strokeStyle = '#A08080'; ctx.lineWidth = 2.5;
    ctx.lineCap = 'round'; ctx.stroke();
    // Back feet (two oval bumps)
    ellipse(ctx, -10, -2, 6, 4, '#B89890');
    ellipse(ctx,  10, -2, 6, 4, '#B89890');
    // Two round back ears
    circle(ctx, -12, -24, 7, '#C8A8A0');
    circle(ctx,  12, -24, 7, '#C8A8A0');
    circle(ctx, -12, -24, 4, '#E8C0C0');
    circle(ctx,  12, -24, 4, '#E8C0C0');

    // ── Ganesha seated on Mushak's back (back view) ───────────────────
    // Seat position is on top of Mushak (~-28 from ground)
    ctx.save();
    ctx.translate(0, -28);

    // Dhoti (seated — wide flattened dome)
    ctx.beginPath();
    ctx.ellipse(0, -10, 20, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#F26B38'; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5; ctx.stroke();
    // Dhoti hem
    ctx.beginPath();
    ctx.moveTo(-18, -6); ctx.quadraticCurveTo(0, -2, 18, -6);
    ctx.strokeStyle = C.dhotiBdr; ctx.lineWidth = 2.5; ctx.stroke();

    // Back torso
    ctx.beginPath();
    ctx.ellipse(0, -28, 14, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5; ctx.stroke();
    // Torso shade
    ctx.beginPath();
    ctx.ellipse(0, -22, 10, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachShade; ctx.fill();

    // Two arms hanging at the sides (back view — simple rounded shapes)
    ellipse(ctx, -16, -28, 7, 5, C.peachSkin);
    ellipse(ctx,  16, -28, 7, 5, C.peachSkin);
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(-16, -28, 7, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse( 16, -28, 7, 5, 0, 0, Math.PI * 2); ctx.stroke();

    // Head (back — large round elephant head)
    ctx.beginPath();
    ctx.ellipse(0, -48, 22, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 2; ctx.stroke();
    // Head highlight
    ctx.beginPath();
    ctx.ellipse(-4, -54, 10, 7, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.peachHi; ctx.fill();

    // Big ears from behind
    ctx.beginPath();
    ctx.ellipse(-20, -52, 15, 20, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(20, -52, 15, 20, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = C.peachSkin; ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5; ctx.stroke();

    // Crown (simplified back view — 2 tiers)
    var cg1 = _gnGoldGrad(ctx, 0, -68, 14);
    roundRect(ctx, -14, -72, 28, 8, 4, null);
    ctx.fillStyle = cg1; ctx.fill(); _gnOutline(ctx, 1.5);
    var cg2 = _gnGoldGrad(ctx, 0, -80, 10);
    roundRect(ctx, -10, -80, 20, 8, 3, null);
    ctx.fillStyle = cg2; ctx.fill(); _gnOutline(ctx, 1.5);
    // Crown spire tip
    ctx.beginPath();
    ctx.moveTo(-4, -80); ctx.lineTo(0, -88); ctx.lineTo(4, -80);
    ctx.fillStyle = C.goldLight; ctx.fill();
    circle(ctx, 0, -88, 2.5, C.goldLight);

    ctx.restore();  // end seated Ganesha
    ctx.restore();  // end combined sprite
  }

  // ╔══════════════════════════════════════════════════════════════════╗
  // ║  BOY — Parvati's little son (slides 0-2, before elephant head)  ║
  // ║  drawBoy(ctx, x, y, t, opts)                                    ║
  // ║  opts = { state, dir, scale, build }                            ║
  // ║  state: 'idle' | 'guard' | 'forming'                            ║
  // ║  dir  : 1 (front) | -1 (left) | or 'right'/'left' strings       ║
  // ║  build: 0..1 for 'forming' pose (paste blob → full boy)         ║
  // ╚══════════════════════════════════════════════════════════════════╝

  // ── Shared outline for boy (same warm-brown, rounded) ─────────────────
  function _boyOutline(ctx, w) {
    ctx.strokeStyle = C.outline;
    ctx.lineWidth   = w || 1.8;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  // ── Tiny paste swirl marks on arms/shoulders ──────────────────────────
  // Drawn as three small darker curved strokes
  function _boySwirls(ctx) {
    ctx.strokeStyle = C.boyShade;
    ctx.lineWidth   = 1.5;
    ctx.lineCap     = 'round';
    // Upper-left arm swirl
    ctx.beginPath();
    ctx.moveTo(-8, -62);
    ctx.quadraticCurveTo(-13, -60, -10, -56);
    ctx.stroke();
    // Upper-right arm swirl
    ctx.beginPath();
    ctx.moveTo(8, -62);
    ctx.quadraticCurveTo(13, -60, 10, -56);
    ctx.stroke();
    // Chest centre swirl (smallest)
    ctx.beginPath();
    ctx.moveTo(-3, -68);
    ctx.quadraticCurveTo(0, -66, 3, -68);
    ctx.stroke();
  }

  // ── Feet + short chibi legs (matching Ganesha proportions) ────────────
  function _boyFeet(ctx, legSwing) {
    var ls = legSwing || 0;

    // Left leg
    ctx.save();
    ctx.translate(-8, 0);
    ctx.rotate(-ls * 0.18);
    roundRect(ctx, -5, -15, 10, 13, 4, C.boySkin);
    ctx.fillStyle = C.boyShade;
    ctx.beginPath(); ctx.ellipse(2, -8, 3, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    ellipse(ctx, 0, 0, 8, 5, C.boySkin);
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(8, 0);
    ctx.rotate(ls * 0.18);
    roundRect(ctx, -5, -15, 10, 13, 4, C.boySkin);
    ctx.fillStyle = C.boyShade;
    ctx.beginPath(); ctx.ellipse(-2, -8, 3, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    ellipse(ctx, 0, 0, 8, 5, C.boySkin);
    ctx.restore();
  }

  // ── Dhoti + bare torso + arms ─────────────────────────────────────────
  function _boyBody(ctx, state, t, armAngleR, armAngleL) {
    // Cream dhoti (waist to knees)
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.bezierCurveTo(-23, -28, -20, -42, 0, -42);
    ctx.bezierCurveTo(20, -42, 23, -28, 20, -16);
    ctx.quadraticCurveTo(0, -10, -20, -16);
    ctx.closePath();
    ctx.fillStyle = C.cream; ctx.fill(); _boyOutline(ctx, 1.5);

    // Saffron-yellow hem border
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.quadraticCurveTo(0, -9, 20, -16);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, -16);
    ctx.quadraticCurveTo(0, -9, 20, -16);
    ctx.strokeStyle = C.goldLight; ctx.lineWidth = 1.2; ctx.stroke();

    // Bare belly (round chibi tummy)
    var bellyB = (state === 'idle') ? Math.sin(t * 2) * 0.8 : 0;
    ctx.beginPath();
    ctx.ellipse(0, -52 + bellyB, 15, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 1.5);
    // Belly shade
    ctx.beginPath();
    ctx.ellipse(0, -46 + bellyB, 11, 5, 0, 0, Math.PI); ctx.fillStyle = C.boyShade; ctx.fill();
    // Navel
    circle(ctx, 0, -50 + bellyB, 2, C.boyShade);

    // Chest / torso
    ctx.beginPath();
    ctx.ellipse(0, -63, 12, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 1.5);
    // Chest centre highlight
    ctx.beginPath();
    ctx.ellipse(-2, -67, 5, 4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.boyHi; ctx.fill();

    // Paste swirl marks
    _boySwirls(ctx);

    // Small gold bracelets (wrist area, drawn before arms so arms cover)
    // — drawn inside arm blocks below

    // Right arm (rotation passed in)
    ctx.save();
    ctx.translate(15, -62);
    ctx.rotate(armAngleR);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(5, 3, 5, 12, 3, 20);
    ctx.bezierCurveTo(-3, 20, -5, 12, -3, 4); ctx.closePath();
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 1.5);
    // Arm shade
    ctx.fillStyle = C.boyShade;
    ctx.beginPath(); ctx.ellipse(2, 11, 2, 4, 0.2, 0, Math.PI * 2); ctx.fill();
    // Gold bracelet
    ctx.beginPath(); ctx.arc(0, 18, 4, 0, Math.PI * 2);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2; ctx.stroke();
    // Hand (round palm)
    ctx.beginPath(); ctx.ellipse(0, 24, 5, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 1.5);
    // Finger bumps
    ctx.fillStyle = C.boySkin;
    for (var fa = -3; fa <= 3; fa += 2) {
      ctx.beginPath(); ctx.arc(fa, 27, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Left arm (rotation passed in; 'guard' raises it)
    ctx.save();
    ctx.translate(-15, -62);
    ctx.rotate(armAngleL);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(-5, 3, -5, 12, -3, 20);
    ctx.bezierCurveTo(3, 20, 5, 12, 3, 4); ctx.closePath();
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 1.5);
    ctx.fillStyle = C.boyShade;
    ctx.beginPath(); ctx.ellipse(-2, 11, 2, 4, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 18, 4, 0, Math.PI * 2);
    ctx.strokeStyle = C.goldDark; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 24, 5, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 1.5);
    ctx.fillStyle = C.boySkin;
    for (var fb = -3; fb <= 3; fb += 2) {
      ctx.beginPath(); ctx.arc(fb, 27, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ── Head: round face, hair topknot, eyes, smile ───────────────────────
  function _boyHead(ctx, state, t, build) {
    build = (build === undefined) ? 1 : build;
    // Fade eyes in during 'forming' once build > 0.85
    var eyeAlpha = Math.max(0, Math.min(1, (build - 0.85) / 0.15));

    // Base head shape (round, slightly wide)
    ctx.beginPath();
    ctx.ellipse(0, -85, 22, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boySkin; ctx.fill(); _boyOutline(ctx, 2);

    // Forehead highlight
    ctx.beginPath();
    ctx.ellipse(-3, -93, 10, 7, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = C.boyHi; ctx.fill();

    // Chin shade
    ctx.beginPath();
    ctx.ellipse(2, -70, 9, 4, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = C.boyShade; ctx.fill();

    // Rosy cheeks
    ctx.globalAlpha = 0.45;
    circle(ctx, -13, -80, 6, C.blush);
    circle(ctx,  13, -80, 6, C.blush);
    ctx.globalAlpha = 1;

    // Eyes (blink every ~3.5 s)
    ctx.globalAlpha = eyeAlpha;
    var blink  = ((t * 0.28) % 1) > 0.93;
    var eyeRY  = blink ? 1 : 4.5;

    // Left eye
    circle(ctx, -8, -86, 5.5, C.white);
    ctx.beginPath();
    ctx.ellipse(-8, -86, 4, eyeRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2A1408'; ctx.fill();
    if (!blink) circle(ctx, -6, -88, 1.5, C.white);
    // Left brow (friendly, slight arch)
    ctx.beginPath();
    ctx.moveTo(-13, -93); ctx.quadraticCurveTo(-8, -96, -3, -93);
    ctx.strokeStyle = '#4A2808'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();

    // Right eye
    circle(ctx, 8, -86, 5.5, C.white);
    ctx.beginPath();
    ctx.ellipse(8, -86, 4, eyeRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2A1408'; ctx.fill();
    if (!blink) circle(ctx, 10, -88, 1.5, C.white);
    // Right brow
    ctx.beginPath();
    ctx.moveTo(3, -93); ctx.quadraticCurveTo(8, -96, 13, -93);
    ctx.strokeStyle = '#4A2808'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();

    // Small nose (two little dots)
    circle(ctx, -2, -79, 1.5, C.boyShade);
    circle(ctx,  2, -79, 1.5, C.boyShade);

    // Brave little smile
    ctx.beginPath();
    ctx.arc(0, -76, 7, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = '#7A4020'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();

    ctx.globalAlpha = 1;

    // Sandalwood tilak dot on forehead
    circle(ctx, 0, -97, 3, '#C07030');
    circle(ctx, 0, -97, 1.5, '#E0A050');

    // Black hair — peeking out beneath topknot (small arc)
    ctx.beginPath();
    ctx.ellipse(0, -100, 20, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boyHair; ctx.fill();
    // Topknot bun
    ctx.beginPath();
    ctx.ellipse(0, -109, 8, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boyHair; ctx.fill(); _boyOutline(ctx, 1.5);
    // Saffron ribbon tied around topknot
    ctx.beginPath();
    ctx.moveTo(-8, -108);
    ctx.bezierCurveTo(-10, -112, -6, -116, 0, -114);
    ctx.bezierCurveTo(6, -112, 10, -108, 8, -108);
    ctx.strokeStyle = C.boyRibbon; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    // Ribbon bow loop left
    ctx.beginPath();
    ctx.moveTo(-8, -108);
    ctx.bezierCurveTo(-14, -116, -10, -120, -6, -116);
    ctx.strokeStyle = C.boyRibbon; ctx.lineWidth = 2.5; ctx.stroke();
    // Ribbon bow loop right
    ctx.beginPath();
    ctx.moveTo(8, -108);
    ctx.bezierCurveTo(14, -116, 10, -120, 6, -116);
    ctx.strokeStyle = C.boyRibbon; ctx.lineWidth = 2.5; ctx.stroke();
  }

  // ── 'forming' pose: paste blob → boy materialising ────────────────────
  // build 0..1 : 0=glowing blob, 0.5=half emerged, 1=fully formed
  function _boyForming(ctx, x, y, t, sc, build) {
    var b = Math.max(0, Math.min(1, build));

    // Ground glow (always present)
    var gGrd = ctx.createRadialGradient(x, y, 2, x, y, 36 * sc);
    gGrd.addColorStop(0, 'rgba(217,166,110,0.9)');
    gGrd.addColorStop(0.5, 'rgba(230,180,80,0.55)');
    gGrd.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.beginPath(); ctx.arc(x, y, 36 * sc, 0, Math.PI * 2);
    ctx.fillStyle = gGrd; ctx.fill();

    // Paste blob base (grows from flat to full height as build rises)
    var blobH = 20 + b * 80;   // blob height in logical px (before scale)
    var blobW = 14 + b * 8;
    ctx.save();
    ctx.translate(x, y - blobH * sc * 0.5);
    ctx.scale(sc, sc);
    // Blob body
    ctx.beginPath();
    ctx.ellipse(0, 0, blobW, blobH * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.boySkin;
    ctx.globalAlpha = 0.5 + b * 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Sparkle particles (8 fixed positions, orbit + drift upward)
    var sparkleSeeds = [0, 0.78, 1.57, 2.36, 3.14, 3.93, 4.71, 5.50];
    for (var si = 0; si < sparkleSeeds.length; si++) {
      var ang  = sparkleSeeds[si] + t * 1.8;
      var orb  = (20 + si * 4) * sc * b;
      var drift = Math.sin(t * 2.5 + si) * 6 * sc;
      var px   = x + Math.cos(ang) * orb;
      var py   = y - blobH * sc * 0.5 + Math.sin(ang * 0.7) * orb * 0.5 - drift;
      var sz   = (1.5 + (si % 3)) * sc;
      var spAlpha = (0.4 + b * 0.6) * (0.6 + Math.sin(t * 4 + si) * 0.4);
      ctx.save();
      ctx.globalAlpha = spAlpha;
      ctx.fillStyle = (si % 2 === 0) ? C.goldLight : C.goldDark;
      // Four-point star sparkle
      ctx.beginPath();
      ctx.moveTo(px, py - sz * 2);
      ctx.lineTo(px + sz * 0.5, py);
      ctx.lineTo(px, py + sz * 2);
      ctx.lineTo(px - sz * 0.5, py);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // As build approaches 1 draw the full boy with global alpha fading in
    if (b > 0.3) {
      var bodyAlpha = Math.min(1, (b - 0.3) / 0.5);
      // Clip draw to below-emerging-line (reveal from bottom to top)
      ctx.save();
      ctx.globalAlpha = bodyAlpha;
      ctx.beginPath();
      // Reveal rectangle: bottom of sprite upward as build rises
      var revealY = y - b * 120 * sc;
      ctx.rect(x - 60 * sc, revealY, 120 * sc, y - revealY + 10);
      ctx.clip();
      // Draw boy body parts directly (without outer ovalShadow to keep clean)
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      _boyFeet(ctx, 0);
      _boyBody(ctx, 'idle', t, 0.3, -0.3);
      _boyHead(ctx, 'idle', t, b);
      ctx.restore();
      ctx.restore();
    }
  }

  // ── drawBoy — public entry point ─────────────────────────────────────
  // Signature: drawBoy(ctx, x, y, t, opts)
  //   opts.state : 'idle' | 'guard' | 'forming'
  //   opts.dir   : 1 (front/right) | -1 (left mirror)
  //   opts.scale : number (default 1, ≈110 px tall)
  //   opts.build : 0..1 for 'forming' state
  function drawBoy(ctx, x, y, t, opts) {
    opts = opts || {};
    var state = opts.state || 'idle';
    var dir   = (opts.dir !== undefined) ? opts.dir : 1;
    var sc    = opts.scale || 1;
    var build = (opts.build !== undefined) ? opts.build : 1;

    // 'forming' draws its own compound effect — handle separately
    if (state === 'forming') {
      _boyForming(ctx, x, y, t, sc, build);
      return;
    }

    // Animation values
    var bob      = Math.sin(t * 2.0) * 2.5;
    var walkLean = 0;
    var legSwing = 0;

    // Guard: feet apart, chin up — achieved via arm angles + body translate
    var armAngleR = (state === 'guard') ?  0.25 : 0.35;  // right at side
    var armAngleL = (state === 'guard') ? -1.30 : -0.35; // left raised palm-out

    ovalShadow(ctx, x, y, 22 * sc, 6 * sc);

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(dir * sc, sc);
    ctx.rotate(walkLean);

    _boyFeet(ctx, legSwing);
    _boyBody(ctx, state, t, armAngleR, armAngleL);
    _boyHead(ctx, state, t, 1);

    // Guard pose: chin-up tilt — small upward camera shift on head
    // (already handled by the head y offsets being fixed)

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
    drawGanesha:          drawGanesha,
    drawGaneshaOnMushak:  drawGaneshaOnMushak,
    drawBoy:              drawBoy,
    drawMushak:           drawMushak,
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
