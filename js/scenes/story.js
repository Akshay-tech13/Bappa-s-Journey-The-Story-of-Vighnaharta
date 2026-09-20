// js/scenes/story.js — 4 story slides with illustrations and auto-advance
// Slides are skippable (Skip button or Space).
// Auto-advances after 4 s. Fade transitions between slides.
// No violence shown or described — Slide 3 is a soft blessing glow.

'use strict';

(function () {

  // ── Slide definitions ─────────────────────────────────────────────────
  // draw(ctx, cx, cy, t)  — cx,cy is the illustration centre-top area
  var SLIDES = [
    // ── Slide 1 ──────────────────────────────────────────────────────────
    {
      lines: [
        'On Mount Kailash, Maa Parvati shaped',
        'a little boy from sandalwood paste and gave him life.',
      ],
      bg0: '#3A1A08', bg1: '#2A0E04',
      draw: function (ctx, cx, cy, t) {
        // Mountain silhouette
        ctx.save();
        ctx.translate(cx, cy + 80);
        ctx.beginPath();
        ctx.moveTo(-220, 0); ctx.lineTo(-60, -220);
        ctx.lineTo(60, -220); ctx.lineTo(220, 0);
        ctx.closePath();
        ctx.fillStyle = '#3A3060'; ctx.fill();
        // Snow cap
        ctx.beginPath();
        ctx.moveTo(-30, -220); ctx.lineTo(0, -260); ctx.lineTo(30, -220);
        ctx.fillStyle = '#D0D8FF'; ctx.fill();
        ctx.restore();

        // Parvati
        G.art.drawParvati(ctx, cx - 80, cy + 160, t, { scale: 1.1 });

        // Glowing sandalwood form in her hands
        var grd = ctx.createRadialGradient(cx - 48, cy + 60, 4, cx - 48, cy + 60, 28);
        grd.addColorStop(0, 'rgba(255,220,100,0.9)');
        grd.addColorStop(1, 'rgba(255,180,50,0)');
        ctx.beginPath();
        ctx.arc(cx - 48, cy + 60, 28, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        G.art.ellipse(ctx, cx - 48, cy + 68, 14, 18, '#D2A679');

        // Twinkling stars
        var seeds = [0.12,0.28,0.45,0.61,0.73,0.88,0.05,0.34,0.56,0.79];
        for (var si = 0; si < seeds.length; si++) {
          var sx = (seeds[si] * 1.3 % 1) * G.W;
          var sy = seeds[si] * (cy + 20);
          var sa = 0.4 + Math.sin(t * (1.5 + si * 0.2) + si) * 0.3;
          G.art.circle(ctx, sx, sy, 1.5 + (si % 3) * 0.8, 'rgba(255,255,220,' + sa + ')');
        }
      },
    },

    // ── Slide 2 ──────────────────────────────────────────────────────────
    {
      lines: [
        'She asked him to guard her door.',
        'He stood there, brave and faithful.',
      ],
      bg0: '#1A2A3A', bg1: '#0E1A28',
      draw: function (ctx, cx, cy, t) {
        // Archway / door
        ctx.save();
        ctx.translate(cx, cy + 60);
        G.art.roundRect(ctx, -50, -120, 100, 120, 8, '#4A2A0A');
        G.art.roundRect(ctx, -44, -114, 88, 112, 6, '#6B3A18');
        // Arch top
        ctx.beginPath();
        ctx.arc(0, -120, 50, Math.PI, 0);
        ctx.fillStyle = '#4A2A0A'; ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -120, 44, Math.PI, 0);
        ctx.fillStyle = '#6B3A18'; ctx.fill();
        // Door handle
        G.art.circle(ctx, 24, -70, 5, G.COL.gold);
        // Warm glow at base
        var grd2 = ctx.createRadialGradient(0, 0, 5, 0, 0, 60);
        grd2.addColorStop(0, 'rgba(255,200,80,0.2)');
        grd2.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fillStyle = grd2; ctx.fill();
        ctx.restore();

        // Ganesha standing proud at the door
        G.art.drawGanesha(ctx, cx, cy + 180, t, { state: 'idle', scale: 1.2 });

        // Diyas on both sides
        G.art.drawDiya(ctx, cx - 140, cy + 120, true, t);
        G.art.drawDiya(ctx, cx + 140, cy + 120, true, t);

        // Stars
        var seeds2 = [0.12,0.28,0.45,0.61,0.73,0.88,0.05,0.34,0.56,0.79];
        for (var si2 = 0; si2 < seeds2.length; si2++) {
          var sx2 = (seeds2[si2] * 1.3 % 1) * G.W;
          var sy2 = seeds2[si2] * (cy + 20);
          var sa2 = 0.4 + Math.sin(t * (1.5 + si2 * 0.2) + si2) * 0.3;
          G.art.circle(ctx, sx2, sy2, 1.5 + (si2 % 3) * 0.8, 'rgba(255,255,220,' + sa2 + ')');
        }
      },
    },

    // ── Slide 3 ──────────────────────────────────────────────────────────
    {
      lines: [
        'Lord Shiva came home, moved by the boy\'s courage.',
        'He blessed him — and a golden light filled the world.',
      ],
      bg0: '#1A0A2E', bg1: '#2E1A00',
      draw: function (ctx, cx, cy, t) {
        // Shiva seated on the left
        G.art.drawShiva(ctx, cx - 100, cy + 180, t, { scale: 1.1 });

        // Large golden blessing glow (centre-right)
        var pulse = 0.55 + Math.sin(t * 2.5) * 0.2;
        var grd3 = ctx.createRadialGradient(cx + 60, cy + 80, 8, cx + 60, cy + 80, 90);
        grd3.addColorStop(0, 'rgba(255,220,60,' + pulse + ')');
        grd3.addColorStop(0.5, 'rgba(255,160,30,' + (pulse * 0.5) + ')');
        grd3.addColorStop(1, 'rgba(255,160,30,0)');
        ctx.beginPath();
        ctx.arc(cx + 60, cy + 80, 90, 0, Math.PI * 2);
        ctx.fillStyle = grd3; ctx.fill();

        // Elephant head silhouette emerging from glow
        ctx.save();
        ctx.translate(cx + 60, cy + 80);
        ctx.globalAlpha = pulse * 0.75;
        G.art.ellipse(ctx, 0, -10, 30, 28, G.COL.gold);
        G.art.ellipse(ctx, 32, -8, 16, 20, G.COL.gold);
        G.art.ellipse(ctx, -32, -8, 16, 20, G.COL.gold);
        ctx.beginPath();
        ctx.moveTo(6, 10);
        ctx.bezierCurveTo(20, 20, 24, 30, 18, 36);
        ctx.bezierCurveTo(14, 40, 6, 38, 4, 34);
        ctx.strokeStyle = G.COL.gold;
        ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke();
        ctx.restore();

        // Orbiting light dots
        for (var oi = 0; oi < 8; oi++) {
          var oa = (oi / 8) * Math.PI * 2 + t * 0.8;
          var or = 55 + Math.sin(t * 1.5 + oi) * 12;
          G.art.circle(ctx, cx + 60 + Math.cos(oa) * or,
                            cy + 80 + Math.sin(oa) * or * 0.5,
                            3, 'rgba(255,230,100,0.7)');
        }
      },
    },

    // ── Slide 4 ──────────────────────────────────────────────────────────
    {
      lines: [
        'Named Ganapati — first among all,',
        'little Ganesha is now hungry for modaks!',
      ],
      bg0: '#2C1A0E', bg1: '#1A0A00',
      draw: function (ctx, cx, cy, t) {
        // Celebrating Ganesha
        G.art.drawGanesha(ctx, cx, cy + 180, t, { state: 'celebrate', scale: 1.3 });

        // Floating modaks
        var mpos = [
          [-160, -20, 0], [140, -40, 1.2], [-100, -90, 2.4],
          [100, -80, 0.6], [0, -120, 1.8],
        ];
        for (var mi = 0; mi < mpos.length; mi++) {
          var fy = Math.sin(t * 2 + mpos[mi][2]) * 8;
          G.art.drawModak(ctx, cx + mpos[mi][0], cy + 180 + mpos[mi][1] + fy, 1.2);
        }

        // Orbiting petals
        for (var pi = 0; pi < 12; pi++) {
          G.art.drawPetal(ctx,
            cx + Math.cos(pi / 12 * Math.PI * 2 + t * 0.3) * 200,
            cy + 80 + Math.sin(pi / 12 * Math.PI * 2 + t * 0.5) * 60,
            t + pi);
        }

        // Joyful devotees
        G.art.drawDevotee(ctx, cx - 220, cy + 180, t,
          { scale: 0.8, phase: 0,   handsUp: true, color: G.COL.maroon });
        G.art.drawDevotee(ctx, cx + 220, cy + 180, t,
          { scale: 0.8, phase: 1.4, handsUp: true, color: G.COL.green });
      },
    },
  ];

  // ── Scene state ───────────────────────────────────────────────────────
  var slideIdx  = 0;
  var slideT    = 0;   // time on this slide
  var textAlpha = 0;   // 0..1 text fade-in
  var totalT    = 0;   // total time in scene

  var AUTO_ADVANCE = 4;   // seconds before auto-advance
  var TEXT_FADE    = 0.6; // seconds for text to fade in
  var SKIP_RECT    = null;

  // ── Input ─────────────────────────────────────────────────────────────
  var ignoreUntil  = 0;
  var clickHandler = null;

  function attachInput() {
    ignoreUntil = performance.now() + 400;
    clickHandler = function (e) {
      if (performance.now() < ignoreUntil) return;
      var p = G.ui.toLogical(e);
      if (SKIP_RECT && G.ui.isButtonHit(p.x, p.y, SKIP_RECT)) {
        G.sceneManager.goto('level1');
      } else {
        _advance();
      }
    };
    G.canvas.addEventListener('click',      clickHandler);
    G.canvas.addEventListener('touchstart', clickHandler, { passive: false });
  }

  function detachInput() {
    if (clickHandler) {
      G.canvas.removeEventListener('click',      clickHandler);
      G.canvas.removeEventListener('touchstart', clickHandler);
      clickHandler = null;
    }
  }

  function _advance() {
    if (slideIdx < SLIDES.length - 1) {
      slideIdx++;
      slideT    = 0;
      textAlpha = 0;
    } else {
      G.sceneManager.goto('level1');
    }
  }

  // ── Scene object ──────────────────────────────────────────────────────
  G.scenes['story'] = {

    init: function () {
      slideIdx  = 0;
      slideT    = 0;
      textAlpha = 0;
      totalT    = 0;
      attachInput();
    },

    update: function (dt) {
      slideT += dt;
      totalT += dt;
      textAlpha = Math.min(1, slideT / TEXT_FADE);

      if (G.input.state.actionPressed) { _advance(); return; }
      if (slideT >= AUTO_ADVANCE)       { _advance(); }
    },

    draw: function (ctx) {
      var slide = SLIDES[slideIdx];

      // Background
      var grad = ctx.createLinearGradient(0, 0, 0, G.H);
      grad.addColorStop(0, slide.bg0);
      grad.addColorStop(1, slide.bg1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, G.W, G.H);

      // Illustration (cx, cy = centre of upper two-thirds)
      ctx.save();
      slide.draw(ctx, G.W / 2, G.H / 2 - 80, totalT);
      ctx.restore();

      // Vignette
      var vig = ctx.createRadialGradient(G.W/2, G.H/2, G.H*0.25, G.W/2, G.H/2, G.H*0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, G.W, G.H);

      // Story text
      G.ui.drawSlideText(ctx, slide.lines, G.W / 2, G.H - 110, textAlpha);

      // Skip button
      SKIP_RECT = G.ui.drawButton(ctx, 'Skip ▶▶', G.W - 90, 36, 130, 46,
        { color: 'rgba(0,0,0,0.5)', fontSize: 18, radius: 10 });

      // Slide dots
      for (var i = 0; i < SLIDES.length; i++) {
        G.art.circle(ctx,
          G.W/2 - (SLIDES.length - 1) * 10 + i * 20,
          G.H - 18,
          i === slideIdx ? 6 : 4,
          i === slideIdx ? G.COL.gold : 'rgba(255,255,255,0.35)');
      }

      // "Tap to continue" hint
      if (slideT > 1.5 && slideIdx < SLIDES.length - 1) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (slideT - 1.5) / 0.5) * 0.55
                          * (0.7 + Math.sin(totalT * 2) * 0.3);
        G.art.centeredText(ctx, 'Tap to continue', G.W/2, G.H - 40, 16, G.COL.cream);
        ctx.restore();
      }

      // Progress bar
      ctx.fillStyle = 'rgba(245,166,35,0.45)';
      ctx.fillRect(0, 0, Math.min((slideT / AUTO_ADVANCE) * G.W, G.W), 3);
    },

    destroy: function () { detachInput(); },
  };

})();
