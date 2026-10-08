import { createContext, useContext, type ReactNode } from 'react';
import { CAST, type Line, type Member, type MemberId } from '../lib/cast';
import { JP } from './JP';

/** File names found in public/characters (e.g. "hiyori.png"), provided by the app root. */
export const ArtContext = createContext<string[]>([]);

const SKIN = '#ffe2d2';
const UNIFORM = '#26324f';

function Hair({ id }: { id: MemberId }) {
  switch (id) {
    case 'minato':
      return (
        <>
          <path d="M24 50 C22 28 38 18 52 19 C68 20 79 31 76 50 C70 40 62 34 50 33 C42 37 33 41 24 50 Z" fill="#1f2a44" />
          <g fill="none" stroke="#1b1b1b" strokeWidth="2.2">
            <rect x="32" y="49" width="15" height="11" rx="4" />
            <rect x="53" y="49" width="15" height="11" rx="4" />
            <path d="M47 54 H53" />
          </g>
        </>
      );
    case 'ritsu':
      return (
        <>
          <path d="M23 60 C18 34 34 18 52 19 C70 20 82 34 77 60 L72 52 L70 60 L66 44 C58 40 48 44 40 38 L36 50 L32 42 L28 56 Z" fill="#17181d" />
          <rect x="38" y="78" width="24" height="4" rx="2" fill="#17181d" />
        </>
      );
    case 'saeko':
      return (
        <>
          <path d="M20 90 C12 62 18 24 50 21 C82 24 88 62 80 90 L74 90 C76 70 74 52 72 46 L28 46 C26 52 24 70 26 90 Z" fill="#6b1e33" />
          <path d="M25 52 C26 30 40 22 54 23 C68 25 77 36 75 52 C66 40 56 36 44 37 C36 40 30 45 25 52 Z" fill="#7c2540" />
          <rect x="47" y="66" width="18" height="2.4" rx="1.2" fill="#f2f2f2" transform="rotate(-12 56 67)" />
          <circle cx="66.5" cy="63.5" r="3" fill="#ff6f91" />
        </>
      );
    case 'hiyori':
      return (
        <>
          <circle cx="20" cy="60" r="11" fill="#f08fb4" />
          <circle cx="80" cy="60" r="11" fill="#f08fb4" />
          <path d="M25 54 C22 30 38 21 50 21 C64 21 79 30 75 54 C72 44 68 40 64 37 C60 43 54 42 50 38 C45 43 38 43 34 39 C30 43 27 48 25 54 Z" fill="#f4a3c4" />
          <circle cx="68" cy="27" r="4" fill="#ffd34d" />
        </>
      );
    case 'akane':
      return (
        <>
          <path d="M20 84 C12 58 20 24 50 21 C80 24 88 58 80 84 L74 84 C76 66 74 52 72 46 L28 46 C26 52 24 66 26 84 Z" fill="#c98a4b" />
          <path d="M25 54 C24 32 38 22 52 22 C67 23 78 33 75 52 C70 42 62 38 55 37 C50 44 40 48 25 54 Z" fill="#d99a58" />
          <path d="M66 24 L74 14 L71 26 Z" fill="#e0782b" />
          <rect x="64" y="25" width="9" height="4" rx="1.5" fill="#9aa3b5" />
        </>
      );
    case 'keita':
      return (
        <>
          <path d="M24 56 C20 30 36 18 52 19 C68 20 81 31 76 56 C72 46 66 42 60 41 L56 52 L52 42 L46 54 L42 42 C34 44 28 49 24 56 Z" fill="#2a2f2a" />
          <path d="M30 86 Q50 96 70 86" stroke="#e8c54a" strokeWidth="3.5" fill="none" />
        </>
      );
    case 'mei':
      return (
        <>
          <path d="M22 70 C14 44 26 20 50 20 C74 20 86 44 78 70 L72 64 C74 52 72 46 70 44 L30 44 C28 46 26 52 28 64 Z" fill="#2a1d1a" />
          <path d="M26 52 C26 32 38 22 52 22 C66 23 76 34 74 50 L26 50 Z" fill="#33231f" />
          <circle cx="24" cy="66" r="7" fill="#2a1d1a" />
          <circle cx="76" cy="66" r="7" fill="#2a1d1a" />
          <rect x="62" y="28" width="9" height="4" rx="2" fill="#d94f6b" />
        </>
      );
    case 'sota':
      return (
        <>
          <path d="M24 54 C20 30 36 17 52 18 C70 19 82 32 76 54 C72 42 64 36 54 36 C46 40 34 44 24 54 Z" fill="#6b4a2e" />
          <path d="M40 22 L46 12 L50 22 Z M54 21 L62 11 L62 23 Z" fill="#6b4a2e" />
        </>
      );
    case 'shizuku':
      return (
        <>
          <path d="M22 86 C14 60 18 26 50 22 C82 26 86 60 78 86 L72 86 C74 66 72 52 70 46 L30 46 C28 52 26 66 28 86 Z" fill="#2b2240" />
          <path d="M26 56 C26 34 38 24 52 24 C66 25 76 36 74 54 C68 46 60 42 50 42 C44 50 36 56 26 56 Z" fill="#33284d" />
        </>
      );
  }
}

