import { useMemo, useState } from 'react';
import { Avatar, Bubble } from '../components/Avatar';
import { Sheet } from '../components/common';
import { ItemCard } from '../components/ItemCard';
import { say } from '../lib/cast';
import { type Content, type Item, isGrammar, isWord, itemMeaning, itemTitle } from '../lib/content';
import { type Course, COURSES, EXTRA_COURSES, chapters, findCourse } from '../lib/courses';
import { diffDays, today } from '../lib/date';
import { deckQuizSession, type Session } from '../lib/sessions';
import { DECK_MASTERED, deckDue, deckIds, setInDeck, useProgress } from '../lib/store';

interface Props {
  content: Content;
  sub: string;
  go: (route: string) => void;
  start: (s: Session | null) => void;
  startCards: (ids: string[]) => void;
}

export function Study({ content, sub, go, start, startCards }: Props) {
  const course = sub ? findCourse(sub) : undefined;
  if (course) return <CourseView course={course} content={content} go={go} />;
  return <StudyHome content={content} go={go} start={start} startCards={startCards} />;
}

function DeckCard({ content, start, startCards }: Pick<Props, 'content' | 'start' | 'startCards'>) {
  const p = useProgress();
  const ids = deckIds(p).filter((id) => content.byId.has(id));
  const due = deckDue(p).filter((id) => content.byId.has(id));
  const mastered = ids.filter((id) => (p.deck[id]?.stage ?? -1) >= DECK_MASTERED).length;
  return (
    <section className="deck-card">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar id="hiyori" size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="deck-title">내 암기 카드</div>
          <div className="small muted">체크한 단어·문법·명대사가 여기 모여요. 1·3·7·14·28일 간격으로 다시 나와요.</div>
        </div>
      </div>
      <div className="review-stats" style={{ marginTop: 14 }}>
        <div className={`rs ${due.length ? 'hot' : ''}`}>
          <b>{due.length}</b>
          <span>오늘 볼 카드</span>
        </div>
        <div className="rs">
          <b>{ids.length}</b>
          <span>전체</span>
        </div>
        <div className="rs">
          <b>{mastered}</b>
          <span>마스터</span>
        </div>
      </div>
      <div className="section-actions">
        <button className="btn" disabled={!due.length} onClick={() => startCards(due.slice(0, 30))}>
          🃏 카드 넘기기 {due.length ? `(${Math.min(due.length, 30)})` : ''}
        </button>
        <button className="btn ghost" disabled={!ids.length} onClick={() => start(deckQuizSession(content, due.length ? due : ids))}>
          ✍️ 퀴즈로 복습
        </button>
        <button className="btn ghost" disabled={!ids.length} onClick={() => startCards(ids.slice(0, 40))}>
          전체 훑어보기
        </button>
      </div>
      {!ids.length && <div className="small muted" style={{ marginTop: 10 }}>아래 코스에서 외우고 싶은 항목에 ✓ 체크하면 카드가 만들어져요.</div>}
    </section>
  );
}

function CourseTile({ course, content, onOpen }: { course: Course; content: Content; onOpen: () => void }) {
  const p = useProgress();
  const items = course.items(content);
  const checked = items.filter((it) => p.deck[it.id]?.on).length;
  const learned = items.filter((it) => p.items[it.id]).length;
  return (
    <button className="course" onClick={onOpen} style={{ ['--c' as string]: course.color }} disabled={!items.length}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="course-title">{course.title}</span>
        <Avatar id={course.host} size={34} />
      </div>
      <div className="course-sub">{course.sub}</div>
      <div className="course-meta">
        {items.length ? `${items.length}개 · ✓ ${checked} · 학습 ${learned}` : '준비 중'}
      </div>
      <div className="stack-bar light">
        <div className="solid" style={{ width: `${items.length ? (checked / items.length) * 100 : 0}%` }} />
      </div>
    </button>
  );
}

