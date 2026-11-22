// Club room scene layout: clickable furniture and where the chibi members stand.
// Coordinates are pixels of the 1536×1024 pixel-art room (public/pixel/room_*.webp).
import type { MemberId } from './cast';

export const SCENE_W = 1536;
export const SCENE_H = 1024;

export type SpotKey = 'desk' | 'whiteboard' | 'figures' | 'bookshelf' | 'sofa' | 'posters' | 'fridge' | 'window';

export interface Spot {
  key: SpotKey;
  label: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** member who hosts the panel */
  host: MemberId;
  /** where the floating icon sits (bottom tip of the bubble), room pixels */
  pin: { x: number; y: number };
}

// Measured on the art (docs/art/pixel/layout.json), trimmed where boxes overlap so each click hits one object.
export const SPOTS: Spot[] = [
  { key: 'window', label: '오늘의 명대사', icon: '🌸', x: 158, y: 40, w: 214, h: 336, host: 'shizuku', pin: { x: 265, y: 150 } },
  { key: 'figures', label: '업적 진열장', icon: '🏆', x: 0, y: 236, w: 156, h: 520, host: 'hiyori', pin: { x: 80, y: 300 } },
  { key: 'fridge', label: '아재개그', icon: '🧃', x: 436, y: 212, w: 128, h: 178, host: 'hiyori', pin: { x: 500, y: 230 } },
  { key: 'whiteboard', label: '오늘의 미션', icon: '📋', x: 572, y: 164, w: 388, h: 216, host: 'shizuku', pin: { x: 766, y: 176 } },
  { key: 'posters', label: '스토리', icon: '🎬', x: 964, y: 136, w: 120, h: 256, host: 'shizuku', pin: { x: 1024, y: 150 } },
  { key: 'bookshelf', label: '자습·도서관', icon: '📚', x: 1104, y: 124, w: 272, h: 254, host: 'saeko', pin: { x: 1240, y: 140 } },
  { key: 'sofa', label: '대화', icon: '💬', x: 1144, y: 380, w: 392, h: 308, host: 'ritsu', pin: { x: 1475, y: 425 } },
  { key: 'desk', label: 'JLPT 시험', icon: '📝', x: 456, y: 392, w: 628, h: 328, host: 'minato', pin: { x: 690, y: 475 } },
];

/** Where each member stands (feet), next to the furniture that fits them; front to back is handled by y. */
export const STAND: Record<MemberId, { x: number; y: number }> = {
  hiyori: { x: 215, y: 800 }, // admiring the figure case
  shizuku: { x: 410, y: 700 }, // by the manga shelf
  minato: { x: 770, y: 815 }, // in front of the desk, running the club
  saeko: { x: 1075, y: 760 }, // leaning at the desk corner
  ritsu: { x: 1215, y: 700 }, // on the rug by the sofa, bass on her back
  akane: { x: 585, y: 925 },
  keita: { x: 960, y: 935 },
  mei: { x: 1400, y: 905 },
  sota: { x: 300, y: 950 },
};

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Members drawn into the room art (public/pixel/room_<day|evening>_y<year>.webp), per story year.
 * Measured on the art (docs/art/pixel/v3/members.json). A year listed here uses its drawn scene;
 * otherwise the plain room with chibi sprites at STAND is shown.
 */
export const DRAWN: Partial<Record<1 | 2 | 3, Partial<Record<MemberId, Box>>>> = {
  1: {
    minato: { x: 763, y: 260, w: 132, h: 170 },
    shizuku: { x: 458, y: 399, w: 160, h: 282 },
    hiyori: { x: 144, y: 497, w: 170, h: 202 },
    ritsu: { x: 1230, y: 354, w: 178, h: 264 },
    saeko: { x: 344, y: 282, w: 107, h: 235 },
  },
  2: {
    minato: { x: 763, y: 260, w: 132, h: 170 },
    shizuku: { x: 458, y: 399, w: 160, h: 282 },
    hiyori: { x: 144, y: 497, w: 170, h: 202 },
    ritsu: { x: 1230, y: 354, w: 178, h: 264 },
    saeko: { x: 344, y: 282, w: 107, h: 235 },
    akane: { x: 918, y: 402, w: 190, h: 280 },
    keita: { x: 914, y: 323, w: 117, h: 166 },
  },
  3: {
    minato: { x: 763, y: 260, w: 132, h: 170 },
    shizuku: { x: 458, y: 399, w: 160, h: 282 },
    hiyori: { x: 144, y: 497, w: 170, h: 202 },
    ritsu: { x: 1230, y: 354, w: 178, h: 264 },
    saeko: { x: 344, y: 282, w: 107, h: 235 },
    akane: { x: 918, y: 402, w: 190, h: 280 },
    keita: { x: 914, y: 323, w: 117, h: 166 },
    mei: { x: 1073, y: 394, w: 97, h: 227 },
    sota: { x: 1027, y: 256, w: 118, h: 240 },
  },
};

/** Members farther back (closer to the wall) are drawn smaller. */
export function depthScale(y: number): number {
  const t = Math.max(0, Math.min(1, (y - 560) / 420));
  return 0.74 + 0.26 * t;
}

/** What each member says in the room when tapped (first line), mixed with their lines from cast.ts. */
export const ROOM_LINES: Record<MemberId, { jp: string; ko: string }> = {
  saeko: { jp: '…まだ帰{かえ}らないのか。ほどほどにしとけよ。', ko: '…아직 안 가? 적당히 해.' },
  minato: { jp: '机{つくえ}に今日{きょう}の模試{もし}を置{お}いておいた。解{と}いてみるか？', ko: '책상에 오늘 모의고사 놔뒀다. 풀어 볼래?' },
  shizuku: { jp: 'ホワイトボードに…今日{きょう}のミッション、書{か}いた…ふひ', ko: '화이트보드에… 오늘의 미션 적었어… 후히' },
  ritsu: { jp: 'ソファ、空{あ}いてるぞ。…少{すこ}し話{はな}すか？', ko: '소파 비었어. …좀 얘기할래?' },
  hiyori: { jp: 'センパイ、トロフィー棚{だな}スカスカですよ～？ ざーこ♪', ko: '선배, 트로피 선반 텅텅이에요~? 허접♪' },
  akane: { jp: 'マジ聞{き}いて！ 新作{しんさく}のプラモ、ガチでヤバいんだけど！', ko: '진짜 들어 봐! 신작 프라모델 완전 대박이거든!' },
  keita: { jp: '…うっす。衣装{いしょう}、縫{ぬ}ってるっす。', ko: '…안녕하세요. 의상 꿰매는 중이에요.' },
  mei: { jp: '先輩{せんぱい}、この言葉{ことば}の意味{いみ}、教{おし}えてください！ メモします！', ko: '선배, 이 말 뜻 알려 주세요! 메모할게요!' },
  sota: { jp: 'なあなあ、今日{きょう}の部室{ぶしつ}、ラノベの一話目{いちわめ}っぽない？', ko: '있잖아, 오늘 부실 라노벨 1화 같지 않아?' },
};

/** Chibi height relative to the scene height. */
export const CHIBI_H = 0.25;

/** Where the scene starts scrolled on narrow screens (center of the desk). */
export const FOCUS_X = 771;
