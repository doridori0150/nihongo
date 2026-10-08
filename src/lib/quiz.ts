import { type Content, type Example, type Expr, type Grammar, type Item, type Phrase, type Quote, type Word, isExpr, isGrammar, isPhrase, isQuote, isWord } from './content';
import { chunkSources, plain } from './jtext';

export interface Prompt {
  /** headword shown big, optionally with its reading as furigana */
  word?: string;
  reading?: string;
  /** JText sentence */
  jp?: string;
  /** Korean text */
  ko?: string;
  /** plain Japanese text without furigana (grammar patterns) */
  text?: string;
  /** what to read aloud (kana) */
  speak?: string;
}

export interface Option {
  text: string;
  jp: boolean;
}

export type Exercise =
  | { kind: 'intro'; item: Item }
  | { kind: 'choice'; itemId: string; title: string; prompt: Prompt; options: Option[]; answer: number }
  | {
      kind: 'cloze';
      itemId: string;
      title: string;
      jp: string;
      target: string;
      ko: string;
      options: string[];
      answer: number;
    }
  | { kind: 'assemble'; itemId: string; title: string; jp: string; ko: string; tiles: string[]; answer: string };

export type Graded = Exclude<Exercise, { kind: 'intro' }>;

// ───────── helpers ─────────

export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sample = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

function withAnswer(correct: string, wrong: string[], jp: boolean): { options: Option[]; answer: number } {
  const opts = shuffle([correct, ...wrong.slice(0, 3)]);
  return { options: opts.map((text) => ({ text, jp })), answer: opts.indexOf(correct) };
}

/** Pick n distinct values from candidates, preferring `preferred`, excluding `avoid`. */
function distinct(preferred: string[], fallback: string[], n: number, avoid: string[]): string[] {
  const out: string[] = [];
  const bad = new Set(avoid);
  for (const v of [...shuffle(preferred), ...shuffle(fallback)]) {
    if (out.length >= n) break;
    if (!v || bad.has(v) || out.includes(v)) continue;
    out.push(v);
  }
  return out;
}

const hasKanji = (s: string) => /[一-鿿々]/.test(s);

const DAKUTEN: Record<string, string> = {};
'かがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとど'.match(/../g)!.forEach((p) => {
  DAKUTEN[p[0]] = p[1];
  DAKUTEN[p[1]] = p[0];
});
'はばぱひびぴふぶぷへべぺほぼぽ'.match(/.../g)!.forEach((t) => {
  DAKUTEN[t[0]] = t[1];
  DAKUTEN[t[1]] = t[2];
  DAKUTEN[t[2]] = t[0];
});

/** Plausible misreadings: long/short vowels, small っ, voicing. */
export function readingFakes(r: string): string[] {
  const out = new Set<string>();
  const at = (i: number, del: number, ins: string) => out.add(r.slice(0, i) + ins + r.slice(i + del));
  for (let i = 0; i < r.length; i++) {
    const ch = r[i];
    const next = r[i + 1];
    if (DAKUTEN[ch]) at(i, 1, DAKUTEN[ch]);
    if (ch === 'っ') at(i, 1, '');
    if ((ch === 'う' || ch === 'い') && i > 0 && 'ょゅこそとのほもよろごぞどぼぽおうくすつぬふむゆるぐずづぶぷけせてねへめれげぜでべぺえ'.includes(r[i - 1]))
      at(i, 1, '');
    if ((ch === 'ょ' || ch === 'ゅ') && next !== 'う') at(i + 1, 0, 'う');
    if ('くきちつ'.includes(ch) && next && 'かきくけこさしすせそたちつてとぱぴぷぺぽ'.includes(next)) at(i, 1, 'っ');
  }
  out.delete(r);
  return [...out].filter((s) => s.length > 0);
}

// ───────── word exercises ─────────

function samePos(w: Word, pool: Word[]) {
  return pool.filter((x) => x.id !== w.id && x.pos === w.pos);
}

function wordMeaning(w: Word, pool: Word[]): Graded {
  const wrong = distinct(
    samePos(w, pool).map((x) => x.meaning),
    pool.map((x) => x.meaning),
    3,
    [w.meaning],
  );
  return {
    kind: 'choice',
    itemId: w.id,
    title: '이 단어의 뜻은?',
    prompt: { word: w.word, reading: w.reading, speak: w.reading },
    ...withAnswer(w.meaning, wrong, false),
  };
}

