// Visual-novel story data: episode files built from content-src/story/<year>/*.json.
import { useSyncExternalStore } from 'react';
import { type Progress, getProgress, update } from './store';

export type Face = 'normal' | 'happy' | 'angry' | 'sad' | 'surprised' | 'smug' | 'shy';

export interface StoryTerm {
  id: string;
  jp: string;
  ko: string;
  note: string;
}

export interface ChoiceOption {
  jp: string;
  ko: string;
  ok: boolean;
  tip?: string;
  aff?: Record<string, number>;
  then: Step[];
}

export type Step =
  | { bg: string }
  | { show: string; face?: Face }
  | { hide: string }
  | { narr: string; ko: string }
  | { say: string; who?: string; who_ko?: string; face?: Face; jp: string; ko: string }
  | { choice: string; options: ChoiceOption[] }
  | { if_aff: Record<string, number>; then: Step[]; else?: Step[] }
  /** Branch for whichever listed member has the highest affinity (ties: earlier in the list); `year` counts only that year's choices. */
  | { if_top: string[]; year?: number; branches: Record<string, Step[]>; else?: Step[] };

export interface EpisodeMeta {
  id: string;
  year: number;
  month: number;
  no: number;
  title: string;
  title_ko: string;
  summary_ko: string;
  level: string;
  focus: string[];
  bg: string;
  terms: number;
}

export interface Episode extends Omit<EpisodeMeta, 'bg' | 'terms'> {
  terms: StoryTerm[];
  script: Step[];
}

const base = () => import.meta.env.BASE_URL;

let indexPromise: Promise<EpisodeMeta[]> | null = null;
export function loadStoryIndex(): Promise<EpisodeMeta[]> {
  indexPromise ??= fetch(`${base()}data/story-index.json`)
    .then((r) => (r.ok ? (r.json() as Promise<EpisodeMeta[]>) : []))
    .catch(() => []);
  return indexPromise;
}

const episodes = new Map<string, Promise<Episode>>();
export function loadEpisode(id: string): Promise<Episode> {
  let p = episodes.get(id);
  if (!p) {
    p = fetch(`${base()}data/story/${id}.json`).then((r) => {
      if (!r.ok) throw new Error(`회차 ${id}를 불러오지 못했어요`);
      return r.json() as Promise<Episode>;
    });
    p.catch(() => episodes.delete(id));
    episodes.set(id, p);
  }
  return p;
}

export function useStoryIndex(): EpisodeMeta[] | null {
  return useSyncExternalStore(
    (l) => {
      void loadStoryIndex().then((list) => {
        cached = list;
        l();
      });
      return () => {};
    },
    () => cached,
  );
}
let cached: EpisodeMeta[] | null = null;

// ───────── player identity ─────────

export function playerName(p: Progress = getProgress()): string {
  return p.story?.me?.name?.trim() || 'キム';
}

/** Fill %name% and %kun% (くん for male players, さん otherwise). */
export function fill(text: string, p: Progress = getProgress()): string {
  const kun = p.story?.me?.gender === 'm' ? 'くん' : 'さん';
  return text.replace(/%name%/g, playerName(p)).replace(/%kun%/g, kun);
}

// ───────── progress ─────────

export interface ChoiceRec {
  /** chosen option index */
  o: number;
  aff: Record<string, number>;
  u: number;
}

export interface SavedLine {
  id: string;
  ep: string;
  who: string;
  jp: string;
  ko: string;
  at: number;
}

export interface StoryProgress {
  done: Record<string, number>;
  pos: { ep: string; i: number; u: number } | null;
  choices: Record<string, ChoiceRec>;
  saved: SavedLine[];
  me: { name: string; gender: 'm' | 'f' | 'n'; u: number };
}

export const EMPTY_STORY: StoryProgress = { done: {}, pos: null, choices: {}, saved: [], me: { name: '', gender: 'n', u: 0 } };

const st = (p: Progress): StoryProgress => ({ ...EMPTY_STORY, ...(p.story ?? {}) });

