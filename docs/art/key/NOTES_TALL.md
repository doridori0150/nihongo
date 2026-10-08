# 세로 키 비주얼 v2

- 출력: clubroom_all_tall_v2.png, 1024 × 1536 PNG.
- 생성: built-in image_gen. 최초 생성 후 크롭 안전영역을 위한 수정 1회.
- 기존 파일은 수정하지 않음.
- 참고: 제공된 6개 디자인을 육안으로 확인. 도구는 참조 경로를 최대 5개까지 지원하여 최초 6개 입력은 생성 전 거부됨. 실제 생성에는 가로 원본과 Shizuku/Hiyori/Ritsu/Saeko 개별 이미지를 사용하고, Minato는 가로 원본과 외형 설명으로 반영함.

## 자체 시각 검수

- Minato: 화이트보드 앞에 서 있으며 얼굴·몸통을 가구가 가로지르지 않음. 안경을 올리는 손과 설명하는 손이 보임.
- Shizuku: 왼쪽 목제 의자의 좌판과 등받이가 보이고, 책을 안은 몸통 앞에 탁자 선이 지나가지 않음.
- Ritsu: 뒤쪽 탁자 가장자리 위에 앉은 구조. 몸통이 탁자 안으로 들어가지 않음. 골반 접촉부 일부는 히요리와 베이스에 가려짐.
- Saeko: 녹색 소파 좌판 위에 앉고 등받이에 기대는 구조. 얼굴·블라우스·커피 캔이 식별됨.
- Hiyori: 뒤 탁자 앞 통로에 위치. 머리부터 허리·골반까지 보이고 가구 선이 몸통이나 허리를 가로지르지 않음. 별도의 전경 탁자가 골반 아래의 연속 부분을 가림. 발이 보이지 않아 서 있는 자세의 접지는 직접 확인할 수 없음.
- 얼굴: 다섯 명 모두 머리색, 눈, 헤어스타일, 액세서리 및 표정으로 구분 가능. Shizuku의 한쪽 눈은 원래 디자인대로 머리카락에 가려짐.
- 손: 주요 동작은 명확하며 눈에 띄는 추가 손·손가락은 없음. 베이스 튜닝 손과 책을 잡은 손의 일부 손가락은 자연스럽게 가려져 모든 관절을 독립적으로 검증할 수 없음.
- 베이스: 검은 몸통, 브리지, 넥, 현, 4개 튜너가 보이며 튜닝 동작이 읽힘. 현과 프렛의 미세한 기계적 정확성까지 보증하지 않음.
- 안전영역: y=1305부터 마지막 행까지 육안 검사 시 인체·의복 없음. 전경 탁자, 책, 쿠키, 머그, 필통, 가방/식물만 존재. 히요리의 의복은 약 y=1250에서 전경에 가려짐. 모든 얼굴·상반신은 상단 85%에 위치.
- 카메라/복장: 약간 내려다보는 구도, 히요리의 다리는 노출되지 않음. 다른 착석 인물의 다리 일부는 보이나 하단 15%에는 없음. 통상 교복 및 단정한 교사 복장.
- 글자/로고: 읽을 수 있는 글자, 브랜드 로고, 워터마크 없음. 포스터·책 표지는 그림만 있으며 머그/가방의 동물 그림은 장식임.

## 미충족 또는 확인 한계

- 발과 골반 접촉부가 일부 가려지므로 히요리의 기립 및 리츠의 착석을 완전히 노출된 해부학적 구조로 증명할 수는 없음.
- 손의 가려진 부분과 베이스 현의 미세 구조는 시각적 타당성 수준으로 검수함.
- Minato 개별 초상은 도구의 5개 경로 제한으로 직접 입력하지 못함. 승인 가로판의 Minato 및 초상에서 확인한 외형 설명을 사용함.

## Prompt 1 — generation

