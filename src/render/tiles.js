// Terrain tile painting.
// Moved verbatim from src/main.js (step 3: module split).
import { MAPC, MAPR, TILE, VH, VW } from '../data/balance.js';
import { COL } from '../data/palette.js';
import { _h2, _hx } from './trainer.js';
import { G, cam, ctx } from '../state.js';
import { biome, hash, isWater, map, tileAt } from '../world/map.js';

// per-subcell value noise so a tile isn't one flat block (kills the "big square" look)
// representative [a,b,dot] colours for each ground tile type — used to bleed
// neighbouring terrain across tile borders so edges aren't razor-straight.
function tileTone(t){
  switch(t){
    case 0: case 2: case 6: return [COL.grassA,COL.grassB,COL.grassDot];
    case 1:                 return [COL.darkA,COL.darkB,COL.darkDot];
    case 4: case 9:         return [COL.sand,COL.sandB,COL.sandDot];
    case 5:                 return [COL.rock,COL.rockB,COL.rockDot];
    case 7:                 return [COL.grassA,COL.grassB,COL.grassDot];
    case 8:                 return [COL.snow,COL.snowB,'#c4ccd4'];
    default:                return null; // water & others: no bleed
  }
}

function baseFill(px,py,a,b,dot,tx,ty){
  var SC=10;                                 // 10px sub-cells (4x4 per tile) → far fewer rects, much lighter to draw
  var boost=G.calmDay*20;                       // lift terrain luminance on bright early days (fades smoothly)
  var pa=_h2(a), pb=_h2(b);
  // neighbour tones (for edge bleeding). null where there's nothing to bleed.
  var myT=tileAt(tx,ty);
  var nbr={L:tileTone(tileAt(tx-1,ty)),R:tileTone(tileAt(tx+1,ty)),U:tileTone(tileAt(tx,ty-1)),D:tileTone(tileAt(tx,ty+1))};
  var myTone=tileTone(myT);
  for(var sy=0; sy<TILE; sy+=SC){
    for(var sx=0; sx<TILE; sx+=SC){
      var gx=tx*4+(sx/SC), gy=ty*4+(sy/SC);
      var n=hash(gx*13.1, gy*7.7);           // 0..1 noise per subcell
      var mix=n*0.55;
      var jit=(hash(gx*3+1,gy*9+2)-0.5)*10;
      var cA=pa, cB=pb;
      // ---- EDGE BLEED: near a border, sometimes borrow the neighbour's tone ----
      if(myTone){
        var dL=sx, dR=TILE-SC-sx, dU=sy, dD=TILE-SC-sy;
        var edge=null, ed=99;
        if(nbr.L && dL<ed && nbr.L[0]!==myTone[0]){edge=nbr.L;ed=dL;}
        if(nbr.R && dR<ed && nbr.R[0]!==myTone[0]){edge=nbr.R;ed=dR;}
        if(nbr.U && dU<ed && nbr.U[0]!==myTone[0]){edge=nbr.U;ed=dU;}
        if(nbr.D && dD<ed && nbr.D[0]!==myTone[0]){edge=nbr.D;ed=dD;}
        if(edge){
          var reach=16;
          var pBleed=Math.max(0,(reach-ed)/reach)*0.72;
          if(hash(gx*5.3+7, gy*2.9+3) < pBleed){ cA=_h2(edge[0]); cB=_h2(edge[1]); }
        }
      }
      var rr=cA[0]+(cB[0]-cA[0])*mix+jit+boost, gg=cA[1]+(cB[1]-cA[1])*mix+jit+boost, bb=cA[2]+(cB[2]-cA[2])*mix+jit+boost;
      ctx.fillStyle='#'+_hx(rr)+_hx(gg)+_hx(bb);
      ctx.fillRect(px+sx,py+sy,SC,SC);
    }
  }
  // scattered fine speckles for texture grain (a few, cheap)
  ctx.fillStyle=dot;
  for(var i=0;i<5;i++){var hxx=hash(tx*7+i*3,ty*3+i*5),hyy=hash(tx*5+i*2,ty*9+i);
    if(hxx>0.45){ctx.globalAlpha=0.4+hyy*0.4;ctx.fillRect(px+Math.floor(hxx*(TILE-3)),py+Math.floor(hyy*(TILE-3)),3,3);}}
  ctx.globalAlpha=1;
  // a couple of brighter highlight flecks
  ctx.fillStyle='#'+_hx(pa[0]+22+boost)+_hx(pa[1]+22+boost)+_hx(pa[2]+22+boost);
  for(var j=0;j<2;j++){var jx=hash(tx*11+j*7,ty*13+j),jy=hash(tx*17+j,ty*19+j*3);
    if(jx>0.62)ctx.fillRect(px+Math.floor(jx*(TILE-3)),py+Math.floor(jy*(TILE-3)),3,3);}
}

