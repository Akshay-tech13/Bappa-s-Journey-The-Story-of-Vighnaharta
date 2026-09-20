// js/input.js — keyboard, virtual joystick, action button, swipe
// Normalises all input into G.input so scenes never touch DOM events.

'use strict';

G.input = (function () {

  // ── Public state (scenes read these) ──────────────────────────────────
  var state = {
    move:          { x: 0, y: 0 },  // normalised direction vector (-1..1)
    actionPressed: false,            // true for one frame when action fires
    actionHeld:    false,            // true while action is held down
    swipeLeft:     false,            // true for one frame on left swipe
    swipeRight:    false,            // true for one frame on right swipe
  };

  // ── Keyboard ──────────────────────────────────────────────────────────
  var keys = {};

  document.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (e.code === 'KeyM') {
      G.audio.toggleMute();
    }
    // Prevent arrow keys / space from scrolling the page
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) !== -1) {
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', function (e) {
    keys[e.code] = false;
  });

  // ── Virtual joystick ─────────────────────────────────────────────────
  var joyActive   = false;
  var joyId       = null;
  var joyStartX   = 0;
  var joyStartY   = 0;
  var joyDX       = 0;   // current joystick delta
  var joyDY       = 0;
  var JOY_RADIUS  = 40;  // max displacement of knob in CSS px

  var joyZone  = document.getElementById('joystickZone');
  var joyKnob  = document.getElementById('joystickKnob');

  joyZone.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    var rect = joyZone.getBoundingClientRect();
    joyId     = t.identifier;
    joyStartX = rect.left + rect.width  / 2;
    joyStartY = rect.top  + rect.height / 2;
    joyActive = true;
  }, { passive: false });

  document.addEventListener('touchmove', function (e) {
    if (!joyActive) return;
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier !== joyId) continue;
      var dx = t.clientX - joyStartX;
      var dy = t.clientY - joyStartY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > JOY_RADIUS) {
        dx = dx / dist * JOY_RADIUS;
        dy = dy / dist * JOY_RADIUS;
      }
      joyDX = dx;
      joyDY = dy;
      // Move knob visually
      joyKnob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    }
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyId) {
        joyActive = false;
        joyId     = null;
        joyDX     = 0;
        joyDY     = 0;
        joyKnob.style.transform = 'translate(-50%, -50%)';
      }
    }
  }, { passive: false });

  // ── Blessing / action button ──────────────────────────────────────────
  var blessingBtn   = document.getElementById('blessingBtn');
  var blessingTouch = false;

  blessingBtn.addEventListener('touchstart', function (e) {
    e.preventDefault();
    blessingTouch = true;
  }, { passive: false });

  blessingBtn.addEventListener('touchend', function (e) {
    e.preventDefault();
    blessingTouch = false;
  }, { passive: false });

  // ── Swipe detection (for Level 2 lane switching) ──────────────────────
  var swipeTouchId = null;
  var swipeStartX  = 0;
  var SWIPE_THRESH = 40;  // minimum px horizontal movement

  // Track swipe touches that did NOT start on the joystick zone
  document.addEventListener('touchstart', function (e) {
    if (swipeTouchId !== null) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      // Ignore touches that belong to joystick or blessing button
      if (t.identifier === joyId) continue;
      swipeTouchId = t.identifier;
      swipeStartX  = t.clientX;
    }
  }, { passive: false });

  document.addEventListener('touchend', function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier !== swipeTouchId) continue;
      var dx = t.clientX - swipeStartX;
      if (dx < -SWIPE_THRESH) pendingSwipeLeft  = true;
      if (dx >  SWIPE_THRESH) pendingSwipeRight = true;
      swipeTouchId = null;
    }
  }, { passive: false });

  var pendingSwipeLeft  = false;
  var pendingSwipeRight = false;

  // ── Touch-device detection: show controls when touch is available ─────
  var touchShown = false;
  function showTouchControls() {
    if (touchShown) return;
    touchShown = true;
    document.getElementById('touchControls').style.display = 'block';
    document.getElementById('blessingBtn').style.display  = 'flex';
    // Align blessing button to match canvas position (best effort)
  }

  document.addEventListener('touchstart', function () {
    showTouchControls();
    G.audio.unlock();
  }, { once: false, passive: true });

  // Also unlock audio on first mouse click (desktop)
  document.addEventListener('click', function () {
    G.audio.unlock();
  }, { once: true });

  // Mute button click
  document.getElementById('muteBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    G.audio.toggleMute();
  });

  // ── Update: called once per frame by main.js before scene update ──────
  // Translates raw key/touch state into the clean G.input.state object.
  var prevAction = false;

  function update() {
    // ── Move direction from keyboard ──────────────────────────────────
    var kx = 0, ky = 0;
    if (keys['ArrowLeft']  || keys['KeyA']) kx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) kx += 1;
    if (keys['ArrowUp']    || keys['KeyW']) ky -= 1;
    if (keys['ArrowDown']  || keys['KeyS']) ky += 1;

    // ── Move direction from joystick (overrides keys if joystick used) ─
    if (joyActive) {
      kx = joyDX / JOY_RADIUS;
      ky = joyDY / JOY_RADIUS;
    }

    // Normalise diagonal movement so speed is consistent
    var len = Math.sqrt(kx * kx + ky * ky);
    if (len > 1) { kx /= len; ky /= len; }

    state.move.x = kx;
    state.move.y = ky;

    // ── Action (Space / J on keyboard, blessing button on touch) ──────
    var actionNow = !!(keys['Space'] || keys['KeyJ'] || blessingTouch);
    state.actionPressed = actionNow && !prevAction;
    state.actionHeld    = actionNow;
    prevAction = actionNow;

    // ── Swipe (one-frame pulses) ──────────────────────────────────────
    state.swipeLeft  = pendingSwipeLeft;
    state.swipeRight = pendingSwipeRight;
    pendingSwipeLeft  = false;
    pendingSwipeRight = false;
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    update: update,
    state:  state,    // scenes read G.input.state.move etc.
  };

})();
