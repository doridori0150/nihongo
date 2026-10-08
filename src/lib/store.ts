import { useSyncExternalStore } from 'react';
import { addDays, today } from './date';

/** Review intervals in days after a mistake: 1 → 3 → 7 → 14 → 28 → graduated. */
export const INTERVALS = [1, 3, 7, 14, 28];
export const STAGE_LEARNED = -1; // learned without mistakes, never scheduled
export const STAGE_GRADUATED = INTERVALS.length;

export interface ItemRec {
  /** -1 learned cleanly, 0..4 waiting for INTERVALS[stage]-day review, 5 graduated */
  stage: number;
  due: string | null;
  right: number;
  wrong: number;
  first: string;
  last: string;
  /** last update (ms) — newest wins when merging devices */
  u: number;
}

export type TaskKey = 'words' | 'grammar' | 'phrases' | 'review' | 'ai';

export interface DayPlan {
  created: number;
  words: string[];
  grammar: string[];
  phrases: string[];
  done: Partial<Record<TaskKey, number>>;
}

export type LevelPref = 'N2' | 'mix' | 'N1';

export interface Settings {
  newPerDay: number;
  level: LevelPref;
  furigana: boolean;
  sound: boolean;
  ttsRate: number;
  u: number;
}

export interface AiLogEntry {
  id: string;
  at: number;
  mode: 'situation' | 'compose' | 'opinion' | 'roleplay';
  prompt: string;
  answer: string;
  score: number;
  corrected: string;
  feedback: string;
}

export interface Progress {
  v: 1;
  seed: number;
  items: Record<string, ItemRec>;
  days: Record<string, DayPlan>;
  /** xp[date][deviceId] — per device so merging never double counts or loses points */
  xp: Record<string, Record<string, number>>;
  /** acc[date][deviceId] = [correct, wrong] answers, merged like xp */
  acc: Record<string, Record<string, [number, number]>>;
  settings: Settings;
  ai: AiLogEntry[];
  /** flashcard deck: items the learner checked to memorize */
  deck: Record<string, DeckRec>;
}

export interface DeckRec {
  /** false once removed (kept so the removal syncs to other devices) */
  on: boolean;
  /** -1 new, 0..4 = INTERVALS[stage] days, 5 mastered */
  stage: number;
  due: string;
  added: number;
  reps: number;
  u: number;
}

const KEY = 'nd.progress';
export const AI_LOG_MAX = 200;

export const DEFAULT_SETTINGS: Settings = {
  newPerDay: 10,
  level: 'mix',
  furigana: true,
  sound: true,
  ttsRate: 0.9,
  u: 0,
};

function fresh(): Progress {
  return {
    v: 1,
    seed: Math.floor(Math.random() * 2 ** 31),
    items: {},
    days: {},
    xp: {},
    acc: {},
    settings: { ...DEFAULT_SETTINGS },
    ai: [],
    deck: {},
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked — progress stays in memory for this session */
  }
}

export const local = {
  get: safeGet,
  set: safeSet,
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const deviceId: string = (() => {
  let id = safeGet('nd.device');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    safeSet('nd.device', id);
  }
  return id;
})();

