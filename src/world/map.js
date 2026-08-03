// Terrain generation and tile queries.
// Moved verbatim from src/main.js (step 3: module split).
import { MAPC, MAPR, MH, MW, TILE } from '../data/balance.js';

// tile codes: 0 grass,1 dark grass,2 tree,3 water,4 sand,5 rock path,6 flower,7 pine(block),8 snow,9 rock(block)
export var map=[], biome=[];

export function genMap(){
  map.length=0;biome.length=0;
  // biome via coarse value noise
  function vnoise(x,y,s){var xi=Math.floor(x/s),yi=Math.floor(y/s);
    function h(a,b){var n=(a*73856093^b*19349663)>>>0;return ((n%1000)/1000);}
    var fx=(x/s)-xi,fy=(y/s)-yi;
    var a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);
    var u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
    return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+d*u*v;}
  for(var y=0;y<MAPR;y++){var row=[],brow=[];for(var x=0;x<MAPC;x++){
    var b1=vnoise(x,y,7), b2=vnoise(x+100,y+100,5);
    var t=0,bm='meadow';
    if(b1<0.30){bm='forest';t=(Math.random()<0.18)?2:1;}        // dense forest
    else if(b1>0.74){bm='desert';t=(Math.random()<0.04)?9:4;}   // sand + rocks
    else if(b2>0.72){bm='tundra';t=(Math.random()<0.10)?7:8;}   // snowy pines
    else if(b2<0.26){bm='rocky';t=(Math.random()<0.10)?9:5;}    // rocky path
    else {bm='meadow';t=(Math.random()<0.10)?2:(Math.random()<0.14?6:0);}
    row.push(t);brow.push(bm);
  }map.push(row);biome.push(brow);}
  // border pines
  for(var x=0;x<MAPC;x++){map[0][x]=7;map[MAPR-1][x]=7;}
  for(var y=0;y<MAPR;y++){map[y][0]=7;map[y][MAPC-1]=7;}
  // ponds
  for(var p=0;p<6;p++){var px=4+Math.floor(Math.random()*(MAPC-8)),py=4+Math.floor(Math.random()*(MAPR-8));
    for(var dy=0;dy<2+Math.floor(Math.random()*2);dy++)for(var dx=0;dx<3;dx++)if(Math.random()<0.8&&px+dx<MAPC-1&&py+dy<MAPR-1)map[py+dy][px+dx]=3;}
  // clear spawn
  var cx=Math.floor(MAPC/2),cy=Math.floor(MAPR/2);for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){map[cy+dy][cx+dx]=0;biome[cy+dy][cx+dx]='meadow';}
}

function solid(tx,ty){if(tx<0||ty<0||tx>=MAPC||ty>=MAPR)return true;var t=map[ty][tx];return t===2||t===3||t===7||t===9;}

export function hash(x,y){var h=(x*374761393+y*668265263)>>>0;h=(h^(h>>13))*1274126177>>>0;return (h>>>0)/4294967295;}

export function tileAt(tx,ty){ return (tx<0||ty<0||tx>=MAPC||ty>=MAPR)?7:map[ty][tx]; }

export function isWater(tx,ty){return tileAt(tx,ty)===3;}

export function freeTile(){var tx,ty,tries=0;do{tx=2+Math.floor(Math.random()*(MAPC-4));ty=2+Math.floor(Math.random()*(MAPR-4));tries++;}while(solid(tx,ty)&&tries<100);return {x:tx*TILE+TILE/2,y:ty*TILE+TILE/2};}

// spawn a free point within [rmin,rmax] of (ox,oy) — used to make food a trap
export function freeTileNear(ox,oy,rmin,rmax){for(var tries=0;tries<60;tries++){var ang=Math.random()*6.28,r=rmin+Math.random()*(rmax-rmin);var x=ox+Math.cos(ang)*r,y=oy+Math.sin(ang)*r;if(x<TILE||y<TILE||x>MW-TILE||y>MH-TILE)continue;if(!solidAt(x,y))return{x:x,y:y};}var f=freeTile();return f;}

export function waterNear(x,y){var tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){if(tileAt(tx+dx,ty+dy)===3)return true;}return false;}

export function solidAt(px,py){var tx=Math.floor(px/TILE),ty=Math.floor((py+6)/TILE);return solid(tx,ty);}
