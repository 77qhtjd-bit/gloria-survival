// Raider taunts, quest-giver names and the branching NPC dialogue tree.
// Extracted verbatim from src/main.js (step 2: data/code separation).
// Text and values are unchanged.
import { MAXHP } from './balance.js';

// ===== "STATE OF NATURE" TAUNTS — lines that make the point explicit: here there is no
// law, no judge, no punishment, so anyone may do anything to anyone. This is what turns a
// plain survival game into an experience of UNLIMITED FREEDOM (and its terror). =====
export const TAUNTS_ATTACK=[   // shouted when a raider strikes you
  '여긴 규칙이 없어! 내 맘대로야!',
  'ㅋㅋ 막을 사람이 아무도 없지!',
  '누가 날 벌줄 건데? 아무도 없어!',
  '여기선 힘센 놈이 곧 법이야!',
  '뺏고 싶으면 뺏는 거지, 뭐가 문제야?',
  '경찰도, 재판도 없는 곳이잖아!',
  '착하게 굴어서 뭐 하게? 여긴 그런 거 없어!',
  '네 것도 이제 내 거야. 말릴 사람 있어?',
  '여기선 아무나 뭐든 할 수 있어!',
  '자유란 이런 거야. 마음껏 해도 되는 거!'
];
export const TAUNTS_BETRAY=[   // shouted by a companion the moment they turn on you
  '미안, 여긴 약속 같은 거 안 지켜도 돼!',
  '우리 편? ㅋㅋ 그런 게 어딨어!',
  '벌 받을 일 없는데 왜 참아?',
  '네가 방심한 게 잘못이지!'
];

export const QUEST_NAMES={child:'꼬마 루나',medic:'의무관 하나',smith:'정비사 도진',farmer:'승객 보라',archer:'정찰병 시아',sleeper:'잠든 승객',chief:'강윤',deserter:'무너진 승객'};

