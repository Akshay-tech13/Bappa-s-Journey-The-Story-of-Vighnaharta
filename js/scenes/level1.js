// js/scenes/level1.js — Level 1: Modak Mischief (M3)
'use strict';

G.scenes['level1'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.cream);
    G.art.centeredText(ctx, 'Level 1: Modak Mischief — coming in M3', G.W / 2, G.H / 2, 28, G.COL.maroon);
  },
};
