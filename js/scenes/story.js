// js/scenes/story.js — 4 story slides with illustrations and auto-advance
// Slides are skippable (Skip button or Space).
// Auto-advances after 4 s. Fade transitions between slides.
// No violence shown or described — Slide 3 is a soft blessing glow.

'use strict';

(function () {

  // ── Slide data ────────────────────────────────────────────────────────
  // Each slide: text lines + an illustrationFn(ctx, cx, cy, t)
  var SLIDES = [
    {
      // Slide 1: Parvati shapes a boy from sandalwood paste on Kailash
      lines: [
        'On Mount Kailash, Maa Parvati shaped',
        'a little boy from sandalwood paste and gave him life.',
      ],
      bg: ['#3A1A08', '#2A0E04'],
      draw: function (ctx, cx, cy, t) {
        // Mountain silhouette
        _drawMountain(ctx, cx, cy + 80);
        // Parvati shaping the boy (golden glow in her hands)
        G.art.drawParvati(ctx, cx - 80, cy + 160, t, { scale: 1.1 });
        // Small glowing shape in hands (the boy being formed)
        var glow = 0.5 + Math.sin(t * 2) * 0.2;
        var grad = ctx.createRadialGradient(cx - 48, cy + 60, 4, cx - 48, cy + 60, 28);
        grad.addColorStop(0,  'rgba(255,220,100,' + (glow + 0.2) + ')');
        grad.addColorStop(1,  'rgba(255,180,50,0)');
        ctx.beginPath();
        ctx.arc(cx - 48, cy + 60, 28, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Sandalwood paste colour blob
        G.art.ellipse(ctx, cx - 48, cy + 68, 14, 18, '#D2A679');
        // Stars in sky
        _drawStars(ctx, cx, cy, t);
      },
    },
    {
      // Slide 2: Young Ganesha guards the door (brave and faithful)
      lines: [
        'She asked him to guard her door.',
        'He stood there, brave and faithful.',
      ],
      bg: ['#1A2A3A', '#0E1A28'],
      draw: function (ctx, cx, cy, t) {
        // Door / archway
        _drawDoor(ctx, cx, cy + 60);
        // Ganesha standing at the door, proud
        G.art.drawGanesha(ctx, cx, cy + 180, t, { state: 'idle', scale: 1.2 });
        // Warm torch light on left
        G.art.drawDiya(ctx, cx - 140, cy + 120, true, t);
        G.art.drawDiya(ctx, cx + 140, cy + 120, true, t);
        // Stars
        _drawStars(ctx, cx, cy, t);
      },
    },
    {
      // Slide 3: Shiva blesses — elephant head appears in a golden glow
      // NO violence shown. Only the glow / blessing moment after.
      lines: [
        'Lord Shiva came home and was moved',
        'by the boy\'s courage. A golden blessing...',
      ],
      bg: ['#1A0A2E', '#2E1A00'],
      draw: function (ctx, cx, cy, t) {
        // Shiva on left, blessing gesture
        G.art.drawShiva(ctx, cx - 100, cy + 180, t, { scale: 1.1 });
        // Big golden blessing glow in the centre
        var pulse = 0.55 + Math.sin(t * 2.5) * 0.2;
        var grad = ctx.createRadialGradient(cx + 60, cy + 80, 10, cx + 60, cy + 80, 90);
        grad.addColorStop(0, 'rgba(255,220,60,' + pulse + ')');
        grad.addColorStop(0.5, 'rgba(255,160,30,' + (pulse * 0.5) + ')');
        grad.addColorStop(1, 'rgba(255,160,30,0)');
        ctx.beginPath();
        ctx.arc(cx + 60, cy + 80, 90, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Silhouette of elephant head emerging from glow (the blessed form)
        _drawElephantHeadSilhouette(ctx, cx + 60, cy + 80, t, pulse);
        // Floating light particles
        for (var i = 0; i < 8; i++) {
          var a  = (i / 8) * Math.PI * 2 + t * 0.8;
          var r  = 55 + Math.sin(t * 1.5 + i) * 12;
          var px = cx + 60 + Math.cos(a) * r;
          var py = cy + 80 + Math.sin(a) * r * 0.5;
          G.art.circle(ctx, px, py, 3, 'rgba(255,230,100,0.7)');
        }
      },
    },
    {
      // Slide 4: Named Ganapati, hungry for modaks
      lines: [
        'Named Ganapati — first among all,',
        'little Ganesha is now hungry for modaks!',
      ],
      bg: ['#2C1A0E', '#1A0A00'],
      draw: function (ctx, cx, cy, t) {
        // Ganesha celebrating, full size
        G.art.drawGanesha(ctx, cx, cy + 180, t, { state: 'celebrate', scale: 1.3 });
        // Floating modaks around him
        var modakPositions = [
          { ox: -160, oy: -20, phase: 0 },
          { ox:  140, oy: -40, phase: 1.2 },
          { ox: -100, oy: -90, phase: 2.4 },
          { ox:  100, oy: -80, phase: 0.6 },
          { ox:    0, oy:-120, phase: 1.8 },
        ];
        modakPositions.forEach(function (m) {
          var floatY = Math.sin(t * 2 + m.phase) * 8;
          G.art.drawModak(ctx, cx + m.ox, cy + 180 + m.oy + floatY, 1.2);
        });
        // Marigold petals
        for (var i = 0; i < 12; i++) {
          var px = cx + Math.cos(i / 12 * Math.PI * 2 + t * 0.3) * 200;
          var py = cy + 80 + Math.sin(i / 12 * Math.PI * 2 + t * 0.5) * 60;
          G.art.drawPetal(ctx, px, py, t + i);
        }
        // Devotees in background
        G.art.drawDevotee(ctx, cx - 220, cy + 180, t, { scale: 0.8, phase: 0,   handsUp: true, color: G.COL.maroon });
        G.art.drawDevotee(ctx, cx + 220, cy + 180, t, { scale: 0.8, phase: 1.4, handsUp: true, color: G.COL.green });
      },
    },
  ];

  // ── Shared illustration helpers ───────────────────────────────────────

  function _drawMountain(ctx, cx, basY) {
    ctx.save();
    ctx.translate(cx, basY);
    // Snow cap
    ctx.beginPath();
    ctx.moveTo(-220, 0);
    ctx.lineTo(-60, -220);
    ctx.lineTo(60, -220);
    ctx.lineTo(220, 0);
    ctx.closePath();
    ctx.fillStyle = '#3A3060';
    ctx.fill();
    // Snow highlight
    ctx.beginPath();
    ctx.moveTo(-30, -220);
    ctx.lineTo(0,   -260);
    ctx.lineTo(30,  -220);
    ctx.fillStyle = '#D0D8FF';
    ctx.fill();
    ctx.restore();
  }

  function _drawDoor(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    // Door frame
    G.art.roundRect(ctx, -50, -120, 100, 120, 8, '#4A2A0A');
    // Door surface
    G.art.roundRect(ctx, -44, -114, 88, 112, 6, '#6B3A18');
    // Door arch
    ctx.beginPath();
    ctx.arc(0, -120, 50, Math.PI, 0);
    ctx.fillStyle = '#4A2A0A';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -120, 44, Math.PI, 0);
    ctx.fillStyle = '#6B3A18';
    ctx.fill();
    // Handle
    G.art.circle(ctx, 24, -70, 5, G.COL.gold);
    // Light under door
    var grd = ctx.createRadialGradient(0, 0, 5, 0, 0, 60);
    grd.addColorStop(0, 'rgba(255,200,80,0.2)');
    grd.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.restore();
  }

  function _drawStars(ctx, cx, cy, t) {
    // Small twinkling dots in the upper portion of the scene
    var starSeeds = [0.12, 0.28, 0.45, 0.61, 0.73, 0.88, 0.05, 0.34, 0.56, 0.79];
    starSeeds.forEach(function (s, i) {
      var sx = (s * 1.3 % 1) * G.W;
      var sy = s * (cy + 20);
      var alpha = 0.4 + Math.sin(t * (1.5 + i * 0.2) + i) * 0.3;
      G.art.circle(ctx, sx, sy, 1.5 + (i % 3) * 0.8, 'rgba(255,255,220,' + alpha + ')');
    });
  }

  // Slide 3: just the elephant head silhouette in a glow (no body)
  function _drawElephantHeadSilhouette(ctx, cx, cy, t, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha * 0.7;
    // Simple silhouette: big round head
    G.art.ellipse(ctx, 0, -10, 30, 28, G.COL.gold);
    // Ears
    G.art.ellipse(ctx,  32, -8, 16, 20, G.COL.gold);
    G.art.ellipse(ctx, -32, -8, 16, 20, G.COL.gold);
    // Trunk hint (curved line)
    ctx.beginPath();
    ctx.moveTo(6, 10);
    ctx.bezierCurveTo(20, 20, 24, 30, 18, 36);
    ctx.bezierCurveTo(14, 40, 6, 38, 4, 34);
    ctx.strokeStyle = G.COL.gold;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // ── Scene state ───────────────────────────────────────────────────────
  var slideIdx  = 0;     // which slide we're on
  var slideT    = 0;     // time within this slide
  var textAlpha = 0;     // 0→1 fade-in of text
  var totalT    = 0;     // total scene time

  var AUTO_ADVANCE = 4;  // seconds per slide
  var TEXT_FADE    = 0.6;// seconds to fade text in
  var SKIP_RECT    = null;

  // ── Input ─────────────────────────────────────────────────────────────
  var clickHandler = null;
  function attachInput() {
    clickHandler = function (e) {
      var p = G.ui.toLogical(e);
      if (SKIP_RECT && G.ui.isButtonHit(p.x, p.y, SKIP_RECT)) {
        // Skip all remaining slides
        _finishStory();
      } else {
        // Advance by one slide
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
      _finishStory();
    }
  }

  function _finishStory() {
    G.sceneManager.goto('level1');
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

      // Fade text in
      textAlpha = Math.min(1, slideT / TEXT_FADE);

      // Space / action key advances
      if (G.input.state.actionPressed) {
        _advance();
        return;
      }

      // Auto-advance after AUTO_ADVANCE seconds
      if (slideT >= AUTO_ADVANCE) {
        _advance();
      }
    },

    draw: function (ctx) {
      var slide = SLIDES[slideIdx];

      // ── Background gradient ───────────────────────────────────────
      var grad = ctx.createLinearGradient(0, 0, 0, G.H);
      grad.addColorStop(0, slide.bg[0]);
      grad.addColorStop(1, slide.bg[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, G.W, G.H);

      // ── Illustration ──────────────────────────────────────────────
      // Each slide draws centred on (G.W/2, G.H/2 - 60) — leaves room for text
      ctx.save();
      slide.draw(ctx, G.W / 2, G.H / 2 - 60, totalT);
      ctx.restore();

      // ── Subtle vignette ───────────────────────────────────────────
      var vig = ctx.createRadialGradient(G.W/2, G.H/2, G.H * 0.25, G.W/2, G.H/2, G.H * 0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, G.W, G.H);

      // ── Story text (fades in) ─────────────────────────────────────
      G.ui.drawSlideText(ctx, slide.lines, G.W / 2, G.H - 120, textAlpha);

      // ── Skip button (always visible) ──────────────────────────────
      SKIP_RECT = G.ui.drawButton(ctx, 'Skip ▶▶', G.W - 90, 36, 130, 46,
        { color: 'rgba(0,0,0,0.45)', fontSize: 18, radius: 10 });

      // ── Slide dots ────────────────────────────────────────────────
      var dotSpacing = 20;
      var dotStartX  = G.W / 2 - (SLIDES.length - 1) * dotSpacing / 2;
      for (var i = 0; i < SLIDES.length; i++) {
        var dx = dotStartX + i * dotSpacing;
        G.art.circle(ctx, dx, G.H - 20, i === slideIdx ? 6 : 4,
          i === slideIdx ? G.COL.gold : 'rgba(255,255,255,0.35)');
      }

      // ── "Tap to continue" hint (subtle, appears after 1.5 s) ─────
      if (slideT > 1.5 && slideIdx < SLIDES.length - 1) {
        var tapAlpha = Math.min(1, (slideT - 1.5) / 0.5) * 0.55;
        ctx.save();
        ctx.globalAlpha = tapAlpha * (0.7 + Math.sin(totalT * 2) * 0.3);
        G.art.centeredText(ctx, 'Tap to continue', G.W / 2, G.H - 42, 16, G.COL.cream);
        ctx.restore();
      }

      // ── Auto-advance progress bar (thin strip at top) ─────────────
      var barW = (slideT / AUTO_ADVANCE) * G.W;
      ctx.fillStyle = 'rgba(245,166,35,0.45)';
      ctx.fillRect(0, 0, Math.min(barW, G.W), 3);
    },

    destroy: function () { detachInput(); },
  };

})();
