# 픽셀 부실 v3 제작·검수 기록

## 제작 방식
- 내장 image_gen 이미지 편집 사용. 낮 y1 → y2 → y3 순으로 부원 추가, 각 낮판을 원본 저녁 조명 참조로 편집.
- 최종 장면 6장은 생성 원본 1536×1024 PNG 그대로 저장. 캐릭터 축소·양자화·블러 후처리 없음.
- 각 생성 결과를 직접 열람해 인원, 머리색, 착석/바닥 접촉, 가구 위치를 검토.
- members.json 좌표는 최종 낮판을 눈으로 측정한 보이는 인물과 손에 든 소품의 직사각형 외곽(픽셀 단위). 그림자·가구·테이블 위 독립 소품 제외. 가려진 몸은 추정하여 늘리지 않음. 수동 측정 오차 수 픽셀 가능. 겹친 영역은 앱에서 별도 클릭 우선순위 필요.

## 재시도
- 최초 y1: 인물이 너무 크고 왼쪽 의자가 이동하여 폐기 후 원본에서 재생성.
- 두 번째 y1: 미나토의 부자연스러운 테이블 아래 신발 제거 및 왼쪽 의자 복원 요청.
- y2: 닫힌 노트북을 원래 열린 형태로 복원, 오른쪽 의자 원위치 수정 요청.

## 남은 미충족 사항 — 완전 승인본 아님
- 가구의 픽셀 단위 완전 동일성은 충족하지 못함. 특히 왼쪽 앞 의자 형상 및 y2/y3 오른쪽 앞 의자 위치/형상이 원본과 다름. 오른쪽 의자는 수정 요청 후에도 우측으로 약 40–60px 치우친 부분이 남음. 기존 가구 클릭 영역과 정확히 일치한다고 보장할 수 없음.
- 단계별 생성에서 배경 질감, 작은 선과 얼굴 세부가 다시 그려짐. 이전 부원은 동일 위치/활동/정체성을 유지하지만 픽셀 동일하지 않음.
- 캐릭터 얼굴은 읽히지만 원본 chibi의 거친 도트보다 선이 매끈한 편. 원본과 동일한 픽셀 클러스터 스타일을 완전히 달성하지 못함.
- 사에코는 냉장고 바로 왼쪽에서 기대는 자세지만 냉장고에 몸을 직접 기대는 접촉은 명확하지 않음.
- 히요리는 진열장 앞에 웅크리지만 시선은 진열장보다 화면 쪽임.
- 미나토의 하체는 책상에 가려져 바닥 접촉을 직접 확인할 수 없음. 메이의 발과 커피 테이블 뒤쪽 책이 가까워 깊이감이 다소 모호함.
- 낮/저녁 인물 위치는 시각적으로 일치하며 같은 박스를 사용할 수 있으나 조명 외 미세 재묘사까지 배제할 수 없음.

## 검수 파일
- members_debug_y1.png ~ members_debug_y3.png: 실제 최종 낮판 위 인물 ID/박스.
- contact_sheet.png: 낮 3장 위쪽, 저녁 3장 아래쪽, 파일명 표시. 비교표만 썸네일로 축소, 장면 원본은 축소하지 않음.
- 모든 최종 PNG 크기는 verification.json 참조.

## 실제 사용 프롬프트

### y1 최초

