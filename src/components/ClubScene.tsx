import { useLayoutEffect, useRef, useState } from 'react';
import { CAST, LINES, type MemberId, SPEAKER, membersFor } from '../lib/cast';
import { today } from '../lib/date';
import { claimable } from '../lib/missions';
import { CHIBI_H, FOCUS_X, ROOM_LINES, SCENE_H, SCENE_W, SPOTS, STANDS, type SpotKey } from '../lib/scene';
import { storyYear } from '../lib/story';
import { dueItems, streak, totalXp, useProgress } from '../lib/store';
import { type PanelActions, RoomPanel } from './RoomPanel';
import { JP } from './JP';

const BASE = import.meta.env.BASE_URL;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

type Line = { jp: string; ko: string };

/** Lines a member can say in the room: their room line first, then their lines from cast.ts. */
function linesOf(id: MemberId): Line[] {
  const out: Line[] = [ROOM_LINES[id]];
  for (const kind of ['greet', 'greetMorning', 'study', 'quotes', 'talk'] as const) {
    LINES[kind].forEach((l, i) => SPEAKER[kind][i] === id && out.push(l));
  }
  return out;
}

const isEvening = () => {
  const h = new Date().getHours();
  return h >= 17 || h < 5;
};

/** The club room as a 2D pixel-art game screen: tap furniture to open its panel, tap members to chat. */
export function ClubScene({
  actions,
  greet,
  onDash,
  onProfile,
  onLeave,
}: {
  actions: PanelActions;
  greet: { member: { id: MemberId }; line: Line };
  onDash: () => void;
  onProfile: (id: MemberId) => void;
  onLeave: () => void;
}) {
  const p = useProgress();
  const d = today();
  const [panel, setPanel] = useState<SpotKey | null>(null);
  const [speaker, setSpeaker] = useState<{ id: MemberId; line: Line; n: number }>({ id: greet.member.id, line: greet.line, n: 0 });
  const [showKo, setShowKo] = useState(false);
  const [labels, setLabels] = useState(false);
  const [roomOk, setRoomOk] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const [evening] = useState(isEvening);
  const [openedAt] = useState(() => Date.now());

  const members = membersFor(storyYear(p)).slice(0, STANDS.length);
  const st = streak(p);
  const missionsReady = claimable(p, d);
  const due = dueItems(p, d).filter((id) => actions.content.byId.has(id)).length;
  const examToday = !!p.exams?.[d] && Object.keys(p.exams[d]).length > 0;
  const newAch = Object.values(p.ach ?? {}).some((t) => openedAt - t < 86400000);

  const badge: Partial<Record<SpotKey, string>> = {
    desk: examToday ? '' : '!',
    whiteboard: missionsReady ? String(missionsReady) : '',
    figures: newAch ? 'NEW' : '',
    bookshelf: due ? String(due) : '',
  };

  // start narrow screens centered on the desk
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (FOCUS_X / SCENE_W) * el.scrollWidth - el.clientWidth / 2;
  }, []);

  const talkTo = (id: MemberId) => {
    const lines = linesOf(id);
    const n = speaker.id === id ? speaker.n + 1 : 0;
    setSpeaker({ id, line: lines[n % lines.length], n });
    setShowKo(false);
  };

  // anything that leaves the room (exam, lesson, other page, story) closes the panel first
  const closing = <A extends unknown[]>(fn: (...a: A) => void) => (...a: A) => {
    setPanel(null);
    fn(...a);
  };
  const panelActions: PanelActions = {
    ...actions,
    go: closing(actions.go),
    play: closing(actions.play),
    start: closing(actions.start),
    startExam: closing(actions.startExam),
  };

  const roomSrc = `${BASE}pixel/room_${evening ? 'evening' : 'day'}.webp`;
  const who = CAST[speaker.id];

  return (
    <div className="club-scene">
      <div className="cs-hud">
        <span className="cs-chip">🔥 {st.days}일</span>
        <span className="cs-chip">⚡ {totalXp(p)}</span>
        <button className="cs-chip btn-chip" onClick={() => setPanel('whiteboard')}>
          📋 미션 {missionsReady ? <b className="cs-dot">{missionsReady}</b> : null}
        </button>
        <span className="spacer" />
        <button className={`cs-chip btn-chip ${labels ? 'on' : ''}`} onClick={() => setLabels(!labels)} aria-pressed={labels}>
          🔍 둘러보기
        </button>
        <button className="cs-chip btn-chip" onClick={onDash} aria-label="학습 현황">
          📊
        </button>
        <button className="cs-chip btn-chip" onClick={onLeave} aria-label="타이틀 그림 보기">
          🖼
        </button>
      </div>

      <div className="cs-scroll" ref={scroller}>
        <div className={`cs-stage ${labels ? 'show-labels' : ''}`}>
          {roomOk ? (
            <img className="cs-room" src={roomSrc} alt="부실 305호" onError={() => setRoomOk(false)} draggable={false} />
          ) : (
            <div className="cs-room fallback" />
          )}

          {SPOTS.map((s) => (
            <button
              key={s.key}
              className={`cs-spot spot-${s.key}`}
              style={{ left: pct(s.x, SCENE_W), top: pct(s.y, SCENE_H), width: pct(s.w, SCENE_W), height: pct(s.h, SCENE_H) }}
              onClick={() => setPanel(s.key)}
              aria-label={s.label}
            >
              <span className="cs-label">
                {s.icon} {s.label}
              </span>
              {badge[s.key] && <span className="cs-badge">{badge[s.key]}</span>}
            </button>
          ))}

          {members.map((id, i) => {
            const at = STANDS[i];
            return (
              <button
                key={id}
                className={`cs-chibi ${speaker.id === id ? 'talking' : ''}`}
                style={{ left: pct(at.x, SCENE_W), top: pct(at.y, SCENE_H), height: `${CHIBI_H * 100}%`, zIndex: 2 + Math.round(at.y / 10), animationDelay: `${(i % 4) * -0.35}s` }}
                onClick={() => talkTo(id)}
                aria-label={`${CAST[id].name_ko}에게 말 걸기`}
              >
                <img src={`${BASE}pixel/chibi_${id}.webp`} alt="" draggable={false} />
                <span className="cs-name">{CAST[id].name_ko.split(' ').pop()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cs-vn" onClick={() => setShowKo(!showKo)}>
        <button
          className="cs-vn-name"
          style={{ ['--c' as string]: who.color }}
          onClick={(e) => {
            e.stopPropagation();
            onProfile(speaker.id);
          }}
          title="프로필 보기"
        >
          {who.name}
        </button>
        <div className="cs-vn-line">
          <JP text={speaker.line.jp} />
        </div>
        <div className="cs-vn-ko">{showKo ? speaker.line.ko : '탭하면 해석 · 부원을 누르면 대화'}</div>
        <span className="cs-vn-next" aria-hidden>
          ▼
        </span>
      </div>

      {panel && <RoomPanel spot={panel} actions={panelActions} onClose={() => setPanel(null)} />}
    </div>
  );
}
