// js/scenes/story.js — 4 story slides
// Flat, readable code. No closures, no helper functions.

'use strict';

// ── Scene state (module-level vars, reset in init) ────────────────────────
var _storySlide    = 0;    // current slide index 0-3
var _storySlideT   = 0;    // seconds on this slide
var _storyTotalT   = 0;    // seconds in scene
var _storyTextA    = 0;    // text fade alpha 0-1
var _storySkipRect = null; // hit-rect for skip button, set each draw frame
var _storyHandler  = null; // canvas event handler (detached on destroy)
var _storyIgnore   = 0;    // ignore input until this timestamp (ms)

// Auto-advance after 4 seconds per slide
var _STORY_AUTO = 4;

// ── Slide data: bg colour, two text lines ─────────────────────────────────
var _STORY_SLIDES = [
  {
    bg:    '#3D2B1F',   // warm dark brown — lighter so characters show
    line1: 'On Mount Kailash, Maa Parvati shaped a little boy',
    line2: 'from sandalwood paste and gave him life.',
  },
  {
    bg:    '#1C2E40',   // dark blue-grey
    line1: 'She asked him to guard her door.',
    line2: 'He stood there, brave and faithful.',
  },
  {
    bg:    '#2A1040',   // dark purple
    line1: 'Lord Shiva came home, moved by the boy\'s courage.',
    line2: 'He blessed him — and a golden light filled the world.',
  },
  {
    bg:    '#2C1A0E',   // warm brown
    line1: 'Named Ganapati — first among all,',
    line2: 'little Ganesha is now hungry for modaks!',
  },
];

// ── Advance one slide, or go to the first level in LEVEL_ORDER ───────────
function _storyAdvance() {
  if (_storySlide < _STORY_SLIDES.length - 1) {
    _storySlide++;
    _storySlideT = 0;
    _storyTextA  = 0;
  } else {
    G.sceneManager.goto(G.LEVEL_ORDER[0] || 'level1');
  }
}

