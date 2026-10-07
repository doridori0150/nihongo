// JText: 漢字{かんじ} gives furigana for the kanji run before the braces, | marks chunk boundaries.
// Kept in sync with scripts/jtext.mjs (the content validator).

export interface Token {
  t: string;
  r?: string;
}
export type Chunk = Token[];

const KANJI = /[㐀-䶿一-鿿豈-﫿々〆]/;
const cache = new Map<string, Chunk[]>();

export function parseChunks(src: string): Chunk[] {
  const hit = cache.get(src);
  if (hit) return hit;
  const chunks: Chunk[] = [[]];
  let pendingKanji = '';
  const push = (tok: Token) => {
    const cur = chunks[chunks.length - 1];
    const last = cur[cur.length - 1];
    if (tok.r === undefined && last && last.r === undefined) last.t += tok.t;
    else cur.push(tok);
  };
  const flush = () => {
    if (pendingKanji) push({ t: pendingKanji });
    pendingKanji = '';
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      const end = src.indexOf('}', i);
      if (end < 0) break;
      const r = src.slice(i + 1, end);
      if (pendingKanji) chunks[chunks.length - 1].push({ t: pendingKanji, r });
      pendingKanji = '';
      i = end;
    } else if (KANJI.test(ch)) {
      pendingKanji += ch;
    } else {
      flush();
      if (ch === '|') chunks.push([]);
      else push({ t: ch });
    }
  }
  flush();
  cache.set(src, chunks);
  return chunks;
}

export function tokens(src: string): Token[] {
  return parseChunks(src).flat();
}

/** Text without furigana or chunk marks. */
export function plain(src: string): string {
  return tokens(src)
    .map((t) => t.t)
    .join('');
}

/** Kana-only rendering, used for text-to-speech so readings are always correct. */
export function kana(src: string): string {
  return tokens(src)
    .map((t) => t.r ?? t.t)
    .join('');
}

/** Each chunk as its own JText string (for building tiles). */
export function chunkSources(src: string): string[] {
  return parseChunks(src).map((c) => c.map((t) => (t.r ? `${t.t}{${t.r}}` : t.t)).join(''));
}

/**
 * Split tokens so that the plain-text range [start, end) is isolated.
 * Tokens with furigana that straddle the boundary lose their furigana on the split parts.
 */
export function splitAtRange(src: string, start: number, end: number): { before: Token[]; inside: Token[]; after: Token[] } {
  const before: Token[] = [];
  const inside: Token[] = [];
  const after: Token[] = [];
  let pos = 0;
  for (const tok of tokens(src)) {
    const a = pos;
    const b = pos + tok.t.length;
    pos = b;
    if (b <= start) before.push(tok);
    else if (a >= end) after.push(tok);
    else if (a >= start && b <= end) inside.push(tok);
    else {
      const s = Math.max(start, a) - a;
      const e = Math.min(end, b) - a;
      if (s > 0) before.push({ t: tok.t.slice(0, s) });
      inside.push({ t: tok.t.slice(s, e) });
      if (e < tok.t.length) after.push({ t: tok.t.slice(e) });
    }
  }
  return { before, inside, after };
}
