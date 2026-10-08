# Keita R5

- 생성: 내장 image_gen 도구, 각 안 별도 생성. 2안은 1안을 캐릭터 동일성 레퍼런스로 사용.
- 승인 이미지 4장은 스타일 참조로만 사용. 원본 파일은 수정하지 않음.
- 최종 PNG는 생성 원본을 Lanczos 방식으로 1024×1024로 축소.
- contact_sheet.png: shizuku.png → hiyori.png → akane.png → keita_1.png → keita_2.png 순서, 파일명 표시.

## 한계 및 확인 사항

- 레퍼런스와 선화/채도/명암을 시각적으로 비교했으나 스타일의 완전한 일치를 보증할 수 없음.
- 연녹색 배경에는 생성된 미세한 명암 변화가 있어 완전한 단색은 아님.
- 넥타이는 프롬프트에 #3f7d5c를 지정했으나 결과는 저채도의 회녹색으로 표현되어 정확한 HEX 색 일치는 충족하지 못함.
- 상반신 구도이므로 실제 키 150cm는 직접 판별할 수 없음. 작은 체격과 큰 소매로 표현.
- 원형 48px 축소에서 얼굴과 시선은 보이지만 미세한 입 모양과 재봉 디테일의 구별에는 한계가 있음.

## keita_1.png — 사용 프롬프트

```text
Use case: stylized-concept. Create one original character illustration, 1024x1024 square. The four attached approved portraits are style references only: match their thin muted charcoal-brown lineart, restrained pastel saturation, flat cel shading with one soft shadow tone, eye rendering, bust-up camera distance and plain pastel background. Do not copy their character identities. Character: Keita, a fully clothed 16-year-old first-year high-school BOY, petite approximately 150cm, narrow small frame, cute youthful round face but clearly a teenager, not a child or chibi. Soft fluffy DARK BROWN short hair with a slight cowlick, large calm warm brown eyes, sleepy half-lidded deadpan gaze, slightly pouting small mouth. Looks directly at viewer, stoic and curt despite cute face. Navy school blazer with pale piping, one size too big, sleeves reaching his knuckles; white collared shirt and neatly tied dark green tie #3f7d5c. Yellow tailor's measuring tape draped around neck with long dangling ends, simple tick marks without numerals or letters. A visible wrist pincushion band. He holds folded costume fabric against his chest with naturally constructed hands partly covered by long cuffs. Bust-up portrait with face large and centered in upper-middle, matching references, facial expression readable in 48px circular avatar crop. Plain uniform soft pastel green background. Wholesome neutral pose. No text, watermark, logo, sexualization, glossy plastic skin, painterly texture, heavy gradients, extra fingers or oversized childlike head. Return only this single portrait.
```

## keita_2.png — 사용 프롬프트

```text
Use case: stylized-concept. Generate variant 2 of the original boy Keita shown in the most recent image. Retain exactly his identity, fluffy short dark-brown hair with cowlick, youthful rounded face, brown eyes, petite teenage build, navy blazer with pale piping and oversized sleeves reaching knuckles, white shirt, neat dark green tie (base hue #3f7d5c), long yellow tailor measuring tape and wrist pincushion band. The first four images are approved series STYLE references only; the fifth is Keita identity reference. Match the approved thin muted lineart, restrained pastel color, flat cel shading with one soft shadow tone, eyes, bust-up square portrait camera distance. Change pose and expression: visibly annoyed at being called cute, brows slightly knitted, mouth a small grumpy pout, cheeks lightly pink, head slightly turned and eyes looking off to the side away from viewer. Keep both eyes clearly visible. Hold up a half-finished costume piece in front of chest with simple anatomically correct hands partly hidden by long cuffs: dark green cloth with cream lining and visibly unfinished seam and loose basting thread, no text or ornate accessories. Fully clothed wholesome 16-year-old high-school boy, small for his age but clearly teenager, not small child, not chibi. Large readable face in upper-middle suitable for 48px circular avatar. 1024x1024 single image; plain soft pastel green background, as uniform as possible. No text, watermark, logo, glossy plastic rendering, painterly texture, heavy gradients, malformed fingers, or sexualized content. Return only variant 2.
```

