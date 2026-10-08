# 부실 단체 키 비주얼 제작 기록

## 결과
- `clubroom_all.png`: 1536 × 1024 PNG.
- `clubroom_all_tall.png`: 1024 × 1536 PNG.
- 내장 image_gen 사용. 가로형 생성 → 부분 수정 → 세로형 재구성.
- 다섯 명의 등장, 지정된 행동, 플레이어용 빈 의자, 글자/로고 제거를 육안 확인. 파일 크기는 별도로 확인.
- 프로젝트 내 쓰기는 `docs/art/key/`에 한정. 참고 원본은 수정하지 않음.

## 참고 이미지와 처리
- 최초 호출에서 참고 이미지 7개를 전달했으나 도구가 최대 5개 제한으로 거부하여 이미지가 생성되지 않음.
- 첫 생성에는 승인 캐릭터 5개를 직접 입력. 부실 배경과 분위기 참고는 첨부 이미지를 보고 프롬프트로 기술.
- 후속 가로 수정과 세로 재구성에는 생성된 단체 이미지와 승인 부실 배경을 직접 입력.
- 분위기 참고 이미지의 인물이나 구체적 구도는 복제하지 않음.

## 완전히 충족하지 못한 사항 / 검토 한계
- 원본을 픽셀 단위로 합성한 결과가 아니라 생성형 재작화이므로 얼굴, 의상 세부, 소품의 완전한 동일성은 보장하지 않음.
- 부실의 주요 가구와 좌우 배치는 반영했으나 원본 공간의 정확한 크기와 가구 간격은 달라짐. 특히 세로형 우측 소파가 전후로 길게 나뉘어 보이며 원본의 단일 소파 구조와 차이가 있음.
- 세로형은 같은 장면을 다시 그린 버전이므로 가로형과 픽셀 단위로 일치하지 않으며 일부 소품과 자세가 다름.
- 리츠의 악기 케이스가 세로형에서는 명확하게 드러나지 않음. 사에코 노트의 채점 표시는 글자 제거 과정에서 단순한 색면으로 바뀜.
- 육안으로 읽을 수 있는 글자나 로고는 발견하지 못했으며 OCR 검증은 수행하지 않음.

## 사용 프롬프트

### 1. 가로 생성
Use case: illustration-story. Create a polished anime key visual for an app home screen, landscape exactly 1536x1024 pixels.
The five supplied references in order are Minato, Shizuku, Hiyori, Ritsu, Saeko, used for exact character identities, clothing, props and art style. Match their refined linework, detailed hair and gentle cel shading. The approved room and mood were visually inspected and are described below; recreate that room faithfully.
Depict exactly these five people together after school, all faces clear and recognizable, in the SAME approved room: tall windows and glass figure cabinet left, white refrigerator rear left, whiteboard rear center, tall manga bookcase rear right, dark green sofa on right, worn long wooden activity table center. Warm late afternoon sun and original invented anime posters. Draw an intimate lively composition with little unused floor, slightly high camera.
Minato at rear whiteboard explaining with one hand gesturing to abstract diagrams (NO writing), other hand pushing up thin silver glasses. Match navy parted hair, blue eyes, navy uniform blazer with pale piping, white shirt, blue tie; his blue notebook nearby.
Shizuku seated at long table left, hugging illustrated doujinshi, shy peeking and slight blush. Match long black-purple hair covering one eye, visible purple eye, oversized beige cardigan over uniform and purple bow.
Ritsu is the short black-haired GIRL with gray eyes, multiple silver ear studs, studded black choker and wrist cuff, navy pale-piped blazer and loosened burgundy tie, two safety pins on lapel. Sitting on central/right table edge with modest uniform lower clothing, cool unbothered, tuning a bass guitar: one hand turning tuning peg, other near strings. Black instrument case nearby.
Saeko is the adult advisor teacher slouched on right sofa, visibly tired and done with everything, holding canned coffee and marked notebook nearby. Match burgundy hair in messy low bun with long face-framing strands, small earring, modest white blouse, dark cardigan, burgundy ID lanyard. Preserve lollipop stick as in reference.
Hiyori in foreground leaning toward viewer pointing one index finger at viewer, smug mischievous grin with small fang. Match pink twin tails, burgundy hair ribbons, gold star hairclip, pink eyes, navy pale-piped blazer, white shirt and burgundy bow, school bag with cat charm.
Leave a clearly visible empty chair and small clear table place at near edge for player. Natural overlapping depth but no obscured faces, no extra people, correct hands and instrument anatomy. Preserve reference faces, hairstyles, clothing and characteristic props faithfully while changing poses for the scene. Wholesome fully clothed uniforms; modest teacher; no fan service. No text of any kind, no lettering, no logos, no watermark. Posters and book covers are invented original art without lettering. Full bleed single scene.

### 2. 가로 수정
Edit image 1, the landscape group scene, keeping exactly 1536x1024. Image 2 is the approved original room environment. Preserve all five character identities, faces, hairstyles, outfits, expressions, scene roles, their existing positions, warm anime rendering and empty foreground chair. Targeted corrections: remove ALL lettering/logos, especially the script on bass headstock, book spines and book edges, use unmarked colors/art shapes only. Ritsu's left hand should visibly reach onto a tuning key on the bass headstock and turn it, while right hand remains near bass body strings. Correct natural anatomy. Keep modest uniform coverage and all people fully clothed. Retain the room's approved furniture appearance and muted colors from image 2: white fridge, central wooden activity table, dark green sofa right, whiteboard, shelves and left windows/glass cabinet. Do not change overall scene or replace characters. No text, logos, watermark.

### 3. 세로 재구성
Use case: compositing. Reframe image 1 into a portrait 1024x1536 pixel phone key visual. SAME moment, same five exact character identities, same outfits, props, lighting and illustration style. Image 2 is supporting reference for the same room. Fit everyone in one coherent vertical composition with recognizable faces, do not crop away any member. Extend/reframe spatially, not a simple narrow center crop. Preserve relative staging: Minato furthest back at whiteboard explaining, pushing glasses, navy hair and blue tie; Shizuku on left at table hugging doujinshi, long dark hair over one eye, purple bow and beige cardigan; Ritsu short black hair gray eyes choker studs navy blazer loosened burgundy tie sitting on table edge tuning unbranded bass with hand on tuning key; tired adult teacher Saeko on right green sofa with coffee can, burgundy low bun, dark cardigan modest white blouse and ID lanyard; pink twin-tailed Hiyori nearest foreground pointing at viewer and smug grin, gold star clip, burgundy ribbons/bow and cat charm bag. Preserve Hiyori's face and playful confidence. Leave an empty chair and clear place at near edge of table for player. Slightly elevated camera; warm late afternoon sun from left windows, left glass figure display and fridge, central wooden table, rear whiteboard, bookcase and right green sofa. Keep table and room geometry coherent. All fully clothed and modest, no fan service. No extra people. NO lettering or logos anywhere including bass headstock and book spines; no text, captions or watermark. Original made-up poster art only. Single full bleed portrait scene.

