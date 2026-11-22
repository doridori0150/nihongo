"""Rebuild deliverables from built-in image generation sources, only under this folder."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'raw'
NN = Image.Resampling.NEAREST
IDS = ['saeko', 'minato', 'shizuku', 'ritsu', 'hiyori', 'akane', 'keita', 'mei', 'sota']

def palette(im, count=48):
    return im.convert('RGB').quantize(colors=count, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')

def room_palette(im):
    im=im.convert('RGB')
    common=im.quantize(colors=32,method=Image.Quantize.MEDIANCUT).getpalette()[:96]
    accents=im.quantize(colors=16,method=Image.Quantize.MAXCOVERAGE).getpalette()[:48]
    pal=Image.new('P',(1,1))
    colors=common+accents
    pal.putpalette(colors+colors[:3]*(256-48))
    return im.quantize(palette=pal,dither=Image.Dither.NONE).convert('RGB')

day = Image.open(RAW/'room_day.png').convert('RGB').resize((384,256), NN)
day = room_palette(day)
day.resize((1536,1024), NN).save(ROOT/'room_day.png')

# The generative edit supplies illumination, never replacement furniture geometry.
# Transfer a low-frequency RGB light field to the exact day pixels. This avoids
# even tiny line/position drift from the generative edit. Quantization removes
# smooth gradients from the final low-resolution raster.
raw_day = Image.open(RAW/'room_day.png').convert('RGB').resize((384,256), NN)
raw_evening = Image.open(RAW/'room_evening.png').convert('RGB').resize((384,256), NN)
light_day = np.asarray(raw_day.filter(ImageFilter.MedianFilter(5)), dtype=float)
light_evening = np.asarray(raw_evening.filter(ImageFilter.MedianFilter(5)), dtype=float)
ratio = np.clip((light_evening+12)/(light_day+12), .35, 1.5)
evening = Image.fromarray(np.uint8(np.clip(np.asarray(day,dtype=float)*ratio,0,255)))
room_palette(evening).resize((1536,1024),NN).save(ROOT/'room_evening.png')

# Hair-top to chin cuts measured visually on 1280px preview coordinates.
# Compress only the lower body vertically so each sprite has 2.5-head proportions.
chin = dict(saeko=420,minato=470,shizuku=440,ritsu=455,hiyori=450,akane=430,keita=505,mei=460,sota=490)
reports = {}
for name in IDS:
    source = Image.open(RAW/f'chibi_{name}.png').convert('RGBA')
    source.putalpha(source.getchannel('A').point(lambda a: 255 if a>=128 else 0))
    bbox = source.getbbox()
    if not bbox:
        raise ValueError(f'Empty sprite {name}')
    cut = round(chin[name] * source.height / 1280)-bbox[1]
    sprite = source.crop(bbox)
    height = 172 if name=='keita' else 179
    head_h = round(height*.4)
    width = round(sprite.width*head_h/cut)
    head = sprite.crop((0,0,sprite.width,cut)).resize((width,head_h),NN)
    body = sprite.crop((0,cut,sprite.width,sprite.height)).resize((width,height-head_h),NN)
    native = Image.new('RGBA',(256,256))
    x, y = (256-width)//2, 248-height
    native.paste(head,(x,y))
    native.paste(body,(x,y+head_h))
    alpha = native.getchannel('A').point(lambda a:255 if a>=128 else 0)
    # Quantize only foreground colors; transparent black does not consume palette.
    pix = np.asarray(native.convert('RGB')).copy()
    a = np.asarray(alpha)
    pix[a==0] = (65,49,70)
    native = palette(Image.fromarray(pix),48).convert('RGBA')
    native.putalpha(alpha)
    # Canonical transparent pixels have zero RGB too.
    p = np.asarray(native).copy()
    p[p[:,:,3]==0] = 0
    native = Image.fromarray(p)
    native.resize((1024,1024),NN).save(ROOT/f'chibi_{name}.png')

# These bounding boxes are measured against the FINAL day raster.
# sofa includes coffee table; desk includes chairs and desktop props.
# Window bounds are its frame, not adjacent curtain/plant decorations.
boxes = [
    ('window',88,0,284,376),
    ('figures',0,236,156,520),
    ('fridge',436,212,128,276),
    ('whiteboard',572,164,388,216),
    ('posters',964,136,120,256),
    ('bookshelf',1104,124,272,376),
    ('sofa',1144,380,392,308),
    ('desk',456,392,628,328),
]
layout = [dict(key=k,x=x,y=y,w=w,h=h) for k,x,y,w,h in boxes]
(ROOT/'layout.json').write_text(json.dumps(layout,indent=2)+'\n',encoding='utf-8')

def font(n):
    try: return ImageFont.truetype('C:/Windows/Fonts/consola.ttf',n)
    except OSError: return ImageFont.load_default()

overlay = Image.open(ROOT/'room_day.png').convert('RGBA')
d = ImageDraw.Draw(overlay)
colors = ['#38edff','#ff8acc','#7dff90','#fff374','#bd9bff','#ffb86b','#83c4ff','#ff7373']
for b,c in zip(layout,colors):
    x,y,w,h = b['x'],b['y'],b['w'],b['h']
    d.rectangle((x,y,x+w-1,y+h-1),outline=c,width=4)
    label = b['key']
    tw = d.textbbox((0,0),label,font=font(24))[2]+12
    d.rectangle((x,y,x+tw,y+32),fill='#202033')
    d.text((x+6,y+2),label,fill=c,font=font(24))
overlay.convert('RGB').save(ROOT/'layout_debug.png')

sheet = Image.new('RGB',(1200,1460),'#252433')
d = ImageDraw.Draw(sheet)
for i,name in enumerate(['room_day','room_evening']):
    im=Image.open(ROOT/f'{name}.png').convert('RGB').resize((576,384),NN)
    x=12+i*600
    sheet.paste(im,(x,36))
    d.text((x,8),name+'.png',font=font(20),fill='white')
for i,name in enumerate(IDS):
    col,row=i%3,i//3
    x,y=col*400+8,450+row*332
    card=Image.new('RGBA',(384,296),(128,128,128,255))
    im=Image.open(ROOT/f'chibi_{name}.png').resize((288,288),NN)
    card.alpha_composite(im,(48,4))
    sheet.paste(card.convert('RGB'),(x,y))
    d.text((x,y+300),f'chibi_{name}.png',font=font(17),fill='white')
sheet.save(ROOT/'contact_sheet.png')

# Mechanical verification: full blocks including alpha, exact dimensions,
# real alpha, corners, foreground size, palette count, bounding box bounds.
for name in ['room_day','room_evening']+['chibi_'+s for s in IDS]:
    im=Image.open(ROOT/f'{name}.png')
    expected=(1536,1024) if name.startswith('room') else (1024,1024)
    assert im.size==expected, name
    arr=np.asarray(im)
    uniform=bool(np.array_equal(arr,np.repeat(np.repeat(arr[::4,::4],4,axis=0),4,axis=1)))
    assert uniform, name
    report={'size':list(im.size),'mode':im.mode,'uniform_4x4_blocks':uniform}
    if name.startswith('chibi'):
        alpha=np.asarray(im.getchannel('A'))
        corners=[int(alpha[y,x]) for x,y in [(0,0),(1023,0),(0,1023),(1023,1023)]]
        assert corners==[0]*4 and set(np.unique(alpha))=={0,255}
        bb=im.getbbox()
        report.update(alpha_corners=corners,alpha_values=[0,255],bbox=list(bb),height_percent=round((bb[3]-bb[1])/1024*100,2),bottom_margin=1024-bb[3])
        report['opaque_colors']=len(np.unique(arr[alpha==255,:3],axis=0))
    else:
        report['colors']=len(im.getcolors(1000000))
    reports[name]=report
for b in layout:
    assert 0<=b['x']<b['x']+b['w']<=1536
    assert 0<=b['y']<b['y']+b['h']<=1024
(ROOT/'validation.json').write_text(json.dumps(reports,indent=2)+'\n',encoding='utf-8')

generation=json.loads((ROOT/'generation.json').read_text(encoding='utf-8'))
notes=['# Pixel asset production notes','',
    '생성: 내장 image_gen 도구. 원본은 raw/에 보존. 최종 파일은 이 폴더의 PNG입니다.',
    '후처리: process_assets.py (Python + Pillow + NumPy). 배경 384×256, 캐릭터 256×256에서 최대 48색으로 양자화 후 nearest-neighbour 4배 확대했습니다. 모든 최종 게임 에셋의 RGBA/RGB 4×4 블록이 동일함을 전수 검사했습니다.',
    '캐릭터는 머리/몸통 경계를 기준으로 몸통 세로 비율을 조정하여 약 2.5등신으로 맞췄습니다. 일반 캐릭터 높이 716px(69.92%), 작은 체구인 keita는 688px(67.19%), 발 아래 여백은 32px입니다.',
    '저녁은 낮 이미지를 내장 도구로 편집한 결과의 조명장만 낮 원본에 전달했습니다. 가구와 바닥 선의 원본 좌표를 그대로 사용하며, 조명장 추출은 median filter로 경계를 보존합니다. RGB 밝기/색 변화 외에 이동/변형/워핑은 없습니다.',
    'layout.json은 최종 room_day.png 기준 실측입니다. desk는 의자/상판 소품 포함, sofa는 커피 테이블 포함, bookshelf는 본체 기준(위의 수납박스/식물 제외), window는 창틀 기준(커튼 제외)입니다. 투시상 가려진 물체의 숨겨진 면을 추정하지 않고 보이는 범위로 측정했습니다.',
    'layout_debug.png의 박스와 키를 최종 배경 위에 표시하고 실제 이미지를 열어 시각 확인했습니다. 직사각형은 불규칙한 실루엣 주변의 빈 영역을 포함하며, window/figures, fridge/desk, bookshelf/sofa는 투시상 직사각형이 일부 겹칩니다. 실제 클릭 구현에서는 전경 오브젝트 우선 순위 또는 실루엣 마스크가 필요합니다. 모든 클릭 대상이 완전히 비중첩이어야 한다는 요구는 충족하지 못했습니다.',
    '하단 y=768..1023은 빈 바닥입니다. 추가 장식용 낮은 책장/벽 선반은 8개 클릭 키에 포함하지 않았습니다.',
    '제약: 생성기는 정확한 저해상도 격자로 출력하지 않으므로 native 1/4 직접 생성은 보장되지 않습니다. 요구된 정확한 4×4 블록과 색상 수는 스크립트 후처리로 보장했습니다. 박스의 일부 투시 중첩은 위에 명시했습니다. 캐릭터는 정면에 가까운 약한 3/4 방향입니다.',
    '', '## Alpha checks','', '| asset | corner alpha (TL, TR, BL, BR) | real alpha | colors |','|---|---|---|---|']
for name in IDS:
    r=reports['chibi_'+name]
    notes.append(f"| chibi_{name}.png | {r['alpha_corners']} | binary 0/255, PASS | {r['opaque_colors']} |")
notes+=['','크로마키 배경은 사용하지 않았습니다. 모든 캐릭터에 실제 알파가 있습니다. 자세한 수치: validation.json.', '', '## Exact generation prompts','']
for key,value in generation['prompts'].items():
    notes += [f'### {key}', '', '```text', value, '```','']
(ROOT/'NOTES.md').write_text('\n'.join(notes)+'\n',encoding='utf-8')
print(json.dumps(reports,indent=2))
