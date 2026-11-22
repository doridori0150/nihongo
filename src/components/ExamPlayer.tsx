import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Content } from '../lib/content';
import type { QuestionExplain } from '../lib/ai';
import { getApiKey } from '../lib/aiKey';
import { inClaude } from '../lib/runtime';
import { today } from '../lib/date';
import { type ExamQ, PASS_PCT, SECTIONS, buildDailyExam, examGrade, questionText } from '../lib/exam';
import { sfx } from '../lib/speech';
import { type ExamLevel, addAccuracy, addXp, bumpEv, markForReview, recordExam } from '../lib/store';
import { askConfirm } from './confirm';

interface Props {
  content: Content;
  level: ExamLevel;
  onExit: () => void;
}

/** JLPT-style daily exam: answer everything, then grade and read the explanations. */
export function ExamPlayer({ content, level, onExit }: Props) {
  const qs = useMemo(() => buildDailyExam(content, level, today()), [content, level]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => qs.map(() => null));
  const [result, setResult] = useState<null | { correct: number; xp: number }>(null);
  const q = qs[idx];

  const pick = useCallback(
    (i: number) => {
      if (result) return;
      sfx.correct();
      setAnswers((a) => a.map((v, k) => (k === idx ? i : v)));
    },
    [idx, result],
  );

  const submit = useCallback(() => {
    const correct = qs.filter((x, i) => answers[i] === x.answer).length;
    const total = qs.length;
    const first = recordExam(level, correct, total);
    const base = correct * 2 + 5;
    const xp = first ? base : Math.ceil(base / 2);
    addXp(xp);
    addAccuracy(correct, total - correct);
    bumpEv('exam');
    if (total && correct / total >= 0.8) bumpEv('examGood');
    qs.forEach((x, i) => answers[i] !== x.answer && markForReview(x.itemId));
    sfx.done();
    setResult({ correct, xp });
  }, [qs, answers, level]);

  const next = useCallback(() => {
    if (idx + 1 < qs.length) return setIdx(idx + 1);
    const blank = answers.filter((a) => a === null).length;
    if (!blank) return submit();
    void askConfirm({ title: `${blank}문제를 안 풀었어요`, body: '그대로 채점할까요?', ok: '채점하기', cancel: '돌아가기' }).then((ok) => ok && submit());
  }, [idx, qs.length, answers, submit]);

  useEffect(() => {
    if (result) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('.confirm, [role="dialog"]')) return;
      if (/^[1-4]$/.test(e.key)) pick(Number(e.key) - 1);
      else if (e.key === 'Enter') {
        // keep Enter from also pressing whatever button gets focus next (the result screen)
        e.preventDefault();
        if (answers[idx] !== null) next();
      }
      else if (e.key === 'ArrowLeft' && idx > 0) setIdx(idx - 1);
      else if (e.key === 'ArrowRight' && idx + 1 < qs.length) setIdx(idx + 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pick, next, idx, answers, qs.length, result]);

  const exit = () => {
    if (result) return onExit();
    void askConfirm({ title: '시험을 그만둘까요?', body: '푼 답은 저장되지 않아요.', ok: '그만두기', cancel: '계속 풀기', danger: true }).then((ok) => ok && onExit());
  };

  if (!qs.length)
    return (
      <div className="lesson exam">
        <div className="lesson-body">
          <div className="empty">이 등급의 문제를 준비 중이에요.</div>
          <button className="btn block" onClick={onExit}>
            돌아가기
          </button>
        </div>
      </div>
    );

  if (result) return <ExamResult qs={qs} answers={answers} level={level} correct={result.correct} xp={result.xp} onExit={onExit} />;

  const sec = SECTIONS[q.type];
  const firstOfSection = idx === 0 || qs[idx - 1].type !== q.type;
  return (
    <div className="lesson exam">
      <div className="lesson-top">
        <button className="icon-btn" onClick={exit} aria-label="닫기">
          ✕
        </button>
        <div className="exam-dots" aria-label={`${idx + 1} / ${qs.length}`}>
          {qs.map((_, i) => (
            <button key={i} className={`exam-dot ${i === idx ? 'on' : ''} ${answers[i] !== null ? 'done' : ''}`} onClick={() => setIdx(i)} aria-label={`${i + 1}번`}>
              {i + 1}
            </button>
          ))}
        </div>
        <span className={`chip ${level.toLowerCase()}`}>{level}</span>
      </div>
      <div className="lesson-body exam-sheet" key={idx}>
        <div className={`exam-section ${firstOfSection ? '' : 'quiet'}`}>
          <b>問題{sec.no}</b> <span className="jp">{sec.jp}</span>
          <div className="small muted">{sec.ko}</div>
        </div>
        <div className="exam-q">
          <span className="exam-no">{idx + 1}</span>
          <Stem q={q} />
        </div>
        <div className="exam-options">
          {q.options.map((o, i) => (
            <button key={o + i} className={`exam-opt ${answers[idx] === i ? 'on' : ''}`} onClick={() => pick(i)} aria-pressed={answers[idx] === i}>
              <span className="exam-opt-no">{i + 1}</span>
              <span className="jp">{o}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="lesson-foot">
        <div className="lesson-foot-inner row" style={{ gap: 8 }}>
          <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            ← 이전
          </button>
          <button className="btn block" disabled={answers[idx] === null} onClick={next}>
            {idx + 1 < qs.length ? '다음 문제' : '채점하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stem({ q }: { q: ExamQ }) {
  if (q.type === 'order') {
    const { count, star } = q.slots!;
    return (
      <div className="exam-stem jp">
        {q.before}
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`exam-slot ${i === star ? 'star' : ''}`}>
            {i === star ? '★' : ''}
          </span>
        ))}
        {q.after}
      </div>
    );
  }
  return (
    <div className="exam-stem jp">
      {q.before}
      {q.type === 'kanji' ? <u className="exam-mark">{q.mark}</u> : <span className="exam-blank">（　　）</span>}
      {q.after}
    </div>
  );
}

function ExamResult({
  qs,
  answers,
  level,
  correct,
  xp,
  onExit,
}: {
  qs: ExamQ[];
  answers: (number | null)[];
  level: ExamLevel;
  correct: number;
  xp: number;
  onExit: () => void;
}) {
  const pct = Math.round((correct / qs.length) * 100);
  const grade = examGrade(pct);
  const [open, setOpen] = useState<number | null>(() => {
    const firstWrong = qs.findIndex((x, i) => answers[i] !== x.answer);
    return firstWrong >= 0 ? firstWrong : null;
  });
  // the Anthropic SDK only loads when an explanation is asked for
  const [ai] = useState(() => inClaude || !!getApiKey());
  return (
    <div className="lesson exam">
      <div className="lesson-body">
        <div className="exam-result">
          <div className={`exam-stamp g-${grade}`}>{grade}</div>
          <div className="title">
            {level} 데일리 시험 · {correct} / {qs.length}
          </div>
          <div className={`small ${pct >= PASS_PCT ? 'ok-text' : 'bad-text'}`}>
            {pct}점 · 합격 라인 {PASS_PCT}점 {pct >= PASS_PCT ? '통과!' : '아쉬워요'}
          </div>
          <div className="stat-cards">
            <div className="stat-card" style={{ ['--c' as string]: 'var(--yellow)' }}>
              <div className="k">획득 XP</div>
              <div className="v">⚡ {xp}</div>
            </div>
            <div className="stat-card" style={{ ['--c' as string]: 'var(--green)' }}>
              <div className="k">정답</div>
              <div className="v">🎯 {correct}</div>
            </div>
          </div>
          {correct < qs.length && <div className="small muted">틀린 문제의 단어·문법은 복습 일정에 넣었어요.</div>}
        </div>
        <div className="exam-review">
          {qs.map((x, i) => (
            <ReviewItem key={i} no={i + 1} q={x} chosen={answers[i]} open={open === i} onToggle={() => setOpen(open === i ? null : i)} ai={ai} />
          ))}
        </div>
      </div>
      <div className="lesson-foot">
        <div className="lesson-foot-inner">
          <button className="btn block" onClick={onExit}>
            부실로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ no, q, chosen, open, onToggle, ai }: { no: number; q: ExamQ; chosen: number | null; open: boolean; onToggle: () => void; ai: boolean }) {
  const ok = chosen === q.answer;
  const [more, setMore] = useState<QuestionExplain | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const askAi = async () => {
    setBusy(true);
    setErr('');
    try {
      const { explainQuestion } = await import('../lib/ai');
      setMore(await explainQuestion({ section: SECTIONS[q.type].jp, question: questionText(q), options: q.options, answer: q.answer, chosen }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`exam-rv ${ok ? 'ok' : 'bad'} ${open ? 'open' : ''}`}>
      <button className="exam-rv-head" onClick={onToggle} aria-expanded={open}>
        <span className="exam-rv-mark">{ok ? '○' : '×'}</span>
        <span className="exam-rv-no">{no}</span>
        <span className="jp exam-rv-q">{questionText(q)}</span>
        <span className="exam-rv-caret">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="exam-rv-body">
          <div className="exam-rv-ans">
            정답 <b className="jp">{q.answer + 1}. {q.options[q.answer]}</b>
            {!ok && (
              <span className="bad-text">
                {' '}
                · 내 답 {chosen === null ? '없음' : <span className="jp">{chosen + 1}. {q.options[chosen]}</span>}
              </span>
            )}
          </div>
          <div className="exam-rv-head2 jp">{q.explain.head}</div>
          {q.explain.lines.map((l, i) => (
            <p key={i} className="small">
              {l}
            </p>
          ))}
          <div className="exam-rv-ex">
            <div className="jp">{q.explain.sentence}</div>
            <div className="small muted">{q.explain.sentenceKo}</div>
          </div>
          {ai &&
            (more ? (
              <div className="exam-ai">
                <div className="exam-ai-head">🤖 AI 선생님 해설</div>
                <p className="small">{more.why_correct}</p>
                {more.wrong_options.map((w) => (
                  <p key={w.option} className="small">
                    <span className="jp">✗ {w.option}</span> — {w.why}
                  </p>
                ))}
                {more.tip && <p className="small">💡 {more.tip}</p>}
              </div>
            ) : (
              <button className="btn ghost small" onClick={askAi} disabled={busy}>
                {busy ? '해설 쓰는 중…' : '🤖 AI 선생님 해설 (오답 이유까지)'}
              </button>
            ))}
          {err && <div className="small bad-text">{err}</div>}
        </div>
      )}
    </div>
  );
}
