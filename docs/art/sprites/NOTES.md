# Standing sprite delivery

Generated with the built-in image_gen tool, 2026-10-08. 16 individual 1024x1536 RGBA PNG sprites. Each base uses its approved portrait from ../ref; each expression edit uses that character's generated base. Generated PNGs were copied without pixel modifications. Pillow is used only for verification and the requested labeled contact sheet.

## Visual review and limitations

- All 16 requested filenames and expressions are present. Character hairstyles, signature clothing and props follow the references. Each character maintains the same standing pose across expressions.
- True alpha transparency is present; no green fallback was needed. The contact sheet composites the delivered alpha onto flat #808080. RGB values in fully transparent pixels can look like a dark colored haze in viewers that ignore alpha; that is not an opaque backdrop.
- The generator uses near-opaque character pixels (often alpha 253/254) rather than uniformly 255. Original generated alpha is preserved, so slight background bleed is possible.
- saeko_happy and hiyori_smug have bottom-left corner alpha 1/255; the other tested corners are fully transparent. These two corners are almost transparent, not exactly zero.
- Relative height / shared camera scale is NOT fully satisfied: the generator fills almost the entire canvas for all five characters despite height instructions. In particular Hiyori does not read sufficiently shorter in an equal-size lineup. Do not treat these as calibrated height-matched sprites.
- Framing reaches the upper legs / near knees, but exact anatomical knee level is not consistent. Top margin is very small. The reference portraits do not show the lower outfits; dark uniform trousers, navy pleated skirts and Saeko's dark professional trousers are inferred extensions.
- Expression edits preserve the design visually, but are generated redraws, not guaranteed pixel-identical outside the face. Hiyori keeps her pointing pose in all four expressions.
- No readable text or logos were added to individual sprites; notebook marks and magazine illustration remain as character props. Labels appear only on the contact sheet.

## Alpha verification

Corner order: top-left, top-right, bottom-left, bottom-right. Alpha range 0-255. Checks are programmatic verification of the actual delivered files, not only visual inspection.

