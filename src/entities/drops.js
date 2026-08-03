// Ground pickups: weapons, armour and raw materials.
// Moved verbatim from src/main.js (step 3: module split).
import { SPAWN, VH, VW } from '../data/balance.js';
import { ARMOR_KINDS, WEAPONS, WEAPON_ORDER } from '../data/weapons.js';
import { S, armorDrops, cam, ctx, player, resources, weapons } from '../state.js';
import { freeTile } from '../world/map.js';

// 현재 미사용 — 무기/방어구는 조합으로만 획득
function spawnWeapons(n){weapons.length=0;for(var i=0;i<n;i++)addWeaponDrop();}

// 현재 미사용 — 무기/방어구는 조합으로만 획득
function addWeaponDrop(kind){var f=freeTile();
  // early game favors weak weapons; later drops can be stronger
  if(!kind){var pool=S.day<=1?['stick','rock','dagger']:S.day<=2?['stick','rock','dagger','woodsword']:WEAPON_ORDER;
    kind=pool[Math.floor(Math.random()*pool.length)];}
  weapons.push({x:f.x,y:f.y,kind:kind,bob:Math.random()*6});}

// 현재 미사용 — 무기/방어구는 조합으로만 획득
function ensureWeapons(){var min=S.day<=2?SPAWN.weaponsEarlyMin:SPAWN.weaponsLateMin;while(weapons.length<min)addWeaponDrop();}

// 현재 미사용 — 무기/방어구는 조합으로만 획득
function addArmorDrop(piece){var f=freeTile();if(!piece)piece=ARMOR_KINDS[Math.floor(Math.random()*ARMOR_KINDS.length)];armorDrops.push({x:f.x,y:f.y,piece:piece,bob:Math.random()*6});}

// 현재 미사용 — 무기/방어구는 조합으로만 획득
function ensureArmor(){
  // a little armour lies around during the peaceful foraging days; scarce later
  var min=S.day<=1?SPAWN.armorEarlyMin:S.day<=2?SPAWN.armorMidMin:SPAWN.armorLateMin;
  while(armorDrops.length<min)addArmorDrop();}

var resRespawnAt=0; // timestamp gate so materials trickle back slowly (not instantly)

// place a resource somewhere on the map, never right on top of the player
function addResource(kind){var tries=0,f;do{f=freeTile();tries++;}while(Math.hypot(f.x-player.x,f.y-player.y)<160&&tries<40);resources.push({x:f.x,y:f.y,kind:kind,bob:Math.random()*6});}

export function spawnResources(){resources.length=0;
  for(var k in SPAWN.resInitial){for(var i=0;i<SPAWN.resInitial[k];i++)addResource(k);}
}

// Slow, capped replenishment. Instead of instantly refilling to a target every frame
// (which made a new node pop right after you grabbed one), we add at most ONE node
// every few seconds, and only up to a soft cap. Materials stay plentiful days 1-3.
export function ensureResources(){
  var now=performance.now();
  if(now<resRespawnAt) return;
  var caps = (S.day<=3) ? SPAWN.resCapsEarly : SPAWN.resCapsLate;
  var c={wood:0,stone:0,mushroom:0,fiber:0};
  for(var i=0;i<resources.length;i++){c[resources[i].kind]=(c[resources[i].kind]||0)+1;}
  // find the material furthest below its cap and add just one
  var pick=null,worst=0;
  for(var k in caps){var deficit=caps[k]-(c[k]||0);if(deficit>worst){worst=deficit;pick=k;}}
  if(pick){ addResource(pick); resRespawnAt = now + SPAWN.resRespawnMs; }
}

