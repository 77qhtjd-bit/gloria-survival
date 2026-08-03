// HUD, story layer, craft modal and messages.
// Moved verbatim from src/main.js (step 3: module split).
import { actx, sfxDread } from './audio.js';
import { MAXHP } from './data/balance.js';
import { buildEnding, openingScenes } from './data/story.js';
import { addShake, showDayBanner } from './render/fx.js';
import { G, S, armorCount, curWeapon, player, raiders } from './state.js';
import { RECIPES, alreadyHave, canAfford, costText, doCraft } from './systems/craft.js';

export function el(id){return document.getElementById(id);}

// Bind a tap that works on BOTH mouse and touch. On touch we handle 'touchend' and
// preventDefault so the canvas's global touch handlers don't swallow the tap (which was
// making buttons — including the opening "start" button — unresponsive on phones).
export function onTap(node, fn){
  if(!node) return;
  var touched=false;
  node.addEventListener('touchend', function(e){ touched=true; e.preventDefault(); e.stopPropagation(); fn(e); }, {passive:false});
  node.addEventListener('click', function(e){ if(touched){ touched=false; return; } fn(e); });
}

export function render(){
  el('s-day').textContent=S.day;
  // wounds shown as broken hearts; lives = MAXHP - wounds effectively
  el('s-killed').textContent=S.killed;
  var hf=el('hunger-fill');if(hf){hf.style.width=S.hunger+'%';hf.style.background=S.hunger>50?'linear-gradient(90deg,#7a5aa8,#c79be8)':S.hunger>22?'linear-gradient(90deg,#9a6dc4,#c79be8)':'linear-gradient(90deg,#a82850,#d8487a)';}
  // life pips
  var lp=el('life-pips');if(lp){var html='';for(var i=0;i<MAXHP;i++){html+='<span style="font-size:15px;color:'+(i<MAXHP-S.wounds?'#d86a9a':'#3a2c44')+';">'+(i<MAXHP-S.wounds?'❤':'🖤')+'</span>';}lp.innerHTML=html;}
  var ap=el('armor-pips');if(ap){var n=armorCount();ap.innerHTML=n>0?('⛨'.repeat(n)+'<span style="color:#3a4452;">'+'⛨'.repeat(4-n)+'</span>'):'<span style="color:#3a4452;">갑옷 없음</span>';}
  var wl=el('s-weapon');if(wl){var W=curWeapon();wl.textContent=W.label;wl.style.color=player.weapon==='fist'?'#8a7a9a':(player.weapon==='spear'||player.weapon==='sword'||player.weapon==='axe')?'#e8c860':'var(--ink)';}
}

var craftOpen=false, _craftSig='';

export function openCraft(){ if(S.mode!=='field'||S.over)return; craftOpen=true; _craftSig=''; updateCraftUI(); }

export function closeCraft(){ craftOpen=false; var m=document.getElementById('craft-modal'); if(m)m.style.display='none'; }

