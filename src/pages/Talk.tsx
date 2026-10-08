import { useEffect, useRef, useState } from 'react';
import { Avatar, Portrait } from '../components/Avatar';
import { askConfirm } from '../components/confirm';
import { JP, Speak } from '../components/JP';
import { Backdrop, Characters, DialogueBox } from '../components/Stage';
import { type AiMode, type ChatReply, type ChatTurn, type RoleplayEval, aiMode, clubChat, evaluateRoleplay } from '../lib/ai';
import { CAST, type MemberId, PERSONA, gradeOf, membersFor } from '../lib/cast';
import type { Content } from '../lib/content';
import { kana } from '../lib/jtext';
import { CLAUDE_APP_URL } from '../lib/links';
import { inClaude } from '../lib/runtime';
import { speak } from '../lib/speech';
import { addAiLog, addXp, local, markDone, useProgress } from '../lib/store';
import { fill, playerName, storyYear } from '../lib/story';
import { getApiKey } from '../lib/aiKey';
import { AiPractice } from './AiPractice';

const TOPICS = ['今期のアニメ', '週末の予定', 'もうすぐテスト', '好きな食べ物', '韓国のこと', '部室の大掃除', 'ガチャの結果', '最近ハマっていること', '文化祭の出し物', 'おすすめの漫画', '雨の日の過ごし方', 'コンビニの新商品'];

interface UiTurn extends ChatTurn {
  ko?: string;
  face?: ChatReply['face'];
  choices?: ChatReply['choices'];
  correction?: ChatReply['correction'];
}

export function Talk({ content, sub, go }: { content: Content; sub: string; go: (r: string) => void }) {
  const [ai, setAi] = useState<AiMode | null>(inClaude ? null : getApiKey() ? 'apikey' : 'none');
  const [member, setMember] = useState<MemberId | null>(null);
  const year = storyYear(useProgress());
  useEffect(() => {
    if (inClaude) void aiMode().then(setAi);
  }, []);

  if (sub === 'practice') return <AiPractice content={content} go={go} />;

  return (
    <div className="page">
      <div className="h1">대화</div>
      <div className="small muted" style={{ marginBottom: 14 }}>
        부실에서 부원과 잡담하기. 캐릭터가 일본어로 말을 걸면, 추천 답 2개 중에 고르거나 직접 써서 대답하세요. 틀린 표현은 살짝 고쳐 줘요.
      </div>
      {ai === null && <div className="empty">Claude 연결 확인 중…</div>}
      {ai === 'none' && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800 }}>대화하려면 Claude가 필요해요</div>
          <div className="small muted" style={{ margin: '6px 0 10px', lineHeight: 1.6 }}>
            {inClaude ? 'claude.ai에 로그인한 상태로 열어 주세요.' : '설정에서 Anthropic API 키를 넣거나, claude.ai 버전에서 열면 내 Claude 계정으로 대화할 수 있어요.'}
          </div>
          {!inClaude && (
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className="btn small" onClick={() => go('settings')}>
                API 키 넣기
              </button>
              <a className="btn small ghost" style={{ textDecoration: 'none' }} href={CLAUDE_APP_URL} target="_blank" rel="noreferrer">
                claude.ai 버전 열기
              </a>
            </div>
          )}
        </div>
      )}
      <div className="member-grid">
        {membersFor(year).map((id) => (
          <button key={id} className="member-card" disabled={ai !== 'claude' && ai !== 'apikey'} onClick={() => setMember(id)} style={{ ['--c' as string]: CAST[id].color }}>
            <Portrait id={id} />
            <div className="member-name">{CAST[id].name}</div>
            <div className="small muted">
              {CAST[id].name_ko} · {gradeOf(id, year)}
            </div>
          </button>
        ))}
      </div>
      <div className="h2">연습 모드</div>
      <button className="course" onClick={() => go('talk-practice')} style={{ ['--c' as string]: 'var(--accent)', width: '100%' }}>
        <div className="course-title">상황 대답 · 작문 · 내 생각 말하기 · 롤플레이</div>
        <div className="course-sub">문제를 풀고 Claude에게 채점·첨삭 받기</div>
      </button>
      {member && <ClubChat member={member} content={content} onExit={() => setMember(null)} />}
    </div>
  );
}

