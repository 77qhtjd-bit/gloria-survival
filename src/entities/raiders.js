// Hostile raiders.
// Moved verbatim from src/main.js (step 3: module split).
import { sfxBackstab, sfxKill } from '../audio.js';
import { VH, VW } from '../data/balance.js';
import { RTYPE, rollType } from '../data/enemies.js';
import { addShake, floatText, roundRect } from '../render/fx.js';
import { C, drawTrainer } from '../render/trainer.js';
import { G, S, cam, ctx, player, raiders } from '../state.js';
import { facingVec } from '../systems/combat.js';
import { render } from '../ui.js';
import { freeTile } from '../world/map.js';

export function spawnRaiders(n){raiders.length=0;for(var i=0;i<n;i++)addRaider();}

export function mkRaider(x,y,tk){var T=RTYPE[tk];return {x:x,y:y,dir:Math.random()*6.28,wander:0,
  type:tk,hurt:0,dead:false,deadT:0,facing:'down',walk:0,
  state:'idle',
  atkCd:0,lungeT:0,windup:0,bob:Math.random()*6};}

function addRaider(type){var f=freeTile();if(Math.hypot(f.x-player.x,f.y-player.y)<240){f=freeTile();}raiders.push(mkRaider(f.x,f.y,type||rollType(S.day)));}

export function addRaiderAt(x,y,type){raiders.push(mkRaider(x,y,type||rollType(S.day)));}

// PACING: day 1 is pure peaceful foraging. A few enemies trickle in on day 2.
//         From day 3 the field descends into chaos.
function desiredRaiders(){
  if(S.day<=3)return 0;                        // day 1-3: total peace — farm, build, make friends
  var d=S.day-3;                               // day4 -> d=1
  var base=4 + Math.floor(d*2.0) + Math.floor(S.killed*0.18);
  return Math.min(24, base);}                  // "war of all against all" — pressure ramps from day 4

export function adjustRaiders(){var want=desiredRaiders();
  while(raiders.length<want)addRaider();
  if(raiders.length>want){
    // never cull traitor-spawned or already-alerted raiders — only trim idle extras, furthest first
    raiders.sort(function(a,b){return Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y);});
    for(var i=0;i<raiders.length&&raiders.length>want;){
      if(raiders[i].fromAlly||raiders[i].state==='alert'){i++;continue;}
      raiders.splice(i,1);
    }
  }
  var th=document.getElementById('threat');if(th)th.style.display=(S.fear>=6)?'block':'none';}

