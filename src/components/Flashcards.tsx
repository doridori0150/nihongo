import { useCallback, useEffect, useState } from 'react';
import { say } from '../lib/cast';
import { type Content, type Item, MEDIUM_LABEL, isExpr, isGrammar, isPhrase, isQuote, isWord } from '../lib/content';
import { kana } from '../lib/jtext';
import { sfx, speak } from '../lib/speech';
import { type CardRating, addAccuracy, addXp, rateCards, useProgress } from '../lib/store';
import { Bubble } from './Avatar';
import { askConfirm } from './confirm';
import { JP, Speak, WordRuby } from './JP';

function Front({ it }: { it: Item }) {
  if (isWord(it)) return <div className="fc-word">{it.word}</div>;
  if (isGrammar(it)) return <div className="fc-word grammar">{it.pattern}</div>;
  if (isExpr(it))
    return (
      <div className="fc-sentence">
        <JP text={it.jp} />
        <div className="fc-hint">스토리 표현</div>
      </div>
    );
  if (isQuote(it))
    return (
      <div className="fc-sentence">
        <JP text={it.line} />
        <div className="fc-hint">{MEDIUM_LABEL[it.medium]} · {it.work}</div>
      </div>
    );
  return (
    <div className="fc-sentence">
      <JP text={it.jp} />
    </div>
  );
}

function Back({ it }: { it: Item }) {
  if (isWord(it)) {
    const ex = it.examples[0];
    return (
      <>
        <div className="fc-reading">
          <WordRuby word={it.word} reading={it.reading} /> <Speak text={it.reading} small />
        </div>
        <div className="fc-meaning">{it.meaning}</div>
        <div className="fc-ex">
          <JP text={ex.jp} />
          <div className="muted small">{ex.ko}</div>
        </div>
      </>
    );
  }
  if (isGrammar(it)) {
    const ex = it.examples[0];
    return (
      <>
        <div className="fc-meaning">{it.meaning}</div>
        <div className="formation small">🔧 {it.formation}</div>
        <div className="fc-ex">
          <JP text={ex.jp} />
          <div className="muted small">{ex.ko}</div>
        </div>
      </>
    );
  }
  if (isExpr(it))
    return (
      <>
        <div className="fc-meaning">{it.ko}</div>
        <div className="small" style={{ marginTop: 8 }}>
          📌 {it.note}
        </div>
      </>
    );
  if (isQuote(it))
    return (
      <>
        <div className="fc-meaning">“{it.ko}”</div>
        <div className="quote-src">
          원작 출처 <b>{it.work}</b> · {it.speaker_ko}
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          📌 {it.point}
        </div>
      </>
    );
  if (isPhrase(it))
    return (
      <>
        <div className="fc-meaning">{it.ko}</div>
        <div className="small" style={{ marginTop: 8 }}>
          📌 <b className="jp">{it.expression}</b> — {it.note}
        </div>
      </>
    );
  return null;
}

function speakText(it: Item): string {
  if (isWord(it)) return it.reading;
  if (isGrammar(it)) return kana(it.examples[0].jp);
  if (isQuote(it)) return kana(it.line);
  if (isExpr(it)) return kana(it.jp);
  return kana(it.jp);
}

/** Flip-card session over the given items; "again" puts a card back at the end of the stack. */
export function FlashcardSession({ ids, content, onExit }: { ids: string[]; content: Content; onExit: () => void }) {
  const p = useProgress();
  const [queue, setQueue] = useState<string[]>(ids);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [first, setFirst] = useState<Record<string, CardRating>>({});
  const [done, setDone] = useState<null | { known: number; total: number; xp: number }>(null);
  const it = content.byId.get(queue[idx]);

  const rate = useCallback(
    (r: CardRating) => {
      const id = queue[idx];
      const nextFirst = first[id] ? first : { ...first, [id]: r };
      setFirst(nextFirst);
      if (r === 'again') {
        sfx.wrong();
        setQueue((q) => [...q, id]);
      } else sfx.correct();
      setFlipped(false);
      const end = idx + 1 >= queue.length + (r === 'again' ? 1 : 0);
      if (!end) return setIdx(idx + 1);
      const results = Object.entries(nextFirst).map(([cid, rating]) => ({ id: cid, rating }));
      rateCards(results);
      const known = results.filter((x) => x.rating === 'good').length;
      addAccuracy(known, results.length - known);
      const xp = Math.ceil(results.length / 2) + known;
      addXp(xp);
      sfx.done();
      setDone({ known, total: results.length, xp });
    },
    [queue, idx, first],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) setFlipped(true);
        else rate('good');
      }
      if (!flipped) return;
      if (e.key === '1') rate('again');
      if (e.key === '2') rate('hard');
      if (e.key === '3') rate('good');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [flipped, done, rate]);

  useEffect(() => {
    if (flipped && it && p.settings.sound) speak(speakText(it));
  }, [flipped, it, p.settings.sound]);

  const exit = () => {
    if (done || idx === 0) return onExit();
    void askConfirm({ title: '카드 넘기기를 그만둘까요?', body: '이번에 넘긴 카드 기록은 저장되지 않아요.', ok: '그만두기', cancel: '계속', danger: true }).then(
      (ok) => ok && onExit(),
    );
  };

  if (done) {
    const s = say(done.known === done.total ? 'deckDone' : 'wrong');
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="complete">
            <div className="big">🃏</div>
            <div className="title">카드 {done.total}장 완료!</div>
            <div className="quip">
              바로 앎 {done.known}장 · 다시 볼 카드 {done.total - done.known}장 · ⚡ {done.xp} XP
            </div>
            <div style={{ textAlign: 'left', marginTop: 16 }}>
              <Bubble member={s.member} line={s.line} />
            </div>
          </div>
        </div>
        <div className="lesson-foot">
          <div className="lesson-foot-inner">
            <button className="btn block" onClick={onExit} autoFocus>
              계속
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!it) return null;

  const pct = Math.round((Object.keys(first).length / ids.length) * 100);
  return (
    <div className={`lesson ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="lesson-top">
        <button className="icon-btn" onClick={exit} aria-label="닫기">
          ✕
        </button>
        <div className="bar">
          <div style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <span className="combo" style={{ color: 'var(--muted)' }}>
          {Math.min(idx + 1, queue.length)}/{queue.length}
        </span>
      </div>
      <div className="lesson-body">
        {/* a div, not a button: the back side holds its own speak buttons */}
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="fc-face" role="button" tabIndex={0} aria-label="카드 뒤집기" onClick={() => setFlipped(true)}>
            <Front it={it} />
            {!flipped && <div className="fc-tap">탭해서 뒤집기</div>}
          </div>
          {flipped && (
            <div className="fc-back">
              <Back it={it} />
            </div>
          )}
        </div>
      </div>
      <div className="lesson-foot">
        <div className="lesson-foot-inner">
          {flipped ? (
            <>
              <button className="btn red block" onClick={() => rate('again')}>
                몰라요
              </button>
              <button className="btn ghost block" onClick={() => rate('hard')}>
                애매해요
              </button>
              <button className="btn ok block" onClick={() => rate('good')}>
                알아요
              </button>
            </>
          ) : (
            <button className="btn block" onClick={() => setFlipped(true)}>
              정답 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
