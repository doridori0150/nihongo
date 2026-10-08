import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Bubble, Portrait } from '../components/Avatar';
import { Sheet } from '../components/common';
import { CAST, CLUB, type MemberId, say } from '../lib/cast';
import { MEDIUM_GROUP, type MediumGroup } from '../lib/content';
import { plain } from '../lib/jtext';
import { todaysQuote } from './Quotes';
import { ItemCard } from '../components/ItemCard';
import { JP, Speak } from '../components/JP';
import { getApiKey } from '../lib/aiKey';
import { type Content, type Grammar, type Item, type Phrase, type Situation, type Word, SRC_LABEL } from '../lib/content';
import { ensureTodayPlan, hash } from '../lib/daily';
import { addDays, diffDays, formatKo, today } from '../lib/date';
import { CHANNELS, dajareOf, langChanSearch, ytSearch } from '../lib/fun';
import { type Light, type LevelProgress, levelLabel, levelProgress, overall, signals } from '../lib/level';
import { requestAi } from '../lib/nav';
import { inClaude } from '../lib/runtime';
import {
  extraWordsSession,
  grammarSession,
  phrasesSession,
  practiceSession,
  reviewSession,
  REVIEW_BATCH,
  type Session,
  todayPracticeSession,
  wordsSession,
} from '../lib/sessions';
import { STAGE_GRADUATED, dueItems, local, streak, totalXp, useProgress } from '../lib/store';

interface Props {
  content: Content;
  start: (s: Session | null) => void;
  go: (route: string) => void;
}

export function Home({ content, start, go }: Props) {
  const p = useProgress();
  const d = today();
  const [open, setOpen] = useState<Item | null>(null);
  useEffect(() => {
    ensureTodayPlan(content);
  }, [content, p.settings.newPerDay, p.settings.level, d]);

  const plan = p.days[d];
  if (!plan) return null;

  const resolve = <T extends Item>(ids: string[]) => ids.map((id) => content.byId.get(id)).filter(Boolean) as T[];
  const words = resolve<Word>(plan.words);
  const grammar = resolve<Grammar>(plan.grammar);
  const phrases = resolve<Phrase>(plan.phrases);
  const situation = content.situations.length ? content.situations[hash(d) % content.situations.length] : null;

  return (
    <div className={`page home ${p.settings.furigana ? '' : 'furi-off'}`}>
      <ClubBanner content={content} />
      <Dashboard content={content} />
      <div className="home-grid">
        <WordsSection words={words} done={!!plan.done.words} start={start} content={content} onOpen={setOpen} />
        <QuotesSection content={content} go={go} />
        <PhrasesSection phrases={phrases} done={!!plan.done.phrases} start={start} content={content} />
        <GrammarSection grammar={grammar} done={!!plan.done.grammar} start={start} content={content} />
        {situation && <TalkSection situation={situation} done={!!plan.done.ai} go={go} />}
        <ReviewSection content={content} start={start} go={go} />
        <YouTubeSection grammar={grammar[0]} words={words} situation={situation} />
        <DajareSection />
      </div>
      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <ItemCard item={open} />
        </Sheet>
      )}
    </div>
  );
}

// ───────── club room ─────────

