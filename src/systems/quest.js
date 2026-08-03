// NPC missions, rewards and betrayal.
// Moved verbatim from src/main.js (step 3: module split).
import { sfxDash } from '../audio.js';
import { QUEST_NAMES } from '../data/dialogue.js';
import { FOOD_TYPES } from '../data/items.js';
import { ARMOR_KINDS, ARMOR_NAME, WEAPONS } from '../data/weapons.js';
import { betrayNow, recruitCompanion } from '../entities/companions.js';
import { FOOD_KEYS } from '../entities/food.js';
import { refreshNeighbors } from '../entities/neighbors.js';
import { floatText } from '../render/fx.js';
import { G, S, armorCount, foods, player, weapons } from '../state.js';
import { el, flash, onTap, render } from '../ui.js';
import { freeTileNear } from '../world/map.js';

export var namesPool=["지호","수아","민준","서연","하준","예린","도윤","채원","시우","유나","건우","소율","태경","나윤"];

// ===== NPC QUESTS — wanderers who ask favours (and may betray you) =====
// each quest: type, target count, reward, flavour. Betrayal chance applies on accept & on turn-in.
export var QUEST_GIVERS=['medic','smith','farmer','archer','child'];

export function makeQuest(){
  // Weighted toward 'ally' quests on purpose: the core lesson is that a promise between
  // equals — with no power above them to enforce it — is fragile. Kids need to make MANY
  // companions (and be betrayed by some of them) for that to land.
  var pool=[
    // --- combat ---
    {type:'hunt', need:3, t:'나쁜 사람 쫓아내기', desc:'나를 노리는 나쁜 사람 3명을 쓰러뜨려 줘. 내 먹을 걸 자꾸 뺏어 가.', rewardKind:'armor'},
    {type:'hunt', need:2, t:'되갚아 주기', desc:'내 걸 빼앗아 간 사람이 둘 있어. 둘만 혼내 주면 보답할게.', rewardKind:'weapon'},
    {type:'hunt', need:4, t:'우리 구역 지키기', desc:'이 근처를 어슬렁대는 놈들 넷을 쫓아내 줘. 그럼 널 믿을게.', rewardKind:'ally'},
    {type:'hunt', need:2, t:'함께 싸울 사람 찾기', desc:'혼자선 도저히 못 버티겠어. 둘만 같이 물리쳐 주면, 나도 네 편이 될게!', rewardKind:'ally'},
    // --- gathering ---
    {type:'forage', need:3, t:'먹을 것 모으기', desc:'열매 3개만 가져다줘. 다리를 다쳐서 움직일 수가 없어.', rewardKind:'armor'},
    {type:'forage', need:2, t:'같이 먹을 것 나누기', desc:'열매 2개만 나눠 주면, 나도 너를 따라다니며 도울게. 혼자는 무서워.', rewardKind:'ally'},
    {type:'gather', mat:'wood', need:4, t:'나무 모아 오기', desc:'집을 고쳐야 해. 나무 4개만 모아다 줄래?', rewardKind:'weapon'},
    {type:'gather', mat:'stone', need:3, t:'돌 구해 오기', desc:'돌 3개가 필요해. 구해다 주면 좋은 걸 줄게.', rewardKind:'armor'},
    {type:'gather', mat:'fiber', need:3, t:'덩굴 구해 오기', desc:'덩굴 3개만 있으면 갑옷을 엮을 수 있어. 부탁해.', rewardKind:'ally'},
    {type:'gather', mat:'wood', need:3, t:'같이 지낼 집 만들기', desc:'나무 3개만 주면 같이 지낼 곳을 만들 수 있어. 그럼 우리 한편이야!', rewardKind:'ally'},
    // --- escort / protection (NPC actually follows you) ---
    {type:'escort', need:1, t:'안전한 곳까지 데려다주기', desc:'무서워서 혼자 못 움직이겠어. 저 표시된 곳까지 나를 데려다줄래? 네 뒤를 따라갈게.', rewardKind:'ally'},
    {type:'survive', need:1, t:'곁에서 지켜 주기', desc:'잠깐만 내 곁에 있어 줘. 네가 가까이 있어 주면 안심이 돼.', rewardKind:'ally'},
    {type:'survive', need:1, t:'믿을 수 있는지 보기', desc:'네가 정말 믿을 만한 사람인지 보고 싶어. 잠깐만 곁에 있어 주면 너와 함께 다닐게.', rewardKind:'ally'}
  ];
  var q=pool[Math.floor(Math.random()*pool.length)];
  return {type:q.type, need:q.need, mat:q.mat||null, prog:0, t:q.t, desc:q.desc, rewardKind:q.rewardKind,
          startKills:S.killed, startMat:null, surviveT:0, goal:null};
}

