// Keyboard and touch joystick input.
// Moved verbatim from src/main.js (step 3: module split).
import { VH, VW } from './data/balance.js';
import { G, S, cv, player } from './state.js';
import { advanceBattle, chooseCommand } from './systems/battle.js';
import { nearNeighbor } from './entities/neighbors.js';
import { doAttack, doDash } from './systems/combat.js';

export var keys={};

// Touch controls were removed — this is a keyboard/mouse build. joyVec stays as a harmless
// zero vector so the movement code that reads it keeps working unchanged.
export var joyVec={x:0,y:0,active:false};


export function pos(e){var r=cv.getBoundingClientRect();var tt=e.touches?e.touches[0]:e;return {x:(tt.clientX-r.left)*(VW/r.width),y:(tt.clientY-r.top)*(VH/r.height)};}

export var dragging=false,dragTarget=null,downPt=null,downTime=0,moved=0;

export function battlePoint(p){if(S.mode==='battle'&&G.battle){
  if(G.battle.phase==='intro'||G.battle.phase==='msg'){advanceBattle();return;}
  if(G.battle.phase==='menu'){
    // must match drawBattle's menu layout exactly: by=H-150, oy=by+40, rh=26
    var by=VH-150, oy=by+40, rh=26;
    for(var i=0;i<G.battle.choices.length;i++){var cy=oy+i*rh;
      if(p.y>=cy-4&&p.y<=cy+rh-2){G.battle.cursor=i;chooseCommand(i);return;}}
    // tap anywhere below the last option (near the box bottom) selects the highlighted one
  }
}}

window.__refreshTouchUI = function(){};

window.addEventListener('keydown',function(e){var k=e.key.toLowerCase();
  if(S.mode==='battle'){if(G.battle&&G.battle.phase==='menu'){if(k==='arrowup'||k==='w'){G.battle.cursor=(G.battle.cursor+G.battle.choices.length-1)%G.battle.choices.length;e.preventDefault();}else if(k==='arrowdown'||k==='s'){G.battle.cursor=(G.battle.cursor+1)%G.battle.choices.length;e.preventDefault();}else if(k==='enter'||k===' '||k==='z'){chooseCommand(G.battle.cursor);e.preventDefault();}}else if(G.battle&&(G.battle.phase==='intro'||G.battle.phase==='msg')){if(k==='enter'||k===' '||k==='z'){advanceBattle();e.preventDefault();}}return;}
  if(S.mode!=='field')return;
  if(k===' '||k==='enter'){
    // SPACE talks to a nearby villager (or turns in a finished quest); otherwise it attacks.
    if(nearNeighbor()){ G.wantInteract=true; } else { doAttack(); }
    e.preventDefault();return;
  }
  if(k==='j'||k==='z'){doAttack();e.preventDefault();return;}
  if(k==='shift'||k==='k'){doDash();e.preventDefault();return;}
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].indexOf(k)>=0){keys[k]=true;e.preventDefault();}});
window.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});

// --- MOUSE: left click = swing only, never moves the player ---
cv.addEventListener('mousedown',function(e){var p=pos(e);
  if(S.mode==='field'){if(e.button===0)doAttack();return;}
  battlePoint(p);});
// --- TOUCH: drag to move, quick tap = swing ---
// --- TOUCH on canvas: in FIELD, joystick/buttons handle everything, so canvas tap does nothing.
//     in BATTLE, a tap advances/selects. ---
cv.addEventListener('touchstart',function(e){var p=pos(e);if(S.mode!=='field'){battlePoint(p);}e.preventDefault();},{passive:false});
cv.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
cv.addEventListener('touchend',function(e){dragging=false;dragTarget=null;downPt=null;});
