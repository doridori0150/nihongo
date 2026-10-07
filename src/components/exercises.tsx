import { useEffect, useState } from 'react';
import { parseChunks, plain, splitAtRange } from '../lib/jtext';
import type { Graded } from '../lib/quiz';
import { sfx } from '../lib/speech';
import { JP, Speak, Tokens, WordRuby } from './JP';

export type Answer = number | number[] | null;

export function isCorrect(ex: Graded, value: Answer): boolean {
  if (value === null) return false;
  if (ex.kind === 'assemble') {
    const built = (value as number[]).map((i) => plain(ex.tiles[i])).join('');
    const norm = (s: string) => s.replace(/[\s、。！？!?,.]/g, '');
    return built === ex.answer || norm(built) === norm(ex.answer);
  }
  return value === ex.answer;
}

interface Props<E extends Graded> {
  ex: E;
  value: Answer;
  checked: boolean;
  onChange: (v: Answer) => void;
}

function useDigitKeys(count: number, checked: boolean, onPick: (i: number) => void) {
  useEffect(() => {
    if (checked) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) onPick(n - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [count, checked, onPick]);
}

function optionClass(i: number, value: Answer, answer: number, checked: boolean) {
  if (checked) {
    if (i === answer) return 'right';
    if (i === value) return 'wrong';
    return '';
  }
  return i === value ? 'sel' : '';
}

export function ChoiceView({ ex, value, checked, onChange }: Props<Extract<Graded, { kind: 'choice' }>>) {
  const pick = (i: number) => {
    sfx.tap();
    onChange(i);
  };
  useDigitKeys(ex.options.length, checked, pick);
  const p = ex.prompt;
  return (
    <>
      <div className="ex-title">{ex.title}</div>
      {p.word && (
        <div className="prompt-word">
          <span className="w">
            <WordRuby word={p.word} reading={p.reading} />
          </span>
          {p.speak && <Speak text={p.speak} />}
        </div>
      )}
      {p.text && (
        <div className="prompt-word">
          <span className="w" style={{ fontSize: 34, color: 'var(--purple)' }}>
            {p.text}
          </span>
        </div>
      )}
      {p.ko && <div className="prompt-ko">“{p.ko}”</div>}
      {p.jp && (
        <div className="bubble-row">
          <div className="speech">
            <JP text={p.jp} />
          </div>
          <Speak jtext={p.jp} />
        </div>
      )}
      <div className="options" style={{ marginTop: 12 }}>
        {ex.options.map((o, i) => (
          <button
            key={i}
            className={`option ${o.jp ? 'jp-opt' : ''} ${optionClass(i, value, ex.answer, checked)}`}
            onClick={() => !checked && pick(i)}
            disabled={checked}
          >
            <span className="key">{i + 1}</span>
            <span>{o.text}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function ClozeView({ ex, value, checked, onChange }: Props<Extract<Graded, { kind: 'cloze' }>>) {
  const [showKo, setShowKo] = useState(false);
  const pick = (i: number) => {
    sfx.tap();
    onChange(i);
  };
  useDigitKeys(ex.options.length, checked, pick);
  const start = plain(ex.jp).indexOf(ex.target);
  const { before, inside, after } = splitAtRange(ex.jp, start, start + ex.target.length);
  const fill = typeof value === 'number' ? ex.options[value] : '';
  return (
    <>
      <div className="ex-title">{ex.title}</div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="jp cloze-sentence" style={{ flex: 1 }}>
          <Tokens toks={before} />
          {checked ? (
            <span className="hl">
              <Tokens toks={inside} />
            </span>
          ) : (
            <span className={`blank ${fill ? 'filled' : ''}`}>{fill || ' '}</span>
          )}
          <Tokens toks={after} />
        </div>
        {checked && <Speak jtext={ex.jp} />}
      </div>
      {showKo || checked ? (
        <div className="ko-line">{ex.ko}</div>
      ) : (
        <button className="reveal-ko" onClick={() => setShowKo(true)}>
          해석 보기
        </button>
      )}
      <div className="options" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {ex.options.map((o, i) => (
          <button
            key={i}
            className={`option jp-opt ${optionClass(i, value, ex.answer, checked)}`}
            onClick={() => !checked && pick(i)}
            disabled={checked}
          >
            <span className="key">{i + 1}</span>
            <span>{o}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function AssembleView({ ex, value, checked, onChange }: Props<Extract<Graded, { kind: 'assemble' }>>) {
  const chosen = (value as number[] | null) ?? [];
  const add = (i: number) => {
    if (checked || chosen.includes(i)) return;
    sfx.tap();
    onChange([...chosen, i]);
  };
  const remove = (pos: number) => {
    if (checked) return;
    const next = chosen.filter((_, k) => k !== pos);
    onChange(next.length ? next : null);
  };
  useEffect(() => {
    if (checked) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && chosen.length) remove(chosen.length - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const tile = (src: string) => <Tokens toks={parseChunks(src).flat()} />;
  return (
    <>
      <div className="ex-title">{ex.title}</div>
      <div className="bubble-row">
        <div className="speech" style={{ fontSize: 17 }}>
          <div className="speech-label">이 뜻이 되도록 일본어 블록을 순서대로</div>
          {ex.ko}
        </div>
      </div>
      <div className="answer-line">
        {chosen.map((ti, pos) => (
          <button key={pos} className="tile" onClick={() => remove(pos)}>
            {tile(ex.tiles[ti])}
          </button>
        ))}
      </div>
      <div className="tiles">
        {ex.tiles.map((t, i) => (
          <button key={i} className={`tile ${chosen.includes(i) ? 'used' : ''}`} onClick={() => add(i)} disabled={checked}>
            {tile(t)}
          </button>
        ))}
      </div>
      {checked && (
        <div className="row" style={{ marginTop: 18, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, fontSize: 18 }}>
            <JP text={ex.jp} />
          </div>
          <Speak jtext={ex.jp} />
        </div>
      )}
    </>
  );
}

