import { useState } from 'react';
import { Bubble } from '../components/Avatar';
import { QuoteCard } from '../components/ItemCard';
import { JP } from '../components/JP';
import { say } from '../lib/cast';
import { type Content, type MediumGroup, type Quote, MEDIUM_GROUP, MEDIUM_LABEL, groupOf } from '../lib/content';
import { hash } from '../lib/daily';
import { diffDays, today } from '../lib/date';
import { setInDeck, useProgress } from '../lib/store';

const GROUPS = Object.keys(MEDIUM_GROUP) as MediumGroup[];

/** Today's featured quote of a category (same for everyone on a given day). */
export function todaysQuote(content: Content, group: MediumGroup): Quote | undefined {
  const pool = content.quotes.filter((q) => groupOf(q.medium) === group);
  return pool.length ? pool[hash(`${today()}:${group}`) % pool.length] : undefined;
}

export function Quotes({ content, sub, go }: { content: Content; sub: string; go: (r: string) => void }) {
  const p = useProgress();
  const group: MediumGroup = GROUPS.includes(sub as MediumGroup) ? (sub as MediumGroup) : 'anime';
  const [open, setOpen] = useState<string | null>(null);
  const list = content.quotes.filter((q) => groupOf(q.medium) === group);
  const pick = todaysQuote(content, group);
  const ordered = pick ? [pick, ...list.filter((q) => q.id !== pick.id)] : list;
  const s = say('quotes', diffDays(today(), '2026-01-01'));

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="h1">명대사 극장</div>
      <Bubble member={s.member} line={s.line} />
      <div className="seg" style={{ marginTop: 14 }}>
        {GROUPS.map((g) => (
          <button key={g} className={group === g ? 'on' : ''} onClick={() => go(`quotes-${g}`)}>
            {MEDIUM_GROUP[g].icon} {MEDIUM_GROUP[g].label}
          </button>
        ))}
      </div>
      {list.length === 0 && <div className="empty">이 카테고리의 명대사를 준비 중이에요.</div>}
      <div className="quote-list">
        {ordered.map((q) => {
          const isOpen = open === q.id;
          const on = !!p.deck[q.id]?.on;
          return (
            <article key={q.id} className={`quote-item ${isOpen ? 'open' : ''}`}>
              {q === pick && <div className="today-tag">오늘의 명대사</div>}
              {isOpen ? (
                <QuoteCard q={q} />
              ) : (
                <button className="quote-summary" onClick={() => setOpen(q.id)}>
                  <div className="qs-line">
                    <JP text={q.line} />
                  </div>
                  <div className="qs-ko">{q.ko}</div>
                  <div className="qs-src">
                    {MEDIUM_LABEL[q.medium]} · <b>{q.work_ko}</b> · {q.speaker_ko}
                  </div>
                </button>
              )}
              <div className="quote-actions">
                {isOpen && (
                  <button className="btn ghost plain small" onClick={() => setOpen(null)}>
                    접기
                  </button>
                )}
                <span className="spacer" />
                <button className={`btn small ${on ? 'ghost' : 'violet'}`} onClick={() => setInDeck([q.id], !on)}>
                  {on ? '✓ 암기 카드' : '+ 암기 카드'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="small muted" style={{ marginTop: 18, lineHeight: 1.7 }}>
        대사는 학습 목적으로 출처를 밝혀 짧게 인용했어요. 장면은 유튜브 검색 링크로, 작품 정보는 위키백과·공식 사이트 링크로 연결돼요.
      </div>
    </div>
  );
}
