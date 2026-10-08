import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ArtContext } from './components/Avatar';
import { FlashcardSession } from './components/Flashcards';
import { Lesson } from './components/Lesson';
import { StoryPlayer } from './components/StoryPlayer';
import { ConfirmHost } from './components/confirm';
import { type Content, loadContent } from './lib/content';
import type { Session } from './lib/sessions';
import { type Episode, loadEpisode, loadStoryIndex } from './lib/story';
import { streak, useProgress } from './lib/store';
import { syncNow, useSyncStatus } from './lib/sync';
import { Home } from './pages/Home';
import { Notes } from './pages/Notes';
import { Quotes } from './pages/Quotes';
import { Settings } from './pages/Settings';
import { Shelf } from './pages/Shelf';
import { Story } from './pages/Story';
import { Study } from './pages/Study';

// The 대화 screens carry the Anthropic SDK, so load them only when opened.
const Talk = lazy(() => import('./pages/Talk').then((m) => ({ default: m.Talk })));

const TABS = [
  { key: 'home', icon: '🏫', label: '부실' },
  { key: 'story', icon: '📖', label: '스토리' },
  { key: 'study', icon: '✏️', label: '자습' },
  { key: 'library', icon: '📚', label: '도서관' },
  { key: 'talk', icon: '💬', label: '대화' },
] as const;

const PAGES = ['home', 'story', 'study', 'library', 'talk', 'settings', 'notes', 'quotes', 'ai'] as const;
type Page = (typeof PAGES)[number];

/** Routes are bare hash tokens (`#study-n3-words`): page, then an optional sub-page after the first dash. */
function readRoute(): { page: Page; sub: string } {
  const h = location.hash.replace(/^#\/?/, '');
  const [head, ...rest] = h.split('-');
  let page = (PAGES as readonly string[]).includes(head) ? (head as Page) : 'home';
  let sub = page === head ? rest.join('-') : '';
  if (page === 'ai') {
    // old links to the AI screen
    page = 'talk';
    sub = 'practice';
  }
  return { page, sub };
}

const TAB_OF: Partial<Record<Page, string>> = { notes: 'study', quotes: 'library', settings: '' };

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState('');
  const [route, setRoute] = useState(readRoute);
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<string[] | null>(null);
  const [episode, setEpisode] = useState<{ ep: Episode; hasNext: boolean } | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadContent()
      .then(setContent)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    // the hardware/browser back button closes an open overlay instead of leaving the app
    const onPop = () => {
      setSession(null);
      setCards(null);
      setEpisode(null);
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
      if (!history.state?.lesson) history.pushState({ lesson: true }, '');
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

  const play = useCallback(async (id: string) => {
    try {
      const [ep, list] = await Promise.all([loadEpisode(id), loadStoryIndex()]);
      const i = list.findIndex((e) => e.id === id);
      pushOverlay();
      setEpisode({ ep, hasNext: i >= 0 && i + 1 < list.length });
    } catch (e) {
      showToast((e as Error).message);
    }
  }, []);

  const playNext = useCallback(async () => {
    if (!episode) return;
    const list = await loadStoryIndex();
    const i = list.findIndex((e) => e.id === episode.ep.id);
    const next = list[i + 1];
    if (!next) return;
    const ep = await loadEpisode(next.id);
    setEpisode({ ep, hasNext: i + 2 < list.length });
  }, [episode]);

  const closeOverlay = useCallback(() => {
    if (history.state?.lesson) history.back();
    else {
      setSession(null);
      setCards(null);
      setEpisode(null);
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
  const tab = TAB_OF[page] ?? page;

  return (
    <ArtContext.Provider value={content.characters}>
      <div className="app">
        <TopBar tab={tab} go={go} />
        {page === 'home' && <Home content={content} start={start} go={go} play={play} />}
        {page === 'story' && <Story content={content} play={play} />}
        {page === 'study' && <Study content={content} sub={sub} go={go} start={start} startCards={startCards} />}
        {page === 'library' && <Shelf content={content} sub={sub} go={go} />}
        {page === 'quotes' && <Quotes content={content} sub={sub} go={go} />}
        {page === 'notes' && <Notes content={content} start={start} />}
        {page === 'talk' && (
          <Suspense fallback={<div className="empty">불러오는 중…</div>}>
            <Talk content={content} sub={sub} go={go} />
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
        {episode && <StoryPlayer key={episode.ep.id} ep={episode.ep} content={content} hasNext={episode.hasNext} onExit={closeOverlay} onNext={playNext} />}
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
        <button className={`sync-dot ${tab === '' ? 'on' : ''}`} onClick={() => go('settings')} aria-label="설정" title="설정">
          ⚙️
        </button>
      </div>
    </header>
  );
}
