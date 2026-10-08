# 미연시 스탠딩 그림 — 3학년 신입 2명 (Codex 의뢰)

## 요약 (사람용)
- 승인된 디자인: 메이(`approved/mei.png`, R6 1안 — 손 흔들기), 소타(`approved/sota.png`, R6 1안 — 하리센).
- 기존 스탠딩 24장과 같은 형식·구도로 표정별 투명 배경 스탠딩.

## REQUEST (for Codex)

### Goal
Create visual-novel standing sprites (transparent background) for two newly approved characters, matching the existing sprite set exactly in style, framing and format.

### References (attached)
1. `docs/art/ref/mei.png` — approved design for Mei.
2. `docs/art/ref/sota.png` — approved design for Sota.
3. `docs/art/sprites/akane_normal.png`, `docs/art/sprites/hiyori_smug.png` — existing approved sprites. Match their framing (knee-up, standing, body slightly turned to the viewer), line art, cel shading and canvas layout.

### Sprites

| character | expressions (file names) |
|---|---|
| mei | `mei_normal` (bright smile, waving), `mei_happy` (sparkling eyes, writing a new word in her notebook), `mei_surprised` (startled, "eh?" at an unknown expression), `mei_sad` (teary but smiling — saying goodbye) |
| sota | `sota_normal` (big grin, holding the paper harisen), `sota_happy` (laughing, pen behind ear, notebook up — "I've got a story idea!"), `sota_surprised` (overreacting in shock, comedic), `sota_shy` (scratching his cheek, embarrassed after being praised) |

- Keep each character's face, hair, outfit, colors and props identical across expressions; same standing pose per character.
- Mei: shoulder-length dark-brown hair with a thin side braid, red-pink ribbon, over-ear headphones around the neck, spiral notebook with sticky notes, original mascot pin badges on her bag strap (no text). Normal navy pleated skirt.
- Sota: messy light-brown hair, open blazer, loose blue tie, paper harisen fan, pen behind his ear, pocket notebook. Dark uniform trousers. Average height, slim.

### Format
- PNG 1024×1536 with a real transparent background (alpha), character centered horizontally, cut just above the knees by the bottom edge, small margin above the head.
- Save as `docs/art/sprites/<file name>.png`. Do NOT modify or overwrite any existing file in that folder.
- Verify transparency and report the alpha check per file in NOTES (corner pixels fully transparent). If true transparency is impossible, say so and use a perfectly flat #00FF00 background with clean edges.
- `docs/art/sprites/contact_sheet_y3.png` — the 8 new sprites on mid-grey with file names, plus `akane_normal` for comparison.
- `docs/art/sprites/NOTES_Y3.md` — prompts and anything not satisfied.

### Constraints
- Work only in `docs/art/sprites/`.
- Original characters (these designs), no logos, no text.
- Wholesome: fully clothed high-school students, no suggestive poses or expressions, no fan-service.

Finish with a short Korean summary.
