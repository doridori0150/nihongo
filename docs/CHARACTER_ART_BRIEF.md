# 放課後アニ研 캐릭터 일러스트 R1 (Codex 의뢰)

## 요약 (사람용)
- 사용자 요청: "미소녀 웹 페이지 캐릭터 하나 그려줬으면 좋겠다. 컨셉은 메스가키 한 명과 소심음침 오타쿠 애니메이션 동아리 중고생으로. 남성 캐릭터도. 현시연 느낌의 아니메 동호회 시리즈" / "젠존제나 블루아카이브 같은 스타일 레퍼런스를 기준으로 만들라"
- 일본어 학습 웹앱 「にほんご Daily」의 마스코트 4명(고등학교 애니 연구회 부원). 홈 화면 인사, 문제 피드백, 해설 말풍선에 원형 아바타(지름 40~120px)와 상반신으로 쓰인다.
- 스타일 A(블루 아카이브풍) 4명 + 스타일 B(젠레스 존 제로풍) 시안 1명을 받아 사용자가 고른다.
- 결과물은 `docs/art/characters/`에만 저장. 앱 연결(`public/characters/` 복사, 코드)은 Claude가 한다.
- 캐릭터 설명 상세: `docs/character-brief.md` (한국어)

## REQUEST (for Codex)

### Goal
Create original mascot character art for a Japanese-learning web app themed around a high-school anime club ("放課後アニ研"). Four original characters, consistent series style, delivered as files plus a preview sheet.

### Context
- Read `docs/character-brief.md` for each character's look, personality and colors (Korean). Summary:
  1. `minato` — 3rd-year boy, club president. Tall, slim, neat dark-navy hair with side part, thin silver glasses, calm/intellectual slight smile, pushing glasses up. Navy tie (#2f5d9e). Holds a thick anime-history book.
  2. `daigo` — 2nd-year boy. Sturdy build, spiky red-brown hair, thick eyebrows, big confident grin like a shonen-manga hero, fist clenched. Blazer over shoulder, rolled shirt sleeves, vermilion tie (#e0533a).
  3. `hiyori` — 1st-year girl, the cheeky kouhai. Petite, pink twin-tails, yellow star hairpin. Playful smug teasing expression: one eye half-closed, sly grin with a tiny fang, hand covering a giggle. Pink ribbon (#e86a9a), gacha-capsule keychain on her bag. Cute and mischievous, NOT sexual.
  4. `shizuku` — 2nd-year girl, shy gloomy otaku. Long black-violet hair with long bangs covering one eye, slight blush, avoiding eye contact, hugging an anime magazine to her chest. Oversized cardigan over the blazer, violet ribbon (#7357b0).
- Shared uniform: navy blazer, white shirt, tie/ribbon in each character's color.

### Style A — "Blue Archive"-like (main set)
Reference: the official character art style of the mobile game *Blue Archive* (Nexon / Yostar). Match its qualities, not its characters:
- crisp thin dark lineart, clean flat cel shading with one soft shadow tone, subtle rim light
- bright, airy, slightly pastel but saturated palette; large glossy anime eyes with layered highlights
- modern school-uniform details (headphones, phone charms, keychains), neat fabric folds
- gacha-game profile-portrait look: 3/4 bust-up, character centered, head near the top third
- background: flat very light tint of the character's color (or soft sky-white), nothing else

### Style B — "Zenless Zone Zero"-like (probe, `hiyori` only)
Reference: the character art style of *Zenless Zone Zero* (HoYoverse). Match its qualities, not its characters:
- bold thick outlines, graphic comic-like shapes, high-contrast urban pop palette with neon accents
- streetwear layered over the school uniform (oversized hoodie/jacket, sneakers vibe), attitude-filled pose
- small graphic accents (halftone dots, sticker-like shapes) allowed, still no text

### Deliverables (exact paths)
- `docs/art/characters/style-a/minato.png`, `daigo.png`, `hiyori.png`, `shizuku.png` — square 1024×1024 PNG, bust-up
- `docs/art/characters/style-b/hiyori.png` — square 1024×1024 PNG
- `docs/art/characters/contact_sheet.png` — all five images side by side in one PNG with the file name under each (preview for review)
- `docs/art/characters/NOTES.md` — the prompt you used for each image and anything you could not satisfy

### Constraints
- Work only in `docs/art/characters/`. Do not modify `src/`, `public/`, `content-src/`, `scripts/` or any other folder.
- Original characters only. Do not reproduce, trace or name any existing character from Blue Archive, Zenless Zone Zero or any other work. No halos (Blue Archive's signature), no game logos, no UI frames, no text or watermarks inside the images.
- All four are high-school students: fully clothed in school uniform, wholesome poses and framing, no fan-service, no sexualized expressions.
- Avoid: glossy generic "AI anime" look, plastic skin, painterly oil texture, heavy gradients, extra or malformed fingers, inconsistent faces between images.
- Faces must read clearly when the image is cropped to a circle and shown at 48px: keep the face large and centered, simple background.

Finish with a short Korean summary.
