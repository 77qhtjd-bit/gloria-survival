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
  // ===== THREE KINDS OF COMPANION — the whole lesson lives here =====
  //   ① 충직한 동료        : walks with you, fights beside you, never turns.
  //   ② 수락 순간 배신자   : stabs you the moment you agree/hand in (handled in betrayNow).
  //   ③ 같이 다니다 배신   : THIS path — travels at your side, earns your trust, then
  //                          stabs you and runs away. Timed short enough (5–16s of real
  //                          companionship) that every student actually lives through it.
  var willBetray = Math.random()<0.7;                  // ③ is the common case
  var delay = 5000 + Math.random()*11000;              // 5–16s of loyal company first
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
      var bx=co.x, by=co.y;
      companions.splice(ci,1); S.allies=Math.max(0,S.allies-1); S.betrayed++;
      S.fear=Math.min(10,S.fear+2); addShake(12); sfxBackstab();
      // THE STAB: a companion who has been walking beside you is, by definition, close —
      // so the betrayal actually lands a hit (deeper if they caught your back), and only
      // THEN do they bolt. This is the lesson: a promise nobody can enforce is worth nothing.
      var dist=Math.hypot(bx-player.x, by-player.y);
      var hit=false;
      if(dist<64){ woundPlayer(isBehind(bx,by,player), bx, by, '배신'); hit=true; }
      // they flee after the strike instead of standing and fighting
      var rd=mkRaider(bx,by,'jackal'); rd.state='alert'; rd.fromAlly=true;
      rd.betrayerFlee=true; rd.fleeT=5200;      // run away for ~5s
      sayLine(rd, TAUNTS_BETRAY, 1);
      raiders.push(rd);
      flash('⚠ '+nm+'의 배신! '+(hit?'곁에 있던 동료가 칼을 꽂고 달아난다':'동료가 등을 돌리고 달아난다')+' — 여기선 누구도 믿을 수 없다.');
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
    // Companions HELP, they don't win the fight for you: two hits to put a raider down,
    // with a slow swing, so the player still has to do the real work.
    if(best&&bd<26&&co.atkCd<=0){co.atkCd=1100;
      best.hp=(best.hp===undefined?2:best.hp)-1;
      best.hurt=200; addShake(2);
      if(best.hp<=0){
        best.dead=true;best.deadT=620;S.killed++;sfxKill();addShake(4);
        floatText(best.x,best.y-28,'동료가 도왔다','#9affc0');
      } else {
        floatText(best.x,best.y-24,'퍽!','#cfe0ff');
      }
      raiders.forEach(function(o){if(!o.dead&&Math.hypot(o.x-best.x,o.y-best.y)<120){o.state='alert';}});
    }
  }
}