function load(): Progress {
  const raw = safeGet(KEY);
  if (!raw) return fresh();
  try {
    const p = JSON.parse(raw) as Progress;
    return { ...fresh(), ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
  } catch {
    return fresh();
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();
const changeHooks = new Set<() => void>();

function emit(persist = true) {
  if (persist) safeSet(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function getProgress(): Progress {
  return state;
}

/** Apply an immutable update. `local` changes trigger sync hooks; merges from sync do not. */
export function update(fn: (p: Progress) => Progress, { fromSync = false } = {}) {
  state = fn(state);
  emit();
  if (!fromSync) changeHooks.forEach((h) => h());
}

export function onLocalChange(hook: () => void): () => void {
  changeHooks.add(hook);
  return () => changeHooks.delete(hook);
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function resetProgress() {
  state = fresh();
  emit();
  changeHooks.forEach((h) => h());
}

// ───────── item scheduling ─────────

export interface ItemResult {
  id: string;
  /** true if the first attempt(s) at this item in the session were all correct */
  correct: boolean;
}

/** Record items seen for the first time in a lesson. Mistakes enter the review cycle. */
export function recordLearned(results: ItemResult[]) {
  const d = today();
  const now = Date.now();
  update((p) => {
    const items = { ...p.items };
    for (const r of results) {
      const prev = items[r.id];
      if (prev && prev.stage >= 0 && prev.stage < STAGE_GRADUATED && r.correct) {
        // already under review (e.g. re-studied): don't let a clean lesson skip the schedule
        items[r.id] = { ...prev, right: prev.right + 1, last: d, u: now };
        continue;
      }
      items[r.id] = {
        stage: r.correct ? (prev?.stage ?? STAGE_LEARNED) : 0,
        due: r.correct ? (prev?.due ?? null) : addDays(d, INTERVALS[0]),
        right: (prev?.right ?? 0) + (r.correct ? 1 : 0),
        wrong: (prev?.wrong ?? 0) + (r.correct ? 0 : 1),
        first: prev?.first ?? d,
        last: d,
        u: now,
      };
    }
    return { ...p, items };
  });
}

/** Record answers in a review session: correct advances 1→3→7→14→28, wrong restarts at 1 day. */
export function recordReviewed(results: ItemResult[]) {
  const d = today();
  const now = Date.now();
  update((p) => {
    const items = { ...p.items };
    for (const r of results) {
      const prev = items[r.id];
      if (!prev) continue;
      if (r.correct) {
        const stage = Math.max(prev.stage, 0) + 1;
        items[r.id] = {
          ...prev,
          stage,
          due: stage >= STAGE_GRADUATED ? null : addDays(d, INTERVALS[stage]),
          right: prev.right + 1,
          last: d,
          u: now,
        };
      } else {
        items[r.id] = { ...prev, stage: 0, due: addDays(d, INTERVALS[0]), wrong: prev.wrong + 1, last: d, u: now };
      }
    }
    return { ...p, items };
  });
}

/** Manually push an item into the review cycle ("다시 볼래요"). */
export function markForReview(id: string) {
  const d = today();
  update((p) => {
    const prev = p.items[id];
    return {
      ...p,
      items: {
        ...p.items,
        [id]: {
          stage: 0,
          due: addDays(d, INTERVALS[0]),
          right: prev?.right ?? 0,
          wrong: prev?.wrong ?? 0,
          first: prev?.first ?? d,
          last: prev?.last ?? d,
          u: Date.now(),
        },
      },
    };
  });
}

export function dueItems(p: Progress, date = today()): string[] {
  return Object.entries(p.items)
    .filter(([, r]) => r.stage >= 0 && r.stage < STAGE_GRADUATED && r.due !== null && r.due <= date)
    .sort((a, b) => (a[1].due! < b[1].due! ? -1 : a[1].due! > b[1].due! ? 1 : 0))
    .map(([id]) => id);
}

// ───────── xp / streak ─────────

export function addXp(n: number) {
  const d = today();
  update((p) => {
    const day = { ...(p.xp[d] ?? {}) };
    day[deviceId] = (day[deviceId] ?? 0) + n;
    return { ...p, xp: { ...p.xp, [d]: day } };
  });
}

/** Record answer counts for the accuracy signal. */
export function addAccuracy(correct: number, wrong: number) {
  const d = today();
  update((p) => {
    const day = { ...(p.acc?.[d] ?? {}) };
    const [c, w] = day[deviceId] ?? [0, 0];
    day[deviceId] = [c + correct, w + wrong];
    return { ...p, acc: { ...p.acc, [d]: day } };
  });
}

/** Share of correct answers over the last `days` days, or null with too few answers. */
export function recentAccuracy(p: Progress, days = 7, date = today()): { pct: number; total: number } | null {
  let c = 0;
  let w = 0;
  for (let i = 0; i < days; i++) {
    for (const [dc, dw] of Object.values(p.acc?.[addDays(date, -i)] ?? {})) {
      c += dc;
      w += dw;
    }
  }
  const total = c + w;
  return total >= 10 ? { pct: Math.round((c / total) * 100), total } : null;
}

export function xpOn(p: Progress, date: string): number {
  return Object.values(p.xp[date] ?? {}).reduce((a, b) => a + b, 0);
}

export function totalXp(p: Progress): number {
  return Object.keys(p.xp).reduce((sum, d) => sum + xpOn(p, d), 0);
}

export function streak(p: Progress, date = today()): { days: number; todayDone: boolean } {
  const todayDone = xpOn(p, date) > 0;
  let cur = todayDone ? date : addDays(date, -1);
  let days = 0;
  while (xpOn(p, cur) > 0) {
    days++;
    cur = addDays(cur, -1);
  }
  return { days, todayDone };
}

// ───────── day plan / settings / ai log ─────────

export function setDayPlan(date: string, plan: DayPlan) {
  update((p) => ({ ...p, days: { ...p.days, [date]: plan } }));
}

export function markDone(task: TaskKey, date = today()) {
  update((p) => {
    const plan = p.days[date];
    if (!plan || plan.done[task]) return p;
    return { ...p, days: { ...p.days, [date]: { ...plan, done: { ...plan.done, [task]: Date.now() } } } };
  });
}

export function setSettings(patch: Partial<Settings>) {
  update((p) => ({ ...p, settings: { ...p.settings, ...patch, u: Date.now() } }));
}

export function addAiLog(entry: AiLogEntry) {
  update((p) => ({ ...p, ai: [entry, ...p.ai].slice(0, AI_LOG_MAX) }));
}

// ───────── merge (for sync) ─────────

export function mergeProgress(a: Progress, b: Progress): Progress {
  const items: Record<string, ItemRec> = { ...a.items };
  for (const [id, rec] of Object.entries(b.items)) {
    const mine = items[id];
    if (!mine || rec.u > mine.u) items[id] = rec;
  }
  const days: Record<string, DayPlan> = { ...a.days };
  for (const [d, plan] of Object.entries(b.days)) {
    const mine = days[d];
    if (!mine) days[d] = plan;
    else {
      const base = mine.created <= plan.created ? mine : plan;
      const done = { ...plan.done, ...mine.done };
      days[d] = { ...base, done };
    }
  }
  const xp: Progress['xp'] = { ...a.xp };
  for (const [d, devs] of Object.entries(b.xp)) {
    const merged = { ...(xp[d] ?? {}) };
    for (const [dev, n] of Object.entries(devs)) merged[dev] = Math.max(merged[dev] ?? 0, n);
    xp[d] = merged;
  }
  const acc: Progress['acc'] = { ...(a.acc ?? {}) };
  for (const [d, devs] of Object.entries(b.acc ?? {})) {
    const merged = { ...(acc[d] ?? {}) };
    for (const [dev, [c, w]] of Object.entries(devs)) {
      const mine = merged[dev];
      // counts only grow on a device during a day, so the larger total is the newer one
      if (!mine || c + w > mine[0] + mine[1]) merged[dev] = [c, w];
    }
    acc[d] = merged;
  }
  const deck: Progress['deck'] = { ...(a.deck ?? {}) };
  for (const [id, rec] of Object.entries(b.deck ?? {})) {
    const mine = deck[id];
    if (!mine || rec.u > mine.u) deck[id] = rec;
  }
  const seenAi = new Set<string>();
  const ai = [...a.ai, ...b.ai]
    .filter((e) => (seenAi.has(e.id) ? false : (seenAi.add(e.id), true)))
    .sort((x, y) => y.at - x.at)
    .slice(0, AI_LOG_MAX);
  return {
    v: 1,
    seed: Math.min(a.seed, b.seed),
    items,
    days,
    xp,
    acc,
    settings: (b.settings?.u ?? 0) > (a.settings?.u ?? 0) ? { ...DEFAULT_SETTINGS, ...b.settings } : a.settings,
    ai,
    deck,
  };
}

// ───────── flashcard deck ─────────

export const DECK_MASTERED = INTERVALS.length;

export function setInDeck(ids: string[], on: boolean) {
  const d = today();
  const now = Date.now();
  update((p) => {
    const deck = { ...p.deck };
    for (const id of ids) {
      const prev = deck[id];
      if (on) deck[id] = prev?.on ? prev : { on: true, stage: -1, due: d, added: now, reps: prev?.reps ?? 0, u: now };
      else if (prev?.on) deck[id] = { ...prev, on: false, u: now };
    }
    return { ...p, deck };
  });
}

export type CardRating = 'again' | 'hard' | 'good';

/** again: back to the start (seen again today), hard: tomorrow, good: next step of 1·3·7·14·28 days. */
export function rateCards(results: { id: string; rating: CardRating }[]) {
  const d = today();
  const now = Date.now();
  update((p) => {
    const deck = { ...p.deck };
    for (const { id, rating } of results) {
      const prev = deck[id];
      if (!prev?.on) continue;
      let stage = prev.stage;
      let due = d;
      if (rating === 'again') {
        stage = 0;
        due = addDays(d, 1);
      } else if (rating === 'hard') {
        stage = Math.max(stage, 0);
        due = addDays(d, 1);
      } else {
        stage = Math.min(Math.max(stage, -1) + 1, DECK_MASTERED);
        due = addDays(d, stage >= DECK_MASTERED ? 60 : INTERVALS[stage]);
      }
      deck[id] = { ...prev, stage, due, reps: prev.reps + 1, u: now };
    }
    return { ...p, deck };
  });
}

export function deckIds(p: Progress): string[] {
  return Object.entries(p.deck ?? {})
    .filter(([, r]) => r.on)
    .sort((a, b) => b[1].added - a[1].added)
    .map(([id]) => id);
}

export function deckDue(p: Progress, date = today()): string[] {
  return Object.entries(p.deck ?? {})
    .filter(([, r]) => r.on && r.due <= date)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : a[1].added - b[1].added))
    .map(([id]) => id);
}

export function replaceFromSync(next: Progress) {
  update(() => next, { fromSync: true });
}
