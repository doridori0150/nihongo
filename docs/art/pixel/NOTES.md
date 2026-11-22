# Pixel asset production notes

생성: 내장 image_gen 도구. 원본은 raw/에 보존. 최종 파일은 이 폴더의 PNG입니다.
후처리: process_assets.py (Python + Pillow + NumPy). 배경 384×256, 캐릭터 256×256에서 최대 48색으로 양자화 후 nearest-neighbour 4배 확대했습니다. 모든 최종 게임 에셋의 RGBA/RGB 4×4 블록이 동일함을 전수 검사했습니다.
캐릭터는 머리/몸통 경계를 기준으로 몸통 세로 비율을 조정하여 약 2.5등신으로 맞췄습니다. 일반 캐릭터 높이 716px(69.92%), 작은 체구인 keita는 688px(67.19%), 발 아래 여백은 32px입니다.
저녁은 낮 이미지를 내장 도구로 편집한 결과의 조명장만 낮 원본에 전달했습니다. 가구와 바닥 선의 원본 좌표를 그대로 사용하며, 조명장 추출은 median filter로 경계를 보존합니다. RGB 밝기/색 변화 외에 이동/변형/워핑은 없습니다.
layout.json은 최종 room_day.png 기준 실측입니다. desk는 의자/상판 소품 포함, sofa는 커피 테이블 포함, bookshelf는 본체 기준(위의 수납박스/식물 제외), window는 창틀 기준(커튼 제외)입니다. 투시상 가려진 물체의 숨겨진 면을 추정하지 않고 보이는 범위로 측정했습니다.
layout_debug.png의 박스와 키를 최종 배경 위에 표시하고 실제 이미지를 열어 시각 확인했습니다. 직사각형은 불규칙한 실루엣 주변의 빈 영역을 포함하며, window/figures, fridge/desk, bookshelf/sofa는 투시상 직사각형이 일부 겹칩니다. 실제 클릭 구현에서는 전경 오브젝트 우선 순위 또는 실루엣 마스크가 필요합니다. 모든 클릭 대상이 완전히 비중첩이어야 한다는 요구는 충족하지 못했습니다.
하단 y=768..1023은 빈 바닥입니다. 추가 장식용 낮은 책장/벽 선반은 8개 클릭 키에 포함하지 않았습니다.
제약: 생성기는 정확한 저해상도 격자로 출력하지 않으므로 native 1/4 직접 생성은 보장되지 않습니다. 요구된 정확한 4×4 블록과 색상 수는 스크립트 후처리로 보장했습니다. 박스의 일부 투시 중첩은 위에 명시했습니다. 캐릭터는 정면에 가까운 약한 3/4 방향입니다.

## Alpha checks

| asset | corner alpha (TL, TR, BL, BR) | real alpha | colors |
|---|---|---|---|
| chibi_saeko.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_minato.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_shizuku.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_ritsu.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_hiyori.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_akane.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_keita.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_mei.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |
| chibi_sota.png | [0, 0, 0, 0] | binary 0/255, PASS | 48 |

크로마키 배경은 사용하지 않았습니다. 모든 캐릭터에 실제 알파가 있습니다. 자세한 수치: validation.json.

## Exact generation prompts

### room_day

```text
Use case: stylized-concept. Create a 1536x1024 landscape original 2D pixel-art anime clubroom game background using attached clubroom solely as furniture/mood reference. Classic 16-bit life-sim, 3/4 elevated FRONT view, rear wall straight across, slightly angled side walls, floor perspective. Coarse clean 4x4 pixels, native 384x256 feel, 32-48 soft pastel colors, dark colored pixel outlines, no antialias/blur/3D/paint. No people, text, logos or existing anime. Eight clearly SEPARATED click targets: big cherry-tree window upper left wall; glass tiny-figure cabinet left below window with separation; small white fridge with electric kettle back-left; whiteboard doodles and empty schedule grid center-left back wall; two invented abstract anime posters between board and bookshelf; tall colorful manga/DVD bookshelf back-right; green sofa cat cushion with low coffee table right mid-ground; largest long wooden study desk center with open books papers pencil cup laptop and four chairs. Maintain gaps between furniture. ALL furnishings above y=760; entire bottom 25% empty walkable floor, clear floor around desk. Warm afternoon light, lived-in cozy mood. No readable marks, only doodles.
```

