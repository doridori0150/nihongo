# 도트(픽셀아트) 부실 세트 (Codex 의뢰)

## 요약 (사람용)
- 사용자 요청: 부실 홈을 게임처럼 바꾸기. 가구(책상·화이트보드·진열장 등)를 누르면 오른쪽 패널이 열리고, 미션·업적·JLPT 데일리 시험이 있는 형태다.
  첨부 참고 이미지는 3D 쿼터뷰 카페 꾸미기 게임이고, 원하는 건 **2D 도트 느낌의 부실**이다.
- 부실 305호 도트 배경(낮·저녁, 같은 구도) 2장과 부원 9명 도트 SD 캐릭터(투명 배경) 9장을 만든다.
- 가구는 클릭 대상이 되므로 서로 겹치지 않게 또렷이 나눠 그리고, 위치(바운딩 박스)를 `layout.json`으로 받는다.

## REQUEST (for Codex)

### Goal
Create a small, consistent set of original **2D pixel-art** game assets for the home screen of a Japanese-learning web game set in an anime club room ("club room 305"):
two room backgrounds (day and evening, identical layout) and nine chibi pixel characters with transparent backgrounds.
The room is an interactive hub: the player clicks pieces of furniture, so every interactive object must be clearly readable and separated from its neighbours.

### References (attached)
- `public/bg/clubroom.jpg` — the existing painted version of the SAME club room. Use it for the furniture list and mood (lived-in otaku club room, afternoon light). Re-draw it as pixel art; do not trace or copy its painting style.
- `public/characters/<id>.jpg` (9 files: saeko, minato, shizuku, ritsu, hiyori, akane, keita, mei, sota) — approved character designs. Keep each character's hair style, hair color, eye color, outfit and signature prop recognizable in chibi pixel form.

### Art direction (all images)
- Cozy 16-bit-era pixel art like a modern indie life-sim interior: chunky visible pixels on a clean grid, limited soft pastel palette (about 32–48 colors), 1px dark outlines in a deep colored tone (not pure black), simple dithering only for light and shadow.
- Draw natively at 1/4 resolution and upscale 4× nearest-neighbour, so every "pixel" is an exact 4×4 block. No anti-aliasing, no blur, no painterly gradients, no 3D render look.
- Original content only: posters show invented abstract characters or shapes, no readable text, no real anime, logos or brands, no watermarks.

### 1) Room backgrounds
- `room_day.png` and `room_evening.png`, landscape **1536×1024**, 3/4 top-down "front view" interior (back wall facing the camera, floor visible in perspective, side walls slightly angled), like classic RPG/life-sim interiors. No people.
- Furniture, each a separate clearly-bounded object, roughly in this layout:
  | key | object | where |
  |---|---|---|
  | `window` | big window with a cherry tree outside | left wall, upper-left |
  | `figures` | glass display case full of tiny figures | left side, in front of the window wall |
  | `fridge` | small white fridge with an electric kettle on top | back wall, left of the whiteboard |
  | `whiteboard` | whiteboard with doodles and an empty grid schedule (marks only, no letters) | back wall, center-left |
  | `posters` | 2–3 original anime-style posters | back wall, between whiteboard and bookshelf |
  | `bookshelf` | tall bookshelf packed with colorful manga/DVD spines | back wall / right, tall |
  | `sofa` | worn green sofa with a cat-face cushion and a low coffee table | right side, mid-ground |
  | `desk` | long wooden study table with open books, papers, a pencil cup and a laptop, 4–6 chairs | center of the room, the largest object |
- Keep a clear floor strip along the bottom 25% and around the table so small characters can stand and a dialogue box can overlay the bottom edge.
- Evening: produce `room_evening.png` by editing the day image. Keep every object in exactly the same position and size. Change only the lighting: orange sunset through the window, warm lamp glow, long shadows.

### 2) Chibi characters
- `chibi_<id>.png` for the 9 ids above, **1024×1024 PNG with a real transparent background (alpha)**.
- Same pixel scale and palette family as the room (4×4 pixel blocks), about 2.5-head proportions, standing idle pose, body turned three-quarters toward the viewer. Feet touch the bottom center area (small margin), character about 70% of the canvas height.
- Signature details: saeko (adult club advisor, long dark-red hair, white shirt with a lanyard, lollipop stick in mouth), minato (dark-navy hair, glasses, blazer, blue tie), shizuku (very long dark-purple hair covering one eye, oversized beige cardigan, holding a manga), ritsu (messy black short hair, choker, bass guitar on her back), hiyori (pink twin tails with a star hair clip, smug grin), akane (bright gyaru style, holding a small robot plastic model), keita (very small boy, expressionless, sewing tape measure around neck), mei (shoulder-length dark-brown hair with a side braid and ribbon, headphones around neck, notebook), sota (messy light-brown hair, open blazer, paper harisen fan). Follow the attached portraits for anything not listed.
- Wholesome: fully clothed high-school students and one adult teacher, no suggestive poses.

### Output
Save everything in `docs/art/pixel/`:
- `room_day.png`, `room_evening.png`, `chibi_<id>.png` ×9
- `layout.json` — for `room_day.png`, one entry per furniture key above: `{ "key": …, "x": …, "y": …, "w": …, "h": … }` in pixels of the 1536×1024 image (tight bounding box). Measure on the final image.
- `contact_sheet.png` — all images as thumbnails with file names, chibis on mid-grey.
- `NOTES.md` — the prompts used, the alpha check per chibi (corner pixels fully transparent; if true transparency is impossible, say so and use a perfectly flat #00FF00 background), and anything not satisfied.

### Constraints
- Work only in `docs/art/pixel/`. Do not modify any other file.
- Exact sizes as specified.

Finish with a short Korean summary.
