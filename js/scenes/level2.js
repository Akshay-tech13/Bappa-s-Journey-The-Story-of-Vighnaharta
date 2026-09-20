// js/scenes/level2.js — Level 2: "The Race"
// Fake-3D 3-lane runner. Ganesha rides Mushak vs Kartikeya on his peacock.
// ~60 s run → finish text → ~10 s parents-circle finale → results.
// Ganesha can NEVER beat Kartikeya; stars are by modaks + obstacles only.

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
//  PERSPECTIVE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
var L2_HORIZON_Y = 180;        // Y of the vanishing point
var L2_GROUND_Y  = G.H - 60;  // Y of the camera ground line
var L2_LANE_SEP  = 340;        // lane separation at ground level (px)
var L2_LANE_CX   = G.W / 2;   // road centre X

// Convert Z (0=horizon, 1=player) + laneOffset to screen coords
function _l2project(z, laneIdx) {
  // z is 0..1 normalised depth. Screen Y interpolates from horizon to ground.
  var sy = L2_HORIZON_Y + (L2_GROUND_Y - L2_HORIZON_Y) * z;
  // Scale increases linearly with z
  var scale = 0.18 + z * 0.82;
  // Lane offset in screen space
  var lanes = [-1, 0, 1];
  var sx = L2_LANE_CX + lanes[laneIdx] * L2_LANE_SEP * 0.5 * z;
  return { x: sx, y: sy, scale: scale };
}

// ═══════════════════════════════════════════════════════════════════════════
//  OBSTACLE / MODAK WAVE PATTERNS
//  Each wave: array of { lane:0|1|2, type:'rock'|'log'|'bush'|'modak' }
//  Rule: every wave has at least one empty lane (player can always pass).
//  Modaks appear in the open lane so reward = taking the safe path.
// ═══════════════════════════════════════════════════════════════════════════
var L2_WAVES = [
  // ─ wave 0 ─ rocks in left + right, modak in centre
  [{ lane:0,type:'rock'},{lane:2,type:'rock'},{lane:1,type:'modak'}],
  // ─ wave 1 ─ log centre, modak left
  [{ lane:1,type:'log' },{lane:0,type:'modak'}],
  // ─ wave 2 ─ bush left + centre, modak right
  [{ lane:0,type:'bush'},{lane:1,type:'bush'},{lane:2,type:'modak'}],
  // ─ wave 3 ─ rock right, modak left
  [{ lane:2,type:'rock'},{lane:0,type:'modak'}],
  // ─ wave 4 ─ log left + bush right, modak centre
  [{ lane:0,type:'log' },{lane:2,type:'bush'},{lane:1,type:'modak'}],
  // ─ wave 5 ─ rock centre, modak right
  [{ lane:1,type:'rock'},{lane:2,type:'modak'}],
  // ─ wave 6 ─ bush left, log centre, modak right (blessing needed or dodge)
  [{ lane:0,type:'bush'},{lane:1,type:'log' },{lane:2,type:'modak'}],
  // ─ wave 7 ─ rock left, modak centre
  [{ lane:0,type:'rock'},{lane:1,type:'modak'}],
  // ─ wave 8 ─ log right + bush centre, modak left
  [{ lane:2,type:'log' },{lane:1,type:'bush'},{lane:0,type:'modak'}],
  // ─ wave 9 ─ all three blocked, blessing needed (modak on open side if blessed)
  [{ lane:0,type:'rock'},{lane:1,type:'bush'},{lane:2,type:'rock'}],
  // ─ wave 10 ─ light wave, modak left + right
  [{ lane:0,type:'modak'},{lane:2,type:'modak'}],
  // ─ wave 11 ─ log left + rock right, modak centre
  [{ lane:0,type:'log' },{lane:2,type:'rock'},{lane:1,type:'modak'}],
];

// ═══════════════════════════════════════════════════════════════════════════
//  SCENE STATE
// ═══════════════════════════════════════════════════════════════════════════
var _l2phase      = 'run';  // 'run' | 'finish' | 'finale' | 'complete'
var _l2phaseT     = 0;
var _l2t          = 0;      // total elapsed time

// Runner state
var _l2lane       = 1;      // player's current lane (0=L 1=C 2=R)
var _l2targetLane = 1;      // lane being moved toward
var _l2laneAnim   = 0;      // 0..1 lane switch animation progress
var _l2speed      = 1.0;    // current scroll speed multiplier
var _l2wobble     = 0;      // wobble timer (counts down)
var _l2hitCount   = 0;      // obstacle hits this run
var _l2modakCount = 0;      // modaks collected this run
var _l2progress   = 0;      // 0..1 race progress (player)
var _l2kartProg   = 0;      // 0..1 Kartikeya scripted progress
var _l2blessCool  = 0;      // blessing cooldown

// Active objects on the road (each: {lane, type, z, id, cleared})
var _l2objects    = [];
var _l2nextWave   = 0;      // wave index
var _l2waveDist   = 0;      // distance counter for spawning

// Finale state
var _l2orbitAngle = 0;      // Ganesha orbit angle around parents
var _l2laps       = 0;      // completed laps
var _l2lastLap    = -1;     // last recorded full lap

// Lane switch buttons (screen-space rects, set each frame)
var _l2btnLeft    = null;
var _l2btnRight   = null;

// Result
var _l2stars      = 0;
var _l2points     = 0;
var _l2nextRect   = null;
var _l2clickH     = null;

// Road scroll offset (for road stripe animation)
var _l2scrollOff  = 0;

// RUN duration
var L2_RUN_SECS = 60;
var L2_BLESS_CD  = 1.5;

