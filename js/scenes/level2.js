// js/scenes/level2.js — Level 2: The Race (M4)
'use strict';

G.scenes['level2'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.green);
    G.art.centeredText(ctx, 'Level 2: The Race — coming in M4', G.W / 2, G.H / 2, 28, G.COL.white);
  },
};
