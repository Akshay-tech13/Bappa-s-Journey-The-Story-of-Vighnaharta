// js/scenes/story.js — Story slides (M2)
'use strict';

G.scenes['story'] = {
  init:   function () {},
  update: function (dt) {},
  draw:   function (ctx) {
    G.art.clearBg(ctx, G.COL.darkBg);
    G.art.centeredText(ctx, 'Story slides — coming in M2', G.W / 2, G.H / 2, 28, G.COL.cream);
  },
};
