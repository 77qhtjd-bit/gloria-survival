// Character sprite drawing and the colour helpers it needs.
// Moved verbatim from src/main.js (step 3: module split).
import { roundRect } from './fx.js';
import { S, cam, ctx, curWeapon, player } from '../state.js';

// ============= TRAINER SPRITE (pokemon style, no beard) =============
var OUT='#20242c';

// ---- colour helpers for shading ----
var _h2cache={};

export function _h2(c){if(_h2cache[c])return _h2cache[c];var s=c.replace('#','');if(s.length===3)s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2];var v=[parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];_h2cache[c]=v;return v;}

export function _hx(n){n=Math.max(0,Math.min(255,Math.round(n)));var s=n.toString(16);return s.length<2?'0'+s:s;}

function shade(col,amt){var p=_h2(col);return '#'+_hx(p[0]+amt)+_hx(p[1]+amt)+_hx(p[2]+amt);}

// ===== detailed pixel trainer (GBA-style: 3-tone shading, face, hair highlights) =====
export function drawTrainer(cx,cy,u,c,facing,walk){
  var ox=Math.round(cx-cam.x)-7*u, oy=Math.round(cy-cam.y)-21*u;
  function r(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(ox+x*u),Math.round(oy+y*u),Math.ceil(w*u),Math.ceil(h*u));}
  function px(x,y,col){ctx.fillStyle=col;ctx.fillRect(Math.round(ox+x*u),Math.round(oy+y*u),Math.ceil(u),Math.ceil(u));}
  var OUT2 = c.outline || OUT;
  // skin tones
  var skin = c.skin || '#f0c79a', skinSh = shade(skin,-34), skinHi = shade(skin,16);
  // derived cloth tones
  var jk=c.jacket, jkSh=c.jacketSh||shade(jk,-30), jkHi=shade(jk,22);
  var pa=c.pants, paSh=shade(pa,-26);
  var hairHi=shade(c.hair,28);

  // ---- soft layered shadow on ground ----
  ctx.fillStyle='rgba(0,0,0,0.16)';ctx.beginPath();ctx.ellipse(Math.round(cx-cam.x),Math.round(cy-cam.y),7.5*u,2.7*u,0,0,6.3);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.14)';ctx.beginPath();ctx.ellipse(Math.round(cx-cam.x),Math.round(cy-cam.y),5*u,1.7*u,0,0,6.3);ctx.fill();

  var stride=walk?Math.sin(walk):0, ls=Math.round(stride*1.5), rs=-ls;
  var up=(facing==='up'), side=(facing==='left'||facing==='right'), left=(facing==='left');

  // ===== LEGS =====
  // boots
  r(3,18,3,3,OUT2); r(8,18,3,3,OUT2);
  r(3,16,3,2+Math.max(0,ls),pa); r(8,16,3,2+Math.max(0,rs),pa);
  r(3,16,1,2,paSh); r(8,16,1,2,paSh);                       // inner leg shadow
  r(3,19,3,1,shade(c.shoe,-18)); r(8,19,3,1,shade(c.shoe,-18)); // boot sole
  r(3,18,3,1,c.shoe); r(8,18,3,1,c.shoe);
  r(3,18,3,1,shade(c.shoe,20));                              // boot highlight (front foot)

  // ===== TORSO (jacket) =====
  r(2,9,10,9,OUT2);                                          // outline block
  r(3,10,8,7,jk);                                            // base
  r(3,10,3,7,jkSh);                                         // left shadow column
  r(8,10,3,1,jkHi);                                          // shoulder highlight
  r(3,10,8,1,jkHi);                                          // collar highlight line
  // shirt / chest opening
  r(5,11,4,5,c.shirt); r(5,11,4,1,shade(c.shirt,20));
  if(c.belt!==false){ r(3,15,8,1,c.belt||'#3a2a1a'); r(6,15,1,1,c.buckle||'#caa84a'); } // belt + buckle
  // buttons
  if(c.buttons!==false){ px(6,12,jkHi); px(6,14,jkHi); }
  // arms
  r(1,10,2,6,OUT2); r(11,10,2,6,OUT2);
  r(1,11,1,4,jk); r(12,11,1,4,jk);
  r(1,11,1,4,jkSh);
  // hands
  r(1,15,2,2,skin); r(11,15,2,2,skin); r(1,16,2,1,skinSh); r(11,16,2,1,skinSh);

  // ===== HEAD (drawn slightly smaller so the head isn't oversized) =====
  // scale the whole head/face/hair group down around the head's centre.
  var headScale=0.66;
  var hcx=ox+7*u, hcy=oy+6*u;   // approx head centre in canvas px
  ctx.save();
  ctx.translate(hcx,hcy); ctx.scale(headScale,headScale); ctx.translate(-hcx,-hcy);
  r(3,2,8,8,OUT2);                                           // head outline
  r(4,3,6,6,skin);                                           // face base
  r(4,3,2,6,skinSh);                                         // left face shadow
  r(4,3,6,1,skinHi);                                         // forehead highlight
  r(5,8,4,1,skinSh);                                         // chin/jaw shade
  // neck
  r(5,9,4,1,skinSh);

  // ===== FACE =====
  if(up){
    // back of head — mostly hair, no face features
  } else if(side){
    var ex= left?4:8;
    r(ex,4,2,1,shade(c.hair,-10));                          // eyebrow
    r(ex,5,2,2,'#fff');                                     // eye white
    r(left?4:9,5,1,2,'#3a4a6a');                            // iris
    px(left?4:9,6,'#1a2233');                               // pupil
    px(left?4:9,5,'#eaf2ff');                               // catch-light
    r(ex,5,2,1,shade('#fff',-30));                          // eye top shade
    // nose
    px(left?3:10,6, skinSh);
    // mouth
    r(left?4:8,8,1,1,shade(skin,-50));
    // ear/cheek
    px(left?9:4,6, skinHi); px(left?9:4,7,'#e79a94');
  } else {
    // front-facing — more expressive, rounder features
    // eyebrows
    r(4,4,2,1,shade(c.hair,-10)); r(8,4,2,1,shade(c.hair,-10));
    // eye whites (slightly taller)
    r(4,5,2,2,'#fff'); r(8,5,2,2,'#fff');
    // iris + pupil
    r(5,5,1,2,'#3a4a6a'); r(8,5,1,2,'#3a4a6a');               // iris
    px(5,6,'#1a2233'); px(8,6,'#1a2233');                     // pupil
    px(5,5,'#eaf2ff'); px(8,5,'#eaf2ff');                     // catch-light sparkle
    r(4,5,2,1,shade('#fff',-24)); r(8,5,2,1,shade('#fff',-24));// upper eye shade
    // nose (soft)
    px(6,7,skinSh); px(7,7,shade(skin,-20));
    // mouth — gentle smile
    r(5,8,3,1,shade(skin,-46)); px(5,9,shade(skin,-30)); px(7,9,shade(skin,-30));
    // rosy cheeks + highlights
    px(4,7,'#e79a94'); px(9,7,'#e79a94');
    px(4,6,skinHi); px(9,6,skinHi);
  }

  // ===== HAIR / HEADGEAR (drawn over head) =====
  drawHead(r,px,c,facing,up,side,left,hairHi,OUT2);
  ctx.restore();  // end head-scale group

  // ===== PROP =====
  drawProp(r,c,ox,oy,u);
  if(c.cape){ r(1,9,1,10,c.cape); r(12,9,1,10,c.cape); r(1,9,1,10,shade(c.cape,-24)); }
}

