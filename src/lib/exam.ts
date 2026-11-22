// JLPT-style daily exam built from the question bank (words and grammar with their cloze data).
import { type Content, type Grammar, type Word } from './content';
import { hash } from './daily';
import { chunkSources, plain } from './jtext';
import { readingFakes } from './quiz';
import type { ExamLevel } from './store';

export type QType = 'kanji' | 'context' | 'grammar' | 'order';

export const SECTIONS: Record<QType, { no: number; jp: string; ko: string }> = {
  kanji: { no: 1, jp: '＿＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。', ko: '밑줄 친 말의 읽는 법' },
  context: { no: 2, jp: '（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。', ko: '빈칸에 들어갈 어휘' },
  grammar: { no: 3, jp: '次の文の（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。', ko: '빈칸에 들어갈 문법' },
  order: { no: 4, jp: '次の文の ★ に入る最もよいものを、1・2・3・4から一つ選びなさい。', ko: '★에 들어갈 말 (문장 만들기)' },
};

export interface ExamQ {
  type: QType;
  itemId: string;
  /** sentence parts around the marked spot (plain text, no furigana — like the real test) */
  before: string;
  /** underlined text (kanji), or slots for the order question; empty for a blank */
  mark: string;
  after: string;
  /** order question: number of blanks and which one is ★ (0-based) */
  slots?: { count: number; star: number };
  options: string[];
  answer: number;
  explain: {
    head: string;
    lines: string[];
    sentence: string;
    sentenceKo: string;
  };
}

/** How many questions of each type a daily exam has. */
const MIX: [QType, number][] = [
  ['kanji', 2],
  ['context', 3],
  ['grammar', 3],
  ['order', 2],
];
export const EXAM_SIZE = MIX.reduce((n, [, c]) => n + c, 0);
export const PASS_PCT = 60;

/** Deterministic RNG so a day's exam (and its option order) is the same on every device. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function withOptions(correct: string, wrong: string[], rand: () => number) {
  const options = shuffled([correct, ...wrong.slice(0, 3)], rand);
  return { options, answer: options.indexOf(correct) };
}

const hasKanji = (s: string) => /[一-鿿々]/.test(s);
const PUNCT = /^[、。！？!?…「」『』]+$/;

function wordExplain(w: Word, exIdx: number) {
  const ex = w.examples[exIdx] ?? w.examples[0];
  return {
    head: w.reading !== w.word ? `${w.word}（${w.reading}）= ${w.meaning}` : `${w.word} = ${w.meaning}`,
    lines: [w.pos && `품사: ${w.pos}`, w.note].filter(Boolean) as string[],
    sentence: plain(ex.jp),
    sentenceKo: ex.ko,
  };
}

function grammarExplain(g: Grammar, exIdx: number) {
  const ex = g.examples[exIdx] ?? g.examples[0];
  return {
    head: `${g.pattern} = ${g.meaning}`,
    lines: [`접속: ${g.formation}`, g.explanation],
    sentence: plain(ex.jp),
    sentenceKo: ex.ko,
  };
}

// ───────── question makers (return null when the item doesn't fit the type) ─────────

function kanjiQ(w: Word, pool: Word[], rand: () => number): ExamQ | null {
  // idioms like 息を呑む read as a phrase, not a JLPT kanji-reading item
  if (/[をがにで]/.test(w.word)) return null;
  if (!hasKanji(w.word) || w.reading === w.word) return null;
  const exIdx = w.examples.findIndex((e) => plain(e.jp).includes(w.word));
  if (exIdx < 0) return null;
  const s = plain(w.examples[exIdx].jp);
  const at = s.indexOf(w.word);
  // JLPT-style misreadings only (voicing, long/short vowels, small っ), never another word's reading;
  // a fake must not be a real reading of the same written word, nor just drop the last kana
  const real = new Set(pool.filter((x) => x.word === w.word).map((x) => x.reading));
  const ok = (f: string) => !real.has(f) && f.length >= w.reading.length - 1 && !(f.length < w.reading.length && w.reading.startsWith(f));
  const first = readingFakes(w.reading).filter(ok);
  const second = first.flatMap(readingFakes).filter((f) => f !== w.reading && ok(f));
  const wrong: string[] = [];
  for (const f of [...shuffled(first, rand), ...shuffled(second, rand)]) {
    if (wrong.length >= 3) break;
    if (!wrong.includes(f)) wrong.push(f);
  }
  if (wrong.length < 3) return null;
  return {
    type: 'kanji',
    itemId: w.id,
    before: s.slice(0, at),
    mark: w.word,
    after: s.slice(at + w.word.length),
    ...withOptions(w.reading, wrong, rand),
    explain: wordExplain(w, exIdx),
  };
}

function blankQ(type: 'context' | 'grammar', itemId: string, jp: string, target: string, distractors: string[], rand: () => number) {
  const s = plain(jp);
  const at = s.indexOf(target);
  if (at < 0 || distractors.length < 3) return null;
  return { type, itemId, before: s.slice(0, at), mark: '', after: s.slice(at + target.length), ...withOptions(target, distractors, rand) };
}

function contextQ(w: Word, rand: () => number): ExamQ | null {
  const ex = w.examples[w.cloze.ex] ?? w.examples[0];
  const q = blankQ('context', w.id, ex.jp, w.cloze.target, w.cloze.distractors, rand);
  return q && { ...q, explain: wordExplain(w, w.cloze.ex) };
}

function grammarQ(g: Grammar, rand: () => number): ExamQ | null {
  const cz = g.cloze[Math.floor(rand() * g.cloze.length)];
  if (!cz) return null;
  const q = blankQ('grammar', g.id, (g.examples[cz.ex] ?? g.examples[0]).jp, cz.target, cz.distractors, rand);
  return q && { ...q, explain: grammarExplain(g, cz.ex) };
}

/** 文の組み立て: four consecutive chunks become blanks; the third one is ★. */
function orderQ(g: Grammar, rand: () => number): ExamQ | null {
  for (const exIdx of shuffled(g.examples.map((_, i) => i), rand)) {
    const ex = g.examples[exIdx];
    const chunks = chunkSources(ex.jp).map(plain);
    // keep the closing punctuation outside the blanks
    const last = chunks[chunks.length - 1];
    const tail = last.match(/[、。！？!?…」』]+$/)?.[0] ?? '';
    if (tail) chunks[chunks.length - 1] = last.slice(0, -tail.length);
    const parts = chunks.filter((c) => c && !PUNCT.test(c));
    // one sentence only: no full stop or exclamation inside the sentence
    if (parts.slice(0, -1).some((c) => /[。！？!?]/.test(c)) || /[。！？!?]/.test(parts[parts.length - 1] ?? '')) continue;
    if (parts.length < 4 || parts.length !== chunks.length || new Set(parts).size !== parts.length) continue;
    const start = parts.length === 4 ? 0 : Math.floor(rand() * (parts.length - 3));
    const blanks = parts.slice(start, start + 4);
    const star = 2;
    return {
      type: 'order',
      itemId: g.id,
      before: parts.slice(0, start).join(''),
      mark: '',
      after: parts.slice(start + 4).join('') + tail,
      slots: { count: 4, star },
      ...withOptions(blanks[star], blanks.filter((_, i) => i !== star), rand),
      explain: {
        ...grammarExplain(g, exIdx),
        lines: [`올바른 순서: ${blanks.join(' / ')}`, `접속: ${g.formation}`, g.explanation],
      },
    };
  }
  return null;
}

