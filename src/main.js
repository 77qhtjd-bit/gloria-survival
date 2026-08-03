import { actx, sfxDash, sfxEat, sfxHurt } from './audio.js';
import { DAY_MS, DIFF, HUNGER_RATE, MAPC, MAPR, MAXHP, MH, MOVE, MW, RES, SPAWN, TILE, VH, VW } from './data/balance.js';
import { QUEST_NAMES, TAUNTS_ATTACK, TAUNTS_BETRAY, createStories } from './data/dialogue.js';
import { RTYPE, rollType } from './data/enemies.js';
import { CRITTER_TYPES, FOOD_TYPES, MAT_ICON, createRecipes } from './data/items.js';
import { COL } from './data/palette.js';
import { buildEnding, openingScenes } from './data/story.js';
import { ARMOR_KINDS, ARMOR_NAME, WEAPONS, WEAPON_ORDER } from './data/weapons.js';
import { updateCompanions } from './entities/companions.js';
import { ensureCritters, updateCritters } from './entities/critters.js';
import { ensureResources, spawnResources } from './entities/drops.js';
import { ensureFood, spawnFood } from './entities/food.js';
import { nearNeighbor, spawnNeighbors } from './entities/neighbors.js';
import { addRaiderAt, adjustRaiders, spawnRaiders } from './entities/raiders.js';
import { battlePoint, downPt, dragTarget, dragging, isTouch, joyVec, keys, pos } from './input.js';
import { drawBattle, drawField } from './render/field.js';
import { addShake, dayBanner, floatText, floaters, moodTail, sayLine, showDayBanner } from './render/fx.js';
import { G, S, armorCount, armorDrops, clamp, companions, critters, ctx, cv, diff, foods, moveSpeed, neighbors, player, raiders, resources, structures, updateCam, weapons } from './state.js';
import { advanceBattle, chooseCommand, startBattle } from './systems/battle.js';
import { doAttack, doDash, isBehind, killPlayer, tryMove, woundPlayer } from './systems/combat.js';
import { buildStructure, doCraft, makeWeapon, wearArmor } from './systems/craft.js';
import { interactQuest, questProgress } from './systems/quest.js';
import { closeCraft, el, flash, onTap, openCraft, render, showOpening, updateCraftUI } from './ui.js';
import { freeTileNear, genMap, solidAt } from './world/map.js';
(function(){
  cv.width=VW*RES; cv.height=VH*RES;
  ctx.scale(RES,RES);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';


  genMap();
















  // hit-stop (freeze a few frames on a kill for impact)



  /* ===== STORY DATA — fellow crash survivors of the Gloria ===== */

  // Built once at boot. The eff() bodies close over this exact S object, which is
  // why reset() clears S in place instead of reassigning it.
  var STORIES=createStories(S,moodTail);
  var STORY_KEYS=Object.keys(STORIES);






  window.__onTap = onTap;






  // make() bodies need game state and these helpers, so the list is built here.
  var RECIPES=createRecipes({S:S,player:player,buildStructure:buildStructure,clamp:clamp,
    flash:flash,floatText:floatText,makeWeapon:makeWeapon,sfxEat:sfxEat,wearArmor:wearArmor});
  window.__doCraft=doCraft;
  window.__openCraft=openCraft; window.__closeCraft=closeCraft;

  window.__updateCraftUI=updateCraftUI;
  // wire the open/close buttons once
  (function(){
    onTap(document.getElementById('craft-open'), openCraft);
    onTap(document.getElementById('craft-close'), closeCraft);
    var modal=document.getElementById('craft-modal');
    if(modal){ modal.addEventListener('click',function(e){ if(e.target===modal)closeCraft(); });
      modal.addEventListener('touchend',function(e){ if(e.target===modal){ e.preventDefault(); closeCraft(); } },{passive:false}); }
  })();


















  function frame(){
    if(window.__refreshTouchUI) window.__refreshTouchUI();
    if(window.__updateCraftUI) window.__updateCraftUI();
    // show the dark story overlay only when there's story/dialogue/narration content
    var sl=document.getElementById('story-layer'), so=document.getElementById('story');
    if(sl&&so){ sl.style.display = (so.innerHTML.trim()!=='') ? 'flex' : 'none'; }
    ctx.save();
    if(G.shake>0.3){var sa=G.shake;ctx.translate((Math.random()-0.5)*sa,(Math.random()-0.5)*sa);}
    if(S.mode==='battle'&&G.battle){drawBattle();}else{updateCam();drawField();}
    ctx.restore();
    requestAnimationFrame(frame);}



  var raiderSpeed=MOVE.raider, lastTick=performance.now();







  function stepLoop(){var now=performance.now();var dt=Math.min(50,now-lastTick);lastTick=now;
    // hit-stop freezes the world briefly for impact
    if(G.hitStop>0){G.hitStop-=dt; if(G.hitStop>0){setTimeout(stepLoop,16);return;}}
    // always-on decays
    if(dayBanner.t>0)dayBanner.t-=dt;
    if(G.questComplete.t>0)G.questComplete.t-=dt;
    if(G.shake>0)G.shake=Math.max(0,G.shake-dt*0.03);
    for(var fl=floaters.length-1;fl>=0;fl--){var F=floaters[fl];F.t-=dt;F.y+=F.vy*dt*0.06;if(F.t<=0)floaters.splice(fl,1);}

    if(S.mode==='field'&&!S.over){var dx=0,dy=0;
      // player timers
      if(player.atk>0){player.atk-=dt/200;if(player.atk<0)player.atk=0;}
      if(player.atkCool>0)player.atkCool-=dt;
      if(player.hurt>0)player.hurt-=dt;
      if(player.inv>0)player.inv-=dt;
      if(player.dashCd>0)player.dashCd-=dt;

      // ---- movement (dash overrides) ----
      if(player.dashT>0){player.dashT-=dt;var ds=7.4*(player.dashT/180)+2.2;tryMove(player.x+player.dvx*ds,player.y+player.dvy*ds);player.walk+=0.5;
        if(Math.abs(player.dvx)>Math.abs(player.dvy))player.facing=player.dvx<0?'left':'right';else player.facing=player.dvy<0?'up':'down';
      } else {
        if(keys['w']||keys['arrowup']){dy-=1;player.facing='up';}if(keys['s']||keys['arrowdown']){dy+=1;player.facing='down';}
        if(keys['a']||keys['arrowleft']){dx-=1;player.facing='left';}if(keys['d']||keys['arrowright']){dx+=1;player.facing='right';}
        if(joyVec.active&&(joyVec.x||joyVec.y)){dx=joyVec.x;dy=joyVec.y;if(Math.abs(dx)>Math.abs(dy))player.facing=dx<0?'left':'right';else player.facing=dy<0?'up':'down';}
        if(dragTarget){var ddx=dragTarget.x-player.x,ddy=dragTarget.y-player.y,dd=Math.hypot(ddx,ddy);if(dd>6){dx=ddx/dd;dy=ddy/dd;if(Math.abs(dx)>Math.abs(dy))player.facing=dx<0?'left':'right';else player.facing=dy<0?'up':'down';}}
        if(dx||dy){var m=Math.hypot(dx,dy)||1;tryMove(player.x+dx/m*moveSpeed(),player.y+dy/m*moveSpeed());player.walk+=0.35;}else player.walk=0;
      }

      // ---------- TIME: day + a SLOW, CONTINUOUS darkening ----------
      G.dayTimer+=dt;
      if(G.dayTimer>=DAY_MS){G.dayTimer-=DAY_MS;S.day+=1;showDayBanner(S.day);adjustRaiders();render();
        if(S.day===2){flash('둘째 날도 화창해! 재료를 모아 🔨 조합 창에서 쉼터·무기·갑옷을 만들어 두자.');}
        else if(S.day===3){flash('셋째 날. 여전히 평화롭다… 그래도 슬슬 무기랑 갑옷을 갖춰 두면 좋겠어.');}
        else if(S.day===4){S.fear=Math.min(10,S.fear+2);
          flash('넷째 날. 겉보기엔 어제와 같은데… 사람들의 눈빛이 조금씩 달라진 것 같다.');}
        else if(S.day>=5){flash(S.day+'일째. 하늘이 어제보다 한 뼘 더 어두워졌다.');}
      }
      // Darkness follows CONTINUOUS progress (day + fraction of the current day), so the
      // world dims smoothly minute-by-minute instead of jumping at each dawn. It stays bright
      // and "innocent" for the first ~3 days, then creeps down without ever quite stopping —
      // the planet keeps pretending to be gentle while slowly turning cruel.
      var progress=(S.day-1)+Math.min(1,G.dayTimer/DAY_MS);   // 0 at start of day 1
      var darkTarget=Math.min(0.9, Math.max(0,(progress-2.5))*0.075); // barely moves days 1-3, then a slow steady slide
      G.darkness+=(darkTarget-G.darkness)*Math.min(1,dt/1400);  // gentle easing (slower than before)

      // ---------- POOR / WELL-FED: hunger drains, but a full belly mends wounds ----------
      var mending=(S.hunger>=96 && S.wounds>0);
      if(!mending){
        // shelter & campfire both SLOW hunger loss (they don't refill it).
        // shelter is a touch better than the campfire.
        // shelter & campfire slow hunger loss, but only mildly now (they were too strong).
        var restMul = nearShelter ? 0.7 : (nearCampfire ? 0.82 : 1);
        var hungerMul=(1+S.fear*0.04)*restMul;
        S.hunger-=HUNGER_RATE*(dt/1000)*hungerMul;
      }
      if(S.hunger<=0){S.hunger=0;starveTimer+=dt;
        if(starveTimer>=5000){starveTimer=0;S.wounds++;sfxHurt();addShake(6);floatText(player.x,player.y-28,'배고픔','#e8a0c0');render();
          flash('너무 배고파서 몸이 상한다. (상처 +1)');
          if(S.wounds>=MAXHP)killPlayer('굶주림');}
      } else starveTimer=0;

      // WELL-FED: a full belly slowly knits one wound shut at a time
      if(mending){
        healTimer+=dt;
        if(healTimer>=4500){healTimer=0;S.wounds--;player.inv=Math.max(player.inv,300);
          S.hunger=Math.max(45,S.hunger-18); // mending burns energy; then you must eat again
          sfxEat();floatText(player.x,player.y-30,'+목숨','#7affa0');flash('배가 부르니 상처가 아문다! (목숨 +1)');render();}
      } else healTimer=0;

      // NASTY: deep wounds fester — fear festers, occasional bleed
      if(S.wounds>=2){festerTimer+=dt;if(festerTimer>=5000){festerTimer=0;S.fear=Math.min(10,S.fear+1);}}

      // fear eases when no enemy is close; rises when they are
      var nearest=1e9;for(var q=0;q<raiders.length;q++){if(raiders[q].dead)continue;var dq=Math.hypot(raiders[q].x-player.x,raiders[q].y-player.y);if(dq<nearest)nearest=dq;}
      if(nearest<90)S.fear=Math.min(10,S.fear+dt*0.002); else S.fear=Math.max(0,S.fear-dt*0.0008);

      // ---------- WEAPON PICKUPS: arm yourself ----------
      for(var wi=weapons.length-1;wi>=0;wi--){var wp=weapons[wi];if(Math.hypot(wp.x-player.x,wp.y-player.y)<22){
        var newW=WEAPONS[wp.kind];
        weapons.splice(wi,1);
        var prev=player.weapon;
        player.weapon=wp.kind;
        sfxDash();floatText(player.x,player.y-28,newW.name+' 획득','#c79be8');
        flash('「'+newW.name+'」을(를) 손에 쥐었다! (길이 '+(newW.reach>50?'긺':newW.reach>40?'보통':'짧음')+')');
        if(prev!=='fist'){weapons.push({x:player.x+(Math.random()<0.5?-30:30),y:player.y+18,kind:prev,bob:Math.random()*6});}
        render();
      }}
      // weapons are crafted now, not scattered — no auto-respawn (dropped-on-swap ones remain pickupable)

      // ---------- ARMOR PICKUPS: pick up a piece you dropped/swapped (armor is crafted, not scattered) ----------
      for(var ai=armorDrops.length-1;ai>=0;ai--){var ad=armorDrops[ai];if(Math.hypot(ad.x-player.x,ad.y-player.y)<22){
        if(S.armor[ad.piece]){continue;} // already wearing this piece — leave it
        armorDrops.splice(ai,1);S.armor[ad.piece]=true;
        sfxDash();floatText(player.x,player.y-30,ARMOR_NAME[ad.piece]+' 착용','#aee0ff');
        flash('「'+ARMOR_NAME[ad.piece]+'」을(를) 둘렀다! 칼 한 번을 막아준다. (갑옷 '+armorCount()+'/4)');
        render();
      }}
      // armor is crafted now — no auto-respawn on the ground

      // ---------- FORAGING: food restores hunger. From day 3 its scent also draws predators ----------
      for(var i=foods.length-1;i>=0;i--){var f=foods[i];if(Math.hypot(f.x-player.x,f.y-player.y)<22){
        var ft=FOOD_TYPES[f.kind]||FOOD_TYPES.berry;
        foods.splice(i,1);S.hunger=Math.min(100,S.hunger+ft.heal);clamp();
        sfxEat();floatText(player.x,player.y-26,ft.name+' +'+'배부름','#9affc0');
        if(G.activeQuest&&G.activeQuest.type==='forage'&&G.activeQuest.prog<G.activeQuest.need){G.activeQuest.prog++;floatText(player.x,player.y-42,'모으기 '+G.activeQuest.prog+'/'+G.activeQuest.need,'#c79be8');}
        if(S.day<=3){flash('「'+ft.name+'」을(를) 먹었다! 배가 찬다.'+(ft.heal>=40?' 아주 든든해!':''));}
        else{flash('「'+ft.name+'」을(를) 먹었다! — 그런데 냄새를 맡고 누군가 다가온다…');
          var lure=1+(Math.random()<0.5?1:0);for(var lg=0;lg<lure;lg++){var rr=freeTileNear(player.x,player.y,150,240);addRaiderAt(rr.x,rr.y);}}
        render();
      }}
      ensureFood();
      updateCritters(dt); ensureCritters();

      // ---------- GATHERING: pick up raw materials (wood / stone / mushroom / fiber) ----------
      for(var ri=resources.length-1;ri>=0;ri--){var r=resources[ri];if(Math.hypot(r.x-player.x,r.y-player.y)<22){
        resources.splice(ri,1);
        if(r.kind==='wood'){S.inv.wood++;sfxEat();floatText(player.x,player.y-26,'🪵 나무 +1','#c8a878');flash('나무를 주웠다! (나무 '+S.inv.wood+'개) — 🔨 조합 창을 열어 뭔가 만들어 봐.');}
        else if(r.kind==='stone'){S.inv.stone++;sfxEat();floatText(player.x,player.y-26,'🪨 돌 +1','#b8bcc4');flash('돌을 주웠다! (돌 '+S.inv.stone+'개)');}
        else if(r.kind==='fiber'){S.inv.fiber++;sfxEat();floatText(player.x,player.y-26,'🌿 덩굴 +1','#8fd88f');flash('덩굴을 주웠다! (덩굴 '+S.inv.fiber+'개) — 갑옷·밧줄 재료야.');}
        else {S.inv.mushroom++;S.hunger=Math.min(100,S.hunger+22);clamp();sfxEat();floatText(player.x,player.y-26,'🍄 버섯 +1','#e88aa8');flash('버섯을 주웠다! 먹으면 배가 차고, 모아서 조합에도 써. (버섯 '+S.inv.mushroom+'개)');}
        updateCraftUI();render();
      }}
      ensureResources();

      // ---------- SHELTER / CAMPFIRE effects (hunger-slowing handled in the hunger tick above) ----------
      nearShelter=false;nearCampfire=false;
      for(var si=0;si<structures.length;si++){var st2=structures[si];var dd2=Math.hypot(st2.x-player.x,st2.y-player.y);
        if(st2.kind==='shelter'&&dd2<58)nearShelter=true;
        if(st2.kind==='campfire'&&dd2<44)nearCampfire=true;}
      if(nearShelter){ // shelter also slowly mends wounds
        shelterTimer+=dt;if(shelterTimer>=3600&&S.wounds>0){shelterTimer=0;S.wounds--;floatText(player.x,player.y-30,'+목숨','#7affa0');flash('쉼터에서 쉬니 상처가 아문다. (목숨 +1)');render();}
      } else shelterTimer=0;

      // ---------- NPC encounters: press SPACE near someone to talk / turn in a quest ----------
      var n=nearNeighbor();
      if(n && G.wantInteract){
        // survive quests still auto-count time by standing near; SPACE handles everything else
        // and also collects the reward once the quest is complete.
        if(n.kind==='quest') interactQuest(n); else startBattle(n,false);
      }
      G.wantInteract=false;   // consume the key press each tick

      // ---------- QUEST progress ----------
      if(G.activeQuest){
        var giver=null;for(var gi2=0;gi2<neighbors.length;gi2++){if(neighbors[gi2].quest===G.activeQuest){giver=neighbors[gi2];break;}}
        if(G.activeQuest.type==='survive'){
          if(giver&&Math.hypot(player.x-giver.x,player.y-giver.y)<90){G.activeQuest.surviveT+=dt;
            if(G.activeQuest.surviveT>=10000&&!G.activeQuest._rdy){G.activeQuest._rdy=true;floatText(player.x,player.y-40,'다 지켜줬다! 돌아가서 선물 받자','#9affa0');}
          }
        }
        if(G.activeQuest.type==='escort'&&G.activeQuest.goal){
          // the NPC actually follows the player (trailing a few steps behind)
          if(giver&&giver._following){
            var tx=player.x-24, ty=player.y+16, ddx=tx-giver.x, ddy=ty-giver.y, dl=Math.hypot(ddx,ddy)||1;
            if(dl>14){var spd=2.4, nx=giver.x+ddx/dl*spd, ny=giver.y+ddy/dl*spd;
              if(!solidAt(nx,giver.y))giver.x=nx; if(!solidAt(giver.x,ny))giver.y=ny;
              giver.walk=(giver.walk||0)+0.3; giver.facing=Math.abs(ddx)>Math.abs(ddy)?(ddx<0?'left':'right'):(ddy<0?'up':'down');}
            else giver.walk=0;
            // arrival is judged by the ESCORTED PERSON reaching the marker, not the player
            if(Math.hypot(giver.x-G.activeQuest.goal.x,giver.y-G.activeQuest.goal.y)<44&&G.activeQuest.prog<1){
              G.activeQuest.prog=1;G.questMarker=null;giver._following=false;
              floatText(giver.x,giver.y-40,'도착! 고마워, 돌아가서 선물 줄게','#9affa0');}
          }
        }
        if(G.activeQuest.type==='gather'){
          if(questProgress(G.activeQuest)&&!G.activeQuest._rdy){G.activeQuest._rdy=true;floatText(player.x,player.y-40,'다 모았다! 돌아가서 건네주자','#9affa0');}
        }
      }

      // ---------- COMPANIONS: follow you, strike nearby raiders ----------
      updateCompanions(dt);

      // ---------- betrayer raiders flee after their ambush ----------
      // (handled in raider loop via rd.betrayerFlee)

      // ---------- RAIDERS: equal lethality, behaviour-driven ----------
      for(var k2=raiders.length-1;k2>=0;k2--){var rd=raiders[k2];
        if(rd.hurt>0)rd.hurt-=dt;
        if(rd.dead){rd.deadT-=dt;if(rd.deadT<=0)raiders.splice(k2,1);continue;}
        var T=RTYPE[rd.type]||RTYPE.prowler;
        var d=Math.hypot(rd.x-player.x,rd.y-player.y);
        // BETRAYER: after the ambush, this one flees and vanishes (no honour, no staying to fight)
        if(rd.betrayerFlee){rd.fleeT-=dt;
          var fdx=(rd.x-player.x)/(d||1),fdy=(rd.y-player.y)/(d||1);
          var fnx=rd.x+fdx*3.0,fny=rd.y+fdy*3.0;
          if(!solidAt(fnx,rd.y))rd.x=Math.max(20,Math.min(MW-20,fnx));
          if(!solidAt(rd.x,fny))rd.y=Math.max(20,Math.min(MH-20,fny));
          rd.walk+=0.4;rd.facing=Math.abs(fdx)>Math.abs(fdy)?(fdx<0?'left':'right'):(fdy<0?'up':'down');
          if(rd.fleeT<=0||d>360){raiders.splice(k2,1);}
          continue;
        }
        var sight=T.sight*(1+ (G.darkness*0.0)); // darkness doesn't help them; it isolates YOU
        // state machine
        if(d<sight){ if(rd.state!=='alert') sayLine(rd, TAUNTS_ATTACK, 0.25); rd.state='alert'; }
        else if(rd.state==='alert'&&d>sight*1.5)rd.state='idle';

        var rdx,rdy;
        if(rd.state==='alert'){
          rdx=(player.x-rd.x)/(d||1);rdy=(player.y-rd.y)/(d||1);
          rd.facing=Math.abs(rdx)>Math.abs(rdy)?(rdx<0?'left':'right'):(rdy<0?'up':'down');
          // lunge: telegraph (windup) then dash, so a sharp player can read & dodge it
          if(d<T.lunge+30&&rd.atkCd<=0&&rd.lungeT<=0&&rd.windup<=0){rd.windup=240;rd.atkCd=1300+Math.random()*500;}
        } else {
          rd.wander-=dt;if(rd.wander<=0){rd.dir=Math.random()*6.28;rd.wander=700+Math.random()*1400;}
          rdx=Math.cos(rd.dir);rdy=Math.sin(rd.dir);
          rd.facing=Math.abs(rdx)>Math.abs(rdy)?(rdx<0?'left':'right'):(rdy<0?'up':'down');
        }
        rd.atkCd-=dt;
        // windup → lunge transition
        if(rd.windup>0){rd.windup-=dt;if(rd.windup<=0){rd.lungeT=210;}}
        var dcap=Math.min(diff(),1.7); // cap how fast the swarm gets, so skill stays viable
        var spd;
        if(rd.windup>0){spd=raiderSpeed*T.spd*0.15;} // freeze-ish during the wind-up tell
        else if(rd.lungeT>0){rd.lungeT-=dt;spd=raiderSpeed*T.spd*2.7*dcap;}
        else spd=raiderSpeed*T.spd*(rd.state==='alert'?1.45:0.7)*dcap;
        var nrx=rd.x+rdx*spd,nry=rd.y+rdy*spd;
        if(!solidAt(nrx,rd.y))rd.x=Math.max(20,Math.min(MW-20,nrx));else rd.dir=Math.random()*6.28;
        if(!solidAt(rd.x,nry))rd.y=Math.max(20,Math.min(MH-20,nry));else rd.dir=Math.random()*6.28;
        rd.walk+=0.3;

        // contact: a strike. A hit to YOUR back is a deep wound (2); from the front, 1.
        if(d<26){
          var theyBehind=isBehind(rd.x,rd.y,player); // is the raider behind the player?
          sayLine(rd, TAUNTS_ATTACK, 0.5);           // ~half the time, they gloat about the lawlessness
          woundPlayer(theyBehind, rd.x, rd.y, T.name);
        }
      }
      render();
    }
    setTimeout(stepLoop,16);}
  var starveTimer=0, festerTimer=0, healTimer=0, shelterTimer=0;
  var nearShelter=false, nearCampfire=false;



  // ===== ENDING — every death is solitary, poor, nasty, brutish, and short =====


  function startField(){
    S.mode='field';el('story').innerHTML='';el('hint').textContent='이동 WASD/조이스틱 · 공격 · 회피';G.dayTimer=0;G.darkness=0;actx();showDayBanner(1);
    raiders.length=0; // days 1-2 are peaceful — no enemies at all
    setTimeout(function(){if(!S.over)flash('글로리아 1일째, 화창해! 🪵나무·🪨돌·🌿덩굴·🍄버섯을 모아서 🔨조합 창을 열어 봐.');},900);
  }

  // S is cleared IN PLACE, never reassigned: the STORIES and RECIPES factories in
  // src/data/ close over this object, so its identity has to survive a restart.
  function reset(){var fresh={over:false,mode:'intro',day:1,hunger:100,wounds:0,killed:0,fear:0,allies:0,betrayed:0,rep:0,armor:{helm:false,chest:false,arms:false,legs:false},questsDone:0,inv:{wood:0,stone:0,mushroom:0,fiber:0},built:{shelter:false,campfire:false}};
    for(var _k in S)delete S[_k];
    for(var _f in fresh)S[_f]=fresh[_f];
    G.dayTimer=0;G.darkness=0;dayBanner.t=0;G.shake=0;floaters.length=0;G.hitStop=0;starveTimer=0;festerTimer=0;healTimer=0;
    player.atk=0;player.atkCool=0;player.hurt=0;player.inv=0;player.dashCd=0;player.dashT=0;player.weapon='fist';
    armorDrops.length=0;companions.length=0;G.activeQuest=null;
    genMap();player.x=MW/2;player.y=MH/2;player.facing='down';player.walk=0;foods.length=0;spawnFood(SPAWN.foodInitial);critters.length=0;ensureCritters();weapons.length=0;armorDrops.length=0;spawnResources();structures.length=0;spawnNeighbors(SPAWN.neighbors);spawnRaiders(0);adjustRaiders();el("log").innerHTML="";render();showOpening();}

  genMap();player.x=MW/2;player.y=MH/2;spawnFood(SPAWN.foodInitial);critters.length=0;ensureCritters();weapons.length=0;armorDrops.length=0;spawnResources();structures.length=0;spawnNeighbors(SPAWN.neighbors);spawnRaiders(0);render();adjustRaiders();frame();stepLoop();showOpening();
})();
