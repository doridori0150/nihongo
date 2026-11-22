import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type Achievement, achievements } from '../lib/achievements';
import { CAST, type MemberId } from '../lib/cast';
import type { Content } from '../lib/content';
import { diffDays, today } from '../lib/date';
import { SECTIONS, EXAM_SIZE } from '../lib/exam';
import { dajareOf } from '../lib/fun';
import { plain } from '../lib/jtext';
import { ALL_CLEAR, ALL_CLEAR_XP, MISSION_XP, type Mission, claim, claimed, missionsFor } from '../lib/missions';
import { type SpotKey, SPOTS } from '../lib/scene';
import { reviewSession, type Session } from '../lib/sessions';
import { MONTH_KO, nextEpisode, useStoryIndex } from '../lib/story';
import { type ExamLevel, deckDue, dueItems, useProgress } from '../lib/store';
import { todaysQuote } from '../pages/Quotes';
import { Avatar } from './Avatar';
import { JP, Speak } from './JP';

export interface PanelActions {
  content: Content;
  go: (route: string) => void;
  play: (id: string) => void;
  start: (s: Session | null) => void;
  startExam: (level: ExamLevel) => void;
  toast: (msg: string) => void;
}

/** Host lines shown at the top of each panel (Japanese with furigana, Korean below). */
const HOST_LINE: Record<SpotKey, { jp: string; ko: string }> = {
  desk: { jp: '今日{きょう}の|模試{もし}、|始{はじ}めるか？|時間{じかん}は|気{き}にするな。', ko: '오늘 모의고사 시작할래? 시간은 신경 쓰지 마.' },
  whiteboard: { jp: '今日{きょう}の|ミッション、|書{か}いておいた…', ko: '오늘의 미션, 적어 뒀어…' },
  figures: { jp: 'センパイの|トロフィー、|まだ|スカスカ〜♡', ko: '선배 트로피, 아직 텅텅 비었네~♡' },
  bookshelf: { jp: '自習{じしゅう}なら|ここだ。|サボるなよ。', ko: '자습은 여기서 해. 땡땡이치지 말고.' },
  sofa: { jp: '…|話{はな}す？|いいよ。', ko: '…얘기할래? 좋아.' },
  posters: { jp: '続{つづ}き、|一緒{いっしょ}に|見{み}よう…', ko: '다음 이야기, 같이 보자…' },
  fridge: { jp: 'ジュース|取{と}るなら|ギャグも|一個{いっこ}ね〜', ko: '주스 꺼낼 거면 개그도 하나 가져가~' },
  window: { jp: '今日{きょう}の|名台詞{めいせりふ}…|窓{まど}の|外{そと}みたいに|きれい…', ko: '오늘의 명대사… 창밖처럼 예뻐…' },
};

