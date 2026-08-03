// Shared mutable game state: the canvas, the run state S, the player and the entity arrays.
// Moved verbatim from src/main.js (step 3: module split).
import { DIFF, MH, MOVE, MW, VH, VW } from './data/balance.js';
import { WEAPONS } from './data/weapons.js';

export var cv=document.getElementById('screen'), ctx=cv.getContext('2d');

export var cam={x:0,y:0};

// Mutable run state that more than one module has to read AND write. Kept on an
// object because ES module bindings are read-only for importers; per-module
// scalars (craftOpen, resRespawnAt, the stepLoop timers, ...) stay local.
export var G={
  dayTimer:0,
  darkness:0,        // bright violet day1 → near-black
  calmDay:1,         // 0..1, set each frame; fades the terrain's bright early-day glow
  shake:0,
  hitStop:0,
  battle:null,
  wantInteract:false,// set when the player presses SPACE near an NPC
  activeQuest:null,  // current NPC mission
  questMarker:null,
  questComplete:{t:0,name:''}  // brief "퀘스트 완료!" celebration on the top banner
};

export function updateCam(){cam.x=Math.round(player.x-VW/2);cam.y=Math.round(player.y-VH/2);}

// ============================================================
//  STATE OF NATURE — Hobbesian survival
//  No armour. A wooden sword. Anyone can kill anyone in one true blow.
// ============================================================
export var S={
  over:false, mode:'intro',
  day:1,                 // SHORT — days survived (the clock toward inevitable death)
  hunger:100,            // POOR — endless want; food is always scarce
  wounds:0,              // NASTY — accumulated injuries fester (0..3); each slows you & risks death
  killed:0,              // BRUTISH — bodies you've left behind; the more you kill, the more come
  fear:0,                // dread meter (rises near enemies / when wounded), drives the red creep
  allies:0,              // SOLITARY — covenants attempted (they always break)
  betrayed:0,
  rep:0,                 // standing with the other survivors; hidden from the HUD, but it
                         // gates several dialogue outcomes (see STORIES)
  armor:{helm:false, chest:false, arms:false, legs:false},  // FORAGING: armour pieces, each absorbs one hit
  questsDone:0,
  inv:{wood:0, stone:0, mushroom:0, fiber:0},   // gathered raw materials
  built:{shelter:false, campfire:false} // structures crafted this run
};

export function armorCount(){var a=S.armor;return (a.helm?1:0)+(a.chest?1:0)+(a.arms?1:0)+(a.legs?1:0);}

// a worn piece absorbs an incoming wound, then shatters
export function breakArmor(){var order=['helm','arms','legs','chest'];for(var i=0;i<order.length;i++){if(S.armor[order[i]]){S.armor[order[i]]=false;return order[i];}}return null;}

export function diff(){return DIFF.base + (S.day-1)*DIFF.perDay + S.killed*DIFF.perKill;} // gentler scaling; skill should matter more than the clock

// PLAYER — fragile. One body, one wooden sword.
// hp is a thin "stagger" buffer; a clean hit (or any backstab) can drop you instantly.
export var player={x:MW/2,y:MH/2,facing:'down',walk:0,atk:0,atkCool:0,hurt:0,inv:0,dashCd:0,dashT:0,dvx:0,dvy:0,weapon:'fist'};

export function curWeapon(){return WEAPONS[player.weapon]||WEAPONS.fist;}

export var weapons=[];  // dropped weapon pickups on the ground: {x,y,kind,bob}

export var armorDrops=[]; // {x,y,piece,bob}

export var companions=[]; // allies that follow & fight for you

export function moveSpeed(){return MOVE.base - S.wounds*MOVE.woundPenalty;}  // NASTY: wounds slow you

export function clamp(){if(S.hunger>100)S.hunger=100;if(S.hunger<0)S.hunger=0;if(S.fear>10)S.fear=10;if(S.fear<0)S.fear=0;if(S.wounds<0)S.wounds=0;}

export var neighbors=[], foods=[], raiders=[];

// ===== CRITTERS — peaceful wildlife you can chase and play with. They exist purely for
// the JOY of the early, lawless days: no goal, no danger, just the freedom to roam and
// frolic. As the world darkens (day 4+) they grow scarce, quietly signalling the loss of
// that innocent freedom. =====
export var critters=[];

// ===== GATHERABLE RESOURCES (Minecraft-style: gather raw materials, then craft) =====
//  res.kind: 'wood' | 'stone' | 'mushroom' | 'fiber'
export var resources=[];   // {x,y,kind,bob}

export var structures=[];  // built things: {x,y,kind:'shelter'|'campfire',t}