Edit image 1, the supplied day clubroom, into a cohesive lively pixel-art game scene. Output exactly 1536x1024. Other images are character identity references in order Saeko, Minato, Shizuku, Ritsu, Hiyori. Preserve the room pixel-for-pixel wherever not occluded by a character. LOCK all furniture position, shape, scale, perspective, window, figure case x0-156 y236-756, fridge x436-564 y212-488, whiteboard x572-960 y164-380, posters x964-1084 y136-392, bookshelf x1104-1376 y124-500, sofa x1144-1536 y380-688, table/chairs x456-1084 y392-720. Never move or redesign furniture.
Add exactly FIVE original chibi people in naturally integrated activity poses with detailed readable faces, crisp high-quality pixel art matching the character reference quality, NOT blurry simplified blobs. Standing height about 210-230px, seated height smaller.
Saeko: adult teacher burgundy messy low ponytail, charcoal pantsuit, white shirt, ID lanyard, lollipop stick in mouth, coffee can in hand, leaning beside the fridge, feet contacting floor near (435,510), top about y285.
Minato: navy blue hair, blue eyes, glasses, navy blazer gold piping blue tie, standing immediately before whiteboard near (842,434), about 220px tall, holding marker and pointing up at schedule grid, lower body naturally occluded by table if needed.
Shizuku: long dark PURPLE hair covering one eye, purple eye, cream cardigan purple bow navy skirt. Sit on existing front LEFT chair around x507 y570, hips supported by its actual seat, reading manga at table; visible knees/legs below seat, table correctly occludes body portions behind it.
Hiyori: PINK twin tails burgundy bows golden star hairclip, navy uniform pink bow pleated skirt, crouching at floor in front of figure case around x155 y650, peeking toward case with smug grin. Crouched total height about 160px.
Ritsu: short charcoal hair gray eyes, ear studs choker loose burgundy tie navy blazer skirt black tights boots, seated ON actual green sofa cushion toward right x1435 y532, bass guitar across lap, hips firmly on cushion, knees bend and feet down, roughly 200px seated silhouette.
Keep room camera/framing unchanged, full 1536x1024 scene. Warm daylight from left; contact shadows. No halos, no pasted standing sprites, no added text/logos. Leave other chairs empty for future people.

### y1 재생성

Edit image 1, the supplied day clubroom, into a cohesive lively pixel-art game scene. Output exactly 1536x1024. Other images are character identity references in order Saeko, Minato, Shizuku, Ritsu, Hiyori. Preserve the room pixel-for-pixel wherever not occluded by a character. LOCK all furniture position, shape, scale, perspective, window, figure case x0-156 y236-756, fridge x436-564 y212-488, whiteboard x572-960 y164-380, posters x964-1084 y136-392, bookshelf x1104-1376 y124-500, sofa x1144-1536 y380-688, table/chairs x456-1084 y392-720. Never move or redesign furniture.
Add exactly FIVE original chibi people in naturally integrated activity poses with detailed readable faces, crisp high-quality pixel art matching the character reference quality, NOT blurry simplified blobs. Standing height about 210-230px, seated height smaller.
Saeko: adult teacher burgundy messy low ponytail, charcoal pantsuit, white shirt, ID lanyard, lollipop stick in mouth, coffee can in hand, leaning beside the fridge, feet contacting floor near (435,510), top about y285.
Minato: navy blue hair, blue eyes, glasses, navy blazer gold piping blue tie, standing immediately before whiteboard near (842,434), about 220px tall, holding marker and pointing up at schedule grid, lower body naturally occluded by table if needed.
Shizuku: long dark PURPLE hair covering one eye, purple eye, cream cardigan purple bow navy skirt. Sit on existing front LEFT chair around x507 y570, hips supported by its actual seat, reading manga at table; visible knees/legs below seat, table correctly occludes body portions behind it.
Hiyori: PINK twin tails burgundy bows golden star hairclip, navy uniform pink bow pleated skirt, crouching at floor in front of figure case around x155 y650, peeking toward case with smug grin. Crouched total height about 160px.
Ritsu: short charcoal hair gray eyes, ear studs choker loose burgundy tie navy blazer skirt black tights boots, seated ON actual green sofa cushion toward right x1435 y532, bass guitar across lap, hips firmly on cushion, knees bend and feet down, roughly 200px seated silhouette.
Keep room camera/framing unchanged, full 1536x1024 scene. Warm daylight from left; contact shadows. No halos, no pasted standing sprites, no added text/logos. Leave other chairs empty for future people. CRITICAL correction: people must be SMALL: Saeko FULL bounding box approximately x389 y286 width110 height224; do not draw 300px people. Shizuku FULL seated bounds x466 y415 width155 height255, seat remains EXACTLY x480-606 y568-610 as original; do NOT shift chair left or add new chair. Ritsu head top y402, hips y505, shoes y605, not giant. Hiyori crouched box x140 y516 width150 height175. Minato bounds x819 y226 width130 height220. Respect these pixel sizes. Use small crisp pixel clusters rather than smooth illustration. Every chair stays precisely at original position.