export function updateCraftUI(){
  var bar=document.getElementById('craft-bar'); if(!bar)return;
  var showBar=(S.mode==='field'&&!S.over);
  bar.style.display=showBar?'flex':'none';
  if(!showBar) closeCraft();
  // inventory counters (cheap, every frame)
  var iw=document.getElementById('inv-wood'),is=document.getElementById('inv-stone'),im=document.getElementById('inv-mushroom'),ifb=document.getElementById('inv-fiber');
  if(iw)iw.textContent=S.inv.wood; if(is)is.textContent=S.inv.stone; if(im)im.textContent=S.inv.mushroom; if(ifb)ifb.textContent=S.inv.fiber;

  var modal=document.getElementById('craft-modal'); if(!modal)return;
  modal.style.display=craftOpen?'flex':'none';
  if(!craftOpen) return;
  // inventory line in modal header
  var invEl=document.getElementById('craft-inv');
  if(invEl)invEl.textContent='🪵'+S.inv.wood+'  🪨'+S.inv.stone+'  🌿'+S.inv.fiber+'  🍄'+S.inv.mushroom;
  // only rebuild the list when something changed (protects taps)
  var sig=S.inv.wood+','+S.inv.stone+','+S.inv.fiber+','+S.inv.mushroom+'|'+RECIPES.map(function(r){return (canAfford(r)?'1':'0')+(alreadyHave(r)?'H':'-');}).join('');
  if(sig===_craftSig) return; _craftSig=sig;
  var list=document.getElementById('craft-list'); if(!list)return;
  list.innerHTML='';
  var cats=['집','무기','갑옷','음식'];
  cats.forEach(function(cat){
    var recs=RECIPES.filter(function(r){return r.cat===cat;});
    if(!recs.length)return;
    var h=document.createElement('div');
    h.style.cssText='font-size:11px; color:var(--gold); font-weight:700; letter-spacing:.5px; margin:10px 2px 6px;';
    h.textContent=cat;
    list.appendChild(h);
    var grid=document.createElement('div');
    grid.style.cssText='display:grid; grid-template-columns:1fr 1fr; gap:7px;';
    recs.forEach(function(rec){
      var have=alreadyHave(rec), afford=canAfford(rec)&&!have;
      var bg=have?'rgba(90,140,90,0.22)':afford?'linear-gradient(180deg,rgba(120,90,170,0.55),rgba(70,50,110,0.65))':'rgba(50,42,66,0.5)';
      var op=have?'0.55':afford?'1':'0.55';
      var b=document.createElement('button');
      b.style.cssText='text-align:left; padding:9px 10px; border-radius:9px; border:1px solid var(--edge); background:'+bg+'; color:var(--ink); opacity:'+op+'; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent;';
      b.innerHTML='<div style="font-size:13px; font-weight:700;">'+rec.icon+' '+rec.name+(have?' ✓':'')+'</div>'
        +'<div style="font-size:11px; color:var(--ink-dim); margin-top:2px;">'+(have?'이미 가짐':costText(rec))+'</div>'
        +'<div style="font-size:10.5px; color:var(--ink-faint); margin-top:3px; line-height:1.35;">'+rec.hint+'</div>';
      var fire=function(){ doCraft(rec.id); };
      onTap(b, fire);
      grid.appendChild(b);
    });
    list.appendChild(grid);
  });
}

// hide the internal "평판/공포/명성/평판/rep/fear" bookkeeping from kids' view.
// strips trailing "(... 평판 ↑ ...)" style notes and stray meter words, keeps the story.
export function cleanMsg(s){
  if(!s)return s;
  // drop any parenthesis group that mentions 평판 or 공포 (and tidy leftover separators)
  s=s.replace(/[(（][^()（）]*(평판|공포)[^()（）]*[)）]/g,'');
  // if a parenthesis lists several effects, remove just the 평판/공포 clauses inside it
  s=s.replace(/[(（]([^()（）]*)[)）]/g,function(m,inner){
    var parts=inner.split(/[,，]/).filter(function(p){return !/평판|공포/.test(p);});
    if(parts.length===0)return '';
    return '('+parts.join(', ').replace(/\s+/g,' ').trim()+')';
  });
  s=s.replace(/\s{2,}/g,' ').replace(/\s+([.…])/g,'$1').trim();
  return s;
}

var logTimer=null;

export function flash(msg){msg=cleanMsg(msg);el('log').innerHTML='<div style="padding:7px 12px; background:linear-gradient(180deg,rgba(42,36,28,0.95),rgba(28,24,18,0.95)); border:1px solid var(--edge); border-radius:9px; display:inline-block; color:var(--ink); box-shadow:0 3px 12px rgba(0,0,0,0.4); animation:none;">'+msg+'</div>';clearTimeout(logTimer);logTimer=setTimeout(function(){el('log').innerHTML='';},2400);}

