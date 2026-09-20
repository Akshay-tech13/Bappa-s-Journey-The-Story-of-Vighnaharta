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
    _l2attachClick();
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

  destroy: function () { _l2detachClick(); },
};

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW: RUNNER
// ═══════════════════════════════════════════════════════════════════════════
function _l2drawRun(ctx) {
  var t = _l2t;

  // ── Sky ──────────────────────────────────────────────────────────────
  var skyGrad = ctx.createLinearGradient(0, 0, 0, L2_HORIZON_Y);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(1, '#C8E8F5');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, G.W, L2_HORIZON_Y);

  // Mount Kailash silhouette on horizon
  ctx.save();
  ctx.translate(G.W / 2, L2_HORIZON_Y);
  ctx.beginPath();
  ctx.moveTo(-400, 0); ctx.lineTo(-140, -90); ctx.lineTo(-60, -90);
  ctx.lineTo(0, -130); ctx.lineTo(60, -90); ctx.lineTo(140, -90);
  ctx.lineTo(400, 0); ctx.closePath();
  ctx.fillStyle = '#7070A0'; ctx.fill();
  // Snow caps
  ctx.beginPath();
  ctx.moveTo(-40, -90); ctx.lineTo(0, -130); ctx.lineTo(40, -90);
  ctx.fillStyle = '#E8F0FF'; ctx.fill();
  ctx.restore();

  // ── Road / ground ─────────────────────────────────────────────────────
  var roadGrad = ctx.createLinearGradient(0, L2_HORIZON_Y, 0, G.H);
  roadGrad.addColorStop(0, '#8B7355');
  roadGrad.addColorStop(1, '#6B5A42');
  ctx.fillStyle = roadGrad;
  ctx.beginPath();
  ctx.moveTo(0, L2_HORIZON_Y);
  ctx.lineTo(G.W, L2_HORIZON_Y);
  ctx.lineTo(G.W, G.H);
  ctx.lineTo(0, G.H);
  ctx.closePath();
  ctx.fill();

  // Road edge lines (perspective)
  for (var li = 0; li < 2; li++) {
    var edgeX = li === 0 ? 0 : G.W;
    ctx.beginPath();
    ctx.moveTo(G.W / 2, L2_HORIZON_Y);
    ctx.lineTo(edgeX, G.H);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Lane dividers (dashed, scrolling)
  for (var div = -1; div <= 1; div += 2) {
    for (var seg = 0; seg < 10; seg++) {
      var segZ = ((seg / 10 + _l2scrollOff * 0.01) % 1);
      var p1 = _l2projectPoint(segZ, div * 0.5);
      var p2 = _l2projectPoint(Math.min(1, segZ + 0.06), div * 0.5);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(255,255,200,0.4)';
      ctx.lineWidth = Math.max(1, 3 * segZ);
      ctx.stroke();
    }
  }

  // ── Road objects (sorted back-to-front by z) ─────────────────────────
  var sorted = _l2objects.slice().sort(function (a, b) { return a.z - b.z; });
  for (var oi = 0; oi < sorted.length; oi++) {
    var obj = sorted[oi];
    if (obj.cleared) continue;
    var proj = _l2project(obj.z, obj.lane);
    var sc   = proj.scale;
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.scale(sc, sc);
    if (obj.type === 'rock')  { G.art.drawRock(ctx, 0, 0); }
    else if (obj.type === 'log')  { G.art.drawLog(ctx, 0, 0); }
    else if (obj.type === 'bush') { G.art.drawBush(ctx, 0, 0); }
    else if (obj.type === 'modak'){ G.art.drawModak(ctx, 0, 0, 1.0); }
    ctx.restore();
  }

  // ── Player: Ganesha on Mushak ─────────────────────────────────────────
  // Compute visual X by lerping between lane positions
  var laneXs   = [-L2_LANE_SEP * 0.5, 0, L2_LANE_SEP * 0.5];
  var fromX    = laneXs[_l2lane];
  var toX      = laneXs[_l2targetLane];
  var lerpedX  = fromX + (toX - fromX) * _l2laneAnim;
  var playerX  = G.W / 2 + lerpedX;
  var playerY  = L2_GROUND_Y + 20;

  // Wobble offset
  var wobbleOff = _l2wobble > 0 ? Math.sin(_l2t * 18) * 8 : 0;

  G.art.drawMushak(ctx, playerX + wobbleOff, playerY, t, { scale: 1.1, dir: 1 });
  G.art.drawGanesha(ctx, playerX + wobbleOff, playerY - 30, t, { state: 'celebrate', scale: 0.85 });

  // ── HUD ───────────────────────────────────────────────────────────────
  _l2drawRunHUD(ctx);

  // ── Lane buttons (touch) ──────────────────────────────────────────────
  _l2btnLeft  = G.ui.drawButton(ctx, '◀', 50,  G.H - 60, 80, 60,
    { color: 'rgba(0,0,0,0.4)', fontSize: 28, radius: 10 });
  _l2btnRight = G.ui.drawButton(ctx, '▶', G.W - 50, G.H - 60, 80, 60,
    { color: 'rgba(0,0,0,0.4)', fontSize: 28, radius: 10 });

  // Blessing ring
  _l2drawBlessingRing(ctx, G.W - 52, 66, _l2blessCool, L2_BLESS_CD);
}