function drawHead(r,px,c,facing,up,side,left,hairHi,OUT2){
  var h=c.hair;
  if(c.head==='cap'){
    r(2,0,10,4,OUT2); r(3,1,8,2,c.cap); r(3,1,8,1,c.capHi);
    r(3,3,6,1,c.cap); r(3,3,6,1,shade(c.cap,-22));          // brim
    if(!up)r(5,1,3,1,c.capLogo);
    r(3,3,1,3,h); r(10,3,1,3,h);                            // side hair
  } else if(c.head==='hood'){
    r(2,-1,10,6,OUT2); r(3,0,8,4,c.cap); r(2,2,2,5,c.cap); r(10,2,2,5,c.cap);
    r(3,0,8,1,c.capHi); r(3,0,3,4,shade(c.cap,-26));        // hood inner shade
  } else if(c.head==='crown'){
    r(3,1,8,2,h); r(3,1,8,1,hairHi);
    r(2,1,10,2,'#caa033'); r(2,1,10,1,'#e8c84a');
    r(3,-1,2,2,'#e8c84a'); r(6,-2,2,3,'#e8c84a'); r(10,-1,2,2,'#e8c84a');
    px(7,-1,'#fff6c8'); r(3,3,1,3,h); r(10,3,1,3,h);
  } else if(c.head==='bandana'){
    r(2,1,10,2,OUT2); r(3,1,8,1,c.cap); r(3,1,8,1,c.capHi); r(2,2,1,4,c.cap);
    r(3,0,8,1,h); r(3,3,1,3,h); r(10,3,1,3,h);
  } else if(c.head==='helm'){
    r(2,0,10,5,OUT2); r(3,1,8,3,c.cap); r(3,1,8,1,'#dfe2e6');
    r(5,1,1,3,OUT2); r(6,1,1,3,'#eef0f3');                  // nose guard + shine
    r(3,1,1,3,shade(c.cap,-20));
  } else if(c.head==='hat'){
    r(1,2,12,1,OUT2); r(1,2,12,1,shade(c.cap,-20));         // brim shadow line
    r(2,1,10,1,c.cap); r(3,-1,8,2,OUT2); r(4,-1,6,2,c.cap); r(4,-1,6,1,shade(c.cap,18));
    r(3,3,1,3,h); r(10,3,1,3,h);
  } else if(c.head==='veil'){
    // hood/veil framing the face (face stays visible)
    r(2,0,10,3,c.cap); r(2,0,1,8,c.cap); r(11,0,1,8,c.cap); r(2,2,2,6,c.cap); r(10,2,2,6,c.cap);
    r(2,0,10,1,c.capHi); r(2,0,1,8,shade(c.cap,-16));
    r(3,2,8,1,shade(c.cap,-12));                            // inner brim shade
  } else if(c.head==='long'){
    r(3,-1,8,5,h); r(2,2,2,10,h); r(10,2,2,10,h);
    r(3,-1,5,2,hairHi); r(2,2,1,10,hairHi);                 // hair sheen
  } else {
    // plain hair
    r(3,0,8,4,h); r(3,3,1,4,h); r(10,3,1,4,h);
    r(3,0,5,2,hairHi);                                      // top sheen
    r(3,0,1,4,shade(h,-22));
  }
}

