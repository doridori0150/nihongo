import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Content } from '../lib/content';
import { itemMeaning, itemTitle, isWord } from '../lib/content';
import { kana } from '../lib/jtext';
import { type Exercise, type Graded, answerText, shuffle } from '../lib/quiz';
import { sfx, speak } from '../lib/speech';
import { type ItemResult, useProgress } from '../lib/store';
import { type Answer, AssembleView, ChoiceView, ClozeView, isCorrect } from './exercises';
import { ItemCard } from './ItemCard';

export interface LessonResult {
  items: ItemResult[];
  correct: number;
  wrong: number;
  misses: string[];
}

interface Props {
  title: string;
  exercises: Exercise[];
  content: Content;
  /** Called once when the last exercise is done; returns XP earned to show. */
  onFinish: (r: LessonResult) => number;
  onExit: () => void;
}

const PRAISE = ['훌륭해요!', '정답이에요!', '완벽해요!', 'すごい！', 'その通り！', '좋아요!'];

function retryCopy(ex: Graded): Graded {
  if (ex.kind === 'assemble') return { ...ex, tiles: shuffle(ex.tiles) };
  if (ex.kind === 'cloze') {
    const correct = ex.options[ex.answer];
    const options = shuffle(ex.options);
    return { ...ex, options, answer: options.indexOf(correct) };
  }
  const correct = ex.options[ex.answer];
  const options = shuffle(ex.options);
  return { ...ex, options, answer: options.indexOf(correct) };
}

