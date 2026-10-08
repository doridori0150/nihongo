// Visual-novel stage: background, standing characters and the dialogue box.
import { useContext, type ReactNode } from 'react';
import { CAST, type MemberId } from '../lib/cast';
import type { Art } from '../lib/content';
import type { Face } from '../lib/story';
import { ArtContext, Portrait } from './Avatar';

const BASE = import.meta.env.BASE_URL;
const stem = (f: string) => f.replace(/\.\w+$/, '');

/** Fallback washes per background key when the illustration isn't drawn yet. */
const BG_TINT: Record<string, string> = {
  clubroom: 'linear-gradient(160deg, #f3e6cf, #d9c3a0)',
  clubroom_evening: 'linear-gradient(160deg, #f6b47a, #7b4b6b)',
  classroom: 'linear-gradient(160deg, #e9f1f7, #c9d8e3)',
  hallway: 'linear-gradient(160deg, #eef0ea, #cfd3c6)',
  school_gate: 'linear-gradient(160deg, #fde3ec, #f6b8cc)',
  rooftop: 'linear-gradient(180deg, #8ec5ff, #dcefff)',
  station: 'linear-gradient(160deg, #dfe7ee, #a9b8c6)',
  akihabara: 'linear-gradient(160deg, #ffd1e8, #7d8cff)',
  shopping_street: 'linear-gradient(160deg, #ffd9a8, #b46b48)',
  convenience_store: 'linear-gradient(160deg, #f4fbff, #bfe3d9)',
  beach_inn: 'linear-gradient(180deg, #8fd3ff, #f8e7c4)',
  festival_night: 'linear-gradient(180deg, #1b1f4b, #8a3b5c)',
  comiket: 'linear-gradient(180deg, #bfe3ff, #fff3d6)',
  shrine_winter: 'linear-gradient(180deg, #dfe9f5, #f7f7fb)',
  apartment: 'linear-gradient(160deg, #3a3550, #1f2233)',
  kyoto_street: 'linear-gradient(160deg, #f3d9c4, #8c5a3c)',
  osaka_street: 'linear-gradient(180deg, #2b1d4a, #ff7a59)',
  ryokan: 'linear-gradient(160deg, #efe3c8, #a8895d)',
  live_house: 'linear-gradient(180deg, #120d1f, #6b2d8f)',
  exam_hall: 'linear-gradient(160deg, #eef1f4, #b7c0c9)',
  campus: 'linear-gradient(160deg, #e7f3df, #9dbb86)',
  studio: 'linear-gradient(180deg, #1a1d26, #3d4660)',
  airport: 'linear-gradient(160deg, #eaf4fb, #a9c8de)',
};

export function bgUrl(art: Art, key: string): string | null {
  const f = art.bg.find((x) => stem(x) === key);
  return f ? `${BASE}bg/${f}` : null;
}

export function Backdrop({ art, bg, dim = 0 }: { art: Art; bg: string; dim?: number }) {
  const url = bgUrl(art, bg);
  return (
    <div className="vn-bg" style={url ? undefined : { background: BG_TINT[bg] ?? BG_TINT.clubroom }}>
      {url && <img src={url} alt="" />}
      {dim > 0 && <div className="vn-dim" style={{ opacity: dim }} />}
    </div>
  );
}

const FACE_FALLBACK: Partial<Record<MemberId, Face>> = { hiyori: 'smug' };

export function spriteUrl(art: Art, id: string, face: Face = 'normal'): string | null {
  const tries = [`${id}_${face}`, `${id}_${FACE_FALLBACK[id as MemberId] ?? 'normal'}`, `${id}_normal`];
  for (const t of tries) {
    const f = art.sprites.find((x) => stem(x) === t);
    if (f) return `${BASE}sprites/${f}`;
  }
  return null;
}

export interface OnStage {
  id: string;
  face: Face;
}

export function Characters({ art, cast, speaking }: { art: Art; cast: OnStage[]; speaking?: string }) {
  const chars = useContext(ArtContext);
  return (
    <div className={`vn-chars n${cast.length}`}>
      {cast.map((c) => {
        const url = spriteUrl(art, c.id, c.face);
        const dimmed = speaking && speaking !== c.id;
        return (
          <div key={c.id} className={`vn-char ${dimmed ? 'dim' : ''}`}>
            {url ? (
              <img src={url} alt={CAST[c.id as MemberId]?.name ?? c.id} />
            ) : chars.length && CAST[c.id as MemberId] ? (
              <div className="vn-card">
                <Portrait id={c.id as MemberId} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function DialogueBox({
  name,
  color,
  children,
  tools,
  onClick,
}: {
  name?: string;
  color?: string;
  children: ReactNode;
  tools?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className="vn-box" onClick={onClick}>
      {name && (
        <div className="vn-name" style={{ background: color ?? 'var(--primary)' }}>
          {name}
        </div>
      )}
      <div className="vn-text">{children}</div>
      {tools && (
        <div className="vn-tools" onClick={(e) => e.stopPropagation()}>
          {tools}
        </div>
      )}
    </div>
  );
}
