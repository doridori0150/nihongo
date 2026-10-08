# Y2 standing sprite delivery

Generated 2026-10-08 using the built-in image_gen tool. Eight separate 1024x1536 RGBA PNG sprites saved in this folder. Generated images were copied without pixel edits; Pillow was used only for measurement and the requested contact sheet. Existing files were not overwritten.

## Review and limitations

- Akane: normal smiling peace sign, happy sparkling eyes presenting the robot kit, surprised, and flustered shy. Keita: deadpan, annoyed pout, proud smile presenting a finished costume piece, and shy averted gaze.
- Character designs, clothing colors and signature accessories follow the approved portraits. Rendering and standing layout follow hiyori_smug and shizuku_normal.
- The same body stance and camera framing are retained per character. Happy variants intentionally change arms/prop arrangement to fulfill the specific presentation action; strict identical arm pose across all expressions is therefore not satisfied. Akane carries the model box in all variants. Keita's happy costume is an unfolded finished green/ivory blouse interpretation of his base fabric.
- Generative edits are not guaranteed pixel-identical outside the face. Fine hair, fabric and prop details can vary.
- True alpha exists in every sprite. No green-screen fallback was needed. Hidden RGB in transparent regions can look like a dark glow in viewers that ignore alpha; the contact sheet uses actual alpha on #808080.
- The generator's character alpha peaks at 254 rather than 255; slight background bleed is possible. Some corner pixels may be 1/255 rather than exactly zero; see measured values below. Generated alpha was preserved rather than silently altered.
- Framing extends to the upper legs near the knees, but exact anatomical knee cut is not guaranteed. Akane's top hair margin is extremely tight, so the requested small clear head margin is not fully satisfied. Keita has a clearer top margin. Relative heights have not been calibrated; per the brief, Keita's height reduction belongs to the app conversion stage.
- Individual sprites contain no readable lettering, branding or watermarks. Contact-sheet labels are outside the sprite images. All students are fully clothed and depicted wholesomely.

## Alpha verification

Corner order: top-left, top-right, bottom-left, bottom-right. Values are measured from the delivered PNGs, not inferred from their previews.