function ClubChat({ member, content, onExit }: { member: MemberId; content: Content; onExit: () => void }) {
  const p = useProgress();
  const m = CAST[member];
  const player = playerName(p);
  const persona = { name: m.name, profile: fill(PERSONA[member], p) };
  const [topic] = useState(() => TOPICS[Math.floor(Math.random() * TOPICS.length)]);
  const [turns, setTurns] = useState<UiTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showKo, setShowKo] = useState(() => local.get('nd.vnKo') === '1');
  const [log, setLog] = useState(false);
  const [result, setResult] = useState<RoleplayEval | null>(null);
  const started = useRef(false);

  const last = [...turns].reverse().find((t) => t.role === 'assistant');
  const lastUser = turns[turns.length - 1]?.role === 'user' ? null : [...turns].reverse().find((t) => t.role === 'user');
  const userCount = turns.filter((t) => t.role === 'user').length;

  const ask = async (history: UiTurn[]) => {
    setBusy(true);
    setError('');
    try {
      const { reply, raw, meta } = await clubChat(persona, player, history, topic);
      setTurns((ts) => {
        const copy = [...ts];
        const lu = copy.length - 1;
        if (lu >= 0 && copy[lu].role === 'user') copy[lu] = { ...copy[lu], correction: reply.correction };
        return [...copy, { role: 'assistant', text: reply.reply, ko: reply.reply_ko, face: reply.face, choices: reply.choices, raw, meta }];
      });
      setShowKo(local.get('nd.vnKo') === '1');
      if (p.settings.sound) speak(kana(reply.reply));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void ask([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const history: UiTurn[] = [...turns, { role: 'user', text: t }];
    setTurns(history);
    setInput('');
    void ask(history);
  };

  const finish = async () => {
    if (!userCount) return onExit();
    setBusy(true);
    try {
      const ev = await evaluateRoleplay(
        { title: m.name, character: persona.profile, setting_ko: '방과후 부실에서 잡담', goal_ko: '자연스럽게 대화를 이어가기', opening: turns[0]?.text ?? '' },
        turns,
      );
      setResult(ev);
      addAiLog({
        id: `${Date.now()}`,
        at: Date.now(),
        mode: 'roleplay',
        prompt: `${m.name_ko}와 잡담 (${topic})`,
        answer: turns.filter((x) => x.role === 'user').map((x) => x.text).join(' / ').slice(0, 300),
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

  const exit = () => {
    if (result || !userCount) return onExit();
    void askConfirm({ title: '대화를 끝낼까요?', body: '평가를 받지 않으면 이 대화는 기록에 남지 않아요.', ok: '그냥 나가기', cancel: '계속 대화' }).then((ok) => ok && onExit());
  };

  return (
    <div className={`vn ${p.settings.furigana ? '' : 'furi-off'}`} onClick={() => !showKo && last && setShowKo(true)}>
      <Backdrop art={content.art} bg="clubroom" dim={0.45} />
      <Characters art={content.art} cast={[{ id: member, face: last?.face ?? 'normal' }]} />
      <div className="vn-top" onClick={(e) => e.stopPropagation()}>
        <button className="vn-btn" onClick={exit} aria-label="나가기">
          ✕
        </button>
        <div className="vn-title">
          <Avatar id={member} size={28} /> {m.name_ko}와 잡담 · <span className="jp">{topic}</span>
        </div>
        <button className="vn-btn" onClick={() => setLog(true)}>
          LOG
        </button>
      </div>

      <div className="vn-bottom" onClick={(e) => e.stopPropagation()}>
        <DialogueBox name={m.name} color={m.color} tools={last ? <Speak jtext={last.text} small /> : undefined} onClick={() => setShowKo(!showKo)}>
          {busy && !last ? (
            <div className="vn-say typing">…</div>
          ) : last ? (
            <>
              <div className="vn-say">
                <JP text={last.text} />
              </div>
              {showKo ? <div className="vn-ko">{last.ko}</div> : <div className="vn-hint">탭하면 번역</div>}
            </>
          ) : null}
        </DialogueBox>

        {lastUser?.correction?.needed && (
          <div className="vn-fix">
            ✏️ 더 자연스럽게: <JP text={lastUser.correction.fixed} /> — {lastUser.correction.explain}
          </div>
        )}
        {error && <div className="vn-fix bad">⚠️ {error}</div>}

        {result ? (
          <div className="vn-panel">
            <div style={{ fontWeight: 800, fontSize: 18 }}>대화 평가 {result.score}점</div>
            <div className="small" style={{ margin: '6px 0' }}>
              {result.summary}
            </div>
            {result.points.slice(0, 3).map((pt, i) => (
              <div key={i} className="small" style={{ margin: '4px 0' }}>
                ✏️ <span className="orig">{pt.original}</span> → <span className="jp">{pt.fix.includes('{') ? <JP text={pt.fix} /> : pt.fix}</span> — {pt.explain}
              </div>
            ))}
            <button className="btn block" style={{ marginTop: 10 }} onClick={onExit}>
              부실로 돌아가기
            </button>
          </div>
        ) : (
          <div className="vn-panel">
            {last?.choices && last.choices.length > 0 && !busy && (
              <div className="vn-suggest">
                {last.choices.slice(0, 2).map((c, i) => (
                  <button key={i} className="vn-option small" onClick={() => send(c.jp.replace(/\{[^}]*\}/g, ''))}>
                    <JP text={c.jp} />
                    <div className="vn-ko small">{c.ko}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="composer" style={{ position: 'static', padding: 0, background: 'transparent' }}>
              <textarea
                className="input"
                lang="ja"
                rows={1}
                placeholder="直接入力もOK — 日本語で"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                disabled={busy}
              />
              <button className="btn" onClick={() => send(input)} disabled={busy || !input.trim()} style={{ minHeight: 48 }}>
                ➤
              </button>
            </div>
            {userCount >= 2 && (
              <button className="link-btn" style={{ color: '#fff' }} onClick={finish} disabled={busy}>
                🏁 대화 끝내고 평가 받기
              </button>
            )}
          </div>
        )}
      </div>

      {log && (
        <div className="vn-log" onClick={(e) => e.stopPropagation()}>
          <div className="row">
            <b>대화 기록</b>
            <span className="spacer" />
            <button className="vn-btn" onClick={() => setLog(false)}>
              ✕
            </button>
          </div>
          {turns.map((t, i) => (
            <div key={i} className="vn-log-line">
              <div className="small" style={{ fontWeight: 800, color: t.role === 'user' ? 'var(--primary)' : m.color }}>
                {t.role === 'user' ? player : m.name}
              </div>
              {t.role === 'user' ? <div className="jp">{t.text}</div> : <JP text={t.text} />}
              {t.ko && <div className="small muted">{t.ko}</div>}
              {t.correction?.needed && (
                <div className="small">
                  ✏️ <JP text={t.correction.fixed} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
