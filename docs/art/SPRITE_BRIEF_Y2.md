# 미연시 스탠딩 그림 — 2학년 신입 2명 (Codex 의뢰)

## 요약 (사람용)
- 승인된 디자인: 아카네(`approved/akane.png`, R4 2안), 케이타(`approved/keita.png`, R5 1안 — 작고 귀여운 동안, 무뚝뚝).
- 기존 스탠딩 16장과 같은 형식·구도로 표정별 투명 배경 스탠딩.
- 케이타의 작은 키는 받은 뒤 앱 변환 단계에서 축소해 맞춘다(생성기가 키 차이를 잘 못 지킴 — 지난 NOTES 참고).

## REQUEST (for Codex)

### Goal
Create visual-novel standing sprites (transparent background) for two newly approved characters, matching the existing sprite set exactly in style, framing and format.

### References (attached)
1. `docs/art/ref/akane.png` — approved design for Akane.
2. `docs/art/ref/keita.png` — approved design for Keita.
3. `docs/art/sprites/hiyori_smug.png`, `docs/art/sprites/shizuku_normal.png` — existing approved sprites. Match their framing (knee-up, standing, body slightly turned to the viewer), line art, cel shading and canvas layout.

### Sprites

| character | expressions (file names) |
|---|---|
| akane | `akane_normal` (bright gyaru smile, peace sign), `akane_happy` (sparkling "otaku mode", holding up the original robot model kit box), `akane_surprised`, `akane_shy` (flustered blush — her otaku side was found out) |
| keita | `keita_normal` (deadpan, holding costume fabric, measuring tape around his neck), `keita_angry` (annoyed small pout, someone called him cute), `keita_happy` (small proud smile holding up a finished costume piece), `keita_shy` (cheeks pink, looking away) |

- Keep each character's face, hair, outfit, colors and props identical across expressions; same standing pose per character.
- Akane: long wavy honey-blonde hair, V-fin mecha hairpin, oversized cream cardigan over the navy uniform, orange ribbon, nail art, robot pin and runner-parts keychain. Normal pleated navy skirt.
- Keita: small, youthful high-school boy (not a child), fluffy dark-brown hair, blazer a size too big with sleeves to his knuckles, dark green tie, yellow measuring tape, pincushion band on wrist. Dark uniform trousers.

### Format
- PNG 1024×1536 with a real transparent background (alpha), character centered horizontally, cut just above the knees by the bottom edge, small margin above the head.
- Save as `docs/art/sprites/<file name>.png`. Do NOT modify or overwrite any existing file in that folder.
- Verify transparency and report the alpha check per file in NOTES (corner pixels fully transparent). If true transparency is impossible, say so and use a perfectly flat #00FF00 background with clean edges.
- `docs/art/sprites/contact_sheet_y2.png` — the 8 new sprites on mid-grey with file names, plus `hiyori_smug` for comparison.
- `docs/art/sprites/NOTES_Y2.md` — prompts and anything not satisfied.

### Constraints
- Work only in `docs/art/sprites/`.
- Original characters (these designs), no logos, no text (the model kit box art has no lettering).
- Wholesome: fully clothed high-school students, no suggestive poses or expressions, no fan-service; Keita is youthful but clearly a teenager.

Finish with a short Korean summary.
