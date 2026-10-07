import { useState } from 'react';
import { Sheet, Stages, stageLabel } from '../components/common';
import { ItemCard } from '../components/ItemCard';
import { JP } from '../components/JP';
import { type Content, type Item, itemMeaning, itemTitle } from '../lib/content';
import { relativeKo, today } from '../lib/date';
import { practiceSession, reviewSession, REVIEW_BATCH, type Session } from '../lib/sessions';
import { INTERVALS, STAGE_GRADUATED, dueItems, useProgress } from '../lib/store';

const MODE_LABEL = { situation: '상황 대답', compose: '작문', opinion: '의견', roleplay: '롤플레이' };

export function Notes({ content, start }: { content: Content; start: (s: Session | null) => void }) {
  const p = useProgress();
  const [tab, setTab] = useState<'srs' | 'ai'>('srs');
  const [open, setOpen] = useState<Item | null>(null);
  const due = dueItems(p).filter((id) => content.byId.has(id));
  const reviewing = Object.entries(p.items)
    .filter(([id, r]) => r.stage >= 0 && r.stage < STAGE_GRADUATED && content.byId.has(id))
    .sort((a, b) => ((a[1].due ?? '') < (b[1].due ?? '') ? -1 : 1));
  const graduated = Object.entries(p.items).filter(([id, r]) => r.stage >= STAGE_GRADUATED && content.byId.has(id));

  // group by due date
  const groups = new Map<string, [string, (typeof reviewing)[number][1]][]>();
  for (const [id, r] of reviewing) {
    const key = r.due ?? '';
    groups.set(key, [...(groups.get(key) ?? []), [id, r]]);
  }

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="h1">복습 노트</div>
      <div className="seg">
        <button className={tab === 'srs' ? 'on' : ''} onClick={() => setTab('srs')}>
          🔁 복습 일정 {reviewing.length}
        </button>
        <button className={tab === 'ai' ? 'on' : ''} onClick={() => setTab('ai')}>
          🤖 AI 첨삭 {p.ai.length}
        </button>
      </div>

      {tab === 'srs' && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="small muted" style={{ lineHeight: 1.6 }}>
              틀린 항목은 <b>{INTERVALS.join(' → ')}일</b> 간격으로 다시 나와요. 맞히면 다음 단계로, 틀리면 1일부터 다시. 28일 단계까지 맞히면 🎓 졸업!
            </div>
            <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn small" disabled={!due.length} onClick={() => start(reviewSession(content))}>
                지금 복습 {due.length ? `(${Math.min(due.length, REVIEW_BATCH)})` : ''}
              </button>
              <button className="btn small ghost" disabled={!reviewing.length} onClick={() => start(practiceSession(content))}>
                🎯 자유 연습 (일정 안 바뀜)
              </button>
            </div>
          </div>

          {reviewing.length === 0 && (
            <div className="empty">
              <div className="big">✨</div>
              복습할 항목이 없어요. 틀린 문제가 생기면 여기에 쌓여요.
            </div>
          )}
          {[...groups.entries()].map(([date, rows]) => (
            <div key={date}>
              <div className="h2" style={{ fontSize: 15 }}>
                {date ? (relativeKo(date).includes('전') || relativeKo(date) === '오늘' ? `📌 ${relativeKo(date)} (지금 복습 가능)` : `📅 ${relativeKo(date)}`) : ''}
                <span className="muted small"> · {rows.length}개</span>
              </div>
              {rows.map(([id, r]) => {
                const it = content.byId.get(id)!;
                return (
                  <button key={id} className="list-item" onClick={() => setOpen(it)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="w">{itemTitle(it)}</div>
                      <div className="m">
                        {itemMeaning(it)} · ❌ {r.wrong}
                      </div>
                    </div>
                    <Stages rec={r} />
                  </button>
                );
              })}
            </div>
          ))}
          {graduated.length > 0 && (
            <div className="muted small" style={{ marginTop: 16 }}>
              🎓 졸업한 항목 {graduated.length}개 — 단어장에서 볼 수 있어요.
            </div>
          )}
        </>
      )}

      {tab === 'ai' &&
        (p.ai.length === 0 ? (
          <div className="empty">
            <div className="big">🤖</div>
            AI 회화 연습을 하면 첨삭 기록이 여기에 남아요.
          </div>
        ) : (
          p.ai.map((e) => (
            <div key={e.id} className="card">
              <div className="row small">
                <span className="chip">{MODE_LABEL[e.mode]}</span>
                <span className="muted">{relativeKo(today(new Date(e.at)))}</span>
                <span className="spacer" />
                <b style={{ color: e.score >= 80 ? 'var(--ok-text)' : e.score >= 60 ? 'var(--orange)' : 'var(--bad-text)' }}>{e.score}점</b>
              </div>
              <div className="small muted" style={{ marginTop: 8 }}>
                {e.prompt}
              </div>
              <div className="jp" style={{ marginTop: 6, fontSize: 15 }}>
                ✍️ {e.answer}
              </div>
              {e.corrected && (
                <div style={{ marginTop: 4, fontSize: 16 }}>
                  ✅ <JP text={e.corrected} />
                </div>
              )}
              <div className="note" style={{ marginTop: 8 }}>
                {e.feedback}
              </div>
            </div>
          ))
        ))}

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <ItemCard item={open} />
          {p.items[open.id] && (
            <div className="small muted" style={{ marginTop: 14 }}>
              {stageLabel(p.items[open.id])} · ✅ {p.items[open.id].right} · ❌ {p.items[open.id].wrong}
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