// ── Roadside scenery: pre-seeded scrolling objects ────────────────────────
// Each entry: { type, lane(-2|-1|1|2=outer sides), z, phase }
// type: 'tree'|'bush'|'diya'|'flag'
var _l2roadside = (function () {
  var items = [];
  var seed  = 42;
  function rng() { seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF; return (seed >>> 0) / 0xFFFFFFFF; }
  var types = ['tree','bush','diya','flag','tree','bush'];
  for (var i = 0; i < 28; i++) {
    items.push({
      type:  types[Math.floor(rng() * types.length)],
      side:  rng() > 0.5 ? 1 : -1,  // left or right of road
      z:     rng(),                  // 0..1 initial depth
      phase: rng() * Math.PI * 2,    // animation phase offset
    });
  }
  return items;
}());

// Dust puff particles (behind Mushak)
var _l2dustPuffs = [];
// Blessing streak particles
var _l2blessStreaks = [];
var _l2blessFired   = false; // tracks when to spawn streaks

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function _l2calcResults() {
  // Stars: by modaks collected and obstacles hit
  // ★★★ ≤1 hit, ★★ 2-4, ★ 5+  (from PLAN.md scoring)
  var stars;
  if (_l2hitCount <= 1)      stars = 3;
  else if (_l2hitCount <= 4) stars = 2;
  else                       stars = 1;
  _l2stars  = stars;
  _l2points = _l2modakCount * G.SCORE.modakPts + stars * G.SCORE.starPts;
  G.run.levelScores['level2'] = _l2points;
  G.run.levelStars['level2']  = stars;
}

function _l2attachClick() {
  _l2clickH = function (e) {
    var p = G.ui.toLogical(e);
    // Lane buttons (run phase)
    if (_l2phase === 'run') {
      if (_l2btnLeft  && G.ui.isButtonHit(p.x, p.y, _l2btnLeft))  { _l2switchLane(-1); return; }
      if (_l2btnRight && G.ui.isButtonHit(p.x, p.y, _l2btnRight)) { _l2switchLane( 1); return; }
    }
    // Next button (complete screen)
    if (_l2phase === 'complete' && _l2nextRect && G.ui.isButtonHit(p.x, p.y, _l2nextRect)) {
      var _l2ret = G.run.returnTo;
      if (_l2ret) { G.run.returnTo = null; G.sceneManager.goto(_l2ret); return; }
      var idx  = G.LEVEL_ORDER.indexOf('level2');
      var next = G.LEVEL_ORDER[idx + 1];
      G.sceneManager.goto(next || 'recap');
    }
  };
  G.canvas.addEventListener('click',      _l2clickH);
  G.canvas.addEventListener('touchstart', _l2clickH, { passive: false });
}

function _l2detachClick() {
  if (_l2clickH) {
    G.canvas.removeEventListener('click',      _l2clickH);
    G.canvas.removeEventListener('touchstart', _l2clickH);
    _l2clickH = null;
  }
}

function _l2switchLane(dir) {
  // dir: -1 = left, +1 = right
  var newLane = Math.max(0, Math.min(2, _l2lane + dir));
  if (newLane === _l2targetLane) return;
  _l2targetLane = newLane;
  _l2laneAnim   = 0;
}