function drawProp(r,c,ox,oy,u){
  if(c.prop==='spear'){ r(13,-3,1,22,OUT); r(13,-3,1,22,'#8a6a3a'); r(13,-3,1,11,shade('#8a6a3a',18)); r(12,-5,3,3,'#d6d9dd'); r(13,-5,1,3,'#fff'); }
  else if(c.prop==='bow'){ ctx.strokeStyle='#7a5a2a';ctx.lineWidth=Math.max(1,u*0.8);ctx.beginPath();ctx.arc(Math.round(ox+14*u),Math.round(oy+11*u),5*u,-1,1);ctx.stroke(); ctx.strokeStyle='#caa063';ctx.beginPath();ctx.moveTo(Math.round(ox+13.5*u),Math.round(oy+6*u));ctx.lineTo(Math.round(ox+13.5*u),Math.round(oy+16*u));ctx.stroke(); }
  else if(c.prop==='staff'){ r(13,-4,1,23,'#6a4a24'); r(13,-4,1,12,shade('#6a4a24',16)); r(12,-6,3,3,c.gem||'#7ad0e0'); r(12,-6,2,1,'#fff'); }
  else if(c.prop==='lute'){ r(12,10,4,7,'#b5772a'); r(12,10,4,2,shade('#b5772a',20)); r(13,6,1,5,'#8a5a20'); }
  else if(c.prop==='dagger'){ r(13,11,1,6,'#d6d9dd'); r(13,11,1,3,'#fff'); r(12,16,3,2,'#6a4a24'); }
  else if(c.prop==='torch'){ r(13,7,1,12,'#6a4a24'); r(12,4,3,4,'#f0902a'); r(12,3,3,2,'#f5d23a'); r(13,2,1,2,'#fff2a0'); }
}