function drawTile(tx,ty){var px=tx*TILE-cam.x,py=ty*TILE-cam.y;
  if(px<-TILE||py<-TILE||px>VW||py>VH)return;
  var t=(tx<0||ty<0||tx>=MAPC||ty>=MAPR)?7:map[ty][tx];
  switch(t){
    case 0: baseFill(px,py,COL.grassA,COL.grassB,COL.grassDot,tx,ty);
            if(hash(tx,ty)<0.10){ctx.fillStyle='#6fae54';ctx.fillRect(px+12,py+20,3,12);ctx.fillRect(px+18,py+16,3,16);ctx.fillRect(px+24,py+22,3,10);}break;
    case 1: baseFill(px,py,COL.darkA,COL.darkB,COL.darkDot,tx,ty);break;
    case 4: baseFill(px,py,COL.sand,COL.sandB,COL.sandDot,tx,ty);break;
    case 5: baseFill(px,py,COL.rock,COL.rockB,COL.rockDot,tx,ty);
            ctx.fillStyle=COL.rockDot;if(hash(tx*3,ty)<0.4)ctx.fillRect(px+10,py+14,8,6);break;
    case 8: baseFill(px,py,COL.snow,COL.snowB,'#c4ccd4',tx,ty);break;
    case 6: baseFill(px,py,COL.grassA,COL.grassB,COL.grassDot,tx,ty);drawFlower(px,py,tx,ty);break;
    case 3: drawWater(px,py,tx,ty); break;
    case 2: baseFill(px,py,COL.grassA,COL.grassB,COL.grassDot,tx,ty);drawTree(px,py);break;
    case 7: baseFill(px,py,(ty<MAPR&&tx<MAPC&&biome[Math.max(0,Math.min(MAPR-1,ty))][Math.max(0,Math.min(MAPC-1,tx))]==='tundra')?COL.snow:COL.grassA,COL.grassB,COL.grassDot,tx,ty);drawPine(px,py);break;
    case 9: baseFill(px,py,COL.sand,COL.sandB,COL.sandDot,tx,ty);drawRock(px,py);break;
  }
}

// Trace a rounded water-tile path (rounded only on corners that meet land).
// Module-level so both the terrain cache and the animated ripple layer can use it.
function traceWaterPath(px,py,tx,ty,inset){
  var W=isWater(tx-1,ty), E=isWater(tx+1,ty), N=isWater(tx,ty-1), S2=isWater(tx,ty+1);
  var r=13, x0=px+inset, y0=py+inset, x1=px+TILE-inset, y1=py+TILE-inset;
  var rr=Math.max(2,r-inset);
  var rNW=(!N&&!W), rNE=(!N&&!E), rSE=(!S2&&!E), rSW=(!S2&&!W);
  ctx.beginPath();
  ctx.moveTo(x0+(rNW?rr:0), y0);
  ctx.lineTo(x1-(rNE?rr:0), y0); if(rNE) ctx.quadraticCurveTo(x1,y0, x1,y0+rr);
  ctx.lineTo(x1, y1-(rSE?rr:0)); if(rSE) ctx.quadraticCurveTo(x1,y1, x1-rr,y1);
  ctx.lineTo(x0+(rSW?rr:0), y1); if(rSW) ctx.quadraticCurveTo(x0,y1, x0,y1-rr);
  ctx.lineTo(x0, y0+(rNW?rr:0)); if(rNW) ctx.quadraticCurveTo(x0,y0, x0+rr,y0);
  ctx.closePath();
}

// Draw a water tile as a rounded river piece (rounded corners where it meets land).
function drawWater(px,py,tx,ty){
  baseFill(px,py,COL.grassA,COL.grassB,COL.grassDot,tx,ty);
  // shore ring
  ctx.save();traceWaterPath(px,py,tx,ty,0.5);ctx.fillStyle='#5c6a4a';ctx.globalAlpha=0.55;ctx.fill();ctx.globalAlpha=1;ctx.restore();
  // water body + ripples (clipped inside the rounded shape)
  ctx.save();traceWaterPath(px,py,tx,ty,2.5);ctx.clip();
  ctx.fillStyle=COL.waterB;ctx.fillRect(px,py,TILE,TILE);
  ctx.fillStyle=COL.water;ctx.fillRect(px+1,py+1,TILE-2,TILE-2);
  ctx.fillStyle='rgba(120,150,220,0.12)';ctx.fillRect(px,py,TILE,TILE*0.5);
  var wt=performance.now()/700;
  ctx.fillStyle='rgba(255,255,255,0.10)';
  for(var wb=0;wb<3;wb++){var yy=py+9+wb*11+Math.sin(wt+tx*0.5+wb)*1.6;ctx.fillRect(px+3,yy,TILE-6,1);}
  var sp=(Math.sin(wt*1.3+tx*1.7+ty)*0.5+0.5);
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.fillRect(px+6+sp*6,py+9,3,2);ctx.fillRect(px+22-sp*5,py+22,2,2);
  ctx.fillStyle='rgba(180,210,255,0.35)';ctx.fillRect(px+16,py+16+Math.sin(wt+tx)*2,3,1);
  ctx.restore();
  // foam edge
  ctx.save();ctx.strokeStyle='rgba(210,225,255,0.35)';ctx.lineWidth=1.4;traceWaterPath(px,py,tx,ty,2.5);ctx.stroke();ctx.restore();
}

