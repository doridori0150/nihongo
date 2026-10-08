import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CAST, type MemberId } from '../lib/cast';
import type { Content } from '../lib/content';
import { kana, plain } from '../lib/jtext';
import { sfx, speak } from '../lib/speech';
import { addXp, local, setInDeck, useProgress } from '../lib/store';
import {
  type ChoiceOption,
  type Episode,
  type Face,
  type Step,
  type StoryTerm,
  affinity,
  completeEpisode,
  fill,
  playerName,
  recordChoice,
  setStoryPos,
  toggleSavedLine,
} from '../lib/story';
import { askConfirm } from './confirm';
import { JP, JPTerms, Speak } from './JP';
import { Backdrop, Characters, DialogueBox, type OnStage } from './Stage';

interface Frame {
  steps: Step[];
  i: number;
}

interface Shown {
  key: string;
  who: string;
  name: string;
  color?: string;
  jp: string;
  ko: string;
}

interface View {
  bg: string;
  cast: OnStage[];
  line: Shown | null;
  choice: { step: Extract<Step, { choice: string }>; key: string } | null;
  ended: boolean;
}

interface Props {
  ep: Episode;
  content: Content;
  hasNext: boolean;
  onExit: () => void;
  onNext: () => void;
}

const MAX_ON_STAGE = 2;