function ClubBanner({ content }: { content: Content }) {
  const p = useProgress();
  const d = today();
  const due = dueItems(p, d).filter((id) => content.byId.has(id)).length;
  const sig = signals(p, content, p.days[d]);
  const allDone = sig[0].light === 'green' && sig[1].light === 'green';
  const seed = diffDays(d, '2026-01-01');
  const [profile, setProfile] = useState<MemberId | null>(null);
  const s = allDone ? say('allDone', seed) : due > 0 ? say('reviewDue', seed) : say(new Date().getHours() < 11 ? 'greetMorning' : 'greet', seed);
  return (
    <section className="club">
      <div className="club-head">
        <div>
          <div className="club-name">
            {CLUB.name} <span className="muted small">{CLUB.ko}</span>
          </div>
          <div className="small muted">오늘도 부실에 모였다. 너는 한국에서 온 신입 부원.</div>
        </div>
        <div className="club-members">
          {(Object.keys(CAST) as MemberId[]).map((id) => (
            <button key={id} className="member-btn" onClick={() => setProfile(id)} aria-label={`${CAST[id].name_ko} 소개`}>
              <Avatar id={id} size={36} title />
            </button>
          ))}
        </div>
      </div>
      <Bubble member={s.member} line={s.line} size={52} />
      {profile && (
        <Sheet onClose={() => setProfile(null)}>
          <Portrait id={profile} />
          <div className="profile-name">
            {CAST[profile].name} <span className="muted small">{CAST[profile].reading}</span>
          </div>
          <div className="small muted" style={{ textAlign: 'center' }}>
            {CAST[profile].name_ko} · {CAST[profile].grade} · {CAST[profile].role}
          </div>
          <div className="note" style={{ marginTop: 12 }}>
            {CAST[profile].bio}
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {(Object.keys(CAST) as MemberId[]).map((id) => (
              <button key={id} className={`member-btn ${id === profile ? 'on' : ''}`} onClick={() => setProfile(id)} aria-label={CAST[id].name_ko}>
                <Avatar id={id} size={40} />
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </section>
  );
}

// ───────── dashboard ─────────

function Lamp({ light }: { light: Light }) {
  return <i className={`lamp ${light}`} aria-hidden />;
}

function TrafficLight({ light }: { light: Exclude<Light, 'off'> }) {
  const names = { red: '빨강', yellow: '노랑', green: '초록' };
  return (
    <div className="traffic" role="img" aria-label={`상태: ${names[light]}`}>
      {(['red', 'yellow', 'green'] as const).map((l) => (
        <i key={l} className={`bulb ${l} ${l === light ? 'on' : ''}`} />
      ))}
    </div>
  );
}

function LevelBar({ lp }: { lp: LevelProgress }) {
  const solid = lp.total ? (lp.solid / lp.total) * 100 : 0;
  const learning = lp.total ? ((lp.learned - lp.solid) / lp.total) * 100 : 0;
  return (
    <div className="level-bar">
      <div className="row small" style={{ justifyContent: 'space-between' }}>
        <span className={`chip ${lp.level.toLowerCase()}`}>{lp.level}</span>
        <span className="muted">
          안정 <b>{lp.solid}</b> · 학습 중 {lp.learned - lp.solid} / {lp.total}
        </span>
      </div>
      <div className="stack-bar">
        <div className="solid" style={{ width: `${solid}%` }} />
        <div className="learning" style={{ width: `${learning}%` }} />
      </div>
    </div>
  );
}

function Dashboard({ content }: { content: Content }) {
  const p = useProgress();
  const d = today();
  const sig = signals(p, content, p.days[d]);
  const all = overall(sig);
  const lp = levelProgress(p, content);
  const s = streak(p);
  return (
    <section className="dash">
      <div className="dash-top">
        <TrafficLight light={all.light} />
        <div style={{ minWidth: 0 }}>
          <div className="dash-date">
            {formatKo(d)} · 🔥 {s.days}일 연속 · {totalXp(p)} XP
          </div>
          <div className="dash-level">
            현재 수준 <b>{levelLabel(lp)}</b>
          </div>
          <div className={`dash-msg ${all.light}`}>{all.message}</div>
        </div>
      </div>
      <div className="dash-body">
        <div className="levels">
          {lp.map((x) => (
            <LevelBar key={x.level} lp={x} />
          ))}
          <div className="legend small muted">
            <span>
              <i className="sw solid" /> 안정 (7일 복습 통과 또는 한 번에 맞힘)
            </span>
            <span>
              <i className="sw learning" /> 학습 중
            </span>
          </div>
        </div>
        <div className="signals">
          {sig.map((x) => (
            <div key={x.key} className="signal">
              <Lamp light={x.light} />
              <div>
                <div className="s-label">{x.label}</div>
                <div className="s-value">{x.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── sections ─────────

function Section({
  icon,
  host,
  title,
  meta,
  done,
  className = '',
  children,
  actions,
  extra,
}: {
  icon: string;
  /** club member who hosts this section (shown instead of the icon) */
  host?: MemberId;
  title: string;
  meta?: string;
  done?: boolean;
  className?: string;
  children: ReactNode;
  actions?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section className={`section ${className}`}>
      <header className="section-head">
        {host ? <Avatar id={host} size={44} title /> : <span className="section-icon">{icon}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{title}</h2>
          {meta && <div className="section-meta">{meta}</div>}
        </div>
        {extra}
        {done && <span className="done-badge">✓ 완료</span>}
      </header>
      <div className="section-body">{children}</div>
      {actions && <footer className="section-actions">{actions}</footer>}
    </section>
  );
}

function WordsSection({
  words,
  done,
  start,
  content,
  onOpen,
}: {
  words: Word[];
  done: boolean;
  start: Props['start'];
  content: Content;
  onOpen: (w: Word) => void;
}) {
  const [hide, setHide] = useState(() => local.get('nd.hideMeaning') === '1');
  const toggle = () => {
    local.set('nd.hideMeaning', hide ? '0' : '1');
    setHide(!hide);
  };
  const n2 = words.filter((w) => w.level === 'N2').length;
  return (
    <Section
      icon="📖"
      host="hiyori"
      title="오늘의 단어"
      meta={`${words.length}개 · N2 ${n2} / N1 ${words.length - n2}`}
      done={done}
      className="span-2"
      actions={
        done ? (
          <>
            <button className="btn ghost" onClick={() => start(todayPracticeSession(content, 'words'))}>
              다시 연습
            </button>
            <button className="btn ghost" onClick={() => start(extraWordsSession(content))}>
              + 새 단어 5개 더
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => start(wordsSession(content))} disabled={!words.length}>
            단어 학습 시작
          </button>
        )
      }
    >
      {words.length === 0 ? (
        <div className="muted small">모든 단어를 학습했어요! 🎓 단어장이 텅 빈 게 아니라 머리가 꽉 찬 거예요.</div>
      ) : (
        <>
        <div className="section-tools">
          <button className="btn ghost plain small" onClick={toggle}>
            {hide ? '👀 뜻 보기' : '🙈 뜻 가리고 맞혀 보기'}
          </button>
        </div>
        <div className="word-grid">
          {words.map((w) => (
            <button key={w.id} className="word-tile" onClick={() => onOpen(w)}>
              <span className="wt-reading">{w.reading !== w.word ? w.reading : ' '}</span>
              <span className={`wt-word ${w.word.length > 5 ? "xlong" : w.word.length > 3 ? "long" : ""}`}>{w.word}</span>
              <span className={`wt-meaning ${hide ? 'blur' : ''}`}>{w.meaning}</span>
            </button>
          ))}
        </div>
        </>
      )}
    </Section>
  );
}

function PhrasesSection({ phrases, done, start, content }: { phrases: Phrase[]; done: boolean; start: Props['start']; content: Content }) {
  return (
    <Section
      icon="💬"
      host="ritsu"
      title="오늘의 표현"
      meta="일상·여행·드라마 속 회화 표현"
      done={done}
      actions={
        <button className={`btn ${done ? 'ghost' : ''}`} onClick={() => start(done ? todayPracticeSession(content, 'phrases') : phrasesSession(content))} disabled={!phrases.length}>
          {done ? '다시 연습' : '문장 연습하기'}
        </button>
      }
    >
      {phrases.map((ph) => (
        <div key={ph.id} className="phrase">
          <div className="phrase-scene">
            {SRC_LABEL[ph.src]} · {ph.scene}
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1, fontSize: 18 }}>
              <JP text={ph.jp} highlight={ph.expression} />
            </div>
            <Speak jtext={ph.jp} small />
          </div>
          <div className="phrase-ko">{ph.ko}</div>
        </div>
      ))}
    </Section>
  );
}

function GrammarSection({ grammar, done, start, content }: { grammar: Grammar[]; done: boolean; start: Props['start']; content: Content }) {
  const g = grammar[0];
  if (!g) return null;
  const ex = g.examples[0];
  return (
    <Section
      icon="🧩"
      host="minato"
      title="오늘의 문법"
      meta={`${g.level} · ${g.theme}`}
      done={done}
      actions={
        <button className={`btn ${done ? 'ghost' : 'violet'}`} onClick={() => start(done ? todayPracticeSession(content, 'grammar') : grammarSession(content))}>
          {done ? '다시 연습' : '문법 익히기'}
        </button>
      }
    >
      <div className="g-pattern">{g.pattern}</div>
      <div className="g-meaning">{g.meaning}</div>
      <div className="formation small">🔧 {g.formation}</div>
      <div className="row" style={{ alignItems: 'flex-start', marginTop: 12 }}>
        <div style={{ flex: 1, fontSize: 17 }}>
          <JP text={ex.jp} highlight={g.cloze.find((c) => c.ex === 0)?.target} />
          <div className="phrase-ko">{ex.ko}</div>
        </div>
        <Speak jtext={ex.jp} small />
      </div>
    </Section>
  );
}

function ReviewSection({ content, start, go }: { content: Content; start: Props['start']; go: Props['go'] }) {
  const p = useProgress();
  const d = today();
  const due = dueItems(p, d).filter((id) => content.byId.has(id));
  const upcoming = (days: number) =>
    Object.entries(p.items).filter(
      ([id, r]) => content.byId.has(id) && r.stage >= 0 && r.stage < STAGE_GRADUATED && r.due && r.due > d && r.due <= addDays(d, days),
    ).length;
  const missed = Object.values(p.items).some((r) => r.wrong > 0 && r.stage < STAGE_GRADUATED);
  return (
    <Section
      icon="🔁"
      host="saeko"
      title="복습"
      meta="틀린 문제 1·3·7·14·28일 간격"
      actions={
        <>
          <button className={`btn ${due.length ? 'accent' : 'ghost'}`} onClick={() => start(reviewSession(content))} disabled={!due.length}>
            {due.length ? `복습 시작 (${Math.min(due.length, REVIEW_BATCH)})` : '오늘 복습 끝'}
          </button>
          <button className="btn ghost" onClick={() => start(practiceSession(content))} disabled={!missed}>
            틀린 문제 연습
          </button>
        </>
      }
    >
      <div className="review-stats">
        <div className={`rs ${due.length ? 'hot' : ''}`}>
          <b>{due.length}</b>
          <span>오늘</span>
        </div>
        <div className="rs">
          <b>{upcoming(1)}</b>
          <span>내일</span>
        </div>
        <div className="rs">
          <b>{upcoming(7)}</b>
          <span>7일 내</span>
        </div>
      </div>
      <button className="link-btn" onClick={() => go('notes')}>
        복습 노트 전체 보기 →
      </button>
    </Section>
  );
}

function TalkSection({ situation, done, go }: { situation: Situation; done: boolean; go: Props['go'] }) {
  const [showKo, setShowKo] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const hasKey = inClaude || !!getApiKey();
  const open = (start: Parameters<typeof requestAi>[0]) => {
    requestAi(start);
    go('ai');
  };
  return (
    <Section
      icon="🗣️"
      host="ritsu"
      title="오늘의 회화"
      meta={`상황 · ${situation.theme}`}
      done={done}
      actions={
        <>
          <button className="btn" onClick={() => open({ mode: 'situation', id: situation.id })}>
            {hasKey ? '답하고 AI 채점 받기' : '답해 보기'}
          </button>
          <button className="btn ghost" onClick={() => open({ mode: 'roleplay' })}>
            🎭 롤플레이
          </button>
          <button className="btn ghost" onClick={() => open({ mode: 'compose' })}>
            ✍️ 작문
          </button>
        </>
      }
    >
      <div className="small muted">🎬 {situation.scene}</div>
      <div className="talk-line" onClick={() => setShowKo(!showKo)}>
        <div className="row">
          <span className="talk-who">{situation.partner}</span>
          <span className="spacer" />
          <Speak jtext={situation.line} small />
        </div>
        <JP text={situation.line} />
        <div className="phrase-ko">{showKo ? situation.line_ko : '탭하면 해석'}</div>
      </div>
      <div className="mission">
        <b>미션</b> {situation.task}
      </div>
      {showSample ? (
        <div className="sample">
          <span className="muted small">모범 답안 예시</span>
          <div className="row">
            <div className="jp" style={{ flex: 1 }}>
              {situation.sample}
            </div>
            <Speak text={situation.sample} small />
          </div>
        </div>
      ) : (
        <button className="link-btn" onClick={() => setShowSample(true)}>
          모범 답안 보기
        </button>
      )}
      {!hasKey && <div className="small muted">💡 설정에서 Anthropic API 키를 넣거나 claude.ai 버전에서 열면 Claude가 답을 채점해 줘요.</div>}
    </Section>
  );
}

function YouTubeSection({ grammar, words, situation }: { grammar?: Grammar; words: Word[]; situation: Situation | null }) {
  const pattern = grammar?.pattern.replace(/[～〜]/g, '').split(/[／/]/)[0].trim();
  const word = words[hash(today()) % Math.max(words.length, 1)];
  const links = [
    pattern && { t: `「${grammar!.pattern}」 문법 강의`, d: '유튜브 검색', url: ytSearch(`${pattern} 일본어 문법`) },
    situation && { t: `랭짱 채널에서 「${situation.theme}」 회화 찾기`, d: '알려줘 랭짱 채널 검색', url: langChanSearch(situation.theme) },
    word && { t: `「${word.word}」 실제로 어떻게 쓰나`, d: '일본어 사용 예 검색', url: ytSearch(`${word.word} 意味 使い方`) },
  ].filter(Boolean) as { t: string; d: string; url: string }[];
  return (
    <Section icon="📺" host="shizuku" title="오늘의 유튜브" meta="오늘 배운 걸 영상으로 한 번 더">
      <div className="yt-links">
        {links.map((l) => (
          <a key={l.url} className="yt-link" href={l.url} target="_blank" rel="noreferrer">
            <span className="yt-ico">▶</span>
            <span style={{ minWidth: 0 }}>
              <div className="t">{l.t}</div>
              <div className="d">{l.d}</div>
            </span>
          </a>
        ))}
      </div>
      <div className="small muted" style={{ margin: '14px 0 6px' }}>
        추천 채널
      </div>
      <div className="chips">
        {CHANNELS.map((ch) => (
          <a key={ch.name} className="chip" href={ch.url} target="_blank" rel="noreferrer" title={ch.desc} style={{ textDecoration: 'none' }}>
            {ch.name}
          </a>
        ))}
      </div>
    </Section>
  );
}

function DajareSection() {
  const base = diffDays(today(), '2026-01-01');
  const [offset, setOffset] = useState(0);
  const dj = dajareOf(base + offset);
  return (
    <Section
      icon="🤣"
      title="오늘의 아재개그"
      meta="おやじギャグ · 쓰는 건 자유, 책임은 본인"
      extra={
        <button className="btn ghost plain small" onClick={() => setOffset(offset + 1)}>
          하나 더
        </button>
      }
    >
      <div className="dajare">
        <div className="row" style={{ justifyContent: 'center' }}>
          <JP text={dj.jp} />
          <Speak jtext={dj.jp} small />
        </div>
        <div className="dajare-ko muted">“{dj.ko}”</div>
      </div>
      <div className="note dajare-explain">💡 {dj.explain}</div>
      <div className="risk">⚠️ {dj.risk}</div>
    </Section>
  );
}

function QuotesSection({ content, go }: { content: Content; go: Props['go'] }) {
  const groups = Object.keys(MEDIUM_GROUP) as MediumGroup[];
  return (
    <Section icon="🎌" host="shizuku" title="오늘의 명대사" meta="애니·드라마·소설 원작 대사로 배우는 일본어" className="span-2">
      {content.quotes.length === 0 ? (
        <div className="small muted">명대사를 준비 중이에요.</div>
      ) : (
        <div className="quote-tiles">
          {groups.map((g) => {
            const q = todaysQuote(content, g);
            return (
              <button key={g} className="quote-tile" onClick={() => go(`quotes-${g}`)}>
                <div className="qt-cat">
                  {MEDIUM_GROUP[g].icon} {MEDIUM_GROUP[g].label}
                </div>
                {q ? (
                  <>
                    <div className="qt-line jp">{plain(q.line)}</div>
                    <div className="qt-src">
                      원작 출처 · <b>{q.work_ko}</b>
                    </div>
                  </>
                ) : (
                  <div className="qt-src">준비 중</div>
                )}
                <div className="qt-more">더 보기 →</div>
              </button>
            );
          })}
        </div>
      )}
    </Section>
  );
}
