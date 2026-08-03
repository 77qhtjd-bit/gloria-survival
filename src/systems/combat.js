// Melee, dashing, wounds and death.
// Moved verbatim from src/main.js (step 3: module split).
import { actx, sfxDash, sfxHit, sfxHurt, sfxWhiff } from '../audio.js';
import { MAXHP, MH, MW } from '../data/balance.js';
import { killRaider } from '../entities/raiders.js';
import { dragTarget, joyVec, keys } from '../input.js';
import { addShake, floatText } from '../render/fx.js';
import { S, armorCount, breakArmor, curWeapon, player, raiders } from '../state.js';
import { endGame, flash, render } from '../ui.js';
import { solidAt } from '../world/map.js';

export function tryMove(nx,ny){var r=10;if(!solidAt(nx,player.y))player.x=Math.max(r,Math.min(MW-r,nx));if(!solidAt(player.x,ny))player.y=Math.max(r,Math.min(MH-r,ny));}

export function facingVec(f){if(f==='up')return[0,-1];if(f==='down')return[0,1];if(f==='left')return[-1,0];return[1,0];}

// is the attacker behind the target? (target's back is opposite its facing)
export function isBehind(attackerX,attackerY,target){
  var tf=facingVec(target.facing||'down');
  var vx=attackerX-target.x, vy=attackerY-target.y; var vl=Math.hypot(vx,vy)||1; vx/=vl; vy/=vl;
  // dot of (attacker-from-target) with target's facing < 0 means attacker is on the back side
  return (vx*tf[0]+vy*tf[1])<-0.25;
}

// ---- player takes a hit: wounds escalate; a backstab on YOU is instant death ----
export function woundPlayer(byBackstab,srcx,srcy,cause){
  if(player.inv>0||player.dashT>0)return; // i-frames (dodging slips the blade)
  // ARMOR: a worn piece takes the blow and shatters (even saves you from a backstab, once)
  if(armorCount()>0){var piece=breakArmor();player.inv=1100;player.hurt=240;S.fear=Math.min(10,S.fear+1);
    sfxHurt();addShake(9);
    var pn={helm:'투구',chest:'흉갑',arms:'팔보호대',legs:'각반'}[piece]||'갑옷';
    floatText(player.x,player.y-28,pn+' 파괴!','#cfd4da');
    flash('「'+pn+'」이(가) 칼을 막고 부서졌다! 목숨을 건졌다.');
    if(srcx!==undefined){var d2=Math.hypot(player.x-srcx,player.y-srcy)||1;player.x+=(player.x-srcx)/d2*24;player.y+=(player.y-srcy)/d2*24;}
    render();return;}
  // BACKSTAB is dangerous but no longer an instant kill — a hit from behind deals
  // TWO wounds, so two backstabs (or a backstab + a couple of face-hits) will drop you.
  // This lets kids feel the danger of the "state of nature" without a single-frame death.
  if(byBackstab){
    S.wounds+=2;player.inv=1200;player.hurt=340;S.fear=Math.min(10,S.fear+2);
    sfxHurt();addShake(12);floatText(player.x,player.y-28,'등 뒤 기습!','#ff3a5a');
    if(srcx!==undefined){var db=Math.hypot(player.x-srcx,player.y-srcy)||1;player.x+=(player.x-srcx)/db*30;player.y+=(player.y-srcy)/db*30;}
    if(S.wounds>=MAXHP){killPlayer(cause||'기습');}
    else flash('등 뒤에서 기습당했다! 깊은 상처를 입었다. — 한 번 더 뒤를 잡히면 위험해!');
    render();return;
  }
  S.wounds++;player.inv=1200;player.hurt=300;S.fear=Math.min(10,S.fear+2);
  sfxHurt();addShake(8);floatText(player.x,player.y-28,'베였다!','#ff5a7a');
  if(srcx!==undefined){var d=Math.hypot(player.x-srcx,player.y-srcy)||1;player.x+=(player.x-srcx)/d*26;player.y+=(player.y-srcy)/d*26;}
  if(S.wounds>=MAXHP){killPlayer(cause||'사람');}
  else flash(S.wounds===1?'칼에 베였다! (상처 +1)':'깊이 베였다. 다리가 무거워진다. (깊은 상처)');
  render();
}

export function killPlayer(cause){if(S.over)return;endGame(cause);}

// ===== player wooden-sword swing =====
export function doAttack(){if(S.mode!=='field'||S.over)return;if(player.atkCool>0)return;
  actx();
  var W=curWeapon();
  player.atk=1;player.atkCool=W.cd;
  var fv=facingVec(player.facing), baseAng=Math.atan2(fv[1],fv[0]);
  var hitAny=false;
  for(var i=0;i<raiders.length;i++){var rd=raiders[i];if(rd.dead)continue;
    var dxr=rd.x-player.x, dyr=rd.y-player.y, d=Math.hypot(dxr,dyr);
    if(d>W.reach)continue;
    // within the swing arc?
    var ang=Math.atan2(dyr,dxr), da=Math.abs(((ang-baseAng+Math.PI)%(2*Math.PI))-Math.PI);
    if(da>W.arc)continue;
    hitAny=true;
    var back=isBehind(player.x,player.y,rd);
    var kb=d||1;rd.x+=dxr/kb*9;rd.y+=dyr/kb*9;
    if(back){ killRaider(rd,true); }                       // backstab kills with anything (even bare hands)
    else if(player.weapon==='fist'){                       // bare-handed frontal: can't kill, only shove & stun
      rd.hurt=200;rd.x+=dxr/kb*16;rd.y+=dyr/kb*16;rd.windup=0;rd.lungeT=0;rd.atkCd=Math.max(rd.atkCd,600);
      sfxHit();addShake(2);floatText(rd.x,rd.y-22,'밀치기','#cfd4da');
    } else { killRaider(rd,false); }                       // armed frontal kill
  }
  if(!hitAny){sfxWhiff();}
}

// ---- dash / dodge (the only way to survive frontal odds) ----
export function doDash(){if(S.mode!=='field'||S.over)return;if(player.dashCd>0)return;
  var fv=facingVec(player.facing);
  // dash toward current movement if any, else facing
  var mx=0,my=0;
  if(keys['w']||keys['arrowup'])my-=1;if(keys['s']||keys['arrowdown'])my+=1;
  if(keys['a']||keys['arrowleft'])mx-=1;if(keys['d']||keys['arrowright'])mx+=1;
  if(joyVec.active&&(joyVec.x||joyVec.y)){mx=joyVec.x;my=joyVec.y;}
  if(dragTarget){var ddx=dragTarget.x-player.x,ddy=dragTarget.y-player.y,dl=Math.hypot(ddx,ddy);if(dl>4){mx=ddx/dl;my=ddy/dl;}}
  if(mx===0&&my===0){mx=fv[0];my=fv[1];}
  var ml=Math.hypot(mx,my)||1;player.dvx=mx/ml;player.dvy=my/ml;
  player.dashT=190;player.dashCd=520;player.inv=Math.max(player.inv,340);
  sfxDash();floatText(player.x,player.y-24,'회피!','#b0e0ff');
}
