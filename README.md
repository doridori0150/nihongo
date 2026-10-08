# にほんご Daily — 放課後アニ研

| 버전 | 주소 | AI 대화 | 학습 기록 |
|---|---|---|---|
| 웹 (GitHub Pages) | https://doridori0150.github.io/nihongo/ | 각자 Anthropic API 키 | 브라우저 + (선택) GitHub Gist 동기화, 오프라인·홈 화면 추가 가능 |
| claude.ai (Artifact) | https://claude.ai/artifact/JgmYPRXE1kdSmiCqGs15do | **내 Claude 계정 사용량** (API 키 불필요) | 내 Claude 계정에 자동 저장 |

코드는 하나이고, claude.ai 안에서 열리면 자동으로 계정 연동 모드로 바뀝니다. claude.ai 버전은 비공개로 시작하니 다른 사람이 쓰려면 Artifact의 공유 메뉴에서 공유해야 하고, 기록을 계정에 저장하려면 그 사람에게 Contributor 이상 권한이 필요합니다(그 외에는 브라우저에만 저장).

덕후를 위한 미연시(비주얼 노벨)형 일본어 학습 웹앱. 한국인 교환학생인 주인공이 일본 고등학교 애니메이션 연구부(放課後アニ研, 부실 305호)에 들어가 3년을 보내는 메인 스토리를 따라가며 N3~N2 단어·문법·회화 표현을 익힙니다.

## 탭 (부실에서 하는 일)

| 탭 | 내용 |
|---|---|
| 🏫 부실 | 부원이 모두 모인 부실 일러스트, 오늘의 한마디, 이어하기 |
| 📖 스토리 | 메인 스토리 1학년 4월 ~ 3학년 졸업, 108화(월 3화). 2학년부터 アカネ·ケイタ, 3학년부터 メイ·ソウタ 합류. 마지막 화는 3학년 동안의 선택(관계 선택지)으로 6명 중 한 명과의 엔딩 대사는 일본어, 탭하면 한국어. 밑줄 표현은 눌러서 암기 카드에 저장, ★로 대사 저장. 선택지에 따라 친밀도 변화 |
| ✏️ 자습 | 오늘의 과제(단어·문법·문장·복습), 암기 카드, N3/N2 단어·문법·오타쿠 용어 코스(체크하면 카드에 등록) |
| 📚 도서관 | 출처가 있는 명대사(애니·만화·드라마·소설), 저장한 대사, 단어장 검색, 유튜브 추천 |
| 💬 대화 | 부원과 잡담(Claude): 부실 배경이 어두워지고 캐릭터가 일본어로 말을 걸면 추천 답 2개 중 고르거나 직접 입력. 틀린 표현은 고쳐 줌. 연습 모드(상황 대답·작문·롤플레이 채점) |

틀린 문제와 카드는 **1 → 3 → 7 → 14 → 28일** 간격으로 다시 나옵니다. 후리가나 표시/숨김, 일본어 음성(TTS), 다크 모드, 연속 학습일·XP, 백업 내보내기/가져오기를 지원합니다.

주인공 이름·성별은 스토리 탭에서 바꿀 수 있습니다(대사의 `%name%`, `%kun%`에 반영).

## 사용자별 설정 (⚙️)

