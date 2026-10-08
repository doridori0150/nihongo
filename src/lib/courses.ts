import type { Content, Item, Level } from './content';
import type { MemberId } from './cast';

export interface Course {
  id: string;
  title: string;
  sub: string;
  host: MemberId;
  color: string;
  items(c: Content): Item[];
  /** chapter heading an item belongs to */
  chapter(it: Item): string;
}

const byTheme = (it: Item) => ('theme' in it ? it.theme : '기타');
const levelWords = (level: Level) => (c: Content) => c.words.filter((w) => w.level === level && !w.course);
const levelGrammar = (level: Level) => (c: Content) => c.grammar.filter((g) => g.level === level);

export const COURSES: Course[] = [
  { id: 'n3-words', title: 'N3 단어', sub: '일상·학교·취미 기초 어휘', host: 'hiyori', color: 'var(--ok)', items: levelWords('N3'), chapter: byTheme },
  { id: 'n3-grammar', title: 'N3 문법', sub: '회화에 바로 쓰는 기본 문형', host: 'minato', color: 'var(--ok)', items: levelGrammar('N3'), chapter: byTheme },
  { id: 'n2-words', title: 'N2 단어', sub: '드라마·뉴스가 들리기 시작하는 어휘', host: 'hiyori', color: 'var(--primary)', items: levelWords('N2'), chapter: byTheme },
  { id: 'n2-grammar', title: 'N2 문법', sub: '뉘앙스까지 잡는 중급 문형', host: 'minato', color: 'var(--primary)', items: levelGrammar('N2'), chapter: byTheme },
  {
    id: 'otaku',
    title: '오타쿠 용어',
    sub: '推し·沼·ガチャ… 덕질 필수 어휘',
    host: 'shizuku',
    color: 'var(--violet)',
    items: (c) => c.words.filter((w) => w.course === 'otaku'),
    chapter: byTheme,
  },
];

export const EXTRA_COURSES: Course[] = [
  { id: 'n1-words', title: 'N1 단어', sub: '상급 어휘', host: 'saeko', color: 'var(--violet)', items: levelWords('N1'), chapter: byTheme },
  { id: 'n1-grammar', title: 'N1 문법', sub: '문어체까지', host: 'saeko', color: 'var(--violet)', items: levelGrammar('N1'), chapter: byTheme },
  { id: 'phrases', title: '회화 표현', sub: '일상·여행·드라마 표현', host: 'ritsu', color: 'var(--accent)', items: (c) => c.phrases, chapter: byTheme },
];

export const findCourse = (id: string) => [...COURSES, ...EXTRA_COURSES].find((c) => c.id === id);

/** Items grouped into chapters, chapters in first-seen order. */
export function chapters(course: Course, c: Content): { title: string; items: Item[] }[] {
  const map = new Map<string, Item[]>();
  for (const it of course.items(c)) {
    const key = course.chapter(it);
    map.set(key, [...(map.get(key) ?? []), it]);
  }
  return [...map.entries()].map(([title, items]) => ({ title, items }));
}