// Spawn a wave of objects at z=0 (far end)
function _l2spawnWave() {
  var wave = L2_WAVES[_l2nextWave % L2_WAVES.length];
  _l2nextWave++;
  for (var i = 0; i < wave.length; i++) {
    _l2objects.push({
      lane:    wave[i].lane,
      type:    wave[i].type,
      z:       0.0,    // starts at horizon
      cleared: false,  // Blessing can clear obstacle types
      id:      _l2nextWave * 10 + i,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCENE
// ═══════════════════════════════════════════════════════════════════════════
G.scenes['level2'] = {

  init: function () {
    _l2phase = 'run';  _l2phaseT = 0;  _l2t = 0;
    _l2lane = 1;  _l2targetLane = 1;  _l2laneAnim = 1;
    _l2speed = 1.0;  _l2wobble = 0;
    _l2hitCount = 0;  _l2modakCount = 0;
    _l2progress = 0;  _l2kartProg = 0;
    _l2blessCool = 0;
    _l2objects = [];
    _l2nextWave = 0;  _l2waveDist = 0;
    _l2scrollOff = 0;
    _l2orbitAngle = 0;  _l2laps = 0;  _l2lastLap = -1;
    _l2nextRect = null;
    _l2dustPuffs = [];
    _l2blessStreaks = [];
    _l2blessFired = false;
    // Reset roadside z positions for a fresh start
    for (var ri = 0; ri < _l2roadside.length; ri++) {
      _l2roadside[ri].z = (ri / _l2roadside.length);
    }
    _l2attachClick();
    if (G.audio.startDhol) G.audio.startDhol();
    // Spawn first wave immediately
    _l2spawnWave();
  },

  update: function (dt) {
    _l2t += dt;
    _l2blessCool = Math.max(0, _l2blessCool - dt);

    // ── PHASE: run ───────────────────────────────────────────────────────
    if (_l2phase === 'run') {
      _l2phaseT += dt;

      // Wobble / speed penalty
      if (_l2wobble > 0) {
        _l2wobble -= dt;
        _l2speed = 0.45;
      } else {
        _l2speed = 1.0;
      }

      // Race progress (player)
      _l2progress += (_l2speed * dt) / L2_RUN_SECS;
      // Kartikeya: scripted to end up ~8% ahead of player, rubber-banded
      var kartTarget = Math.min(1.0, _l2progress + 0.08 + _l2phaseT * 0.001);
      _l2kartProg += (kartTarget - _l2kartProg) * Math.min(1, 2 * dt);
      _l2kartProg = Math.min(1.0, _l2kartProg);

      // Lane switch input
      var inp = G.input.state;
      if (inp.swipeLeft  || inp.move.x < -0.5) _l2switchLane(-1);
      if (inp.swipeRight || inp.move.x >  0.5) _l2switchLane( 1);

      // Lane animation (lerp, snappy)
      if (_l2laneAnim < 1) {
        _l2laneAnim = Math.min(1, _l2laneAnim + dt * 7);
        if (_l2laneAnim >= 1) _l2lane = _l2targetLane;
      }

      // Blessing
      if (inp.actionPressed && _l2blessCool <= 0) {
        _l2blessCool = L2_BLESS_CD;
        G.audio.blessingShimmer();
        // Clear the closest obstacle in player's current lane
        var best = -1, bestZ = 0;
        for (var i = 0; i < _l2objects.length; i++) {
          var o = _l2objects[i];
          if (o.type === 'modak' || o.cleared) continue;
          if (o.lane !== _l2lane && o.lane !== _l2targetLane) continue;
          if (o.z > bestZ) { bestZ = o.z; best = i; }
        }
        if (best >= 0) _l2objects[best].cleared = true;
      }

      // ── Dust puffs behind Mushak ──────────────────────────────────────
      if (Math.random() < dt * 12) {
        _l2dustPuffs.push({
          x: G.W / 2 + ([-L2_LANE_SEP * 0.5, 0, L2_LANE_SEP * 0.5][_l2lane]),
          y: L2_GROUND_Y + 10,
          vx: (Math.random() - 0.5) * 30,
          vy: -40 - Math.random() * 20,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          r: 6 + Math.random() * 6,
        });
      }
      // Update dust puffs
      for (var dp = _l2dustPuffs.length - 1; dp >= 0; dp--) {
        var puff = _l2dustPuffs[dp];
        puff.life -= dt;
        puff.x   += puff.vx * dt;
        puff.y   += puff.vy * dt;
        puff.vy  += 15 * dt;  // gentle gravity
        if (puff.life <= 0) _l2dustPuffs.splice(dp, 1);
      }

      // ── Blessing streaks ───────────────────────────────────────────────
      var wasJustFired = (inp.actionPressed && _l2blessCool === L2_BLESS_CD);
      if (wasJustFired && !_l2blessFired) {
        _l2blessFired = true;
        for (var bsi = 0; bsi < 12; bsi++) {
          var ang = (bsi / 12) * Math.PI * 2;
          _l2blessStreaks.push({
            x: G.W / 2, y: L2_GROUND_Y - 60,
            vx: Math.cos(ang) * (60 + Math.random() * 60),
            vy: Math.sin(ang) * (40 + Math.random() * 40) - 20,
            life: 0.4 + Math.random() * 0.2,
          });
        }
      }
      if (!inp.actionPressed) _l2blessFired = false;

      for (var bsi2 = _l2blessStreaks.length - 1; bsi2 >= 0; bsi2--) {
        var st = _l2blessStreaks[bsi2];
        st.life -= dt;
        st.x    += st.vx * dt;
        st.y    += st.vy * dt;
        if (st.life <= 0) _l2blessStreaks.splice(bsi2, 1);
      }

      // ── Scroll roadside scenery ────────────────────────────────────────
      var roadsideSpeed = _l2speed * 0.55 * dt;
      for (var rs = 0; rs < _l2roadside.length; rs++) {
        _l2roadside[rs].z += roadsideSpeed;
        if (_l2roadside[rs].z > 1.1) _l2roadside[rs].z -= 1.1;
      }

      // Scroll objects forward
      var scrollSpeed = _l2speed * 0.55 * dt;
      _l2scrollOff += scrollSpeed * 80;

      for (var j = _l2objects.length - 1; j >= 0; j--) {
        var obj = _l2objects[j];
        obj.z += scrollSpeed;
        if (obj.z > 1.05) {
          _l2objects.splice(j, 1);
          continue;
        }
        // Hit check: only when object is in the player zone (z > 0.85)
        // Use current lane (lerped) for smoother detection
        var effLane = _l2laneAnim >= 1 ? _l2lane : _l2targetLane;
        if (!obj.cleared && obj.z > 0.85 && obj.lane === effLane) {
          if (obj.type === 'modak') {
            _l2modakCount++;
            _l2objects.splice(j, 1);
            G.audio.modakPop();
          } else {
            // Hit obstacle
            if (_l2wobble <= 0) {
              _l2hitCount++;
              _l2wobble = 1.0;
              G.audio.thud();
            }
            _l2objects.splice(j, 1);
          }
        }
      }

      // Spawn new wave
      _l2waveDist += scrollSpeed;
      if (_l2waveDist > 0.55) {
        _l2waveDist = 0;
        _l2spawnWave();
      }

      // Transition to finish when progress >= 1 or time >= L2_RUN_SECS
      if (_l2progress >= 1.0 || _l2phaseT >= L2_RUN_SECS) {
        _l2phase  = 'finish';
        _l2phaseT = 0;
        _l2objects = [];
        G.audio.levelComplete();
      }

    // ── PHASE: finish ────────────────────────────────────────────────────
    } else if (_l2phase === 'finish') {
      _l2phaseT += dt;
      // After showing the finish text for 3.5 s, go to finale
      if (_l2phaseT > 3.5) {
        _l2phase  = 'finale';
        _l2phaseT = 0;
        _l2orbitAngle = Math.PI;   // start directly behind parents
        _l2laps = 0;  _l2lastLap = -1;
      }

    // ── PHASE: finale ────────────────────────────────────────────────────
    } else if (_l2phase === 'finale') {
      _l2phaseT += dt;
      var inp2 = G.input.state;
      // Hold action to orbit
      if (inp2.actionHeld) {
        _l2orbitAngle += dt * 1.8; // radians per second
        // Count laps (each full 2π = 1 lap)
        var lapNow = Math.floor(_l2orbitAngle / (Math.PI * 2));
        if (lapNow > _l2lastLap && lapNow <= 3) {
          _l2lastLap = lapNow;
          _l2laps    = lapNow;
          G.audio.chime();
        }
      }
      // Complete after 3 laps + a short hold
      if (_l2laps >= 3 && _l2phaseT > 1) {
        _l2calcResults();
        _l2phase  = 'complete';
        _l2phaseT = 0;
      }
    }
    // 'complete' phase — no update needed, waiting for button click
  },

  draw: function (ctx) {
    if (_l2phase === 'run') {
      _l2drawRun(ctx);
    } else if (_l2phase === 'finish') {
      _l2drawFinish(ctx);
    } else if (_l2phase === 'finale') {
      _l2drawFinale(ctx);
    } else if (_l2phase === 'complete') {
      _l2drawComplete(ctx);
    }
  },

  destroy: function () {
    _l2detachClick();
    if (G.audio.stopDhol) G.audio.stopDhol();
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW: RUNNER
// ═══════════════════════════════════════════════════════════════════════════
function _l2drawRun(ctx) {
  var t = _l2t;
  var cx = G.W / 2;

  // ── Camera bob (subtle vertical sway for speed feel) ─────────────────
  var camBob = Math.sin(t * 9 * _l2speed) * 2.5;

  // ── Sky: dusk gradient #1B1F4B → #F2A65A ─────────────────────────────
  var skyGrad = ctx.createLinearGradient(0, 0, 0, L2_HORIZON_Y + camBob);
  skyGrad.addColorStop(0,   '#1B1F4B');
  skyGrad.addColorStop(0.45,'#3B2068');
  skyGrad.addColorStop(0.80,'#C85A20');
  skyGrad.addColorStop(1,   '#F2A65A');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, G.W, L2_HORIZON_Y + camBob + 2);

  // Stars (upper third of sky only — visible at dusk)
  for (var si = 0; si < 30; si++) {
    var sx = (si * 0.037 * G.W + 40) % G.W;
    var sy = 10 + (si * 0.031 * (L2_HORIZON_Y * 0.45));
    var sA = 0.3 + Math.sin(t * (0.9 + si * 0.1) + si) * 0.2;
    ctx.beginPath(); ctx.arc(sx, sy, 1 + (si % 3) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,248,208,' + sA + ')'; ctx.fill();
  }

  // Soft vanishing-point glow
  G.scenery.drawGlow(ctx, cx, L2_HORIZON_Y + camBob, 140, '#FFB060', 0.38);

  // ── Mountain ranges (3 layers, clipped to sky) ────────────────────────
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, G.W, L2_HORIZON_Y + camBob);
  ctx.clip();
  _l2drawMountains(ctx, cx, L2_HORIZON_Y + camBob, t);
  ctx.restore();

  // ── Ground: meadow verges + warm stone road ───────────────────────────
  _l2drawGround(ctx, L2_HORIZON_Y + camBob, t);

  // ── Roadside scenery (sorted back-to-front) ───────────────────────────
  var roadsorted = _l2roadside.slice().sort(function (a, b) { return a.z - b.z; });
  for (var rsi = 0; rsi < roadsorted.length; rsi++) {
    var item = roadsorted[rsi];
    if (item.z < 0.05) continue;  // behind horizon, skip
    // Project to screen: roadside objects are outside lane 2 on each side
    // laneOff = ±(0.72 + side_jitter) makes them appear off the road verge
    var jitter = 0.15 + ((rsi * 0.137) % 0.35);
    var laneOff = item.side * (0.72 + jitter);
    var rp = _l2projectPoint(item.z, laneOff);
    var rsc = 0.2 + item.z * 0.8;
    ctx.save();
    ctx.translate(rp.x, rp.y);
    ctx.scale(rsc, rsc);
    _l2drawRoadsideItem(ctx, item.type, t + item.phase);
    ctx.restore();
  }

  // ── Road objects (sorted back-to-front) ──────────────────────────────
  var sorted = _l2objects.slice().sort(function (a, b) { return a.z - b.z; });
  for (var oi = 0; oi < sorted.length; oi++) {
    var obj = sorted[oi];
    if (obj.cleared) continue;
    var proj = _l2project(obj.z, obj.lane);
    var sc   = proj.scale * 1.4;   // 1.4× larger than before
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.scale(sc, sc);
    if (obj.type === 'rock')  { G.art.drawRock(ctx, 0, 0); _l2darkOutline(ctx); }
    else if (obj.type === 'log')  { G.art.drawLog(ctx, 0, 0); _l2darkOutline(ctx); }
    else if (obj.type === 'bush') { G.art.drawBush(ctx, 0, 0); _l2darkOutline(ctx); }
    else if (obj.type === 'modak') {
      // Pulsing golden glow behind modak
      var mglow = 0.45 + Math.sin(t * 4 + obj.id) * 0.15;
      G.scenery.drawGlow(ctx, 0, -14, 22, '#FFD860', mglow);
      G.art.drawModak(ctx, 0, 0, 1.0);
    }
    ctx.restore();
  }

  // ── Dust puffs ────────────────────────────────────────────────────────
  for (var dp2 = 0; dp2 < _l2dustPuffs.length; dp2++) {
    var pf = _l2dustPuffs[dp2];
    var pfA = (pf.life / (pf.maxLife || 0.8)) * 0.4;
    ctx.beginPath(); ctx.arc(pf.x, pf.y, pf.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,170,120,' + pfA + ')'; ctx.fill();
  }

  // ── Kartikeya: small, always ahead in far lane ────────────────────────
  _l2drawKartikeyaRunner(ctx, t);

  // ── Player: Ganesha on Mushak (back view) 1.5× bigger ────────────────
  var laneXs   = [-L2_LANE_SEP * 0.5, 0, L2_LANE_SEP * 0.5];
  var fromX    = laneXs[_l2lane];
  var toX      = laneXs[_l2targetLane];
  var lerpedX  = fromX + (toX - fromX) * _l2laneAnim;
  // Lean into the lane change
  var leanAngle = (_l2targetLane - _l2lane) * (1 - _l2laneAnim) * 0.12;
  var playerX  = cx + lerpedX;
  var playerY  = L2_GROUND_Y + 20 + camBob;
  var wobbleOff = _l2wobble > 0 ? Math.sin(_l2t * 18) * 8 : 0;

  ctx.save();
  ctx.translate(playerX + wobbleOff, playerY);
  ctx.rotate(leanAngle);
  ctx.translate(-(playerX + wobbleOff), -playerY);
  // Back-view sprite — drawGaneshaOnMushak handles back view internally
  G.art.drawGaneshaOnMushak(ctx, playerX + wobbleOff, playerY, t, {
    scale: 1.5,
    wobble: _l2wobble > 0 ? 1 : 0,
  });
  ctx.restore();

  // ── Blessing streaks ──────────────────────────────────────────────────
  for (var bs = 0; bs < _l2blessStreaks.length; bs++) {
    var streak = _l2blessStreaks[bs];
    var bsA = streak.life * 2.5;
    if (bsA > 1) bsA = 1;
    ctx.beginPath(); ctx.arc(streak.x, streak.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,230,80,' + bsA + ')'; ctx.fill();
  }

  // ── HUD ───────────────────────────────────────────────────────────────
  _l2drawRunHUD(ctx);

  // ── Lane buttons (touch) — big, 88×72 ────────────────────────────────
  _l2btnLeft  = G.ui.drawButton(ctx, '◀', 56,  G.H - 68, 88, 72,
    { color: 'rgba(0,0,0,0.55)', fontSize: 32, radius: 12 });
  _l2btnRight = G.ui.drawButton(ctx, '▶', G.W - 56, G.H - 68, 88, 72,
    { color: 'rgba(0,0,0,0.55)', fontSize: 32, radius: 12 });

  // ── Blessing button: bottom right, above right arrow ─────────────────
  // Cooldown ring integrated into a big touch target
  _l2drawBlessingRing(ctx, G.W - 56, G.H - 160, _l2blessCool, L2_BLESS_CD);
}

// ── Mountain layers drawn into sky clip region ────────────────────────────
function _l2drawMountains(ctx, cx, horizY, t) {
  // Layer 3 — far, dark indigo
  ctx.fillStyle = '#2A2458';
  ctx.beginPath(); ctx.moveTo(0, horizY);
  var pts3 = [0,-30, 180,-90, 320,-70, 440,-110, 560,-60, 640,-130,
              720,-60, 840,-100, 960,-70, 1080,-85, 1200,-55, G.W,-30, G.W,horizY];
  for (var i3 = 0; i3 < pts3.length; i3 += 2) {
    ctx.lineTo(cx - 640 + pts3[i3], horizY + pts3[i3+1]);
  }
  ctx.closePath(); ctx.fill();

  // Layer 2 — mid, muted purple
  ctx.fillStyle = '#4A3070';
  ctx.beginPath(); ctx.moveTo(0, horizY);
  var pts2 = [0,-10, 150,-55, 280,-38, 380,-72, 480,-40, 580,-85,
              700,-40, 780,-65, 900,-42, 1020,-58, 1140,-36, G.W,-14, G.W,horizY];
  for (var i2 = 0; i2 < pts2.length; i2 += 2) {
    ctx.lineTo(pts2[i2], horizY + pts2[i2+1]);
  }
  ctx.closePath(); ctx.fill();

  // Snow caps on mid layer (white tips on tallest peaks)
  var peaks = [[380,-72],[580,-85],[780,-65]];
  for (var pk = 0; pk < peaks.length; pk++) {
    var px = peaks[pk][0], pd = peaks[pk][1];
    ctx.fillStyle = 'rgba(240,245,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(px - 16, horizY + pd + 14);
    ctx.lineTo(px, horizY + pd - 4);
    ctx.lineTo(px + 16, horizY + pd + 14);
    ctx.closePath(); ctx.fill();
  }

  // Layer 1 — near, warm saffron silhouette
  ctx.fillStyle = '#6A3828';
  ctx.beginPath(); ctx.moveTo(0, horizY);
  var pts1 = [0,0, 120,-22, 240,-14, 360,-32, 480,-18, 600,-28, 720,-15,
              840,-26, 960,-16, 1100,-24, 1200,-12, G.W,0, G.W,horizY];
  for (var i1 = 0; i1 < pts1.length; i1 += 2) {
    ctx.lineTo(pts1[i1], horizY + pts1[i1+1]);
  }
  ctx.closePath(); ctx.fill();
}

// ── Ground: meadow sides + perspective road ───────────────────────────────
function _l2drawGround(ctx, horizY, t) {
  var GROUND_BOTTOM = G.H;
  var cx = G.W / 2;

  // Green-gold meadow (full ground area)
  var meadow = ctx.createLinearGradient(0, horizY, 0, GROUND_BOTTOM);
  meadow.addColorStop(0, '#4A6A18');
  meadow.addColorStop(0.5,'#3A5010');
  meadow.addColorStop(1,  '#2A3A08');
  ctx.fillStyle = meadow;
  ctx.fillRect(0, horizY, G.W, GROUND_BOTTOM - horizY);

  // Road trapezoid (warm cream stone)
  var roadNearHalfW = L2_LANE_SEP * 1.05;
  var roadFarHalfW  = 8;
  ctx.beginPath();
  ctx.moveTo(cx - roadFarHalfW, horizY);
  ctx.lineTo(cx + roadFarHalfW, horizY);
  ctx.lineTo(cx + roadNearHalfW, GROUND_BOTTOM);
  ctx.lineTo(cx - roadNearHalfW, GROUND_BOTTOM);
  ctx.closePath();
  var roadGrad = ctx.createLinearGradient(0, horizY, 0, GROUND_BOTTOM);
  roadGrad.addColorStop(0, '#A08858');
  roadGrad.addColorStop(1, '#786038');
  ctx.fillStyle = roadGrad; ctx.fill();

  // Road edge lines (perspective)
  for (var li = 0; li < 2; li++) {
    var ex = li === 0 ? cx - roadNearHalfW : cx + roadNearHalfW;
    ctx.beginPath();
    ctx.moveTo(cx + (li === 0 ? -1 : 1) * roadFarHalfW, horizY);
    ctx.lineTo(ex, GROUND_BOTTOM);
    ctx.strokeStyle = 'rgba(255,240,180,0.45)';
    ctx.lineWidth = 2.5; ctx.stroke();
  }

  // Scrolling lane dash lines (cream, 2 lanes)
  for (var div = -1; div <= 1; div += 2) {
    for (var seg = 0; seg < 14; seg++) {
      var segZ = ((seg / 14 + _l2scrollOff * 0.012) % 1);
      if (segZ < 0.04) continue;  // hide below horizon
      var p1 = _l2projectPoint(segZ,        div * 0.5);
      var p2 = _l2projectPoint(Math.min(1, segZ + 0.04), div * 0.5);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(255,240,200,0.55)';
      ctx.lineWidth = Math.max(1, 3.5 * segZ);
      ctx.stroke();
    }
  }

  // Meadow highlight shimmer strips (sense of speed)
  for (var ms = 0; ms < 6; ms++) {
    var mz = ((ms / 6 + _l2scrollOff * 0.018 + ms * 0.17) % 1);
    if (mz < 0.05) continue;
    var mOffL = _l2projectPoint(mz, -1.1);
    var mOffR = _l2projectPoint(mz,  1.1);
    var mA    = mz * 0.12;
    ctx.fillStyle = 'rgba(160,200,60,' + mA + ')';
    ctx.fillRect(0, mOffL.y - 1.5, mOffL.x, 2);
    ctx.fillRect(mOffR.x, mOffR.y - 1.5, G.W - mOffR.x, 2);
  }
}

// ── Roadside decorative items ─────────────────────────────────────────────
function _l2drawRoadsideItem(ctx, type, t) {
  if (type === 'tree') {
    // Simple festival tree (dark trunk + rounded green canopy)
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(-5, -55, 10, 55);
    ctx.beginPath(); ctx.arc(0, -68, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#2A5818'; ctx.fill();
    ctx.beginPath(); ctx.arc(-10, -58, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#3A7028'; ctx.fill();
    // Small marigold cluster on top
    ctx.beginPath(); ctx.arc(0, -90, 5, 0, Math.PI * 2);
    ctx.fillStyle = G.COL.marigold; ctx.fill();
  } else if (type === 'bush') {
    // Marigold bush — warm orange-yellow blooms
    ctx.beginPath(); ctx.arc(0, -18, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#2A5810'; ctx.fill();
    for (var bi = 0; bi < 5; bi++) {
      var ba = bi * 1.26 + t * 0.4;
      ctx.beginPath(); ctx.arc(Math.cos(ba) * 12, -18 + Math.sin(ba) * 10, 6, 0, Math.PI * 2);
      ctx.fillStyle = (bi % 2 === 0) ? G.COL.marigold : G.COL.saffron;
      ctx.fill();
    }
  } else if (type === 'diya') {
    // Diya lamp post: pole + diya on top
    ctx.fillStyle = '#5A3010';
    ctx.fillRect(-3, -50, 6, 50);
    ctx.beginPath(); ctx.arc(0, -55, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8A5020'; ctx.fill();
    G.art.drawDiya(ctx, 0, -50, true, t);
  } else if (type === 'flag') {
    // Small saffron festival flag on a pole
    ctx.strokeStyle = '#4A2008'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -48); ctx.stroke();
    ctx.fillStyle = G.COL.saffron;
    ctx.beginPath();
    ctx.moveTo(0, -48); ctx.lineTo(22, -42); ctx.lineTo(0, -36);
    ctx.closePath(); ctx.fill();
    // Om symbol on flag
    ctx.fillStyle = G.COL.gold;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ॐ', 10, -42);
  }
}

// ── Dark outline helper for obstacles (improves contrast on new bg) ───────
function _l2darkOutline(ctx) {
  ctx.strokeStyle = 'rgba(20,8,0,0.55)';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

// ── Kartikeya small sprite in far lane, always slightly ahead ────────────
function _l2drawKartikeyaRunner(ctx, t) {
  // Kartikeya is scripted ahead; show him in the far lane on screen
  // Approximate: project at z=0.45 in lane 0 or 2 (alternates slowly)
  var kartLane = Math.floor(_l2t / 8) % 2 === 0 ? 0 : 2;
  var kartProj = _l2project(0.45, kartLane);
  var kartSc   = kartProj.scale * 0.75;
  ctx.save();
  ctx.translate(kartProj.x, kartProj.y);
  ctx.scale(kartSc, kartSc);
  G.art.drawKartikeya(ctx, 0, 0, t, { scale: 1.0, dir: 1 });
  ctx.restore();
}

// Project a normalised-lane-offset (-1..1) to screen X at depth z
function _l2projectPoint(z, laneOff) {
  var sy = L2_HORIZON_Y + (L2_GROUND_Y - L2_HORIZON_Y) * z;
  var sx = G.W / 2 + laneOff * L2_LANE_SEP * z;
  return { x: sx, y: sy };
}

function _l2drawRunHUD(ctx) {
  // ── Race progress bar (top, inside a panel) ───────────────────────────
  var barX = 60, barY = 12, barW = G.W - 120, barH = 26;
  // Panel
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(barX - 8, barY - 4, barW + 16, barH + 8, 8); ctx.fill();
  } else {
    ctx.fillRect(barX - 8, barY - 4, barW + 16, barH + 8);
  }

  // Track line
  ctx.fillStyle = '#7A5828';
  ctx.fillRect(barX + 4, barY + 11, barW - 8, 4);

  // ── Kartikeya icon: green circle, 'K', bigger (r=13) ─────────────────
  var kartX = barX + 4 + (barW - 26) * Math.min(0.98, _l2kartProg);
  G.art.circle(ctx, kartX, barY + barH / 2, 13, G.COL.green);
  // Dark outline on icon
  ctx.beginPath(); ctx.arc(kartX, barY + barH / 2, 13, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  // Bold 'K' with outline
  ctx.font = 'bold 13px -apple-system,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText('K', kartX + 1, barY + barH / 2 + 1);
  ctx.fillStyle = G.COL.white; ctx.fillText('K', kartX, barY + barH / 2);

  // ── Ganesha icon: saffron circle, 'G', bigger ────────────────────────
  var ganX = barX + 4 + (barW - 26) * Math.min(0.98, _l2progress);
  G.art.circle(ctx, ganX, barY + barH / 2, 13, G.COL.saffron);
  ctx.beginPath(); ctx.arc(ganX, barY + barH / 2, 13, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = 'bold 13px -apple-system,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText('G', ganX + 1, barY + barH / 2 + 1);
  ctx.fillStyle = G.COL.white; ctx.fillText('G', ganX, barY + barH / 2);

  // ── Hits panel (top-left, below race bar) ─────────────────────────────
  var hudPanelY = barY + barH + 14;
  _l2hudText(ctx, 'Hits: ' + _l2hitCount, 24, hudPanelY, 20,
    _l2hitCount > 0 ? '#FFBB70' : G.COL.cream);

  // ── Timer (top-centre, below race bar) ────────────────────────────────
  var rem = Math.max(0, Math.ceil(L2_RUN_SECS - _l2t));
  _l2hudText(ctx, rem + 's', G.W / 2, hudPanelY, 20, G.COL.cream);

  // ── Modak count (top-left, small) ─────────────────────────────────────
  _l2hudText(ctx, '★ ' + _l2modakCount, G.W - 24, hudPanelY, 20, G.COL.gold);
}

// Helper: draw HUD text with a dark drop-shadow for legibility
function _l2hudText(ctx, text, x, y, size, color) {
  ctx.font = 'bold ' + size + 'px -apple-system,sans-serif';
  ctx.textAlign   = (x < 100) ? 'left' : (x > G.W - 100) ? 'right' : 'center';
  ctx.textBaseline = 'top';
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillText(text, x + 1.5, y + 1.5);
  // Text
  ctx.fillStyle = color || G.COL.cream;
  ctx.fillText(text, x, y);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW: FINISH TEXT
// ═══════════════════════════════════════════════════════════════════════════
function _l2drawFinish(ctx) {
  // Improved road background
  _l2drawRunBg(ctx);

  // Dark overlay
  ctx.fillStyle = 'rgba(10,5,0,0.72)';
  ctx.fillRect(0, 0, G.W, G.H);

  // Gates of Kailash
  _l2drawKailashGates(ctx, G.W / 2, G.H / 2 - 80);

  // Shiva and Parvati waiting at the gates
  G.art.drawShiva(ctx,   G.W / 2 - 140, G.H / 2 + 80, _l2t, { scale: 0.9 });
  G.art.drawParvati(ctx, G.W / 2 + 140, G.H / 2 + 80, _l2t, { scale: 0.9 });

  // Finish text with proper outlines
  var alpha = Math.min(1, _l2phaseT / 0.6);
  ctx.save(); ctx.globalAlpha = alpha;
  G.art.centeredText(ctx, 'Kartikeya is faster...', G.W / 2, G.H / 2 + 150, 28, G.COL.marigold);
  G.art.centeredText(ctx, 'but Ganesha knows a wiser way.', G.W / 2, G.H / 2 + 190, 24, G.COL.cream);
  G.art.centeredText(ctx, 'His parents are his world.', G.W / 2, G.H / 2 + 224, 22, G.COL.gold);
  ctx.restore();

  if (_l2phaseT > 2) {
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(_l2t * 3) * 0.2;
    G.art.centeredText(ctx, '▼ Continue...', G.W / 2, G.H - 30, 18, G.COL.cream);
    ctx.restore();
  }
}

// Road background (reused in finish phase)
function _l2drawRunBg(ctx) {
  var horizY = L2_HORIZON_Y;
  var skyGrad = ctx.createLinearGradient(0, 0, 0, horizY);
  skyGrad.addColorStop(0, '#1B1F4B'); skyGrad.addColorStop(1, '#F2A65A');
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, G.W, horizY);
  var meadow = ctx.createLinearGradient(0, horizY, 0, G.H);
  meadow.addColorStop(0, '#4A6A18'); meadow.addColorStop(1, '#2A3A08');
  ctx.fillStyle = meadow; ctx.fillRect(0, horizY, G.W, G.H - horizY);
}

function _l2drawKailashGates(ctx, cx, cy) {
  // Two tall gate pillars
  ctx.fillStyle = '#D4AF60';
  ctx.fillRect(cx - 140, cy - 100, 28, 100);
  ctx.fillRect(cx + 112, cy - 100, 28, 100);
  // Arch
  ctx.beginPath();
  ctx.arc(cx, cy - 100, 140, Math.PI, 0);
  ctx.strokeStyle = G.COL.gold;
  ctx.lineWidth = 6;
  ctx.stroke();
  // Gate banner
  G.art.centeredText(ctx, 'कैलाश', cx, cy - 110, 22, G.COL.gold);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW: FINALE (top-down orbit)
// ═══════════════════════════════════════════════════════════════════════════
function _l2drawFinale(ctx) {
  var t  = _l2t;
  var cx = G.W / 2, cy = G.H / 2;

  // Warm marble floor
  var floorGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 320);
  floorGrad.addColorStop(0, '#F0E0B0');
  floorGrad.addColorStop(1, '#D4AF60');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 0, G.W, G.H);

  // Decorative floor ring
  ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200,160,40,0.4)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200,160,40,0.25)'; ctx.lineWidth = 2; ctx.stroke();

  // Shiva + Parvati seated in the centre
  G.art.drawShiva(ctx,   cx - 45, cy + 20, t, { scale: 0.9 });
  G.art.drawParvati(ctx, cx + 45, cy + 20, t, { scale: 0.9 });

  // Wisdom fruit glow in centre (after lap 2)
  if (_l2laps >= 2) {
    G.art.drawWisdomFruit(ctx, cx, cy - 40, t);
  }

  // Ganesha orbiting at radius 160
  var ORBIT_R = 160;
  var gx = cx + Math.cos(_l2orbitAngle) * ORBIT_R;
  var gy = cy + Math.sin(_l2orbitAngle) * ORBIT_R * 0.55; // flatten Y for top-down feel
  G.art.drawGanesha(ctx, gx, gy, t, { state: 'walk', dir: Math.cos(_l2orbitAngle) > 0 ? 1 : -1, scale: 0.85 });

  // Kartikeya appears smiling after 3 laps
  if (_l2laps >= 3) {
    var kx = cx - 200, ky = cy + 160;
    G.art.drawKartikeya(ctx, kx, ky, t, { scale: 0.85, dir: 1 });
    G.art.centeredText(ctx, 'Kartikeya arrives, smiling and bowing!', cx, G.H - 50, 20, G.COL.marigold);
  }

  // Lap counter
  G.art.centeredText(ctx, 'Laps: ' + _l2laps + ' / 3', cx, 40, 26, G.COL.gold);

  // Instruction
  if (_l2laps < 3) {
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(_l2t * 3) * 0.25;
    G.art.centeredText(ctx, 'Hold ✨ Blessing to walk around your parents', cx, G.H - 36, 18, G.COL.cream);
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW: COMPLETE SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function _l2drawComplete(ctx) {
  ctx.fillStyle = 'rgba(20,10,0,0.82)';
  ctx.fillRect(0, 0, G.W, G.H);

  var cx = G.W / 2, cy = G.H / 2;
  G.art.centeredText(ctx, 'The Race Complete!', cx, cy - 140, 36, G.COL.marigold);

  // Stars
  for (var s = 0; s < 3; s++) {
    var col = s < _l2stars ? G.COL.gold : 'rgba(255,255,255,0.2)';
    G.art.centeredText(ctx, '★', cx - 80 + s * 80, cy - 80, 48, col);
  }

  G.art.centeredText(ctx, 'Modaks collected: ' + _l2modakCount, cx, cy - 20, 24, G.COL.cream);
  G.art.centeredText(ctx, 'Obstacles hit: ' + _l2hitCount,      cx, cy + 16, 24, G.COL.cream);
  G.art.centeredText(ctx, 'Blessing Score: ' + _l2points,       cx, cy + 56, 28, G.COL.gold);

  _l2nextRect = G.ui.drawButton(ctx, 'Next Level →', cx, cy + 120, 200, 56,
    { color: G.COL.saffron, fontSize: 24, radius: 14 });
}

// ── Blessing cooldown ring — large touch target (r=36) ───────────────────
// Drawn at bottom-right above the right arrow button.
function _l2drawBlessingRing(ctx, bx, by, cool, maxCool) {
  var R = 36;
  // Background circle
  ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();
  // Outer border
  ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,210,60,0.3)'; ctx.lineWidth = 3; ctx.stroke();

  if (cool > 0) {
    var frac = cool / maxCool;
    // Cooldown arc (depleted portion, grey)
    ctx.beginPath();
    ctx.arc(bx, by, R - 3, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 5; ctx.stroke();
    // Gold arc (ready portion)
    ctx.beginPath();
    ctx.arc(bx, by, R - 3, -Math.PI / 2 + frac * Math.PI * 2, Math.PI * 1.5);
    ctx.strokeStyle = G.COL.gold; ctx.lineWidth = 5; ctx.stroke();
  } else {
    // Fully ready — bright gold ring
    ctx.beginPath(); ctx.arc(bx, by, R - 3, 0, Math.PI * 2);
    ctx.strokeStyle = G.COL.gold; ctx.lineWidth = 5; ctx.stroke();
  }

  // Icon + shadow
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText('✨', bx + 1, by + 1);
  ctx.fillStyle = cool > 0 ? 'rgba(255,210,60,0.55)' : G.COL.gold;
  ctx.fillText('✨', bx, by);

  // "Bless" label below ring when ready
  if (cool <= 0) {
    _l2hudText(ctx, 'Bless', bx, by + R + 4, 14, G.COL.cream);
  }
}