function wordReverse(w: Word, pool: Word[]): Graded {
  const wrong = distinct(
    samePos(w, pool).map((x) => x.word),
    pool.map((x) => x.word),
    3,
    [w.word],
  );
  return {
    kind: 'choice',
    itemId: w.id,
    title: '일본어로 하면?',
    prompt: { ko: w.meaning },
    ...withAnswer(w.word, wrong, true),
  };
}

function wordReading(w: Word, pool: Word[]): Graded {
  const fakes = readingFakes(w.reading);
  const similar = pool.filter((x) => x.id !== w.id && Math.abs(x.reading.length - w.reading.length) <= 1).map((x) => x.reading);
  const wrong = distinct(fakes, similar, 3, [w.reading]);
  return {
    kind: 'choice',
    itemId: w.id,
    title: '읽는 법은?',
    prompt: { word: w.word },
    ...withAnswer(w.reading, wrong, true),
  };
}

function clozeOf(itemId: string, ex: Example, target: string, distractors: string[], title = '빈칸에 들어갈 말은?'): Graded {
  const opts = shuffle([target, ...distractors]);
  return { kind: 'cloze', itemId, title, jp: ex.jp, target, ko: ex.ko, options: opts, answer: opts.indexOf(target) };
}

function wordCloze(w: Word): Graded {
  const ex = w.examples[w.cloze.ex] ?? w.examples[0];
  return clozeOf(w.id, ex, w.cloze.target, w.cloze.distractors);
}

/** Sentence-building exercise with one or two decoy tiles from other sentences. */
export function assemble(itemId: string, ex: { jp: string; ko: string }, decoySources: string[]): Graded {
  const tiles = chunkSources(ex.jp);
  const real = new Set(tiles.map(plain));
  const decoys: string[] = [];
  for (const src of shuffle(decoySources)) {
    if (decoys.length >= (tiles.length > 5 ? 1 : 2)) break;
    const cand = sample(chunkSources(src));
    const p = plain(cand);
    if (!real.has(p) && !decoys.some((d) => plain(d) === p) && !/^[、。！？!?]+$/.test(p)) decoys.push(cand);
  }
  return {
    kind: 'assemble',
    itemId,
    title: '문장을 완성하세요',
    jp: ex.jp,
    ko: ex.ko,
    tiles: shuffle([...tiles, ...decoys]),
    answer: plain(ex.jp),
  };
}

function allExampleSources(c: Content): string[] {
  return [...c.words.flatMap((w) => w.examples.map((e) => e.jp)), ...c.phrases.map((p) => p.jp)];
}

function wordExercise(w: Word, c: Content, kind: 'meaning' | 'reverse' | 'reading' | 'cloze' | 'assemble'): Graded {
  switch (kind) {
    case 'meaning':
      return wordMeaning(w, c.words);
    case 'reverse':
      return wordReverse(w, c.words);
    case 'reading':
      return hasKanji(w.word) ? wordReading(w, c.words) : wordMeaning(w, c.words);
    case 'cloze':
      return wordCloze(w);
    case 'assemble':
      return assemble(w.id, sample(w.examples), allExampleSources(c));
  }
}

// ───────── grammar / phrase exercises ─────────

function grammarMeaning(g: Grammar, pool: Grammar[]): Graded {
  const wrong = distinct(
    pool.filter((x) => x.id !== g.id && x.theme !== g.theme).map((x) => x.meaning),
    pool.map((x) => x.meaning),
    3,
    [g.meaning],
  );
  return {
    kind: 'choice',
    itemId: g.id,
    title: '이 문법의 의미는?',
    prompt: { text: g.pattern },
    ...withAnswer(g.meaning, wrong, false),
  };
}

function grammarCloze(g: Grammar, i: number): Graded {
  const cz = g.cloze[i % g.cloze.length];
  return clozeOf(g.id, g.examples[cz.ex] ?? g.examples[0], cz.target, cz.distractors, '알맞은 문법을 고르세요');
}

function phraseMeaning(ph: Phrase, pool: Phrase[]): Graded {
  const wrong = distinct(
    pool.filter((x) => x.id !== ph.id && x.theme === ph.theme).map((x) => x.ko),
    pool.map((x) => x.ko),
    3,
    [ph.ko],
  );
  return {
    kind: 'choice',
    itemId: ph.id,
    title: '이 문장의 뜻은?',
    prompt: { jp: ph.jp },
    ...withAnswer(ph.ko, wrong, false),
  };
}

function phraseCloze(ph: Phrase): Graded {
  return clozeOf(ph.id, { jp: ph.jp, ko: ph.ko, src: ph.src, scene: ph.scene }, ph.cloze.target, ph.cloze.distractors);
}

