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
    var cy = 260;   // fixed illustration centre — characters draw above text panel

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = slide.bg;
    ctx.fillRect(0, 0, G.W, G.H);

    // ── Slide illustrations ───────────────────────────────────────────
    if (_storySlide === 0) {
      // Mountain silhouette — brighter purple so visible on dark bg
      ctx.save();
      ctx.translate(cx, cy + 60);
      ctx.beginPath();
      ctx.moveTo(-240,0); ctx.lineTo(-70,-180); ctx.lineTo(70,-180); ctx.lineTo(240,0);
      ctx.closePath(); ctx.fillStyle = '#6050A0'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-35,-180); ctx.lineTo(0,-220); ctx.lineTo(35,-180);
      ctx.fillStyle = '#E0E8FF'; ctx.fill();
      ctx.restore();
      // Parvati — moved right so mountain and character don't overlap
      G.art.drawParvati(ctx, cx + 80, cy + 200, t, { scale: 1.2 });
      // Glowing sandalwood form
      var grd0 = ctx.createRadialGradient(cx+40, cy+70, 4, cx+40, cy+70, 32);
      grd0.addColorStop(0, 'rgba(255,220,100,0.9)');
      grd0.addColorStop(1, 'rgba(255,180,50,0)');
      ctx.beginPath(); ctx.arc(cx+40, cy+70, 32, 0, Math.PI*2);
      ctx.fillStyle = grd0; ctx.fill();
      G.art.ellipse(ctx, cx+40, cy+80, 16, 20, '#D2A679');
      // Twinkling stars
      var ss = [0.12,0.28,0.45,0.61,0.73,0.88,0.05,0.34,0.56,0.79];
      for (var si=0;si<ss.length;si++){
        G.art.circle(ctx,(ss[si]*1.3%1)*G.W, ss[si]*(cy+20),
          1.5+(si%3)*0.8,'rgba(255,255,220,'+(0.4+Math.sin(t*(1.5+si*0.2)+si)*0.3)+')');
      }

    } else if (_storySlide === 1) {
      // Archway door
      ctx.save(); ctx.translate(cx, cy+60);
      G.art.roundRect(ctx,-50,-120,100,120,8,'#4A2A0A');
      G.art.roundRect(ctx,-44,-114,88,112,6,'#6B3A18');
      ctx.beginPath(); ctx.arc(0,-120,50,Math.PI,0); ctx.fillStyle='#4A2A0A'; ctx.fill();
      ctx.beginPath(); ctx.arc(0,-120,44,Math.PI,0); ctx.fillStyle='#6B3A18'; ctx.fill();
      G.art.circle(ctx, 24,-70, 5, G.COL.gold);
      ctx.restore();
      // Ganesha guarding
      G.art.drawGanesha(ctx, cx, cy+200, t, { state:'idle', scale:1.2 });
      // Diyas either side
      G.art.drawDiya(ctx, cx-160, cy+150, true, t);
      G.art.drawDiya(ctx, cx+160, cy+150, true, t);
      // Stars
      var ss2=[0.12,0.28,0.45,0.61,0.73,0.88,0.05,0.34,0.56,0.79];
      for(var si2=0;si2<ss2.length;si2++){
        G.art.circle(ctx,(ss2[si2]*1.3%1)*G.W,ss2[si2]*(cy+20),
          1.5+(si2%3)*0.8,'rgba(255,255,220,'+(0.4+Math.sin(t*(1.5+si2*0.2)+si2)*0.3)+')');
      }

    } else if (_storySlide === 2) {
      // Shiva + golden blessing glow
      G.art.drawShiva(ctx, cx-100, cy+200, t, { scale:1.1 });
      var pulse = 0.55 + Math.sin(t*2.5)*0.2;
      var grd2 = ctx.createRadialGradient(cx+60,cy+80,8,cx+60,cy+80,90);
      grd2.addColorStop(0,'rgba(255,220,60,'+pulse+')');
      grd2.addColorStop(0.5,'rgba(255,160,30,'+(pulse*0.5)+')');
      grd2.addColorStop(1,'rgba(255,160,30,0)');
      ctx.beginPath(); ctx.arc(cx+60,cy+80,90,0,Math.PI*2);
      ctx.fillStyle=grd2; ctx.fill();
      // Elephant-head silhouette in glow
      ctx.save(); ctx.translate(cx+60,cy+80); ctx.globalAlpha=pulse*0.75;
      G.art.ellipse(ctx,0,-10,30,28,G.COL.gold);
      G.art.ellipse(ctx,32,-8,16,20,G.COL.gold);
      G.art.ellipse(ctx,-32,-8,16,20,G.COL.gold);
      ctx.beginPath(); ctx.moveTo(6,10);
      ctx.bezierCurveTo(20,20,24,30,18,36); ctx.bezierCurveTo(14,40,6,38,4,34);
      ctx.strokeStyle=G.COL.gold; ctx.lineWidth=8; ctx.lineCap='round'; ctx.stroke();
      ctx.restore();
      // Orbiting light dots
      for(var oi=0;oi<8;oi++){
        var oa=(oi/8)*Math.PI*2+t*0.8;
        var or=55+Math.sin(t*1.5+oi)*12;
        G.art.circle(ctx,cx+60+Math.cos(oa)*or,cy+80+Math.sin(oa)*or*0.5,3,'rgba(255,230,100,0.7)');
      }

    } else if (_storySlide === 3) {
      // Ganesha celebrating with floating modaks
      G.art.drawGanesha(ctx, cx, cy+200, t, { state:'celebrate', scale:1.3 });
      var mpos=[[-160,-20,0],[140,-40,1.2],[-100,-90,2.4],[100,-80,0.6],[0,-120,1.8]];
      for(var mi=0;mi<mpos.length;mi++){
        G.art.drawModak(ctx,cx+mpos[mi][0],cy+200+mpos[mi][1]+Math.sin(t*2+mpos[mi][2])*8,1.2);
      }
      for(var pi=0;pi<12;pi++){
        G.art.drawPetal(ctx,cx+Math.cos(pi/12*Math.PI*2+t*0.3)*200,cy+100+Math.sin(pi/12*Math.PI*2+t*0.5)*60,t+pi);
      }
      G.art.drawDevotee(ctx,cx-220,cy+200,t,{scale:0.8,phase:0,handsUp:true,color:G.COL.maroon});
      G.art.drawDevotee(ctx,cx+220,cy+200,t,{scale:0.8,phase:1.4,handsUp:true,color:G.COL.green});
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