### y1 수정

Precise correction to image 1 only. Output 1536x1024. Image 2 is original furniture geometry reference. Preserve all five people identities and all positions and entire background of image 1 except these two fixes: REMOVE the stray pair of black shoes at x780-851 y557-582 under the table, restore original floor there from image 2. Minato is standing behind the desk near whiteboard and his entire lower body is hidden by tabletop, NO feet visible under table. Restore the left front chair to exact original image2 geometry, seat x480-607 y568-610, front legs x463 and x600 down to y696. Shizuku remains sitting with hips resting on this seat, purple hair and manga, adjust her position slightly right as needed without moving table. Keep all characters crisp pixel art. Nothing else changes.

### y2 추가

Edit image1 (year1 day) ONLY ADD TWO characters, retaining all five existing members completely unchanged including faces poses clothes positions. Output exactly 1536x1024. Image2 Akane design, image3 Keita design. Small crisp pixel art like existing people. Every furniture pixel and shape must remain fixed: especially table x510-1030 y428-715 and right chairs. No new chairs.
Akane: golden blond curly long hair, orange eyes, white hairclip, cream cardigan orange bow dark skirt. Sit on actual FRONT RIGHT chair at x925-1057 seat y569, hips touching seat and back aligned to existing backrest at x1038 y482. Face toward left and table, head around x1005 y440, upper body rising above table edge, hands assembling tiny turquoise robot plastic model ON tabletop in front of her around x952 y494. Bent knees under tabletop, legs hanging down, brown shoes near y674. Tight silhouette about 160px wide x935-1090 and y389-678; table edge properly occludes her torso portions behind it. Do NOT cover face with chair.
Keita: tousled medium brown hair brown eyes, navy school blazer green tie, short trousers, dark long socks, yellow measuring tape around neck. Sit ON existing BACK RIGHT chair with backrest centered x1010 y458, his head center near x997 y348, shoulders around y399, arms sew green costume fabric on tabletop near x973 y451. Seated body mostly occluded by table, no extra feet. Smaller due to perspective, retain depth gap between his face and Akane's. Hands hold needle and green cloth, measuring tape clearly visible. Do not move chair to fit him.
Keep Saeko, Hiyori, Shizuku, Minato and Ritsu untouched. Warm daylight. No text, no logo, no other changes.

### y2 수정

Edit image1, keep image1's SEVEN people and their exact identities and poses. Use image2 only for exact room geometry. Make two precise corrections, changing nothing else. 1 Restore laptop to OPEN position as in image2 x851-940 y427-489, unchanged original lid and keyboard. Keita's sewing cloth may rest to its right. 2 Restore the FRONT RIGHT CHAIR to image2's exact position: backrest at x1027-1078 y480-566, seat x927-1055 y566-603, legs from x932 to y695 and x1073 to y695. Current chair in image1 is shifted 60px right: move chair and seated Akane together about 60px LEFT so hips fit the original seat, preserve face and blond hair and model-building pose. Her hands reach robot model on tabletop. Do not move table, table legs or other members. Restore room original fine PIXEL texture not smooth vector outlines. Output exactly 1536x1024.

### y3 추가