export function drawRaiders(){var now=performance.now();raiders.forEach(function(rd){var sx=rd.x-cam.x,sy=rd.y-cam.y;if(sx<-60||sy<-60||sx>VW+60||sy>VH+60)return;
  var T=RTYPE[rd.type]||RTYPE.prowler;var col=C[T.col]||C.raider;var sz=T.size;
  if(rd.dead){ // death: fade + topple
    var p=Math.max(0,rd.deadT)/620;ctx.save();ctx.globalAlpha=p*0.9;ctx.translate(sx,sy);ctx.rotate((1-p)*0.9);ctx.translate(-sx,-sy);
    drawTrainer(rd.x,rd.y,sz,col,'down',0);ctx.restore();
    ctx.save();ctx.globalAlpha=p;ctx.fillStyle='#b88ad8';ctx.strokeStyle='#180814';ctx.lineWidth=2;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.strokeText('✕',sx,sy-30-(1-p)*14);ctx.fillText('✕',sx,sy-30-(1-p)*14);ctx.restore();return;}
  var d=Math.hypot(rd.x-player.x,rd.y-player.y);
  // alert ring (they've seen you) — lunging flashes brighter
  if(rd.state==='alert'){var lung=rd.lungeT>0;var aggCol=rd.type==='lurker'?'200,30,140':rd.type==='jackal'?'220,60,170':'200,40,110';
    var a=(lung?0.55:0.22)+0.25*(0.5+0.5*Math.sin(now/130));ctx.strokeStyle='rgba('+aggCol+','+a+')';ctx.lineWidth=lung?3:2;ctx.beginPath();ctx.arc(sx,sy-12,24*sz/2,0,6.28);ctx.stroke();}
  // lunge motion trail
  if(rd.lungeT>0){ctx.save();ctx.globalAlpha=0.3;var tf=facingVec(rd.facing||'down');drawTrainer(rd.x-tf[0]*12,rd.y-tf[1]*12,sz,col,rd.facing||'down',rd.walk);ctx.restore();}
  drawTrainer(rd.x,rd.y,sz,col,rd.facing||'down',rd.walk);
  // back-vulnerability cue: a faint pale notch on the enemy's BACK side
  var bf=facingVec(rd.facing||'down');var bx=sx-bf[0]*13*sz/2, byk=sy-12-bf[1]*13*sz/2;
  ctx.fillStyle='rgba(230,200,255,0.5)';ctx.beginPath();ctx.arc(bx,byk,2.4,0,6.28);ctx.fill();
  // hit flash
  if(rd.hurt>0){ctx.save();ctx.globalAlpha=Math.min(0.7,rd.hurt/220*0.7);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,sy-12,16*sz/2,0,6.28);ctx.fill();ctx.restore();}
  // WIND-UP TELL: a bright warning so a sharp player can read the lunge and dodge
  if(rd.windup>0){var wp=0.5+0.5*Math.sin(now/60);ctx.save();ctx.globalAlpha=0.6+0.4*wp;
    ctx.fillStyle='#fff2a0';ctx.strokeStyle='#a02020';ctx.lineWidth=3;ctx.font='bold 20px "Courier New",monospace';ctx.textAlign='center';
    ctx.strokeText('!',sx,sy-34-sz*4);ctx.fillText('!',sx,sy-34-sz*4);ctx.restore();}
  // type mark
  ctx.fillStyle=rd.type==='lurker'?'#e840c0':rd.type==='jackal'?'#e87ad0':'#e85090';ctx.strokeStyle='#180814';ctx.lineWidth=2.5;ctx.font='bold 13px monospace';ctx.textAlign='center';
  var by=sy-30-sz*5+Math.sin(now/300+rd.bob)*1.5;ctx.strokeText(T.mark,sx,by);ctx.fillText(T.mark,sx,by);
  // ---- speech bubble: the raider gloating about a world with no rules ----
  if(rd.say){
    rd.sayT-=(now-(rd._lastSay||now)); rd._lastSay=now;
    if(rd.sayT<=0){rd.say=null;}
    else{
      ctx.save();
      ctx.font='bold 11px "Noto Sans KR","Malgun Gothic",sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      var tw=ctx.measureText(rd.say).width, bw=tw+20, bh=22;
      var bx=sx, byb=by-24;                  // byb = bottom edge of the bubble body
      var cyText=byb-bh/2;                    // vertical centre of the bubble
      var fade=Math.min(1, rd.sayT/400); ctx.globalAlpha=fade;
      // bubble body
      ctx.fillStyle='#fff8ec';ctx.strokeStyle='#c0304a';ctx.lineWidth=1.6;
      roundRect(bx-bw/2, byb-bh, bw, bh, 7);ctx.fill();ctx.stroke();
      // little tail
      ctx.beginPath();ctx.moveTo(bx-4,byb-1);ctx.lineTo(bx+4,byb-1);ctx.lineTo(bx,byb+5);ctx.closePath();
      ctx.fillStyle='#fff8ec';ctx.fill();
      // text — centred both ways so it never spills out of the bubble
      ctx.fillStyle='#a01028';ctx.fillText(rd.say, bx, cyText);
      ctx.restore();
    }
  } else { rd._lastSay=now; }
});}

export function killRaider(rd,back){
  rd.dead=true;rd.deadT=620;S.killed++;
  if(back){sfxBackstab();addShake(7);G.hitStop=70;floatText(rd.x,rd.y-30,'뒤에서 한 방!','#e8c0ff');}
  else{sfxKill();addShake(6);G.hitStop=45;floatText(rd.x,rd.y-30,(RTYPE[rd.type]||RTYPE.prowler).name+' 처치','#d8b0ff');}
  // BRUTISH escalation: each body draws more — and may immediately call a nearby ally to alert
  raiders.forEach(function(o){if(!o.dead&&Math.hypot(o.x-rd.x,o.y-rd.y)<140){o.state='alert';o.wander=0;}});
  render();
}
