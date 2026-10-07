import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Lesson } from './components/Lesson';
import { ConfirmHost } from './components/confirm';
import { type Content, loadContent } from './lib/content';
import type { Session } from './lib/sessions';
import { streak, useProgress } from './lib/store';
import { syncNow, useSyncStatus } from './lib/sync';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Notes } from './pages/Notes';
import { Settings } from './pages/Settings';

// The AI screen carries the Anthropic SDK, so load it only when opened.
const AiPractice = lazy(() => import('./pages/AiPractice').then((m) => ({ default: m.AiPractice })));

const TABS = [
  { key: 'home', icon: '🏠', label: '오늘' },
  { key: 'library', icon: '📚', label: '단어장' },
  { key: 'notes', icon: '🔁', label: '복습노트' },
  { key: 'ai', icon: '🗣️', label: '회화' },
  { key: 'settings', icon: '⚙️', label: '설정' },
] as const;
type Route = (typeof TABS)[number]['key'];

function readRoute(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  return (TABS.find((t) => t.key === h)?.key ?? 'home') as Route;
}

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<Route>(readRoute);
  const [session, setSession] = useState<Session | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadContent()
      .then(setContent)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    // the hardware/browser back button closes an open lesson instead of leaving the app
    const onPop = () => setSession(null);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  const go = useCallback((r: string) => {
    // bare #token form: the only hash an Artifact link keeps
    location.hash = r;
    window.scrollTo(0, 0);
  }, []);

  const start = useCallback((s: Session | null) => {
    if (!s) {
      setToast('지금은 할 수 있는 항목이 없어요');
      setTimeout(() => setToast(''), 2200);
      return;
    }
    try {
      history.pushState({ lesson: true }, '');
    } catch {
      /* history may be locked down in embedded viewers; the close button still works */
    }
    setSession(s);
  }, []);

  const closeLesson = useCallback(() => {
    if (history.state?.lesson) history.back();
    else setSession(null);
  }, []);

  if (error)
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <div className="big">😵</div>
        콘텐츠를 불러오지 못했어요.
        <div className="small">{error}</div>
        <button className="btn" style={{ marginTop: 16 }} onClick={() => location.reload()}>
          다시 시도
        </button>
      </div>
    );
  if (!content)
    return (
      <div className="empty" style={{ paddingTop: 120 }}>
        <div className="big">😴</div>
        단어들을 깨우는 중…
      </div>
    );

  return (
    <div className="app">
      <TopBar route={route} go={go} />
      {route === 'home' && <Home content={content} start={start} go={go} />}
      {route === 'library' && <Library content={content} />}
      {route === 'notes' && <Notes content={content} start={start} />}
      {route === 'ai' && (
        <Suspense fallback={<div className="empty">불러오는 중…</div>}>
          <AiPractice content={content} go={go} />
        </Suspense>
      )}
      {route === 'settings' && <Settings content={content} />}

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${route === t.key ? 'on' : ''}`} onClick={() => go(t.key)}>
              <span className="ico">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {session && (
        <Lesson key={session.title + session.exercises.length} title={session.title} exercises={session.exercises} content={content} onFinish={session.onFinish} onExit={closeLesson} />
      )}
      {toast && <div className="toast">{toast}</div>}
      <ConfirmHost />
    </div>
  );
}

function TopBar({ route, go }: { route: Route; go: (r: string) => void }) {
  const p = useProgress();
  const sync = useSyncStatus();
  const s = streak(p);
  const syncIcon = sync.state === 'off' ? null : sync.state === 'syncing' ? '🔄' : sync.state === 'error' ? '⚠️' : '☁️';
  return (
    <header className="topbar">
      <div className="topbar-inner">
      <button className="brand" onClick={() => go('home')}>
        <span className="hanko">日</span>
        にほんご Daily
      </button>
      <nav className="top-nav">
        {TABS.map((t) => (
          <button key={t.key} className={route === t.key ? 'on' : ''} onClick={() => go(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>
      <span className={`stat fire ${s.todayDone ? '' : 'cold'}`} title={s.todayDone ? '연속 학습일' : '오늘 학습하면 불이 붙어요'}>
        🔥 {s.days}일
      </span>
      {syncIcon && (
        <button
          className={`sync-dot ${sync.state === 'syncing' ? 'spin' : ''}`}
          title={sync.state === 'error' ? sync.message : '동기화'}
          onClick={() => syncNow()}
        >
          {syncIcon}
        </button>
      )}
      </div>
    </header>
  );
}
