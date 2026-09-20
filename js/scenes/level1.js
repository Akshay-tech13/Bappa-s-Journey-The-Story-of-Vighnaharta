// js/scenes/level1.js — Level 1: "Modak Mischief"
// Top-down stealth level. Collect 5 modaks and reach Mushak's exit.
// Maa Parvati patrols with a golden gaze cone. Blessing clears one obstacle.
// No game over — spotted returns Ganesha to start, modaks kept.

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
//  WORLD LAYOUT  (logical pixels, world is 1920 wide × 720 tall)
//  Camera scrolls horizontally to follow Ganesha.
// ═══════════════════════════════════════════════════════════════════════════
var L1_WORLD_W = 1920;
var L1_WORLD_H = 720;

// Floor colour bands (kitchen)
var L1_FLOOR_COL  = '#F5E6C8';   // warm cream tile
var L1_WALL_COL   = '#C8905A';   // terracotta wall
var L1_WALL_H     = 60;          // top and bottom wall strip height

// ── Obstacle rectangles { x,y,w,h, type, removable, id } ─────────────────
// type: 'wall'|'table'|'pot'|'stool'   removable: Blessing can clear it
var _l1Obs = [];   // populated in init so removable state resets each run

var L1_OBS_DEFS = [
  // Left wall pillar / door frame
  { x:0,    y:L1_WALL_H, w:30,  h:L1_WORLD_H-L1_WALL_H*2, type:'wall',  removable:false, id:0 },
  // Right boundary
  { x:L1_WORLD_W-30, y:L1_WALL_H, w:30, h:L1_WORLD_H-L1_WALL_H*2, type:'wall', removable:false, id:1 },

  // Tables (horizontal, long)
  { x:200,  y:180, w:220, h:60,  type:'table', removable:false, id:2 },
  { x:200,  y:480, w:220, h:60,  type:'table', removable:false, id:3 },
  { x:650,  y:220, w:180, h:60,  type:'table', removable:false, id:4 },
  { x:950,  y:420, w:180, h:60,  type:'table', removable:false, id:5 },
  { x:1300, y:180, w:200, h:60,  type:'table', removable:false, id:6 },
  { x:1300, y:480, w:200, h:60,  type:'table', removable:false, id:7 },

  // Big pots (provide cover)
  { x:420,  y:320, w:50,  h:50,  type:'pot',   removable:false, id:8 },
  { x:820,  y:160, w:50,  h:50,  type:'pot',   removable:false, id:9 },
  { x:820,  y:520, w:50,  h:50,  type:'pot',   removable:false, id:10 },
  { x:1140, y:280, w:50,  h:50,  type:'pot',   removable:false, id:11 },

  // Stools (small, removable by Blessing — block a shortcut)
  { x:540,  y:310, w:44,  h:44,  type:'stool', removable:true,  id:12 },
  { x:740,  y:340, w:44,  h:44,  type:'stool', removable:true,  id:13 },
  { x:1070, y:350, w:44,  h:44,  type:'stool', removable:true,  id:14 },
];

// ── Modak pickup positions ──────────────────────────────────────────────
var L1_MODAK_DEFS = [
  { x:300,  y:280 },
  { x:600,  y:460 },
  { x:900,  y:260 },
  { x:1150, y:480 },
  { x:1550, y:360 },
];

// ── Mushak exit ─────────────────────────────────────────────────────────
var L1_EXIT = { x:1840, y:340, r:36 };

// ── Parvati patrol waypoints (world coords, she pauses 1.5 s at each) ──
var L1_PATROL = [
  { x:460,  y:360 },
  { x:700,  y:220 },
  { x:920,  y:360 },
  { x:700,  y:520 },
];
var L1_PARVATI_SPEED = 80;   // px/s
var L1_CONE_RANGE    = 200;  // px
var L1_CONE_HALF_ARC = 0.65; // radians (~37°)

// ── Ganesha start ───────────────────────────────────────────────────────
var L1_START = { x:80, y:360 };

