// Raider archetypes and the spawn-type probability table.
// Extracted verbatim from src/main.js (step 2: data/code separation).
// Text and values are unchanged.
// ---- enemy archetypes: EQUAL in lethality, different in behaviour ----
//  Every one of them can kill you in a single clean strike. You can kill any of them
//  the same way — especially from behind. That is the "equality that breeds fear."
//  prowler: openly hunts you.  lurker: wanders, then ambushes when close.  jackal: fast, comes in packs.
export const RTYPE={
  prowler:{name:'굶주린 자', spd:0.92, size:2.0, col:'raider', mark:'☠', sight:140, lunge:26},
  lurker: {name:'숨어든 자', spd:0.74, size:2.1, col:'ogre',   mark:'◆', sight:88,  lunge:34}, // ambusher: short sight, telegraphed lunge
  jackal: {name:'떼 지은 자', spd:1.5,  size:1.7, col:'wolf',   mark:'ᘛ', sight:175, lunge:22}
};

export function rollType(day){var r=Math.random(),d=day;
  var pJackal=Math.max(0.18,0.5-d*0.012);
  var pLurker=Math.min(0.42,0.12+d*0.02);
  if(r<pJackal)return'jackal'; if(r<pJackal+pLurker)return'lurker'; return'prowler';}