export function Lesson({ title, exercises, content, onFinish, onExit }: Props) {
  const progress = useProgress();
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState<Answer>(null);
  const [checked, setChecked] = useState<null | { ok: boolean; praise: string }>(null);
  const [done, setDone] = useState(0);
  const [combo, setCombo] = useState(0);
  const failed = useRef(new Set<string>());
  const stats = useRef({ correct: 0, wrong: 0 });
  const [finished, setFinished] = useState<null | { xp: number; result: LessonResult }>(null);
  const total = exercises.length;
  const ex = queue[idx];

  const itemIds = useMemo(() => {
    const ids: string[] = [];
    for (const e of exercises) {
      const id = e.kind === 'intro' ? e.item.id : e.itemId;
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [exercises]);

  const finish = useCallback(() => {
    const result: LessonResult = {
      items: itemIds.map((id) => ({ id, correct: !failed.current.has(id) })),
      correct: stats.current.correct,
      wrong: stats.current.wrong,
      misses: itemIds.filter((id) => failed.current.has(id)),
    };
    const xp = onFinish(result);
    sfx.done();
    setFinished({ xp, result });
  }, [itemIds, onFinish]);

  const next = useCallback(() => {
    setValue(null);
    setChecked(null);
    if (idx + 1 >= queue.length) finish();
    else setIdx(idx + 1);
  }, [idx, queue.length, finish]);

  const check = useCallback(() => {
    if (!ex || ex.kind === 'intro' || value === null || checked) return;
    const ok = isCorrect(ex, value);
    if (ok) {
      sfx.correct();
      stats.current.correct++;
      setDone((d) => d + 1);
      setCombo((c) => c + 1);
    } else {
      sfx.wrong();
      stats.current.wrong++;
      failed.current.add(ex.itemId);
      setCombo(0);
      setQueue((q) => [...q, retryCopy(ex)]);
    }
    if (progress.settings.sound && ex.kind !== 'choice') setTimeout(() => speak(kana(ex.jp)), 350);
    setChecked({ ok, praise: PRAISE[Math.floor(Math.random() * PRAISE.length)] });
  }, [ex, value, checked, progress.settings.sound]);

  const advanceIntro = useCallback(() => {
    setDone((d) => d + 1);
    next();
  }, [next]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (finished) return onExit();
      if (!ex) return;
      if (ex.kind === 'intro') return advanceIntro();
      if (checked) return next();
      check();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [ex, checked, finished, next, check, advanceIntro, onExit]);

  const exit = () => {
    if (finished || confirm('학습을 그만둘까요? 이번 레슨 진행 상황은 저장되지 않아요.')) onExit();
  };

  if (finished) return <Complete title={title} xp={finished.xp} result={finished.result} content={content} onExit={onExit} />;
  if (!ex) return null;

  const pct = Math.max(4, Math.round((done / total) * 100));
  const item = ex.kind === 'intro' ? ex.item : content.byId.get(ex.itemId);

  return (
    <div className={`lesson ${progress.settings.furigana ? '' : 'furi-off'}`}>
      <div className="lesson-top">
        <button className="icon-btn" onClick={exit} aria-label="닫기">
          ✕
        </button>
        <div className="bar">
          <div style={{ width: `${pct}%` }} />
        </div>
        {combo >= 3 && <span className="combo">🔥 {combo}</span>}
      </div>
      <div className="lesson-body" key={idx}>
        {ex.kind === 'intro' && (
          <>
            <div className="ex-kicker">✨ 새로운 {ex.item.id.startsWith('w:') ? '단어' : ex.item.id.startsWith('g:') ? '문법' : '표현'}</div>
            <div style={{ marginTop: 8 }}>
              <ItemCard item={ex.item} />
            </div>
          </>
        )}
        {ex.kind === 'choice' && <ChoiceView ex={ex} value={value} checked={!!checked} onChange={setValue} />}
        {ex.kind === 'cloze' && <ClozeView ex={ex} value={value} checked={!!checked} onChange={setValue} />}
        {ex.kind === 'assemble' && <AssembleView ex={ex} value={value} checked={!!checked} onChange={setValue} />}
      </div>

      {ex.kind === 'intro' ? (
        <div className="lesson-foot">
          <div className="lesson-foot-inner">
            <button className="btn block" onClick={advanceIntro}>
              다음
            </button>
          </div>
        </div>
      ) : checked ? (
        <div className={`lesson-foot feedback ${checked.ok ? 'ok' : 'bad'}`}>
          <div className="feedback-msg">
            <div className="head">{checked.ok ? `✅ ${checked.praise}` : '❌ 아쉬워요'}</div>
            {!checked.ok && (
              <div className="answer">
                정답: <span className="jp">{answerText(ex)}</span>
              </div>
            )}
            {item && (
              <div className="extra">
                {isWord(item) ? `${item.word}（${item.reading}）` : itemTitle(item)} = {itemMeaning(item)}
              </div>
            )}
          </div>
          <div className="lesson-foot-inner">
            <button className={`btn block ${checked.ok ? '' : 'red'}`} onClick={next} autoFocus>
              계속
            </button>
          </div>
        </div>
      ) : (
        <div className="lesson-foot">
          <div className="lesson-foot-inner">
            <button className="btn block" disabled={value === null} onClick={check}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Complete({
  title,
  xp,
  result,
  content,
  onExit,
}: {
  title: string;
  xp: number;
  result: LessonResult;
  content: Content;
  onExit: () => void;
}) {
  const attempts = result.correct + result.wrong;
  const acc = attempts ? Math.round((result.correct / attempts) * 100) : 100;
  return (
    <div className="lesson">
      <div className="lesson-body">
        <div className="complete">
          <div className="big">{acc === 100 ? '🏆' : acc >= 80 ? '🎉' : '💪'}</div>
          <div className="title">{title} 완료!</div>
          <div className="stat-cards">
            <div className="stat-card" style={{ ['--c' as string]: 'var(--yellow)' }}>
              <div className="k">획득 XP</div>
              <div className="v">⚡ {xp}</div>
            </div>
            <div className="stat-card" style={{ ['--c' as string]: 'var(--green)' }}>
              <div className="k">정확도</div>
              <div className="v">🎯 {acc}%</div>
            </div>
          </div>
          {result.misses.length > 0 && (
            <div className="miss-list card">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>🔁 복습 목록에 추가됨 (1일 후 다시 출제)</div>
              {result.misses.map((id) => {
                const it = content.byId.get(id);
                if (!it) return null;
                return (
                  <div key={id} className="small" style={{ padding: '3px 0' }}>
                    <span className="jp" style={{ fontSize: 16 }}>
                      {itemTitle(it)}
                    </span>{' '}
                    <span className="muted">— {itemMeaning(it)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="lesson-foot">
        <div className="lesson-foot-inner">
          <button className="btn block" onClick={onExit} autoFocus>
            계속
          </button>
        </div>
      </div>
    </div>
  );
}