function StudyHome({ content, go, start, startCards }: Omit<Props, 'sub'>) {
  const s = say('study', diffDays(today(), '2026-01-01'));
  return (
    <div className="page">
      <div className="h1">본격 공부</div>
      <Bubble member={s.member} line={s.line} />
      <div style={{ height: 14 }} />
      <DeckCard content={content} start={start} startCards={startCards} />
      <div className="h2">코스</div>
      <div className="course-grid">
        {COURSES.map((c) => (
          <CourseTile key={c.id} course={c} content={content} onOpen={() => go(`study-${c.id}`)} />
        ))}
      </div>
      <div className="h2">더 보기</div>
      <div className="course-grid small-tiles">
        {EXTRA_COURSES.map((c) => (
          <CourseTile key={c.id} course={c} content={content} onOpen={() => go(`study-${c.id}`)} />
        ))}
        <button className="course" onClick={() => go('quotes')} style={{ ['--c' as string]: 'var(--violet)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="course-title">명대사 극장</span>
            <Avatar id="shizuku" size={34} />
          </div>
          <div className="course-sub">애니·드라마·소설 원작 대사 {content.quotes.length}개</div>
        </button>
        <button className="course" onClick={() => go('library')} style={{ ['--c' as string]: 'var(--muted)' }}>
          <div className="course-title">전체 검색</div>
          <div className="course-sub">모든 단어·문법·문장 찾아보기</div>
        </button>
      </div>
    </div>
  );
}

function CourseView({ course, content, go }: { course: Course; content: Content; go: (r: string) => void }) {
  const p = useProgress();
  const groups = useMemo(() => chapters(course, content), [course, content]);
  const [openCh, setOpenCh] = useState<string | null>(groups[0]?.title ?? null);
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [detail, setDetail] = useState<Item | null>(null);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const checkedAll = groups.reduce((n, g) => n + g.items.filter((it) => p.deck[it.id]?.on).length, 0);

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="row">
        <button className="icon-btn" onClick={() => go('study')} aria-label="뒤로">
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h1" style={{ margin: 0 }}>
            {course.title}
          </div>
          <div className="small muted">
            {total}개 · 암기 카드 ✓ {checkedAll}
          </div>
        </div>
        <Avatar id={course.host} size={44} />
      </div>
      <div className="row" style={{ margin: '12px 0', flexWrap: 'wrap' }}>
        <label className="check-toggle">
          <input type="checkbox" checked={onlyChecked} onChange={(e) => setOnlyChecked(e.target.checked)} /> 체크한 것만 보기
        </label>
      </div>
      {total === 0 && <div className="empty">콘텐츠를 준비 중이에요.</div>}
      {groups.map((g) => {
        const items = onlyChecked ? g.items.filter((it) => p.deck[it.id]?.on) : g.items;
        if (!items.length) return null;
        const checked = g.items.filter((it) => p.deck[it.id]?.on).length;
        const open = openCh === g.title || onlyChecked;
        return (
          <section key={g.title} className="chapter">
            <button className="chapter-head" onClick={() => setOpenCh(open && !onlyChecked ? null : g.title)} aria-expanded={open}>
              <span className="chapter-title">{g.title}</span>
              <span className="small muted">
                {g.items.length}개 · ✓ {checked}
              </span>
              <span className="chev">{open ? '▾' : '▸'}</span>
            </button>
            {open && (
              <>
                <div className="chapter-tools">
                  <button className="btn ghost plain small" onClick={() => setInDeck(g.items.map((it) => it.id), checked < g.items.length)}>
                    {checked < g.items.length ? '이 챕터 전부 체크' : '이 챕터 체크 해제'}
                  </button>
                </div>
                {items.map((it) => {
                  const on = !!p.deck[it.id]?.on;
                  return (
                    <div key={it.id} className={`study-row ${on ? 'on' : ''}`}>
                      <label className="study-check" aria-label="암기 카드에 추가">
                        <input type="checkbox" checked={on} onChange={(e) => setInDeck([it.id], e.target.checked)} />
                        <span />
                      </label>
                      <button className="study-main" onClick={() => setDetail(it)}>
                        <span className={`w ${isGrammar(it) ? 'grammar' : ''}`}>
                          {itemTitle(it)}
                          {isWord(it) && it.reading !== it.word && <span className="muted small"> {it.reading}</span>}
                        </span>
                        <span className="m">{itemMeaning(it)}</span>
                      </button>
                      {p.items[it.id] && <span className="learned-dot" title="학습함" />}
                    </div>
                  );
                })}
              </>
            )}
          </section>
        );
      })}
      {detail && (
        <Sheet onClose={() => setDetail(null)}>
          <ItemCard item={detail} />
          <button
            className={`btn block ${p.deck[detail.id]?.on ? 'ghost' : ''}`}
            style={{ marginTop: 16 }}
            onClick={() => setInDeck([detail.id], !p.deck[detail.id]?.on)}
          >
            {p.deck[detail.id]?.on ? '✓ 암기 카드에 있음 (빼기)' : '+ 암기 카드에 추가'}
          </button>
        </Sheet>
      )}
    </div>
  );
}
