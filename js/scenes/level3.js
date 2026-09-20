// js/scenes/level3.js — Level 3: Visarjan Walk (M5)
'use strict';

G.scenes['level3'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.indigo);
    G.art.centeredText(ctx, 'Level 3: Visarjan Walk — coming in M5', G.W / 2, G.H / 2, 28, G.COL.gold);
  },
};
