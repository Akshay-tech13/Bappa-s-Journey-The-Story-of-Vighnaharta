// js/scenes/title.js — Title screen (M2) + M0 test scene + M1 art gallery
// M0: registers a 'test' scene with a moveable saffron circle.
// M1: registers an 'artGallery' debug scene (opened via ?debug=art).
// M2: the real 'title' scene is added here.

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

// ── Title scene stub (filled in M2) ──────────────────────────────────────
G.scenes['title'] = {
  init:   function () {},
  update: function () {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.darkBg);
    G.art.centeredText(ctx, G.GAME_TITLE,         G.W/2, G.H/2 - 30, 48, G.COL.marigold);
    G.art.centeredText(ctx, 'Title scene — M2',   G.W/2, G.H/2 + 30, 22, G.COL.cream);
  },
};

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

  var PAGE    = 0;           // current gallery page (0 = characters, 1 = props)
  var PAGES   = 2;

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
    // Row 1: Ganesha big (centred, scale 1.4)
    var gx = G.W / 2, gy = 310;
    G.art.centeredText(ctx, 'Bal Ganesha', gx, gy - 160, 18, G.COL.marigold);
    G.art.drawGanesha(ctx, gx, gy, t, { state: state, scale: 1.4 });

    // Row 2: other characters smaller
    var row2y = 600;
    var chars = [
      { lbl: 'Mushak',    fn: function(c,x,y){ G.art.drawMushak(c,x,y,t,{scale:1.2}); } },
      { lbl: 'Maa Parvati', fn: function(c,x,y){ G.art.drawParvati(c,x,y,t,{scale:1.0}); } },
      { lbl: 'Lord Shiva', fn: function(c,x,y){ G.art.drawShiva(c,x,y,t,{scale:1.0}); } },
      { lbl: 'Kartikeya', fn: function(c,x,y){ G.art.drawKartikeya(c,x,y,t,{scale:1.0}); } },
      { lbl: 'Devotee',   fn: function(c,x,y){ G.art.drawDevotee(c,x,y,t,{scale:1.0,handsUp:true}); } },
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
      if (G.input.state.swipeLeft)  { PAGE = (PAGE - 1 + PAGES) % PAGES; }
      if (G.input.state.swipeRight) { PAGE = (PAGE + 1) % PAGES; }
    },

    draw: function (ctx) {
      // Warm cream background
      G.art.clearBg(ctx, '#2E1A00');

      // Title bar
      G.art.centeredText(ctx, 'ART GALLERY — ' + (PAGE === 0 ? 'Characters' : 'Props'), G.W/2, 36, 26, G.COL.marigold);
      G.art.centeredText(ctx, 'Page ' + (PAGE + 1) + ' / ' + PAGES, G.W/2, 64, 16, G.COL.gold);

      if (PAGE === 0) drawCharPage(ctx);
      else            drawPropPage(ctx);

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