export function endGame(by){if(S.over&&S.mode==='over')return;S.over=true;S.mode='over';addShake(14);sfxDread();
  var E=buildEnding(by,S.day);
  var causeShort=by==='기습'?'등 뒤를 찔려 사망':by==='굶주림'?'굶주려 쓰러짐':by==='사람'?'배신당해 사망':'싸우다 사망';
  el('story').innerHTML=
    '<div style="text-align:center; background:linear-gradient(180deg,rgba(28,18,40,0.96),rgba(14,8,22,0.98)); border:1px solid var(--edge); border-radius:var(--border-radius-lg); padding:1.2rem 1.1rem; box-shadow:0 10px 40px rgba(0,0,0,0.5);">'
    +'<span class="emo" style="font-size:30px;">'+E.arch.ic+'</span>'
    +'<div style="font-weight:600; font-size:17px; margin-top:8px; color:var(--ink); letter-spacing:.3px;">'+E.arch.t+'의 최후</div>'
    +'<div style="font-size:12px; color:#e87a9a; margin-top:3px;">'+S.day+'일째 · '+causeShort+'</div>'
    +'<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin:13px auto; max-width:330px;">'
    + statCell('버틴 날',S.day) + statCell('쓰러뜨림',S.killed) + statCell('입은 상처',Math.min(MAXHP,S.wounds))
    +'</div>'
    +'<p style="font-size:13px; color:var(--ink-dim); line-height:1.7; margin:0 auto 10px; max-width:460px;">'+E.arch.ep+'</p>'
    +'<p style="font-size:12.5px; color:var(--ink-faint); line-height:1.6; margin:0 auto 14px; max-width:460px; font-style:italic;">'+E.lived+'</p>'
    +'<p style="font-size:13px; color:var(--gold); line-height:1.7; margin:0 auto 6px; max-width:460px;">규칙도 약속도 없는 곳에서 사람의 삶은 <em>"외롭고, 가난하고, 험하고, 무섭고, 그리고 짧다."</em></p>'
    +'<p style="font-size:11.5px; color:var(--ink-faint); line-height:1.6; margin:0 auto 16px; max-width:460px;">— 약 370년 전, 토머스 홉스라는 학자가 이런 곳을 두고 한 말이야.</p>'
    +'<div style="display:grid; gap:8px; max-width:340px; margin:0 auto;">'
    +'<button id="btn-again" class="primary" style="padding:11px; font-weight:600;"><span class="emo" style="font-size:15px; vertical-align:-2px; margin-right:5px;">🔄</span>다시 도전하기</button>'
    +'<button id="btn-lev" style="padding:11px; font-weight:500;"><span class="emo" style="font-size:15px; vertical-align:-2px; margin-right:5px;">💡</span>이런 곳을 어떻게 바꿀 수 있을까?</button></div></div>';
  onTap(document.getElementById('btn-again'), reset);
  // The original ran embedded in a host app that supplied sendPrompt(). Standing
  // alone there is no host, so guard the call instead of throwing; if the game is
  // ever embedded again the button starts working with no further change.
  onTap(document.getElementById('btn-lev'), function(){if(typeof window.sendPrompt!=='function')return;window.sendPrompt('방금 \'글로리아 행성 표류기\'라는 생존 게임을 해봤어. 규칙도 없고, 약속을 지키게 만들 사람도 없는 곳이었어. 누구나 칼 한 번에(특히 등 뒤에서) 서로를 쓰러뜨릴 수 있었어. 나는 '+S.day+'일을 버티고 '+S.killed+'명을 쓰러뜨렸지만 결국 \''+E.arch.t+'\'으로 죽었어. 이런 곳이 왜 이렇게 무섭고 불안정한지, 그리고 이런 곳을 평화롭게 바꾸려면 사람들이 왜 함께 규칙을 만들고 그 규칙을 지킬 \'힘 있는 누군가(정치, 국가)\'를 세우기로 약속하게 되는지, 중학생도 이해할 수 있게 쉽게 설명해줘.');});}

function statCell(label,val){return '<div style="background:rgba(40,28,56,0.7); border:1px solid var(--edge); border-radius:8px; padding:6px 4px;"><div style="font-size:18px; font-weight:700; color:var(--ink);">'+val+'</div><div style="font-size:9.5px; color:var(--ink-faint); margin-top:1px;">'+label+'</div></div>';}

export function showOpening(){ showOpeningScene(0); }

