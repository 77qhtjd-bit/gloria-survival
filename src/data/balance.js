// Tuning constants: viewport, map size, and the numbers that drive difficulty,
// movement and spawning. Values are identical to the ones previously inlined in
// src/main.js (step 2: data/code separation).

// ---- viewport / rendering ----
export const VW = 640, VH = 360, TILE = 40;
// Render at 2x backing resolution for crisp visuals while keeping the game's
// logical coordinate space (VW x VH) unchanged.
export const RES = 2;

// ---- map dimensions ----
export const MAPC = 48, MAPR = 40, MW = MAPC * TILE, MH = MAPR * TILE;

// ---- core clocks ----
export const MAXHP = 4;          // four wounds before you fall
export const DAY_MS = 28000;     // a "day" of real play
export const HUNGER_RATE = 1.5;  // hunger should nag, not dominate

// ---- difficulty curve: diff() = base + (day-1)*perDay + killed*perKill ----
export const DIFF = { base: 1, perDay: 0.12, perKill: 0.008 };

// ---- movement: moveSpeed() = base - wounds*woundPenalty ----
export const MOVE = { base: 2.7, woundPenalty: 0.45, raider: 0.95 };

// ---- spawn counts and soft caps ----
export const SPAWN = {
  foodMin: 11,             // ensureFood keeps at least this many on the ground
  foodInitial: 10,         // spawnFood(n) at boot and on reset
  crittersEarly: 7,        // ensureCritters: day <= 3
  crittersMid: 3,          // day 4
  crittersLate: 1,         // day 5+
  weaponsEarlyMin: 5,      // ensureWeapons: day <= 2   (retired feature)
  weaponsLateMin: 3,       //                day 3+     (retired feature)
  armorEarlyMin: 3,        // ensureArmor: day <= 1     (retired feature)
  armorMidMin: 2,          //              day 2        (retired feature)
  armorLateMin: 1,         //              day 3+       (retired feature)
  resInitial: { wood: 10, stone: 6, mushroom: 5, fiber: 5 },
  resCapsEarly: { wood: 10, stone: 6, mushroom: 5, fiber: 5 }, // day 1-3: build freely
  resCapsLate: { wood: 4, stone: 3, mushroom: 3, fiber: 2 },   // day 4+: scarcer
  resRespawnMs: 2600,      // at most one node every ~2.6s
  neighbors: 5,            // spawnNeighbors(n)
};
