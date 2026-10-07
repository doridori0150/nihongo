import { useEffect, useRef, useState } from 'react';
import { Ring } from '../components/common';
import { askConfirm } from '../components/confirm';
import { JP, Speak } from '../components/JP';
import {
  type AiMode,
  type ChatTurn,
  type Grade,
  type GradeTask,
  type RoleplayEval,
  type Turn,
  aiMode,
  evaluateRoleplay,
  grade,
  roleplayTurn,
} from '../lib/ai';
import { getApiKey } from '../lib/aiKey';
import { takeAiRequest } from '../lib/nav';
import { inClaude } from '../lib/runtime';
import { CLAUDE_APP_URL } from '../lib/links';
import { type Content, type Example, type Opinion, type Roleplay, type Situation, isGrammar, isPhrase, isWord } from '../lib/content';
import { plain } from '../lib/jtext';
import { today } from '../lib/date';
import { addAiLog, addXp, getProgress, local, markDone, useProgress } from '../lib/store';

type Mode = 'situation' | 'compose' | 'opinion' | 'roleplay';

const MODES: { key: Mode; e: string; t: string; d: string; c: string }[] = [
  { key: 'situation', e: '🏮', t: '상황 대답', d: '점원·친구·이웃이 이렇게 말하면? 상황에 맞게 대답하기', c: 'var(--orange)' },
  { key: 'compose', e: '✍️', t: '한→일 작문', d: '배운 단어·문법으로 한국어 문장을 일본어로', c: 'var(--green-dark)' },
  { key: 'opinion', e: '💭', t: '내 생각 말하기', d: '일본어 질문에 내 이야기로 자유롭게 답하기', c: 'var(--blue)' },
  { key: 'roleplay', e: '🎭', t: '롤플레이', d: '드라마 속 인물과 몇 턴 대화하고 총평 받기', c: 'var(--purple-dark)' },
];

function pickFresh<T extends { id: string }>(mode: Mode, pool: T[]): T {
  const key = `nd.recent.${mode}`;
  let recent: string[] = [];
  try {
    recent = JSON.parse(local.get(key) ?? '[]');
  } catch {
    /* ignore */
  }
  const fresh = pool.filter((x) => !recent.includes(x.id));
  const from = fresh.length ? fresh : pool;
  const pick = from[Math.floor(Math.random() * from.length)];
  local.set(key, JSON.stringify([pick.id, ...recent].slice(0, Math.min(30, Math.floor(pool.length * 0.7)))));
  return pick;
}

interface ComposeTask {
  id: string;
  ko: string;
  reference: string;
  focus: string;
  focusMeaning: string;
}

function composeTask(c: Content): ComposeTask | null {
  const p = getProgress();
  const learned = Object.keys(p.items)
    .map((id) => c.byId.get(id))
    .filter(Boolean);
  const plan = p.days[today()];
  const pool = learned.length ? learned : [...(plan?.words ?? []), ...(plan?.grammar ?? [])].map((id) => c.byId.get(id)).filter(Boolean);
  const tasks: ComposeTask[] = [];
  for (const it of pool) {
    if (!it) continue;
    const exs: Example[] = isPhrase(it) ? [{ jp: it.jp, ko: it.ko, src: it.src, scene: it.scene }] : it.examples;
    exs.forEach((ex, i) =>
      tasks.push({
        id: `${it.id}#${i}`,
        ko: ex.ko,
        reference: plain(ex.jp),
        focus: isWord(it) ? it.word : isGrammar(it) ? it.pattern : it.expression,
        focusMeaning: isPhrase(it) ? '' : it.meaning,
      }),
    );
  }
  if (!tasks.length) return null;
  return pickFresh('compose', tasks);
}

