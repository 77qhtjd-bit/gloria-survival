// Quest-giving fellow survivors.
// Moved verbatim from src/main.js (step 3: module split).
import { neighbors, player } from '../state.js';
import { QUEST_GIVERS, makeQuest, namesPool, questProgress } from '../systems/quest.js';
import { freeTile } from '../world/map.js';

function makeNeighbor(f){
  // ~70% are quest-givers (with a mission) so there's almost always someone to help —
  // and therefore plenty of chances to gain a companion (and to be betrayed by one).
  var isQuest=Math.random()<0.7;
  if(isQuest){var gk=QUEST_GIVERS[Math.floor(Math.random()*QUEST_GIVERS.length)];
    return {x:f.x,y:f.y,kind:'quest',c:gk,name:namesPool[Math.floor(Math.random()*namesPool.length)],done:false,bob:Math.random()*6,quest:makeQuest(),phase:'offer',betrayer:Math.random()<0.35};}
  var key=STORY_KEYS[Math.floor(Math.random()*STORY_KEYS.length)];
  return {x:f.x,y:f.y,kind:'story',key:key,name:namesPool[Math.floor(Math.random()*namesPool.length)],done:false,bob:Math.random()*6};
}

export function spawnNeighbors(n){neighbors.length=0;for(var i=0;i<n;i++){var f=freeTile();if(Math.hypot(f.x-player.x,f.y-player.y)<140){i--;continue;}
  neighbors.push(makeNeighbor(f));
}}

// Keep the world populated: replace people you've already dealt with, a few at a time, so
// you never run out of potential companions.
export function refreshNeighbors(){
  var live=0;for(var i=0;i<neighbors.length;i++){if(!neighbors[i].done)live++;}
  var want=6;
  var guard=0;
  while(live<want && guard++<20){
    var f=freeTile();
    if(Math.hypot(f.x-player.x,f.y-player.y)<200)continue;   // not right on top of the player
    // recycle a finished slot if there is one, otherwise grow the list
    var slot=-1;for(var j=0;j<neighbors.length;j++){if(neighbors[j].done){slot=j;break;}}
    var fresh=makeNeighbor(f);
    if(slot>=0)neighbors[slot]=fresh; else neighbors.push(fresh);
    live++;
  }
}

export function nearNeighbor(){var now=performance.now();
  for(var i=0;i<neighbors.length;i++){var n=neighbors[i];
    if(n.done)continue;
    if(n._cooldownUntil&&now<n._cooldownUntil)continue;
    // generous reach so big sprites that LOOK adjacent register; a finished quest reaches
    // even further so turning it in never feels broken.
    var reach = (n.kind==='quest' && n.phase==='active' && n.quest && questProgress(n.quest)) ? 56 : 48;
    if(Math.hypot(player.x-n.x,player.y-n.y)<reach)return n;
  }
  return null;
}
