import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { JP } from '../components/JP';
import { bgUrl } from '../components/Stage';
import { CAST, membersFor } from '../lib/cast';
import type { Content } from '../lib/content';
import { type EpisodeMeta, MONTH_KO, affinity, isUnlocked, nextEpisode, playerName, setPlayer, storyYear, useStoryIndex } from '../lib/story';
import { useProgress } from '../lib/store';

const MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export function PlayerSetup({ onDone }: { onDone?: () => void }) {
  const p = useProgress();
  const [name, setName] = useState(p.story?.me?.name ?? '');
  const [gender, setGender] = useState<'m' | 'f' | 'n'>(p.story?.me?.gender ?? 'n');
  return (
    <div className="card">
      <div style={{ fontWeight: 800 }}>주인공 설정</div>
      <div className="small muted" style={{ margin: '4px 0 10px', lineHeight: 1.6 }}>
        한국에서 온 유학생. 한 살 많지만 1학년으로 입학했다. 부원들이 부를 이름(성)을 가타카나로 정해 주세요. 예: キム, イ, パク
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <input id="player-name" className="input" style={{ flex: 1, minWidth: 140 }} placeholder="キム" value={name} onChange={(e) => setName(e.target.value)} lang="ja" />
        <div className="seg" style={{ margin: 0, flex: 1, minWidth: 220 }}>
          {(
            [
              ['m', '남 (〜くん)'],
              ['f', '여 (〜さん)'],
              ['n', '선택 안 함'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} className={gender === v ? 'on' : ''} onClick={() => setGender(v)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn block"
        style={{ marginTop: 12 }}
        onClick={() => {
          setPlayer(name || 'キム', gender);
          onDone?.();
        }}
      >
        이 이름으로 시작
      </button>
    </div>
  );
}

function Thumb({ content, ep }: { content: Content; ep: EpisodeMeta }) {
  const url = bgUrl(content.art, ep.bg);
  return <div className={`ep-thumb bg-${ep.bg}`} style={url ? { backgroundImage: `url(${url})` } : undefined} />;
}

export function Story({ content, play }: { content: Content; play: (id: string) => void }) {
  const p = useProgress();
  const list = useStoryIndex();
  const [editName, setEditName] = useState(false);
  if (list === null) return <div className="page empty">스토리를 불러오는 중…</div>;

  const aff = affinity(p);
  const next = nextEpisode(list, p);
  const years = [...new Set(list.map((e) => e.year))];
  const needSetup = !p.story?.me?.u;

  return (
    <div className={`page ${p.settings.furigana ? '' : 'furi-off'}`}>
      <div className="h1">메인 스토리</div>
      <div className="small muted" style={{ marginBottom: 12 }}>
        1학년 4월부터 3학년 졸업까지. 대사는 일본어, 탭하면 한국어. 밑줄 친 표현은 눌러서 암기 카드에 저장할 수 있어요.
      </div>

      {needSetup || editName ? (
        <PlayerSetup onDone={() => setEditName(false)} />
      ) : (
        <div className="row small muted" style={{ marginBottom: 12 }}>
          주인공: <b className="jp">{playerName(p)}</b>
          <button className="link-btn" onClick={() => setEditName(true)}>
            바꾸기
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">
          <div className="big">✍️</div>첫 화를 집필 중이에요. 조금만 기다려 주세요!
        </div>
      ) : (
        <>
          {next && !needSetup && (
            <button className="continue-card" onClick={() => play(next.id)}>
              <Thumb content={content} ep={next} />
              <div className="continue-body">
                <div className="small">{p.story?.pos?.ep === next.id ? '▶ 이어하기' : '▶ 다음 화'}</div>
                <div className="continue-title">
                  {next.year}학년 {MONTH_KO[next.month]} · 第{next.no}話 <JP text={next.title} />
                </div>
                <div className="small">{next.title_ko}</div>
              </div>
            </button>
          )}

          <div className="h2">친밀도</div>
          <div className="aff-row">
            {membersFor(storyYear(p)).map((id) => {
              const n = aff[id] ?? 0;
              return (
                <div key={id} className="aff-item" title={`${CAST[id].name_ko} 친밀도 ${n}`}>
                  <Avatar id={id} size={40} />
                  <div className="aff-hearts">{'♥'.repeat(Math.min(5, Math.max(0, Math.floor(n / 2))))}<span className="muted">{'♡'.repeat(5 - Math.min(5, Math.max(0, Math.floor(n / 2))))}</span></div>
                </div>
              );
            })}
          </div>

          {years.map((y) => (
            <section key={y}>
              <div className="h2">{y}학년</div>
              {MONTH_ORDER.map((m) => {
                const eps = list.filter((e) => e.year === y && e.month === m);
                if (!eps.length) return null;
                return (
                  <div key={m} className="month">
                    <div className="month-title">{MONTH_KO[m]}</div>
                    {eps.map((e) => {
                      const done = !!p.story?.done[e.id];
                      const open = isUnlocked(list, e.id, p) && !needSetup;
                      return (
                        <button key={e.id} className={`ep-row ${done ? 'done' : ''}`} disabled={!open} onClick={() => play(e.id)}>
                          <Thumb content={content} ep={e} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ep-no">第{e.no}話 {done ? '· ✓ 완료' : !open ? '· 🔒' : p.story?.pos?.ep === e.id ? '· 진행 중' : ''}</div>
                            <div className="ep-title">
                              <JP text={e.title} />
                            </div>
                            <div className="small muted">{e.title_ko}</div>
                            {open && <div className="ep-summary">{e.summary_ko}</div>}
                            <div className="chips" style={{ marginTop: 4 }}>
                              {e.focus.slice(0, 3).map((f) => (
                                <span key={f} className="chip">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </section>
          ))}
          <div className="empty small">2학년 이야기는 집필 중이에요. 업데이트를 기다려 주세요!</div>
        </>
      )}
    </div>
  );
}
