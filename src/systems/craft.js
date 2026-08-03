// Crafting bench actions.
// Moved verbatim from src/main.js (step 3: module split).
import { sfxDash, sfxEat } from '../audio.js';
import { MAT_ICON, createRecipes } from '../data/items.js';
import { floatText } from '../render/fx.js';
import { S, armorCount, clamp, player, structures, weapons } from '../state.js';
import { flash, render, updateCraftUI } from '../ui.js';
import { freeTileNear } from '../world/map.js';

// ===== CRAFTING (Minecraft-style: gather materials → open the bench → craft) =====
export function makeWeapon(kind,label){var prev=player.weapon;player.weapon=kind;
  if(prev!=='fist'&&prev!==kind){weapons.push({x:player.x+24,y:player.y+18,kind:prev,bob:0});}
  sfxDash();floatText(player.x,player.y-30,label+' 완성','#c79be8');flash(label+'을(를) 만들었다!');}

export function wearArmor(piece,label){S.armor[piece]=true;sfxDash();floatText(player.x,player.y-30,label+' 착용','#aee0ff');
  flash(label+'을(를) 만들어 둘렀다! 칼 한 번을 막아준다. (갑옷 '+armorCount()+'/4)');}

// make() bodies need game state and these helpers, so the list is built here.
export const RECIPES=createRecipes({S:S,player:player,buildStructure:buildStructure,clamp:clamp,
  flash:flash,floatText:floatText,makeWeapon:makeWeapon,sfxEat:sfxEat,wearArmor:wearArmor});

export function canAfford(rec){for(var k in rec.cost){if((S.inv[k]||0)<rec.cost[k])return false;}return true;}

export function costText(rec){var parts=[];for(var k in rec.cost){parts.push((MAT_ICON[k]||'')+rec.cost[k]);}return parts.join(' ');}

export function alreadyHave(rec){ return (rec.once&&S.built[rec.id]) || (rec.reqPiece&&S.armor[rec.reqPiece]); }

export function buildStructure(kind){
  var g=freeTileNear(player.x,player.y,34,60);
  structures.push({x:g.x,y:g.y,kind:kind,t:performance.now()});
}

export function doCraft(id){
  if(S.mode!=='field'||S.over)return;
  var rec=null;for(var i=0;i<RECIPES.length;i++)if(RECIPES[i].id===id)rec=RECIPES[i];
  if(!rec)return;
  if(alreadyHave(rec)){flash('이미 가지고 있어.');return;}
  if(!canAfford(rec)){flash('재료가 모자라! 필요한 재료: '+costText(rec));return;}
  for(var k in rec.cost){S.inv[k]-=rec.cost[k];}
  rec.make();
  updateCraftUI();render();
}