/** Affinity per member, summed over every choice made (first choice per spot counts). */
/** Affinity summed over recorded choices; with `year`, only choices made in that story year. */
export function affinity(p: Progress = getProgress(), year?: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, c] of Object.entries(st(p).choices)) {
    if (year && !key.startsWith(`y${year}-`)) continue;
    for (const [m, n] of Object.entries(c.aff)) out[m] = (out[m] ?? 0) + n;
  }
  return out;
}

export function setStoryPos(ep: string, i: number) {
  update((p) => ({ ...p, story: { ...st(p), pos: { ep, i, u: Date.now() } } }));
}

export function completeEpisode(ep: string) {
  update((p) => {
    const s = st(p);
    return { ...p, story: { ...s, done: { ...s.done, [ep]: s.done[ep] ?? Date.now() }, pos: null } };
  });
}

/** Keep the first answer per choice spot so replays don't farm affinity. */
export function recordChoice(key: string, o: number, aff: Record<string, number>) {
  update((p) => {
    const s = st(p);
    if (s.choices[key]) return p;
    return { ...p, story: { ...s, choices: { ...s.choices, [key]: { o, aff, u: Date.now() } } } };
  });
}

export function toggleSavedLine(line: Omit<SavedLine, 'at'>) {
  update((p) => {
    const s = st(p);
    const has = s.saved.some((x) => x.id === line.id);
    return { ...p, story: { ...s, saved: has ? s.saved.filter((x) => x.id !== line.id) : [{ ...line, at: Date.now() }, ...s.saved] } };
  });
}

export function setPlayer(name: string, gender: 'm' | 'f' | 'n') {
  update((p) => ({ ...p, story: { ...st(p), me: { name: name.trim(), gender, u: Date.now() } } }));
}

export function mergeStory(a?: StoryProgress, b?: StoryProgress): StoryProgress {
  const x = { ...EMPTY_STORY, ...(a ?? {}) };
  const y = { ...EMPTY_STORY, ...(b ?? {}) };
  const done = { ...y.done, ...x.done };
  for (const [k, t] of Object.entries(y.done)) done[k] = Math.min(t, x.done[k] ?? t);
  const choices = { ...x.choices };
  for (const [k, c] of Object.entries(y.choices)) if (!choices[k] || c.u < choices[k].u) choices[k] = c;
  const seen = new Set<string>();
  const saved = [...x.saved, ...y.saved].filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true))).sort((m, n) => n.at - m.at);
  const pos = (y.pos?.u ?? 0) > (x.pos?.u ?? 0) ? y.pos : x.pos;
  const me = y.me.u > x.me.u ? y.me : x.me;
  return { done, pos, choices, saved, me };
}

/** Next episode to play: the resume point, else the first one not finished. */
export function nextEpisode(list: EpisodeMeta[], p: Progress = getProgress()): EpisodeMeta | undefined {
  const s = st(p);
  if (s.pos) {
    const at = list.find((e) => e.id === s.pos!.ep);
    if (at) return at;
  }
  return list.find((e) => !s.done[e.id]);
}

/** Episodes unlock in order: an episode is open once the one before it is finished. */
export function isUnlocked(list: EpisodeMeta[], id: string, p: Progress = getProgress()): boolean {
  const i = list.findIndex((e) => e.id === id);
  return i <= 0 || !!st(p).done[list[i - 1].id] || !!st(p).done[id];
}

/** The player's school year in the story: the latest year with a finished episode, +1 once its last episode (no. 36) is done. */
export function storyYear(p: Progress = getProgress()): number {
  let year = 1;
  for (const id of Object.keys(st(p).done)) {
    const m = /^y(\d)-(\d+)$/.exec(id);
    if (!m) continue;
    const y = Number(m[1]) + (Number(m[2]) >= 36 ? 1 : 0);
    if (y > year) year = y;
  }
  return Math.min(year, 3);
}

export const MONTH_KO = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
