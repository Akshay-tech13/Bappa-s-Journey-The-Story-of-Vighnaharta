// js/scenes/recap.js — Recap slides (M6)
'use strict';

G.scenes['recap'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.darkBg);
    G.art.centeredText(ctx, 'Recap slides — coming in M6', G.W / 2, G.H / 2, 28, G.COL.cream);
  },
};
