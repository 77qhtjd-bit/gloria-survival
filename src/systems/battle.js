// Dialogue-battle flow.
// Moved verbatim from src/main.js (step 3: module split).
import { STORIES } from '../stories.js';
import { MAXHP } from '../data/balance.js';
import { QUEST_NAMES } from '../data/dialogue.js';
import { recruitCompanion } from '../entities/companions.js';
import { refreshNeighbors } from '../entities/neighbors.js';
import { G, S, clamp, player } from '../state.js';
import { el, endGame, flash, render } from '../ui.js';

export function startBattle(n,forced){S.mode='battle';var st=STORIES[n.key];
  G.battle={n:n,story:st,nodeId:'start',foeHp:100,foeHpTarget:100,phase:'intro',msg:(forced?"먹을 걸 두고 딱 마주쳤다!\n":"")+st.intro,choices:null,cursor:0,after:null};
  el('hint').textContent='무엇을 할지 골라봐';}

function enterMenu(){var node=G.battle.story.nodes[G.battle.nodeId];G.battle.choices=node.choices;G.battle.cursor=0;G.battle.phase='menu';G.battle.menuText=(G.battle.nodeId==='start')?'어떻게 할까?':(G.battle.nodeText||'어떻게 할까?');}

export function chooseCommand(idx){if(G.battle.phase!=='menu')return;var ch=G.battle.choices[idx];var r=ch.eff();clamp();render();
  if(typeof r.foe==='number')G.battle.foeHpTarget=Math.max(0,Math.min(100,G.battle.foeHp+r.foe*10));
  if(r.recruit)G.battle.recruit=true;   // this choice turns the NPC into a companion when the talk ends
  G.battle.phase='msg';G.battle.msg=r.t;G.battle.philo=ch.line;G.battle.resultOk=r.ok;var st=G.battle.story;
  if(S.wounds>=MAXHP){G.battle.after='death';}else if(r.next&&st.nodes[r.next]){G.battle.after='next';G.battle.nextNode=r.next;G.battle.nextNodeText=st.nodes[r.next].text;}else{G.battle.after='end';}}

export function advanceBattle(){if(!G.battle)return;if(G.battle.phase==='intro'){enterMenu();return;}
  if(G.battle.phase==='msg'){if(G.battle.after==='death'){S.mode='field';G.battle=null;endGame('사람');return;}
    if(G.battle.after==='next'){G.battle.nodeId=G.battle.nextNode;G.battle.nodeText=G.battle.nextNodeText;enterMenu();return;}endBattle();return;}}

function endBattle(){var n=G.battle.n;var recruit=G.battle.recruit;n.done=true;S.mode='field';G.battle=null;el('hint').textContent='이동 WASD · 공격/말걸기 Space · 회피 Shift';player.y+=3;
  if(recruit){recruitCompanion(n);flash('「'+(QUEST_NAMES[n.key]||n.name||'동료')+'」이(가) 함께 다니기로 했다! 곁에서 싸움을 도와줄 거야.');}
  refreshNeighbors();}