export function AiPractice({ content, go }: { content: Content; go: (r: string) => void }) {
  const [request] = useState(takeAiRequest);
  const [mode, setMode] = useState<Mode | null>(request?.mode ?? null);
  const [ai, setAi] = useState<AiMode | null>(inClaude ? null : getApiKey() ? 'apikey' : 'none');
  const p = useProgress();
  useEffect(() => {
    if (inClaude) void aiMode().then(setAi);
  }, []);

  if (ai === null) {
    return (
      <div className="page">
        <div className="empty">Claude 연결 확인 중…</div>
      </div>
    );
  }

  if (ai === 'none' && inClaude) {
    return (
      <div className="page">
        <div className="h1">회화 연습</div>
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 18, margin: '6px 0' }}>이 화면에서는 Claude를 쓸 수 없어요</div>
          <div className="small muted" style={{ lineHeight: 1.7 }}>
            claude.ai에 로그인한 상태로 이 페이지를 열면, 내 Claude 계정으로 채점과 롤플레이를 할 수 있어요.
          </div>
        </div>
      </div>
    );
  }

  if (ai === 'none') {
    return (
      <div className="page">
        <div className="h1">회화 연습</div>
        <div className="card">
          <div style={{ fontSize: 40 }}>🔑</div>
          <div style={{ fontWeight: 900, fontSize: 18, margin: '6px 0' }}>Anthropic API 키가 필요해요</div>
          <div className="small muted" style={{ lineHeight: 1.7 }}>
            AI 회화는 Claude(Sonnet)가 답을 채점·첨삭해요. 각자 본인의 API 키를 설정에서 입력하면 사용할 수 있어요. 키는 이 기기의 브라우저에만 저장되고 동기화되지 않아요.
            <br />
            채점 1회당 대략 10원 안팎의 API 요금이 들어요.
          </div>
          <button className="btn block blue" style={{ marginTop: 14 }} onClick={() => go('settings')}>
            설정에서 API 키 넣기
          </button>
          <a className="btn block ghost" style={{ marginTop: 8, textDecoration: 'none' }} href={CLAUDE_APP_URL} target="_blank" rel="noreferrer">
            API 키 없이 내 Claude 계정으로 쓰기 (claude.ai 버전)
          </a>
        </div>
      </div>
    );
  }

  if (mode === 'roleplay') return <RoleplayPicker content={content} back={() => setMode(null)} />;
  if (mode) {
    const initialId = request && 'id' in request && request.mode === mode ? request.id : undefined;
    return <QA key={mode} mode={mode} content={content} initialId={initialId} back={() => setMode(null)} />;
  }

  return (
    <div className="page">
      <div className="h1">회화 연습</div>
      <div className="muted small" style={{ marginBottom: 14 }}>
        일본어로 답하면 Claude가 문법·자연스러움·경어를 채점하고 고쳐 줘요.
        {ai === 'claude' ? ' 내 Claude 계정 사용량으로 동작해요.' : ''}
        {p.days[today()]?.done.ai && ' · 오늘 AI 회화 ✔️'}
      </div>
      <div className="mode-grid">
        {MODES.map((m) => (
          <button key={m.key} className="mode" style={{ ['--c' as string]: m.c }} onClick={() => setMode(m.key)}>
            <div className="e">{m.e}</div>
            <div className="t">{m.t}</div>
            <div className="d">{m.d}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── single-answer modes ─────────

type QATask =
  | { mode: 'situation'; item: Situation }
  | { mode: 'opinion'; item: Opinion }
  | { mode: 'compose'; item: ComposeTask };

function newTask(mode: Exclude<Mode, 'roleplay'>, c: Content): QATask | null {
  if (mode === 'situation') return c.situations.length ? { mode, item: pickFresh(mode, c.situations) } : null;
  if (mode === 'opinion') return c.opinions.length ? { mode, item: pickFresh(mode, c.opinions) } : null;
  const item = composeTask(c);
  return item ? { mode, item } : null;
}

function toGradeTask(t: QATask): GradeTask {
  if (t.mode === 'situation')
    return { mode: 'situation', scene: t.item.scene, partner: t.item.partner, line: plain(t.item.line), task: t.item.task, sample: t.item.sample };
  if (t.mode === 'opinion') return { mode: 'opinion', question: plain(t.item.question), hint: t.item.hint, sample: t.item.sample };
  return { mode: 'compose', ko: t.item.ko, reference: t.item.reference, focus: t.item.focus };
}

function promptSummary(t: QATask): string {
  if (t.mode === 'situation') return `${t.item.scene} — ${t.item.task}`;
  if (t.mode === 'opinion') return plain(t.item.question);
  return t.item.ko;
}

function QA({ mode, content, back, initialId }: { mode: Exclude<Mode, 'roleplay'>; content: Content; back: () => void; initialId?: string }) {
  const p = useProgress();
  const [task, setTask] = useState<QATask | null>(() => {
    if (initialId && mode === 'situation') {
      const item = content.situations.find((x) => x.id === initialId);
      if (item) return { mode, item };
    }
    if (initialId && mode === 'opinion') {
      const item = content.opinions.find((x) => x.id === initialId);
      if (item) return { mode, item };
    }
    return newTask(mode, content);
  });
  const [answer, setAnswer] = useState('');
  const [showKo, setShowKo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Grade | null>(null);
  const meta = MODES.find((m) => m.key === mode)!;

  const next = () => {
    setTask(newTask(mode, content));
    setAnswer('');
    setResult(null);
    setError('');
    setShowKo(false);
  };

  const submit = async () => {
    if (!task || !answer.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const g = await grade(toGradeTask(task), answer.trim());
      setResult(g);
      addAiLog({
        id: `${Date.now()}`,
        at: Date.now(),
        mode,
        prompt: promptSummary(task),
        answer: answer.trim(),
        score: g.score,
        corrected: g.corrected,
        feedback: g.feedback,
      });
      addXp(2 + Math.round(g.score / 10));
      markDone('ai');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="row">
        <button className="icon-btn" onClick={back} aria-label="뒤로">
          ←
        </button>
        <div className="h1" style={{ margin: 0 }}>
          {meta.e} {meta.t}
        </div>
      </div>

      {!task ? (
        <div className="empty">
          <div className="big">📭</div>
          {mode === 'compose' ? '먼저 오늘의 단어를 학습하면 작문 문제가 나와요.' : '문제가 없어요.'}
        </div>
      ) : (
        <>
          <div className="card" style={{ marginTop: 12 }}>
            {task.mode === 'situation' && (
              <>
                <div className="small muted">🎬 {task.item.scene}</div>
                <span className="talk-who" style={{ display: 'inline-block', marginTop: 12 }}>
                  {task.item.partner}
                </span>
                <div className="bubble-row" style={{ marginTop: 8, marginBottom: 8 }}>
                  <div className="speech">
                    <JP text={task.item.line} />
                    {showKo && <div className="small muted">{task.item.line_ko}</div>}
                  </div>
                  <Speak jtext={task.item.line} />
                </div>
                {!showKo && (
                  <button className="reveal-ko" onClick={() => setShowKo(true)}>
                    해석 보기
                  </button>
                )}
                <div className="note">
                  <b>미션</b> {task.item.task}
                </div>
              </>
            )}
            {task.mode === 'opinion' && (
              <>
                <div className="bubble-row" style={{ marginBottom: 8 }}>
                  <div className="speech">
                    <JP text={task.item.question} />
                    {showKo && <div className="small muted">{task.item.question_ko}</div>}
                  </div>
                  <Speak jtext={task.item.question} />
                </div>
                {!showKo && (
                  <button className="reveal-ko" onClick={() => setShowKo(true)}>
                    해석 보기
                  </button>
                )}
                <div className="note">💡 {task.item.hint}</div>
              </>
            )}
            {task.mode === 'compose' && (
              <>
                <div className="small muted">다음 문장을 일본어로 옮겨 보세요</div>
                <div style={{ fontSize: 20, fontWeight: 800, margin: '10px 0' }}>“{task.item.ko}”</div>
                <div className="note">
                  💡 <b className="jp">{task.item.focus}</b> {task.item.focusMeaning && `(${task.item.focusMeaning})`} 를 써 보세요
                </div>
              </>
            )}
          </div>

          {!result && (
            <>
              <div className="field">
                <textarea
                  className="input"
                  lang="ja"
                  placeholder="일본어로 답해 보세요 (日本語で)"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
                  }}
                  disabled={busy}
                />
              </div>
              {error && <div className="status-bad small" style={{ marginBottom: 10 }}>⚠️ {error}</div>}
              <div className="row">
                <button className="btn ghost plain small" onClick={next} disabled={busy}>
                  다른 문제
                </button>
                <span className="spacer" />
                <button className="btn" onClick={submit} disabled={busy || !answer.trim()}>
                  {busy ? '채점 중…' : '채점 받기'}
                </button>
              </div>
            </>
          )}

          {result && (
            <>
              <GradeView g={result} answer={answer} />
              {task.mode !== 'compose' && (
                <div className="card">
                  <div className="small muted">모범 답안 예시</div>
                  <div className="row" style={{ marginTop: 4 }}>
                    <div className="jp" style={{ flex: 1, fontSize: 17 }}>
                      {task.item.sample}
                    </div>
                    <Speak text={task.item.sample} small />
                  </div>
                </div>
              )}
              {task.mode === 'compose' && (
                <div className="card">
                  <div className="small muted">참고 번역</div>
                  <div className="row" style={{ marginTop: 4 }}>
                    <div className="jp" style={{ flex: 1, fontSize: 17 }}>
                      {task.item.reference}
                    </div>
                    <Speak text={task.item.reference} small />
                  </div>
                </div>
              )}
              <div className="row" style={{ marginTop: 16 }}>
                <button className="btn ghost small" onClick={() => setResult(null)}>
                  다시 써 보기
                </button>
                <span className="spacer" />
                <button className="btn" onClick={next}>
                  다음 문제
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const VERDICT: Record<Grade['verdict'], string> = {
  perfect: '완벽! 일본인이 「え、日本人？」 할 수준 🎉',
  good: '잘했어요! 뜻은 확실히 통해요 👍',
  okay: '통하긴 해요. 일본인이 살짝 고개를 갸웃할 수도 🤔',
  needs_work: '조금 더 다듬어 봐요 💪 다들 이렇게 늘어요',
};
const POINT_LABEL: Record<string, string> = {
  grammar: '문법',
  vocab: '어휘',
  politeness: '경어·말투',
  naturalness: '자연스러움',
  spelling: '표기',
  content: '내용',
};

function scoreColor(s: number) {
  return s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--red)';
}

function GradeView({ g, answer }: { g: Grade; answer: string }) {
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="row">
        <Ring value={g.score / 100} size={84} stroke={9} color={scoreColor(g.score)} track="var(--border)">
          <span style={{ fontSize: 24 }}>{g.score}</span>
        </Ring>
        <div>
          <div style={{ fontWeight: 900, fontSize: 19 }}>{VERDICT[g.verdict]}</div>
          <div className="jp small muted" style={{ marginTop: 4 }}>
            내 답: {answer}
          </div>
        </div>
      </div>
      <div className="h2" style={{ fontSize: 15 }}>
        ✅ 이렇게 말하면 자연스러워요
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, fontSize: 19 }}>
          <JP text={g.corrected} />
        </div>
        <Speak jtext={g.corrected} />
      </div>
      {g.better.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {g.better.map((b, i) => (
            <div key={i} className="row" style={{ alignItems: 'flex-start', marginTop: 4 }}>
              <div style={{ flex: 1, fontSize: 16 }}>
                <span className="muted small">다른 표현 </span>
                <JP text={b} />
              </div>
              <Speak jtext={b} small />
            </div>
          ))}
        </div>
      )}
      {g.points.length > 0 && (
        <>
          <div className="h2" style={{ fontSize: 15 }}>
            ✏️ 고칠 점
          </div>
          {g.points.map((pt, i) => (
            <div key={i} className="point">
              <span className="chip">{POINT_LABEL[pt.kind] ?? pt.kind}</span> <span className="orig">{pt.original}</span> →{' '}
              <span className="fix">{pt.fix.includes('{') ? <JP text={pt.fix} /> : pt.fix}</span>
              <div className="small" style={{ marginTop: 3 }}>
                {pt.explain}
              </div>
            </div>
          ))}
        </>
      )}
      <div className="note" style={{ marginTop: 12 }}>
        {g.feedback}
      </div>
    </div>
  );
}

// ───────── roleplay ─────────

function RoleplayPicker({ content, back }: { content: Content; back: () => void }) {
  const [rp, setRp] = useState<Roleplay | null>(null);
  if (rp) return <RoleplayChat rp={rp} back={() => setRp(null)} />;
  return (
    <div className="page">
      <div className="row">
        <button className="icon-btn" onClick={back} aria-label="뒤로">
          ←
        </button>
        <div className="h1" style={{ margin: 0 }}>
          🎭 롤플레이
        </div>
        <span className="spacer" />
        <button className="btn small purple" onClick={() => setRp(pickFresh('roleplay', content.roleplays))}>
          🎲 랜덤
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        {content.roleplays.map((r) => (
          <button key={r.id} className="list-item" onClick={() => setRp(r)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900 }}>{r.title}</div>
              <div className="m">{r.setting_ko}</div>
            </div>
            <span className="chip">{r.theme}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface UiTurn extends ChatTurn {
  ko?: string;
  correction?: Turn['correction'];
}

const MAX_TURNS = 10;

function RoleplayChat({ rp, back }: { rp: Roleplay; back: () => void }) {
  const p = useProgress();
  const [turns, setTurns] = useState<UiTurn[]>([{ role: 'assistant', text: rp.opening, ko: rp.opening_ko }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState(false);
  const [showKo, setShowKo] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<RoleplayEval | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const userTurns = turns.filter((t) => t.role === 'user').length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, busy, result]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const history: UiTurn[] = [...turns, { role: 'user', text }];
    setTurns(history);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const { turn, raw, meta } = await roleplayTurn(rp, history);
      setTurns((ts) => {
        const copy = [...ts];
        copy[copy.length - 1] = { ...copy[copy.length - 1], correction: turn.correction };
        return [...copy, { role: 'assistant', text: turn.reply, ko: turn.reply_ko, raw, meta }];
      });
      if (turn.goal_done) setGoal(true);
    } catch (e) {
      setError((e as Error).message);
      setTurns(turns);
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      const ev = await evaluateRoleplay(rp, turns);
      setResult(ev);
      addAiLog({
        id: `${Date.now()}`,
        at: Date.now(),
        mode: 'roleplay',
        prompt: rp.title,
        answer: turns
          .filter((t) => t.role === 'user')
          .map((t) => t.text)
          .join(' / ')
          .slice(0, 300),
        score: ev.score,
        corrected: '',
        feedback: ev.summary,
      });
      addXp(5 + Math.round(ev.score / 10));
      markDone('ai');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleKo = (i: number) =>
    setShowKo((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`} style={{ paddingBottom: 16 }}>
      <div className="row">
        <button className="icon-btn" onClick={async () => (result || userTurns === 0 || (await askConfirm({ title: '대화를 끝낼까요?', body: '평가를 받지 않으면 이 대화는 기록에 남지 않아요.', ok: '끝내기', cancel: '계속 대화' }))) && back()} aria-label="뒤로">
          ←
        </button>
        <div style={{ fontWeight: 900, fontSize: 18 }}>{rp.title}</div>
      </div>
      <div className="note small" style={{ margin: '10px 0 14px' }}>
        🎬 {rp.setting_ko}
        <br />
        🎯 <b>목표</b> {rp.goal_ko}
      </div>

      <div className="chat">
        {turns.map((t, i) =>
          t.role === 'assistant' ? (
            <div key={i} className="msg them" onClick={() => toggleKo(i)}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <JP text={t.text} />
                </div>
                <Speak jtext={t.text} small />
              </div>
              {showKo.has(i) ? <div className="tr">{t.ko}</div> : <div className="tr">탭하면 해석</div>}
            </div>
          ) : (
            <div key={i} style={{ display: 'contents' }}>
              <div className="msg me">{t.text}</div>
              {t.correction?.needed && (
                <div className="fix-note">
                  ✏️ <JP text={t.correction.fixed} />
                  <div>{t.correction.explain}</div>
                </div>
              )}
            </div>
          ),
        )}
        {busy && !result && <div className="typing">●●●</div>}
        {goal && !result && <div className="note small status-ok">🎯 목표 달성! 대화를 이어가거나 평가를 받아 보세요.</div>}
      </div>

      {error && <div className="status-bad small" style={{ margin: '8px 0' }}>⚠️ {error}</div>}

      {result ? (
        <RoleplayResult ev={result} />
      ) : (
        <>
          {userTurns > 0 && (
            <div className="row" style={{ justifyContent: 'center', margin: '10px 0' }}>
              <button className={`btn small ${goal || userTurns >= MAX_TURNS ? 'purple' : 'ghost'}`} onClick={finish} disabled={busy}>
                🏁 대화 끝내고 평가 받기
              </button>
            </div>
          )}
          {userTurns < MAX_TURNS && (
            <div className="composer">
              <textarea
                className="input"
                lang="ja"
                placeholder="日本語で話してみよう"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={busy}
                rows={1}
              />
              <button className="btn" onClick={send} disabled={busy || !input.trim()} style={{ minHeight: 52 }}>
                ➤
              </button>
            </div>
          )}
        </>
      )}
      <div ref={endRef} />
    </div>
  );
}

function RoleplayResult({ ev }: { ev: RoleplayEval }) {
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="row">
        <Ring value={ev.score / 100} size={84} stroke={9} color={scoreColor(ev.score)} track="var(--border)">
          <span style={{ fontSize: 24 }}>{ev.score}</span>
        </Ring>
        <div style={{ fontWeight: 900, fontSize: 18 }}>대화 평가</div>
      </div>
      <div className="note" style={{ marginTop: 12 }}>
        {ev.summary}
      </div>
      {ev.good.length > 0 && (
        <>
          <div className="h2" style={{ fontSize: 15 }}>
            👍 잘한 점
          </div>
          {ev.good.map((g, i) => (
            <div key={i} className="small" style={{ margin: '4px 0' }}>
              • {g}
            </div>
          ))}
        </>
      )}
      {ev.points.length > 0 && (
        <>
          <div className="h2" style={{ fontSize: 15 }}>
            ✏️ 고칠 점
          </div>
          {ev.points.map((pt, i) => (
            <div key={i} className="point">
              <span className="orig">{pt.original}</span> → <span className="fix">{pt.fix.includes('{') ? <JP text={pt.fix} /> : pt.fix}</span>
              <div className="small" style={{ marginTop: 3 }}>
                {pt.explain}
              </div>
            </div>
          ))}
        </>
      )}
      {ev.expressions.length > 0 && (
        <>
          <div className="h2" style={{ fontSize: 15 }}>
            📌 이 장면에서 쓸 수 있는 표현
          </div>
          {ev.expressions.map((x, i) => (
            <div key={i} className="row" style={{ alignItems: 'flex-start', margin: '6px 0' }}>
              <div style={{ flex: 1 }}>
                <JP text={x.jp} />
                <div className="small muted">{x.ko}</div>
              </div>
              <Speak jtext={x.jp} small />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
