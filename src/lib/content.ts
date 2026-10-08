import { plain } from './jtext';

export type Src = 'drama' | 'anime' | 'manga' | 'novel' | 'daily' | 'travel';
export type Level = 'N3' | 'N2' | 'N1';
export type Medium = 'anime' | 'manga' | 'game' | 'drama' | 'film' | 'novel';

export interface Example {
  jp: string;
  ko: string;
  src: Src;
  scene: string;
}

export interface Cloze {
  ex: number;
  target: string;
  distractors: string[];
}

export interface Word {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  pos: string;
  level: Level;
  theme: string;
  note: string;
  examples: Example[];
  cloze: Cloze;
  course?: 'otaku';
}

export interface Grammar {
  id: string;
  pattern: string;
  meaning: string;
  level: Level;
  theme: string;
  formation: string;
  explanation: string;
  examples: Example[];
  cloze: Cloze[];
}

export interface Phrase {
  id: string;
  jp: string;
  ko: string;
  expression: string;
  note: string;
  level: Level;
  src: Src;
  scene: string;
  theme: string;
  cloze: Omit<Cloze, 'ex'>;
}

export interface Quote {
  id: string;
  line: string;
  ko: string;
  medium: Medium;
  work: string;
  work_ko: string;
  speaker: string;
  speaker_ko: string;
  level: Level;
  point: string;
  note: string;
  examples: Example[];
  yt: string;
  ref: string;
}

/** A key expression saved from the story. */
export interface Expr {
  id: string;
  jp: string;
  ko: string;
  note: string;
  ep: string;
}

export interface Art {
  bg: string[];
  sprites: string[];
  key: string[];
}

export interface Situation {
  id: string;
  scene: string;
  partner: string;
  line: string;
  line_ko: string;
  task: string;
  sample: string;
  theme: string;
}

export interface Opinion {
  id: string;
  question: string;
  question_ko: string;
  hint: string;
  sample: string;
  theme: string;
}

export interface Roleplay {
  id: string;
  title: string;
  setting_ko: string;
  character: string;
  goal_ko: string;
  opening: string;
  opening_ko: string;
  theme: string;
}

export interface Content {
  words: Word[];
  grammar: Grammar[];
  phrases: Phrase[];
  situations: Situation[];
  opinions: Opinion[];
  roleplays: Roleplay[];
  quotes: Quote[];
  exprs: Expr[];
  characters: string[];
  art: Art;
  byId: Map<string, Item>;
}

export type Item = Word | Grammar | Phrase | Quote | Expr;
export type ItemKind = 'w' | 'g' | 'p' | 'q' | 'x';

export const kindOf = (id: string): ItemKind => id[0] as ItemKind;
export const isWord = (it: Item): it is Word => it.id.startsWith('w:');
export const isGrammar = (it: Item): it is Grammar => it.id.startsWith('g:');
export const isPhrase = (it: Item): it is Phrase => it.id.startsWith('p:');
export const isQuote = (it: Item): it is Quote => it.id.startsWith('q:');
export const isExpr = (it: Item): it is Expr => it.id.startsWith('x:');

export const MEDIUM_GROUP = {
  anime: { label: '애니·만화', icon: '🎌', media: ['anime', 'manga', 'game'] as Medium[] },
  screen: { label: '드라마·영화', icon: '🎬', media: ['drama', 'film'] as Medium[] },
  novel: { label: '소설·문학', icon: '📚', media: ['novel'] as Medium[] },
};
export type MediumGroup = keyof typeof MEDIUM_GROUP;
export const groupOf = (m: Medium): MediumGroup => (m === 'drama' || m === 'film' ? 'screen' : m === 'novel' ? 'novel' : 'anime');
export const MEDIUM_LABEL: Record<Medium, string> = {
  anime: '애니', manga: '만화', game: '게임', drama: '드라마', film: '영화', novel: '소설',
};

export const SRC_LABEL: Record<Src, string> = {
  drama: '📺 드라마풍',
  anime: '🎬 애니풍',
  manga: '📖 만화풍',
  novel: '📚 소설풍',
  daily: '💬 일상',
  travel: '✈️ 여행',
};

let loading: Promise<Content> | null = null;

export function loadContent(): Promise<Content> {
  if (loading) return loading;
  const base = import.meta.env.BASE_URL;
  const get = <T,>(name: string) =>
    fetch(`${base}data/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`${name}.json 로드 실패 (${r.status})`);
      return r.json() as Promise<T>;
    });
  loading = Promise.all([
    get<Word[]>('vocab'),
    get<Grammar[]>('grammar'),
    get<Phrase[]>('phrases'),
    get<{ situations: Situation[]; opinions: Opinion[]; roleplays: Roleplay[] }>('qa'),
    get<Quote[]>('quotes').catch(() => [] as Quote[]),
    get<string[]>('characters').catch(() => [] as string[]),
    get<Expr[]>('expressions').catch(() => [] as Expr[]),
    get<Art>('art').catch(() => ({ bg: [], sprites: [], key: [] }) as Art),
  ]).then(([words, grammar, phrases, qa, quotes, characters, exprs, art]) => {
    const byId = new Map<string, Item>();
    for (const it of [...words, ...grammar, ...phrases, ...quotes, ...exprs]) byId.set(it.id, it);
    return { words, grammar, phrases, ...qa, quotes, exprs, characters, art, byId };
  });
  loading.catch(() => (loading = null));
  return loading;
}

/** Display label of an item (the headword). */
export function itemTitle(it: Item): string {
  if (isWord(it)) return it.word;
  if (isGrammar(it)) return it.pattern;
  if (isQuote(it)) return plain(it.line);
  if (isExpr(it)) return plain(it.jp);
  return it.expression;
}

export function itemMeaning(it: Item): string {
  if (isPhrase(it) || isQuote(it) || isExpr(it)) return it.ko;
  return it.meaning;
}
