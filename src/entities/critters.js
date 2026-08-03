// Peaceful wildlife.
// Moved verbatim from src/main.js (step 3: module split).
import { sfxEat } from '../audio.js';
import { MH, MW, SPAWN, VH, VW } from '../data/balance.js';
import { CRITTER_TYPES } from '../data/items.js';
import { floatText } from '../render/fx.js';
import { S, cam, critters, ctx, player } from '../state.js';
import { freeTile } from '../world/map.js';

function spawnCritter(kind){var f=freeTile();var T=CRITTER_TYPES[kind];
  critters.push({x:f.x,y:f.y,kind:kind,dir:Math.random()*6.28,t:0,hop:Math.random()*6,
    vx:0,vy:0,bob:Math.random()*6, petted:false});}

export function ensureCritters(){
  // lots of life on peaceful days; almost none once it turns cruel
  var want = S.day<=3 ? SPAWN.crittersEarly : (S.day<=4 ? SPAWN.crittersMid : SPAWN.crittersLate);
  while(critters.length<want){
    var pool = S.day<=3 ? ['butterfly','rabbit','firefly'] : ['butterfly'];
    spawnCritter(pool[Math.floor(Math.random()*pool.length)]);
  }
  if(critters.length>want+2)critters.splice(0,critters.length-(want+2));
}

export function updateCritters(dt){
  for(var i=critters.length-1;i>=0;i--){var c=critters[i];var T=CRITTER_TYPES[c.kind];
    c.t+=dt; c.hop+=dt/300;
    var dx=player.x-c.x, dy=player.y-c.y, dist=Math.hypot(dx,dy)||1;
    if(dist<T.flee){
      // flee from the player (but this is play, not fear — they scamper away)
      c.x-=dx/dist*T.spd*1.4; c.y-=dy/dist*T.spd*1.4; c.dir=Math.atan2(-dy,-dx);
      if(dist<20 && !c.petted){ c.petted=true;
        floatText(c.x,c.y-16, (c.kind==='rabbit'?'깡총!':c.kind==='butterfly'?'팔랑~':'반짝!'),'#ffe0f4');
        if(Math.random()<0.5) sfxEat(); }
    } else {
      // gentle wander
      if(Math.random()<0.03)c.dir=Math.random()*6.28;
      c.x+=Math.cos(c.dir)*T.spd*0.5; c.y+=Math.sin(c.dir)*T.spd*0.5;
      c.petted=false;
    }
    c.x=Math.max(16,Math.min(MW-16,c.x)); c.y=Math.max(16,Math.min(MH-16,c.y));
  }
}

export function drawCritters(){var now=performance.now();
  for(var i=0;i<critters.length;i++){var c=critters[i];var sx=c.x-cam.x,sy=c.y-cam.y;
    if(sx<-20||sy<-20||sx>VW+20||sy>VH+20)continue;
    var T=CRITTER_TYPES[c.kind];
    if(c.kind==='butterfly'){
      var flap=Math.sin(now/90+c.bob)*0.6+0.6, yb=sy+Math.sin(now/250+c.bob)*3;
      ctx.save();ctx.translate(sx,yb);
      ctx.fillStyle='#f0a0d8';
      ctx.beginPath();ctx.ellipse(-3*flap,-1,3*flap+1,4,0.4,0,6.28);ctx.fill();
      ctx.beginPath();ctx.ellipse(3*flap,-1,3*flap+1,4,-0.4,0,6.28);ctx.fill();
      ctx.fillStyle='#c060a8';ctx.beginPath();ctx.ellipse(-2*flap,2,2*flap,3,0.3,0,6.28);ctx.fill();ctx.beginPath();ctx.ellipse(2*flap,2,2*flap,3,-0.3,0,6.28);ctx.fill();
      ctx.fillStyle='#3a2030';ctx.fillRect(-0.5,-3,1,7);
      ctx.restore();
    } else if(c.kind==='rabbit'){
      var hop=Math.abs(Math.sin(c.hop))*3;
      ctx.save();ctx.translate(sx,sy-hop);
      ctx.fillStyle='rgba(0,0,0,0.15)';ctx.beginPath();ctx.ellipse(0,hop+4,6,2,0,0,6.28);ctx.fill();
      ctx.fillStyle='#e8e0d4';ctx.beginPath();ctx.ellipse(0,0,6,5,0,0,6.28);ctx.fill(); // body
      ctx.beginPath();ctx.ellipse(-4,-4,3,3.5,0,0,6.28);ctx.fill(); // head
      ctx.fillStyle='#f4eee6';ctx.beginPath();ctx.ellipse(-5,-9,1.4,4,0.2,0,6.28);ctx.fill();ctx.beginPath();ctx.ellipse(-2.5,-9,1.4,4,-0.1,0,6.28);ctx.fill(); // ears
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5,2,2,0,6.28);ctx.fill(); // tail
      ctx.fillStyle='#3a2a2a';ctx.beginPath();ctx.arc(-5,-4,0.9,0,6.28);ctx.fill(); // eye
      ctx.restore();
    } else { // firefly
      var glow=0.4+0.6*(Math.sin(now/300+c.bob)*0.5+0.5);
      ctx.save();ctx.globalAlpha=glow;
      ctx.fillStyle='#f5ffa0';ctx.beginPath();ctx.arc(sx,sy,4,0,6.28);ctx.fill();
      ctx.globalAlpha=glow*0.4;ctx.beginPath();ctx.arc(sx,sy,8,0,6.28);ctx.fill();
      ctx.restore();
    }
  }
}
