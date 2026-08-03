// Food spawning and drawing.
// Moved verbatim from src/main.js (step 3: module split).
import { SPAWN, VH, VW } from '../data/balance.js';
import { FOOD_TYPES } from '../data/items.js';
import { keys } from '../input.js';
import { cam, ctx, foods } from '../state.js';
import { freeTile, waterNear } from '../world/map.js';

export var FOOD_KEYS=Object.keys(FOOD_TYPES);

function rollFoodKind(nearWater){
  // fish only appears when a water tile is nearby; otherwise pick weighted among the rest
  var keys=FOOD_KEYS.filter(function(k){return k!=='fish'||nearWater;});
  var total=0;keys.forEach(function(k){total+=FOOD_TYPES[k].weight;});
  var r=Math.random()*total;
  for(var i=0;i<keys.length;i++){r-=FOOD_TYPES[keys[i]].weight;if(r<=0)return keys[i];}
  return 'berry';
}

export function spawnFood(n){for(var i=0;i<n;i++){var f=freeTile();var kind=rollFoodKind(waterNear(f.x,f.y));foods.push({x:f.x,y:f.y,sway:Math.random()*6,kind:kind});}}

export function ensureFood(){while(foods.length<SPAWN.foodMin)spawnFood(1);}

export function drawFood(){var now=performance.now();foods.forEach(function(f){var sx=f.x-cam.x,sy=f.y-cam.y;if(sx<-20||sy<-20||sx>VW+20||sy>VH+20)return;
  var bob=Math.sin(now/500+f.sway)*1.2;
  var kind=f.kind||'berry';
  ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.ellipse(sx,sy+7,6,2,0,0,6.3);ctx.fill();
  var C2=(FOOD_TYPES[kind]||FOOD_TYPES.berry).col;
  if(kind==='berry'){
    function berry(ox,oy,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(sx+ox,sy+oy+bob,3.2,0,6.3);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(sx+ox-1,sy+oy-1+bob,1,0,6.3);ctx.fill();}
    berry(-3,0,C2[0]);berry(3,-1,C2[1]);berry(0,3,C2[2]);
    ctx.strokeStyle='#5a8a3a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx,sy-4+bob);ctx.lineTo(sx+2,sy-9+bob);ctx.stroke();
    ctx.fillStyle='#5a8a3a';ctx.beginPath();ctx.ellipse(sx+3,sy-9+bob,2.5,1.4,0.6,0,6.3);ctx.fill();
  } else if(kind==='apple'){
    ctx.fillStyle=C2[0];ctx.beginPath();ctx.arc(sx,sy+bob,5.5,0,6.3);ctx.fill();
    ctx.fillStyle=C2[1];ctx.beginPath();ctx.arc(sx-1.5,sy-1.5+bob,2.5,0,6.3);ctx.fill(); // highlight
    ctx.fillStyle=C2[2];ctx.beginPath();ctx.arc(sx+2.5,sy+2+bob,2,0,6.3);ctx.fill();     // shade
    ctx.strokeStyle='#6a4a2a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx,sy-5+bob);ctx.lineTo(sx+1,sy-8+bob);ctx.stroke();
    ctx.fillStyle='#5a9a4a';ctx.beginPath();ctx.ellipse(sx+3,sy-7+bob,2.5,1.4,0.5,0,6.3);ctx.fill();
  } else if(kind==='root'){
    // carrot-like root: tapered orange body + green top
    ctx.fillStyle=C2[0];ctx.beginPath();ctx.moveTo(sx-3,sy-3+bob);ctx.lineTo(sx+3,sy-3+bob);ctx.lineTo(sx,sy+6+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle=C2[1];ctx.beginPath();ctx.moveTo(sx-3,sy-3+bob);ctx.lineTo(sx-0.5,sy-3+bob);ctx.lineTo(sx-1,sy+3+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(sx-1,sy-1+bob,1,4);
    ctx.strokeStyle='#5a9a4a';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(sx-2,sy-3+bob);ctx.lineTo(sx-3,sy-8+bob);ctx.moveTo(sx,sy-3+bob);ctx.lineTo(sx,sy-9+bob);ctx.moveTo(sx+2,sy-3+bob);ctx.lineTo(sx+3,sy-8+bob);ctx.stroke();
  } else if(kind==='honey'){
    // honeycomb chunk: golden hexagon-ish + drip + sparkle
    ctx.fillStyle=C2[2];ctx.beginPath();ctx.arc(sx,sy+bob,5.5,0,6.3);ctx.fill();
    ctx.fillStyle=C2[1];ctx.beginPath();ctx.arc(sx,sy-0.5+bob,4,0,6.3);ctx.fill();
    ctx.fillStyle=C2[0];
    ctx.fillRect(sx-3,sy-2+bob,2,2);ctx.fillRect(sx+1,sy-2+bob,2,2);ctx.fillRect(sx-1,sy+1+bob,2,2); // comb cells
    ctx.fillStyle='rgba(255,255,255,0.7)';ctx.beginPath();ctx.arc(sx-2,sy-2+bob,1,0,6.3);ctx.fill();
    ctx.fillStyle=C2[1];ctx.beginPath();ctx.arc(sx+1,sy+6+bob,1.4,0,6.3);ctx.fill(); // drip
  } else if(kind==='fish'){
    // little fish: body + tail + eye
    ctx.fillStyle=C2[0];ctx.beginPath();ctx.ellipse(sx,sy+bob,6,3.4,0,0,6.3);ctx.fill();
    ctx.fillStyle=C2[1];ctx.beginPath();ctx.ellipse(sx-1,sy-0.8+bob,4,2,0,0,6.3);ctx.fill();
    ctx.fillStyle=C2[0];ctx.beginPath();ctx.moveTo(sx+5,sy+bob);ctx.lineTo(sx+9,sy-3+bob);ctx.lineTo(sx+9,sy+3+bob);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1a2a3a';ctx.beginPath();ctx.arc(sx-3,sy-0.5+bob,1,0,6.3);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(sx-4,sy-2+bob,3,1);
  }});}
