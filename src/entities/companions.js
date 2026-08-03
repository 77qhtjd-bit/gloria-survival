// Allies that follow, fight and sometimes betray you.
// Moved verbatim from src/main.js (step 3: module split).
import { sfxBackstab, sfxDread, sfxKill } from '../audio.js';
import { QUEST_NAMES, TAUNTS_BETRAY } from '../data/dialogue.js';
import { mkRaider } from './raiders.js';
import { addShake, floatText, sayLine } from '../render/fx.js';
import { S, companions, player, raiders } from '../state.js';
import { isBehind, woundPlayer } from '../systems/combat.js';
import { closeQuest } from '../systems/quest.js';
import { flash } from '../ui.js';
import { solidAt } from '../world/map.js';

// ===== BETRAYAL =====
export function betrayNow(n,when){
  closeQuest();
  S.fear=Math.min(10,S.fear+2);addShake(9);sfxBackstab();
  var nm=(QUEST_NAMES[n.c]||'나그네')+' '+n.name;
  flash('⚠ '+nm+'의 배신! 갑자기 칼을 빼 들고 덮친다 — 여기선 누구도 믿을 수 없다.');
  // turn this NPC into a hostile raider that ambushes, then vanishes
  n.done=true;n.phase='done';
  var rd=mkRaider(n.x,n.y,'jackal');rd.state='alert';rd.betrayerFlee=true;rd.fleeT=4200;
  raiders.push(rd);
  // an immediate strike: a betrayer who catches your back cuts deep (2 wounds)
  if(Math.hypot(n.x-player.x,n.y-player.y)<40){woundPlayer(isBehind(n.x,n.y,player),n.x,n.y,'배신');}
}

// ===== COMPANIONS =====
export function recruitCompanion(n){
  // Half of all companions are secretly untrustworthy. In a place with no rules, even a
  // friend fighting at your side may turn — and the WAIT is the point: some flip almost at
  // once, others fight loyally for a long while first, so you can never tell which is which.
  var willBetray = Math.random()<0.5;
  var soon = Math.random()<0.35;                       // a third of traitors turn quickly
  var delay = soon ? (5000 + Math.random()*5000)       // 5–10s: the quick knife
                   : (16000 + Math.random()*24000);    // 16–40s: the one you came to trust
  var ckey = n.c || n.key || 'archer';   // quest-givers use .c, story NPCs use .key
  companions.push({x:player.x-20,y:player.y,c:ckey,name:n.name||'',facing:'down',walk:0,
    atkCd:0,target:null,bob:Math.random()*6,hp:2,
    traitor:willBetray, betrayAt: performance.now() + delay});
  S.allies++;
  if(n) {n.done=true;}
}

// companions trail behind the player and slay raiders that wander too close
export function updateCompanions(dt){
  var now=performance.now();
  for(var ci=companions.length-1;ci>=0;ci--){var co=companions[ci];
    // ---- DELAYED BETRAYAL: a traitor companion suddenly turns on you ----
    if(co.traitor && now>=co.betrayAt && !co.warned){
      // brief tell just before the strike, so it reads as a betrayal not a bug
      co.warned=true; co.betrayAt=now+900;
      floatText(co.x,co.y-30,'…?','#e8c060'); sfxDread();
    } else if(co.traitor && co.warned && now>=co.betrayAt){
      var nm=(QUEST_NAMES[co.c]||'나그네')+' '+co.name;
      companions.splice(ci,1); S.allies=Math.max(0,S.allies-1); S.betrayed++;
      S.fear=Math.min(10,S.fear+2); addShake(10); sfxBackstab();
      var rd=mkRaider(co.x,co.y,'jackal'); rd.state='alert'; rd.fromAlly=true;
      sayLine(rd, TAUNTS_BETRAY, 1);   // always taunt when betraying
      raiders.push(rd);
      flash('⚠ '+nm+'의 배신! 함께 싸우던 동료가 갑자기 너에게 칼을 겨눈다 — 여기선 누구도 믿을 수 없다.');
      continue;
    }
    // find nearest live raider in range
    var best=null,bd=130;
    for(var ri=0;ri<raiders.length;ri++){var rd=raiders[ri];if(rd.dead)continue;var dd=Math.hypot(rd.x-co.x,rd.y-co.y);if(dd<bd){bd=dd;best=rd;}}
    var tx,ty;
    if(best){tx=best.x;ty=best.y;}
    else{ // follow the player, trailing slightly
      var ox=player.x-(28+ci*22), oy=player.y+(ci%2?18:-18);tx=ox;ty=oy;
    }
    var dx=tx-co.x,dy=ty-co.y,dl=Math.hypot(dx,dy)||1;
    var spd=best?2.6:2.3;
    if(dl>(best?20:6)){var nx=co.x+dx/dl*spd,ny=co.y+dy/dl*spd;if(!solidAt(nx,co.y))co.x=nx;if(!solidAt(co.x,ny))co.y=ny;co.walk+=0.3;
      co.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
    else co.walk=0;
    co.atkCd-=dt;
    // strike a raider it's adjacent to (backstab-style instant kill)
    if(best&&bd<26&&co.atkCd<=0){co.atkCd=700;
      best.dead=true;best.deadT=620;S.killed++;sfxKill();addShake(4);
      floatText(best.x,best.y-28,'동료가 도왔다','#9affc0');
      raiders.forEach(function(o){if(!o.dead&&Math.hypot(o.x-best.x,o.y-best.y)<120){o.state='alert';}});
    }
  }
}