// Project a normalised-lane-offset (-1..1) to screen X at depth z
function _l2projectPoint(z, laneOff) {
  var sy = L2_HORIZON_Y + (L2_GROUND_Y - L2_HORIZON_Y) * z;
  var sx = G.W / 2 + laneOff * L2_LANE_SEP * z;
  return { x: sx, y: sy };
}

function _l2drawRunHUD(ctx) {
  var t = _l2t;

  // Track progress bar (top of screen)
  var barX = 80, barY = 14, barW = G.W - 160, barH = 22;
  // Background
  G.art.roundRect(ctx, barX, barY, barW, barH, 8, 'rgba(0,0,0,0.45)');

  // Road track line
  ctx.fillStyle = '#8B7355';
  G.art.roundRect(ctx, barX + 4, barY + 9, barW - 8, 4, 2, '#8B7355');

  // Kartikeya icon (peacock green)
  var kartX = barX + 4 + (barW - 22) * Math.min(0.98, _l2kartProg);
  G.art.circle(ctx, kartX, barY + barH / 2, 9, G.COL.green);
  G.art.centeredText(ctx, 'K', kartX, barY + barH / 2, 11, G.COL.white);

  // Ganesha icon (saffron)
  var ganX = barX + 4 + (barW - 22) * Math.min(0.98, _l2progress);
  G.art.circle(ctx, ganX, barY + barH / 2, 9, G.COL.saffron);
  G.art.centeredText(ctx, 'G', ganX, barY + barH / 2, 11, G.COL.white);

  // Modak + hit count
  G.art.centeredText(ctx, '🍡 ' + _l2modakCount, 42, 54, 18, G.COL.cream);
  if (_l2hitCount > 0) {
    G.art.centeredText(ctx, 'Hits: ' + _l2hitCount, G.W / 2, 54, 16, 'rgba(255,180,100,0.8)');
  }
  // Time remaining
  var rem = Math.max(0, Math.ceil(L2_RUN_SECS - _l2t));
  G.art.centeredText(ctx, rem + 's', G.W - 80, 54, 16, 'rgba(255,255,255,0.5)');
}

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW: FINISH TEXT
// ═══════════════════════════════════════════════════════════════════════════
function _l2drawFinish(ctx) {
  // Static road background
  _l2drawRunBg(ctx);

  // Dark overlay
  ctx.fillStyle = 'rgba(10,5,0,0.72)';
  ctx.fillRect(0, 0, G.W, G.H);

  // Gates of Kailash
  _l2drawKailashGates(ctx, G.W / 2, G.H / 2 - 80);

  // Shiva and Parvati waiting at the gates
  G.art.drawShiva(ctx,   G.W / 2 - 140, G.H / 2 + 80, _l2t, { scale: 0.9 });
  G.art.drawParvati(ctx, G.W / 2 + 140, G.H / 2 + 80, _l2t, { scale: 0.9 });

  // Finish text
  var alpha = Math.min(1, _l2phaseT / 0.6);
  ctx.save(); ctx.globalAlpha = alpha;
  G.art.centeredText(ctx, 'Kartikeya is faster...', G.W / 2, G.H / 2 + 150, 28, G.COL.marigold);
  G.art.centeredText(ctx, 'but Ganesha knows a wiser way.', G.W / 2, G.H / 2 + 190, 24, G.COL.cream);
  G.art.centeredText(ctx, 'His parents are his world.', G.W / 2, G.H / 2 + 224, 22, G.COL.gold);
  ctx.restore();

  // Continue prompt
  if (_l2phaseT > 2) {
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(_l2t * 3) * 0.2;
    G.art.centeredText(ctx, '▼ Continue...', G.W / 2, G.H - 30, 18, G.COL.cream);
    ctx.restore();
  }
}

// Simple road background without objects (reused in finish phase)
function _l2drawRunBg(ctx) {
  // Sky
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, G.W, L2_HORIZON_Y);
  // Ground
  ctx.fillStyle = '#7B6347';
  ctx.fillRect(0, L2_HORIZON_Y, G.W, G.H - L2_HORIZON_Y);
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

// ── Reusable blessing cooldown ring ─────────────────────────────────────
function _l2drawBlessingRing(ctx, bx, by, cool, maxCool) {
  ctx.beginPath(); ctx.arc(bx, by, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
  if (cool > 0) {
    var frac = cool / maxCool;
    ctx.beginPath(); ctx.arc(bx, by, 20, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, by, 20, -Math.PI / 2 + frac * Math.PI * 2, Math.PI * 1.5);
    ctx.strokeStyle = G.COL.gold; ctx.lineWidth = 4; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(bx, by, 20, -Math.PI / 2, Math.PI * 1.5);
    ctx.strokeStyle = G.COL.gold; ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = G.COL.gold; ctx.fillText('✨', bx, by);
}
