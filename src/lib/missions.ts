// Daily missions: two fixed ones plus two picked per day, rewarded with XP on the whiteboard.
import { getApiKey } from './aiKey';
import { hash } from './daily';
import { inClaude } from './runtime';
import type { Content } from './content';
import { type Session, reviewSession } from './sessions';
import { type ExamLevel, type Progress, addXp, claimMission, dueItems, evOn, getProgress } from './store';

export interface Mission {
  id: string;
  icon: string;
  title: string;
  goal: number;
  value: number;
  /** what to open to work on it */
  go: 'study' | 'exam' | 'cards' | 'talk' | 'story' | 'review';
}

export const MISSION_XP = 10;
export const ALL_CLEAR_XP = 20;
export const ALL_CLEAR = 'all';

type Def = Omit<Mission, 'value'> & { value: (p: Progress, d: string) => number; when?: (p: Progress, d: string) => boolean };

const FIXED: Def[] = [
  {
    id: 'words',
    icon: '📖',
    title: '새 단어 {n}개 외우기',
    goal: 0, // newPerDay, filled in below
    go: 'study',
    value: (p, d) => evOn(p, d, 'words'),
  },
  { id: 'exam', icon: '📝', title: 'JLPT 데일리 시험 보기', goal: 1, go: 'exam', value: (p, d) => evOn(p, d, 'exam') },
];

const POOL: Def[] = [
  { id: 'grammar', icon: '🧩', title: '오늘의 문법 익히기', goal: 1, go: 'study', value: (p, d) => (p.days[d]?.done.grammar ? 1 : 0) },
  {
    id: 'review',
    icon: '🔁',
    title: '오늘 복습 끝내기',
    goal: 1,
    go: 'review',
    value: (p, d) => (p.days[d]?.done.review ? 1 : 0),
    // only on days that started with something to review (stays stable once it is done)
    when: (p, d) => !!p.days[d]?.done.review || evOn(p, d, 'review') > 0 || dueItems(p, d).length > 0,
  },
  { id: 'cards', icon: '🃏', title: '암기 카드 10장 넘기기', goal: 10, go: 'cards', value: (p, d) => evOn(p, d, 'cards') },
  {
    id: 'chat',
    icon: '💬',
    title: '부원과 일본어로 대화하기',
    goal: 1,
    go: 'talk',
    value: (p, d) => evOn(p, d, 'chat'),
    when: () => inClaude || !!getApiKey(),
  },
  { id: 'story', icon: '🎬', title: '스토리 1화 보기', goal: 1, go: 'story', value: (p, d) => evOn(p, d, 'story') },
  { id: 'examGood', icon: '🎯', title: '시험에서 80점 이상', goal: 1, go: 'exam', value: (p, d) => evOn(p, d, 'examGood') },
  { id: 'phrases', icon: '🗨️', title: '오늘의 표현 연습하기', goal: 1, go: 'study', value: (p, d) => (p.days[d]?.done.phrases ? 1 : 0) },
];

export function missionsFor(p: Progress, d: string): Mission[] {
  const seed = hash(d, p.seed);
  const extra = POOL.filter((m) => !m.when || m.when(p, d))
    .sort((a, b) => hash(a.id, seed) - hash(b.id, seed))
    .slice(0, 2);
  return [...FIXED, ...extra].map((m) => {
    const goal = m.id === 'words' ? Math.max(1, p.days[d]?.words.length || p.settings.newPerDay) : m.goal;
    return { ...m, title: m.title.replace('{n}', String(goal)), goal, value: Math.min(m.value(p, d), goal) };
  });
}

export function claimed(p: Progress, d: string, id: string): boolean {
  return !!p.claims?.[d]?.includes(id);
}

/** Take a finished mission's reward; returns the XP given (0 if not finished or already taken). */
export function claim(m: Mission, d: string): number {
  const p = getProgress();
  if (m.value < m.goal || claimed(p, d, m.id)) return 0;
  claimMission(m.id, d);
  addXp(MISSION_XP);
  let xp = MISSION_XP;
  const after = getProgress();
  const all = missionsFor(after, d);
  if (!claimed(after, d, ALL_CLEAR) && all.every((x) => claimed(after, d, x.id))) {
    claimMission(ALL_CLEAR, d);
    addXp(ALL_CLEAR_XP);
    xp += ALL_CLEAR_XP;
  }
  return xp;
}

/** Open what a mission asks for (exam, review, study, talk, story). */
export function goToMission(
  m: Mission,
  actions: { content: Content; go: (r: string) => void; start: (s: Session | null) => void; startExam: (lv: ExamLevel) => void },
  level: ExamLevel,
) {
  if (m.go === 'exam') return actions.startExam(level);
  if (m.go === 'review') return actions.start(reviewSession(actions.content));
  actions.go(m.go === 'cards' ? 'study' : m.go);
}

/** Missions finished but not yet claimed (for the whiteboard badge). */
export function claimable(p: Progress, d: string): number {
  return missionsFor(p, d).filter((m) => m.value >= m.goal && !claimed(p, d, m.id)).length;
}
