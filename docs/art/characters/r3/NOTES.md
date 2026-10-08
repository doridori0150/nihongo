# Saeko R3 제작 기록

## 제작 방식
- 내장 image_gen 도구로 각 변형을 별도로 생성. saeko_2는 캐릭터 디자인 기준, shizuku / minato / hiyori_2는 승인 화풍 기준으로 입력.
- 생성 결과를 1024×1024 PNG로 Lanczos 리사이즈. 비교 시트는 원본 참조 4장과 신규 2장을 한 줄로 구성하고 파일명을 표기.
- 프로젝트 파일 쓰기는 docs/art/characters/r3/ 내부로 제한. 도구의 자동 생성 원본은 기본 저장 위치에 유지.

## 프롬프트: saeko_3.png

```text
Use case: identity-preserve. Create a finished square 1024x1024 anime bust-up character portrait. Reference 1 saeko_2 is the exact character design to preserve: an original adult woman teacher around 30, mature face and adult proportions, long dark wine-red hair loosely tied low with long face-framing strands, wine-colored eyes, small understated earring, white blouse, dark charcoal cardigan, burgundy ID lanyard and blank ID card. References 2 shizuku, 3 minato, 4 hiyori_2 are approved STYLE references only: match their refined thin anime linework, controlled soft cel shading, elegant detailed hair, restrained pastel lighting and clean portrait finish. Keep Saeko's identity and plain muted wine-red background. Change only expression and pose. Expression must be unmistakably worn down by adult life, heavy drooping half-lidded dead-fish eyes with minimal sparkle, faint under-eye shadows, unimpressed mildly grumpy brows, flat or slightly crooked mouth in an 'ugh, fine' sigh, NO welcoming smile. She is a rough-tongued but caring mentor whose helpful action conveys warmth despite her grumpy face. Short white LOLLIPOP stick held at one corner of mouth, candy inside mouth; no cigarette, smoke or glowing tip. Slightly wrinkled loosened blouse collar but modest professional clothing, no cleavage, no fan service. A few loose hair strands. Original character only. Bust-up composition matching reference face scale, face high and near center with clear eyes and silhouette readable in a 48px circular face crop. No text, lettering, logos or watermark; all papers use only abstract gray lines and red correction circles/checkmarks, ID blank.
Variant saeko_3: one hand reaching behind her head scratching the back of her hair with an exhausted sigh, elbow bent; other arm cradles a visible stack of student papers covered with abstract red-pen correction circles and check marks against lower chest. Slight slouch, head tilted a little, a distinctly flat weary mouth around the lollipop stick. Hands anatomically clear. Single portrait, no panels or labels.
```

## 프롬프트: saeko_4.png

```text
Use case: identity-preserve. Create a finished square 1024x1024 anime bust-up character portrait. Reference 1 saeko_2 is the exact character design to preserve: an original adult woman teacher around 30, mature face and adult proportions, long dark wine-red hair loosely tied low with long face-framing strands, wine-colored eyes, small understated earring, white blouse, dark charcoal cardigan, burgundy ID lanyard and blank ID card. References 2 shizuku, 3 minato, 4 hiyori_2 are approved STYLE references only: match their refined thin anime linework, controlled soft cel shading, elegant detailed hair, restrained pastel lighting and clean portrait finish. Keep Saeko's identity and plain muted wine-red background. Change only expression and pose. Expression must be unmistakably worn down by adult life, heavy drooping half-lidded dead-fish eyes with minimal sparkle, faint under-eye shadows, unimpressed mildly grumpy brows, flat or slightly crooked mouth in an 'ugh, fine' sigh, NO welcoming smile. She is a rough-tongued but caring mentor whose helpful action conveys warmth despite her grumpy face. Short white LOLLIPOP stick held at one corner of mouth, candy inside mouth; no cigarette, smoke or glowing tip. Slightly wrinkled loosened blouse collar but modest professional clothing, no cleavage, no fan service. A few loose hair strands. Original character only. Bust-up composition matching reference face scale, face high and near center with clear eyes and silhouette readable in a 48px circular face crop. No text, lettering, logos or watermark; all papers use only abstract gray lines and red correction circles/checkmarks, ID blank.
Variant saeko_4: a DIFFERENT pose: shoulders slouched, one hand holds a small plain unbranded metal canned coffee near her lower chest; the other extends an open corrected student notebook toward the viewer, lower foreground, covered only with abstract gray lines and red correction circles/checkmarks. Both arms lowered, neither hand behind head. Head slightly inclined, heavy-lidded sideways unimpressed gaze toward viewer, mouth slightly crooked in a resigned irritated sigh around the lollipop stick, never a smile. Keep face unobscured and large. Hands anatomically clear. Single portrait, no panels or labels.
```

## 검토 및 제한
- 3: 뒷머리를 긁으며 첨삭한 과제 뭉치를 안은 포즈. 4: 무표기 캔커피를 들고 첨삭 노트를 내미는 포즈.
- 긴 와인색 묶음머리, 성인 얼굴, 흰 블라우스, 짙은 카디건, 사원증 끈, 와인색 배경 유지.
- 처진 눈꺼풀, 옅은 눈 밑 음영, 귀찮고 지친 표정과 도움을 주는 행동을 함께 표현.
- 종이에는 읽을 수 있는 글자 대신 추상적인 선과 붉은 첨삭 기호를 사용. 비교 시트의 파일명은 요청에 따른 예외.
- 입의 흰 막대는 사탕 막대 설정이며 담배와 연기 없음. 사탕 알은 입 안에 있어 그림만으로 막대 종류를 확정하기는 어려움.
- 48px 원형 표시에는 얼굴 중심 크롭 권장: 1024 원본 기준 (250, 55, 710, 515). 전체 흉상을 그대로 48px로 줄이면 세밀한 눈 밑 음영은 약해짐.
- 두 변형의 포즈는 명확히 다르지만 얼굴 각도와 표정 강도는 유사함. 화풍/표정 적합성은 시각 검토이며 사용자 승인 판정은 아님.

