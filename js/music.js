// js/music.js — Background music synthesiser
// All sound is generated with Web Audio API. No audio files.
// Depends on js/audio.js being loaded first (shares its AudioContext via G.audio.getCtx()).
//
// Public API:
//   Music.play(mood)   — cross-fades to a new mood over 2 s
//   Music.stop()       — fades out and stops all layers
//   Music.syncMute()   — call after mute toggle to apply master gain immediately
//
// Moods: 'title' | 'story' | 'level1' | 'level2' | 'level3' | 'recap' | 'end'

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Expose getCtx() on G.audio so music.js can share the same AudioContext.
// The patch is applied here (after audio.js has already run).
// ─────────────────────────────────────────────────────────────────────────────
(function patchAudioCtx() {
  var _ctxRef = null;
  var _origUnlock = G.audio.unlock;
  G.audio.unlock = function () {
    _origUnlock();                         // run original (creates ctx internally)
    // After unlock, mirror ctx via a one-shot getter
    if (!_ctxRef) {
      // audio.js keeps ctx as a private var; we re-create access via a test node
      try {
        var tmp = new (window.AudioContext || window.webkitAudioContext)();
        // We actually need the SAME context; create a second one and close it,
        // then expose our own ref. But we can't reach audio.js's private ctx.
        // SOLUTION: music.js creates its OWN AudioContext, started on first gesture.
        tmp.close();
      } catch (e) {}
    }
  };
})();