### room_evening

```text
Use case: lighting-weather. Edit this day pixel-art room into evening. Preserve EXACT composition, camera, dimensions, geometry, object positions and sizes, every book, poster, chair, table leg, floor line, whiteboard doodle. Change ONLY illumination: orange sunset through same cherry-tree window, warm glow from existing ceiling lights, deeper violet shadows, longer sunset shadows across empty bottom floor. Same cozy limited pastel pixel-art style, clean chunky grid no blur. No new objects or people. 1536x1024.
```

### saeko

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of saeko using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Adult club advisor woman, long dark burgundy-red hair in loose low ponytail, burgundy eyes, white open collar shirt, black cardigan, lanyard ID badge, dark tailored trousers and loafers; lollipop stick in mouth, relaxed tired expression, holding coffee can and corrected notebook.
```

### minato

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of minato using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Boy dark navy tousled hair, blue eyes, thin oval glasses, navy piped blazer white shirt blue tie, dark trousers and brown loafers, holding dark blue book at chest, gentle composed expression.
```

### shizuku

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of shizuku using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Girl very long dark-purple hair covering one eye, visible purple eye, shy gentle smile, oversized beige cardigan white shirt purple ribbon navy pleated knee-length skirt socks loafers, holding colorful original manga with no text.
```

### ritsu

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of ritsu using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Girl messy short black hair gray eyes, small ear studs, black stud choker, navy blazer with pale piping white shirt loose burgundy tie, modest dark pleated skirt dark tights boots, bass guitar visibly on back with neck protruding above shoulder, reserved expression.
```

### hiyori

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of hiyori using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Girl pink twin tails tied burgundy ribbons, yellow star hair clip, rose eyes, smug fang grin, navy piped blazer white shirt burgundy bow, modest knee-length pleated skirt socks loafers, small school bag with cute abstract charm.
```

### akane

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of akane using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Girl bright gyaru style, long wavy honey-blonde hair V hair clips amber eyes, happy smile, beige cardigan navy vest white shirt orange ribbon, modest navy pleated skirt socks loafers, decorated nails, holding small turquoise robot plastic model with antenna ears.
```

### keita

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of keita using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Very small boy, tousled dark brown short hair brown eyes expressionless face, navy piped blazer white shirt green tie, dark shorts knee socks loafers, yellow sewing tape measure around neck and wrist pincushion, holding folded green fabric with white ruffle.
```

### mei

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of mei using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Girl shoulder-length dark-brown hair with side braid and pink ribbon brown eyes cheerful smile, white pink headphones around neck navy piped blazer white shirt pink bow, modest pleated skirt socks loafers, holding spiral notebook, small round cute pastel pins.
```

### sota

```text
Use case: stylized-concept. Create one full-body standing idle chibi pixel-art game sprite of sota using the portrait as identity reference (hair eyes outfit prop), not pose/composition. Square canvas, actual transparent alpha background, no backdrop, no ground shadow, no labels. Wholesome fully clothed. 2.5 heads tall, head 40% of body height, body turned three-quarters toward viewer, calm idle stance feet together near bottom center, entire character about 70% canvas height with small bottom margin. Cozy 16-bit life-sim pixel art, clean chunky square pixels on consistent grid, 1 native pixel deep colored outlines not pure black; limited 32-48 pastel colors, simple pixel shading, no blur no antialias no painterly gradients, no logos or readable text. Target 1024x1024 with exact 4x4 pixel blocks; we will quantize at 256x256. Preserve detailed distinctive prop in readable simple pixel silhouette. CHARACTER DETAILS: Boy messy light brown hair brown eyes blue small hairclip, cheerful open smile, open navy piped blazer white shirt loosened blue tie, dark trousers loafers, holding open white folded paper harisen fan and small tan notebook.
```