- **동기화**: [GitHub 토큰 만들기](https://github.com/settings/tokens/new?scopes=gist&description=nihongo-daily) (Classic, `gist` 권한만) → 각 기기에서 같은 토큰 입력. 기록은 본인 계정의 비공개 Gist `nihongo-daily-progress.json`에 저장됩니다.
- **AI 대화**: [Anthropic API 키](https://console.anthropic.com/settings/keys)를 입력. 키는 그 기기 브라우저에만 저장되고 동기화되지 않습니다. 모델은 Claude Sonnet.

토큰과 API 키는 GitHub/Anthropic API 호출에만 쓰이며 저장소나 다른 곳으로 보내지 않습니다.

## 배포 (GitHub Pages)

`main`에 push하면 `.github/workflows/deploy.yml`이 빌드·배포합니다 (저장소 Settings → Pages → Source: GitHub Actions).

## 개발

```bash
npm install
npm run dev          # 콘텐츠 빌드 후 개발 서버
npm run build        # 콘텐츠 빌드 + 타입 체크 + 프로덕션 빌드
```

> 경로에 한글이 있는 폴더(예: `C:\회사AI`)에서는 Vite 8의 코드 분할 빌드가 메시지 없이 종료될 수 있습니다. `npm run dev`와 GitHub Actions 배포는 정상이며, 로컬에서 빌드를 확인하려면 `npx vite build --outDir <영문 경로>`를 쓰세요.

### claude.ai 버전 다시 올리기

```bash
npx vite build --outDir <영문 경로>/nd-artifact --emptyOutDir
node scripts/artifact-page.mjs <영문 경로>/nd-artifact
```

출력된 `artifact.html`과 `assets/`·`data/`(스토리 포함)·`bg/`·`sprites/`·`characters/`·`key/` 파일들을 Claude Code의 Artifact 도구로 같은 URL에 게시합니다 (capabilities: `sample`, `db`, `user`).

## 콘텐츠 추가·수정

콘텐츠는 `content-src/`의 JSON이고, 빌드할 때 `public/data/`로 묶입니다. 일본어는 `漢字{かんじ}` 후리가나 표기, `|`로 청크 구분 ([content-src/SPEC.md](content-src/SPEC.md)).

- 단어·문법·문장·명대사: `content-src/vocab|grammar|phrases|quotes/*.json` (`_`로 시작하는 파일은 제외)
- 검증: `npm run validate -- vocab content-src/vocab/새파일.json`
- 단어 ID는 `단어+읽기`로 정해지므로, 기존 단어의 표기/읽기를 바꾸면 학습 기록은 새 항목으로 취급됩니다.

예문은 실제 작품의 대사가 아니라 말투를 참고한 창작 문장입니다. 명대사(`quotes`)만 출처를 밝혀 인용합니다.

### 스토리 쓰기

- 세계관·캐스트·3년 줄거리·회차 목록·확정된 설정: [docs/story/BIBLE.md](docs/story/BIBLE.md)
- 대본 형식: [content-src/story/SPEC.md](content-src/story/SPEC.md) — `content-src/story/y<학년>/y<학년>-<화>.json`
- 회차를 나눠 여러 명(에이전트)이 동시에 쓸 때: 각자 새 설정을 보고하고, 합친 뒤 호칭·1인칭 규칙, 히요리 말투(반말 기준), `if_aff` 기준이 그 시점까지 얻을 수 있는 친밀도의 40~75%인지 점검
- 명령: `bg`, `show`, `hide`, `narr`, `say`, `choice`(정답·팁·친밀도, 또는 두 답 모두 자연스러운 관계 선택지), `if_aff`(친밀도 조건), `if_top`(친밀도 1위 분기 — 엔딩)
- 검증: `node scripts/validate-content.mjs story content-src/story/y1/*.json`
- 회차는 목록 순서대로 열립니다. 새 화를 추가하고 push하면 그대로 이어집니다. 새로 생긴 설정은 BIBLE의 "확정된 설정"에 적어 다음 화와 모순이 없게 합니다.

### 그림

캐릭터·배경·스탠딩·부실 일러스트는 Codex(이미지 생성)에 의뢰서를 써서 만듭니다. 의뢰서: `docs/CHARACTER_ART_BRIEF*.md`, `docs/art/BG_BRIEF.md`, `SPRITE_BRIEF.md`, `KEY_BRIEF.md`. 원본 PNG(`docs/art/**/*.png`)는 저장소에 올리지 않고, 웹용으로 변환한 것만 둡니다.

| 폴더 | 내용 | 형식 |
|---|---|---|
| `public/bg/` | 배경 (키: clubroom, classroom, station …) | 1280px JPEG |
| `public/sprites/` | 스탠딩 `<캐릭터>_<표정>.webp` (표정이 없으면 normal로 대체) | 720×1080 WebP(투명) |
| `public/characters/` | 프로필 초상 | 512px JPEG |
| `public/key/` | 부실 대표 일러스트 (`_tall`은 폰용 세로) | JPEG |

파일을 넣고 콘텐츠를 빌드하면 `data/art.json`에 자동 반영되고, 없는 그림은 그라데이션·초상 카드로 대체됩니다.

## 구조

```
content-src/        원본 콘텐츠(JSON) + 규격, story/ 대본
docs/story/         스토리 바이블
scripts/            콘텐츠 검증·빌드(art.json, story-index 포함), artifact 페이지 생성
src/lib/            jtext(후리가나), story(진행·친밀도), store(기록·복습·카드), cast(부원),
                    ai(Claude 채점·잡담), sync(Gist / claude.ai db), runtime(claude.ai 감지)
src/components/     StoryPlayer(VN 엔진), Stage(배경·스탠딩·대사창), Lesson, Flashcards
src/pages/          Home(부실), Story, Study(자습), Shelf(도서관), Talk(대화), Settings …
```