// ═══════════════════════════════════════════════════════════════════════════
//  SCENE STATE
// ═══════════════════════════════════════════════════════════════════════════
var _l1t         = 0;    // level elapsed time (seconds)
var _l1camX      = 0;    // camera X offset (world → screen)
var _l1gx        = 0;    // Ganesha world x (centre)
var _l1gy        = 0;    // Ganesha world y (centre)
var _l1gvx       = 0;    // Ganesha velocity x
var _l1gvy       = 0;    // Ganesha velocity y
var _l1gDir      = 1;    // 1=right -1=left facing
var _l1modaks    = [];   // modak pickup objects { x,y, collected }
var _l1collected = 0;    // how many modaks collected
var _l1spotted   = 0;    // spotted count (for stars)
var _l1phase     = 'play'; // 'play' | 'spotted' | 'complete'
var _l1phaseT    = 0;    // timer within phase
var _l1particles = [];   // sparkle particles

// Parvati state
var _l1px        = 0;    // Parvati world x
var _l1py        = 0;    // Parvati world y
var _l1pAngle    = 0;    // facing angle (radians, 0=right)
var _l1pwp       = 0;    // waypoint index
var _l1pPause    = 0;    // pause timer (counts down)
var _l1pSpotted  = false;// currently showing smile

// Blessing state
var _l1blessCooldown = 0;  // seconds remaining on cooldown
var L1_BLESS_CD      = 3;  // cooldown seconds

// Level complete results
var _l1stars  = 0;
var _l1points = 0;

// Next-button rect for complete screen
var _l1nextRect = null;
var _l1clickH   = null;

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// dist² between two points (avoids sqrt when possible)
function _l1dist2(ax,ay,bx,by){ var dx=ax-bx,dy=ay-by; return dx*dx+dy*dy; }
function _l1dist(ax,ay,bx,by) { return Math.sqrt(_l1dist2(ax,ay,bx,by)); }

// AABB collision: does circle (cx,cy,r) overlap rect (rx,ry,rw,rh)?
function _l1circleRect(cx,cy,r,rx,ry,rw,rh){
  var nx = Math.max(rx, Math.min(cx, rx+rw));
  var ny = Math.max(ry, Math.min(cy, ry+rh));
  return _l1dist2(cx,cy,nx,ny) < r*r;
}

// Does line segment (ax,ay)→(bx,by) intersect rect (rx,ry,rw,rh)?
// Uses the separating-axis slab method on each of the 4 edges.
function _l1segRect(ax,ay,bx,by,rx,ry,rw,rh){
  // Early reject with broad AABB
  if(Math.min(ax,bx)>rx+rw||Math.max(ax,bx)<rx) return false;
  if(Math.min(ay,by)>ry+rh||Math.max(ay,by)<ry) return false;
  // Check if any segment-vs-edge intersects
  var corners = [[rx,ry],[rx+rw,ry],[rx+rw,ry+rh],[rx,ry+rh]];
  for(var i=0;i<4;i++){
    var c1=corners[i], c2=corners[(i+1)%4];
    if(_l1segsIntersect(ax,ay,bx,by,c1[0],c1[1],c2[0],c2[1])) return true;
  }
  // Check if segment is entirely inside rect
  if(ax>=rx&&ax<=rx+rw&&ay>=ry&&ay<=ry+rh) return true;
  return false;
}

// Standard 2D segment–segment intersection test
function _l1segsIntersect(p1x,p1y,p2x,p2y,p3x,p3y,p4x,p4y){
  var d1x=p2x-p1x, d1y=p2y-p1y;
  var d2x=p4x-p3x, d2y=p4y-p3y;
  var cross=d1x*d2y-d1y*d2x;
  if(Math.abs(cross)<1e-8) return false;
  var dx=p3x-p1x, dy=p3y-p1y;
  var t=(dx*d2y-dy*d2x)/cross;
  var u=(dx*d1y-dy*d1x)/cross;
  return t>=0&&t<=1&&u>=0&&u<=1;
}