Edit image1 year2 day clubroom. Output exactly 1536x1024. Add ONLY TWO small chibi members, references image2 Mei and image3 Sota. Keep existing seven members pixel-identical in face pose hair outfit size and position. Keep entire room furniture unchanged: window cabinet fridge whiteboard posters bookcase sofa tables ALL chairs. Do not repaint or change texture of background.
MEI: dark brown side-braided hair tied pink ribbon, amber brown eyes, pink headphones around neck, navy blazer pink bow and pleated skirt, white socks brown loafers, backpack. Standing directly in front of bookshelf in narrow empty gap x1110-1230, head top y324, feet planted at y544, full height 220 pixels. Writing with pencil in notebook held open in front of chest. Keep Ritsu and bass fully readable; Mei must not sit or float.
SOTA: light sandy BROWN messy hair, blue small hairclip, brown eyes, navy blazer white shirt blue necktie long trousers brown shoes. Standing near the posters in gap x1047-1146, head top y282, feet at y499 (hidden where Keita/Akane overlap in front). Laughing mid-joke, holding small folded white paper harisen fan upright. Keep both posters in exact positions behind him. Full height about 215px. Depth: Sota behind the right chairs/Keita/Akane, Mei in front of bookcase and behind coffee table as appropriate. No duplicated characters or merged limbs. Crisp quality faces and pixel clusters. Warm left daylight and floor contact shadows. No text/logos. Exact seven prior members unchanged.

### 저녁 y1

Use case lighting-weather. Edit image1 YEAR1 DAY into EVENING, using image2 only as sunset lighting reference. Output EXACTLY 1536x1024 PNG. Change ONLY illumination and outdoor sky. Preserve all FIVE people EXACTLY including silhouette positions hair shapes colors identities faces poses activities and all props. Preserve ALL room geometry, chair coordinates, furniture shapes, table, laptop, books, whiteboard, posters, shelves pixel-aligned to image1. Warm orange sunset from left window, glowing orange ceiling lamps, purple ambient shadows and long window shadows on floor as image2. Hair remains recognizable: Saeko burgundy, Minato navy, Shizuku purple, Hiyori pink, Ritsu charcoal. Do NOT turn blonde/brown/pink hair into another color. No new people no movement no new objects. No text/logos. Keep fine crisp pixel detail, no blur or palette quantization.

### 저녁 y2

Use case lighting-weather. Edit image1 YEAR2 DAY into EVENING, using image2 only as sunset lighting reference. Output EXACTLY 1536x1024 PNG. Change ONLY illumination and outdoor sky. Preserve all SEVEN people EXACTLY including silhouette positions hair shapes colors identities faces poses activities and all props. Preserve ALL room geometry, chair coordinates, furniture shapes, table, laptop, books, whiteboard, posters, shelves pixel-aligned to image1. Warm orange sunset from left window, glowing orange ceiling lamps, purple ambient shadows and long window shadows on floor as image2. Hair remains recognizable: Saeko burgundy, Minato navy, Shizuku purple, Hiyori pink, Ritsu charcoal. Do NOT turn blonde/brown/pink hair into another color. No new people no movement no new objects. No text/logos. Keep fine crisp pixel detail, no blur or palette quantization. Also preserve Akane golden blonde hair orange bow and robot assembly, Keita medium brown hair green tie yellow tape measure and sewing pose. Keep every person precisely aligned to day image.

### 저녁 y3

Use case lighting-weather. Edit image1 YEAR3 DAY into EVENING, using image2 only as sunset lighting reference. Output EXACTLY 1536x1024 PNG. Change ONLY illumination and outdoor sky. Preserve all NINE people EXACTLY including silhouette positions hair shapes colors identities faces poses activities and all props. Preserve ALL room geometry, chair coordinates, furniture shapes, table, laptop, books, whiteboard, posters, shelves pixel-aligned to image1. Warm orange sunset from left window, glowing orange ceiling lamps, purple ambient shadows and long window shadows on floor as image2. Hair remains recognizable: Saeko burgundy, Minato navy, Shizuku purple, Hiyori pink, Ritsu charcoal. Do NOT turn blonde/brown/pink hair into another color. No new people no movement no new objects. No text/logos. Keep fine crisp pixel detail, no blur or palette quantization. Also preserve Akane golden blonde hair orange bow and robot assembly, Keita medium brown hair green tie yellow tape measure and sewing pose. Keep every person precisely aligned to day image. Preserve Mei's brown braid pink headphones notebook-writing by shelf and Sota's sandy brown hair blue tie white paper fan near posters. Their feet remain grounded in same positions. Exactly nine members.

