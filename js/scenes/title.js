// js/scenes/title.js — Title screen + M0 test scene + M1 art gallery
// M0: 'test' scene (moveable circle).
// M1: 'artGallery' debug scene (?debug=art).
// M2: real 'title' scene — Ganesha idle, drifting petals, Play button.

'use strict';

// ── M0 Test scene ─────────────────────────────────────────────────────────
(function () {
  var x     = G.W / 2;
  var y     = G.H / 2;
  var color = G.COL.saffron;
  var RADIUS = 40;

  G.scenes['test'] = {
    init: function () { x = G.W / 2; y = G.H / 2; color = G.COL.saffron; },
    update: function (dt) {
      var inp = G.input.state;
      x += inp.move.x * G.PLAYER_SPEED * dt;
      y += inp.move.y * G.PLAYER_SPEED * dt;
      x = Math.max(RADIUS, Math.min(G.W - RADIUS, x));
      y = Math.max(RADIUS, Math.min(G.H - RADIUS, y));
      if (inp.actionPressed) {
        color = (color === G.COL.saffron) ? G.COL.marigold : G.COL.saffron;
        G.audio.blessingShimmer();
      }
    },
    draw: function (ctx) {
      G.art.clearBg(ctx, G.COL.darkBg);
      G.art.circle(ctx, x, y, RADIUS, color);
      G.art.centeredText(ctx, 'M0 Test — WASD/joystick to move  |  Space = change colour', G.W/2, 44, 20, G.COL.cream);
      G.art.centeredText(ctx, G.GAME_TITLE + ' — ' + G.GAME_SUBTITLE, G.W/2, G.H - 40, 18, G.COL.marigold);
      var inp = G.input.state;
      G.art.centeredText(ctx,
        'move(' + inp.move.x.toFixed(2) + ',' + inp.move.y.toFixed(2) + ')  action:' + inp.actionHeld,
        G.W/2, 74, 16, G.COL.gold);
    },
  };
})();

