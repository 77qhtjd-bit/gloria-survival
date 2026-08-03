// Screen shake, floating text, speech bubbles, day banner and text helpers.
// Moved verbatim from src/main.js (step 3: module split).
import { G, S, ctx } from '../state.js';

// screen shake
export function addShake(v){G.shake=Math.min(16,G.shake+v);}

// floating combat text
export var floaters=[];

export function floatText(wx,wy,txt,col){floaters.push({x:wx,y:wy,txt:txt,col:col||'#fff',t:900,vy:-0.5});}

// give a raider/companion a speech line to show above their head for a moment
export function sayLine(who,pool,chance){
  if(who.say)return;                      // don't stack lines
  if(Math.random()>=(chance||1))return;
  who.say=pool[Math.floor(Math.random()*pool.length)];
  who.sayT=2200;                          // ms the bubble stays up
}

// day-banner overlay
export var dayBanner={text:'',sub:'',t:0};

export function showDayBanner(d){dayBanner.text=d+'일째';
  dayBanner.sub=d>=12?'이제는 아무도 남지 않았다':d>=8?'왜 다들 이렇게 변한 걸까':d>=5?'…무언가 조금씩 달라진다':d>=4?'오늘도 화창하다, 아마도':'화창한 하루';
  dayBanner.t=2600;}

// All NPCs are passengers from the same wrecked ship. Their tone shifts with the days:
// bright & helpful at first, then frightened and grasping as hunger and distrust spread.
export function moodTail(){
  if(S.day<=3) return "";
  if(S.day<=4) return "\n요즘은 다들 예민해졌다. 그 사람 눈빛에도 경계가 묻어난다.";
  return "\n며칠 사이 사람이 변했다. 굶주림이 모두를 다른 사람으로 만들고 있다.";
}

export function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

export function pixelText(t,x,y,s,c,b){ctx.fillStyle=c;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=(b?'bold ':'')+s+'px "Courier New",monospace';ctx.fillText(t,x,y);}

export function wrapText(txt,x,y,maxW,lh,size,col,maxY){
  // if a maxY is given, shrink the font until the text fits vertically (prevents overflow)
  if(maxY){
    for(var attempt=0; attempt<6; attempt++){
      var lines=_wrapCount(txt,maxW,size);
      if(y + lines*lh <= maxY || size<=9) break;
      size-=1; lh-=1;
    }
  }
  ctx.fillStyle=col;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=size+'px "Courier New",monospace';
  var paras=txt.split('\n'),yy=y;
  for(var p=0;p<paras.length;p++){var chars=paras[p].split(''),line='';
    for(var i=0;i<chars.length;i++){var test=line+chars[i];
      if(ctx.measureText(test).width>maxW&&line){ctx.fillText(line,x,yy);line=chars[i];yy+=lh;}else line=test;}
    if(line||paras[p]===''){ctx.fillText(line,x,yy);yy+=lh;}}
  return yy;}

// count how many lines a wrap would take at a given font size
function _wrapCount(txt,maxW,size){ctx.font=size+'px "Courier New",monospace';var paras=txt.split('\n'),n=0;
  for(var p=0;p<paras.length;p++){var chars=paras[p].split(''),line='',c=1;
    for(var i=0;i<chars.length;i++){var test=line+chars[i];
      if(ctx.measureText(test).width>maxW&&line){c++;line=chars[i];}else line=test;}
    n+=c;}
  return n;}

// dark parchment / metal-edged panel
export function panelBox(x,y,w,h,big){var g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#2e2444');g.addColorStop(1,'#1c1430');ctx.fillStyle=g;roundRect(x,y,w,h,big?10:8);ctx.fill();
  ctx.strokeStyle='#100a1c';ctx.lineWidth=big?4:2.5;roundRect(x,y,w,h,big?10:8);ctx.stroke();
  ctx.strokeStyle='rgba(180,130,220,0.45)';ctx.lineWidth=1.2;roundRect(x+4,y+4,w-8,h-8,big?7:5);ctx.stroke();}
