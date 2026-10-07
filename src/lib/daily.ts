import type { Content, Item, Level } from './content';
import { today } from './date';
import { getProgress, setDayPlan, type DayPlan, type LevelPref } from './store';

export const GRAMMAR_PER_DAY = 1;
export const PHRASES_PER_DAY = 3;

export function hash(s: string, seed = 0): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Share of N1 picks per level preference. */
const N1_RATIO: Record<LevelPref, number> = { N2: 0, mix: 0.3, N1: 1 };

function pick<T extends Item & { level: Level }>(
  pool: T[],
  count: number,
  exclude: Set<string>,
  pref: LevelPref,
  seed: number,
): string[] {
  const order = (xs: T[]) => xs.filter((x) => !exclude.has(x.id)).sort((a, b) => hash(a.id, seed) - hash(b.id, seed));
  const n2 = order(pool.filter((x) => x.level === 'N2'));
  const n1 = order(pool.filter((x) => x.level === 'N1'));
  const ratio = N1_RATIO[pref];
  const out: string[] = [];
  let n1Taken = 0;
  while (out.length < count && (n1.length || n2.length)) {
    // take N1 whenever we're below the target share, falling back to whatever is left
    const wantN1 = n1Taken < Math.round((out.length + 1) * ratio);
    const from = wantN1 ? (n1.length ? n1 : n2) : n2.length ? n2 : n1;
    const next = from.shift()!;
    if (next.level === 'N1') n1Taken++;
    out.push(next.id);
  }
  return out;
}

/** Next unseen items in the user's study order. */
export function pickNew<T extends Item & { level: Level }>(pool: T[], count: number, exclude: Set<string>): string[] {
  const p = getProgress();
  return pick(pool, count, exclude, p.settings.level, p.seed);
}

/** Return today's plan, creating it (or refreshing a not-yet-started words list) when needed. */
export function ensureTodayPlan(c: Content): DayPlan {
  const p = getProgress();
  const d = today();
  const existing = p.days[d];
  const { newPerDay, level } = p.settings;
  const seen = new Set(Object.keys(p.items));
  if (existing) {
    if (existing.done.words) return existing;
    // the daily word count was changed in settings before today's lesson started
    const words = pick(c.words, newPerDay, seen, level, p.seed);
    if (words.join() === existing.words.join()) return existing;
    const plan = { ...existing, words };
    setDayPlan(d, plan);
    return plan;
  }
  const plan: DayPlan = {
    created: Date.now(),
    words: pick(c.words, newPerDay, seen, level, p.seed),
    grammar: pick(c.grammar, GRAMMAR_PER_DAY, seen, level, p.seed),
    phrases: pick(c.phrases, PHRASES_PER_DAY, seen, level, p.seed),
    done: {},
  };
  setDayPlan(d, plan);
  return plan;
}

export function poolStats(c: Content) {
  const p = getProgress();
  const count = (pool: Item[]) => ({ total: pool.length, seen: pool.filter((x) => p.items[x.id]).length });
  return { words: count(c.words), grammar: count(c.grammar), phrases: count(c.phrases) };
}