function Face({ id }: { id: MemberId }) {
  const eye = (x: number, closedSmug = false) =>
    closedSmug ? (
      <path d={`M${x - 5} 56 Q${x} 51 ${x + 5} 56`} stroke="#2a2030" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    ) : (
      <>
        <ellipse cx={x} cy={56} rx={3.6} ry={4.6} fill="#2a2030" />
        <circle cx={x + 1.2} cy={54.4} r={1.3} fill="#fff" />
      </>
    );
  return (
    <>
      {id === 'shizuku' ? eye(58) : (
        <>
          {eye(40, id === 'hiyori')}
          {eye(60)}
        </>
      )}
      {(id === 'hiyori' || id === 'shizuku') && (
        <g fill="#ff9fb0" opacity="0.55">
          <ellipse cx="35" cy="64" rx="4.5" ry="2.5" />
          <ellipse cx="65" cy="64" rx="4.5" ry="2.5" />
        </g>
      )}
      {id === 'hiyori' && <path d="M44 67 Q51 72 57 66" stroke="#7a2e3e" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {id === 'hiyori' && <path d="M53 68.5 L54.6 71.5 L56 68" fill="#fff" />}
      {id === 'ritsu' && <path d="M45 68 Q50 70 56 67" stroke="#4a3a40" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {id === 'minato' && <path d="M45 68 H55" stroke="#5a3a30" strokeWidth="2" strokeLinecap="round" />}
      {id === 'akane' && <path d="M44 67 Q50 72 56 67" stroke="#8a3a2a" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {id === 'keita' && <path d="M46 68 H54" stroke="#4a3a30" strokeWidth="1.8" strokeLinecap="round" />}
      {id === 'mei' && <path d="M45 67 Q50 71 55 67" stroke="#8a3a3a" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {id === 'sota' && <path d="M42 66 Q50 75 58 66 Z" fill="#7a2e2e" />}
      {id === 'shizuku' && <path d="M47 68 Q50 69.5 53 68" stroke="#5a3a50" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
    </>
  );
}

function Placeholder({ m }: { m: Member }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={m.name}>
      <circle cx="50" cy="50" r="50" fill={m.color} opacity="0.16" />
      <path d="M18 100 C20 82 34 76 50 76 C66 76 80 82 82 100 Z" fill={UNIFORM} />
      <path d="M44 77 L50 88 L56 77 Z" fill="#fff" />
      <path d="M47 80 L50 92 L53 80 Z" fill={m.color} />
      <ellipse cx="50" cy="55" rx="24" ry="25" fill={SKIN} />
      <Face id={m.id} />
      <Hair id={m.id} />
    </svg>
  );
}

export function Avatar({ id, size = 48, title }: { id: MemberId; size?: number; title?: boolean }) {
  const art = useContext(ArtContext);
  const m = CAST[id];
  if (!m) return null;
  const file = art.find((f) => f.replace(/\.\w+$/, '') === id);
  return (
    <span className="avatar" style={{ width: size, height: size, ['--ring' as string]: m.color }} title={title ? `${m.name} (${m.name_ko})` : undefined}>
      {file ? <img src={`${import.meta.env.BASE_URL}characters/${file}`} alt={m.name} /> : <Placeholder m={m} />}
    </span>
  );
}

/** Full bust-up portrait for the member profile sheet. */
export function Portrait({ id }: { id: MemberId }) {
  const art = useContext(ArtContext);
  const m = CAST[id];
  if (!m) return null;
  const file = art.find((f) => f.replace(/\.\w+$/, '') === id);
  return (
    <div className="portrait" style={{ ['--ring' as string]: m.color }}>
      {file ? <img src={`${import.meta.env.BASE_URL}characters/${file}`} alt={m.name} /> : <Placeholder m={m} />}
    </div>
  );
}

/** A member saying a line, with the Korean gloss under it. */
export function Bubble({ member, line, size = 44, children }: { member: Member; line: Line; size?: number; children?: ReactNode }) {
  return (
    <div className="bubble">
      <Avatar id={member.id} size={size} title />
      <div className="bubble-body">
        <div className="bubble-name" style={{ color: member.color }}>
          {member.name}
        </div>
        <div className="bubble-text">
          <JP text={line.jp} />
          <div className="bubble-ko">{line.ko}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
