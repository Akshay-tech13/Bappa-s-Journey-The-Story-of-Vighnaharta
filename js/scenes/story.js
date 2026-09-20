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
    bg:    '#2A1A08',
    line1: 'On Mount Kailash, Maa Parvati shaped a little boy',
    line2: 'from sandalwood paste and gave him life.',
  },
  {
    bg:    '#0E1A28',
    line1: 'She asked him to guard her door.',
    line2: 'He stood there, brave and faithful.',
  },
  {
    bg:    '#1A0A2E',
    line1: 'Lord Shiva came home, moved by the boy\'s courage.',
    line2: 'He blessed him — and a golden light filled the world.',
  },
  {
    bg:    '#1A0A00',
    line1: 'Named Ganapati — first among all,',
    line2: 'little Ganesha is now hungry for modaks!',
  },
];

// ── Advance one slide, or go to level1 ────────────────────────────────────
function _storyAdvance() {
  if (_storySlide < _STORY_SLIDES.length - 1) {
    _storySlide++;
    _storySlideT = 0;
    _storyTextA  = 0;
  } else {
    G.sceneManager.goto('level1');
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
        G.sceneManager.goto('level1');
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

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = slide.bg;
    ctx.fillRect(0, 0, G.W, G.H);

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
