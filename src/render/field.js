// Per-frame composition of the field and battle views.
// Moved verbatim from src/main.js (step 3: module split).
import { DAY_MS, MAXHP, VH, VW } from '../data/balance.js';
import { drawCritters } from '../entities/critters.js';
import { drawArmorDrops, drawResources, drawWeapons } from '../entities/drops.js';
import { drawFood } from '../entities/food.js';
import { drawRaiders } from '../entities/raiders.js';
import { dayBanner, floaters, panelBox, pixelText, roundRect, wrapText } from './fx.js';
import { drawMap } from './tiles.js';
import { C, drawHPBar, drawPlayerWithSword, drawTrainer, drawTrainerStatic } from './trainer.js';
import { G, S, cam, companions, ctx, neighbors, player, structures } from '../state.js';
import { questHint, questProgress } from '../systems/quest.js';
import { cleanMsg } from '../ui.js';

var MOTIVE_COLOR={경쟁:'#c0392b',불신:'#2a6fb0',명예:'#b8860b',화친:'#0f8f5f',굴복:'#888',질서:'#6a4fc0'};

// ===== draw built structures (shelter / campfire) =====
function drawStructures(){var now=performance.now();structures.forEach(function(s){var sx=s.x-cam.x,sy=s.y-cam.y;if(sx<-60||sy<-60||sx>VW+60||sy>VH+60)return;
  if(s.kind==='shelter'){
    // safe-zone glow
    ctx.save();ctx.globalAlpha=0.10+0.03*Math.sin(now/700);ctx.fillStyle='#9affc0';ctx.beginPath();ctx.arc(sx,sy,58,0,6.3);ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(sx,sy+14,20,5,0,0,6.3);ctx.fill();
    // little hut: walls + roof
    ctx.fillStyle='#7a5330';ctx.fillRect(sx-15,sy-4,30,18);
    ctx.fillStyle='#5f3f22';ctx.fillRect(sx-15,sy-4,30,3);
    ctx.fillStyle='#8a5e36';ctx.beginPath();ctx.moveTo(sx-19,sy-4);ctx.lineTo(sx,sy-20);ctx.lineTo(sx+19,sy-4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#6b4a2a';ctx.beginPath();ctx.moveTo(sx-19,sy-4);ctx.lineTo(sx,sy-20);ctx.lineTo(sx-2,sy-20);ctx.lineTo(sx-19,sy-2);ctx.closePath();ctx.fill();
    ctx.fillStyle='#2a1c12';ctx.fillRect(sx-5,sy+3,10,11); // doorway
  } else { // campfire
    ctx.save();ctx.globalAlpha=0.12+0.05*Math.sin(now/300);ctx.fillStyle='#ffb060';ctx.beginPath();ctx.arc(sx,sy,44,0,6.3);ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(sx,sy+8,12,3.5,0,0,6.3);ctx.fill();
    // logs
    ctx.strokeStyle='#6b4a2a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx-8,sy+6);ctx.lineTo(sx+8,sy+2);ctx.moveTo(sx-8,sy+2);ctx.lineTo(sx+8,sy+6);ctx.stroke();
    // flame
    var fl=Math.sin(now/120)*1.5;
    ctx.fillStyle='#ff7a2a';ctx.beginPath();ctx.moveTo(sx-5,sy+2);ctx.quadraticCurveTo(sx-2,sy-8-fl,sx,sy-12-fl);ctx.quadraticCurveTo(sx+2,sy-8+fl,sx+5,sy+2);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffd24a';ctx.beginPath();ctx.moveTo(sx-2.5,sy+1);ctx.quadraticCurveTo(sx,sy-6-fl,sx+2.5,sy+1);ctx.closePath();ctx.fill();
  }});}

export function drawField(){G.calmDay=Math.max(0,Math.min(1,1-((S.day-1)+Math.min(1,G.dayTimer/DAY_MS)-2.5)*0.5));drawMap();
  drawStructures();
  drawResources();
  drawFood();
  drawCritters();
  drawWeapons();
  drawArmorDrops();
  neighbors.forEach(function(n){if(n.done)return;var sx=n.x-cam.x,sy=n.y-cam.y;if(sx<-50||sy<-50||sx>VW+50||sy>VH+50)return;
    var col = (n.kind==='quest') ? (C[n.c]||C.farmer) : C[STORIES[n.key].c];
    drawTrainer(n.x,n.y,2.0,col,'down',0);
    // marker: quest-giver shows ? (or ! when their quest is ready to turn in); wanderer shows !
    var pulse=0.5+0.5*Math.sin(performance.now()/300);
    var mark, mcol;
    if(n.kind==='quest'){
      var ready = n.phase==='active' && n.quest && questProgress(n.quest);
      mark = ready?'!':'?'; mcol = ready?'#9affa0':'#c79be8';
    } else { mark='!'; mcol='#f5e9c8'; }
    ctx.save();ctx.globalAlpha=0.55+pulse*0.45;ctx.fillStyle=mcol;ctx.strokeStyle='#1a1410';ctx.lineWidth=3.5;ctx.font='bold 18px "Courier New",monospace';ctx.textAlign='center';
    var fy=sy-40-pulse*3;ctx.strokeText(mark,sx,fy);ctx.fillText(mark,sx,fy);ctx.restore();
    // when the player is close enough to interact, show a "press SPACE" prompt
    var nd=Math.hypot(player.x-n.x,player.y-n.y);
    var nready=(n.kind==='quest'&&n.phase==='active'&&n.quest&&questProgress(n.quest));
    if(nd < (nready?56:48)){
      var lbl = nready ? 'Space: 선물 받기' : (n.kind==='quest'&&n.phase==='active' ? 'Space: 대화' : 'Space: 말 걸기');
      ctx.save();ctx.font='bold 11px "Noto Sans KR","Malgun Gothic",sans-serif';ctx.textAlign='center';
      var lw=ctx.measureText(lbl).width, bw=lw+16;
      var byb=sy-54;
      ctx.fillStyle='rgba(20,12,32,0.9)';ctx.strokeStyle=nready?'#9affa0':'#f0d24a';ctx.lineWidth=1.4;
      roundRect(sx-bw/2, byb-16, bw, 20, 6);ctx.fill();ctx.stroke();
      ctx.fillStyle=nready?'#9affa0':'#f4e28c';ctx.textBaseline='middle';ctx.fillText(lbl, sx, byb-6);
      ctx.restore();
    }});
  // quest destination marker (reach quests)
  if(G.questMarker){var qsx=G.questMarker.x-cam.x,qsy=G.questMarker.y-cam.y;var qp=0.5+0.5*Math.sin(performance.now()/250);
    ctx.save();ctx.globalAlpha=0.5+qp*0.5;ctx.strokeStyle='#9affa0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(qsx,qsy,16+qp*4,0,6.28);ctx.stroke();
    ctx.fillStyle='#9affa0';ctx.font='bold 16px "Courier New",monospace';ctx.textAlign='center';ctx.fillText('◆',qsx,qsy-22);ctx.restore();}
  // companions
  companions.forEach(function(co){var sx=co.x-cam.x,sy=co.y-cam.y;if(sx<-50||sy<-50||sx>VW+50||sy>VH+50)return;
    drawTrainer(co.x,co.y,2.0,C[co.c]||C.archer,co.facing,co.walk);
    if(co.warned){ // about to betray — flash red warning
      ctx.save();ctx.globalAlpha=0.45+0.45*Math.sin(performance.now()/90);ctx.strokeStyle='#ff4a6a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(sx,sy-12,19,0,6.28);ctx.stroke();ctx.restore();
      ctx.fillStyle='#ff5a7a';ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText('!',sx,sy-34);
    } else {
      // friendly halo
      ctx.save();ctx.globalAlpha=0.3+0.2*Math.sin(performance.now()/400+co.bob);ctx.strokeStyle='#7affb0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy-12,18,0,6.28);ctx.stroke();ctx.restore();
      ctx.fillStyle='#7affb0';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText('♥',sx,sy-34);
    }});
  drawRaiders();
  drawPlayerWithSword();

  // floating combat numbers / kill text
  for(var ff=0;ff<floaters.length;ff++){var F=floaters[ff];var fsx=F.x-cam.x,fsy=F.y-cam.y;var fa=Math.min(1,F.t/900);
    ctx.save();ctx.globalAlpha=fa;ctx.textAlign='center';ctx.font='bold 13px "Courier New",monospace';
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillText(F.txt,fsx+1,fsy+1);ctx.fillStyle=F.col;ctx.fillText(F.txt,fsx,fsy);ctx.restore();}

  // ===== ATMOSPHERE LAYERS — driven by `darkness` (0 bright noon → 1 night) =====
  var now=performance.now();var D=G.darkness;
  var calm=(S.day<=2)?1:0;                      // peaceful days 1-2: bright, sunny, alive
  // 1) drifting clouds/haze (gentle on calm days)
  ctx.save();ctx.fillStyle=calm?'#f0e6fa':'#c4b6d6';
  for(var fi=0;fi<3;fi++){var fy=((now/ (70+fi*30))+fi*200)%(VH+220)-110;ctx.globalAlpha=(0.03+0.02*Math.sin(now/2000+fi))*(calm?0.45:(0.4+D));ctx.beginPath();ctx.ellipse(VW*0.5+Math.sin(now/4000+fi)*140,fy,VW*0.8,38,0,0,6.3);ctx.fill();}
  ctx.restore();
  if(calm){
    // bright sunny daylight — a GENTLE lift (too strong here was washing the ground to white)
    var lift=ctx.createLinearGradient(0,0,0,VH);
    lift.addColorStop(0,'rgba(255,250,225,0.10)');lift.addColorStop(0.5,'rgba(244,236,255,0.06)');lift.addColorStop(1,'rgba(228,238,248,0.05)');
    ctx.fillStyle=lift;ctx.fillRect(0,0,VW,VH);
    // soft warm sunlight from the top corner
    var sun=ctx.createRadialGradient(VW*0.7,-40,40,VW*0.7,-40,VH*1.1);
    sun.addColorStop(0,'rgba(255,242,200,0.10)');sun.addColorStop(0.5,'rgba(255,238,205,0.03)');sun.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sun;ctx.fillRect(0,0,VW,VH);
    // gentle vignette gives the field depth so it never looks like a blank sheet
    var cv2=ctx.createRadialGradient(VW/2,VH/2,VH*0.32,VW/2,VH/2,VW*0.72);
    cv2.addColorStop(0,'rgba(0,0,0,0)');cv2.addColorStop(1,'rgba(70,55,95,0.16)');
    ctx.fillStyle=cv2;ctx.fillRect(0,0,VW,VH);
    // drifting golden motes / pollen in the sunlight
    ctx.save();ctx.fillStyle='rgba(255,250,215,0.8)';
    for(var gi=0;gi<7;gi++){var gx2=(now/35+gi*170)%(VW+80)-40, gy2=44+gi*48+Math.sin(now/800+gi)*22;ctx.globalAlpha=0.4+0.3*Math.sin(now/600+gi);ctx.beginPath();ctx.arc(gx2,gy2,1.8,0,6.3);ctx.fill();}
    ctx.restore();
  } else {
  // 2) color grade: bright lilac daylight → deep violet night, interpolated by D
  var topR=Math.round(236-150*D),topG=Math.round(216-160*D),topB=Math.round(248-150*D),topA=(0.05+0.30*D).toFixed(3);
  var botA=(0.06+0.46*D).toFixed(3);
  var grade=ctx.createLinearGradient(0,0,0,VH);
  grade.addColorStop(0,'rgba('+topR+','+topG+','+topB+','+topA+')');
  grade.addColorStop(0.55,'rgba(44,30,58,'+(0.05+0.16*D).toFixed(3)+')');
  grade.addColorStop(1,'rgba(18,10,30,'+botA+')');
  ctx.fillStyle=grade;ctx.fillRect(0,0,VW,VH);
  // 3) overall darkness wash (violet)
  if(D>0.02){ctx.fillStyle='rgba(16,8,28,'+(D*0.5).toFixed(3)+')';ctx.fillRect(0,0,VW,VH);}
  // 4) the lone individual's light — warm magenta torch
  var px=player.x-cam.x,py=player.y-cam.y-14;
  var inner=30, outer=300-150*D;
  var light=ctx.createRadialGradient(px,py,inner,px,py,outer);
  light.addColorStop(0,'rgba(240,190,255,'+(0.06+0.18*D).toFixed(3)+')');
  light.addColorStop(0.45,'rgba(210,150,240,'+(0.02+0.06*D).toFixed(3)+')');
  light.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=light;ctx.fillRect(0,0,VW,VH);
  // 5) vignette — the dark closes in as days pass
  var vig=ctx.createRadialGradient(px,py,80,VW/2,VH/2,VW*0.62);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(0.7,'rgba(10,5,18,'+(0.08+0.22*D).toFixed(3)+')');vig.addColorStop(1,'rgba(7,3,14,'+(0.30+0.55*D).toFixed(3)+')');
  ctx.fillStyle=vig;ctx.fillRect(0,0,VW,VH);
  // 6) dread: as fear rises (enemies near / wounded), a magenta pulse creeps from the edges
  if(S.fear>=4){var dread=(0.06+S.fear*0.012)+0.05*Math.sin(now/420);var rv=ctx.createRadialGradient(VW/2,VH/2,VW*0.30,VW/2,VH/2,VW*0.66);
    rv.addColorStop(0,'rgba(0,0,0,0)');rv.addColorStop(1,'rgba(150,20,110,'+dread+')');ctx.fillStyle=rv;ctx.fillRect(0,0,VW,VH);}
  }

  // ===== DAY BANNER ("N일차") =====
  if(dayBanner.t>0){var bt=dayBanner.t, a=bt>2100?(2600-bt)/500:(bt<500?bt/500:1);a=Math.max(0,Math.min(1,a));
    ctx.save();ctx.globalAlpha=a;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='600 30px "Courier New",monospace';
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillText(dayBanner.text,VW/2+2,VH*0.34+2);
    ctx.fillStyle='#f0e2fa';ctx.fillText(dayBanner.text,VW/2,VH*0.34);
    ctx.font='13px "Courier New",monospace';ctx.fillStyle='rgba(199,155,232,'+(a).toFixed(2)+')';
    ctx.fillText(dayBanner.sub||'',VW/2,VH*0.34+30);
    ctx.restore();}

  // ===== QUEST COMPLETE celebration (brief, replaces the tracker for a moment) =====
  if(G.questComplete.t>0){
    var qa=Math.min(1, G.questComplete.t/500);   // fade out in the last 500ms
    ctx.save();ctx.globalAlpha=qa;ctx.textAlign='center';ctx.textBaseline='top';
    ctx.font='bold 14px "Courier New",monospace';
    var clabel='✓ 퀘스트 완료!';
    var csub='「'+G.questComplete.name+'」';
    ctx.font='bold 14px "Courier New",monospace';var cw1=ctx.measureText(clabel).width;
    ctx.font='11px "Courier New",monospace';var cw2=ctx.measureText(csub).width;
    var cbw=Math.max(cw1,cw2)+40, cbx=VW/2-cbw/2, cby=88;
    ctx.fillStyle='rgba(20,40,26,0.92)';roundRect(cbx,cby,cbw,42,10);ctx.fill();
    ctx.strokeStyle='rgba(154,255,160,0.85)';ctx.lineWidth=1.5;roundRect(cbx,cby,cbw,42,10);ctx.stroke();
    ctx.font='bold 14px "Courier New",monospace';ctx.fillStyle='#9affa0';ctx.fillText(clabel,VW/2,cby+7);
    ctx.font='11px "Courier New",monospace';ctx.fillStyle='#cfeecf';ctx.fillText(csub,VW/2,cby+25);
    ctx.restore();
  } else
  // ===== ACTIVE QUEST TRACKER (top banner, so you never forget your current task) =====
  if(G.activeQuest && dayBanner.t<=0){
    var done=questProgress(G.activeQuest);
    // find the giver npc for this quest
    var giver=null;for(var gq=0;gq<neighbors.length;gq++){if(neighbors[gq].quest===G.activeQuest&&!neighbors[gq].done){giver=neighbors[gq];break;}}
    var qt=G.activeQuest.t;
    var qh=done ? '완료! 다가가서 Space로 선물을 받자.' : questHint(G.activeQuest);
    ctx.save();ctx.textAlign='center';ctx.textBaseline='top';
    ctx.font='bold 12px "Courier New",monospace';
    var label=(done?'✓ ':'◈ ')+qt;
    var subw=Math.max(ctx.measureText(label).width, (ctx.font='11px "Courier New",monospace',ctx.measureText(qh).width))+34;
    var bxq=VW/2-subw/2, byq=92;
    ctx.fillStyle='rgba(24,14,38,0.82)';roundRect(bxq,byq,subw,38,8);ctx.fill();
    ctx.strokeStyle=done?'rgba(154,255,160,0.7)':'rgba(199,155,232,0.5)';ctx.lineWidth=1;roundRect(bxq,byq,subw,38,8);ctx.stroke();
    ctx.font='bold 12px "Courier New",monospace';ctx.fillStyle=done?'#9affa0':'#f0d24a';ctx.fillText(label,VW/2,byq+6);
    ctx.font='11px "Courier New",monospace';ctx.fillStyle='#d8cce8';ctx.fillText(qh,VW/2,byq+21);
    ctx.restore();
    // guide arrow: toward the escort goal (in progress) OR back toward the giver (when done)
    var target=null, acol='#9affa0';
    if(G.activeQuest.type==='escort'&&!done&&G.activeQuest.goal&&G.questMarker){ target=G.activeQuest.goal; }
    else if(done&&giver){ target={x:giver.x,y:giver.y}; }
    if(target){
      var gsx=target.x-cam.x, gsy=target.y-cam.y;
      if(gsx<10||gsx>VW-10||gsy<10||gsy>VH-10){
        var ang=Math.atan2(gsy-VH/2,gsx-VW/2), ax=VW/2+Math.cos(ang)*(VW*0.36), ay=VH/2+Math.sin(ang)*(VH*0.36);
        ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);ctx.fillStyle=acol;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-7,-8);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();
        ctx.restore();
      }
    }
  }

  // ===== BRUTISH MARK (bottom-right): bodies left behind draw more hunters =====
  if(S.killed>0){ctx.save();ctx.textAlign='right';
    ctx.font='bold 22px "Courier New",monospace';
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillText('☠ '+S.killed,VW-18+1,VH-44+1);
    ctx.fillStyle='#e87ab0';ctx.fillText('☠ '+S.killed,VW-18,VH-44);
    ctx.font='9px "Courier New",monospace';ctx.fillStyle='rgba(199,155,232,0.8)';ctx.fillText('남긴 시체 — 더 많은 자가 온다',VW-20,VH-26);
    ctx.restore();}
}

