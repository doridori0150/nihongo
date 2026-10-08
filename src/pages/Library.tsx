import { useMemo, useState } from 'react';
import { Sheet, Stages, stageLabel } from '../components/common';
import { ItemCard } from '../components/ItemCard';
import { type Content, type Item, isGrammar, isQuote, isWord, itemMeaning, itemTitle } from '../lib/content';
import { plain } from '../lib/jtext';
import { STAGE_GRADUATED, markForReview, useProgress } from '../lib/store';

type Kind = 'w' | 'g' | 'p';
type Filter = 'learned' | 'review' | 'all';

export function Library({ content }: { content: Content }) {
  const p = useProgress();
  const [kind, setKind] = useState<Kind>('w');
  const [filter, setFilter] = useState<Filter>('learned');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Item | null>(null);

  const list = useMemo(() => {
    const pool: Item[] = kind === 'w' ? content.words : kind === 'g' ? content.grammar : content.phrases;
    const query = q.trim().toLowerCase();
    return pool
      .filter((it) => {
        const rec = p.items[it.id];
        if (filter === 'learned' && !rec) return false;
        if (filter === 'review' && !(rec && rec.stage >= 0 && rec.stage < STAGE_GRADUATED)) return false;
        if (!query) return true;
        const hay = isWord(it)
          ? `${it.word} ${it.reading} ${it.meaning}`
          : isGrammar(it)
            ? `${it.pattern} ${it.meaning}`
            : isQuote(it)
              ? `${plain(it.line)} ${it.ko} ${it.work} ${it.work_ko}`
              : `${plain(it.jp)} ${it.ko} ${'expression' in it ? it.expression : ''}`;
        return hay.toLowerCase().includes(query);
      })
      .sort((a, b) => (p.items[b.id]?.u ?? 0) - (p.items[a.id]?.u ?? 0));
  }, [content, kind, filter, q, p.items]);

  const rec = open ? p.items[open.id] : undefined;

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="h1">단어장</div>
      <div className="seg">
        {(
          [
            ['w', `단어 ${content.words.length}`],
            ['g', `문법 ${content.grammar.length}`],
            ['p', `문장 ${content.phrases.length}`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
            {label}
          </button>
        ))}
      </div>
      <input className="search" placeholder="검색 (일본어·읽기·뜻)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips" style={{ margin: '10px 0 4px' }}>
        {(
          [
            ['learned', '배운 것'],
            ['review', '복습 중'],
            ['all', '전체 보기'],
          ] as const
        ).map(([f, label]) => (
          <button
            key={f}
            className="chip"
            style={filter === f ? { background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)', cursor: 'pointer' } : { cursor: 'pointer' }}
            onClick={() => setFilter(f)}
          >
            {label}
          </button>
        ))}
        <span className="muted small" style={{ marginLeft: 'auto' }}>
          {list.length}개
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="big">📭</div>
          {filter === 'learned' ? '아직 배운 항목이 없어요. 오늘의 학습을 시작해 보세요!' : '해당하는 항목이 없어요.'}
        </div>
      ) : (
        list.slice(0, 300).map((it) => {
          const r = p.items[it.id];
          return (
            <button key={it.id} className="list-item" onClick={() => setOpen(it)} style={!r ? { opacity: 0.6 } : undefined}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="w" style={isGrammar(it) ? { color: 'var(--purple)' } : undefined}>
                  {itemTitle(it)}
                  {isWord(it) && it.reading !== it.word && <span className="muted small"> {it.reading}</span>}
                </div>
                <div className="m">{itemMeaning(it)}</div>
              </div>
              {r && r.stage >= 0 && <Stages rec={r} />}
              {r && r.stage >= STAGE_GRADUATED && <span>🎓</span>}
            </button>
          );
        })
      )}

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <ItemCard item={open} />
          <div className="row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
            {rec ? (
              <span className="small muted">
                {stageLabel(rec)} · ✅ {rec.right} · ❌ {rec.wrong}
              </span>
            ) : (
              <span className="small muted">아직 배우지 않은 항목</span>
            )}
            <span className="spacer" />
            {!(rec && rec.stage >= 0 && rec.stage < STAGE_GRADUATED) && (
              <button className="btn small blue" onClick={() => markForReview(open.id)}>
                🔁 복습에 추가
              </button>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
