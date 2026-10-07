import { useRef, useState } from 'react';
import { Switch } from '../components/common';
import { askConfirm, notify } from '../components/confirm';
import { getApiKey, MODEL, setApiKey } from '../lib/aiKey';
import { inClaude } from '../lib/runtime';
import { CLAUDE_APP_URL } from '../lib/links';
import type { Content } from '../lib/content';
import { canSpeak, speak } from '../lib/speech';
import { getToken, setToken, syncNow, useSyncStatus } from '../lib/sync';
import {
  type LevelPref,
  type Progress,
  getProgress,
  local,
  mergeProgress,
  replaceFromSync,
  resetProgress,
  setSettings,
  update,
  useProgress,
} from '../lib/store';

type Theme = 'system' | 'light' | 'dark';

export function applyTheme(t: Theme) {
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

function mask(s: string | null) {
  return s ? `${s.slice(0, 7)}…${s.slice(-4)}` : '';
}

export function Settings({ content }: { content: Content }) {
  const p = useProgress();
  const sync = useSyncStatus();
  const [theme, setTheme] = useState<Theme>((local.get('nd.theme') as Theme) || 'system');
  const [tokenInput, setTokenInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [, force] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const s = p.settings;
  const token = getToken();
  const apiKey = getApiKey();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getProgress(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nihongo-daily-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Progress;
      if (!data.items || !data.days) throw new Error('형식이 올바르지 않아요');
      replaceFromSync(mergeProgress(getProgress(), data));
      update((x) => x); // persist + trigger sync
      void notify('가져오기 완료!', '기존 기록과 합쳤어요.');
    } catch (e) {
      void notify('가져오기 실패', (e as Error).message);
    }
  };

  return (
    <div className="page">
      <div className="h1">설정</div>

      <div className="h2">학습</div>
      <div className="card">
        <div className="field" style={{ marginTop: 0 }}>
          <label>하루 새 단어 수</label>
          <div className="seg" style={{ margin: 0 }}>
            {[5, 10, 15, 20].map((n) => (
              <button key={n} className={s.newPerDay === n ? 'on' : ''} onClick={() => setSettings({ newPerDay: n })}>
                {n}개
              </button>
            ))}
          </div>
          <div className="hint">오늘 단어 학습을 시작하기 전에 바꾸면 오늘 목록에도 바로 적용돼요.</div>
        </div>
        <div className="field">
          <label>난이도</label>
          <div className="seg" style={{ margin: 0 }}>
            {(
              [
                ['N2', 'N2 위주'],
                ['mix', 'N2 + N1'],
                ['N1', 'N1 위주'],
              ] as [LevelPref, string][]
            ).map(([v, label]) => (
              <button key={v} className={s.level === v ? 'on' : ''} onClick={() => setSettings({ level: v })}>
                {label}
              </button>
            ))}
          </div>
          <div className="hint">N2 + N1: 새 항목의 약 30%를 N1에서 출제해요.</div>
        </div>
        <div className="switch-row">
          <div>
            <div style={{ fontWeight: 900 }}>후리가나 표시</div>
            <div className="hint small muted">끄면 한자를 탭했을 때만 읽기가 보여요</div>
          </div>
          <Switch checked={s.furigana} onChange={(v) => setSettings({ furigana: v })} />
        </div>
        <div className="switch-row">
          <div>
            <div style={{ fontWeight: 900 }}>효과음 · 자동 발음</div>
            <div className="hint small muted">정답 확인 후 문장을 읽어 줘요</div>
          </div>
          <Switch checked={s.sound} onChange={(v) => setSettings({ sound: v })} />
        </div>
        {canSpeak() && (
          <div className="field">
            <label>발음 속도 ({s.ttsRate.toFixed(1)}x)</label>
            <div className="row">
              <input
                type="range"
                min={0.6}
                max={1.3}
                step={0.1}
                value={s.ttsRate}
                onChange={(e) => setSettings({ ttsRate: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <button className="btn small blue" onClick={() => speak('きょうも いっしょに がんばりましょう')}>
                🔊 테스트
              </button>
            </div>
            <div className="hint">기기에 일본어 음성이 없으면 소리가 안 나거나 어색할 수 있어요.</div>
          </div>
        )}
        {!inClaude && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label>화면 테마 (이 기기)</label>
          <div className="seg" style={{ margin: 0 }}>
            {(
              [
                ['system', '시스템'],
                ['light', '라이트'],
                ['dark', '다크'],
              ] as [Theme, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                className={theme === v ? 'on' : ''}
                onClick={() => {
                  setTheme(v);
                  local.set('nd.theme', v);
                  applyTheme(v);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {inClaude ? (
        <>
          <div className="h2">☁️ Claude 계정 연동</div>
          <div className="card">
            <div style={{ fontWeight: 800 }}>
              {sync.state === 'error' ? '⚠️ ' + sync.message : '✓ 학습 기록이 내 Claude 계정에 자동 저장돼요'}
            </div>
            <div className="small muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
              claude.ai에 로그인한 PC·폰 어디서 열어도 이어서 할 수 있어요. AI 회화는 내 Claude 사용량으로 동작하고, API 키는 필요 없어요.
            </div>
            <button className="btn small blue" style={{ marginTop: 12 }} onClick={() => syncNow()} disabled={sync.state === 'syncing'}>
              {sync.state === 'syncing' ? '저장 중…' : '지금 저장'}
            </button>
          </div>
        </>
      ) : (
        <>
      <div className="h2">☁️ 기기 간 동기화 (GitHub Gist)</div>
      <div className="card">
        {token ? (
          <>
            <div className="row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>연결됨 · {mask(token)}</div>
                <div className="small" style={{ marginTop: 4 }}>
                  {sync.state === 'syncing' && <span className="muted">동기화 중…</span>}
                  {sync.state === 'idle' && (
                    <span className="status-ok">✓ {sync.at ? `${new Date(sync.at).toLocaleTimeString()} 동기화됨` : '대기 중'}</span>
                  )}
                  {sync.state === 'error' && <span className="status-bad">⚠️ {sync.message}</span>}
                </div>
              </div>
              <button className="btn small blue" onClick={() => syncNow()} disabled={sync.state === 'syncing'}>
                지금 동기화
              </button>
            </div>
            <button
              className="btn ghost plain small"
              style={{ marginTop: 12 }}
              onClick={() => {
                void askConfirm({ title: '동기화를 해제할까요?', body: '이 기기에서만 해제돼요. Gist와 학습 기록은 그대로 남아요.', ok: '해제' }).then((ok) => {
                  if (!ok) return;
                  setToken(null);
                  force((n) => n + 1);
                });
              }}
            >
              연결 해제
            </button>
          </>
        ) : (
          <>
            <div className="small muted" style={{ lineHeight: 1.7 }}>
              GitHub 토큰을 넣으면 학습 기록이 <b>내 계정의 비공개 Gist</b>에 저장되어 PC·폰에서 이어서 할 수 있어요. 각 기기에서 같은 토큰을 한 번씩 입력하세요.
            </div>
            <ol className="small muted" style={{ lineHeight: 1.7, paddingLeft: 20 }}>
              <li>
                <a href="https://github.com/settings/tokens/new?scopes=gist&description=nihongo-daily" target="_blank" rel="noreferrer">
                  github.com → 토큰 만들기
                </a>{' '}
                (Classic, <b>gist</b> 권한만 체크)
              </li>
              <li>만료 기간을 정하고 Generate → 토큰 복사</li>
              <li>아래에 붙여넣고 저장</li>
            </ol>
            <div className="row">
              <input
                className="input"
                type="password"
                placeholder="ghp_… 또는 github_pat_…"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                autoComplete="off"
              />
              <button
                className="btn small"
                disabled={!tokenInput.trim()}
                onClick={() => {
                  setToken(tokenInput);
                  setTokenInput('');
                  force((n) => n + 1);
                }}
              >
                저장
              </button>
            </div>
            <div className="hint small muted" style={{ marginTop: 8 }}>
              토큰은 이 브라우저에만 저장되고 GitHub API 외에는 어디에도 보내지 않아요.
            </div>
          </>
        )}
      </div>

      <div className="h2">🤖 AI 회화 (Anthropic API 키)</div>
      <div className="card">
        {apiKey ? (
          <div className="row">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900 }}>설정됨 · {mask(apiKey)}</div>
              <div className="small muted">모델: {MODEL}</div>
            </div>
            <button
              className="btn ghost plain small"
              onClick={() => {
                setApiKey(null);
                force((n) => n + 1);
              }}
            >
              삭제
            </button>
          </div>
        ) : (
          <>
            <div className="small muted" style={{ lineHeight: 1.7 }}>
              AI 채점은 사용자 본인의 Anthropic API 키로 동작해요 (claude.ai 구독과는 별개).{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
                console.anthropic.com
              </a>
              에서 키를 만들고 크레딧을 충전하세요. 채점 1회 대략 10원 안팎.
              <br />
              API 키 없이 쓰려면{' '}
              <a href={CLAUDE_APP_URL} target="_blank" rel="noreferrer">
                claude.ai 버전
              </a>
              을 여세요. 내 Claude 계정 사용량으로 채점하고, 기록도 계정에 저장돼요.
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                type="password"
                placeholder="sk-ant-…"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                autoComplete="off"
              />
              <button
                className="btn small"
                disabled={!keyInput.trim()}
                onClick={() => {
                  setApiKey(keyInput);
                  setKeyInput('');
                  force((n) => n + 1);
                }}
              >
                저장
              </button>
            </div>
            <div className="hint small muted" style={{ marginTop: 8 }}>
              키는 이 기기의 브라우저에만 저장돼요. 동기화되지 않으니 기기마다 입력해 주세요. 공용 PC에서는 사용 후 삭제하세요.
            </div>
          </>
        )}
      </div>
        </>
      )}

      <div className="h2">데이터</div>
      <div className="card">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {!inClaude && (
          <button className="btn small ghost" onClick={exportData}>
            ⬇️ 백업 내보내기
          </button>
          )}
          <button className="btn small ghost" onClick={() => fileRef.current?.click()}>
            ⬆️ 백업 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </div>
        <button
          className="btn small red"
          style={{ marginTop: 14 }}
          onClick={() => {
            void askConfirm({
              title: '모든 학습 기록을 지울까요?',
              body: '되돌릴 수 없어요. 동기화 중이면 다른 기기에도 반영될 수 있어요.',
              ok: '전부 지우기',
              danger: true,
            }).then((ok) => ok && resetProgress());
          }}
        >
          학습 기록 초기화
        </button>
      </div>

      <div className="muted small" style={{ textAlign: 'center', margin: '24px 0 8px', lineHeight: 1.7 }}>
        단어 {content.words.length} · 문법 {content.grammar.length} · 문장 {content.phrases.length} · AI 문제 {content.situations.length + content.opinions.length + content.roleplays.length}
        <br />
        예문은 드라마·만화·소설 등의 말투를 참고해 새로 쓴 창작 문장이에요.
      </div>
    </div>
  );
}