| File | Format | Corner alpha | Fully transparent pixels | Alpha min/max |
|---|---|---|---:|---|
| `akane_normal.png` | 1024x1536 RGBA | [0, 0, 0, 1] | 471,823 | [0, 254] |
| `akane_happy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 484,235 | [0, 254] |
| `akane_surprised.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 474,109 | [0, 254] |
| `akane_shy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 480,304 | [0, 254] |
| `keita_normal.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 783,364 | [0, 254] |
| `keita_angry.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 782,409 | [0, 254] |
| `keita_happy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 764,325 | [0, 254] |
| `keita_shy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 782,890 | [0, 254] |

Existing-file SHA-256 recheck: 20 files unchanged against the snapshot taken during this run before QA/delivery writes. The snapshot was taken after initial new sprite creation, not before the entire run.

Machine-readable checks: `alpha_checks_y2.json`. Reproduce with `python docs/art/sprites/verify_sprites_y2.py`.

## Exact prompts and references

Akane base used the four user attachments in their provided order. Keita base used keita.png, hiyori_smug.png, shizuku_normal.png. Each expression edit used its own generated normal sprite. Every call requested `transparent_background=true`.

### akane_normal

Create one production visual-novel standing sprite akane_normal, PNG exactly 1024x1536 with real transparent alpha background. References: image 1 approved Akane identity/design; images 3 and 4 framing/rendering exemplars (do not copy their identities); image 2 unrelated Keita. Match delicate line art, polished soft cel shading, detailed hair and clothing of these references. Akane is a wholesome fully clothed high-school girl, long wavy honey-blonde hair, amber eyes, V-fin white/orange mecha hairpin, cream oversized cardigan over navy uniform and white shirt, orange ribbon, normal pleated navy skirt. Preserve orange floral nail art, teal robot pin, navy shoulder bag with orange and teal runner-parts keychain. Bright gyaru smile and peace sign beside shoulder with right hand; left arm cradles the original teal robot model kit box against waist, box illustrated with robot and runners but NO lettering/logos. Standing, body slightly turned to viewer, centered horizontally, small margin above hair, bottom edge cuts legs just above knees, same camera scale and layout as existing sprite examples. Entire hair and elbows inside canvas. No background, glow, floor, cast shadow, text, watermarks, extra people. All four corner pixels fully transparent. This will be a base for expression variants, stable neutral standing weight distribution.

### akane_happy

Edit provided Akane base standing sprite into akane_happy: excited sparkling otaku-mode amber eyes with bright starry highlights and delighted wide smile, enthusiastically presenting the SAME original illustrated teal robot model-kit box slightly higher at chest level. Right hand may lower from peace sign to support side of box and left hand supports its bottom; only necessary arms/box change plus expression. Preserve head position, hair silhouette, body stance, framing/camera scale, face identity, honey blonde hair, cream cardigan/navy uniform, orange bow, skirt, nail art, robot pin, mecha hairpin and bag/runner keychains. Box remains original reference design, teal round robot with runners, no lettering or logos. Same detailed anime line art and soft cel shading. Wholesome fully clothed teenager, standing knee-up at 1024x1536, true transparent alpha background and zero alpha corner pixels. No background/glow/floating effects, no text or watermark.

### akane_surprised

Edit the provided Akane standing sprite into akane_surprised. Change ONLY facial expression: wide surprised amber eyes, raised eyebrows, small open mouth, wholesome caught-off-guard surprise. Preserve identical face identity, hair, all clothing, orange ribbon, mecha hairpin, nail art, robot pin, bag/keychains, exact illustrated robot kit box without text, peace-sign hand, other hand and EVERY pose, body size, framing and camera detail. Same polished anime linework and soft cel shading. Output one 1024x1536 RGBA PNG, real transparent background, no glow or backdrop; all four corners alpha exactly zero. No text/logos. Do not crop or zoom.

### akane_shy

Edit the provided Akane standing sprite into akane_shy. Change ONLY facial expression: deeply flustered pink blush across cheeks and nose, eyebrows tilted in embarrassed worry, amber eyes glancing away, small awkward closed mouth, embarrassed because friends discovered her robot-model hobby. Wholesome, no suggestive expression. Preserve identical face identity, hair, all clothing, orange ribbon, mecha hairpin, nail art, robot pin, bag/keychains, exact robot kit box without lettering, peace-sign hand, other hand, exact standing pose and body/camera/framing. Same polished anime linework and soft cel shading. Output one 1024x1536 RGBA PNG with genuine transparent background, four corner pixels alpha zero. No background, glow, text or logos.

### keita_normal

Create one visual-novel standing sprite keita_normal. Input 1 is approved KEITA face/character design, preserve accurately; input 2 hiyori_smug and input 3 shizuku_normal are ONLY style and framing references, do not copy their identities. Output exactly 1024x1536 PNG, genuine transparent alpha background, all corner pixels alpha zero. Same elegant detailed anime line art and soft cel shading as references. Keita is a small youthful HIGH-SCHOOL BOY clearly a teenager, not a child: fluffy dark brown hair, soft brown eyes, delicate youthful face, deadpan closed-mouth expression. Oversized navy blazer with cream piping, sleeves covering to knuckles, white collared shirt, loosened dark green tie, yellow measuring tape around neck, green pincushion band on wrist with colored pinheads. Dark navy uniform trousers. Hold the same dark green and ivory ruffled costume fabric from his approved portrait in both arms at chest/waist. Standing with body slightly turned toward viewer, stable relaxed pose, centered horizontally, knee-up crop with bottom edge just above knees; small clear margin above hair, all elbows/hair inside frame. Match camera layout of existing sprites; don't force relative height difference. Fully clothed wholesome student. No background/glow/floor/shadow, no text or logos or watermark. Preserve costume, palette, props and approved identity.

### keita_angry

Edit this Keita standing base into keita_angry. Change ONLY facial expression: annoyed slightly furrowed eyebrows, narrowed brown eyes, small pout because someone called him cute. Subtle restrained teen annoyance, not yelling. Preserve his youthful teenage boy face identity, exact fluffy dark-brown hair, oversized navy blazer and cream piping with long knuckle-covering sleeves, dark green tie, yellow measuring tape, wrist pincushion, green and ivory costume fabric, same hands and exact standing body pose, camera and crop. No changes to clothing, props, proportions or palette. 1024x1536 RGBA PNG with genuine transparent alpha backdrop, all corners zero alpha. Match original detailed linework and soft anime cel shading. Fully clothed wholesome student. No text/logos/watermark/background or glow.

### keita_happy

Edit this Keita standing base into keita_happy. Small proud closed-mouth smile and quietly pleased brown eyes. He presents a FINISHED costume piece: unfold and lift the same dark green fabric and ivory ruffles into a neatly sewn dark-green and ivory ruffled costume blouse/bodice, held at chest level between his hands so its finished collar/seams and ruffled trim can be seen. Necessary forearm/hand and fabric adjustment only; preserve the rest of standing stance, head position, face identity, hair silhouette, camera scale and framing. Preserve fluffy dark brown hair, youthful clearly teenage boy, oversized navy blazer cream piping and sleeves reaching knuckles, white shirt, dark green tie, yellow neck measuring tape, wrist pincushion and dark navy trousers. Same detailed anime linework and soft cel shading. Output exactly 1024x1536 real transparent RGBA PNG, corners completely transparent. Centered knee-up crop same as base. Wholesome fully clothed student. No lettering, logos, watermarks, backdrop, glow, floor or cast shadow.

### keita_shy

Edit this Keita standing base into keita_shy. Change ONLY facial expression: clearly pink cheeks, brown eyes looking away to the side, a very small shy closed mouth and slightly embarrassed eyebrows. Do not rotate his head/body. Preserve youthful teenage boy face identity, exact fluffy dark-brown hair silhouette, oversized navy blazer and cream piping with long knuckle-covering sleeves, dark green tie, yellow measuring tape, wrist pincushion, green and ivory costume fabric, same hands and exact standing body pose, camera and crop. No changes to clothing, props, proportions or palette. 1024x1536 RGBA PNG with genuine transparent alpha backdrop, all corners zero alpha. Match original detailed linework and soft anime cel shading. Fully clothed wholesome student, no suggestiveness. No text/logos/watermark/background or glow.
