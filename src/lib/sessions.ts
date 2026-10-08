import type { LessonResult } from '../components/Lesson';
import { type Content, type Grammar, type Item, type Phrase, type Word } from './content';
import { pickNew } from './daily';
import { today } from './date';
import { type Exercise, buildGrammarLesson, buildPhraseLesson, buildReview, buildWordLesson, shuffle } from './quiz';
import { addAccuracy, addXp, dueItems, getProgress, markDone, rateCards, recordLearned, recordReviewed, STAGE_GRADUATED, type TaskKey } from './store';

export interface Session {
  title: string;
  exercises: Exercise[];
  onFinish: (r: LessonResult) => number;
}

export const REVIEW_BATCH = 20;

function xpFor(r: LessonResult) {
  addAccuracy(r.correct, r.wrong);
  return r.correct + 5;
}

function resolve<T extends Item>(c: Content, ids: string[]): T[] {
  return ids.map((id) => c.byId.get(id)).filter(Boolean) as T[];
}

function learnSession(title: string, task: TaskKey | null, exercises: Exercise[]): Session {
  return {
    title,
    exercises,
    onFinish: (r) => {
      // mark the task first so today's plan isn't re-picked once the items count as seen
      if (task) markDone(task);
      recordLearned(r.items);
      const xp = xpFor(r);
      addXp(xp);
      return xp;
    },
  };
}

export function wordsSession(c: Content): Session | null {
  const plan = getProgress().days[today()];
  const words = resolve<Word>(c, plan?.words ?? []);
  return words.length ? learnSession('오늘의 단어', 'words', buildWordLesson(words, c)) : null;
}

export function grammarSession(c: Content): Session | null {
  const plan = getProgress().days[today()];
  const gs = resolve<Grammar>(c, plan?.grammar ?? []);
  return gs.length ? learnSession('오늘의 문법', 'grammar', buildGrammarLesson(gs, c)) : null;
}

export function phrasesSession(c: Content): Session | null {
  const plan = getProgress().days[today()];
  const ps = resolve<Phrase>(c, plan?.phrases ?? []);
  return ps.length ? learnSession('오늘의 문장', 'phrases', buildPhraseLesson(ps, c)) : null;
}

/** Extra new words beyond today's plan. */
export function extraWordsSession(c: Content, count = 5): Session | null {
  const p = getProgress();
  const plan = p.days[today()];
  const exclude = new Set([...Object.keys(p.items), ...(plan?.words ?? [])]);
  const words = resolve<Word>(c, pickNew(c.words, count, exclude));
  return words.length ? learnSession('추가 단어', null, buildWordLesson(words, c)) : null;
}

/** Spaced-repetition review of due items (at most one batch). */
export function reviewSession(c: Content): Session | null {
  const items = resolve<Item>(c, dueItems(getProgress())).slice(0, REVIEW_BATCH);
  if (!items.length) return null;
  return {
    title: '복습',
    exercises: buildReview(items, c),
    onFinish: (r) => {
      recordReviewed(r.items);
      if (dueItems(getProgress()).length === 0) markDone('review');
      const xp = xpFor(r);
      addXp(xp);
      return xp;
    },
  };
}

/** Practice previously missed items without touching their review schedule. */
export function practiceSession(c: Content, count = 15): Session | null {
  const p = getProgress();
  const ids = Object.entries(p.items)
    .filter(([, r]) => r.wrong > 0 && r.stage < STAGE_GRADUATED)
    .map(([id]) => id);
  const items = resolve<Item>(c, shuffle(ids).slice(0, count));
  if (!items.length) return null;
  return {
    title: '오답 연습',
    exercises: buildReview(items, c),
    onFinish: (r) => {
      const xp = Math.ceil(xpFor(r) / 2);
      addXp(xp);
      return xp;
    },
  };
}

/** Re-practice today's items after the lesson is done, without touching review schedules. */
export function todayPracticeSession(c: Content, kind: 'words' | 'grammar' | 'phrases'): Session | null {
  const plan = getProgress().days[today()];
  const items = resolve<Item>(c, plan?.[kind] ?? []);
  if (!items.length) return null;
  const exercises = kind === 'words' ? [...buildReview(items, c), ...buildReview(items, c)] : buildReview(items, c);
  return {
    title: '다시 연습',
    exercises: shuffle(exercises),
    onFinish: (r) => {
      const xp = Math.ceil(xpFor(r) / 2);
      addXp(xp);
      return xp;
    },
  };
}

/** Quiz over flashcard-deck items; results move the cards along their own schedule. */
export function deckQuizSession(c: Content, ids: string[]): Session | null {
  const items = resolve<Item>(c, shuffle(ids).slice(0, 20));
  if (!items.length) return null;
  return {
    title: '암기 카드 퀴즈',
    exercises: buildReview(items, c),
    onFinish: (r) => {
      rateCards(r.items.map((x) => ({ id: x.id, rating: x.correct ? 'good' : 'again' })));
      const xp = xpFor(r);
      addXp(xp);
      return xp;
    },
  };
}