| File | Format | Corner alpha | Fully transparent pixels | Alpha min/max |
|---|---|---|---:|---|
| `saeko_normal.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 728,080 | (0, 254) |
| `saeko_angry.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 726,361 | (0, 254) |
| `saeko_happy.png` | 1024x1536 RGBA | [0, 0, 1, 0] | 725,402 | (0, 254) |
| `minato_normal.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 775,532 | (0, 254) |
| `minato_happy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 775,964 | (0, 254) |
| `minato_surprised.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 775,092 | (0, 254) |
| `shizuku_normal.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 721,500 | (0, 254) |
| `shizuku_happy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 723,632 | (0, 254) |
| `shizuku_sad.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 714,192 | (0, 254) |
| `ritsu_normal.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 718,507 | (0, 254) |
| `ritsu_happy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 715,326 | (0, 254) |
| `ritsu_angry.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 716,370 | (0, 254) |
| `hiyori_smug.png` | 1024x1536 RGBA | [0, 0, 1, 0] | 647,953 | (0, 254) |
| `hiyori_happy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 658,366 | (0, 254) |
| `hiyori_angry.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 644,185 | (0, 254) |
| `hiyori_shy.png` | 1024x1536 RGBA | [0, 0, 0, 0] | 649,501 | (0, 254) |

## Exact prompts

All calls used `transparent_background=true`. Base prompts referenced the corresponding approved portrait; expression prompts referenced the generated normal sprite (Hiyori: smug).

### saeko_normal

Use case: stylized-concept. Create saeko_normal: one visual novel standing sprite of the EXACT adult female teacher from the reference portrait, identical refined anime linework, face, burgundy messy low bun and loose strands, tired deadpan expression, small hoop earring, lollipop stick, white modest professional shirt, dark cardigan/blazer, burgundy lanyard with blank badge, brown unbranded canned coffee in one hand and corrected notebook held naturally in other. Extend unseen lower outfit with modest dark tailored trousers. Standing body slightly turned toward viewer, natural arms. KNEE UP, head to just above knees cut by bottom edge, centered, whole head with small top margin, no cropped hair/arms sides. Tall adult proportions, camera at chest height, no perspective distortion. PNG 1024x1536 portrait. REAL transparent background alpha, no scenery, no floor, no shadow, no checkerboard, no text, no logos. Match reference exactly in design and art style; wholesome professional clothing.

### minato_normal

Use case: stylized-concept. Create ONE visual novel standing sprite matching the supplied approved portrait EXACTLY in face, hair, costume, colors, props, and refined anime art style. 1024x1536 PNG portrait with REAL transparent alpha background. No backdrop, haze, glow, shadow, checkerboard, text, logos, or extra objects. Wholesome fully clothed high-school student. Standing body slightly turned toward viewer, natural character-specific arms. Knee-up composition from complete head to just above knees cut by bottom edge; centered horizontally, no side cropping. Consistent anatomical head scale about 230 pixels tall, camera at chest height. Tall male student, navy blue side-parted hair, blue eyes, thin silver glasses, navy silver-trim blazer, white shirt, blue necktie, dark uniform trousers. Calm gentle smile, one hand pushing up glasses, other arm holding navy book. Head top at y=30.

### shizuku_normal

Use case: stylized-concept. Create ONE visual novel standing sprite matching the supplied approved portrait EXACTLY in face, hair, costume, colors, props, and refined anime art style. 1024x1536 PNG portrait with REAL transparent alpha background. No backdrop, haze, glow, shadow, checkerboard, text, logos, or extra objects. Wholesome fully clothed high-school student. Standing body slightly turned toward viewer, natural character-specific arms. Knee-up composition from complete head to just above knees cut by bottom edge; centered horizontally, no side cropping. Consistent anatomical head scale about 230 pixels tall, camera at chest height. Medium-height shy female student, very long dark purple-black hair, fringe completely covering one eye, visible violet eye, faint blush, small shy smile. Beige oversized cardigan over navy uniform, white collar, purple ribbon, modest knee-length navy pleated skirt. Hugging the illustrated anime magazine from reference. Head top at y=90. No floating symbols.

### ritsu_normal

Use case: stylized-concept. Create ONE visual novel standing sprite matching the supplied approved portrait EXACTLY in face, hair, costume, colors, props, and refined anime art style. 1024x1536 PNG portrait with REAL transparent alpha background. No backdrop, haze, glow, shadow, checkerboard, text, logos, or extra objects. Wholesome fully clothed high-school student. Standing body slightly turned toward viewer, natural character-specific arms. Knee-up composition from complete head to just above knees cut by bottom edge; centered horizontally, no side cropping. Consistent anatomical head scale about 230 pixels tall, camera at chest height. Medium-height cool male student, tousled black hair, grey eyes, multiple silver ear piercings, black studded choker and wrist cuff, navy silver-trim blazer with two safety pins, white shirt and loose burgundy tie, dark uniform trousers. Black BASS guitar case on shoulder, hand holding strap. Cool neutral aloof face. Head top at y=90; case fully within canvas.

### hiyori_smug

Use case: stylized-concept. Create ONE visual novel standing sprite matching the supplied approved portrait EXACTLY in face, hair, costume, colors, props, and refined anime art style. 1024x1536 PNG portrait with REAL transparent alpha background. No backdrop, haze, glow, shadow, checkerboard, text, logos, or extra objects. Wholesome fully clothed high-school student. Standing body slightly turned toward viewer, natural character-specific arms. Knee-up composition from complete head to just above knees cut by bottom edge; centered horizontally, no side cropping. Consistent anatomical head scale about 230 pixels tall, camera at chest height. Petite smallest female student, pink twin ponytails tied with burgundy bows, gold star hair clip, pink eyes. Half-lidded teasing smug grin with small fang, pointing toward viewer. Navy light-trim uniform blazer, white shirt, burgundy bow, modest knee-length pleated navy skirt, shoulder bag with round cute animal charm. Head top at y=150. Wholesome cheeky pose.

### saeko_angry

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Annoyed exhausted sigh, brows knitted in irritation, half-lidded eyes, slight open mouth as if sighing ugh. Keep lollipop stick and coffee.

### saeko_happy

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Rare small genuine warm smile, eyes softened. Keep lollipop stick and coffee.

### minato_happy

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Warm delighted smile, eyes gently crinkled, natural happy expression, keep glasses.

### minato_surprised

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Clearly surprised, eyes wide behind glasses, eyebrows raised, lips slightly parted.

### shizuku_happy

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Excited otaku delight, visible violet eye sparkling brightly, warm blush and open happy smile. Hidden eye stays covered by hair. No floating symbols.

### shizuku_sad

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Teary and anxious, visible violet eye moist with a small tear, worried raised inner brow, trembling downturned lips. Hidden eye stays covered.

### ritsu_happy

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Confident asymmetrical grin, relaxed self-assured grey eyes.

### ritsu_angry

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Irritated frown, knitted brows and narrowed grey eyes, tight displeased mouth.

### hiyori_happy

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Genuine bright joyful laugh, lifted cheeks, happy crescent eyes and naturally open laughing mouth.

### hiyori_angry

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Pouty irritation with puffed cheeks, knitted brows, narrowed pink eyes, pursed pouting lips.

### hiyori_shy

Use case: identity-preserve. Edit the supplied standing sprite. Change ONLY the facial expression as specified below. Preserve exact character identity, hair, pose, hands, anatomy, clothing folds, accessories, props, art style, framing, scale, placement and 1024x1536 portrait canvas. Same knee-up crop. Real transparent alpha background, absolutely no backdrop, no floating graphics, no text, no logo. Preserve original transparency. Expression: Flustered deep blush as her secret is exposed, wide embarrassed pink eyes looking slightly aside, raised worried brows and small awkward parted lips.