// ───────── daily exam ─────────

export function buildDailyExam(c: Content, level: ExamLevel, date: string): ExamQ[] {
  const seed = hash(`${date}:${level}`);
  const rand = rng(seed);
  const order = <T extends { id: string }>(xs: T[]) => [...xs].sort((a, b) => hash(a.id, seed) - hash(b.id, seed));
  const words = order(c.words.filter((w) => w.level === level && w.course !== 'otaku'));
  const grammar = order(c.grammar.filter((g) => g.level === level));
  const used = new Set<string>();
  const out: ExamQ[] = [];
  const take = (n: number, pool: { id: string }[], make: (x: never) => ExamQ | null) => {
    let got = 0;
    for (const x of pool) {
      if (got >= n) break;
      if (used.has(x.id)) continue;
      const q = make(x as never);
      if (!q) continue;
      used.add(x.id);
      out.push(q);
      got++;
    }
  };
  for (const [type, n] of MIX) {
    if (type === 'kanji') take(n, words, (w: Word) => kanjiQ(w, c.words, rand));
    else if (type === 'context') take(n, words, (w: Word) => contextQ(w, rand));
    else if (type === 'grammar') take(n, grammar, (g: Grammar) => grammarQ(g, rand));
    else take(n, grammar, (g: Grammar) => orderQ(g, rand) ?? grammarQ(g, rand));
  }
  return out;
}

export function examGrade(pct: number): 'S' | 'A' | 'B' | 'C' {
  return pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= PASS_PCT ? 'B' : 'C';
}

/** The question as one plain line (for the AI explanation prompt). */
export function questionText(q: ExamQ): string {
  if (q.type === 'kanji') return `${q.before}［${q.mark}］${q.after}`;
  if (q.type === 'order') {
    const slots = Array.from({ length: q.slots!.count }, (_, i) => (i === q.slots!.star ? '★' : '＿＿')).join(' ');
    return `${q.before} ${slots} ${q.after}`;
  }
  return `${q.before}（　　）${q.after}`;
}