// ── Register the scene ────────────────────────────────────────────────────
G.scenes['story'] = {

  init: function () {
    _storySlide  = 0;
    _storySlideT = 0;
    _storyTotalT = 0;
    _storyTextA  = 0;
    _storySkipRect = null;

    // Ignore clicks for 400 ms — prevents the Play-button click from
    // immediately advancing to slide 2.
    _storyIgnore = performance.now() + 400;

    _storyHandler = function (e) {
      if (performance.now() < _storyIgnore) return;
      var p = G.ui.toLogical(e);
      // Skip button
      if (_storySkipRect &&
          p.x >= _storySkipRect.x && p.x <= _storySkipRect.x + _storySkipRect.w &&
          p.y >= _storySkipRect.y && p.y <= _storySkipRect.y + _storySkipRect.h) {
        G.sceneManager.goto(G.LEVEL_ORDER[0] || 'level1');
        return;
      }
      _storyAdvance();
    };
    G.canvas.addEventListener('click',      _storyHandler);
    G.canvas.addEventListener('touchstart', _storyHandler, { passive: false });
  },

  update: function (dt) {
    _storySlideT += dt;
    _storyTotalT += dt;
    _storyTextA   = Math.min(1, _storySlideT / 0.6);

    // Space / action key advances
    if (G.input.state.actionPressed) {
      _storyAdvance();
      return;
    }
    // Auto-advance
    if (_storySlideT >= _STORY_AUTO) {
      _storyAdvance();
    }
  },

  draw: function (ctx) {
    var slide = _STORY_SLIDES[_storySlide];
    var t = _storyTotalT;
    var cx = G.W / 2;

    // ── Illustration safe area: y 40..540, ground line y=520 ─────────
    var GROUND_Y = 520;
    var cy = 260;   // legacy: used by slide 3 (unchanged positions)

    // ── Background — cohesive night palette across all slides ─────────
    // Each slide uses drawNightCourtyard with a different accent tint,
    // then draws its own foreground on top. Canvas below GROUND_Y is
    // filled by drawNightCourtyard's floor gradient.
    if (_storySlide === 0) {
      G.scenery.drawSky(ctx, 0, GROUND_Y, t);
      // floor under slide 0 scene
      ctx.fillStyle = '#2A1A0E'; ctx.fillRect(0, GROUND_Y, G.W, G.H - GROUND_Y);
    } else if (_storySlide === 1) {
      // drawNightCourtyard called inside slide 1 block (needs stars)
      // floor fill done there; just clear the full canvas first
      ctx.fillStyle = '#1B1F4B'; ctx.fillRect(0, 0, G.W, G.H);
    } else if (_storySlide === 2) {
      // Slide 2 draws its own purple→gold gradient + floor
      ctx.fillStyle = '#2A1040'; ctx.fillRect(0, 0, G.W, G.H);
    } else {
      // Slide 3 uses drawNightCourtyard
      ctx.fillStyle = '#1B1F4B'; ctx.fillRect(0, 0, G.W, G.H);
    }

    // ── Slide illustrations ───────────────────────────────────────────
    if (_storySlide === 0) {
      // ── SLIDE 0: Mount Kailash — Parvati creates the boy ─────────────
      // Stars + moon
      G.scenery.drawStars(ctx, 0, GROUND_Y, t);
      G.scenery.drawMoon(ctx, 160, 90, 44, t);

      // Layered mountain range with snow cap + fog
      G.scenery.drawMountainRange(ctx, GROUND_Y, t);

      // Soft halo over the tallest peak (centre ~x=640)
      G.scenery.drawGlow(ctx, 640, GROUND_Y - 310, 120, '#A090FF', 0.18);

      // Kailash Home — left side on a stone ledge
      G.scenery.drawKailashHome(ctx, 220, GROUND_Y, t);

      // Slow camera drift: scale 1.0 → 1.04 over 4 s then back
      var drift = 1.0 + Math.sin(t * 0.8) * 0.02;
      ctx.save();
      ctx.translate(cx, GROUND_Y);
      ctx.scale(drift, drift);
      ctx.translate(-cx, -GROUND_Y);

      // Stone slab with paste bowl — beside Parvati
      var slabX = cx - 20;
      var slabY = GROUND_Y;
      // Slab
      ctx.beginPath();
      ctx.ellipse(slabX, slabY - 6, 40, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7A6A50'; ctx.fill();
      ctx.strokeStyle = '#3A2A10'; ctx.lineWidth = 1.2; ctx.stroke();
      // Bowl of sandalwood paste
      ctx.beginPath();
      ctx.ellipse(slabX, slabY - 14, 14, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#C07030'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(slabX, slabY - 16, 10, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#D2A679'; ctx.fill();

      // Parvati — centre-right, big (scale 2.4 ≈ 396 px tall)
      G.art.drawParvati(ctx, cx + 200, GROUND_Y, t, { scale: 2.4, pose: 'idle' });

      // Boy forming animation — build cycles 0→1 over 3 s, then stays at 1
      var build = Math.min(1, _storySlideT / 3.0);
      // Position: just in front of Parvati and the slab
      var boyX = slabX + 30;
      var boyY = GROUND_Y;
      if (build < 1) {
        G.art.drawBoy(ctx, boyX, boyY, t, { state: 'forming', scale: 2.7, build: build });
      } else {
        // Fully formed boy — add "breath of life" glow that expands then fades
        var lifeT   = _storySlideT - 3.0;
        var lifeGlow = Math.min(1, lifeT * 0.8) * Math.max(0, 1 - lifeT * 0.25);
        if (lifeGlow > 0) {
          G.scenery.drawGlow(ctx, boyX, boyY - 140, 100 + lifeT * 20, '#FFD86B', lifeGlow * 0.6);
        }
        G.art.drawBoy(ctx, boyX, boyY, t, { state: 'idle', scale: 2.7 });
      }

      ctx.restore();  // end camera drift

      // Tap-hint — white 70% pulsing, above text panel
      if (_storySlideT > 1.5) {
        var hintA = Math.min(0.70, (_storySlideT - 1.5) / 0.5) * (0.6 + Math.sin(t * 2.2) * 0.15);
        ctx.save();
        ctx.globalAlpha = hintA;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px -apple-system,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Tap to continue ›', G.W / 2, GROUND_Y + 28);
        ctx.restore();
      }

    } else if (_storySlide === 1) {
      // ── SLIDE 1: Night courtyard — the BOY guards the ornate door ─────
      // Night sky with stars
      G.scenery.drawSky(ctx, 0, GROUND_Y, t);
      G.scenery.drawStars(ctx, 0, GROUND_Y, t);
      G.scenery.drawMoon(ctx, 1100, 80, 36, t);

      // Slow push-in: scale 1.0 → 1.05 over the slide
      var pushIn1 = 1.0 + Math.sin(_storySlideT * 0.5) * 0.025;
      ctx.save();
      ctx.translate(cx, GROUND_Y);
      ctx.scale(pushIn1, pushIn1);
      ctx.translate(-cx, -GROUND_Y);

      // Stone courtyard floor (night-toned)
      ctx.beginPath(); ctx.rect(0, GROUND_Y - 40, G.W, 200);
      var floorGrad = ctx.createLinearGradient(0, GROUND_Y - 40, 0, GROUND_Y + 160);
      floorGrad.addColorStop(0, '#3A2A1A');
      floorGrad.addColorStop(1, '#1C1208');
      ctx.fillStyle = floorGrad; ctx.fill();
      // Floor tile lines
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
      for (var fl = 0; fl < G.W; fl += 80) {
        ctx.beginPath(); ctx.moveTo(fl, GROUND_Y - 40); ctx.lineTo(fl, GROUND_Y + 160); ctx.stroke();
      }

      // Big ornate door — centre of scene
      G.scenery.drawOrnateGateDoor(ctx, cx, GROUND_Y, t);

      // Warm rim light on the boy (glow patch at ground level near door)
      G.scenery.drawGlow(ctx, cx, GROUND_Y - 20, 90, '#FFB860', 0.22);

      // The BOY — guard pose, standing on the steps in front of the door
      // At scale 2.7 the boy is ~300 px tall
      G.art.drawBoy(ctx, cx - 10, GROUND_Y, t, { state: 'guard', scale: 2.7 });

      // Far-right: small calm silhouette of Shiva approaching on a path
      // Fade in after 1 s for anticipation — no drama, no weapon raised
      var shivaFarAlpha = Math.min(0.70, Math.max(0, (_storySlideT - 1.0) / 1.2));
      G.scenery.drawShivaSilhouette(ctx, G.W - 140, GROUND_Y, shivaFarAlpha, t);

      // Drifting petals
      for (var spi = 0; spi < 8; spi++) {
        var spx = (spi * 0.137 * G.W + t * (14 + spi * 3)) % G.W;
        var spy = GROUND_Y - 120 - (spi * 0.09 * 320 + Math.sin(t * 0.8 + spi) * 20) % 320;
        if (spy > 60 && spy < GROUND_Y - 10) {
          G.art.drawPetal(ctx, spx, spy, t + spi * 1.1);
        }
      }

      ctx.restore();  // end push-in

    } else if (_storySlide === 2) {
      // ── SLIDE 2: Temple courtyard at dusk — Shiva blesses the boy ─────
      // Purple → gold gradient sky
      var s2Sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      s2Sky.addColorStop(0,   '#2A1040');
      s2Sky.addColorStop(0.55,'#5A2060');
      s2Sky.addColorStop(1,   '#C87820');
      ctx.fillStyle = s2Sky; ctx.fillRect(0, 0, G.W, GROUND_Y);

      // Temple courtyard floor (warm stone at dusk)
      ctx.beginPath(); ctx.rect(0, GROUND_Y - 30, G.W, 200);
      var s2Floor = ctx.createLinearGradient(0, GROUND_Y - 30, 0, GROUND_Y + 170);
      s2Floor.addColorStop(0, '#7A5828');
      s2Floor.addColorStop(1, '#3A2A10');
      ctx.fillStyle = s2Floor; ctx.fill();

      // Large golden mandala behind the centre — the emotional centrepiece
      G.scenery.drawMandala(ctx, cx, GROUND_Y - 200, 280, t, 0.28);

      // Falling marigold petals (continuous)
      for (var mp = 0; mp < 16; mp++) {
        var mpx = (mp * 0.063 * G.W + t * (10 + mp * 5)) % G.W;
        var mpy = (GROUND_Y - 480 + (mp * 0.07 * 480 + t * (28 + mp * 4)) % 480);
        if (mpy > 40 && mpy < GROUND_Y - 10) {
          G.art.drawPetal(ctx, mpx, mpy, t + mp * 0.8);
        }
      }

      // Rising sparkles (from ground up)
      for (var rk = 0; rk < 12; rk++) {
        var rkPhase = (t * 0.4 + rk * 0.083) % 1;
        var rkx = cx - 200 + rk * 36 + Math.sin(t * 1.2 + rk) * 18;
        var rky = GROUND_Y - rkPhase * 320;
        var rkA = (1 - rkPhase) * 0.7;
        if (rkA > 0.05) {
          ctx.beginPath(); ctx.arc(rkx, rky, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,230,80,' + rkA + ')'; ctx.fill();
        }
      }

      // ── Lord Shiva — left, large, calm, blessing hand ─────────────
      // scale 2.5 ≈ 440 px tall
      G.art.drawShiva(ctx, cx - 320, GROUND_Y, t, { scale: 2.5, pose: 'bless' });

      // ── Blessing glow flowing from Shiva's raised hand ─────────────
      // Hand is roughly at (cx-320+40, GROUND_Y-270) at scale 2.5
      var handX = cx - 270;
      var handY = GROUND_Y - 300;
      var blessIntensity = 0.45 + Math.sin(t * 2.5) * 0.15;
      G.scenery.drawGlow(ctx, handX, handY, 180, '#FFD86B', blessIntensity * 0.6);

      // Golden light bridge from hand toward the boy
      var bridgeAlpha = 0.25 + Math.sin(t * 2) * 0.1;
      var boyS2X = cx + 60;
      var midBX  = (handX + boyS2X) / 2;
      ctx.save();
      ctx.globalAlpha = bridgeAlpha;
      var bridge = ctx.createLinearGradient(handX, handY, boyS2X, GROUND_Y - 260);
      bridge.addColorStop(0, 'rgba(255,220,80,0.8)');
      bridge.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.beginPath();
      ctx.moveTo(handX - 8, handY);
      ctx.quadraticCurveTo(midBX, handY - 30, boyS2X, GROUND_Y - 260);
      ctx.lineTo(boyS2X + 8, GROUND_Y - 260);
      ctx.quadraticCurveTo(midBX + 8, handY - 22, handX + 8, handY);
      ctx.closePath();
      ctx.fillStyle = bridge; ctx.fill();
      ctx.restore();

      // ── Crossfade boy → Ganesha ────────────────────────────────────
      // progress: 0..1 over first 3 s; crossfade boy→Ganesha at 0.6-1.0
      var s2prog = Math.min(1, _storySlideT / 3.0);
      var boyAlpha2 = s2prog < 0.6 ? 1 : Math.max(0, 1 - (s2prog - 0.6) / 0.4);
      var gnAlpha2  = s2prog < 0.6 ? 0 : Math.min(1, (s2prog - 0.6) / 0.4);

      // Elephant head of light assembles above centre during blessing
      G.scenery.drawElephantHeadOfLight(ctx, boyS2X, GROUND_Y - 240, s2prog, t);

      // Boy (fades out)
      if (boyAlpha2 > 0.02) {
        ctx.save(); ctx.globalAlpha = boyAlpha2;
        G.art.drawBoy(ctx, boyS2X, GROUND_Y, t, { state: 'idle', scale: 2.7 });
        ctx.restore();
      }
      // Ganesha in celebrate pose (fades in with glow burst)
      if (gnAlpha2 > 0.02) {
        ctx.save(); ctx.globalAlpha = gnAlpha2;
        // Burst glow behind Ganesha at moment of transformation
        G.scenery.drawGlow(ctx, boyS2X, GROUND_Y - 150, 160, '#FFD86B', gnAlpha2 * 0.55);
        G.art.drawGanesha(ctx, boyS2X, GROUND_Y, t, { state: 'celebrate', scale: 2.7 });
        ctx.restore();
      }

      // ── Maa Parvati — far right, at the doorway, folded hands ──────
      // scale 2.4 ≈ 396 px tall; fade in after 1 s
      var parv2Alpha = Math.min(1, Math.max(0, (_storySlideT - 1.0) / 0.8));
      if (parv2Alpha > 0.02) {
        ctx.save(); ctx.globalAlpha = parv2Alpha;
        G.art.drawParvati(ctx, G.W - 180, GROUND_Y, t, { scale: 2.4, pose: 'smile' });
        ctx.restore();
      }

    } else if (_storySlide === 3) {
      // ── SLIDE 3: Cosy Kailash courtyard — Ganesha and the modak plate ─
      // DRAW ORDER: background → props → Mushak → Ganesha → edge sparkles
      // Nothing may overlap Ganesha's face/trunk.

      // 1. Night courtyard sky + floor (amber-tinted horizon for warmth)
      G.scenery.drawNightCourtyard(ctx, GROUND_Y, '#D08020', t);

      // 2. Overhead hanging garlands (far background, y ~60-120)
      G.scenery.drawMarigoldGarland(ctx, 0,     80, 400,  80, t);
      G.scenery.drawMarigoldGarland(ctx, 400,   70, 800,  70, t);
      G.scenery.drawMarigoldGarland(ctx, 800,   75, G.W,  75, t);

      // 3. Left: Parvati's warm kitchen doorway (silhouette inside)
      G.scenery.drawParvatiDoorway(ctx, 160, GROUND_Y, t);

      // 4. Diyas either side of scene (on the floor)
      G.art.drawDiya(ctx, 340, GROUND_Y, true, t);
      G.art.drawDiya(ctx, G.W - 140, GROUND_Y, true, t);

      // 5. Table with modak plate — placed right of centre so Ganesha
      //    stands to the LEFT of it. Table centre x=820.
      var tableX = 820;
      G.scenery.drawModakPlateTable(ctx, tableX, GROUND_Y, t);

      // 6. Mushak — peeking from behind the RIGHT end of the table
      //    dir:-1 so he faces left toward Ganesha
      G.art.drawMushak(ctx, tableX + 110, GROUND_Y, t, { scale: 1.4, pose: 'peek', dir: -1 });

      // 7. Ganesha — centre, big, drawn LAST so he is always on top
      //    At scale 2.7 ≈ 297 px tall; feet at GROUND_Y, crown ~y=223
      var gnX3 = cx - 80;   // slightly left of centre
      G.art.drawGanesha(ctx, gnX3, GROUND_Y, t, { state: 'idle', scale: 2.7 });

      // 8. Thought bubble above Ganesha (above crown, clear of safe area)
      //    Crown is at ~GROUND_Y - 297, so bubble floats at y ~GROUND_Y - 330
      var bubX = gnX3 + 80;
      var bubY = GROUND_Y - 320;
      // Bubble chain (three small circles ascending)
      for (var bb = 0; bb < 3; bb++) {
        var bbr = 4 + bb * 2;
        var bby = bubY + 36 - bb * 14;
        ctx.beginPath(); ctx.arc(bubX, bby, bbr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill();
        ctx.strokeStyle = 'rgba(180,140,40,0.55)'; ctx.lineWidth = 1; ctx.stroke();
      }
      // Main bubble oval
      ctx.beginPath(); ctx.ellipse(bubX, bubY - 10, 42, 34, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,245,0.78)'; ctx.fill();
      ctx.strokeStyle = 'rgba(200,160,40,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
      // Pulsing modak inside thought bubble (small scale)
      var bPulse = 0.9 + Math.sin(t * 2.8) * 0.1;
      ctx.save();
      ctx.translate(bubX, bubY - 12);
      ctx.scale(bPulse * 1.4, bPulse * 1.4);
      G.art.drawModak(ctx, 0, 0, 1);
      ctx.restore();

      // 9. Edge sparkles ONLY (constrained far from Ganesha's face)
      //    Ganesha face is roughly between x=gnX3-60 and x=gnX3+60, y<GROUND_Y-180
      //    So sparkles go to left edge (<gnX3-120) or right edge (>gnX3+120)
      for (var sk = 0; sk < 10; sk++) {
        var skPhase = (t * 0.5 + sk * 0.1) % 1;
        var skA = (1 - skPhase) * 0.65;
        if (skA < 0.05) continue;
        // Left-side sparkles
        var skxL = 20 + sk * 28;
        if (skxL < gnX3 - 130) {
          var skyL = GROUND_Y - 80 - skPhase * 260;
          if (skyL > 50) {
            ctx.beginPath(); ctx.arc(skxL, skyL, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,230,80,' + skA + ')'; ctx.fill();
          }
        }
        // Right-side sparkles (table area)
        var skxR = tableX - 60 + sk * 40;
        if (skxR > gnX3 + 130 && skxR < G.W - 20) {
          var skyR = GROUND_Y - 80 - skPhase * 200;
          if (skyR > 50) {
            ctx.beginPath(); ctx.arc(skxR, skyR, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,220,100,' + skA + ')'; ctx.fill();
          }
        }
      }
    }

    // ── Slide number (top-left, small) ────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Slide ' + (_storySlide + 1) + ' / ' + _STORY_SLIDES.length, 20, 20);

    // ── Story text (fades in) ─────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = _storyTextA;
    // Panel behind text
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(G.W/2 - 540, G.H - 180, 1080, 110, 14);
    } else {
      ctx.rect(G.W/2 - 540, G.H - 180, 1080, 110);
    }
    ctx.fill();
    // Line 1
    ctx.fillStyle = '#FFF8E7';
    ctx.font = 'bold 28px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(slide.line1, G.W/2, G.H - 148);
    // Line 2
    ctx.fillText(slide.line2, G.W/2, G.H - 104);
    ctx.restore();

    // ── Skip button ───────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(G.W - 155, 14, 130, 44, 10); }
    else { ctx.rect(G.W - 155, 14, 130, 44); }
    ctx.fill();
    ctx.fillStyle = '#FFF8E7';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Skip ▶▶', G.W - 90, 36);
    _storySkipRect = { x: G.W - 155, y: 14, w: 130, h: 44 };

    // ── Slide dots ────────────────────────────────────────────────────
    for (var di = 0; di < _STORY_SLIDES.length; di++) {
      ctx.beginPath();
      ctx.arc(G.W/2 - (_STORY_SLIDES.length - 1) * 10 + di * 20, G.H - 18,
              di === _storySlide ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = di === _storySlide ? '#FFD700' : 'rgba(255,255,255,0.35)';
      ctx.fill();
    }

    // ── Progress bar at top ───────────────────────────────────────────
    ctx.fillStyle = 'rgba(245,166,35,0.45)';
    ctx.fillRect(0, 0, Math.min((_storySlideT / _STORY_AUTO) * G.W, G.W), 3);

    // ── "Tap to continue" hint ─────────────────────────────────────────
    if (_storySlideT > 1.5 && _storySlide < _STORY_SLIDES.length - 1) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (_storySlideT - 1.5) / 0.5) * 0.5;
      ctx.fillStyle = '#FFF8E7';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tap to continue', G.W/2, G.H - 40);
      ctx.restore();
    }
  },

  destroy: function () {
    if (_storyHandler) {
      G.canvas.removeEventListener('click',      _storyHandler);
      G.canvas.removeEventListener('touchstart', _storyHandler);
      _storyHandler = null;
    }
  },
};
