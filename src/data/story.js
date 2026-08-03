// Opening scenes and the ending epitaphs.
// Extracted verbatim from src/main.js (step 2: data/code separation).
// Text and values are unchanged.
// ===== OPENING — a bright, hopeful landing on Planet Gloria =====
export const openingScenes=[
  { ic:'🚀', tone:'#c79be8',
    title:'두근두근, 첫 탐험!',
    lines:[
      '너와 친구들을 태운 탐험선이 반짝이는 새 행성으로 향하고 있어. 창밖으로 보랏빛 하늘과 초록 들판이 펼쳐진다.',
      '"우아—! 저기 좀 봐!" 다들 창문에 붙어 신이 났어.',
      '그런데 착륙하려는 순간, 배가 살짝 기우뚱— 쿵!'
    ],
    btn:'폴짝 내려선다', btnIc:'👀' },
  { ic:'🌱', tone:'#9affc0',
    title:'와, 글로리아 행성이다!',
    lines:[
      '푹신한 풀밭 위로 사뿐히 내려앉았어. 다행히 아무도 안 다쳤네! 다만 친구들이 여기저기로 흩어져 버렸어.',
      '여기는 <b style="color:#9affc0;">글로리아 행성</b> — 아무도 살아본 적 없는, 완전히 새로운 땅이야.',
      '하늘은 화창하고 바람은 따뜻해. <b style="color:#f5e9c8;">"우리… 여기서 한번 같이 살아볼까?"</b>'
    ],
    btn:'좋아! 둘러보자', btnIc:'🔍' },
  { ic:'😊', tone:'#f5e9c8',
    title:'우리만의 보금자리 만들기',
    lines:[
      '먼저 살 곳을 만들어 보자! 들판엔 <b style="color:#9affc0;">🪵나무·🪨돌·🍄버섯</b>이 잔뜩 널려 있어. 걸어가서 주우면 돼.',
      '재료가 모이면 화면 오른쪽 아래 <b style="color:#ffd24a;">🔨조합</b> 버튼을 눌러 봐. 쉼터·모닥불·무기·갑옷을 마음대로 만들 수 있어!',
      '흩어진 친구들도 하나둘 만나게 될 거야. 같이 다니면 훨씬 든든하겠지?'
    ],
    btn:'재료를 모으러 간다', btnIc:'🚶' },
  { ic:'👥', tone:'#c79be8',
    title:'처음 이틀은 마음껏!',
    lines:[
      '처음 이틀은 아주 평화로워. 마음 놓고 돌아다니며 재료를 모으고, 쉼터를 짓고, 친구를 사귀어 보자.',
      '다만 이곳엔 규칙도, 어른도, 약속을 지키게 해 줄 사람도 아직 없어. 모두가 자기 마음대로 할 수 있다는 뜻이야.',
      '<span style="color:#e8a0c0;">그래서 사흘째부터는… 조금씩 달라질지도 몰라. 그건 직접 겪어 보자!</span>',
      '<span style="font-size:11.5px; color:#9a8fb0;">조작 — PC: 이동 WASD · 공격/말걸기 Space · 회피 Shift  /  휴대폰: 왼쪽 화면을 끌어 이동 · 오른쪽 버튼으로 공격·회피</span>'
    ],
    btn:'글로리아에서 살아보기!', btnIc:'🔥', primary:true }
];

export function buildEnding(by,day){
  // the manner of death colours the epitaph; the verdict is always the same five words
  var arch;
  if(by==='기습'){arch={t:'등 뒤를 찔린 사람',ep:'끝내 뒤를 보지 못했다. 가장 약해 보이던 사람이 등 뒤에서 너를 쓰러뜨렸다. 규칙 없는 곳에서는 아무리 강해도 안심할 수 없다 — 누구든 누구나 쓰러뜨릴 수 있으니까.',ic:'🫥'};}
  else if(by==='굶주림'){arch={t:'굶주린 사람',ep:'먹을 것은 늘 모자랐다. 빼앗고 또 빼앗아도 배는 다시 고팠다. 챙겨 줄 사람이 없는 곳에서, 굶주림은 늘 따라다닌다.',ic:'🍖'};}
  else if(by==='사람'){arch={t:'배신당한 사람',ep:'너는 손을 내밀거나 등을 맡겼다. 하지만 약속을 지키게 만들 사람이 아무도 없는 곳에서는, 믿음이 가장 먼저 칼이 되어 돌아온다.',ic:'✋'};}
  else {arch={t:'싸우다 쓰러진 사람',ep:'끝까지 칼을 손에서 놓지 못했지만, 그 칼조차 너를 지켜주지 못했다. 모두가 서로의 적인 곳에서, 끝은 늘 이렇게 온다.',ic:'💀'};}
  var lived=day>=14?'오래도 버텼다. 그래도 단 하루도 등 뒤를 마음 놓고 둘 수 없었다.':day>=7?'제법 버텼지만, 편히 잠든 밤은 한 번도 없었다.':'짧았다. 규칙 없는 곳에서의 삶이 대개 그렇듯.';
  return {arch:arch,lived:lived};
}
