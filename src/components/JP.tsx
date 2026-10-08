import { useState, type MouseEvent } from 'react';
import { type Token, parseChunks, kana, splitAtRange, plain } from '../lib/jtext';
import { canSpeak, speak } from '../lib/speech';

function revealOnTap(e: MouseEvent<HTMLElement>) {
  const ruby = (e.target as HTMLElement).closest('ruby');
  ruby?.classList.toggle('reveal');
}

export function Tokens({ toks }: { toks: Token[] }) {
  return (
    <>
      {toks.map((t, i) =>
        t.r ? (
          <ruby key={i}>
            {t.t}
            <rt>{t.r}</rt>
          </ruby>
        ) : (
          <span key={i}>{t.t}</span>
        ),
      )}
    </>
  );
}

/** Render JText with furigana. `highlight` marks a plain-text substring. */
export function JP({ text, highlight, className = '' }: { text: string; highlight?: string; className?: string }) {
  const toks = parseChunks(text).flat();
  if (highlight) {
    const start = plain(text).indexOf(highlight);
    if (start >= 0) {
      const { before, inside, after } = splitAtRange(text, start, start + highlight.length);
      return (
        <span className={`jp ${className}`} onClick={revealOnTap}>
          <Tokens toks={before} />
          <span className="hl">
            <Tokens toks={inside} />
          </span>
          <Tokens toks={after} />
        </span>
      );
    }
  }
  return (
    <span className={`jp ${className}`} onClick={revealOnTap}>
      <Tokens toks={toks} />
    </span>
  );
}

interface Segment {
  toks: Token[];
  term: number | null;
}

/** Split tokens so each plain-text range becomes its own segment (ruby kept on tokens that stay whole). */
function splitByRanges(toks: Token[], ranges: { start: number; end: number; term: number }[]): Segment[] {
  const termAt = (p: number) => ranges.find((r) => p >= r.start && p < r.end)?.term ?? null;
  const out: Segment[] = [];
  let cur: Segment = { toks: [], term: null };
  let pos = 0;
  for (const tok of toks) {
    const len = tok.t.length;
    let a = 0;
    while (a < len) {
      const term = termAt(pos + a);
      let b = a + 1;
      while (b < len && termAt(pos + b) === term) b++;
      const piece = a === 0 && b === len ? tok : { t: tok.t.slice(a, b) };
      if (cur.term !== term) {
        if (cur.toks.length) out.push(cur);
        cur = { toks: [], term };
      }
      cur.toks.push(piece);
      a = b;
    }
    pos += len;
  }
  if (cur.toks.length) out.push(cur);
  return out;
}

/** JText with several study terms highlighted; tapping one calls onTerm with its index. */
export function JPTerms({ text, terms, onTerm, className = '' }: { text: string; terms: string[]; onTerm: (i: number) => void; className?: string }) {
  const toks = parseChunks(text).flat();
  const full = toks.map((t) => t.t).join('');
  const ranges: { start: number; end: number; term: number }[] = [];
  terms.forEach((t, term) => {
    if (!t) return;
    const start = full.indexOf(t);
    if (start < 0 || ranges.some((r) => start < r.end && start + t.length > r.start)) return;
    ranges.push({ start, end: start + t.length, term });
  });
  return (
    <span className={`jp ${className}`}>
      {splitByRanges(toks, ranges).map((seg, i) =>
        seg.term === null ? (
          <Tokens key={i} toks={seg.toks} />
        ) : (
          <button
            key={i}
            className="term"
            onClick={(e) => {
              e.stopPropagation();
              onTerm(seg.term!);
            }}
          >
            <Tokens toks={seg.toks} />
          </button>
        ),
      )}
    </span>
  );
}

/** Headword with its full reading over the whole word (works for okurigana words too). */
export function WordRuby({ word, reading }: { word: string; reading?: string }) {
  if (!reading || reading === word) return <>{word}</>;
  return (
    <ruby>
      {word}
      <rt>{reading}</rt>
    </ruby>
  );
}

export function Speak({ text, jtext, small }: { text?: string; jtext?: string; small?: boolean }) {
  const [busy, setBusy] = useState(false);
  if (!canSpeak()) return null;
  const say = (e: MouseEvent) => {
    e.stopPropagation();
    speak(text ?? kana(jtext ?? ''));
    setBusy(true);
    setTimeout(() => setBusy(false), 600);
  };
  return (
    <button className={`speak ${small ? 'small' : ''}`} onClick={say} aria-label="발음 듣기" style={busy ? { filter: 'brightness(1.15)' } : undefined}>
      🔊
    </button>
  );
}