// Is Ganesha (gx,gy) visible to Parvati (px,py,pAngle)?
// 1. Must be within cone arc and range
// 2. Segment from Parvati → Ganesha must not cross any solid obstacle
function _l1canSeeGanesha(){
  var dx=_l1gx-_l1px, dy=_l1gy-_l1py;
  var dist=Math.sqrt(dx*dx+dy*dy);
  if(dist>L1_CONE_RANGE) return false;

  // Angle from Parvati to Ganesha
  var angle=Math.atan2(dy,dx);
  var diff=angle-_l1pAngle;
  // Normalise diff to -π..π
  while(diff> Math.PI) diff-=Math.PI*2;
  while(diff<-Math.PI) diff+=Math.PI*2;
  if(Math.abs(diff)>L1_CONE_HALF_ARC) return false;

  // Line-of-sight check against solid obstacles
  for(var i=0;i<_l1Obs.length;i++){
    var o=_l1Obs[i];
    if(o.removed) continue;
    // Only block if big enough to provide real cover
    if(o.type==='stool') continue; // stools too small to block sight
    if(_l1segRect(_l1px,_l1py,_l1gx,_l1gy,o.x,o.y,o.w,o.h)) return false;
  }
  return true;
}

// Resolve Ganesha against all active obstacles (push out of any overlap)
function _l1resolveCollisions(){
  var r=18; // Ganesha collision radius
  for(var i=0;i<_l1Obs.length;i++){
    var o=_l1Obs[i];
    if(o.removed) continue;
    if(!_l1circleRect(_l1gx,_l1gy,r,o.x,o.y,o.w,o.h)) continue;
    // Find nearest point on rect to circle centre
    var nx=Math.max(o.x,Math.min(_l1gx,o.x+o.w));
    var ny=Math.max(o.y,Math.min(_l1gy,o.y+o.h));
    var dx=_l1gx-nx, dy=_l1gy-ny;
    var d=Math.sqrt(dx*dx+dy*dy)||1;
    var pen=r-d; // penetration depth
    _l1gx+=dx/d*pen;
    _l1gy+=dy/d*pen;
  }
  // World bounds
  _l1gx=Math.max(r+30, Math.min(L1_WORLD_W-r-30, _l1gx));
  _l1gy=Math.max(r+L1_WALL_H, Math.min(L1_WORLD_H-r-L1_WALL_H, _l1gy));
}

// Compute level results (stars + points)
function _l1calcResults(){
  var stars;
  if(_l1spotted===0)       stars=3;
  else if(_l1spotted<=2)   stars=2;
  else                     stars=1;

  var timeBonus=0;
  if(_l1t<=G.SCORE.l1TimeBonusFull)      timeBonus=100;
  else if(_l1t<=G.SCORE.l1TimeBonusHalf) timeBonus=50;

  var pts=_l1collected*G.SCORE.modakPts + stars*G.SCORE.starPts + timeBonus;
  _l1stars=stars;
  _l1points=pts;

  // Store in G.run for the final score screen
  G.run.levelScores['level1']=pts;
  G.run.levelStars['level1']=stars;
}