export function drawWeapons(){var now=performance.now();weapons.forEach(function(wp){var sx=wp.x-cam.x,sy=wp.y-cam.y;if(sx<-20||sy<-20||sx>VW+20||sy>VH+20)return;
  var W=WEAPONS[wp.kind];var bob=Math.sin(now/450+wp.bob)*1.6;
  // glow + shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(sx,sy+7,7,2.2,0,0,6.3);ctx.fill();
  var g=0.3+0.2*Math.sin(now/300+wp.bob);ctx.save();ctx.globalAlpha=g;ctx.fillStyle='#c79be8';ctx.beginPath();ctx.arc(sx,sy-2+bob,11,0,6.3);ctx.fill();ctx.restore();
  // little weapon icon (diagonal)
  ctx.save();ctx.translate(sx,sy-2+bob);ctx.rotate(-0.6);
  if(wp.kind==='rock'){ctx.fillStyle=W.blade;ctx.beginPath();ctx.moveTo(-5,3);ctx.lineTo(-2,-4);ctx.lineTo(4,-3);ctx.lineTo(5,3);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(-2,-3,3,2);}
  else{ // handle
    if(W.col){ctx.strokeStyle=W.col;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(0,7-W.len*0.5);ctx.stroke();}
    // blade/head
    ctx.strokeStyle=W.blade;ctx.lineWidth=wp.kind==='axe'?2:2.6;ctx.beginPath();ctx.moveTo(0,7-W.len*0.5);ctx.lineTo(0,7-W.len*0.5-W.len*0.45);ctx.stroke();
    if(wp.kind==='axe'){ctx.fillStyle=W.blade;ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(6,-5);ctx.lineTo(5,2);ctx.closePath();ctx.fill();}
    if(wp.kind==='spear'){ctx.fillStyle=W.blade;ctx.beginPath();ctx.moveTo(0,7-W.len*0.95);ctx.lineTo(-2,7-W.len*0.78);ctx.lineTo(2,7-W.len*0.78);ctx.closePath();ctx.fill();}
    ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,7-W.len*0.5);ctx.lineTo(0,7-W.len*0.5-W.len*0.4);ctx.stroke();
  }
  ctx.restore();});}

export function drawArmorDrops(){var now=performance.now();armorDrops.forEach(function(ad){var sx=ad.x-cam.x,sy=ad.y-cam.y;if(sx<-20||sy<-20||sx>VW+20||sy>VH+20)return;
  var bob=Math.sin(now/420+ad.bob)*1.6;
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(sx,sy+7,7,2.2,0,0,6.3);ctx.fill();
  var g=0.3+0.2*Math.sin(now/300+ad.bob);ctx.save();ctx.globalAlpha=g;ctx.fillStyle='#9ec8e8';ctx.beginPath();ctx.arc(sx,sy-2+bob,11,0,6.3);ctx.fill();ctx.restore();
  var yy=sy-2+bob;
  ctx.save();ctx.translate(sx,yy);
  var steel='#cfd6de', steelSh='#9aa4ae', steelHi='#eef2f6';
  if(ad.piece==='helm'){ctx.fillStyle=steel;ctx.beginPath();ctx.arc(0,0,6,Math.PI,0);ctx.fill();ctx.fillRect(-6,0,12,3);ctx.fillStyle=steelSh;ctx.fillRect(-6,2,12,1);ctx.fillStyle=steelHi;ctx.fillRect(-4,-4,3,2);ctx.fillStyle='#3a3340';ctx.fillRect(-1,-2,2,4);}
  else if(ad.piece==='chest'){ctx.fillStyle=steel;ctx.fillRect(-6,-6,12,12);ctx.fillStyle=steelSh;ctx.fillRect(-6,2,12,4);ctx.fillStyle=steelHi;ctx.fillRect(-5,-5,4,3);ctx.fillStyle='#7a8390';ctx.fillRect(-1,-6,2,12);}
  else if(ad.piece==='arms'){ctx.fillStyle=steel;ctx.fillRect(-6,-4,5,9);ctx.fillRect(1,-4,5,9);ctx.fillStyle=steelHi;ctx.fillRect(-6,-4,5,2);ctx.fillRect(1,-4,5,2);ctx.fillStyle=steelSh;ctx.fillRect(-6,3,5,2);ctx.fillRect(1,3,5,2);}
  else {ctx.fillStyle=steel;ctx.fillRect(-6,-5,5,11);ctx.fillRect(1,-5,5,11);ctx.fillStyle=steelHi;ctx.fillRect(-6,-5,5,2);ctx.fillRect(1,-5,5,2);ctx.fillStyle=steelSh;ctx.fillRect(-6,3,5,3);ctx.fillRect(1,3,5,3);}
  ctx.restore();
  // a tiny shield glyph above to read as "armour"
  ctx.fillStyle='#bfe0ff';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('⛨',sx,sy-16+bob);});}