// ===== QUEST INTERACTION =====
var questNpc=null;

export function interactQuest(n){
  var qn=QUEST_NAMES[n.c]||'나그네';
  // A finished quest is handed in INSTANTLY and must never be blocked by the panel debounce.
  if(n.phase==='active'){
    if(questProgress(n.quest)){ n._busy=false; turnInQuest(n); return; }
    if(n._talkCd && performance.now()<n._talkCd) return;   // don't spam the nudge
    n._talkCd=performance.now()+900;
    flash('"아직 안 끝났네. '+questHint(n.quest)+'"');
    return;
  }
  // Only the offer dialog uses the busy flag (it opens a panel that must not re-trigger).
  if(n.phase==='offer'){
    if(n._busy)return; n._busy=true;
    questNpc=n; S.mode='quest';
    showQuestPanel(qn+' '+n.name,
      '"'+n.quest.desc+'"',
      [{label:'<span class="emo" style="margin-right:5px">✔</span>도와줄게',cls:'primary',act:'accept'},
       {label:'<span class="emo" style="margin-right:5px">✕</span>안 할래',cls:'',act:'decline'}]);
  }
}

// Instant quest turn-in: betrayal chance, consume gather mats, give ONE random reward
// (a material or a food item), flip the top banner to a celebratory "완료" state, done.
function turnInQuest(n){
  if(n.betrayer && Math.random()<0.55){ betrayNow(n,'reward'); return; }
  if(n.quest.type==='gather'&&n.quest.mat){S.inv[n.quest.mat]=Math.max(0,(S.inv[n.quest.mat]||0)-n.quest.need);}
  giveRandomReward(n);
  n.done=true; n.phase='done';
  // celebrate on the top banner, then let it fade
  G.questComplete.t=2600; G.questComplete.name=n.quest.t;
  G.activeQuest=null; G.questMarker=null;
  S.questsDone=(S.questsDone||0)+1;
  n._busy=false;
  refreshNeighbors();
  render();
}

// one random gift: a raw material OR a food item, always exactly 1
// Reward for finishing a favour: always ONE random item, and — if this was an "ally" quest —
// the villager also joins you as a companion. (Companions are the heart of the lesson: a promise
// with no power to enforce it. Half of them will eventually turn on you.)
function giveRandomReward(n){
  var giver=(QUEST_NAMES[n.c]||'나그네')+' '+n.name;
  var pool=[
    {kind:'mat', id:'wood',  nm:'나무'},
    {kind:'mat', id:'stone', nm:'돌'},
    {kind:'mat', id:'fiber', nm:'덩굴'},
    {kind:'mat', id:'mushroom', nm:'버섯'},
    {kind:'food'}
  ];
  var pick=pool[Math.floor(Math.random()*pool.length)];
  var gotName='';
  if(pick.kind==='mat'){
    S.inv[pick.id]=(S.inv[pick.id]||0)+1; gotName=pick.nm;
    floatText(player.x,player.y-36,'🎁 '+pick.nm+' +1','#9affc0');
  } else {
    var ft=FOOD_KEYS[Math.floor(Math.random()*FOOD_KEYS.length)];
    gotName=(FOOD_TYPES[ft]||FOOD_TYPES.berry).name;
    foods.push({x:player.x+22,y:player.y+14,sway:Math.random()*6,kind:ft});
    floatText(player.x,player.y-36,'🎁 '+gotName+' +1','#9affc0');
  }
  // an "ally" favour means they come WITH you from now on
  if(n.quest && n.quest.rewardKind==='ally'){
    recruitCompanion(n);
    floatText(player.x,player.y-52,'🤝 동료가 되었다!','#9affa0');
    flash('「'+giver+'」이(가) '+gotName+' 1개를 주고, 이제부터 너와 함께 다니기로 했다!');
  } else {
    flash('「'+giver+'」이(가) 고맙다며 '+gotName+' 1개를 줬다!');
  }
}