function quoteMeaning(q: Quote, pool: Quote[]): Graded {
  const wrong = distinct(
    pool.filter((x) => x.id !== q.id && x.medium === q.medium).map((x) => x.ko),
    pool.map((x) => x.ko),
    3,
    [q.ko],
  );
  return { kind: 'choice', itemId: q.id, title: '이 명대사의 뜻은?', prompt: { jp: q.line }, ...withAnswer(q.ko, wrong, false) };
}

function exprMeaning(x: Expr, pool: Expr[]): Graded {
  const wrong = distinct(
    pool.filter((y) => y.id !== x.id && y.ep === x.ep).map((y) => y.ko),
    pool.map((y) => y.ko),
    3,
    [x.ko],
  );
  return { kind: 'choice', itemId: x.id, title: '이 표현의 뜻은?', prompt: { jp: x.jp }, ...withAnswer(x.ko, wrong, false) };
}

// ───────── sessions ─────────

/** New-word lesson: introduce 3–4 words, drill them, repeat; finish with sentence building. */
export function buildWordLesson(words: Word[], c: Content): Exercise[] {
  const out: Exercise[] = [];
  const groups: Word[][] = [];
  for (let i = 0; i < words.length; i += 4) groups.push(words.slice(i, i + 4));
  // avoid a lonely last group of 1
  if (groups.length > 1 && groups[groups.length - 1].length === 1) groups[groups.length - 2].push(groups.pop()![0]);
  for (const g of groups) {
    for (const w of g) out.push({ kind: 'intro', item: w });
    const drills: Graded[] = [];
    for (const w of g) {
      drills.push(wordExercise(w, c, sample(['meaning', 'reverse'] as const)));
      drills.push(wordExercise(w, c, hasKanji(w.word) ? sample(['reading', 'cloze'] as const) : 'cloze'));
    }
    out.push(...shuffle(drills));
  }
  for (const w of shuffle(words).slice(0, Math.min(3, words.length))) out.push(wordExercise(w, c, 'assemble'));
  return out;
}

export function buildGrammarLesson(gs: Grammar[], c: Content): Exercise[] {
  const out: Exercise[] = [];
  for (const g of gs) {
    out.push({ kind: 'intro', item: g });
    out.push(grammarMeaning(g, c.grammar));
    out.push(grammarCloze(g, 0));
    out.push(assemble(g.id, g.examples[g.examples.length - 1], allExampleSources(c)));
    out.push(grammarCloze(g, 1));
  }
  return out;
}

export function buildPhraseLesson(ps: Phrase[], c: Content): Exercise[] {
  const out: Exercise[] = [];
  for (const ph of ps) {
    out.push({ kind: 'intro', item: ph });
    out.push(assemble(ph.id, ph, allExampleSources(c)));
  }
  for (const ph of shuffle(ps)) out.push(sample([phraseCloze(ph), phraseMeaning(ph, c.phrases)]));
  return out;
}

/** One exercise per item, type chosen at random for variety. */
export function reviewExercise(it: Item, c: Content): Graded {
  if (isWord(it)) {
    const kinds = ['meaning', 'reverse', 'cloze', 'assemble'] as const;
    return wordExercise(it, c, hasKanji(it.word) ? sample([...kinds, 'reading']) : sample(kinds));
  }
  if (isGrammar(it)) {
    return sample([
      () => grammarCloze(it, Math.floor(Math.random() * it.cloze.length)),
      () => grammarMeaning(it, c.grammar),
      () => assemble(it.id, sample(it.examples), allExampleSources(c)),
    ])();
  }
  if (isPhrase(it)) {
    return sample([() => phraseCloze(it), () => phraseMeaning(it, c.phrases), () => assemble(it.id, it, allExampleSources(c))])();
  }
  if (isExpr(it)) return exprMeaning(it, c.exprs);
  if (isQuote(it)) {
    const asLine = { jp: it.line, ko: it.ko };
    return sample([
      () => quoteMeaning(it, c.quotes),
      () => (it.line.includes('|') ? assemble(it.id, asLine, allExampleSources(c)) : quoteMeaning(it, c.quotes)),
      () => assemble(it.id, sample(it.examples), allExampleSources(c)),
    ])();
  }
  throw new Error('unknown item');
}

export function buildReview(items: Item[], c: Content): Exercise[] {
  return shuffle(items).map((it) => reviewExercise(it, c));
}

/** Correct answer as display text, for the feedback sheet. */
export function answerText(ex: Graded): string {
  if (ex.kind === 'assemble') return ex.answer;
  if (ex.kind === 'cloze') return ex.options[ex.answer];
  return ex.options[ex.answer].text;
}
