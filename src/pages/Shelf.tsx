import { Avatar } from '../components/Avatar';
import { JP, Speak } from '../components/JP';
import type { Content } from '../lib/content';
import { MEDIUM_GROUP, type MediumGroup } from '../lib/content';
import { toggleSavedLine } from '../lib/story';
import { useProgress } from '../lib/store';
import { TodayYouTube } from './Home';
import { Library } from './Library';

/** 도서관: famous lines, saved story lines, the full word search and video picks. */
export function Shelf({ content, sub, go }: { content: Content; sub: string; go: (r: string) => void }) {
  const p = useProgress();
  if (sub === 'search') return <Library content={content} />;
  const saved = p.story?.saved ?? [];
  const groups = Object.keys(MEDIUM_GROUP) as MediumGroup[];
  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="h1">도서관</div>
      <div className="small muted" style={{ marginBottom: 14 }}>
        부실 책장. 명대사, 스토리에서 저장한 대사, 전체 단어장, 추천 영상이 여기 있어요.
      </div>

      <section className="section" style={{ marginBottom: 14 }}>
        <header className="section-head">
          <Avatar id="shizuku" size={44} />
          <div style={{ flex: 1 }}>
            <h2>명대사 극장</h2>
            <div className="section-meta">원작 출처와 함께 배우는 애니·드라마·소설 대사 {content.quotes.length}개</div>
          </div>
        </header>
        <div className="quote-tiles">
          {groups.map((g) => (
            <button key={g} className="quote-tile" onClick={() => go(`quotes-${g}`)}>
              <div className="qt-cat">
                {MEDIUM_GROUP[g].icon} {MEDIUM_GROUP[g].label}
              </div>
              <div className="qt-src">{content.quotes.filter((q) => MEDIUM_GROUP[g].media.includes(q.medium)).length}개</div>
              <div className="qt-more">열기 →</div>
            </button>
          ))}
        </div>
      </section>

      <section className="section" style={{ marginBottom: 14 }}>
        <header className="section-head">
          <span className="section-icon">★</span>
          <div style={{ flex: 1 }}>
            <h2>저장한 대사</h2>
            <div className="section-meta">스토리에서 ★를 누른 대사 {saved.length}개</div>
          </div>
        </header>
        {saved.length === 0 ? (
          <div className="small muted">스토리를 보다가 대사창의 ★를 누르면 여기에 모여요.</div>
        ) : (
          saved.slice(0, 50).map((l) => (
            <div key={l.id} className="saved-line">
              <div className="small" style={{ fontWeight: 800 }}>
                {l.who || '지문'} <span className="muted">· {l.ep}</span>
              </div>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <JP text={l.jp} />
                  <div className="small muted">{l.ko}</div>
                </div>
                <Speak jtext={l.jp} small />
                <button className="icon-btn" onClick={() => toggleSavedLine(l)} aria-label="저장 취소">
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <button className="course" style={{ width: '100%', marginBottom: 14, ['--c' as string]: 'var(--primary)' }} onClick={() => go('library-search')}>
        <div className="course-title">📇 전체 단어장 검색</div>
        <div className="course-sub">
          단어 {content.words.length} · 문법 {content.grammar.length} · 문장 {content.phrases.length}
        </div>
      </button>

      <TodayYouTube content={content} />
    </div>
  );
}