```text
Use case: illustration-story.
Create a new portrait phone key visual, exactly 1024 x 1536 pixels, recomposing the approved landscape scene. Reference 1 is the approved club room scene and rendering/lighting reference; references 2-5 are the identity references for Shizuku, Hiyori, Ritsu, Saeko respectively. Minato's identity is shown clearly in reference 1: match his approved design, blue-black parted hair, blue eyes, fine silver rectangular glasses, confident gentle smile. Preserve these five distinct designs, outfits, props, expressions, warm golden afternoon light and polished detailed anime illustration style. Same club room moment, new portrait staging.
Composition: standing eye height, slightly high looking down, never low angle. Back/top: Minato, blue-black hair, blue eyes, thin glasses, navy blazer and blue tie, at the whiteboard, one hand pushing glasses and other gesturing. Middle left: Shizuku, long dark hair covering one eye, visible violet eye, beige cardigan and purple ribbon, seated visibly ON a wooden chair at the LEFT END of the long table, hugging her illustrated doujinshi. Middle center-right: Ritsu, short black hair, gray eyes, ear studs, studded black choker, navy blazer and loose red tie, modest normal skirt, sitting visibly ON the table EDGE, holding a correct black four-string electric bass across her lap, one hand on body and the other tuning a tuning peg; show an unambiguous supporting tabletop under her seated hips, never through her torso. Middle right: adult teacher Saeko with dark red tied-back hair, modest white blouse and dark cardigan, ID lanyard with blank card, slouching ON the green sofa holding canned coffee. Keep all five faces and upper bodies distinct, unobstructed, recognizable.
Front: Hiyori, pink twin-tails with burgundy bows and gold star hairclip, pink eyes, smug grin with tiny fang, navy school blazer and burgundy ribbon, standing upright BETWEEN viewer and the long table, leaning slightly toward viewer and pointing at viewer. Head-to-hips framing only; do not emphasize or show her legs. The long table is BEHIND Hiyori, and she clearly OCCLUDES its edge. No table line or furniture edge may cross her torso, arms, or waist. Keep foreground Hiyori low enough to leave the other four faces and upper bodies visible, but fit her entire head, pointing hand, upper body and hips within top 85 percent.
CROP SAFETY: horizontal y=1305 is the bottom of the content-safe region. All five heads, hair, faces, hands, upper bodies and Hiyori's hip-level silhouette MUST be above it. Bottom 231 pixels (15%) contain ONLY foreground props, a separate foreground surface and/or wooden floor, no human body parts, no legs. Use natural foreground still-life props to close the composition below Hiyori's hips without any furniture crossing her body: books, pencil case, cookies, mug, school bag. The front props may hide the continuation below her hips but must not hide her waist or torso. Natural continuous scene, no panel, border, inset, or blank band.
Room details from approved scene: left sunlit window, figure display cabinet, potted plants, whiteboard with abstract diagrams only, bookshelves and original anime posters with no lettering. Anatomically coherent hands with correct fingers; correct bass strings, bridge, neck and four tuners. Normal modest uniforms and teacher clothing, wholesome club scene. No text, lettering, logos, watermark, extra people or duplicate faces. No floating characters, furniture-body intersections, buried torsos or leg-focused bottom third.
```

## Prompt 2 — safe-area correction

입력: 최초 생성 이미지.

```text
Edit this portrait with one targeted composition correction: keep the same 1024x1536 image, five identities, expressions, art style, light, room, poses and props. Hiyori currently extends too low. Move Hiyori's whole figure approximately 110 pixels UP and reduce her size slightly (about 8 percent) so that her head remains below Ritsu's bass body, and her complete head-to-hips visible silhouette ENDS by y=1280. Show her waist and hips clearly above that line. She is STANDING in the aisle in FRONT of the rear long table. No furniture line crosses her torso or waist. Raise the separate bottom foreground still-life tabletop so it hides her continuation only BELOW her hips starting at y=1290, and fills the entire bottom 15 percent (y=1305 through 1535) with only tabletop, cookies, mug, pencil case, books and school bag, absolutely zero body parts or clothing. Preserve all other four characters and their clear faces, hands and upper bodies. Ritsu sits ON the rear table edge with a correct four-string bass and four tuners, Shizuku on a wooden chair, Saeko on green sofa. Keep all faces and upper bodies unobstructed. No text or logos. No low angle or leg emphasis.
```

