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