export var C={
  player:{head:'hood',cap:'#6a3f9a',capHi:'#8a5fba',capLogo:'#e8d8f8',jacket:'#7a4aa8',jacketSh:'#583280',shirt:'#e0d0f0',pants:'#3a3050',shoe:'#2a2038',hair:'#2a1a30',skin:'#f0c79a',belt:'#3a2a4a',buckle:'#c79be8'},
  hunter:{head:'hood',cap:'#5a7a30',capHi:'#6e9040',jacket:'#6b4a2a',jacketSh:'#4e3520',shirt:'#caa878',pants:'#3a2c1c',shoe:'#2a1f14',hair:'#3a2414',prop:'spear',skin:'#e0b488',belt:'#2a1c10',buckle:'#b89050'},
  sleeper:{head:'plain',jacket:'#2f6aa0',jacketSh:'#214e78',shirt:'#cfe0f0',pants:'#3a3550',shoe:'#26303a',hair:'#2a2a40',skin:'#f4cfa0'},
  chief:{head:'crown',jacket:'#5a1a1a',jacketSh:'#3e1010',shirt:'#c0392b',pants:'#2a1414',shoe:'#1a1010',hair:'#1a1010',cape:'#7a1f1f',prop:'spear',skin:'#d8a878',belt:'#2a1010',buckle:'#e8c84a'},
  farmer:{head:'hat',cap:'#b59a4a',jacket:'#4a6a25',jacketSh:'#36501a',shirt:'#d8caa0',pants:'#5a4226',shoe:'#3a2c18',hair:'#7a6230',skin:'#e8bb84',belt:'#3a2a16'},
  bard:{head:'long',jacket:'#5a4a8a',jacketSh:'#3e3464',shirt:'#d0c0e8',pants:'#4a3a6a',shoe:'#3a2f50',hair:'#6a3f9a',prop:'lute',skin:'#f0c79a',belt:'#3a2f5a',buckle:'#c8a84a'},
  raider:{head:'hood',cap:'#2a2426',capHi:'#3a3236',jacket:'#8a1a1a',jacketSh:'#5e1010',shirt:'#3a1a1a',pants:'#2a2024',shoe:'#1a1416',hair:'#1a1a1a',prop:'dagger',skin:'#c89878',outline:'#160a0a',belt:'#1a0c0c',buckle:'#7a2a2a'},
  wolf:{head:'hood',cap:'#3a2a3a',capHi:'#4e3a4e',jacket:'#7a2a5a',jacketSh:'#561a3e',shirt:'#3a1a2a',pants:'#2a1a24',shoe:'#1a1018',hair:'#1a1018',prop:'dagger',skin:'#c08868',outline:'#16080e',belt:'#1a0c14',buckle:'#8a2a5a'},
  ogre:{head:'plain',jacket:'#4a1a4a',jacketSh:'#321032',shirt:'#6a2a6a',pants:'#2a1028',shoe:'#1a0818',hair:'#140814',skin:'#b88060',outline:'#12060f',belt:'#1a0a18',buckle:'#7a2a7a'},
  // NEW roles (hunger-games flavor)
  archer:{head:'bandana',cap:'#2f8a6a',capHi:'#3fa07a',jacket:'#1f6a4a',jacketSh:'#144e36',shirt:'#bfe0d0',pants:'#2a4a3a',shoe:'#1a2f24',hair:'#2a1a10',prop:'bow',skin:'#e8bb84',belt:'#16261c'},
  medic:{head:'veil',cap:'#e0e0e8',capHi:'#fff',jacket:'#d8d8e0',jacketSh:'#b0b0c0',shirt:'#fff',pants:'#9aa0b0',shoe:'#8a90a0',hair:'#5a4a3a',prop:'staff',gem:'#7ad0a0',skin:'#f4cfa0',belt:false,buttons:false},
  smith:{head:'helm',cap:'#7a7a82',capHi:'#9a9aa2',jacket:'#4a4a52',jacketSh:'#34343c',shirt:'#caa050',pants:'#3a3a42',shoe:'#2a2a30',hair:'#3a2a1a',prop:'spear',skin:'#d8a878',belt:'#2a2024',buckle:'#caa050'},
  child:{head:'plain',jacket:'#d88aa8',jacketSh:'#b8607f',shirt:'#fce0ea',pants:'#a06a8a',shoe:'#7a4a60',hair:'#5a3a2a',skin:'#f4d2ac',belt:false,buttons:false},
  trader:{head:'hat',cap:'#caa033',jacket:'#8a6a2a',jacketSh:'#6a4e1c',shirt:'#e8d8a0',pants:'#5a4226',shoe:'#3a2c18',hair:'#3a2a18',prop:'torch',skin:'#e0b488',belt:'#3a2a14',buckle:'#e8c84a'},
  zealot:{head:'hood',cap:'#6a3aa0',capHi:'#7e4eb5',jacket:'#4a2f7a',jacketSh:'#34205a',shirt:'#d0c0e8',pants:'#3a2f5a',shoe:'#2a1f44',hair:'#2a1a3a',prop:'staff',gem:'#d8a0f0',skin:'#e8c098',belt:'#2a1c44'},
  deserter:{head:'helm',cap:'#5a6a4a',capHi:'#6e7e5a',jacket:'#3a4a2a',jacketSh:'#28341c',shirt:'#c0c8a0',pants:'#2a341c',shoe:'#1a2410',hair:'#3a3a2a',prop:'spear',skin:'#d8b088',belt:'#222c16'}
};

