# 글로리아 행성 표류기

캔버스 기반 2D 생존 게임. 우주선이 글로리아 행성에 불시착한 뒤, 규칙도 약속도 없는
곳에서 먹을 것과 무기를 모으며 살아남는다. 사흘째부터 다른 생존자들이 서로를 노리기
시작한다.

홉스의 "자연 상태"(solitary, poor, nasty, brutish, short)를 아이들이 몸으로 겪어보게
만든 교육용 게임이다. 누구나 단 한 번의 칼질로, 특히 등 뒤에서 죽을 수 있다.

원본은 `Glorya.html` 단일 파일이었고, 이 저장소는 그것을 Vite 프로젝트로 리팩토링한
결과다. **빌드 산출물은 여전히 자기완결적인 HTML 파일 하나**다.

## 실행

```bash
npm install
npm run dev      # 개발 서버 (HMR)
```

빌드:

```bash
npm run build    # -> dist/index.html
npm run preview  # 빌드 결과 확인
```

`dist/index.html`은 JS·CSS가 전부 인라인된 단일 파일이라 **외부 요청이 0**이다.
`file://`로 열어도 그대로 동작하고, 어디로든 복사해서 배포할 수 있다.

## 조작

| | 키보드 | 터치 |
|---|---|---|
| 이동 | `WASD` / 방향키 | 좌하단 조이스틱 |
| 공격 | `J` / `Z` / 좌클릭 | ⚔ 버튼 |
| 회피 | `Shift` / `K` | 🌀 버튼 |
| 대화·상호작용 | `Space` (NPC 근처) | ⚔ 버튼 (NPC 근처) |
| 대화 선택 | `↑` `↓` + `Enter` | 탭 |

## 구조

데이터와 로직을 분리하고, 로직은 책임별로 나눴다.

```
src/
  main.js          부팅 · reset · 게임 루프(frame, stepLoop)
  state.js         공유 상태 — 캔버스, S(런 상태), G(가변 스칼라), player, 엔티티 배열
  stories.js       대화 트리 인스턴스
  styles.css       페이지 · 게임 셸 · 모든 UI 스타일
  audio.js         WebAudio 효과음 (에셋 없음)
  input.js         키보드 · 마우스 · 터치 조이스틱
  ui.js            HUD · 스토리 레이어 · 조합 모달 · 뷰포트 맞춤

  data/            순수 데이터 (밸런스 수치와 모든 텍스트)
    balance.js       뷰포트 · 맵 크기 · 난이도 계수 · 스폰 수치
    weapons.js       무기 스탯 · 방어구 종류
    enemies.js       적 아키타입 · 등장 확률표
    items.js         음식 · 동물 · 재료 아이콘 · 조합 레시피
    dialogue.js      도발 대사 · NPC 대화 트리
    story.js         오프닝 장면 · 엔딩 문구
    palette.js       지형 색상 팔레트

  world/map.js     지형 생성 · 타일 조회
  render/          tiles(지형) · trainer(스프라이트) · fx(흔들림·플로팅텍스트) · field(합성)
  entities/        drops · food · critters · raiders · neighbors · companions
  systems/         battle(대화 전투) · combat(근접) · quest · craft
```

### 설계상 알아둘 점

**상태 공유.** ES 모듈의 import 바인딩은 읽기 전용이라, 여러 모듈이 함께 쓰는 값은
그냥 `export var`로 둘 수 없다. 그래서:

- 엔티티 배열은 `x = []`로 재할당하지 않고 `x.length = 0`으로 **제자리에서 비운다**
- 두 모듈 이상이 읽고 **쓰는** 스칼라만 `state.js`의 `G` 객체에 모았다
  (한 모듈만 쓰는 값은 그 모듈에 그대로 둔다)

**`S`의 객체 정체성.** `reset()`은 `S`를 새 객체로 바꾸지 않고 **제자리에서 비우고
다시 채운다.** `data/dialogue.js`의 대화 효과 클로저와 `data/items.js`의 레시피
`make()`가 이 객체를 붙잡고 있기 때문이다. 재할당하면 재시작 후 대사 효과가 옛
객체에 기록되어 화면과 상태가 갈라진다.

**팩토리.** `createStories(S, moodTail)`와 `createRecipes({...})`는 상태와 헬퍼를
주입받아 데이터를 만든다. 덕분에 모든 한국어 텍스트가 `data/` 안에 남는다.

**단일 파일 빌드.** `vite-plugin-singlefile`이 JS·CSS를 HTML에 인라인한다.
`vite.config.js`의 `assetsInlineLimit`과 `cssCodeSplit:false`가 여기에 걸려 있으니
건드릴 때 주의.

## 알려진 이슈

리팩토링 중 원본의 잠복 버그 3건을 발견했고, 리팩토링이 끝난 뒤 모두 처리했다.
배경과 처리 내용은 [`docs/TODO.md`](docs/TODO.md)에 정리돼 있다.

- **hp ±1/±2 무효 구문 16곳** — 대화 결과가 `(작은 상처)` / `(목숨 회복)`을 약속하면서
  실제로는 아무 일도 일어나지 않았다. 원본의 shim이 변화량 3 이상일 때만 반응했기
  때문. → 16곳 모두 실제 효과를 부여했다. **난이도가 다소 올라간다.**
- **날짜별 NPC 소개문이 고정** — intro가 객체 생성 시점에 한 번만 평가돼서, 날이
  갈수록 어두워지도록 준비된 문장 7곳이 한 번도 나오지 않았다. → 게터로 바꿔 대화를
  시작할 때마다 평가되도록 했다.
- **`sendPrompt()` 미정의** — 엔딩 화면의 두 번째 버튼이 호출하는 함수가 원본부터
  없었다. → 가드를 넣어 에러는 나지 않는다. 단독 실행에서는 그 버튼이 아무 동작도
  하지 않으므로, 제거할지 여부는 아직 결정이 필요하다.

## 리팩토링 이력

`259bc0b`이 원본을 그대로 보존한 커밋이고, 이후 단계별로 나뉘어 있다.
각 단계는 빌드 통과와 **한국어 문자열 무변경**을 확인한 뒤 커밋했다.

| 커밋 | 단계 |
|---|---|
| `8bc002e` | Vite 셋업 + `index.html` / `src/main.js` 기계적 분할 |
| `febc14b` | legacy hp/food shim 제거 |
| `69e5007` | 죽은 코드 정리 + TODO 기록 |
| `73a26d5` | 데이터를 `src/data/`로 분리 |
| `4d41dc9` | 공유 상태를 import 가능한 형태로 |
| `2c7e32f` | 책임별 모듈 분리 |
| `cf0b599` | CSS를 `src/styles.css`로 통합 |

원본 `Glorya.html`은 대조용으로 저장소에 남겨두었다.
