// js/scenes/end.js — End / score screen (M6)
'use strict';

G.scenes['end'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.darkBg);
    G.art.centeredText(ctx, 'End screen — coming in M6', G.W / 2, G.H / 2, 28, G.COL.marigold);
  },
};