// player drawn holding the current weapon, with a swing arc on attack
// armour worn over the player sprite (scale 2.1) — coloured by material:
//  wood pieces (helm, legs) = brown;  vine pieces (chest, arms) = green
function drawWornArmor(sx,sy,facing){
  var a=S.armor;if(!a.helm&&!a.chest&&!a.arms&&!a.legs)return;
  var u=2.1, top=sy-21*u;
  // wood tones
  var wood='#9a6b3a', woodSh='#6e4a25', woodHi='#c08a4e';
  // vine/leaf tones
  var vine='#4e9a4e', vineSh='#357035', vineHi='#6fc46f';
  function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(sx-7*u+x*u),Math.round(top+y*u),Math.ceil(w*u),Math.ceil(h*u));}
  // vine chest: woven leaves
  if(a.chest){R(3,10,8,6,vine);R(3,14,8,2,vineSh);R(4,10,5,1,vineHi);R(6,11,2,4,vineSh);
    R(4,12,1,1,vineHi);R(7,13,1,1,vineHi);} // little leaf specks
  if(a.arms){R(1,10,2,3,vine);R(11,10,2,3,vine);R(1,10,2,1,vineHi);R(11,10,2,1,vineHi);R(1,12,2,1,vineSh);R(11,12,2,1,vineSh);}
  // wood legs (bark greaves)
  if(a.legs){R(3,16,3,3,wood);R(8,16,3,3,wood);R(3,16,3,1,woodHi);R(8,16,3,1,woodHi);R(3,18,3,1,woodSh);R(8,18,3,1,woodSh);}
  // wood helm (carved bark cap) — nudged to fit the slightly smaller head
  if(a.helm){R(3.6,1.7,6.8,2.6,wood);R(3.6,3.5,6.8,1,woodSh);R(4.4,1.7,4.2,1,woodHi);if(facing!=='up'){R(6,3.4,1,1.8,'#4a3018');}}
}