// ===== draw gatherable resources =====
export function drawResources(){var now=performance.now();resources.forEach(function(r){var sx=r.x-cam.x,sy=r.y-cam.y;if(sx<-24||sy<-24||sx>VW+24||sy>VH+24)return;
  var bob=Math.sin(now/500+r.bob)*1.2;
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(sx,sy+8,7,2.2,0,0,6.3);ctx.fill();
  if(r.kind==='wood'){ // a small log / sapling
    ctx.save();ctx.translate(sx,sy+bob);
    ctx.fillStyle='#6b4a2a';ctx.fillRect(-3,-9,6,14);ctx.fillStyle='#5a3d22';ctx.fillRect(1,-9,2,14);
    ctx.fillStyle='#8a5e36';ctx.beginPath();ctx.ellipse(0,-9,3,1.6,0,0,6.3);ctx.fill();
    ctx.fillStyle='#4e9a4e';ctx.beginPath();ctx.arc(-4,-11,4,0,6.3);ctx.arc(4,-11,4,0,6.3);ctx.arc(0,-15,4.5,0,6.3);ctx.fill();
    ctx.fillStyle='#67b967';ctx.beginPath();ctx.arc(-3,-12,2,0,6.3);ctx.arc(2,-14,2,0,6.3);ctx.fill();
    ctx.restore();
  } else if(r.kind==='stone'){ // a rock cluster
    ctx.save();ctx.translate(sx,sy+bob);
    ctx.fillStyle='#8a8f98';ctx.beginPath();ctx.moveTo(-7,4);ctx.lineTo(-4,-4);ctx.lineTo(3,-5);ctx.lineTo(7,3);ctx.closePath();ctx.fill();
    ctx.fillStyle='#a8adb6';ctx.beginPath();ctx.moveTo(-4,-4);ctx.lineTo(3,-5);ctx.lineTo(1,-1);ctx.lineTo(-3,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#6a6f78';ctx.fillRect(-6,3,12,2);
    ctx.restore();
  } else if(r.kind==='mushroom'){ // mushroom
    ctx.save();ctx.translate(sx,sy+bob);
    ctx.fillStyle='#e8dcc0';ctx.fillRect(-1.5,-2,3,7);
    ctx.fillStyle='#d8487a';ctx.beginPath();ctx.arc(0,-3,6,Math.PI,0);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-2,-4,1.2,0,6.3);ctx.arc(2.5,-3,1,0,6.3);ctx.arc(0,-6,1,0,6.3);ctx.fill();
    ctx.restore();
  } else { // fiber — a leafy vine / creeper coiled on the ground
    ctx.save();ctx.translate(sx,sy+bob);
    // curling vine stem
    ctx.strokeStyle='#3f8a3f';ctx.lineWidth=2.2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-6,4);ctx.quadraticCurveTo(-7,-3,-1,-4);ctx.quadraticCurveTo(6,-5,4,-11);ctx.stroke();
    ctx.strokeStyle='#57ab57';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(-6,4);ctx.quadraticCurveTo(-7,-3,-1,-4);ctx.quadraticCurveTo(6,-5,4,-11);ctx.stroke();
    // leaves along the vine
    function leaf(lx,ly,ang){ctx.save();ctx.translate(lx,ly);ctx.rotate(ang);
      ctx.fillStyle='#4e9a4e';ctx.beginPath();ctx.ellipse(0,0,3.2,1.7,0,0,6.3);ctx.fill();
      ctx.fillStyle='#67b967';ctx.beginPath();ctx.ellipse(-0.5,-0.4,1.6,0.9,0,0,6.3);ctx.fill();
      ctx.strokeStyle='#2f7a2f';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(3,0);ctx.stroke();
      ctx.restore();}
    leaf(-5,1,-0.5); leaf(1,-3,0.4); leaf(4,-9,-0.3); leaf(-2,-6,0.9);
    ctx.restore();
  }});}