export function questProgress(q){
  if(q.type==='hunt')return (S.killed-q.startKills)>=q.need;
  if(q.type==='forage')return q.prog>=q.need;
  if(q.type==='gather')return (S.inv[q.mat]||0)>=q.need;
  if(q.type==='survive')return q.surviveT>=10000;       // stayed near ~10s
  if(q.type==='escort')return q.prog>=1;                // reached the safe spot with them in tow
  return false;
}

export function questHint(q){
  if(q.type==='hunt')return '나쁜 사람을 '+Math.max(0,q.need-(S.killed-q.startKills))+'명 더 쓰러뜨리자.';
  if(q.type==='forage')return '열매를 '+Math.max(0,q.need-q.prog)+'개 더 모으자.';
  if(q.type==='gather'){var nm={wood:'나무',stone:'돌',fiber:'덩굴',mushroom:'버섯'}[q.mat]||'재료';return nm+'을(를) '+Math.max(0,q.need-(S.inv[q.mat]||0))+'개 더 모으자. (모으면 자동으로 채워져)';}
  if(q.type==='survive'){var left=Math.max(0,Math.ceil((10000-q.surviveT)/1000));return left>0?('곁에서 '+left+'초만 더 지켜 주자.'):'다 지켰다! 돌아가서 선물 받자.';}
  if(q.type==='escort')return '표시된 곳까지 데려다주자. 그 사람이 네 뒤를 따라온다.';
  return '';
}

function showQuestPanel(title,body,buttons){
  var html='<div style="background:linear-gradient(180deg,rgba(28,20,40,0.97),rgba(14,9,22,0.98)); border:1px solid var(--edge); border-radius:var(--border-radius-lg); padding:1.1rem 1.1rem; box-shadow:0 10px 40px rgba(0,0,0,0.5);">'
    +'<div style="display:flex; align-items:center; gap:7px; margin-bottom:8px;"><span class="emo" style="font-size:18px; color:var(--gold);">💬</span><span style="font-weight:600; font-size:15px; color:var(--ink);">'+title+'</span></div>'
    +'<p style="font-size:13.5px; color:var(--ink-dim); line-height:1.7; margin:0 0 13px; font-style:italic;">'+body+'</p>'
    +'<div style="display:grid; gap:7px; max-width:340px;">';
  buttons.forEach(function(b,i){html+='<button data-act="'+b.act+'" class="'+b.cls+'" style="padding:9px; font-weight:500;">'+b.label+'</button>';});
  html+='</div></div>';
  el('story').innerHTML=html;
  el('story').querySelectorAll('button').forEach(function(btn){onTap(btn, function(){questAction(btn.getAttribute('data-act'));});});
}

