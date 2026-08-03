// Weapon stats and armour piece definitions.
// Extracted verbatim from src/main.js (step 2: data/code separation).
// Text and values are unchanged.
// ---- WEAPONS: found on the ground, picked up while foraging ----
//  reach = swing distance · cd = cooldown(ms) · arc = hit half-angle(rad) · color for the sprite
export const WEAPONS={
  fist:     {name:'맨손',   reach:34, cd:340, arc:0.7, col:null,      blade:'#e0b088', len:0,  label:'주먹'},
  stick:    {name:'나무 막대',reach:46, cd:330, arc:0.8, col:'#8a6a3a', blade:'#a47a44', len:16, label:'막대기'},
  rock:     {name:'돌멩이', reach:38, cd:420, arc:0.9, col:'#8a8088', blade:'#9a9098', len:8,  label:'돌'},
  dagger:   {name:'단검',   reach:40, cd:230, arc:0.7, col:'#6a4a24', blade:'#d6d9dd', len:14, label:'단검'},
  woodsword:{name:'나무검', reach:52, cd:300, arc:0.85,col:'#7a5a2a', blade:'#caa86a', len:22, label:'나무검'},
  sword:    {name:'강철검', reach:56, cd:300, arc:0.9, col:'#6a4a24', blade:'#dfe4ea', len:26, label:'검'},
  spear:    {name:'창',     reach:72, cd:420, arc:0.55,col:'#8a6a3a', blade:'#d6d9dd', len:34, label:'창', style:'thrust'},
  axe:      {name:'도끼',   reach:50, cd:480, arc:1.2, col:'#5a3a1a', blade:'#cfd2d6', len:20, label:'도끼'}
};
export const WEAPON_ORDER=['stick','rock','dagger','woodsword','sword','spear','axe'];

// ---- ARMOR pickups scattered in the field (rarer than weapons) ----
export const ARMOR_KINDS=['helm','chest','arms','legs'];
export const ARMOR_NAME={helm:'투구',chest:'흉갑',arms:'팔보호대',legs:'각반'};
