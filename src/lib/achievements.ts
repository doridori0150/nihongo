// Achievements computed from the whole learning record; the first time each is earned is kept in progress.ach.
import { ALL_CLEAR } from './missions';
import { type Progress, evTotal, streak, totalXp } from './store';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  goal: number;
  value: number;
  /** first time earned (ms), if earned */
  at?: number;
}

type Def = Omit<Achievement, 'value' | 'at'> & { value: (p: Progress) => number };

const itemsOf = (p: Progress, prefix: string) => Object.keys(p.items).filter((id) => id.startsWith(prefix)).length;
const examRecs = (p: Progress) => Object.values(p.exams ?? {}).flatMap((day) => Object.entries(day));
const allClearDays = (p: Progress) => Object.values(p.claims ?? {}).filter((ids) => ids.includes(ALL_CLEAR)).length;

function tiers(base: Omit<Def, 'id' | 'goal' | 'title' | 'desc'>, id: string, steps: [number, string, string][]): Def[] {
  return steps.map(([goal, title, desc]) => ({ ...base, id: `${id}${goal}`, goal, title, desc }));
}

const DEFS: Def[] = [
  ...tiers({ icon: '🔥', value: (p) => streak(p).days }, 'streak', [
    [3, '사흘의 불씨', '3일 연속 학습'],
    [7, '일주일 개근', '7일 연속 학습'],
    [30, '한 달의 불꽃', '30일 연속 학습'],
    [100, '백일의 전설', '100일 연속 학습'],
  ]),
  ...tiers({ icon: '📖', value: (p) => itemsOf(p, 'w:') }, 'words', [
    [50, '단어 수집가', '단어 50개 학습'],
    [200, '걸어 다니는 단어장', '단어 200개 학습'],
    [500, '사전과 친구', '단어 500개 학습'],
  ]),
  ...tiers({ icon: '🧩', value: (p) => itemsOf(p, 'g:') }, 'grammar', [
    [20, '문법 입문', '문법 20개 학습'],
    [100, '문법 마스터', '문법 100개 학습'],
  ]),
  ...tiers({ icon: '📝', value: (p) => evTotal(p, 'exam') }, 'exam', [
    [1, '첫 시험', 'JLPT 데일리 시험 1회'],
    [10, '시험 단골', '데일리 시험 10회'],
    [50, '모의고사 중독', '데일리 시험 50회'],
  ]),
  {
    id: 'examPerfect',
    icon: '💯',
    title: '만점 답안',
    desc: '데일리 시험 만점',
    goal: 1,
    value: (p) => (examRecs(p).some(([, r]) => r.total > 0 && r.score === r.total) ? 1 : 0),
  },
  {
    id: 'n1pass',
    icon: '👑',
    title: 'N1의 벽을 넘어',
    desc: 'N1 데일리 시험 80점 이상',
    goal: 1,
    value: (p) => (examRecs(p).some(([lv, r]) => lv === 'N1' && r.total > 0 && r.score / r.total >= 0.8) ? 1 : 0),
  },
  ...tiers({ icon: '🎬', value: (p) => Object.keys(p.story?.done ?? {}).length }, 'story', [
    [1, '입부 신청서', '스토리 1화 완료'],
    [12, '1학기 수료', '스토리 12화 완료'],
    [36, '1년 차 부원', '스토리 36화 완료'],
    [108, '졸업 앨범', '스토리 108화 완료'],
  ]),
  ...tiers({ icon: '💬', value: (p) => evTotal(p, 'chat') }, 'chat', [
    [1, '첫 수다', '부원과 대화 1회'],
    [10, '수다쟁이', '대화 10회'],
    [50, '부실의 분위기 메이커', '대화 50회'],
  ]),
  ...tiers({ icon: '🃏', value: (p) => evTotal(p, 'cards') }, 'cards', [
    [100, '카드 넘기기 장인', '암기 카드 100장'],
    [1000, '카드 마스터', '암기 카드 1000장'],
  ]),
  ...tiers({ icon: '✅', value: allClearDays }, 'allclear', [
    [1, '오늘의 올클리어', '하루 미션 전부 완료'],
    [7, '성실한 부원', '미션 올클리어 7일'],
    [30, '부실의 기둥', '미션 올클리어 30일'],
  ]),
  ...tiers({ icon: '⚡', value: totalXp }, 'xp', [
    [1000, '1천 XP', '누적 1,000 XP'],
    [5000, '5천 XP', '누적 5,000 XP'],
    [20000, '2만 XP', '누적 20,000 XP'],
  ]),
];

export const ACHIEVEMENT_COUNT = DEFS.length;

export function achievements(p: Progress): Achievement[] {
  return DEFS.map((d) => ({
    id: d.id,
    icon: d.icon,
    title: d.title,
    desc: d.desc,
    goal: d.goal,
    value: Math.min(d.value(p), d.goal),
    at: p.ach?.[d.id],
  }));
}

/** Achievements whose goal is reached but not yet recorded. */
export function newlyEarned(p: Progress): Achievement[] {
  return achievements(p).filter((a) => !a.at && a.value >= a.goal);
}
