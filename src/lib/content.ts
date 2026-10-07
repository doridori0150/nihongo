export type Src = 'drama' | 'anime' | 'manga' | 'novel' | 'daily' | 'travel';
export type Level = 'N2' | 'N1';

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
  byId: Map<string, Word | Grammar | Phrase>;
}

export type Item = Word | Grammar | Phrase;
export type ItemKind = 'w' | 'g' | 'p';

export const kindOf = (id: string): ItemKind => id[0] as ItemKind;
export const isWord = (it: Item): it is Word => it.id.startsWith('w:');
export const isGrammar = (it: Item): it is Grammar => it.id.startsWith('g:');
export const isPhrase = (it: Item): it is Phrase => it.id.startsWith('p:');

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
  ]).then(([words, grammar, phrases, qa]) => {
    const byId = new Map<string, Item>();
    for (const it of [...words, ...grammar, ...phrases]) byId.set(it.id, it);
    return { words, grammar, phrases, ...qa, byId };
  });
  loading.catch(() => (loading = null));
  return loading;
}

/** Display label of an item (the headword). */
export function itemTitle(it: Item): string {
  if (isWord(it)) return it.word;
  if (isGrammar(it)) return it.pattern;
  return it.expression;
}

export function itemMeaning(it: Item): string {
  if (isPhrase(it)) return it.ko;
  return it.meaning;
}
