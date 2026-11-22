# 부원이 활동하는 도트 부실 (Codex 의뢰, 3차)

## 요약 (사람용)
- 사용자 피드백: 캐릭터를 바닥에 세워 두기만 한 건 "배치"가 아니다. 부원들이 부실 안에서 무언가를 하고 있는 장면이어야 한다.
  방식은 사용자가 골랐다: **부실 그림에 부원을 함께 그려 넣는다.**
- 캐릭터 품질은 1차 SD(`docs/art/pixel/chibi_<id>.png`) 수준을 유지한다. 2차처럼 뭉개지면 안 된다.
- 학년마다 부원 구성이 달라 1·2·3학년 × 낮·저녁 = 6장. 가구 배치는 기존 `room_day`와 완전히 같아야 한다(가구 클릭 영역을 그대로 씀).
- 부원마다 그림 속 위치(바운딩 박스)를 `members.json`으로 받아, 앱에서 부원을 누르면 말을 걸 수 있게 한다.

## REQUEST (for Codex)

### Goal
Draw the club members **into** the existing pixel-art club room so the picture reads as one lively game scene (like a cozy pixel life-sim screenshot), not characters pasted on top.
Each member is busy with an activity that fits a piece of furniture.

### References (attached)
1. `docs/art/pixel/raw/room_day.png` — the room (1536×1024). **Keep every piece of furniture exactly where it is** (window, figure case, fridge, whiteboard, posters, bookshelf, sofa, desk and chairs), same size and perspective.
2. `docs/art/pixel/raw/room_evening.png` — the evening lighting of the same room.
3. `docs/art/pixel/chibi_<id>.png` (9 files) — the approved chibi designs and **quality level** to keep: clean pixel art, readable faces, correct hair colors and outfits. Draw the members at this quality, in poses that fit the scene, scaled to the room (a standing member is about 200–230 px tall in the 1536×1024 image; seated members smaller accordingly).

### Members and activities
Year 1 (5 members):
- **minato** — standing at the whiteboard, marker in hand, pointing at the schedule grid.
- **shizuku** — sitting on the left chair at the long table, reading a manga, long purple hair.
- **hiyori** — crouching in front of the figure display case, peeking in with a smug grin.
- **ritsu** — sitting on the green sofa, bass guitar across her lap.
- **saeko** — leaning against the fridge with a can of coffee, lollipop stick in her mouth.

Year 2 adds:
- **akane** — sitting at the table (front right chair), building a small robot plastic model.
- **keita** — sitting at the table (back right chair), sewing a costume, tape measure around his neck.

Year 3 adds:
- **mei** — standing by the bookshelf, writing in her notebook.
- **sota** — standing near the posters with his paper harisen fan, mid-joke.

Characters must sit on the actual chairs and sofa, stand on the floor, and be occluded correctly by furniture in front of them (e.g. the table edge in front of seated members). Light and shadow must match the room (warm daylight from the left window; sunset in the evening). No floating, no outlines that differ from the room, no halos.

### How to keep the set consistent
- Build year 1 day first by editing `room_day.png` (add the five members). Then year 2 day by editing year 1 day (add akane and keita, change nothing else), then year 3 day by editing year 2 day (add mei and sota).
- Evening versions: edit each day image to the evening lighting of `room_evening.png`, changing only the light.
- After each step, compare against `docs/art/pixel/layout.json` (furniture boxes) and against the previous image; redo the step if furniture moved or an earlier member changed.

### Output (only in `docs/art/pixel/v3/`)
- `room_day_y1.png`, `room_day_y2.png`, `room_day_y3.png`, `room_evening_y1.png`, `room_evening_y2.png`, `room_evening_y3.png` — 1536×1024 PNG.
- `members.json` — `{ "y1": [{ "id": "minato", "x": …, "y": …, "w": …, "h": … }, …], "y2": [...], "y3": [...] }`: a tight bounding box of each member in pixels of the day image (the evening image has the same positions). Measure on the final images.
- `members_debug_y1.png` … `_y3.png` — the day image with each member's box and id drawn.
- `contact_sheet.png` — the six images side by side with file names.
- `NOTES.md` — prompts used and anything not satisfied.

### Constraints
- Do not modify anything outside `docs/art/pixel/v3/`.
- Original characters only (these designs); no text, no logos. Wholesome: fully clothed students and one adult teacher.

Finish with a short Korean summary.