G.Music = (function () {

  // ── Private AudioContext (music.js owns one; SFX uses audio.js's ctx) ──────
  // Both run independently; browser allows multiple AudioContexts.
  var _ctx = null;

  // ── Master gain (music bus) — sits before destination ───────────────────
  var _masterGain = null;   // GainNode for entire music bus
  var MASTER_VOL  = 0.22;   // music sits quieter than SFX

  // ── Convolver reverb (built once, reused) ────────────────────────────────
  var _reverb = null;       // ConvolverNode
  var _reverbGain = null;   // wet mix

  // ── Look-ahead scheduler ─────────────────────────────────────────────────
  var _schedInterval = null;  // setInterval handle
  var LOOK_AHEAD  = 0.5;      // seconds to schedule ahead
  var SCHED_MS    = 100;      // scheduler interval

  // ── Current mood ─────────────────────────────────────────────────────────
  var _mood = null;

  // ── Layer gain nodes (one per layer, cross-faded on mood change) ─────────
  // Layer indices: 0=drone, 1=pad, 2=flute, 3=bell, 4=rhythm
  var _layerGains = [];     // GainNode[]
  var NUM_LAYERS  = 5;

  // ── Polyphony cap ─────────────────────────────────────────────────────────
  var _voiceCount = 0;
  var MAX_VOICES  = 8;

  // ── Pentatonic scale (C major): C D E G A ────────────────────────────────
  //    Hz values per octave; indices 0-4
  var PENTA = {
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880.00,
    C3: 130.81, G2: 98.00,  C2: 65.41,
    G3: 196.00, A3: 220.00, E3: 164.81,
  };

  // ── Scheduler state for each layer ───────────────────────────────────────
  var _droneNextTime  = 0;
  var _flutePhraseEnd = 0;   // when current flute phrase ends
  var _bellNextTime   = 0;
  var _rhythmNextTime = 0;
  var _padNextTime    = 0;
  var _padChord       = 0;   // 0=C, 1=Am, 2=Csus2

  // ── Mood target gains for each layer ─────────────────────────────────────
  // [drone, pad, flute, bell, rhythm]
  var MOOD_GAINS = {
    title:  [0.55, 0.45, 0.40, 0.35, 0.00],
    story:  [0.55, 0.50, 0.45, 0.40, 0.00],
    level1: [0.35, 0.25, 0.20, 0.20, 0.40],
    level2: [0.25, 0.20, 0.15, 0.15, 0.60],
    level3: [0.55, 0.35, 0.25, 0.45, 0.45],
    recap:  [0.45, 0.50, 0.40, 0.45, 0.00],
    end:    [0.40, 0.50, 0.40, 0.50, 0.00],
  };

  // ── Init AudioContext and all persistent nodes ────────────────────────────
  function _init() {
    if (_ctx) return;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }

    // Master compressor → destination
    var comp = _ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value       = 8;
    comp.ratio.value      = 4;
    comp.attack.value     = 0.003;
    comp.release.value    = 0.25;
    comp.connect(_ctx.destination);

    // Master gain (music bus)
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = G.audio.isMuted() ? 0 : MASTER_VOL;
    _masterGain.connect(comp);

    // Reverb (convolver + wet gain)
    _reverb     = _buildReverb(2.5);
    _reverbGain = _ctx.createGain();
    _reverbGain.gain.value = 0.28;
    _reverb.connect(_reverbGain);
    _reverbGain.connect(_masterGain);

    // Layer gain nodes — all initially silent, connected to masterGain
    _layerGains = [];
    for (var i = 0; i < NUM_LAYERS; i++) {
      var g = _ctx.createGain();
      g.gain.value = 0;
      g.connect(_masterGain);
      _layerGains.push(g);
    }

    // Seed scheduler times
    var now = _ctx.currentTime;
    _droneNextTime  = now + 0.1;
    _flutePhraseEnd = now;
    _bellNextTime   = now + 4;
    _rhythmNextTime = now + 0.1;
    _padNextTime    = now + 0.1;
  }

  // ── Build an IR reverb from decaying white noise ──────────────────────────
  function _buildReverb(durationSec) {
    var sr      = _ctx.sampleRate;
    var len     = Math.floor(sr * durationSec);
    var buf     = _ctx.createBuffer(2, len, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
    }
    var conv = _ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  // ── Voice helper: schedule oscillator, auto-disconnects on stop ──────────
  function _voice(freq, type, startT, dur, peakGain, target, vibrato) {
    if (!_ctx || _voiceCount >= MAX_VOICES) return;
    _voiceCount++;
    var osc  = _ctx.createOscillator();
    var env  = _ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startT);

    // Optional vibrato (for flute)
    if (vibrato) {
      var lfo = _ctx.createOscillator();
      var lfoGain = _ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 5.5;
      lfoGain.gain.value  = freq * 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startT);
      lfo.stop(startT + dur + 0.05);
    }

    // Envelope: attack + decay
    var atk = Math.min(0.05, dur * 0.15);
    env.gain.setValueAtTime(0.0001, startT);
    env.gain.linearRampToValueAtTime(peakGain, startT + atk);
    env.gain.setTargetAtTime(0.0001, startT + dur * 0.6, dur * 0.18);

    osc.connect(env);
    env.connect(target);
    osc.start(startT);
    osc.stop(startT + dur + 0.1);
    osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
  }

  // ── Noise burst (tabla / dhol rhythm) ────────────────────────────────────
  function _noiseBurst(startT, dur, freq, noiseGain, toneGain, target) {
    if (!_ctx || _voiceCount >= MAX_VOICES) return;
    _voiceCount++;
    // White noise through lowpass
    var bufSize = Math.ceil(_ctx.sampleRate * dur);
    var buf  = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    var src  = _ctx.createBufferSource();
    src.buffer = buf;
    var filt = _ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq;
    filt.Q.value = 2.5;
    var env = _ctx.createGain();
    env.gain.setValueAtTime(noiseGain, startT);
    env.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
    src.connect(filt); filt.connect(env); env.connect(target);
    src.start(startT); src.stop(startT + dur + 0.02);
    // Sine thump underneath
    _voice(freq * 0.5, 'sine', startT, dur * 0.8, toneGain, target, false);
    src.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
  }

  // ── Drone layer: tanpura pluck G2 C3 C3 C2 at ~1.3 s per pluck ──────────
  var _DRONE_SEQ  = [PENTA.G2, PENTA.C3, PENTA.C3, PENTA.C2];
  var _droneIdx   = 0;
  var DRONE_STEP  = 1.32;  // seconds per pluck

  function _scheduleDrone(until) {
    while (_droneNextTime < until) {
      var f   = _DRONE_SEQ[_droneIdx % _DRONE_SEQ.length];
      _droneIdx++;
      // Triangle through lowpass (tanpura flavour)
      var osc  = _ctx.createOscillator();
      var lp   = _ctx.createBiquadFilter();
      var env  = _ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      lp.type  = 'lowpass';
      lp.frequency.value = 800;
      lp.Q.value = 0.8;
      var t = _droneNextTime;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.45, t + 0.04);
      env.gain.setTargetAtTime(0.0001, t + 0.15, 0.55);
      osc.connect(lp); lp.connect(env); env.connect(_layerGains[0]);
      osc.start(t); osc.stop(t + 2.0);
      _droneNextTime += DRONE_STEP;
    }
  }

  // ── Pad layer: 2 detuned sines cycling C, Am, Csus2 every 8 s ───────────
  //  Chord sets [root, fifth / third / second]:
  var _PAD_CHORDS = [
    [PENTA.C4, PENTA.G4],                    // C5
    [PENTA.A3, PENTA.C4, PENTA.E4],          // Am
    [PENTA.C4, PENTA.D4, PENTA.G4],          // Csus2
  ];
  var PAD_HOLD = 8.0;   // seconds per chord
  var PAD_ATK  = 2.0;
  var PAD_REL  = 3.0;

  function _schedulePad(until) {
    while (_padNextTime < until) {
      var chord = _PAD_CHORDS[_padChord % _PAD_CHORDS.length];
      _padChord++;
      var t = _padNextTime;
      chord.forEach(function (freq, idx) {
        // Two slightly detuned oscillators per note
        [0, +3, -3].forEach(function (detune) {
          if (_voiceCount >= MAX_VOICES) return;
          _voiceCount++;
          var osc = _ctx.createOscillator();
          var env = _ctx.createGain();
          osc.type = (idx === 0) ? 'triangle' : 'sine';
          osc.frequency.value = freq;
          osc.detune.value    = detune;
          env.gain.setValueAtTime(0.0001, t);
          env.gain.linearRampToValueAtTime(0.12, t + PAD_ATK);
          env.gain.setTargetAtTime(0.0001, t + PAD_HOLD - PAD_REL, PAD_REL * 0.5);
          osc.connect(env); env.connect(_layerGains[1]);
          osc.start(t); osc.stop(t + PAD_HOLD + 0.5);
          osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
        });
      });
      _padNextTime += PAD_HOLD;
    }
  }

  // ── Flute layer: sparse bansuri-like phrases ──────────────────────────────
  //  Phrase = 3-6 notes, each 0.3-1.2 s, gaps between notes 0.1-0.4 s.
  //  After phrase: rest 2-5 s.
  var _FLUTE_SCALE = [
    PENTA.G3, PENTA.A3, PENTA.C4, PENTA.D4, PENTA.E4,
    PENTA.G4, PENTA.A4, PENTA.C5, PENTA.D5,
  ];
  var _flutePrev = 4;   // index into _FLUTE_SCALE — start mid

  function _scheduleFlute(until) {
    if (_flutePhraseEnd > until) return;  // phrase already scheduled ahead

    var t = _flutePhraseEnd;
    if (t < _ctx.currentTime) t = _ctx.currentTime + 0.05;

    // Pick a phrase length 3-6 notes
    var phraseLen = 3 + Math.floor(Math.random() * 4);
    for (var n = 0; n < phraseLen; n++) {
      // Move by step ±1 or ±2, occasionally a small leap ±3
      var step = (Math.random() < 0.7)
        ? (Math.random() < 0.5 ? 1 : -1)
        : (Math.random() < 0.5 ? 2 : -2);
      _flutePrev = Math.max(0, Math.min(_FLUTE_SCALE.length - 1, _flutePrev + step));
      var freq = _FLUTE_SCALE[_flutePrev];
      var dur  = 0.3 + Math.random() * 0.9;   // 0.3-1.2 s
      var gap  = 0.08 + Math.random() * 0.32; // 0.08-0.40 s gap after note

      _voice(freq, 'sine', t, dur, 0.30, _layerGains[2], true);

      // Tiny breath-noise burst on note start
      if (_ctx && _voiceCount < MAX_VOICES) {
        var nbuf = _ctx.createBuffer(1, Math.ceil(_ctx.sampleRate * 0.06), _ctx.sampleRate);
        var nd   = nbuf.getChannelData(0);
        for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        var nsrc = _ctx.createBufferSource();
        nsrc.buffer = nbuf;
        var nhp  = _ctx.createBiquadFilter();
        nhp.type = 'highpass'; nhp.frequency.value = 2000;
        var nenv = _ctx.createGain();
        nenv.gain.setValueAtTime(0.04, t);
        nenv.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        nsrc.connect(nhp); nhp.connect(nenv); nenv.connect(_layerGains[2]);
        nsrc.start(t); nsrc.stop(t + 0.07);
      }

      t += dur + gap;
    }
    // Rest after phrase: 2-5 s
    _flutePhraseEnd = t + 2.0 + Math.random() * 3.0;
  }

  // ── Bell/chime layer: inharmonic sine partials every 10-16 s ─────────────
  var _BELL_INTERVALS = [10, 12, 14, 16];   // seconds between strikes

  function _scheduleBell(until) {
    while (_bellNextTime < until) {
      var t = _bellNextTime;
      // 4 partials: fundamental + slight inharmonic overtones
      var fund = PENTA.G4;
      [[1.00, 0.25], [2.03, 0.12], [3.11, 0.07], [4.25, 0.04]].forEach(function (p) {
        if (_voiceCount >= MAX_VOICES) return;
        _voiceCount++;
        var osc = _ctx.createOscillator();
        var env = _ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = fund * p[0];
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(p[1], t + 0.004);
        env.gain.setTargetAtTime(0.0001, t + 0.05, 1.2);
        osc.connect(env); env.connect(_layerGains[3]);
        // Also feed reverb
        env.connect(_reverb);
        osc.start(t); osc.stop(t + 4.0);
        osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
      });
      _bellNextTime += _BELL_INTERVALS[Math.floor(Math.random() * _BELL_INTERVALS.length)];
    }
  }

  // ── Rhythm layer: mood-dependent pattern ─────────────────────────────────
  var _rhythmPattern = null;   // null = off, set per mood
  var RHYTHM_BPM     = 90;
  var BEAT           = 60 / RHYTHM_BPM;  // seconds per beat

  // Patterns: array of [beatOffset, freq, noiseGain, toneGain, dur]
  // level1: light pizzicato marimba-like pluck, 4-beat bar
  var _PAT_L1 = [
    [0,    PENTA.C4, 0.00, 0.22, 0.09],   // beat 1 — root pluck
    [0.5,  PENTA.G4, 0.00, 0.14, 0.07],   // offbeat
    [1.0,  PENTA.E4, 0.00, 0.18, 0.09],   // beat 2
    [1.5,  PENTA.C4, 0.00, 0.10, 0.06],
    [2.0,  PENTA.G4, 0.00, 0.20, 0.09],
    [2.5,  PENTA.E4, 0.00, 0.13, 0.07],
    [3.0,  PENTA.A3, 0.00, 0.16, 0.09],
    [3.5,  PENTA.G4, 0.00, 0.10, 0.06],
  ];
  // level2: tabla-like
  var _PAT_L2 = [
    [0,    200, 0.30, 0.18, 0.10],   // bass
    [0.5,  600, 0.20, 0.10, 0.06],   // tap
    [1.0,  200, 0.28, 0.16, 0.10],
    [1.25, 600, 0.14, 0.08, 0.05],
    [1.5,  600, 0.18, 0.09, 0.06],
    [2.0,  200, 0.26, 0.15, 0.10],
    [2.5,  600, 0.16, 0.08, 0.06],
    [3.0,  200, 0.24, 0.14, 0.10],
    [3.5,  600, 0.20, 0.10, 0.06],
  ];
  // level3: dhol-like pulse (builds slowly — gain already handled by layer gain)
  var _PAT_L3 = [
    [0,    80,  0.40, 0.28, 0.14],
    [0.67, 80,  0.24, 0.18, 0.10],
    [1.33, 80,  0.30, 0.22, 0.12],
    [2.0,  80,  0.38, 0.26, 0.14],
    [2.67, 80,  0.22, 0.16, 0.10],
    [3.33, 80,  0.28, 0.20, 0.12],
  ];

  var BAR_BEATS = 4;
  var _rhythmBarStart = 0;  // absolute time when this bar started

  function _scheduleRhythm(until) {
    if (!_rhythmPattern) return;
    var barLen = BAR_BEATS * BEAT;
    while (_rhythmNextTime < until) {
      var barT = _rhythmNextTime;
      _rhythmPattern.forEach(function (hit) {
        var t   = barT + hit[0] * BEAT;
        var freq = hit[1];
        var ng   = hit[2];
        var tg   = hit[3];
        var dur  = hit[4];
        if (_voiceCount >= MAX_VOICES) return;
        if (ng > 0) {
          // tabla / dhol noise burst
          _noiseBurst(t, dur, freq, ng, tg, _layerGains[4]);
        } else {
          // marimba-like pluck: triangle, short decay
          _voicePluck(freq, t, dur * 3, tg);
        }
      });
      _rhythmNextTime += barLen;
    }
  }

  // Marimba/pizzicato pluck: triangle + fast exponential decay
  function _voicePluck(freq, startT, dur, peakGain) {
    if (!_ctx || _voiceCount >= MAX_VOICES) return;
    _voiceCount++;
    var osc = _ctx.createOscillator();
    var env = _ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(peakGain, startT);
    env.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
    osc.connect(env); env.connect(_layerGains[4]);
    osc.start(startT); osc.stop(startT + dur + 0.05);
    osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
  }

  // ── Apply target gains for a given mood (cross-fade over 2 s) ────────────
  function _applyMoodGains(mood, crossFadeSec) {
    var targets = MOOD_GAINS[mood] || MOOD_GAINS['title'];
    var now     = _ctx.currentTime;
    for (var i = 0; i < NUM_LAYERS; i++) {
      _layerGains[i].gain.setTargetAtTime(
        targets[i], now, crossFadeSec / 3  // setTargetAtTime τ = duration/3
      );
    }
  }

  // ── Set rhythm pattern for mood ───────────────────────────────────────────
  function _setRhythmPattern(mood) {
    if      (mood === 'level1')                          { _rhythmPattern = _PAT_L1; }
    else if (mood === 'level2')                          { _rhythmPattern = _PAT_L2; }
    else if (mood === 'level3')                          { _rhythmPattern = _PAT_L3; }
    else                                                 { _rhythmPattern = null; }
    _rhythmNextTime = _ctx ? _ctx.currentTime + 0.05 : 0;
  }

  // ── Main scheduler tick ───────────────────────────────────────────────────
  function _tick() {
    if (!_ctx || _ctx.state !== 'running') return;
    if (G.audio.isMuted()) return;
    var until = _ctx.currentTime + LOOK_AHEAD;
    _scheduleDrone(until);
    _schedulePad(until);
    _scheduleFlute(until);
    _scheduleBell(until);
    _scheduleRhythm(until);
  }

  // ── Tab visibility: pause/resume ─────────────────────────────────────────
  document.addEventListener('visibilitychange', function () {
    if (!_ctx) return;
    if (document.hidden) {
      // Fade out quickly
      if (_masterGain) _masterGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.3);
      _ctx.suspend();
    } else {
      _ctx.resume().then(function () {
        if (_masterGain && !G.audio.isMuted()) {
          _masterGain.gain.setTargetAtTime(MASTER_VOL, _ctx.currentTime, 0.5);
        }
      });
    }
  });

  // ── Public API ────────────────────────────────────────────────────────────

  function play(mood) {
    // Init context on first call (must be inside a gesture by this point)
    if (!_ctx) _init();
    if (!_ctx) return;   // AudioContext failed (e.g. old browser)
    if (_ctx.state === 'suspended') _ctx.resume();

    // Same mood re-entered — no restart
    if (_mood === mood) return;
    _mood = mood;

    // Update rhythm pattern
    _setRhythmPattern(mood);

    // Cross-fade layer gains
    _applyMoodGains(mood, 2.0);

    // Sync mute
    syncMute();

    // Start scheduler if not already running
    if (!_schedInterval) {
      _schedInterval = setInterval(_tick, SCHED_MS);
      _tick();  // immediate first tick
    }
  }

  function stop() {
    if (!_ctx) return;
    _mood = null;
    _rhythmPattern = null;
    // Fade out master gain
    _masterGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.6);
    // Stop scheduler after fade
    if (_schedInterval) {
      clearInterval(_schedInterval);
      _schedInterval = null;
    }
  }

  function syncMute() {
    if (!_masterGain || !_ctx) return;
    var target = G.audio.isMuted() ? 0 : MASTER_VOL;
    _masterGain.gain.setTargetAtTime(target, _ctx.currentTime, 0.05);
  }

  // ── Story slide 3 blessing swell ─────────────────────────────────────────
  // Called from story.js when slide 3 blessing glow appears.
  function storyBlessSwell() {
    if (!_ctx || G.audio.isMuted()) return;
    if (_ctx.state === 'suspended') _ctx.resume();
    var now = _ctx.currentTime;
    // Rising 5-note chime arpeggio: C D E G A
    var arpNotes = [PENTA.C5, PENTA.D5, PENTA.E5, PENTA.G5, PENTA.A5];
    arpNotes.forEach(function (freq, i) {
      var t = now + i * 0.18;
      // Bright sine bell
      if (_voiceCount < MAX_VOICES) {
        _voiceCount++;
        var osc = _ctx.createOscillator();
        var env = _ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.22, t + 0.01);
        env.gain.setTargetAtTime(0.0001, t + 0.04, 0.35);
        osc.connect(env); env.connect(_masterGain);
        env.connect(_reverb);
        osc.start(t); osc.stop(t + 1.5);
        osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
      }
    });
    // Pad swell: boost pad gain for 3 s then return
    if (_layerGains[1]) {
      _layerGains[1].gain.setTargetAtTime(0.80, now, 0.3);
      _layerGains[1].gain.setTargetAtTime(
        (MOOD_GAINS[_mood] || MOOD_GAINS['story'])[1], now + 2.5, 0.8
      );
    }
  }

  // ── collectPop(n): pentatonic modak collect sound ─────────────────────────
  // n = 1-5; pitch climbs C5 D5 E5 G5 A5
  function collectPop(n) {
    if (!_ctx || G.audio.isMuted()) return;
    if (_ctx.state === 'suspended') _ctx.resume();
    var baseFreqs = [PENTA.C5, PENTA.D5, PENTA.E5, PENTA.G5, PENTA.A5];
    var rootFreq  = baseFreqs[Math.min(Math.max((n - 1), 0), 4)];
    var now       = _ctx.currentTime;

    // 1. Bubbly pop: sine sweep 500→900 Hz over 90 ms
    if (_voiceCount < MAX_VOICES) {
      _voiceCount++;
      var popOsc = _ctx.createOscillator();
      var popEnv = _ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(500, now);
      popOsc.frequency.exponentialRampToValueAtTime(900, now + 0.09);
      popEnv.gain.setValueAtTime(0.20, now);
      popEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      popOsc.connect(popEnv); popEnv.connect(_ctx.destination);
      popOsc.start(now); popOsc.stop(now + 0.12);
      popOsc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
    }

    // Tiny high click
    if (_voiceCount < MAX_VOICES) {
      _voiceCount++;
      var ckOsc = _ctx.createOscillator();
      var ckEnv = _ctx.createGain();
      ckOsc.type = 'square';
      ckOsc.frequency.value = 4000;
      ckEnv.gain.setValueAtTime(0.06, now);
      ckEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      ckOsc.connect(ckEnv); ckEnv.connect(_ctx.destination);
      ckOsc.start(now); ckOsc.stop(now + 0.015);
      ckOsc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
    }

    // 2. Sparkle chime 30 ms later: two notes rootFreq + fifth
    var sparkT = now + 0.03;
    [rootFreq, rootFreq * 1.5].forEach(function (freq, idx) {
      if (_voiceCount >= MAX_VOICES) return;
      _voiceCount++;
      var t   = sparkT + idx * 0.06;
      var osc = _ctx.createOscillator();
      var env = _ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.18, t + 0.008);
      env.gain.setTargetAtTime(0.0001, t + 0.02, 0.10);
      osc.connect(env); env.connect(_ctx.destination);
      osc.start(t); osc.stop(t + 0.35);
      osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
    });
  }

  // ── Gentle "spotted" descending chime (warm, 2 notes, never scary) ────────
  function spottedChime() {
    if (!_ctx || G.audio.isMuted()) return;
    if (_ctx.state === 'suspended') _ctx.resume();
    var now = _ctx.currentTime;
    [PENTA.E5, PENTA.C5].forEach(function (freq, i) {
      if (_voiceCount >= MAX_VOICES) return;
      _voiceCount++;
      var t   = now + i * 0.18;
      var osc = _ctx.createOscillator();
      var env = _ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.16, t + 0.01);
      env.gain.setTargetAtTime(0.0001, t + 0.05, 0.30);
      osc.connect(env); env.connect(_ctx.destination);
      if (_reverb) env.connect(_reverb);
      osc.start(t); osc.stop(t + 1.2);
      osc.onended = function () { _voiceCount = Math.max(0, _voiceCount - 1); };
    });
  }

  return {
    play:            play,
    stop:            stop,
    syncMute:        syncMute,
    storyBlessSwell: storyBlessSwell,
    collectPop:      collectPop,
    spottedChime:    spottedChime,
  };

})();