export function drawBattle(){var W=VW,H=VH,now=performance.now();
  // violet dusk sky gradient
  var sky=ctx.createLinearGradient(0,0,0,H*0.62);sky.addColorStop(0,'#241c3e');sky.addColorStop(0.5,'#48306a');sky.addColorStop(1,'#7a4878');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*0.62);
  // distant tree-line silhouette
  ctx.fillStyle='#1e1632';for(var t=0;t<W+40;t+=34){var th=18+((t*37)%22);ctx.beginPath();ctx.moveTo(t,H*0.62);ctx.lineTo(t+17,H*0.62-th-16);ctx.lineTo(t+34,H*0.62);ctx.closePath();ctx.fill();}
  // ground
  var gr=ctx.createLinearGradient(0,H*0.60,0,H);gr.addColorStop(0,'#3a3052');gr.addColorStop(1,'#211a36');ctx.fillStyle=gr;ctx.fillRect(0,H*0.60,W,H*0.40);
  // platforms (shadow pools)
  ctx.fillStyle='rgba(0,0,0,0.28)';ctx.beginPath();ctx.ellipse(W*0.74,H*0.40+24,104,24,0,0,6.3);ctx.fill();ctx.beginPath();ctx.ellipse(W*0.26,H*0.72+18,118,28,0,0,6.3);ctx.fill();
  if(G.battle.foeHp>G.battle.foeHpTarget)G.battle.foeHp=Math.max(G.battle.foeHpTarget,G.battle.foeHp-2.5);else if(G.battle.foeHp<G.battle.foeHpTarget)G.battle.foeHp=Math.min(G.battle.foeHpTarget,G.battle.foeHp+2.5);
  var st=G.battle.story;
  panelBox(16,18,250,54);
  pixelText(st.name+' · '+G.battle.n.name,26,26,14,'#f0e2fa',true);pixelText('Lv'+st.lvl,222,26,13,'#c79be8',true);
  pixelText('마음',26,50,12,'#d488c8',true);drawHPBar(62,52,180,G.battle.foeHp/100);
  drawTrainerStatic(W*0.74,H*0.40+Math.sin(now/400)*2.5,5.0,C[st.c]);
  panelBox(W-266,H*0.60-4,250,54);
  pixelText('나',W-256,H*0.60+4,15,'#f0e2fa',true);pixelText(['멀쩡','다침','많이 다침','위험!'][Math.min(3,S.wounds)],W-160,H*0.60+4,13,'#d4a4f0',true);
  pixelText('목숨',W-256,H*0.60+28,12,'#a48ad8',true);drawHPBar(W-218,H*0.60+30,180,Math.max(0,(MAXHP-S.wounds))/MAXHP);
  drawTrainerStatic(W*0.26,H*0.72,5.4,C.player);
  // vignette over battle
  var bv=ctx.createRadialGradient(W/2,H*0.4,H*0.3,W/2,H*0.4,W*0.7);bv.addColorStop(0,'rgba(0,0,0,0)');bv.addColorStop(1,'rgba(12,6,20,0.5)');ctx.fillStyle=bv;ctx.fillRect(0,0,W,H*0.6);
  var bx=10,by=H-150,bw=W-20,bh=140;
  panelBox(bx,by,bw,bh,true);
  if(G.battle.phase==='intro'){wrapText(cleanMsg(G.battle.msg),bx+22,by+18,bw-44,22,13.5,'#ece3d2',by+bh-30);if(Math.floor(now/400)%2===0)pixelText('▶ 눌러서 계속',bx+bw-150,by+bh-26,13,'#c79be8',false);}
  else if(G.battle.phase==='menu'){pixelText(G.battle.menuText,bx+22,by+14,15,'#f0e6d0',true);var cmds=G.battle.choices,oy=by+40,rh=26;
    for(var i=0;i<cmds.length;i++){var cy=oy+i*rh,mc=MOTIVE_COLOR[cmds[i].m]||'#ece3d2';
      if(i===G.battle.cursor){ctx.fillStyle='rgba(199,155,232,0.16)';roundRect(bx+14,cy-2,bw-28,rh-3,5);ctx.fill();ctx.fillStyle='#c79be8';ctx.beginPath();ctx.moveTo(bx+20,cy+4);ctx.lineTo(bx+28,cy+10);ctx.lineTo(bx+20,cy+16);ctx.fill();}
      ctx.fillStyle=mc;ctx.beginPath();ctx.arc(bx+36,cy+9,4,0,6.3);ctx.fill();pixelText(cmds[i].label,bx+46,cy+1,13,i===G.battle.cursor?'#fff':'#d8cdb6',i===G.battle.cursor);}}
  else if(G.battle.phase==='msg'){var endY=wrapText(cleanMsg(G.battle.msg),bx+22,by+16,bw-44,21,13,G.battle.resultOk?'#7ad88a':'#e88070',by+bh-40);wrapText(G.battle.philo,bx+22,endY+4,bw-44,16,11,'#9a8f76',by+bh-16);if(Math.floor(now/400)%2===0)pixelText('▶ 눌러서 계속',bx+bw-150,by+bh-22,12,'#c79be8',false);}}
