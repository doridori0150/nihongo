import { useEffect } from 'react';
import { Ring } from '../components/common';
import { type Content, type Grammar, isWord } from '../lib/content';
import { ensureTodayPlan, poolStats } from '../lib/daily';
import { formatKo, today } from '../lib/date';
import {
  extraWordsSession,
  grammarSession,
  phrasesSession,
  practiceSession,
  reviewSession,
  REVIEW_BATCH,
  type Session,
  wordsSession,
} from '../lib/sessions';
import { STAGE_GRADUATED, dueItems, streak, useProgress, xpOn } from '../lib/store';

interface Props {
  content: Content;
  start: (s: Session | null) => void;
  go: (route: string) => void;
}

export function Home({ content, start, go }: Props) {
  const p = useProgress();
  const d = today();
  useEffect(() => {
    ensureTodayPlan(content);
  }, [content, p.settings.newPerDay, p.settings.level, d]);

  const plan = p.days[d];
  const due = dueItems(p).filter((id) => content.byId.has(id));
  const s = streak(p);
  const stats = poolStats(content);
  const reviewing = Object.values(p.items).filter((r) => r.stage >= 0 && r.stage < STAGE_GRADUATED).length;
  const graduated = Object.values(p.items).filter((r) => r.stage >= STAGE_GRADUATED).length;

  if (!plan) return null;

  const words = plan.words.map((id) => content.byId.get(id)).filter(Boolean);
  const grammar = content.byId.get(plan.grammar[0] ?? '') as Grammar | undefined;
  const reviewDone = !!plan.done.review || due.length === 0;

  const nodes = [
    {
      key: 'words',
      icon: '📖',
      label: '오늘의 단어',
      sub: plan.done.words
        ? words.slice(0, 4).map((w) => (w && isWord(w) ? w.word : '')).join(' · ') + (words.length > 4 ? ` 외 ${words.length - 4}개` : '')
        : `새 단어 ${words.length}개 · N2 ${words.filter((w) => w?.level === 'N2').length} / N1 ${words.filter((w) => w?.level === 'N1').length}`,
      done: !!plan.done.words,
      color: '',
      run: () => start(wordsSession(content)),
      hidden: words.length === 0,
    },
    {
      key: 'grammar',
      icon: '🧩',
      label: '오늘의 문법',
      sub: plan.done.grammar && grammar ? `${grammar.pattern} — ${grammar.meaning}` : grammar ? `${grammar.level} 문법 1개` : '',
      done: !!plan.done.grammar,
      color: 'purple',
      run: () => start(grammarSession(content)),
      hidden: !grammar,
    },
    {
      key: 'phrases',
      icon: '💬',
      label: '오늘의 문장',
      sub: '드라마·만화·소설·일상 속 표현 3개',
      done: !!plan.done.phrases,
      color: 'blue',
      run: () => start(phrasesSession(content)),
      hidden: plan.phrases.length === 0,
    },
    {
      key: 'review',
      icon: '🔁',
      label: '복습',
      sub: due.length
        ? `오늘 복습할 항목 ${due.length}개${due.length > REVIEW_BATCH ? ` (한 번에 ${REVIEW_BATCH}개씩)` : ''}`
        : '오늘 복습할 항목 없음',
      done: reviewDone,
      color: '',
      badge: due.length || undefined,
      run: () => (due.length ? start(reviewSession(content)) : go('notes')),
      hidden: false,
    },
    {
      key: 'ai',
      icon: '🤖',
      label: 'AI 회화',
      sub: '상황 대답 · 작문 · 롤플레이 (Claude 채점)',
      done: !!plan.done.ai,
      color: 'purple',
      run: () => go('ai'),
      hidden: false,
    },
  ].filter((n) => !n.hidden);

  const core = nodes.filter((n) => n.key !== 'ai');
  const doneCount = core.filter((n) => n.done).length;
  const current = nodes.find((n) => !n.done)?.key;
  const offsets = [0, 46, 0, -46, 0];

  return (
    <div className="page">
      <div className="hero">
        <Ring value={doneCount / core.length} size={64}>
          {doneCount}/{core.length}
        </Ring>
        <div>
          <div className="t">{doneCount === core.length ? '오늘 목표 달성! 🎉' : `${formatKo(d)} 학습`}</div>
          <div className="s">
            {s.days > 0 ? `🔥 ${s.days}일 연속${s.todayDone ? '' : ' — 오늘도 이어가요!'}` : '오늘부터 연속 학습을 시작해요'} · 오늘 ⚡{xpOn(p, d)} XP
          </div>
        </div>
      </div>

      <div className="path">
        {nodes.map((n, i) => (
          <div className="node-wrap" key={n.key} style={{ transform: `translateX(${offsets[i % offsets.length]}px)` }}>
            {current === n.key && <div className="start-bubble">시작!</div>}
            <button
              className={`node ${n.done ? 'done' : n.color} ${current === n.key ? 'current' : ''}`}
              onClick={n.run}
              aria-label={n.label}
            >
              {n.done ? '✔️' : n.icon}
              {n.badge && <span className="badge">{n.badge}</span>}
            </button>
            <div className="node-label">{n.label}</div>
            <div className="node-sub">{n.sub}</div>
          </div>
        ))}
      </div>

      <div className="h2">더 하기</div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn ghost small" onClick={() => start(extraWordsSession(content))} disabled={stats.words.seen >= stats.words.total}>
          ➕ 새 단어 5개 더
        </button>
        <button className="btn ghost small" onClick={() => start(practiceSession(content))} disabled={!Object.values(p.items).some((r) => r.wrong > 0)}>
          🎯 틀린 문제 연습
        </button>
      </div>

      <div className="h2">내 학습 현황</div>
      <div className="card">
        <Progress label="단어" {...stats.words} color="var(--green)" />
        <Progress label="문법" {...stats.grammar} color="var(--purple)" />
        <Progress label="문장" {...stats.phrases} color="var(--blue)" />
        <div className="row small muted" style={{ marginTop: 10 }}>
          <span>🔁 복습 중 {reviewing}개</span>
          <span>🎓 졸업 {graduated}개</span>
        </div>
      </div>
    </div>
  );
}

function Progress({ label, seen, total, color }: { label: string; seen: number; total: number; color: string }) {
  const pct = total ? (seen / total) * 100 : 0;
  return (
    <div style={{ margin: '6px 0' }}>
      <div className="row small" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 900 }}>{label}</span>
        <span className="muted">
          {seen} / {total}
        </span>
      </div>
      <div className="bar" style={{ height: 10, marginTop: 4 }}>
        <div style={{ width: `${pct}%`, background: color, minWidth: pct ? 10 : 0 }} />
      </div>
    </div>
  );
}