export function RoomPanel({ spot, actions, onClose }: { spot: SpotKey; actions: PanelActions; onClose: () => void }) {
  const s = SPOTS.find((x) => x.key === spot)!;
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  // portal: the room page is its own stacking context below the top bar
  return createPortal(
    <div className="rp-backdrop" onClick={onClose}>
      <aside className="rp" role="dialog" aria-label={s.label} onClick={(e) => e.stopPropagation()}>
        <header className="rp-head">
          <span className="rp-icon">{s.icon}</span>
          <h2>{s.label}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>
        <HostLine id={s.host} line={HOST_LINE[spot]} />
        <div className="rp-body">
          {spot === 'desk' && <ExamPanel actions={actions} />}
          {spot === 'whiteboard' && <MissionPanel actions={actions} />}
          {spot === 'figures' && <AchievementPanel />}
          {spot === 'bookshelf' && <ShelfPanel actions={actions} />}
          {spot === 'sofa' && <SofaPanel actions={actions} />}
          {spot === 'posters' && <StoryPanel actions={actions} />}
          {spot === 'fridge' && <FridgePanel />}
          {spot === 'window' && <WindowPanel actions={actions} />}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function HostLine({ id, line }: { id: MemberId; line: { jp: string; ko: string } }) {
  const [ko, setKo] = useState(false);
  return (
    <button className="rp-host" onClick={() => setKo(!ko)}>
      <Avatar id={id} size={44} title />
      <span className="rp-host-body">
        <span className="rp-host-name" style={{ color: CAST[id].color }}>
          {CAST[id].name}
        </span>
        <span className="rp-host-line">
          <JP text={line.jp} />
        </span>
        <span className="rp-host-ko">{ko ? line.ko : '탭하면 해석'}</span>
      </span>
    </button>
  );
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rp-sec">
      <div className="rp-sec-head">
        <h3>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

// ───────── desk: JLPT daily exam ─────────

const LEVELS: { lv: ExamLevel; ko: string }[] = [
  { lv: 'N3', ko: '일상 회화 수준' },
  { lv: 'N2', ko: '뉴스·드라마 대부분' },
  { lv: 'N1', ko: '논설·소설까지' },
];

function ExamPanel({ actions }: { actions: PanelActions }) {
  const p = useProgress();
  const d = today();
  const pref: ExamLevel = p.settings.level === 'N1' ? 'N1' : 'N2';
  const [lv, setLv] = useState<ExamLevel>(pref);
  const best = p.exams?.[d];
  return (
    <>
      <Section title="등급 선택">
        <div className="rp-levels" role="radiogroup" aria-label="등급">
          {LEVELS.map((x) => {
            const b = best?.[x.lv];
            return (
              <button key={x.lv} role="radio" aria-checked={lv === x.lv} className={`rp-level ${lv === x.lv ? 'on' : ''}`} onClick={() => setLv(x.lv)}>
                <span className={`rp-level-name ${x.lv.toLowerCase()}`}>{x.lv}</span>
                <span className="rp-level-ko">{x.ko}</span>
                <span className="rp-level-best">{b ? `오늘 ${b.score}/${b.total}` : '오늘 미응시'}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title={`오늘의 ${lv} 모의고사 · ${EXAM_SIZE}문항`}>
        <ul className="rp-list small">
          {Object.values(SECTIONS).map((s) => (
            <li key={s.no}>
              問題{s.no} · {s.ko}
            </li>
          ))}
        </ul>
        <div className="small muted">문제는 하루 동안 같아요. 다 풀고 채점한 뒤 문제마다 해설을 볼 수 있어요. 첫 응시는 XP 전부, 다시 풀면 절반.</div>
      </Section>
      <button className="btn block pixel" onClick={() => actions.startExam(lv)}>
        ▶ {lv} 시험 시작
      </button>
    </>
  );
}

// ───────── whiteboard: today's missions ─────────

function MissionPanel({ actions }: { actions: PanelActions }) {
  const p = useProgress();
  const d = today();
  const ms = missionsFor(p, d);
  const done = ms.filter((m) => claimed(p, d, m.id)).length;
  const goTo = (m: Mission) => {
    if (m.go === 'exam') return actions.startExam(p.settings.level === 'N1' ? 'N1' : 'N2');
    if (m.go === 'review') return actions.start(reviewSession(actions.content));
    actions.go(m.go === 'cards' ? 'study' : m.go);
  };
  return (
    <>
      <Section title="오늘의 미션" right={<span className="rp-count">{done} / {ms.length}</span>}>
        <div className="rp-missions">
          {ms.map((m) => {
            const got = claimed(p, d, m.id);
            const ready = m.value >= m.goal;
            return (
              <div key={m.id} className={`rp-mission ${got ? 'got' : ready ? 'ready' : ''}`}>
                <span className="rp-m-icon">{m.icon}</span>
                <div className="rp-m-body">
                  <div className="rp-m-title">{m.title}</div>
                  <div className="pbar">
                    <i style={{ width: `${(m.value / m.goal) * 100}%` }} />
                  </div>
                  <div className="small muted">
                    {m.value} / {m.goal} · 보상 {MISSION_XP} XP
                  </div>
                </div>
                {got ? (
                  <span className="rp-m-done">받음</span>
                ) : ready ? (
                  <button
                    className="btn small pixel"
                    onClick={() => {
                      const xp = claim(m, d);
                      if (xp) actions.toast(xp > MISSION_XP ? `🎉 올클리어! +${xp} XP` : `+${xp} XP`);
                    }}
                  >
                    받기
                  </button>
                ) : (
                  <button className="btn small ghost" onClick={() => goTo(m)}>
                    하러 가기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>
      <div className={`rp-allclear ${claimed(p, d, ALL_CLEAR) ? 'got' : ''}`}>
        {claimed(p, d, ALL_CLEAR) ? '✅ 오늘 올클리어! 내일 또 만나요' : `🎁 미션을 전부 받으면 보너스 +${ALL_CLEAR_XP} XP`}
      </div>
    </>
  );
}

// ───────── figure case: achievements ─────────

function AchievementPanel() {
  const p = useProgress();
  const list = achievements(p);
  const got = list.filter((a) => a.at).length;
  const sorted = [...list].sort((a, b) => Number(!!b.at) - Number(!!a.at) || b.value / b.goal - a.value / a.goal);
  return (
    <Section title="업적" right={<span className="rp-count">{got} / {list.length}</span>}>
      <div className="rp-achs">
        {sorted.map((a) => (
          <AchCard key={a.id} a={a} />
        ))}
      </div>
    </Section>
  );
}

function AchCard({ a }: { a: Achievement }) {
  const on = !!a.at;
  return (
    <div className={`rp-ach ${on ? 'on' : ''}`} title={a.desc}>
      <span className="rp-ach-icon">{on ? a.icon : '❔'}</span>
      <span className="rp-ach-title">{on ? a.title : '???'}</span>
      <span className="rp-ach-desc">{a.desc}</span>
      {on ? (
        <span className="rp-ach-date">{new Date(a.at!).toLocaleDateString('ko-KR')}</span>
      ) : (
        <span className="pbar thin">
          <i style={{ width: `${(a.value / a.goal) * 100}%` }} />
        </span>
      )}
    </div>
  );
}

// ───────── bookshelf: study & library ─────────

function ShelfPanel({ actions }: { actions: PanelActions }) {
  const p = useProgress();
  const due = dueItems(p).filter((id) => actions.content.byId.has(id)).length;
  const cards = deckDue(p).length;
  const plan = p.days[today()];
  const tiles = [
    { icon: '✏️', t: '오늘의 자습', d: plan?.done.words ? '단어 완료 · 문법·표현 계속' : `단어 ${plan?.words.length ?? p.settings.newPerDay}개 · 문법 · 표현`, on: () => actions.go('study') },
    { icon: '🔁', t: '복습', d: due ? `${due}개 기다리는 중` : '오늘 복습 끝', on: () => actions.start(reviewSession(actions.content)), off: !due },
    { icon: '🃏', t: '암기 카드', d: cards ? `오늘 ${cards}장` : '카드 덱 보기', on: () => actions.go('study') },
    { icon: '📚', t: '도서관', d: '단어장 검색·명대사·유튜브', on: () => actions.go('library') },
  ];
  return (
    <div className="rp-tiles">
      {tiles.map((x) => (
        <button key={x.t} className="rp-tile" onClick={x.on} disabled={x.off}>
          <span className="rp-tile-icon">{x.icon}</span>
          <span className="rp-tile-t">{x.t}</span>
          <span className="rp-tile-d">{x.d}</span>
        </button>
      ))}
    </div>
  );
}

// ───────── sofa: talk ─────────

function SofaPanel({ actions }: { actions: PanelActions }) {
  return (
    <div className="rp-tiles">
      <button className="rp-tile" onClick={() => actions.go('talk')}>
        <span className="rp-tile-icon">☕</span>
        <span className="rp-tile-t">부원과 잡담</span>
        <span className="rp-tile-d">부원이 일본어로 말을 걸어요</span>
      </button>
      <button className="rp-tile" onClick={() => actions.go('talk-practice')}>
        <span className="rp-tile-icon">🎭</span>
        <span className="rp-tile-t">회화 연습</span>
        <span className="rp-tile-d">상황 대답·작문·롤플레이 채점</span>
      </button>
    </div>
  );
}

// ───────── posters: story ─────────

function StoryPanel({ actions }: { actions: PanelActions }) {
  const p = useProgress();
  const list = useStoryIndex();
  const next = list ? nextEpisode(list, p) : undefined;
  const resuming = !!next && p.story?.pos?.ep === next.id;
  const done = Object.keys(p.story?.done ?? {}).length;
  return (
    <>
      {next ? (
        <Section title={resuming ? '이어서 보기' : '다음 화'}>
          <div className="rp-ep">
            <div className="small muted">
              {next.year}학년 {MONTH_KO[next.month]} · 第{next.no}話
            </div>
            <div className="rp-ep-title">
              <JP text={next.title} />
            </div>
          </div>
          <button className="btn block pixel" onClick={() => actions.play(next.id)}>
            ▶ {resuming ? '이어하기' : '재생'}
          </button>
        </Section>
      ) : (
        <div className="small muted">{list ? '모든 화를 봤어요! 🎓' : '불러오는 중…'}</div>
      )}
      <button className="btn ghost block" onClick={() => actions.go('story')}>
        전체 회차 보기 ({done} / {list?.length ?? '…'}화)
      </button>
    </>
  );
}

// ───────── fridge: pun of the day ─────────

function FridgePanel() {
  const [n, setN] = useState(0);
  const dj = dajareOf(diffDays(today(), '2026-01-01') + n);
  return (
    <Section title="오늘의 아재개그" right={<button className="btn small ghost" onClick={() => setN(n + 1)}>하나 더</button>}>
      <div className="row" style={{ gap: 6, fontSize: 20 }}>
        <JP text={dj.jp} />
        <Speak jtext={dj.jp} small />
      </div>
      <div className="small muted">“{dj.ko}”</div>
    </Section>
  );
}

// ───────── window: quote of the day ─────────

function WindowPanel({ actions }: { actions: PanelActions }) {
  const quote = todaysQuote(actions.content, 'anime');
  if (!quote) return <div className="small muted">명대사를 준비 중이에요.</div>;
  return (
    <Section title="오늘의 명대사">
      <div className="jp rp-quote">{plain(quote.line)}</div>
      <div className="small muted">
        {quote.ko} — {quote.work_ko}
      </div>
      <button className="btn ghost block" onClick={() => actions.go('quotes-anime')}>
        명대사 더 보기
      </button>
    </Section>
  );
}
