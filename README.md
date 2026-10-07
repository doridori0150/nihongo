# にほんご Daily

JLPT N2 이상 학습자를 위한 듀오링고 스타일 일본어 학습 웹앱.
여행·일상 회화 + 드라마/애니/만화/소설풍 예문으로 매일 단어·문법·문장을 익히고, 틀린 문제는 간격 복습으로 다시 풉니다.

## 기능

| | |
|---|---|
| 📖 오늘의 단어 | 하루 N개(설정 5/10/15/20). 소개 카드 → 뜻·읽기·빈칸·역방향 문제 → 문장 조립 |
| 🧩 오늘의 문법 | 하루 1개. 접속·뉘앙스 설명 + 예문 3개 + 빈칸/의미/조립 문제 |
| 💬 오늘의 문장 | 하루 3개. 드라마·만화·소설·일상 속 표현 |
| 🔁 복습 | 틀린 항목은 **1 → 3 → 7 → 14 → 28일** 뒤 다시 출제. 맞히면 다음 단계, 틀리면 1일부터. 28일 단계 통과 시 졸업 |
| 🤖 AI 회화 | 상황 대답 · 한→일 작문 · 내 생각 말하기 · 롤플레이. Claude Sonnet이 채점·첨삭 (각자 API 키) |
| ☁️ 동기화 | GitHub 토큰을 넣으면 비공개 Gist로 PC↔폰 학습 기록 동기화 |
| 📱 모바일 | 홈 화면에 추가하면 앱처럼 실행(PWA), 오프라인에서도 학습 가능 |

후리가나 표시/숨김, 일본어 음성(TTS), 다크 모드, 연속 학습일·XP, 백업 내보내기/가져오기를 지원합니다.

## 사용자별 설정 (앱 안의 설정 탭)

- **동기화**: [GitHub 토큰 만들기](https://github.com/settings/tokens/new?scopes=gist&description=nihongo-daily) (Classic, `gist` 권한만) → 각 기기에서 같은 토큰 입력. 기록은 본인 계정의 비공개 Gist `nihongo-daily-progress.json`에 저장됩니다.
- **AI 회화**: [Anthropic API 키](https://console.anthropic.com/settings/keys)를 입력. 키는 그 기기 브라우저에만 저장되고 동기화되지 않습니다. 채점 1회당 대략 10원 안팎.

토큰과 API 키는 GitHub/Anthropic API 호출에만 쓰이며 저장소나 다른 곳으로 보내지 않습니다.

## 배포 (GitHub Pages)

1. 이 폴더를 GitHub 저장소에 push (`main` 브랜치)
2. 저장소 **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. push할 때마다 `.github/workflows/deploy.yml`이 빌드·배포 → `https://<계정>.github.io/<저장소>/`

## 개발

```bash
npm install
npm run dev          # 콘텐츠 빌드 후 개발 서버
npm run build        # 콘텐츠 빌드 + 타입 체크 + 프로덕션 빌드
```

> 경로에 한글이 있는 폴더(예: `C:\회사AI`)에서는 Vite 8의 코드 분할 빌드가 메시지 없이 종료될 수 있습니다. `npm run dev`와 GitHub Actions 배포는 정상이며, 로컬에서 빌드를 확인하려면 `npx vite build --outDir <영문 경로>`를 쓰세요.

## 콘텐츠 추가·수정

콘텐츠는 `content-src/`의 JSON이고, 빌드할 때 `public/data/`로 묶입니다. 형식은 [content-src/SPEC.md](content-src/SPEC.md)를 따릅니다.

- 일본어 문장은 `漢字{かんじ}` 후리가나 표기, `|`로 문장 조립용 청크 구분
- `content-src/vocab|grammar|phrases/*.json`에 파일을 추가하면 자동 포함 (`_`로 시작하는 파일은 제외)
- 검증: `npm run validate -- vocab content-src/vocab/새파일.json`
- 단어 ID는 `단어+읽기`로 정해지므로, 기존 단어의 표기/읽기를 바꾸면 그 단어의 학습 기록은 새 항목으로 취급됩니다.

예문은 실제 작품의 대사가 아니라, 드라마·만화·소설 등의 말투를 참고해 새로 쓴 창작 문장입니다.

## 구조

```
content-src/        원본 콘텐츠(JSON) + 규격
scripts/            콘텐츠 검증·빌드, 아이콘 생성
src/lib/            jtext(후리가나 파서), quiz(문제 생성), store(기록·복습 일정),
                    daily(오늘의 학습 선정), sync(Gist), ai(Claude 채점), speech(TTS)
src/components/     레슨 진행기, 문제 유형 UI, 카드
src/pages/          홈, 단어장, 복습노트, AI 회화, 설정
```
