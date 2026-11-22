import { useEffect, useState } from 'react';
import { achievements } from '../lib/achievements';
import { formatKo, today } from '../lib/date';
import { levelLabel, levelProgress } from '../lib/level';
import { MISSION_XP, claim, claimed, goToMission, missionsFor } from '../lib/missions';
import type { SpotKey } from '../lib/scene';
import { dueItems, streak, totalXp, useProgress } from '../lib/store';
import type { PanelActions } from './RoomPanel';

const clock = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

/** Right column of the club room: date, my level, today's missions, the next achievement and quick stats. */
export function ClubSidebar({ actions, evening, open }: { actions: PanelActions; evening: boolean; open: (s: SpotKey) => void }) {
  const p = useProgress();
  const d = today();
  const [time, setTime] = useState(clock);
  useEffect(() => {
    const t = setInterval(() => setTime(clock()), 30000);
    return () => clearInterval(t);
  }, []);

  const lp = levelProgress(p, actions.content);
  const st = streak(p);
  const ms = missionsFor(p, d);
  const doneCount = ms.filter((m) => claimed(p, d, m.id)).length;
  const due = dueItems(p, d).filter((id) => actions.content.byId.has(id)).length;
  const exams = p.exams?.[d] ?? {};
  const next = achievements(p)
    .filter((a) => !a.at)
    .sort((a, b) => b.value / b.goal - a.value / a.goal)[0];
  const level = p.settings.level === 'N1' ? 'N1' : 'N2';

  return (
    <div className="cs-side">
      <div className="px-card cs-clock">
        <span className="cs-clock-icon" aria-hidden>
          {evening ? '🌇' : '☀️'}
        </span>
        <span className="cs-clock-body">
          <b>{formatKo(d)}</b>
          <span className="cs-clock-time">{time}</span>
        </span>
        <span className="cs-clock-place">📍 부실 305</span>
      </div>

      <section className="px-card">
        <h3 className="px-title">🎓 내 일본어 레벨</h3>
        <div className="cs-level">{levelLabel(lp)}</div>
        <div className="cs-bars">
          {lp.map((x) => (
            <div key={x.level} className={`cs-bar lv-${x.level.toLowerCase()}`} title={`안정 ${x.solid} · 학습 중 ${x.learned - x.solid} / ${x.total}`}>
              <span className="cs-bar-name">{x.level}</span>
              <span className="cs-bar-track">
                <i className="solid" style={{ width: `${(x.solid / x.total) * 100}%` }} />
                <i className="learning" style={{ width: `${((x.learned - x.solid) / x.total) * 100}%` }} />
              </span>
              <span className="cs-bar-num">
                {x.learned}/{x.total}
              </span>
            </div>
          ))}
        </div>
        <div className="cs-stats">
          <span>🔥 {st.days}일 연속</span>
          <span>⚡ {totalXp(p).toLocaleString()} XP</span>
        </div>
      </section>

      <section className="px-card">
        <h3 className="px-title">
          📋 오늘의 미션 <span className="px-count">{doneCount}/{ms.length}</span>
        </h3>
        <ul className="cs-missions">
          {ms.map((m) => {
            const got = claimed(p, d, m.id);
            const ready = m.value >= m.goal;
            return (
              <li key={m.id} className={got ? 'got' : ready ? 'ready' : ''}>
                <span className="cs-check" aria-hidden>
                  {got ? '☑' : '☐'}
                </span>
                <span className="cs-m-text">
                  {m.title}
                  <small>
                    {m.value}/{m.goal}
                  </small>
                </span>
                {got ? null : ready ? (
                  <button
                    className="cs-m-btn claim"
                    onClick={() => {
                      const xp = claim(m, d);
                      if (xp) actions.toast(xp > MISSION_XP ? `🎉 올클리어! +${xp} XP` : `+${xp} XP`);
                    }}
                  >
                    받기
                  </button>
                ) : (
                  <button className="cs-m-btn" onClick={() => goToMission(m, actions, level)} aria-label={`${m.title} 하러 가기`}>
                    ▶
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {next && (
        <button className="px-card cs-next" onClick={() => open('figures')}>
          <h3 className="px-title">🏆 다음 업적</h3>
          <span className="cs-next-row">
            <span className="cs-next-icon">{next.icon}</span>
            <span className="cs-next-body">
              <b>{next.desc}</b>
              <span className="pbar thin">
                <i style={{ width: `${(next.value / next.goal) * 100}%` }} />
              </span>
              <small>
                {next.value} / {next.goal}
              </small>
            </span>
          </span>
        </button>
      )}

      <div className="cs-quick">
        <button className="px-card" onClick={() => open('bookshelf')}>
          <span>🔁 복습 대기</span>
          <b>{due}</b>
        </button>
        <button className="px-card" onClick={() => open('desk')}>
          <span>📝 오늘 시험</span>
          <b>{exams.N2 ? `${exams.N2.score}/${exams.N2.total}` : exams.N1 ? `${exams.N1.score}/${exams.N1.total}` : exams.N3 ? `${exams.N3.score}/${exams.N3.total}` : '—'}</b>
        </button>
      </div>
    </div>
  );
}