export function drawPlayerWithSword(){var sx=player.x-cam.x,sy=player.y-cam.y;
  drawTrainer(player.x,player.y,2.1,C.player,player.facing,player.walk);
  drawWornArmor(sx,sy,player.facing);
  if(player.hurt>0){ctx.save();ctx.globalAlpha=Math.min(0.55,player.hurt/260*0.55);ctx.fillStyle='#ff3a2a';ctx.beginPath();ctx.arc(sx,sy-16,20,0,6.28);ctx.fill();ctx.restore();}
  var fx=0,fy=0;if(player.facing==='up')fy=-1;else if(player.facing==='down')fy=1;else if(player.facing==='left')fx=-1;else fx=1;
  var baseAng=Math.atan2(fy,fx);
  var W=curWeapon();
  var rad=Math.max(18,W.reach*0.62);                       // swing radius scales with reach

  if(player.weapon==='fist'){
    // bare-handed jab
    if(player.atk>0){var prog=1-player.atk;var ext=8+prog*12;
      var px2=sx+Math.cos(baseAng)*ext, py2=sy-14+Math.sin(baseAng)*ext;
      ctx.fillStyle='#e0b088';ctx.beginPath();ctx.arc(px2,py2,3.5,0,6.3);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy-14,ext,baseAng-0.4,baseAng+0.4);ctx.stroke();
    }
    return;
  }

  if(player.atk>0){
    if(W.style==='thrust'){
      // SPEAR: a straight thrust — the weapon lunges forward and pulls back, no arc.
      var prog=1-player.atk;                              // 0→1 over the attack
      var reach=W.reach*0.9;
      var punch=Math.sin(prog*Math.PI);                   // out then back (peak at mid-swing)
      var hx=sx+Math.cos(baseAng)*7, hy=sy-14+Math.sin(baseAng)*7;
      var ext=10+punch*reach;
      var tx=sx+Math.cos(baseAng)*ext, ty=sy-14+Math.sin(baseAng)*ext;
      // motion streak along the thrust line
      ctx.save();ctx.strokeStyle='rgba(255,250,220,0.45)';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();ctx.restore();
      drawWeaponInHand(hx,hy,tx,ty,baseAng,W);
    } else {
      var prog=1-player.atk, sweep=W.arc*2.4, start=baseAng-sweep/2, ang=start+sweep*prog;
      ctx.save();ctx.strokeStyle='rgba(255,250,220,0.5)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(sx,sy-14,rad,start,ang);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy-14,rad,Math.max(start,ang-0.5),ang);ctx.stroke();ctx.restore();
      var bx=sx+Math.cos(ang)*8, by=sy-14+Math.sin(ang)*8;
      var tx2=sx+Math.cos(ang)*rad, ty2=sy-14+Math.sin(ang)*rad;
      drawWeaponInHand(bx,by,tx2,ty2,ang,W);
    }
  } else {
    var rest=baseAng-0.5, len=rad*0.8;
    var hx=sx+Math.cos(baseAng)*7, hy=sy-10+Math.sin(baseAng)*7;
    var ex=hx+Math.cos(rest)*len, ey=hy+Math.sin(rest)*len;
    drawWeaponInHand(hx,hy,ex,ey,rest,W);
  }
}

function drawWeaponInHand(bx,by,tx,ty,ang,W){
  if(W.col){ // handle
    ctx.strokeStyle=W.col;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-Math.cos(ang)*4,by-Math.sin(ang)*4);ctx.lineTo(bx+Math.cos(ang)*5,by+Math.sin(ang)*5);ctx.stroke();
  }
  // guard for swords
  if(player.weapon==='sword'||player.weapon==='woodsword'){ctx.strokeStyle='#b07ad8';ctx.lineWidth=3;var gx=bx+Math.cos(ang)*5,gy=by+Math.sin(ang)*5;ctx.beginPath();ctx.moveTo(gx-Math.sin(ang)*3,gy+Math.cos(ang)*3);ctx.lineTo(gx+Math.sin(ang)*3,gy-Math.cos(ang)*3);ctx.stroke();}
  // blade/shaft
  ctx.strokeStyle=W.blade;ctx.lineWidth=player.weapon==='spear'?2.4:3;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty);ctx.stroke();
  // heads
  if(player.weapon==='axe'){ctx.fillStyle=W.blade;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-Math.sin(ang)*7,ty+Math.cos(ang)*7);ctx.lineTo(tx+Math.cos(ang)*6,ty+Math.sin(ang)*6);ctx.closePath();ctx.fill();}
  if(player.weapon==='spear'){ctx.fillStyle=W.blade;ctx.beginPath();ctx.moveTo(tx+Math.cos(ang)*4,ty+Math.sin(ang)*4);ctx.lineTo(tx-Math.sin(ang)*3,ty+Math.cos(ang)*3);ctx.lineTo(tx+Math.sin(ang)*3,ty-Math.cos(ang)*3);ctx.closePath();ctx.fill();}
  if(player.weapon==='rock'){ctx.fillStyle=W.blade;ctx.beginPath();ctx.arc(tx,ty,3.5,0,6.3);ctx.fill();}
}

export function drawHPBar(x,y,w,ratio){ctx.fillStyle='#100a1c';roundRect(x-2,y-2,w+4,13,3);ctx.fill();ctx.fillStyle='#241836';roundRect(x,y,w,9,2);ctx.fill();var c=ratio>0.5?'#5ab85a':ratio>0.2?'#c79be8':'#d84838';ctx.fillStyle=c;roundRect(x,y,Math.max(0,w*ratio),9,2);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.18)';roundRect(x,y,Math.max(0,w*ratio),3,2);ctx.fill();}

export function drawTrainerStatic(cx,cy,u,c){var sx=cam.x,sy=cam.y;cam.x=0;cam.y=0;drawTrainer(cx,cy,u,c,'down',0);cam.x=sx;cam.y=sy;}