export function StoryPlayer({ ep, content, hasNext, onExit, onNext }: Props) {
  const p = useProgress();
  const terms = useMemo(() => ep.terms.map((t) => ({ ...t, plain: plain(fill(t.jp, p)) })), [ep, p]);
  const stack = useRef<Frame[]>([{ steps: ep.script, i: 0 }]);
  const firstBg = (ep.script.find((s) => 'bg' in s) as { bg: string } | undefined)?.bg ?? 'clubroom';
  const stage = useRef<{ bg: string; cast: OnStage[] }>({ bg: firstBg, cast: [] });
  const [view, setView] = useState<View>({ bg: stage.current.bg, cast: [], line: null, choice: null, ended: false });
  const [showKo, setShowKo] = useState(false);
  const [alwaysKo, setAlwaysKo] = useState(() => local.get('nd.vnKo') === '1');
  const [term, setTerm] = useState<StoryTerm | null>(null);
  const [result, setResult] = useState<{ opt: ChoiceOption } | null>(null);
  const [revealOpts, setRevealOpts] = useState(false);
  const [voice, setVoice] = useState(() => local.get('nd.vnVoice') !== '0');
  const [log, setLog] = useState<Shown[]>([]);
  const [showLog, setShowLog] = useState(false);

  const path = () => stack.current.map((f) => f.i - 1).join('.');

  const applyStage = (s: Step) => {
    const st = stage.current;
    if ('bg' in s) st.bg = s.bg;
    else if ('show' in s) {
      const rest = st.cast.filter((c) => c.id !== s.show);
      st.cast = [...rest, { id: s.show, face: s.face ?? 'normal' }].slice(-MAX_ON_STAGE);
    } else if ('hide' in s) st.cast = st.cast.filter((c) => c.id !== s.hide);
  };

  /** Run steps until something needs the player (a line, a choice) or the episode ends. */
  const run = useCallback(() => {
    const aff = affinity();
    for (;;) {
      const top = stack.current[stack.current.length - 1];
      if (!top) {
        completeEpisode(ep.id);
        addXp(15);
        sfx.done();
        setView((v) => ({ ...v, line: null, choice: null, ended: true }));
        return;
      }
      if (top.i >= top.steps.length) {
        stack.current.pop();
        continue;
      }
      const s = top.steps[top.i++];
      if ('bg' in s || 'show' in s || 'hide' in s) {
        applyStage(s);
        continue;
      }
      if ('if_aff' in s) {
        const pass = Object.entries(s.if_aff).every(([m, n]) => (aff[m] ?? 0) >= n);
        const branch = pass ? s.then : s.else;
        if (branch?.length) stack.current.push({ steps: branch, i: 0 });
        continue;
      }
      if ('if_top' in s) {
        const score = s.year ? affinity(undefined, s.year) : aff;
        const best = s.if_top.reduce((a, m) => ((score[m] ?? 0) > (score[a] ?? 0) ? m : a), s.if_top[0]);
        const branch = s.branches[best] ?? s.else;
        if (branch?.length) stack.current.push({ steps: branch, i: 0 });
        continue;
      }
      if (stack.current.length === 1) setStoryPos(ep.id, top.i - 1);
      if ('choice' in s) {
        setRevealOpts(false);
        setView({ ...stage.current, cast: [...stage.current.cast], line: null, choice: { step: s, key: `${ep.id}:${path()}` }, ended: false });
        return;
      }
      // narr / say
      let shown: Shown;
      if ('narr' in s) shown = { key: path(), who: '', name: '', jp: fill(s.narr), ko: fill(s.ko) };
      else {
        const member = CAST[s.say as MemberId];
        if (member) {
          const st = stage.current;
          const on = st.cast.find((c) => c.id === s.say);
          if (on) on.face = s.face ?? on.face;
          else st.cast = [...st.cast, { id: s.say, face: (s.face as Face) ?? 'normal' }].slice(-MAX_ON_STAGE);
        }
        // name tags are plain text: drop any 漢字{かな} readings or | chunk marks a script put in `who`
        const name = s.say === 'me' ? playerName() : member ? member.name : (s.who ?? '').replace(/\{[^}]*\}/g, '').replace(/\|/g, '');
        shown = { key: path(), who: s.say, name, color: member?.color, jp: fill(s.jp), ko: fill(s.ko) };
      }
      setLog((l) => [...l, shown].slice(-120));
      setShowKo(false);
      setView({ ...stage.current, cast: [...stage.current.cast], line: shown, choice: null, ended: false });
      return;
    }
  }, [ep]);

  // start, resuming where the player left off (once, even when effects run twice in development)
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const pos = p.story?.pos;
    if (pos?.ep === ep.id && pos.i > 0 && pos.i < ep.script.length) {
      for (const s of ep.script.slice(0, pos.i)) applyStage(s);
      stack.current = [{ steps: ep.script, i: pos.i }];
    }
    run();
    // run once per episode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep.id]);

  const advance = useCallback(() => {
    if (term || result || showLog || view.choice || view.ended) return;
    if (view.line && !alwaysKo && !showKo) {
      setShowKo(true);
      return;
    }
    run();
  }, [term, result, showLog, view, alwaysKo, showKo, run]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance]);

  const choose = (opt: ChoiceOption, index: number) => {
    if (!view.choice) return;
    recordChoice(view.choice.key, index, opt.aff ?? {});
    if (opt.ok) sfx.correct();
    else sfx.wrong();
    setResult({ opt });
  };

  const afterResult = () => {
    if (!result) return;
    if (result.opt.then?.length) stack.current.push({ steps: result.opt.then, i: 0 });
    setResult(null);
    setView((v) => ({ ...v, choice: null }));
    run();
  };

  // read each new line aloud (the device's Japanese TTS voice)
  useEffect(() => {
    if (view.line && voice && p.settings.sound) speak(kana(view.line.jp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.line]);

  const exit = () => {
    if (view.ended) return onExit();
    void askConfirm({ title: '스토리를 잠시 멈출까요?', body: '지금 위치부터 이어서 볼 수 있어요.', ok: '나가기', cancel: '계속 보기' }).then((ok) => ok && onExit());
  };

  const toggleAlwaysKo = () => {
    local.set('nd.vnKo', alwaysKo ? '0' : '1');
    setAlwaysKo(!alwaysKo);
  };

  const savedIds = new Set((p.story?.saved ?? []).map((s) => s.id));
  const line = view.line;
  const lineTerms = terms.map((t) => t.plain);

  return (
    <div className={`vn ${p.settings.furigana ? '' : 'furi-off'}`} onClick={advance}>
      <Backdrop art={content.art} bg={view.bg} dim={0.12} />
      <Characters art={content.art} cast={view.cast} speaking={line?.who} />

      <div className="vn-top" onClick={(e) => e.stopPropagation()}>
        <button className="vn-btn" onClick={exit} aria-label="나가기">
          ✕
        </button>
        <div className="vn-title">
          <JP text={ep.title} /> <span className="small">{ep.title_ko}</span>
        </div>
        <button
          className={`vn-btn ${voice ? 'on' : ''}`}
          onClick={() => {
            local.set('nd.vnVoice', voice ? '0' : '1');
            setVoice(!voice);
          }}
          title="대사 음성"
        >
          🔈
        </button>
        <button className={`vn-btn ${alwaysKo ? 'on' : ''}`} onClick={toggleAlwaysKo} title="한국어 번역 항상 보기">
          한
        </button>
        <button className="vn-btn" onClick={() => setShowLog(true)} title="지난 대사">
          LOG
        </button>
      </div>

      {line && (
        <DialogueBox
          name={line.name}
          color={line.color}
          tools={
            <>
              <Speak jtext={line.jp} small />
              <button
                className={`vn-tool ${savedIds.has(`${ep.id}:${line.key}`) ? 'on' : ''}`}
                onClick={() => toggleSavedLine({ id: `${ep.id}:${line.key}`, ep: ep.id, who: line.name, jp: line.jp, ko: line.ko })}
                title="대사 저장"
              >
                ★
              </button>
            </>
          }
        >
          <div className={line.who ? 'vn-say' : 'vn-narr'}>
            <JPTerms text={line.jp} terms={lineTerms} onTerm={(i) => setTerm(terms[i])} />
          </div>
          {(showKo || alwaysKo) && <div className="vn-ko">{line.ko}</div>}
          {!showKo && !alwaysKo && <div className="vn-hint">탭하면 번역</div>}
        </DialogueBox>
      )}

      {view.choice && !result && (
        <div className="vn-choice" onClick={(e) => e.stopPropagation()}>
          <div className="vn-choice-q">{view.choice.step.choice}</div>
          {view.choice.step.options.map((o, i) => (
            <button key={i} className="vn-option" onClick={() => choose(o, i)}>
              <JP text={fill(o.jp)} />
              {revealOpts && <div className="vn-ko small">{fill(o.ko)}</div>}
            </button>
          ))}
          <button className="link-btn" style={{ color: '#fff' }} onClick={() => setRevealOpts(!revealOpts)}>
            {revealOpts ? '번역 숨기기' : '선택지 번역 보기'}
          </button>
        </div>
      )}

      {result && (
        <div className="vn-choice" onClick={(e) => e.stopPropagation()}>
          <div className={`vn-result ${result.opt.ok ? 'ok' : 'bad'}`}>
            <div className="vn-result-head">{result.opt.ok ? '✅ 자연스러워요!' : '❌ 조금 어색해요'}</div>
            <div className="vn-result-line">
              <JP text={fill(result.opt.jp)} />
              <div className="small">{fill(result.opt.ko)}</div>
            </div>
            {!result.opt.ok && result.opt.tip && <div className="vn-tip">💡 {result.opt.tip}</div>}
            {Object.entries(result.opt.aff ?? {})
              .filter(([, n]) => n !== 0)
              .map(([m, n]) => (
                <div key={m} className="vn-aff">
                  ♥ {CAST[m as MemberId]?.name_ko ?? m} 친밀도 {n > 0 ? `+${n}` : n}
                </div>
              ))}
            <button className="btn block" onClick={afterResult} autoFocus>
              계속
            </button>
          </div>
        </div>
      )}

      {term && (
        <div className="vn-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1, fontSize: 22 }}>
              <JP text={term.jp} />
            </div>
            <Speak text={kana(term.jp)} small />
          </div>
          <div style={{ fontWeight: 800, margin: '4px 0' }}>{term.ko}</div>
          <div className="small muted">{term.note}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className={`btn small ${p.deck[term.id]?.on ? 'ghost' : ''}`} onClick={() => setInDeck([term.id], !p.deck[term.id]?.on)}>
              {p.deck[term.id]?.on ? '✓ 암기 카드에 있음' : '+ 암기 카드에 저장'}
            </button>
            <span className="spacer" />
            <button className="btn small ghost plain" onClick={() => setTerm(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {showLog && (
        <div className="vn-log" onClick={(e) => e.stopPropagation()}>
          <div className="row">
            <b>지난 대사</b>
            <span className="spacer" />
            <button className="vn-btn" onClick={() => setShowLog(false)}>
              ✕
            </button>
          </div>
          {log.map((l, i) => (
            <div key={i} className="vn-log-line">
              {l.name && <div className="small" style={{ color: l.color ?? 'var(--muted)', fontWeight: 800 }}>{l.name}</div>}
              <JP text={l.jp} />
              <div className="small muted">{l.ko}</div>
            </div>
          ))}
        </div>
      )}

      {view.ended && (
        <div className="vn-choice" onClick={(e) => e.stopPropagation()}>
          <div className="vn-end">
            <div className="vn-end-title">
              第{ep.no}話 完
            </div>
            <div className="small">
              <JP text={ep.title} /> · {ep.title_ko}
            </div>
            <div className="vn-end-terms">
              <div className="row">
                <b>이번 화의 표현</b>
                <span className="spacer" />
                <button className="btn small ghost" onClick={() => setInDeck(terms.map((t) => t.id), true)}>
                  모두 암기 카드에 저장
                </button>
              </div>
              {terms.map((t) => (
                <div key={t.id} className="vn-term-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <JP text={t.jp} /> <span className="small muted">{t.ko}</span>
                  </div>
                  <button className={`btn small ${p.deck[t.id]?.on ? 'ghost' : ''}`} onClick={() => setInDeck([t.id], !p.deck[t.id]?.on)}>
                    {p.deck[t.id]?.on ? '✓' : '+'}
                  </button>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn ghost block" onClick={onExit}>
                목록으로
              </button>
              {hasNext && (
                <button className="btn block" onClick={onNext}>
                  다음 화 ▶
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
