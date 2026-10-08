import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ArtContext } from './components/Avatar';
import { FlashcardSession } from './components/Flashcards';
import { Lesson } from './components/Lesson';
import { ConfirmHost } from './components/confirm';
import { type Content, loadContent } from './lib/content';
import type { Session } from './lib/sessions';
import { streak, useProgress } from './lib/store';
import { syncNow, useSyncStatus } from './lib/sync';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Notes } from './pages/Notes';
import { Quotes } from './pages/Quotes';
import { Settings } from './pages/Settings';
import { Study } from './pages/Study';

// The AI screen carries the Anthropic SDK, so load it only when opened.
const AiPractice = lazy(() => import('./pages/AiPractice').then((m) => ({ default: m.AiPractice })));

const TABS = [
  { key: 'home', icon: '🏠', label: '부실' },
  { key: 'study', icon: '📚', label: '공부' },
  { key: 'notes', icon: '🔁', label: '복습' },
  { key: 'ai', icon: '🗣️', label: '회화' },
  { key: 'settings', icon: '⚙️', label: '설정' },
] as const;

const PAGES = ['home', 'study', 'notes', 'ai', 'settings', 'library', 'quotes'] as const;
type Page = (typeof PAGES)[number];

/** Routes are bare hash tokens (`#study-n3-words`): page, then an optional sub-page after the first dash. */
function readRoute(): { page: Page; sub: string } {
  const h = location.hash.replace(/^#\/?/, '');
  const [head, ...rest] = h.split('-');
  const page = (PAGES as readonly string[]).includes(head) ? (head as Page) : 'home';
  return { page, sub: page === head ? rest.join('-') : '' };
}

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState('');
  const [route, setRoute] = useState(readRoute);
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<string[] | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadContent()
      .then(setContent)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    // the hardware/browser back button closes an open lesson instead of leaving the app
    const onPop = () => {
      setSession(null);
      setCards(null);
    };
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

  const pushOverlay = () => {
    try {
      history.pushState({ lesson: true }, '');
    } catch {
      /* history may be locked down in embedded viewers; the close button still works */
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const start = useCallback((s: Session | null) => {
    if (!s) return showToast('지금은 할 수 있는 항목이 없어요');
    pushOverlay();
    setSession(s);
  }, []);

  const startCards = useCallback((ids: string[]) => {
    if (!ids.length) return showToast('넘길 카드가 없어요');
    pushOverlay();
    setCards(ids);
  }, []);

  const closeOverlay = useCallback(() => {
    if (history.state?.lesson) history.back();
    else {
      setSession(null);
      setCards(null);
    }
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
        부원들을 깨우는 중…
      </div>
    );

  const { page, sub } = route;
  const tab = page === 'library' ? 'study' : page === 'quotes' ? 'home' : page;

  return (
    <ArtContext.Provider value={content.characters}>
      <div className="app">
        <TopBar tab={tab} go={go} />
        {page === 'home' && <Home content={content} start={start} go={go} />}
        {page === 'study' && <Study content={content} sub={sub} go={go} start={start} startCards={startCards} />}
        {page === 'quotes' && <Quotes content={content} sub={sub} go={go} />}
        {page === 'library' && <Library content={content} />}
        {page === 'notes' && <Notes content={content} start={start} />}
        {page === 'ai' && (
          <Suspense fallback={<div className="empty">불러오는 중…</div>}>
            <AiPractice content={content} go={go} />
          </Suspense>
        )}
        {page === 'settings' && <Settings content={content} />}

        <nav className="tabbar">
          <div className="tabbar-inner">
            {TABS.map((t) => (
              <button key={t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => go(t.key)}>
                <span className="ico">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {session && (
          <Lesson
            key={session.title + session.exercises.length}
            title={session.title}
            exercises={session.exercises}
            content={content}
            onFinish={session.onFinish}
            onExit={closeOverlay}
          />
        )}
        {cards && <FlashcardSession key={cards.join()} ids={cards} content={content} onExit={closeOverlay} />}
        {toast && <div className="toast">{toast}</div>}
        <ConfirmHost />
      </div>
    </ArtContext.Provider>
  );
}

function TopBar({ tab, go }: { tab: string; go: (r: string) => void }) {
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
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => go(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
        <span className={`stat fire ${s.todayDone ? '' : 'cold'}`} title={s.todayDone ? '연속 학습일' : '오늘 학습하면 불이 붙어요'}>
          🔥 {s.days}일
        </span>
        {syncIcon && (
          <button className={`sync-dot ${sync.state === 'syncing' ? 'spin' : ''}`} title={sync.state === 'error' ? sync.message : '동기화'} onClick={() => syncNow()}>
            {syncIcon}
          </button>
        )}
      </div>
    </header>
  );
}
