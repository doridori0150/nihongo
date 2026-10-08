# 미연시 스탠딩 그림 (Codex 의뢰)

## 요약 (사람용)
- 사용자 요청: 부실·스토리·대화 화면을 미연시처럼. 배경(딤) 위에 캐릭터가 서 있고 아래 대사창.
- 승인된 5명(첨부 그림과 같은 디자인·화풍)의 투명 배경 스탠딩 그림, 표정별.
- 디자인 확정: 미나토, 시즈쿠, 히요리(손가락질 메스가키), 리츠(쿨한 펑크 베이시스트), 사에코(사회에 찌든 귀찮은 표정의 고문 교사, 캔커피).

## REQUEST (for Codex)

### Goal
Create visual-novel standing sprites (transparent background) for the five approved characters, with several expressions each. Same character designs and art style as the attached approved portraits.

### References (attached)
`docs/art/ref/minato.png`, `shizuku.png`, `hiyori.png`, `ritsu.png`, `saeko.png` — approved designs. Keep each character's face, hair, outfit, colors and props identical across all expressions.

### Sprites
Knee-up (from head to just above the knees), standing, body slightly turned toward the viewer, arms in a natural pose that suits the character. Same camera distance and scale for everyone, so heights read correctly side by side: Saeko (adult) and Minato tallest, Ritsu and Shizuku medium, Hiyori smallest.

| character | expressions (file names) |
|---|---|
| saeko | `saeko_normal` (tired deadpan, canned coffee), `saeko_angry` (annoyed sigh, "ugh"), `saeko_happy` (rare small genuine smile) |
| minato | `minato_normal` (calm, pushing up glasses), `minato_happy`, `minato_surprised` |
| shizuku | `shizuku_normal` (shy, hugging magazine), `shizuku_happy` (excited otaku sparkle), `shizuku_sad` (teary, anxious) |
| ritsu | `ritsu_normal` (cool, bass case on shoulder), `ritsu_happy` (confident grin), `ritsu_angry` (irritated frown) |
| hiyori | `hiyori_smug` (half-lidded teasing grin with fang, pointing — her default), `hiyori_happy` (genuine bright laugh), `hiyori_angry` (pouty, puffed cheeks), `hiyori_shy` (flustered blush, secret exposed) |

### Format
- PNG 1024×1536 (portrait) with a **real transparent background (alpha)**, character centered horizontally, feet/knees cut by the bottom edge, small margin above the head.
- Save as `docs/art/sprites/<file name>.png`.
- Verify transparency: report in NOTES.md the alpha check per file (e.g. corner pixels fully transparent). If true transparency is impossible, say so and use a perfectly flat #00FF00 background instead, with clean edges.
- `docs/art/sprites/contact_sheet.png` — all sprites on a mid-grey background with file names.
- `docs/art/sprites/NOTES.md` — prompts and anything not satisfied.

### Constraints
- Work only in `docs/art/sprites/`.
- Original characters (these designs), no logos, no text.
- Students are high-school students: fully clothed school uniforms, wholesome poses; the teacher is an adult in modest professional clothing; no fan-service.

Finish with a short Korean summary.