export function createStories(S, moodTail){
  return {
    child:{name:"꼬마 승객 루나",lvl:1,c:'child',
      intro:"우주선에서 네 옆자리에 앉았던 꼬마, 루나다. 너를 알아보고 달려온다.\n\"오빠/언니다! 살아 있었구나! 나… 혼자였어.\"",
      nodes:{start:{choices:[
        {label:"\"이제 같이 다니자.\" 손을 잡는다",m:'화친',line:"흩어진 사람들이 다시 뭉치는 순간.",eff:function(){S.rep+=3;S.fear-=1;return{ok:1,t:"루나가 환하게 웃으며 따라온다. 혼자가 아니라는 게 이렇게 든든하다. (마음이 놓인다)",foe:-9,next:'together'};}},
        {label:"\"먹을 거 있어? 좀 나눠.\"",m:'경쟁',line:"배고픔이 먼저 말을 한다.",eff:function(){if(S.day<=3){S.rep-=1;return{ok:0,t:"루나가 머뭇거리며 주머니의 사탕 하나를 꺼낸다. \"…이거밖에 없는데.\" 괜히 미안해진다.",foe:-9,next:'together'};}S.hunger+=8;S.rep-=2;return{ok:1,t:"겁먹은 루나가 비상식량을 건넨다. 받아 들고 나니 마음이 영 무겁다. (먹을 것 +1)",foe:-9};}},
        {label:"\"위험해. 너는 저리 가 있어.\"",m:'불신',line:"지켜주려는 마음일까, 떠넘기는 걸까.",eff:function(){return{ok:1,t:"루나가 시무룩하게 물러선다. \"…알겠어.\" 등 뒤가 괜히 신경 쓰인다.",foe:-9};}}
      ]},
      together:{text:"루나가 종알종알 떠든다. \"우리 말고 다른 사람들도 찾을 수 있을까? 다 같이 모이면 안 무섭잖아.\"",choices:[
        {label:"\"그래, 다 같이 모여서 살자.\"",m:'질서',line:"함께 모이면 규칙도 생긴다 — 정치의 씨앗.",eff:function(){S.rep+=2;S.fear-=2;return{ok:1,t:"루나가 신나서 박수 친다. 모이면 무섭지 않다. 그게 시작이다. (마음이 든든)",foe:-9};}},
        {label:"\"일단 너랑 나, 둘이면 충분해.\"",m:'명예',line:"작은 무리부터.",eff:function(){S.rep+=1;return{ok:1,t:"둘이 손을 꼭 잡고 걷는다. 루나가 이제부터 함께다닌다! (든든)",foe:-9,recruit:1};}}
      ]}}},

    medic:{name:"의무관 하나",lvl:6,c:'medic',
      intro:"우주선 의무실에서 봤던 하나가 구급상자를 안고 있다.\n\"다친 데 없어? 보자… 여기선 내가 도울 수 있는 게 이거뿐이라."+moodTail()+"\"",
      nodes:{start:{choices:[
        {label:"\"좀 봐줘.\" 상처를 보인다",m:'화친',line:"약한 모습을 보여도 되는 사람이 있다.",eff:function(){if(S.wounds>0)S.wounds--;S.rep+=1;return{ok:1,t:"하나가 상처를 꼼꼼히 싸매준다. 한결 가뿐하다. (목숨 회복)",foe:-6,next:'blessed'};}},
        {label:"\"그 약, 나 다 줘.\" 손을 뻗는다",m:'경쟁',line:"필요하면 빼앗기도 한다.",eff:function(){if(S.day<=3){S.rep-=1;return{ok:0,t:"하나가 황당해한다. \"…야, 같이 쓰는 거잖아.\" 머쓱하게 손을 거둔다.",foe:-7};}S.hunger+=16;S.rep-=2;return{ok:1,t:"겁먹은 하나가 구급상자를 통째로 내준다. 받고 나니 영 개운치 않다. (먹을 것 +2, 목숨 회복)",foe:-9,next:'cursed'};}},
        {label:"\"독 든 거 아냐?\" 의심하며 물러선다",m:'불신',line:"믿어도 될 사람조차 의심하게 된다.",eff:function(){S.fear+=1;return{ok:1,t:"고개를 젓고 지나쳤다. 하나가 서운한 눈으로 본다.",foe:-9};}}
      ]},
      blessed:{text:"하나가 작은 약 꾸러미를 쥐여준다. \"급할 때 써. 그리고… 다른 사람들한테도 나 여기 있다고 좀 전해줘.\"",choices:[
        {label:"\"꼭 전할게. 고마워.\"",m:'명예',line:"착한 일은 좋은 소문으로 돌아온다.",eff:function(){S.rep+=2;return{ok:1,t:"약을 챙기고 하나의 이야기를 곳곳에 전했다. (목숨 회복)",foe:-9};}},
        {label:"약만 챙기고 말없이 간다",m:'경쟁',line:"받기만 하는 사람.",eff:function(){S.rep-=1;return{ok:1,t:"약만 챙겨 떠났다. (목숨 회복)",foe:-9};}}
      ]},
      cursed:{text:"상자를 빼앗긴 하나가 소리친다. \"너 같은 애한테 잘해줬다니! 다른 사람들한테 다 말할 거야!\"",choices:[
        {label:"\"조용히 해.\" 위협한다",m:'불신',line:"누르면 미움은 더 커진다.",eff:function(){S.fear+=2;S.rep-=1;return{ok:0,t:"하나가 달아나며 더 크게 외친다. 네 나쁜 소문이 퍼진다.",foe:-9};}},
        {label:"약 절반을 돌려준다",m:'화친',line:"돌려주는 게 화해의 시작.",eff:function(){S.hunger-=8;S.rep+=1;return{ok:1,t:"절반을 돌려주자 하나가 한숨을 쉰다. \"…너도 무서웠던 거지.\"",foe:-9};}}
      ]}}},

    smith:{name:"정비사 도진",lvl:9,c:'smith',
      intro:"우주선 정비사 도진이 잔해에서 쇳조각을 두드려 뭔가를 만들고 있다.\n\"오, 살아있었네! 이거 봐, 부서진 선체로 방패를 만들었어."+moodTail()+"\"",
      nodes:{start:{choices:[
        {label:"\"먹을 거랑 바꾸자.\" 거래한다",m:'질서',line:"주고받는 거래도 평화의 한 방법.",eff:function(){if(S.hunger<12)return{ok:0,t:"먹을 게 모자라 도진이 어깨를 으쓱한다. \"다음에 와.\"",foe:0};S.hunger-=16;if(S.wounds>0)S.wounds--;S.rep+=1;return{ok:1,t:"튼튼한 보호구를 받았다. 도진이 씩 웃는다. (먹을 것 -2, 목숨 회복)",foe:-9};}},
        {label:"\"그거 그냥 내놔.\" 빼앗으려 한다",m:'경쟁',line:"센 사람 것도 빼앗을 수 있다.",eff:function(){if(S.day<=3){S.rep-=1;return{ok:0,t:"도진이 어이없어한다. \"…우리 같은 배 탔잖아. 왜 이래?\" 괜히 미안해진다.",foe:-7};}var ok=Math.random()<0.4;if(ok){S.rep-=2;return{ok:1,t:"방패를 낚아채 달아났다. 망치가 등 뒤를 스친다. (목숨 회복)",foe:-7};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"도진의 망치가 어깨를 때린다. (큰 상처)",foe:-1,next:'crushed'};}},
        {label:"\"같이 만들래?\" 손을 보탠다",m:'화친',line:"기술 가진 사람끼리 힘을 합치기.",eff:function(){var ok=S.rep>=-1;if(ok){S.rep+=2;S.fear-=1;return{ok:1,t:"풀무질을 도우니 도진이 마음을 연다. 둘만의 작업장이 생겼다! (목숨 회복)",foe:-8};}return{ok:0,t:"\"소문 안 좋은 너랑은 좀…\" 도진이 거리를 둔다. (작은 상처)",foe:0};}}
      ]},
      crushed:{text:"쓰러진 너에게 도진이 망치를 들고 다가온다. \"…왜 이렇게까지 하냐, 우리.\"",choices:[
        {label:"가진 걸 내주고 사과한다",m:'굴복',line:"살려고 자존심을 내린다.",eff:function(){S.hunger-=24;S.rep+=1;return{ok:1,t:"먹을 걸 내주고 사과하자 도진이 칼 대신 한숨을 내쉰다. (먹을 것 -3)",foe:0};}},
        {label:"흙을 뿌리고 달아난다",m:'불신',line:"도망도 살아남는 방법.",eff:function(){var ok=Math.random()<0.55;if(ok){return{ok:1,t:"눈을 가리고 달아났다.",foe:-9};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"붙잡혀 한 대 더 맞았다. (큰 상처)",foe:0};}}
      ]}}},

    archer:{name:"정찰병 시아",lvl:8,c:'archer',
      intro:S.day<=3
        ?"높은 바위 위에서 시아가 손을 흔든다. \"여기! 위에서 보니까 사방이 다 보여. 도와줄까?\""
        :"바위 위 시아가 활을 반쯤 겨눈 채 너를 살핀다.\n\"…멈춰. 요즘은 아는 얼굴도 함부로 못 믿어. 적인지 아닌지 말해 봐.\"",
      nodes:{start:{choices:[
        {label:"\"나야, 같은 편이야.\" 두 손을 든다",m:'화친',line:"무서운 상대에게 먼저 믿음을 내미는 도박.",eff:function(){var ok=Math.random()<(0.6+S.rep*0.04-(S.day>2?0.15:0));if(ok){S.rep+=2;S.fear-=1;return{ok:1,t:"시아가 활을 내린다. \"…그래, 너구나. 미안. 둘이면 더 안전하겠지.\"",foe:-7,next:'ally'};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"시아가 못 믿는다. 경고 화살이 어깨를 스친다. (작은 상처)",foe:-1};}},
        {label:"바위 뒤로 굴러 숨는다",m:'불신',line:"먼저 살고 본다.",eff:function(){var ok=Math.random()<0.6;if(ok){return{ok:1,t:"화살이 빗나갔다. 거리를 벌려 빠져나왔다.",foe:-9};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"숨는 게 늦었다. 화살이 등에 박힌다. (큰 상처)",foe:0};}},
        {label:"먹을 걸 던져 시선을 끈다",m:'경쟁',line:"상대의 허기를 이용한다.",eff:function(){S.hunger-=16;var ok=Math.random()<0.7;if(ok){S.rep-=1;return{ok:1,t:"시아가 먹을 걸 줍는 틈에 빠져나왔다. (먹을 것 -2)",foe:-9};}return{ok:0,t:"시아는 미끼를 무시하고 쏜다. (작은 상처, 먹을 것 -2)",foe:0};}}
      ]},
      ally:{text:"시아가 바위에서 내려온다. \"내가 위에서 망볼게. 넌 아래를 맡아. 우리 둘이면 사방을 다 보잖아.\"",choices:[
        {label:"\"좋아, 역할을 나누자.\"",m:'질서',line:"역할을 나누면 살 확률이 오른다.",eff:function(){S.rep+=1;S.fear-=1;return{ok:1,t:"믿음직한 눈 하나가 늘었다. 시아가 함께 싸워준다! (목숨 회복)",foe:-9,recruit:1};}},
        {label:"활만 빼앗아 달아난다",m:'경쟁',line:"믿어준 순간을 배신으로 갚는다.",eff:function(){S.rep-=3;S.hunger+=8;return{ok:1,t:"시아의 활을 낚아채 달아났다. 등 뒤로 배신감 가득한 외침. (먹을 것 +1)",foe:-9};}}
      ]}}},

    farmer:{name:"겁먹은 승객 보라",lvl:4,c:'farmer',
      intro:S.day<=3
        ?"보라가 비상식량 상자를 끌어안고 두리번거린다. \"이거… 우리 다 같이 먹어야 하는 거 맞지? 어떻게 나눌까?\""
        :"보라가 식량 상자를 꼭 끌어안고 떤다. 다리를 다쳤는지 잘 움직이지 못한다.\n상자 안엔 며칠치 먹을 것이 가득하다."+moodTail(),
      nodes:{start:{choices:[
        {label:"\"이리 내놔.\" 상자를 빼앗는다",m:'경쟁',line:"약한 사람 것을 빼앗아도 막을 사람이 없다.",eff:function(){S.hunger+=40;S.rep-=2;return{ok:1,t:"상자를 통째로 챙겼다. 보라의 흐느낌이 등 뒤를 따라온다. (먹을 것 +5)",foe:-9,next:'witnessed'};}},
        {label:"멀찍이 돌아서 지나간다",m:'불신',line:"엮이지 않는 게 안전하다.",eff:function(){S.fear+=1;return{ok:1,t:"가까이 가지 않고 돌아갔다.",foe:-9};}},
        {label:"\"같이 나눠 먹자.\" 곁에 앉는다",m:'화친',line:"나누는 것이 평화의 출발.",eff:function(){S.hunger+=8;S.rep+=2;return{ok:1,t:"보라가 떨리는 손으로 먹을 걸 나눠준다. \"고마워… 혼자선 너무 무서웠어.\" (먹을 것 +1, 목숨 회복)",foe:-5,next:'grateful'};}}
      ]},
      witnessed:{text:"상자를 메고 돌아서는데, 그 광경을 본 사람이 다가온다. \"약한 애 걸 빼앗네? 너도 똑같이 당해 봐.\"",choices:[
        {label:"\"덤빌 거면 덤벼.\"",m:'경쟁',line:"나쁜 소문은 모두를 적으로 만든다.",eff:function(){var ok=Math.random()<0.45;if(ok){return{ok:1,t:"간신히 쫓아냈다. (작은 상처)",foe:-9};}if(S.wounds<MAXHP)S.wounds++;S.hunger-=16;return{ok:0,t:"상자를 도로 빼앗기고 다쳤다. (큰 상처, 먹을 것 -2)",foe:0};}},
        {label:"먹을 것 일부를 떼어 건넨다",m:'화친',line:"돌려주는 게 화해의 시작.",eff:function(){S.hunger-=16;S.rep+=1;return{ok:1,t:"몇 개 떼어 주자 상대가 물러난다. (먹을 것 -2)",foe:-9};}}
      ]},
      grateful:{text:"기운을 차린 보라가 손그림 지도를 꺼낸다. \"혼자 다니다 그렸어. 안전한 데가 표시돼 있어. 같이 보자.\"",choices:[
        {label:"\"고마워. 같이 다니자.\"",m:'질서',line:"함께 다니면 외로움도 위험도 준다.",eff:function(){S.hunger+=16;S.fear-=2;return{ok:1,t:"깨끗한 물과 쉴 곳이 표시돼 있다. 보라가 함께 다니기로 했다! (먹을 것 +2)",foe:-9,recruit:1};}},
        {label:"\"마음만 받을게.\"",m:'명예',line:"신세 지기 싫은 마음.",eff:function(){S.rep+=1;return{ok:1,t:"고맙다고만 하고 홀로 떠났다.",foe:-9};}}
      ]}}},

    sleeper:{name:"잠든 승객",lvl:5,c:'sleeper',
      intro:"한 승객이 빵빵한 식량 가방을 베고 풀밭에 곤히 잠들어 있다.\n주위엔 아무도 없다. 정말, 아무도."+moodTail(),
      nodes:{start:{choices:[
        {label:"발소리를 죽여 가방을 빼낸다",m:'경쟁',line:"아무도 안 볼 때, 사람은 어떻게 할까?",eff:function(){var ok=Math.random()<0.7;if(ok){S.hunger+=32;S.rep-=1;return{ok:1,t:"가방이 스르륵 빠져나왔다. (먹을 것 +4)",foe:-9};}return{ok:0,t:"끈이 걸렸다. \"도둑이야!\" 잠이 깬다. (작은 상처)",foe:-2,next:'caught'};}},
        {label:"흔들어 깨워 사정을 말한다",m:'명예',line:"몰래 뺏는 건 떳떳하지 못하다.",eff:function(){var ok=S.rep>=-1;if(ok){S.hunger+=16;S.rep+=2;return{ok:1,t:"\"같은 배 탔던 사이잖아.\" 그가 먹을 걸 나눠준다. (먹을 것 +2)",foe:-6};}return{ok:0,t:"강도로 알고 먼저 손이 나간다. (작은 상처)",foe:-1,next:'caught'};}},
        {label:"깨우지 않고 조용히 지나간다",m:'화친',line:"아무도 안 봐도 바른 길을 고른다.",eff:function(){S.rep+=1;return{ok:1,t:"건드리지 않고 지나갔다.",foe:-9};}}
      ]},
      caught:{text:"잠이 깬 승객이 떨며 막대를 겨눈다. \"이젠… 같은 배 탔던 사람도 못 믿겠어.\"",choices:[
        {label:"가방을 내려놓고 물러선다",m:'굴복',line:"목숨이 물건보다 중요하다.",eff:function(){S.hunger-=8;return{ok:1,t:"가방을 내려놓고 뒤로 물러났다. (먹을 것 -1)",foe:0};}},
        {label:"맞붙는다",m:'경쟁',line:"한 번 시작된 싸움은 끝을 본다.",eff:function(){var ok=Math.random()<0.5;if(ok){S.hunger+=24;return{ok:1,t:"몸싸움 끝에 가방을 빼앗았다. (먹을 것 +3, 작은 상처)",foe:-9};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"상대가 더 독했다. (큰 상처)",foe:0};}}
      ]}}},

    chief:{name:"무리를 모은 강윤",lvl:14,c:'chief',
      intro:S.day<=3
        ?"강윤이 사람들을 불러 모으고 있다. \"이봐, 너도 와! 흩어져 있으면 다 죽어. 모여야 산다고!\""
        :"덩치 큰 사내 둘을 거느린 강윤이 길을 막는다.\n\"이 구역은 우리 무리 거다. 함께하든가, 값을 치르고 지나가든가.\"",
      nodes:{start:{choices:[
        {label:"\"무리에 들어갈게.\"",m:'질서',line:"보호를 받는 대신 규칙을 따른다 — 작은 국가.",eff:function(){S.fear-=2;S.rep-=1;return{ok:1,t:"무리에 들어갔다. 혼자보다 훨씬 안전하다. 대신 강윤의 규칙을 따라야 한다. (목숨 회복)",foe:-9,next:'inside'};}},
        {label:"\"너부터 이겨야겠는데.\" 맞선다",m:'명예',line:"무리 앞에서 물러서면 끝장이다.",eff:function(){var ok=(S.rep+(MAXHP-S.wounds)*4)>=8;if(ok){S.rep+=4;return{ok:1,t:"강윤을 메다꽂자, 부하들이 너를 다시 본다. (사람들이 따른다)",foe:-10,next:'crowned'};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"셋이 한꺼번에 덤빈다. (큰 상처)",foe:-1,next:'beaten'};}},
        {label:"부하들에게 \"강윤이 너희한테 뭘 해줬는데?\"",m:'화친',line:"힘은 사람들의 동의 위에 선다.",eff:function(){var ok=S.rep>=1;if(ok){S.rep+=3;return{ok:1,t:"부하 둘이 고개를 끄덕이며 네 쪽으로 온다. (사람들이 따른다)",foe:-8,next:'crowned'};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"부하들이 강윤에게 일러바친다. 매가 쏟아진다. (큰 상처)",foe:0,next:'beaten'};}}
      ]},
      inside:{text:"강윤이 말한다. \"규칙은 하나야. 우리끼린 안 뺏는다. 어기면 쫓아낸다. …어때, 마음에 들어?\"",choices:[
        {label:"\"좋은 규칙이네.\"",m:'질서',line:"규칙이 무리 안에 평화를 만든다.",eff:function(){S.rep+=2;S.fear-=2;return{ok:1,t:"규칙 한 줄 덕에 무리 안은 평화롭다. 밖과는 완전히 다르다. (마음이 든든)",foe:-9};}},
        {label:"\"근데 규칙 어기면 누가 벌줘?\"",m:'명예',line:"규칙을 지킬 '힘'이 있어야 규칙이 산다.",eff:function(){S.rep+=1;return{ok:1,t:"강윤이 씩 웃는다. \"그래서 내가 있는 거지. 누군가는 규칙을 지키게 만들어야 하니까.\" 묘하게 고개가 끄덕여진다.",foe:-9};}}
      ]},
      crowned:{text:"무리가 너를 본다. \"이제 네가 대장이야. 저쪽 무리 걸 털러 갈까?\"",choices:[
        {label:"\"털어. 가진 거 전부.\"",m:'경쟁',line:"막아줄 게 없으면 힘은 더 큰 폭력이 된다.",eff:function(){S.hunger+=32;S.fear+=1;S.rep-=1;return{ok:1,t:"다른 무리를 털어 가방을 채웠다. 그만큼 적도 늘었다. (먹을 것 +4)",foe:-10};}},
        {label:"\"우리끼린 안 뺏는다. 규칙이야.\"",m:'질서',line:"힘을 모아 평화를 지키는 작은 우두머리.",eff:function(){S.rep+=2;S.fear-=2;return{ok:1,t:"규칙 한 줄에 무리 안에 평화가 깃든다. (마음이 크게 든든)",foe:-10};}}
      ]},
      beaten:{text:"엎어진 너를 강윤이 내려다본다. \"그래도 안 굽혀?\"",choices:[
        {label:"가진 걸 내주고 물러선다",m:'굴복',line:"살려고 자존심을 내린다.",eff:function(){S.hunger-=24;return{ok:1,t:"먹을 걸 내주고 풀려났다. (먹을 것 -3)",foe:0};}},
        {label:"\"안 굽혀.\"",m:'명예',line:"죽기보다 굽히는 게 싫다.",eff:function(){if(S.wounds<MAXHP)S.wounds++;S.rep+=2;return{ok:0,t:"끝까지 안 굽히는 너에 부하들조차 술렁인다. (큰 상처)",foe:-3};}}
      ]}}},

    deserter:{name:"무너진 승객",lvl:12,c:'deserter',
      intro:"한 승객이 떨리는 손으로 날카로운 쇳조각을 쥐고 있다. 눈이 텅 비어 보인다.\n\"…다가오지 마. 다들 날 노린다고. 너도… 너도 그런 거지?\""+moodTail(),
      nodes:{start:{choices:[
        {label:"\"진정해. 나도 그냥 살려는 사람이야.\"",m:'화친',line:"같은 처지가 사람을 뭉치게 한다.",eff:function(){var ok=Math.random()<(0.45+S.rep*0.04);if(ok){S.rep+=2;S.fear-=1;return{ok:1,t:"그가 쇳조각을 천천히 내린다. \"…미안. 너무 무서워서.\" (목숨 회복)",foe:-7};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"의심을 못 거둔다. 먼저 쇳조각을 휘두른다. (작은 상처)",foe:-1};}},
        {label:"무서우니 먼저 친다",m:'불신',line:"먼저 안 치면 내가 당한다 — 불신의 악순환.",eff:function(){S.fear+=2;var ok=Math.random()<0.45;if(ok){S.hunger+=16;S.rep-=1;return{ok:1,t:"허를 찔러 그의 짐을 빼앗았다. 마음이 무겁다. (먹을 것 +2)",foe:-6};}if(S.wounds<MAXHP)S.wounds++;return{ok:0,t:"궁지에 몰린 사람의 반격은 거칠다. 깊이 베였다. (큰 상처)",foe:0};}},
        {label:"먹을 걸 내밀며 천천히 다가간다",m:'명예',line:"두려움은 친절로 풀린다.",eff:function(){if(S.hunger<4)return{ok:0,t:"내밀 먹을 게 없다. 그가 더 사납게 경계한다.",foe:-1};S.hunger-=8;var ok=Math.random()<0.6;if(ok){S.rep+=3;S.fear-=2;return{ok:1,t:"먹을 걸 받아 든 그가 울먹인다. \"…고마워. 사람이 그리웠어.\" (먹을 것 -1)",foe:-8};}return{ok:0,t:"손을 뻗는 순간 겁에 질려 쳐낸다. (작은 상처, 먹을 것 -1)",foe:-1};}}
      ]}}}
  };
}
