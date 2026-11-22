import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CAST, LINES, type MemberId, SPEAKER, gradeOf, membersFor } from '../lib/cast';
import { today } from '../lib/date';
import { claimable } from '../lib/missions';
import { CHIBI_H, DRAWN, FOCUS_X, ROOM_LINES, SCENE_H, SCENE_W, SPOTS, STAND, type SpotKey, depthScale } from '../lib/scene';
import { storyYear } from '../lib/story';
import { dueItems, useProgress } from '../lib/store';
import { ClubSidebar } from './ClubSidebar';
import { JP } from './JP';
import { type PanelActions, RoomPanel } from './RoomPanel';
import { spriteUrl } from './Stage';

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

/** Wide screens keep the furniture panel in the right column; phones open it as a sheet. */
function useWide(): boolean {
  const q = '(min-width: 720px)';
  const [wide, setWide] = useState(() => typeof matchMedia === 'function' && matchMedia(q).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

function Chibi({ id }: { id: MemberId }) {
  return <img className="f0 single" src={`${BASE}pixel/chibi_${id}.webp`} alt="" draggable={false} />;
}


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
  const wide = useWide();
  const [panel, setPanel] = useState<SpotKey | null>(null);
  const [speaker, setSpeaker] = useState<{ id: MemberId; line: Line; n: number }>({ id: greet.member.id, line: greet.line, n: 0 });
  const [showKo, setShowKo] = useState(false);
  const [labels, setLabels] = useState(false);
  const [roomOk, setRoomOk] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const [evening] = useState(isEvening);
  const [openedAt] = useState(() => Date.now());

  const year = storyYear(p);
  const members = membersFor(year);
  // members drawn into the room art for this year, if that art exists
  const drawn = DRAWN[year as 1 | 2 | 3];
  const missionsReady = claimable(p, d);
  const due = dueItems(p, d).filter((id) => actions.content.byId.has(id)).length;
  const examToday = !!p.exams?.[d] && Object.keys(p.exams[d]).length > 0;
  const newAch = Object.values(p.ach ?? {}).some((t) => openedAt - t < 86400000);

  /** what each floating icon calls out: '!' = something to do now, a number = how many */
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

  const time = evening ? 'evening' : 'day';
  const roomSrc = drawn ? `${BASE}pixel/room_${time}_y${year}.webp` : `${BASE}pixel/room_${time}.webp`;
  const who = CAST[speaker.id];
  const portrait = spriteUrl(actions.content.art, speaker.id, 'happy') ?? spriteUrl(actions.content.art, speaker.id);
  const speakerOnStage = members.includes(speaker.id);

  return (
    <div className={`club-scene ${evening ? 'evening' : ''}`}>
      {/* left: the selected member */}
      <aside className="cs-left px-card" style={{ ['--c' as string]: who.color }}>
        <div className="cs-portrait">{portrait && <img key={speaker.id} src={portrait} alt={who.name_ko} />}</div>
        <button className="cs-nameplate" onClick={() => onProfile(speaker.id)} title="프로필 보기">
          <b>{who.name}</b>
          <small>
            {who.name_ko} · {gradeOf(speaker.id, year)}
          </small>
        </button>
        <div className="cs-role">{who.role}</div>
        <button className="cs-say" onClick={() => setShowKo(!showKo)}>
          <span className="cs-say-jp">
            <JP text={speaker.line.jp} />
          </span>
          <span className="cs-say-ko">{showKo ? speaker.line.ko : '탭하면 해석'}</span>
        </button>
      </aside>

      {/* center: the room */}
      <div className="cs-center">
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
                className={`cs-spot spot-${s.key} ${panel === s.key ? 'on' : ''}`}
                style={{ left: pct(s.x, SCENE_W), top: pct(s.y, SCENE_H), width: pct(s.w, SCENE_W), height: pct(s.h, SCENE_H) }}
                onClick={() => setPanel(s.key)}
                aria-label={s.label}
                tabIndex={-1}
              />
            ))}

            {drawn &&
              members.map((id) => {
                const b = drawn[id];
                if (!b) return null;
                const talking = speaker.id === id;
                return (
                  <button
                    key={id}
                    className={`cs-drawn ${talking ? 'talking' : ''}`}
                    style={{
                      left: pct(b.x, SCENE_W),
                      top: pct(b.y, SCENE_H),
                      width: pct(b.w, SCENE_W),
                      height: pct(b.h, SCENE_H),
                      // the one talking goes above the furniture icons so the bubble stays readable
                      zIndex: talking ? 300 : 2 + Math.round((b.y + b.h) / 10),
                    }}
                    onClick={() => talkTo(id)}
                    aria-label={`${CAST[id].name_ko}에게 말 걸기`}
                  >
                    {talking && (
                      <span className="cs-bubble" aria-live="polite">
                        <JP text={speaker.line.jp} />
                      </span>
                    )}
                    <span className="cs-name">{CAST[id].name_ko.split(' ').pop()}</span>
                  </button>
                );
              })}

            {!drawn && members.map((id, i) => {
              const at = STAND[id];
              const talking = speaker.id === id;
              return (
                <button
                  key={id}
                  className={`cs-chibi ${talking ? 'talking' : ''}`}
                  style={{
                    left: pct(at.x, SCENE_W),
                    top: pct(at.y, SCENE_H),
                    height: `${CHIBI_H * depthScale(at.y) * 100}%`,
                    zIndex: talking ? 300 : 2 + Math.round(at.y / 10),
                    animationDelay: `${(i % 4) * -0.35}s`,
                  }}
                  onClick={() => talkTo(id)}
                  aria-label={`${CAST[id].name_ko}에게 말 걸기`}
                >
                  <span className="cs-shadow" aria-hidden />
                  <Chibi id={id} />
                  {talking && (
                    <span className="cs-bubble" aria-live="polite">
                      <JP text={speaker.line.jp} />
                    </span>
                  )}
                  <span className="cs-name">{CAST[id].name_ko.split(' ').pop()}</span>
                </button>
              );
            })}

            {SPOTS.map((s) => (
              <button
                key={`pin-${s.key}`}
                className={`cs-pin pin-${s.key} ${badge[s.key] ? 'hot' : ''} ${panel === s.key ? 'on' : ''}`}
                style={{ left: pct(s.pin.x, SCENE_W), top: pct(s.pin.y, SCENE_H) }}
                onClick={() => setPanel(s.key)}
                aria-label={s.label}
              >
                <span className="cs-pin-icon" aria-hidden>
                  {s.icon}
                </span>
                {badge[s.key] && <span className="cs-badge">{badge[s.key]}</span>}
                <span className="cs-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="cs-tools">
          <button className={`cs-tool ${labels ? 'on' : ''}`} onClick={() => setLabels(!labels)} aria-pressed={labels} title="이름표 보기">
            🔍
          </button>
          <button className="cs-tool" onClick={onDash} title="학습 현황">
            📊
          </button>
          <button className="cs-tool" onClick={onLeave} title="타이틀 그림 보기">
            🖼
          </button>
        </div>
        {!speakerOnStage && <div className="cs-hint">부원을 누르면 말을 걸어요</div>}
      </div>

      {/* right: status, or the open furniture panel on wide screens */}
      <aside className="cs-right">
        {panel && wide ? (
          <RoomPanel spot={panel} actions={panelActions} onClose={() => setPanel(null)} mode="inline" />
        ) : (
          <ClubSidebar actions={panelActions} evening={evening} open={setPanel} />
        )}
      </aside>

      {panel && !wide && <RoomPanel spot={panel} actions={panelActions} onClose={() => setPanel(null)} />}
    </div>
  );
}