function showOpeningScene(i){
  S.mode='intro';
  var sc=openingScenes[i];
  var dots='';
  for(var d=0;d<openingScenes.length;d++){dots+='<span style="display:inline-block;width:7px;height:7px;border-radius:50%;margin:0 3px;background:'+(d===i?'var(--gold)':'rgba(150,110,190,0.3)')+';"></span>';}
  var body='';
  for(var l=0;l<sc.lines.length;l++){
    body+='<p style="font-size:13.5px; color:'+(l===sc.lines.length-1?'var(--ink)':'var(--ink-dim)')+'; line-height:1.8; margin:0 auto 12px; max-width:470px;">'+sc.lines[l]+'</p>';
  }
  el('story').innerHTML=
    '<div style="background:linear-gradient(180deg,rgba(24,16,34,0.96),rgba(12,8,20,0.98)); border:1px solid var(--edge); border-radius:var(--border-radius-lg); padding:1.3rem 1.2rem; box-shadow:0 10px 40px rgba(0,0,0,0.5);">'
    +'<div style="text-align:center;"><span class="emo" style="font-size:30px;">'+sc.ic+'</span></div>'
    +'<div style="text-align:center; font-weight:700; font-size:17px; margin-top:9px; color:var(--ink); letter-spacing:.3px;">'+sc.title+'</div>'
    +'<div style="height:1px; background:linear-gradient(90deg,transparent,var(--edge),transparent); margin:14px auto; max-width:280px;"></div>'
    +body
    +'<div style="text-align:center; margin:14px 0 12px;">'+dots+'</div>'
    +'<div style="display:grid; gap:8px; max-width:330px; margin:0 auto;">'
    +'<button id="btn-next" class="'+(sc.primary?'primary':'')+'" style="padding:12px; font-weight:600;"><span class="emo" style="margin-right:6px;">'+sc.btnIc+'</span>'+sc.btn+'</button>'
    +(i>0?'<button id="btn-back" style="padding:8px; font-weight:500; font-size:12px; opacity:.7;">← 이전으로</button>':'')
    +'</div></div>';
  onTap(document.getElementById('btn-next'), function(){
    if(i<openingScenes.length-1){ showOpeningScene(i+1); }
    else { startField(); }
  });
  var bb=document.getElementById('btn-back');
  if(bb) onTap(bb, function(){showOpeningScene(i-1);});
}

/* ===== viewport fit: was a second inline <script> at the end of the body ===== */
  /* Fit the whole shell (HUD + 16:9 canvas + footer) within the viewport.
     We size the canvas by available HEIGHT so the entire UI never overflows. */
  (function(){
    var shell, canvas, game;
    function els(){
      shell  = document.getElementById('game-shell');
      canvas = document.getElementById('screen');
      game   = document.getElementById('game');
    }
    function fit(){
      if(!shell){ els(); if(!shell) return; }
      var wrap = document.getElementById('screen-wrap');
      if(!wrap) return;
      var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      var pad = coarse ? 0 : 6;                        // phones: use every pixel
      var availH = window.innerHeight - pad*2 - (coarse?0:4);
      var availW = window.innerWidth  - pad*2;

      var shellStyle = getComputedStyle(shell);
      var shellPadH = parseFloat(shellStyle.paddingLeft) + parseFloat(shellStyle.paddingRight);
      var shellPadV = parseFloat(shellStyle.paddingTop)  + parseFloat(shellStyle.paddingBottom);

      // the shell now contains basically just the 16:9 screen. size the screen to fit
      // both the available width AND height, keeping 16:9.
      var cw = Math.min(availW, 1400) - shellPadH;   // width-limited
      var ch = cw * 9/16;
      if(ch + shellPadV > availH){                    // too tall → height-limited
        ch = Math.max(160, availH - shellPadV);
        cw = ch * 16/9;
      }
      wrap.style.width = cw + 'px';
      var shellW = Math.min(cw + shellPadH, availW, 1400);
      shell.style.width = shellW + 'px';
      shell.style.maxWidth = 'none';
    }
    function boot(){ els(); fit(); }
    if(document.readyState === 'complete' || document.readyState === 'interactive'){
      setTimeout(boot, 60);
    } else {
      window.addEventListener('DOMContentLoaded', boot);
    }
    window.addEventListener('load', function(){ setTimeout(fit, 80); });
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', function(){ setTimeout(fit, 120); });
    // refit a few times early (fonts/icons loading can shift chrome height)
    var t=0, iv=setInterval(function(){ fit(); if(++t>6) clearInterval(iv); }, 200);
  })();

function startField(){
  S.mode='field';el('story').innerHTML='';el('hint').textContent='이동 WASD · 공격/말걸기 Space · 회피 Shift';G.dayTimer=0;G.darkness=0;actx();showDayBanner(1);
  raiders.length=0; // days 1-2 are peaceful — no enemies at all
  setTimeout(function(){if(!S.over)flash('글로리아 1일째, 화창해! 🪵나무·🪨돌·🌿덩굴·🍄버섯을 모아서 🔨조합 창을 열어 봐.');},900);
}