function questAction(act){
  var n=questNpc;if(!n)return;
  if(act==='close'){closeQuest();return;}
  if(act==='decline'){flash('"…아쉽네. 다음에 또 보자."');n._cooldownUntil=performance.now()+2500;closeQuest();return;}
  if(act==='accept'){
    // BETRAYAL on accept: some "givers" attack the moment you lower your guard
    if(n.betrayer && Math.random()<0.6){betrayNow(n,'accept');return;}
    G.activeQuest=n.quest; n.phase='active'; n.quest.startKills=S.killed;
    if(n.quest.type==='escort'){var g=freeTileNear(player.x,player.y,240,380);n.quest.goal={x:g.x,y:g.y};spawnQuestMarker(g.x,g.y);n._following=true;}
    flash('부탁을 들어주기로 했다: 「'+n.quest.t+'」 '+questHint(n.quest));
    closeQuest();return;
  }
  if(act==='reward'){
    // BETRAYAL on turn-in: they take the work and stab you
    if(n.betrayer && Math.random()<0.72){betrayNow(n,'reward');return;}
    // gather quests consume the materials you hand over
    if(n.quest.type==='gather'&&n.quest.mat){S.inv[n.quest.mat]=Math.max(0,(S.inv[n.quest.mat]||0)-n.quest.need);}
    grantReward(n);
    n.done=true; n.phase='done'; G.activeQuest=null; G.questMarker=null;
    closeQuest();
    refreshNeighbors();
    return;
  }
}

export function closeQuest(){
  var nq=questNpc;                       // capture BEFORE clearing, or the timeout below no-ops
  S.mode='field'; el('story').innerHTML='';
  questNpc=null;
  if(nq) setTimeout(function(){ nq._busy=false; }, 350);   // release the debounce for real
  el('hint').textContent='이동 WASD · 공격/말걸기 Space · 회피 Shift';
  player.y+=3;
}

function grantReward(n){
  var k=n.quest.rewardKind;
  // every quest also hands over a little pile of materials, so a reward never feels empty
  var bonusMat=['wood','stone','fiber'][Math.floor(Math.random()*3)];
  var bonusAmt=2+Math.floor(Math.random()*2);
  S.inv[bonusMat]=(S.inv[bonusMat]||0)+bonusAmt;
  var matNm={wood:'나무',stone:'돌',fiber:'덩굴'}[bonusMat];

  if(k==='armor'){
    var missing=ARMOR_KINDS.filter(function(p){return !S.armor[p];});
    if(missing.length){var pc=missing[Math.floor(Math.random()*missing.length)];S.armor[pc]=true;
      sfxDash();floatText(player.x,player.y-38,'🎁 '+ARMOR_NAME[pc]+' 획득!','#aee0ff');
      flash('고맙다며 「'+ARMOR_NAME[pc]+'」와(과) '+matNm+' '+bonusAmt+'개를 줬다! (갑옷 '+armorCount()+'/4)');}
    else{S.hunger=Math.min(100,S.hunger+40);S.inv.mushroom=(S.inv.mushroom||0)+2;
      floatText(player.x,player.y-38,'🎁 음식 + 재료','#9affc0');
      flash('갑옷은 이미 다 갖췄구나! 대신 음식과 '+matNm+' '+bonusAmt+'개를 잔뜩 줬다. (배가 든든)');}
  } else if(k==='weapon'){
    var better=['woodsword','sword','spear','axe'][Math.floor(Math.random()*4)];
    var prev=player.weapon;player.weapon=better;
    if(prev!=='fist')weapons.push({x:player.x+24,y:player.y+18,kind:prev,bob:0});
    sfxDash();floatText(player.x,player.y-38,'🎁 '+WEAPONS[better].name+' 획득!','#c79be8');
    flash('고맙다며 「'+WEAPONS[better].name+'」와(과) '+matNm+' '+bonusAmt+'개를 줬다!');
  } else if(k==='ally'){
    recruitCompanion(n);
    floatText(player.x,player.y-38,'🤝 동료 합류!','#9affa0');
    flash('「'+(QUEST_NAMES[n.c]||'나그네')+' '+n.name+'」이(가) 내 동료가 되었다! '+matNm+' '+bonusAmt+'개도 나눠 줬다.');
  }
  S.questsDone++; render();
}

function spawnQuestMarker(x,y){G.questMarker={x:x,y:y};}