// ── Title scene (M2) ──────────────────────────────────────────────────────
(function () {

  var t         = 0;
  var playRect  = null;   // hit-rect for Play button (set during draw)
  var muteRect  = null;   // hit-rect for mute button on title

  // Drifting petal particles
  var PETAL_COUNT = 18;
  var petals = [];
  function resetPetals() {
    petals = [];
    for (var i = 0; i < PETAL_COUNT; i++) {
      petals.push({
        x:    Math.random() * G.W,
        y:    Math.random() * G.H,
        vy:   20 + Math.random() * 30,       // downward drift px/s
        vx:   (Math.random() - 0.5) * 15,    // gentle sideways
        phase: Math.random() * Math.PI * 2,  // individual spin offset
      });
    }
  }

  // Input handler
  var ignoreUntil  = 0;
  var clickHandler = null;
  function attachInput() {
    ignoreUntil = performance.now() + 350;
    clickHandler = function (e) {
      if (performance.now() < ignoreUntil) return;
      G.audio.unlock();
      var p = G.ui.toLogical(e);
      if (playRect && G.ui.isButtonHit(p.x, p.y, playRect)) {
        G.audio.chime();
        G.sceneManager.goto('story');
      }
      if (muteRect && G.ui.isButtonHit(p.x, p.y, muteRect)) {
        G.audio.toggleMute();
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

  G.scenes['title'] = {
    init: function () {
      t = 0;
      resetPetals();
      attachInput();
    },

    update: function (dt) {
      t += dt;
      // Space / action key also starts the game
      if (G.input.state.actionPressed) {
        G.audio.chime();
        G.sceneManager.goto('story');
      }
      // Update petals
      petals.forEach(function (p) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > G.H + 20) { p.y = -20; p.x = Math.random() * G.W; }
        if (p.x < -20)      { p.x = G.W + 20; }
        if (p.x > G.W + 20) { p.x = -20; }
      });
    },

    draw: function (ctx) {
      // ── Background gradient (warm dawn sky) ────────────────────────
      var grad = ctx.createLinearGradient(0, 0, 0, G.H);
      grad.addColorStop(0,   '#2C1A0E');
      grad.addColorStop(0.5, '#4A2810');
      grad.addColorStop(1,   '#1A1A2E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, G.W, G.H);

      // ── Drifting petals ────────────────────────────────────────────
      petals.forEach(function (p) {
        G.art.drawPetal(ctx, p.x, p.y, t + p.phase);
      });

      // ── Ganesha idle, left of centre ───────────────────────────────
      G.art.drawGanesha(ctx, G.W / 2 - 160, G.H / 2 + 80, t, { state: 'idle', scale: 1.6 });

      // ── Title text ─────────────────────────────────────────────────
      // Large title
      ctx.save();
      ctx.shadowColor = G.COL.gold;
      ctx.shadowBlur  = 18;
      G.art.centeredText(ctx, G.GAME_TITLE,    G.W / 2 + 80, G.H / 2 - 80, 54, G.COL.marigold);
      ctx.restore();
      G.art.centeredText(ctx, G.GAME_SUBTITLE, G.W / 2 + 80, G.H / 2 - 20, 22, G.COL.gold);

      // How to play hint
      G.art.centeredText(ctx,
        'Collect modaks  •  Light diyas  •  Earn blessings',
        G.W / 2 + 80, G.H / 2 + 30, 18, G.COL.cream);

      // ── Play button ────────────────────────────────────────────────
      // Pulse scale for the play button
      var pulse = 1 + Math.sin(t * 2.5) * 0.03;
      ctx.save();
      ctx.translate(G.W / 2 + 80, G.H / 2 + 110);
      ctx.scale(pulse, pulse);
      ctx.translate(-(G.W / 2 + 80), -(G.H / 2 + 110));
      playRect = G.ui.drawButton(ctx, '▶  Play', G.W / 2 + 80, G.H / 2 + 110, 200, 60,
        { color: G.COL.saffron, fontSize: 26, radius: 16 });
      ctx.restore();

      // ── Mute button (top-right, same position as the HTML button) ──
      muteRect = G.ui.drawButton(ctx, G.audio.isMuted() ? '🔇' : '🔊',
        G.W - 36, 36, 54, 54,
        { color: 'rgba(0,0,0,0.45)', fontSize: 20, radius: 27 });

      // ── Controls hint at bottom ────────────────────────────────────
      G.art.centeredText(ctx,
        'WASD / Arrow keys  •  Space = Blessing  •  M = mute',
        G.W / 2, G.H - 28, 16, 'rgba(255,248,231,0.55)');
    },

    destroy: function () { detachInput(); },
  };

})();

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  M1 — ART GALLERY DEBUG SCENE                                       ║
// ║  Open with:  index.html?debug=art                                   ║
// ║  Shows every character and prop with live animation.                ║
// ║  [ < ] / [ > ] buttons cycle pages.  Animation cycles automatically ║
// ╚══════════════════════════════════════════════════════════════════════╝
(function () {

  var t       = 0;           // elapsed time (seconds)
  var state   = 'idle';      // Ganesha anim state
  var states  = ['idle', 'walk', 'celebrate'];
  var stateIdx= 0;

  var PAGE    = 0;           // gallery page (0 = characters, 1 = props, 2 = Parvati)
  var PAGES   = 3;

  // Button hit-areas (in logical px)
  var btnPrev = { x: 60,       y: G.H - 50, w: 100, h: 44 };
  var btnNext = { x: G.W - 160,y: G.H - 50, w: 100, h: 44 };
  var btnState= { x: G.W/2 - 70, y: G.H - 50, w: 140, h: 44 };

  // ── Button hit test ──────────────────────────────────────────────────
  function inBtn(bx, by, btn) {
    return bx >= btn.x && bx <= btn.x + btn.w &&
           by >= btn.y && by <= btn.y + btn.h;
  }

  // Convert a mouse/touch event to logical canvas coords
  function toLogical(e) {
    var rect  = G.canvas.getBoundingClientRect();
    var scaleX= G.W / rect.width;
    var scaleY= G.H / rect.height;
    var cx    = (e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - rect.left;
    var cy    = (e.clientY !== undefined ? e.clientY : e.touches[0].clientY) - rect.top;
    return { x: cx * scaleX, y: cy * scaleY };
  }

  // ── Click / tap handler — registered once, removed when leaving ──────
  var clickHandler = null;

  function attachButtons() {
    clickHandler = function (e) {
      var p = toLogical(e);
      if (inBtn(p.x, p.y, btnPrev)) {
        PAGE = (PAGE - 1 + PAGES) % PAGES;
      } else if (inBtn(p.x, p.y, btnNext)) {
        PAGE = (PAGE + 1) % PAGES;
      } else if (inBtn(p.x, p.y, btnState)) {
        stateIdx = (stateIdx + 1) % states.length;
        state    = states[stateIdx];
      }
    };
    G.canvas.addEventListener('click',      clickHandler);
    G.canvas.addEventListener('touchstart', clickHandler, { passive: true });
  }

  function detachButtons() {
    if (clickHandler) {
      G.canvas.removeEventListener('click',      clickHandler);
      G.canvas.removeEventListener('touchstart', clickHandler);
      clickHandler = null;
    }
  }

  // ── Draw a labelled cell (character or prop) ─────────────────────────
  function cell(ctx, label, drawFn, cx, cy) {
    // Card background
    G.art.roundRect(ctx, cx - 70, cy - 130, 140, 150, 10, 'rgba(255,248,231,0.12)');
    // Draw the art centred in the cell
    drawFn(ctx, cx, cy);
    // Label
    G.art.centeredText(ctx, label, cx, cy + 24, 14, G.COL.cream);
  }

  // ── Page 0: Characters ───────────────────────────────────────────────
  function drawCharPage(ctx) {
    // Row 1: Ganesha in all 4 poses at scale 1.0
    var poses = [
      { lbl: 'idle',      fn: function(c,x,y){ G.art.drawGanesha(c,x,y,t,{state:'idle',     scale:1.0}); } },
      { lbl: 'walk →',    fn: function(c,x,y){ G.art.drawGanesha(c,x,y,t,{state:'walk',     scale:1.0,dir:1}); } },
      { lbl: 'walk ←',    fn: function(c,x,y){ G.art.drawGanesha(c,x,y,t,{state:'walk',     scale:1.0,dir:-1}); } },
      { lbl: 'celebrate', fn: function(c,x,y){ G.art.drawGanesha(c,x,y,t,{state:'celebrate',scale:1.0}); } },
      { lbl: 'bless',     fn: function(c,x,y){ G.art.drawGanesha(c,x,y,t,{state:'bless',    scale:1.0}); } },
      { lbl: 'on Mushak', fn: function(c,x,y){ G.art.drawGaneshaOnMushak(c,x,y,t,{scale:0.9}); } },
    ];
    var sp1 = G.W / (poses.length + 1);
    var row1y = 290;
    G.art.centeredText(ctx, 'Bal Ganesha — all poses', G.W/2, 60, 18, G.COL.marigold);
    poses.forEach(function (p, i) {
      cell(ctx, p.lbl, p.fn, sp1 * (i + 1), row1y);
    });

    // Row 2: other characters smaller
    var row2y = 590;
    var chars = [
      { lbl: 'Mushak',      fn: function(c,x,y){ G.art.drawMushak(c,x,y,t,{scale:1.2}); } },
      { lbl: 'Parvati idle',fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:0.65,pose:'idle'}); } },
      { lbl: 'Lord Shiva',  fn: function(c,x,y){ G.art.drawShiva(c,x,y,t,{scale:1.0}); } },
      { lbl: 'Kartikeya',   fn: function(c,x,y){ G.art.drawKartikeya(c,x,y,t,{scale:1.0}); } },
      { lbl: 'Devotee',     fn: function(c,x,y){ G.art.drawDevotee(c,x,y,t,{scale:1.0,handsUp:true}); } },
    ];
    var spacing = G.W / (chars.length + 1);
    chars.forEach(function (ch, i) {
      cell(ctx, ch.lbl, ch.fn, spacing * (i + 1), row2y);
    });
  }

  // ── Page 1: Props ─────────────────────────────────────────────────────
  function drawPropPage(ctx) {
    var items = [
      { lbl: 'Modak',        fn: function(c,x,y){ G.art.drawModak(c,x,y,1.8); } },
      { lbl: 'Modak Plate',  fn: function(c,x,y){ G.art.drawModakPlate(c,x,y,t); } },
      { lbl: 'Diya (lit)',   fn: function(c,x,y){ G.art.drawDiya(c,x,y,true,t); } },
      { lbl: 'Diya (unlit)', fn: function(c,x,y){ G.art.drawDiya(c,x,y,false,t); } },
      { lbl: 'Petal',        fn: function(c,x,y){ G.art.drawPetal(c,x,y-20,t); } },
      { lbl: 'Pot',          fn: function(c,x,y){ G.art.drawPot(c,x,y); } },
      { lbl: 'Stool',        fn: function(c,x,y){ G.art.drawStool(c,x,y); } },
      { lbl: 'Table',        fn: function(c,x,y){ G.art.drawTable(c,x,y); } },
      { lbl: 'Rock',         fn: function(c,x,y){ G.art.drawRock(c,x,y); } },
      { lbl: 'Log',          fn: function(c,x,y){ G.art.drawLog(c,x,y); } },
      { lbl: 'Bush',         fn: function(c,x,y){ G.art.drawBush(c,x,y); } },
      { lbl: 'Wisdom Fruit', fn: function(c,x,y){ G.art.drawWisdomFruit(c,x,y,t); } },
      { lbl: 'Finish Flag',  fn: function(c,x,y){ G.art.drawFinishFlag(c,x,y-50); } },
      { lbl: 'Clay Murti',   fn: function(c,x,y){ G.art.drawMurti(c,x,y,t); } },
    ];
    // 7 per row, 2 rows
    var cols  = 7;
    var rows  = Math.ceil(items.length / cols);
    var cellW = G.W / cols;
    var rowY  = [230, 530];
    items.forEach(function (item, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx  = cellW * col + cellW / 2;
      var cy  = rowY[row] || (rowY[rowY.length - 1] + 300);
      cell(ctx, item.lbl, item.fn, cx, cy);
    });
  }

  // ── Page 2: Maa Parvati — all poses and directions ────────────────────
  function drawParvatiPage(ctx) {
    var sc = 0.62;  // fits 165px character into 150px cell comfortably
    // Row 1: front poses (idle, walk, look, smile, bless, seated)
    var row1Poses = [
      { lbl: 'idle',   fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, pose:'idle'}); } },
      { lbl: 'walk →', fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, pose:'walk', dir:1}); } },
      { lbl: 'walk ←', fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, pose:'walk', dir:-1}); } },
      { lbl: 'look',   fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, pose:'look'}); } },
      { lbl: 'smile',  fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, pose:'smile'}); } },
      { lbl: 'bless',  fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, pose:'bless'}); } },
    ];
    var sp1  = G.W / (row1Poses.length + 1);
    var row1y = 280;
    G.art.centeredText(ctx, 'Front / Side — all poses', G.W/2, 90, 16, G.COL.cream);
    row1Poses.forEach(function(p, i) {
      cell(ctx, p.lbl, p.fn, sp1 * (i + 1), row1y);
    });

    // Row 2: back view + seated + scaled sizes
    var row2Poses = [
      { lbl: 'back (up)',  fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc, dir:'up'}); } },
      { lbl: 'seated',     fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:sc*1.1, pose:'seated'}); } },
      { lbl: 'scale 0.4',  fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:0.4, pose:'idle'}); } },
      { lbl: 'scale 1.0',  fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:0.4*2.5, pose:'walk', dir:1}); } },
    ];
    var sp2  = G.W / (row2Poses.length + 1);
    var row2y = 570;
    G.art.centeredText(ctx, 'Special poses + scale checks', G.W/2, 440, 16, G.COL.cream);
    row2Poses.forEach(function(p, i) {
      cell(ctx, p.lbl, p.fn, sp2 * (i + 1), row2y);
    });
  }

  // ── Scene ─────────────────────────────────────────────────────────────
  G.scenes['artGallery'] = {
    init: function () {
      t        = 0;
      PAGE     = 0;
      stateIdx = 0;
      state    = 'idle';
      attachButtons();
    },

    update: function (dt) {
      t += dt;
      // Keyboard: left/right arrow to switch pages; S to cycle state
      if (G.input.state.swipeLeft)  { PAGE = (PAGE - 1 + PAGES) % PAGES; G.input.state.swipeLeft  = false; }
      if (G.input.state.swipeRight) { PAGE = (PAGE + 1) % PAGES;          G.input.state.swipeRight = false; }
    },

    draw: function (ctx) {
      // Warm cream background
      G.art.clearBg(ctx, '#2E1A00');

      // Title bar
      var pgLabel = PAGE === 0 ? 'Characters' : (PAGE === 1 ? 'Props' : 'Maa Parvati — all poses');
      G.art.centeredText(ctx, 'ART GALLERY — ' + pgLabel, G.W/2, 36, 26, G.COL.marigold);
      G.art.centeredText(ctx, 'Page ' + (PAGE + 1) + ' / ' + PAGES, G.W/2, 64, 16, G.COL.gold);

      if      (PAGE === 0) drawCharPage(ctx);
      else if (PAGE === 1) drawPropPage(ctx);
      else                 drawParvatiPage(ctx);

      // ── Bottom buttons ─────────────────────────────────────────────
      function btn(b, label) {
        G.art.roundRect(ctx, b.x, b.y, b.w, b.h, 8, G.COL.saffron);
        G.art.centeredText(ctx, label, b.x + b.w/2, b.y + b.h/2, 16, G.COL.white);
      }
      btn(btnPrev,  '◀ Prev');
      btn(btnNext,  'Next ▶');
      btn(btnState, 'State: ' + state);

      // Page dots
      for (var d = 0; d < PAGES; d++) {
        G.art.circle(ctx, G.W/2 - (PAGES - 1) * 10 + d * 20, G.H - 20, 5,
          d === PAGE ? G.COL.gold : 'rgba(255,255,255,0.3)');
      }
    },

    // Clean up when leaving
    destroy: function () { detachButtons(); },
  };

})();
