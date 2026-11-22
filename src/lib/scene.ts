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
}

// Measured on the art (docs/art/pixel/layout.json), trimmed where boxes overlap so each click hits one object.
export const SPOTS: Spot[] = [
  { key: 'window', label: '오늘의 명대사', icon: '🌸', x: 158, y: 40, w: 214, h: 336, host: 'shizuku' },
  { key: 'figures', label: '업적 진열장', icon: '🏆', x: 0, y: 236, w: 156, h: 520, host: 'hiyori' },
  { key: 'fridge', label: '아재개그', icon: '🧃', x: 436, y: 212, w: 128, h: 178, host: 'hiyori' },
  { key: 'whiteboard', label: '오늘의 미션', icon: '📋', x: 572, y: 164, w: 388, h: 216, host: 'shizuku' },
  { key: 'posters', label: '스토리', icon: '🎬', x: 964, y: 136, w: 120, h: 256, host: 'shizuku' },
  { key: 'bookshelf', label: '자습·도서관', icon: '📚', x: 1104, y: 124, w: 272, h: 254, host: 'saeko' },
  { key: 'sofa', label: '대화', icon: '💬', x: 1144, y: 380, w: 392, h: 308, host: 'ritsu' },
  { key: 'desk', label: 'JLPT 시험', icon: '📝', x: 456, y: 392, w: 628, h: 328, host: 'minato' },
];

/** Floor spots (feet position) for the members on stage, front to back is handled by y. */
export const STANDS: { x: number; y: number }[] = [
  { x: 250, y: 935 },
  { x: 1250, y: 880 },
  { x: 740, y: 975 },
  { x: 425, y: 795 },
  { x: 1010, y: 800 },
  { x: 520, y: 815 },
  { x: 1430, y: 985 },
];

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