// Spawn sparkle particles at (wx,wy) in world coords
function _l1sparkle(wx,wy){
  for(var i=0;i<8;i++){
    var a=Math.random()*Math.PI*2;
    var spd=40+Math.random()*60;
    _l1particles.push({
      x:wx, y:wy,
      vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
      life:0.6, maxLife:0.6,
      col:Math.random()<0.5?G.COL.marigold:G.COL.gold,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  INPUT / CLICK HANDLER (for Complete screen Next button)
// ═══════════════════════════════════════════════════════════════════════════
function _l1attachClick(){
  _l1clickH=function(e){
    if(_l1phase!=='complete') return;
    var p=G.ui.toLogical(e);
    if(_l1nextRect&&G.ui.isButtonHit(p.x,p.y,_l1nextRect)){
      // Advance to next level in order, or to returnTo override (set by end.js replay)
      var _l1ret = G.run.returnTo;
      if (_l1ret) { G.run.returnTo = null; G.sceneManager.goto(_l1ret); return; }
      var idx=G.LEVEL_ORDER.indexOf('level1');
      var next=G.LEVEL_ORDER[idx+1];
      G.sceneManager.goto(next||'recap');
    }
  };
  G.canvas.addEventListener('click',     _l1clickH);
  G.canvas.addEventListener('touchstart',_l1clickH,{passive:false});
}
function _l1detachClick(){
  if(_l1clickH){
    G.canvas.removeEventListener('click',      _l1clickH);
    G.canvas.removeEventListener('touchstart', _l1clickH);
    _l1clickH=null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCENE
// ═══════════════════════════════════════════════════════════════════════════
G.scenes['level1'] = {

  init: function(){
    _l1t=0; _l1camX=0; _l1phase='play'; _l1phaseT=0;
    _l1collected=0; _l1spotted=0;
    _l1particles=[];
    _l1blessCooldown=0;
    _l1nextRect=null;

    // Reset Ganesha
    _l1gx=L1_START.x; _l1gy=L1_START.y;
    _l1gvx=0; _l1gvy=0; _l1gDir=1;

    // Clone obstacle array (so removable resets)
    _l1Obs=[];
    for(var i=0;i<L1_OBS_DEFS.length;i++){
      var d=L1_OBS_DEFS[i];
      _l1Obs.push({x:d.x,y:d.y,w:d.w,h:d.h,type:d.type,removable:d.removable,id:d.id,removed:false});
    }

    // Clone modaks
    _l1modaks=[];
    for(var m=0;m<L1_MODAK_DEFS.length;m++){
      _l1modaks.push({x:L1_MODAK_DEFS[m].x, y:L1_MODAK_DEFS[m].y, collected:false});
    }

    // Place Parvati at first waypoint
    _l1px=L1_PATROL[0].x; _l1py=L1_PATROL[0].y;
    _l1pwp=0; _l1pPause=1.0; _l1pSpotted=false;
    _l1pAngle=0;

    _l1attachClick();
  },

  update: function(dt){
    if(_l1phase==='complete') return;

    _l1t+=dt;
    _l1blessCooldown=Math.max(0,_l1blessCooldown-dt);

    // ── Phase: spotted — freeze Ganesha, show message, then return to start ──
    if(_l1phase==='spotted'){
      _l1phaseT+=dt;
      if(_l1phaseT>2.5){
        // Return Ganesha to start
        _l1gx=L1_START.x; _l1gy=L1_START.y;
        _l1gvx=0; _l1gvy=0;
        _l1phase='play'; _l1phaseT=0;
        _l1pSpotted=false;
      }
      return;
    }

    // ── Ganesha movement ──────────────────────────────────────────────────
    var inp=G.input.state;
    var ax=inp.move.x*G.PLAYER_SPEED;
    var ay=inp.move.y*G.PLAYER_SPEED;
    var ACCEL=14; // smoothing factor
    _l1gvx+=( ax-_l1gvx)*Math.min(1,ACCEL*dt);
    _l1gvy+=( ay-_l1gvy)*Math.min(1,ACCEL*dt);
    _l1gx+=_l1gvx*dt;
    _l1gy+=_l1gvy*dt;
    if(Math.abs(_l1gvx)>5) _l1gDir=_l1gvx>0?1:-1;
    _l1resolveCollisions();

    // ── Modak collection ─────────────────────────────────────────────────
    for(var m=0;m<_l1modaks.length;m++){
      if(_l1modaks[m].collected) continue;
      if(_l1dist(_l1gx,_l1gy,_l1modaks[m].x,_l1modaks[m].y)<26){
        _l1modaks[m].collected=true;
        _l1collected++;
        _l1sparkle(_l1modaks[m].x,_l1modaks[m].y);
        G.audio.modakPop();
      }
    }

    // ── Blessing action ───────────────────────────────────────────────────
    if(inp.actionPressed && _l1blessCooldown<=0){
      _l1blessCooldown=L1_BLESS_CD;
      G.audio.blessingShimmer();
      // Remove the nearest removable obstacle within reach
      var best=-1, bestD=G.BLESSING_REACH*G.BLESSING_REACH;
      for(var i=0;i<_l1Obs.length;i++){
        var o=_l1Obs[i];
        if(!o.removable||o.removed) continue;
        var ocx=o.x+o.w/2, ocy=o.y+o.h/2;
        var d2=_l1dist2(_l1gx,_l1gy,ocx,ocy);
        if(d2<bestD){ bestD=d2; best=i; }
      }
      if(best>=0){
        _l1Obs[best].removed=true;
        _l1sparkle(_l1Obs[best].x+_l1Obs[best].w/2,_l1Obs[best].y+_l1Obs[best].h/2);
      }
    }

    // ── Exit check (all 5 modaks collected) ──────────────────────────────
    if(_l1collected>=5){
      var edx=_l1gx-L1_EXIT.x, edy=_l1gy-L1_EXIT.y;
      if(edx*edx+edy*edy<L1_EXIT.r*L1_EXIT.r){
        _l1calcResults();
        _l1phase='complete'; _l1phaseT=0;
        G.audio.levelComplete();
        return;
      }
    }

    // ── Parvati patrol ────────────────────────────────────────────────────
    var wp=L1_PATROL[_l1pwp];
    if(_l1pPause>0){
      _l1pPause-=dt;
    } else {
      // Move towards next waypoint
      var pwdx=wp.x-_l1px, pwdy=wp.y-_l1py;
      var pwdist=Math.sqrt(pwdx*pwdx+pwdy*pwdy);
      if(pwdist<4){
        // Reached waypoint — pause, then advance
        _l1pPause=1.5;
        _l1pwp=(_l1pwp+1)%L1_PATROL.length;
      } else {
        var spd=L1_PARVATI_SPEED*dt;
        _l1px+=pwdx/pwdist*spd;
        _l1py+=pwdy/pwdist*spd;
        // Face direction of travel
        _l1pAngle=Math.atan2(pwdy,pwdx);
      }
    }

    // ── Spotted check ─────────────────────────────────────────────────────
    if(_l1phase==='play' && _l1canSeeGanesha()){
      _l1spotted++;
      _l1phase='spotted'; _l1phaseT=0;
      _l1pSpotted=true;
      G.audio.thud();
    }

    // ── Update particles ──────────────────────────────────────────────────
    for(var p=_l1particles.length-1;p>=0;p--){
      var par=_l1particles[p];
      par.x+=par.vx*dt; par.y+=par.vy*dt;
      par.life-=dt;
      if(par.life<=0) _l1particles.splice(p,1);
    }

    // ── Camera follows Ganesha, clamped to world ──────────────────────────
    var targetCamX=_l1gx-G.W/2;
    _l1camX+=(targetCamX-_l1camX)*Math.min(1,8*dt);
    _l1camX=Math.max(0,Math.min(L1_WORLD_W-G.W,_l1camX));
  },

  draw: function(ctx){
    var cam=Math.round(_l1camX); // integer offset for crisp rendering

    // ═══ WORLD DRAW (camera-offset) ═════════════════════════════════════
    ctx.save();
    ctx.translate(-cam,0);

    // ── Floor ──────────────────────────────────────────────────────────
    ctx.fillStyle=L1_FLOOR_COL;
    ctx.fillRect(0,L1_WALL_H, L1_WORLD_W, L1_WORLD_H-L1_WALL_H*2);

    // Tile lines (subtle)
    ctx.strokeStyle='rgba(200,170,120,0.25)';
    ctx.lineWidth=1;
    for(var tx=0;tx<L1_WORLD_W;tx+=80){
      ctx.beginPath(); ctx.moveTo(tx,L1_WALL_H); ctx.lineTo(tx,L1_WORLD_H-L1_WALL_H); ctx.stroke();
    }
    for(var ty=L1_WALL_H;ty<L1_WORLD_H-L1_WALL_H;ty+=80){
      ctx.beginPath(); ctx.moveTo(0,ty); ctx.lineTo(L1_WORLD_W,ty); ctx.stroke();
    }

    // ── Top and bottom walls ───────────────────────────────────────────
    ctx.fillStyle=L1_WALL_COL;
    ctx.fillRect(0,0, L1_WORLD_W, L1_WALL_H);
    ctx.fillRect(0,L1_WORLD_H-L1_WALL_H, L1_WORLD_W, L1_WALL_H);
    // Wall decoration stripe
    ctx.fillStyle='rgba(140,60,10,0.3)';
    ctx.fillRect(0,L1_WALL_H-8, L1_WORLD_W, 8);
    ctx.fillRect(0,L1_WORLD_H-L1_WALL_H, L1_WORLD_W, 8);

    // ── Parvati gaze cone (draw UNDER obstacles so it looks like light on floor)
    if(_l1phase!=='complete'){
      ctx.save();
      ctx.translate(_l1px,_l1py);
      ctx.rotate(_l1pAngle);
      var coneGrad=ctx.createRadialGradient(0,0,8,0,0,L1_CONE_RANGE);
      coneGrad.addColorStop(0,'rgba(255,210,80,0.30)');
      coneGrad.addColorStop(1,'rgba(255,210,80,0)');
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.arc(0,0,L1_CONE_RANGE,-L1_CONE_HALF_ARC,L1_CONE_HALF_ARC);
      ctx.closePath();
      ctx.fillStyle=coneGrad;
      ctx.fill();
      ctx.restore();
    }

    // ── Modaks ────────────────────────────────────────────────────────
    for(var m=0;m<_l1modaks.length;m++){
      if(_l1modaks[m].collected) continue;
      G.art.drawModak(ctx,_l1modaks[m].x,_l1modaks[m].y,1.1);
      // Soft glow ring
      ctx.beginPath();
      ctx.arc(_l1modaks[m].x,_l1modaks[m].y-10,18,0,Math.PI*2);
      ctx.strokeStyle='rgba(245,166,35,0.35)';
      ctx.lineWidth=3;
      ctx.stroke();
    }

    // ── Obstacles (Y-sorted with Ganesha and Parvati) ──────────────────
    // Build a draw list sorted by Y (bottom edge = y+h) for depth
    var drawList=[];

    // Add active obstacles
    for(var i=0;i<_l1Obs.length;i++){
      var o=_l1Obs[i];
      if(o.removed||o.type==='wall') continue; // walls drawn as borders
      drawList.push({sortY:o.y+o.h, kind:'obs', o:o});
    }
    // Mushak exit
    drawList.push({sortY:L1_EXIT.y+L1_EXIT.r, kind:'exit'});
    // Parvati
    drawList.push({sortY:_l1py, kind:'parvati'});
    // Ganesha
    drawList.push({sortY:_l1gy, kind:'ganesha'});

    // Sort by Y so closer (higher Y) things draw on top
    drawList.sort(function(a,b){return a.sortY-b.sortY;});

    for(var d=0;d<drawList.length;d++){
      var item=drawList[d];
      if(item.kind==='obs'){
        _l1drawObs(ctx,item.o,_l1t);
      } else if(item.kind==='exit'){
        _l1drawExit(ctx,_l1t);
      } else if(item.kind==='parvati'){
        var pDir=Math.cos(_l1pAngle)>=0?1:-1;
        G.art.drawParvati(ctx,_l1px,_l1py,_l1t,{scale:0.85,dir:pDir});
        // Spotted smile speech bubble
        if(_l1pSpotted){
          _l1drawBubble(ctx,_l1px,_l1py-100,'Wait for the puja,\nGanesha!');
        }
      } else if(item.kind==='ganesha'){
        var gState=(_l1phase==='spotted')?'idle':'walk';
        if(Math.abs(_l1gvx)<5&&Math.abs(_l1gvy)<5) gState='idle';
        G.art.drawGanesha(ctx,_l1gx,_l1gy,_l1t,{state:gState,dir:_l1gDir,scale:0.9});
      }
    }

    // ── Particles ─────────────────────────────────────────────────────
    for(var p=0;p<_l1particles.length;p++){
      var par=_l1particles[p];
      ctx.save();
      ctx.globalAlpha=par.life/par.maxLife;
      G.art.circle(ctx,par.x,par.y,4,par.col);
      ctx.restore();
    }

    ctx.restore(); // end camera transform

    // ═══ HUD (screen-space, no camera offset) ═══════════════════════════
    _l1drawHUD(ctx);

    // ═══ Phase overlays ══════════════════════════════════════════════════
    if(_l1phase==='spotted'){
      // Dim overlay
      ctx.save();
      ctx.globalAlpha=Math.min(0.35,_l1phaseT*0.4);
      ctx.fillStyle='#8B1A1A';
      ctx.fillRect(0,0,G.W,G.H);
      ctx.restore();
      // Message
      G.art.centeredText(ctx,'Maa Parvati spotted you!',G.W/2,G.H/2-20,30,G.COL.gold);
      G.art.centeredText(ctx,'Returning to start...',G.W/2,G.H/2+24,22,G.COL.cream);
    }

    if(_l1phase==='complete'){
      _l1drawComplete(ctx);
    }
  },

  destroy: function(){
    _l1detachClick();
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  DRAW HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Draw an obstacle (table / pot / stool)
function _l1drawObs(ctx,o,t){
  // Soft oval shadow
  G.art.ovalShadow(ctx,o.x+o.w/2,o.y+o.h,o.w*0.55,8);
  if(o.type==='table'){
    G.art.drawTable(ctx,o.x+o.w/2,o.y+o.h);
  } else if(o.type==='pot'){
    G.art.drawPot(ctx,o.x+o.w/2,o.y+o.h);
  } else if(o.type==='stool'){
    G.art.drawStool(ctx,o.x+o.w/2,o.y+o.h);
  }
}

// Draw Mushak's exit (glowing archway + Mushak)
function _l1drawExit(ctx,t){
  var ex=L1_EXIT.x, ey=L1_EXIT.y;
  // Exit arch glow
  var eGrad=ctx.createRadialGradient(ex,ey,10,ex,ey,55);
  eGrad.addColorStop(0,'rgba(42,171,184,0.45)');
  eGrad.addColorStop(1,'rgba(42,171,184,0)');
  ctx.beginPath(); ctx.arc(ex,ey,55,0,Math.PI*2);
  ctx.fillStyle=eGrad; ctx.fill();
  // Arch
  ctx.beginPath(); ctx.arc(ex,ey,36,Math.PI,0);
  ctx.strokeStyle=G.COL.teal; ctx.lineWidth=5; ctx.stroke();
  // Mushak at exit
  G.art.drawMushak(ctx,ex,ey+10,t,{scale:0.7});
  // Label (only show when all modaks collected)
  if(_l1collected>=5){
    G.art.centeredText(ctx,'Exit!',ex,ey-50,18,G.COL.teal);
  }
}

// Draw speech bubble above (wx,wy) in world-space (already camera-translated)
function _l1drawBubble(ctx,wx,wy,text){
  var lines=text.split('\n');
  var bw=230, lineH=26, bh=lines.length*lineH+20;
  var bx=wx-bw/2, by=wy-bh;
  ctx.fillStyle='rgba(255,255,255,0.92)';
  G.art.roundRect(ctx,bx,by,bw,bh,10,'rgba(255,255,255,0.92)');
  ctx.strokeStyle=G.COL.marigold; ctx.lineWidth=2;
  ctx.strokeRect(bx,by,bw,bh);
  ctx.fillStyle=G.COL.maroon;
  ctx.font='bold 15px -apple-system,sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(var i=0;i<lines.length;i++){
    ctx.fillText(lines[i],wx,by+14+i*lineH);
  }
  // Tail
  ctx.fillStyle='rgba(255,255,255,0.92)';
  ctx.beginPath(); ctx.moveTo(wx-8,by+bh); ctx.lineTo(wx+8,by+bh); ctx.lineTo(wx,by+bh+12);
  ctx.closePath(); ctx.fill();
}

// Draw the HUD (screen-space)
function _l1drawHUD(ctx){
  // Modak counter (top-left)
  ctx.fillStyle='rgba(0,0,0,0.45)';
  G.art.roundRect(ctx,10,10,170,50,8,'rgba(0,0,0,0.45)');
  G.art.centeredText(ctx,'Modaks: '+_l1collected+' / 5',95,36,22,G.COL.cream);

  // If not all collected, show hint to reach exit
  if(_l1collected>=5){
    ctx.save();
    ctx.globalAlpha=0.7+Math.sin(_l1t*3)*0.2;
    G.art.centeredText(ctx,'Reach Mushak\'s exit! →',G.W/2,G.H-36,20,G.COL.teal);
    ctx.restore();
  }

  // Blessing cooldown ring (top-right area, under mute button)
  var bx=G.W-52, by=66;
  // Background circle
  ctx.beginPath(); ctx.arc(bx,by,20,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fill();
  if(_l1blessCooldown>0){
    // Cooldown arc (grey)
    var frac=_l1blessCooldown/L1_BLESS_CD;
    ctx.beginPath(); ctx.arc(bx,by,20,-Math.PI/2,-Math.PI/2+frac*Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=4; ctx.stroke();
    // Ready fraction (gold)
    ctx.beginPath(); ctx.arc(bx,by,20,-Math.PI/2+frac*Math.PI*2,-Math.PI/2+Math.PI*2);
    ctx.strokeStyle=G.COL.gold; ctx.lineWidth=4; ctx.stroke();
  } else {
    // Fully ready — gold fill
    ctx.beginPath(); ctx.arc(bx,by,20,-Math.PI/2,Math.PI*1.5);
    ctx.strokeStyle=G.COL.gold; ctx.lineWidth=4; ctx.stroke();
  }
  // ✨ icon
  ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=G.COL.gold; ctx.fillText('✨',bx,by);

  // Spotted counter (small, top centre)
  if(_l1spotted>0){
    G.art.centeredText(ctx,'Spotted: '+_l1spotted+'×',G.W/2,16,16,'rgba(255,200,100,0.7)');
  }

  // Time (small, top centre-right)
  var secs=Math.floor(_l1t);
  G.art.centeredText(ctx,secs+'s',G.W-100,16,14,'rgba(255,255,255,0.4)');
}

// Level complete overlay
function _l1drawComplete(ctx){
  // Semi-transparent dark panel
  ctx.fillStyle='rgba(20,10,0,0.78)';
  ctx.fillRect(0,0,G.W,G.H);

  var cx=G.W/2, cy=G.H/2;

  G.art.centeredText(ctx,'Modak Mischief Complete!',cx,cy-140,36,G.COL.marigold);

  // Stars
  for(var s=0;s<3;s++){
    var sx=cx-80+s*80;
    var col=s<_l1stars?G.COL.gold:'rgba(255,255,255,0.2)';
    G.art.centeredText(ctx,'★',sx,cy-80,48,col);
  }

  G.art.centeredText(ctx,'Modaks collected: '+_l1collected,cx,cy-20,24,G.COL.cream);
  G.art.centeredText(ctx,'Times spotted: '+_l1spotted,cx,cy+16,24,G.COL.cream);
  G.art.centeredText(ctx,'Blessing Score: '+_l1points,cx,cy+56,28,G.COL.gold);

  // Next button
  _l1nextRect=G.ui.drawButton(ctx,'Next Level →',cx,cy+120,200,56,
    {color:G.COL.saffron,fontSize:24,radius:14});
}
