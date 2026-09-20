// js/audio.js — Web Audio synthesised SFX + mute toggle
// All sounds are created with the Web Audio API — no audio files loaded.
// AudioContext is created (and resumed) on the first user gesture to
// satisfy browser autoplay policy.

'use strict';

G.audio = (function () {

  var ctx = null;      // AudioContext — created on first gesture
  var muted = false;

  // ── Unlock / lazy-init ────────────────────────────────────────────────
  function unlock() {
    if (ctx) {
      // Resume if suspended (mobile Chrome suspends after inactivity)
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // ── Helper: create a simple envelope gain node ────────────────────────
  function makeGain(volume, startTime, decayTime) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime);
    g.connect(ctx.destination);
    return g;
  }

  // ── Helper: play a sine/square oscillator ─────────────────────────────
  function playTone(freq, type, volume, duration) {
    if (muted || !ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = makeGain(volume, now, duration);
    osc.type = freq ? type : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // ── SFX ───────────────────────────────────────────────────────────────

  // Soft chime: played when collecting a petal or item
  function chime() {
    if (muted || !ctx) return;
    var now = ctx.currentTime;
    [880, 1100, 1320].forEach(function (f, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      g.gain.setValueAtTime(0.18, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.4);
    });
  }

  // Modak pop: higher-pitched bright pop on modak collect
  function modakPop() {
    if (muted || !ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Soft thud: played on hit / wobble / spotted
  function thud() {
    if (muted || !ctx) return;
    var now = ctx.currentTime;
    // White-noise burst through a low-pass filter
    var bufSize = ctx.sampleRate * 0.12;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(180, now);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.13);
  }

  // Blessing shimmer: ascending shimmer sweep
  function blessingShimmer() {
    if (muted || !ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Level-complete jingle: short ascending arpeggio
  function levelComplete() {
    if (muted || !ctx) return;
    var now = ctx.currentTime;
    var notes = [523, 659, 784, 1047];  // C5, E5, G5, C6
    notes.forEach(function (f, i) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.12);
      g.gain.setValueAtTime(0.2, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.35);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  }

  // ── Mute toggle ───────────────────────────────────────────────────────
  function toggleMute() {
    muted = !muted;
    document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
  }

  function isMuted() { return muted; }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    unlock:         unlock,
    chime:          chime,
    modakPop:       modakPop,
    thud:           thud,
    blessingShimmer:blessingShimmer,
    levelComplete:  levelComplete,
    toggleMute:     toggleMute,
    isMuted:        isMuted,
  };

})();
