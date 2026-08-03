// Food, critters, material icons and the crafting recipe list.
// Extracted verbatim from src/main.js (step 2: data/code separation).
// Text and values are unchanged.
// ===== FOOD VARIETY: several kinds, each with its own look, rarity & nourishment =====
export const FOOD_TYPES={
  berry: {name:'산딸기', heal:22, weight:34, col:['#d8487a','#e85b8a','#c03868']},
  apple: {name:'들과일', heal:34, weight:22, col:['#e0503a','#f06a4a','#c0402a']},
  root:  {name:'뿌리채소',heal:30, weight:20, col:['#e0a24a','#f0b85a','#c08838']},
  honey: {name:'벌집',   heal:48, weight:9,  col:['#f0c030','#ffd850','#d8a020']},
  fish:  {name:'물고기', heal:44, weight:15, col:['#8ab8d8','#a8d0e8','#6a98b8']}
};

export const CRITTER_TYPES={
  butterfly:{name:'나비',   fly:true,  flee:34, spd:0.9, r:5},
  rabbit:   {name:'토끼',   fly:false, flee:60, spd:1.7, r:7},
  firefly:  {name:'반딧불', fly:true,  flee:26, spd:0.7, r:4}
};

export const MAT_ICON={wood:'🪵',stone:'🪨',mushroom:'🍄',fiber:'🌿'};

export function createRecipes({S, player, buildStructure, clamp, flash, floatText, makeWeapon, sfxEat, wearArmor}){
  return [
    // ---- structures (build your base) ----
    {id:'shelter', cat:'집', name:'작은 쉼터', icon:'🏠', cost:{wood:3,fiber:1}, once:true,
      hint:'가까이 있으면 배고픔이 더 천천히 줄고 상처가 아문다',
      make:function(){ buildStructure('shelter'); S.built.shelter=true; flash('작은 쉼터를 지었다! 가까이 있으면 안전하고 상처가 아물어.'); }},
    {id:'campfire', cat:'집', name:'모닥불', icon:'🔥', cost:{wood:2,stone:1}, once:true,
      hint:'곁에 있으면 배고픔이 조금 천천히 준다',
      make:function(){ buildStructure('campfire'); S.built.campfire=true; flash('모닥불을 피웠다! 곁에 있으면 배고픔이 조금 천천히 줄어.'); }},
    // ---- weapons ----
    {id:'club',      cat:'무기', name:'나무 몽둥이', icon:'🏏', cost:{wood:2},        once:false, hint:'사거리·속도 균형형. 처음 쓰기 좋은 기본 무기.', make:function(){makeWeapon('woodsword','나무 몽둥이');}},
    {id:'stoneknife',cat:'무기', name:'돌칼',       icon:'🔪', cost:{stone:2,fiber:1},once:false, hint:'사거리는 짧지만 가장 빠르게 연속 공격. 붙어서 싸울 때 강함.', make:function(){makeWeapon('dagger','돌칼');}},
    {id:'spear',     cat:'무기', name:'돌창',       icon:'🔱', cost:{wood:2,stone:1}, once:false, hint:'가장 길게 뻗어 멀리서 안전하게 공격. 대신 휘두르는 속도가 느림.', make:function(){makeWeapon('spear','돌창');}},
    {id:'axe',       cat:'무기', name:'돌도끼',     icon:'🪓', cost:{wood:1,stone:2}, once:false, hint:'느리지만 넓게 휘둘러 여러 명을 한 번에. 떼로 몰려올 때 유리.', make:function(){makeWeapon('axe','돌도끼');}},
    // ---- armor (each piece blocks one hit) ----
    {id:'a_helm', cat:'갑옷', name:'나무 투구',   icon:'🪖', cost:{wood:2},         once:false, hint:'머리 보호. 칼에 맞을 때 딱 한 번, 상처를 대신 막아준다.', reqPiece:'helm',  make:function(){wearArmor('helm','나무 투구');}},
    {id:'a_chest',cat:'갑옷', name:'덩굴 갑옷',   icon:'🦺', cost:{fiber:3},        once:false, hint:'몸통 보호. 칼에 맞을 때 딱 한 번, 상처를 대신 막아준다.', reqPiece:'chest', make:function(){wearArmor('chest','덩굴 갑옷');}},
    {id:'a_arms', cat:'갑옷', name:'덩굴 팔보호대',icon:'💪', cost:{fiber:2},        once:false, hint:'팔 보호. 칼에 맞을 때 딱 한 번, 상처를 대신 막아준다.', reqPiece:'arms',  make:function(){wearArmor('arms','팔보호대');}},
    {id:'a_legs', cat:'갑옷', name:'나무 각반',   icon:'🦵', cost:{wood:1,fiber:1}, once:false, hint:'다리 보호. 칼에 맞을 때 딱 한 번, 상처를 대신 막아준다.', reqPiece:'legs',  make:function(){wearArmor('legs','나무 각반');}},
    // ---- food ----
    {id:'stew', cat:'음식', name:'버섯 스튜', icon:'🍲', cost:{mushroom:2}, once:false, hint:'배고픔을 크게 회복(+45). 버섯 2개면 완성.',
      make:function(){ S.hunger=Math.min(100,S.hunger+45); clamp(); sfxEat(); floatText(player.x,player.y-30,'+배부름','#9affc0'); flash('버섯 스튜를 끓여 먹었다! 배가 든든해.'); }},
    {id:'skewer', cat:'음식', name:'버섯 꼬치', icon:'🍢', cost:{mushroom:1,wood:1}, once:false, hint:'배고픔을 조금 회복(+30). 재료가 적게 든다.',
      make:function(){ S.hunger=Math.min(100,S.hunger+30); clamp(); sfxEat(); floatText(player.x,player.y-30,'+배부름','#9affc0'); flash('버섯 꼬치를 구워 먹었다! 배가 좀 찬다.'); }},
    {id:'feast', cat:'음식', name:'푸짐한 한 상', icon:'🍲', cost:{mushroom:3,fiber:1}, once:false, hint:'배고픔을 가득 회복(+60)하고 상처도 하나 아문다.',
      make:function(){ S.hunger=Math.min(100,S.hunger+60); if(S.wounds>0)S.wounds--; clamp(); sfxEat(); floatText(player.x,player.y-30,'+배부름 +목숨','#9affc0'); flash('푸짐한 한 상을 차려 먹었다! 배가 완전히 부르고 기운이 난다.'); }}
  ];
}
