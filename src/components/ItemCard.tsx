import { type Example, type Grammar, type Item, type Phrase, type Quote, type Word, MEDIUM_LABEL, SRC_LABEL, isGrammar, isQuote, isWord } from '../lib/content';
import { ytSearch } from '../lib/fun';
import { JP, Speak, WordRuby } from './JP';

function Level({ level }: { level: 'N3' | 'N2' | 'N1' }) {
  return <span className={`chip ${level.toLowerCase()}`}>{level}</span>;
}

function ExampleView({ ex, highlight }: { ex: Example; highlight?: string }) {
  return (
    <div className="example">
      <div className="scene">
        {SRC_LABEL[ex.src]} · {ex.scene}
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <JP text={ex.jp} highlight={highlight} />
          <div className="ko">{ex.ko}</div>
        </div>
        <Speak jtext={ex.jp} small />
      </div>
    </div>
  );
}

function WordCard({ w }: { w: Word }) {
  const clozeEx = w.examples[w.cloze.ex];
  return (
    <>
      <div className="intro-head">
        <div className="chips" style={{ justifyContent: 'center' }}>
          <Level level={w.level} />
          <span className="chip">{w.pos}</span>
          <span className="chip">{w.theme}</span>
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
          <span className="intro-word">
            <WordRuby word={w.word} reading={w.reading} />
          </span>
          <Speak text={w.reading} />
        </div>
        <div className="intro-meaning">{w.meaning}</div>
      </div>
      <div className="note">💡 {w.note}</div>
      <div style={{ marginTop: 8 }}>
        {w.examples.map((ex, i) => (
          <ExampleView key={i} ex={ex} highlight={ex === clozeEx ? w.cloze.target : undefined} />
        ))}
      </div>
    </>
  );
}

function GrammarCard({ g }: { g: Grammar }) {
  return (
    <>
      <div className="intro-head">
        <div className="chips" style={{ justifyContent: 'center' }}>
          <Level level={g.level} />
          <span className="chip">{g.theme}</span>
        </div>
        <div className="pattern" style={{ marginTop: 8 }}>
          {g.pattern}
        </div>
        <div className="intro-meaning">{g.meaning}</div>
      </div>
      <div className="formation">🔧 {g.formation}</div>
      <div className="note" style={{ marginTop: 10 }}>
        {g.explanation}
      </div>
      <div style={{ marginTop: 8 }}>
        {g.examples.map((ex, i) => (
          <ExampleView key={i} ex={ex} highlight={g.cloze.find((c) => c.ex === i)?.target} />
        ))}
      </div>
    </>
  );
}

function PhraseCard({ p }: { p: Phrase }) {
  return (
    <>
      <div className="chips">
        <Level level={p.level} />
        <span className="chip">{p.theme}</span>
        <span className="chip">{SRC_LABEL[p.src]}</span>
      </div>
      <div className="muted small" style={{ margin: '10px 0 4px' }}>
        🎬 {p.scene}
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, fontSize: 22 }}>
          <JP text={p.jp} highlight={p.expression} />
        </div>
        <Speak jtext={p.jp} />
      </div>
      <div style={{ fontSize: 17, margin: '6px 0 14px' }}>{p.ko}</div>
      <div className="note">
        <b className="jp">{p.expression}</b>
        <br />
        {p.note}
      </div>
    </>
  );
}

export function QuoteCard({ q }: { q: Quote }) {
  return (
    <>
      <div className="chips">
        <Level level={q.level} />
        <span className="chip">{MEDIUM_LABEL[q.medium]}</span>
        <span className="chip">{q.point}</span>
      </div>
      <div className="row quote-line" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <JP text={q.line} />
        </div>
        <Speak jtext={q.line} />
      </div>
      <div className="quote-ko">“{q.ko}”</div>
      <div className="quote-src">
        원작 출처 <b>{q.work}</b> <span className="muted">({q.work_ko})</span> · {q.speaker_ko}
      </div>
      <div className="note" style={{ marginTop: 12 }}>
        {q.note}
      </div>
      <div className="h2" style={{ fontSize: 15 }}>
        이 표현, 이렇게 써요
      </div>
      {q.examples.map((ex, i) => (
        <ExampleView key={i} ex={ex} />
      ))}
      <div className="quote-links">
        <a className="yt-link" href={ytSearch(q.yt)} target="_blank" rel="noreferrer">
          <span className="yt-ico">▶</span>
          <span>
            <div className="t">유튜브에서 장면 찾기</div>
            <div className="d">「{q.yt}」 검색</div>
          </span>
        </a>
        <a className="yt-link" href={q.ref} target="_blank" rel="noreferrer">
          <span className="yt-ico ref">i</span>
          <span>
            <div className="t">작품 정보</div>
            <div className="d">{new URL(q.ref).host}</div>
          </span>
        </a>
      </div>
    </>
  );
}

export function ItemCard({ item }: { item: Item }) {
  if (isWord(item)) return <WordCard w={item} />;
  if (isQuote(item)) return <QuoteCard q={item} />;
  if (isGrammar(item)) return <GrammarCard g={item} />;
  return <PhraseCard p={item as Phrase} />;
}
