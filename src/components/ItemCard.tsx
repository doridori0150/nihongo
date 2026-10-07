import { type Example, type Grammar, type Item, type Phrase, type Word, SRC_LABEL, isGrammar, isWord } from '../lib/content';
import { JP, Speak, WordRuby } from './JP';

function Level({ level }: { level: 'N2' | 'N1' }) {
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

export function ItemCard({ item }: { item: Item }) {
  if (isWord(item)) return <WordCard w={item} />;
  if (isGrammar(item)) return <GrammarCard g={item} />;
  return <PhraseCard p={item as Phrase} />;
}