function drawFlower(px,py,tx,ty){var cols=['#e85b7a','#f0d040','#fff','#c060d0'];var c=cols[Math.floor(hash(tx,ty)*4)];
  function fl(ox,oy){ctx.fillStyle=c;ctx.fillRect(ox-2,oy,2,2);ctx.fillRect(ox+2,oy,2,2);ctx.fillRect(ox,oy-2,2,2);ctx.fillRect(ox,oy+2,2,2);ctx.fillStyle='#f5d23a';ctx.fillRect(ox,oy,2,2);}
  fl(px+12,py+14);fl(px+26,py+24);}

function drawTree(px,py){
  var cx=px+TILE/2, base=py+TILE-6;
  // ground shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.ellipse(cx,base+3,12,4,0,0,6.28);ctx.fill();
  // trunk with a little taper + bark shading
  ctx.fillStyle=COL.trunk;ctx.fillRect(cx-3,py+18,6,base-py-16);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(cx+1,py+18,2,base-py-16);
  ctx.fillStyle='rgba(255,255,255,0.10)';ctx.fillRect(cx-3,py+18,1,base-py-16);
  // canopy: several overlapping blobs for a rounded, layered crown
  function blob(ox,oy,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(cx+ox,py+oy,r,0,6.28);ctx.fill();}
  blob(0,13,11,COL.treeDark);
  blob(-7,12,7,COL.treeDark); blob(7,12,7,COL.treeDark);
  blob(-4,9,7,COL.treeMid);  blob(5,10,6,COL.treeMid);  blob(0,8,7,COL.treeMid);
  blob(-2,7,5,COL.treeLite);  blob(3,8,4,COL.treeLite);
  // top highlight + a few leaf specks
  ctx.fillStyle='rgba(255,255,255,0.16)';ctx.beginPath();ctx.arc(cx-3,py+6,3,0,6.28);ctx.fill();
  ctx.fillStyle=COL.treeDark;ctx.globalAlpha=0.5;
  ctx.fillRect(cx-6,py+12,1,1);ctx.fillRect(cx+4,py+9,1,1);ctx.fillRect(cx+1,py+14,1,1);ctx.globalAlpha=1;
}

function drawPine(px,py){
  var cx=px+TILE/2, base=py+TILE-5;
  // ground shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.ellipse(cx,base+2,10,3.5,0,0,6.28);ctx.fill();
  // trunk
  ctx.fillStyle=COL.trunk;ctx.fillRect(cx-2,base-7,4,9);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(cx,base-7,2,9);
  // three soft conical tiers (rounded bottoms) with shading + snow caps
  function tier(topY,botY,halfW){
    ctx.fillStyle=COL.pineDark;
    ctx.beginPath();ctx.moveTo(cx,topY);ctx.quadraticCurveTo(cx-halfW,botY-3,cx-halfW,botY);ctx.quadraticCurveTo(cx,botY+3,cx+halfW,botY);ctx.quadraticCurveTo(cx+halfW,botY-3,cx,topY);ctx.closePath();ctx.fill();
    ctx.fillStyle=COL.pineMid; // lit left side
    ctx.beginPath();ctx.moveTo(cx,topY);ctx.quadraticCurveTo(cx-halfW,botY-3,cx-halfW,botY);ctx.quadraticCurveTo(cx-halfW*0.3,botY-1,cx,botY-2);ctx.closePath();ctx.fill();
  }
  tier(base-24, base-8, 13);
  tier(base-30, base-15, 10);
  tier(base-35, base-22, 7);
  // snow / light on the tips
  ctx.fillStyle='rgba(255,255,255,0.5)';
  ctx.beginPath();ctx.arc(cx-1,base-33,2,0,6.28);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.22)';
  ctx.fillRect(cx-5,base-18,4,1);ctx.fillRect(cx-7,base-11,5,1);
}

function drawRock(px,py){ctx.fillStyle='#7a746c';ctx.beginPath();ctx.moveTo(px+8,py+30);ctx.lineTo(px+12,py+14);ctx.lineTo(px+24,py+10);ctx.lineTo(px+32,py+22);ctx.lineTo(px+30,py+30);ctx.closePath();ctx.fill();
  ctx.fillStyle='#938c84';ctx.beginPath();ctx.moveTo(px+12,py+14);ctx.lineTo(px+24,py+10);ctx.lineTo(px+22,py+20);ctx.closePath();ctx.fill();
  ctx.fillStyle='#5f5a54';ctx.fillRect(px+18,py+24,8,4);}

export function drawMap(){var x0=Math.floor(cam.x/TILE)-1,y0=Math.floor(cam.y/TILE)-1,x1=Math.ceil((cam.x+VW)/TILE)+1,y1=Math.ceil((cam.y+VH)/TILE)+1;for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++)drawTile(x,y);}
