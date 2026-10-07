import type { ReactNode } from 'react';
import { STAGE_GRADUATED, INTERVALS, type ItemRec } from '../lib/store';
import { relativeKo } from '../lib/date';

export function Ring({ value, size = 64, stroke = 8, color = '#fff', track = 'rgba(255,255,255,.3)', children }: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: 'stroke-dashoffset .5s' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 900 }}>{children}</div>
    </div>
  );
}

/** Five dots for the 1/3/7/14/28-day review ladder. */
export function Stages({ rec }: { rec: ItemRec }) {
  return (
    <span className="stages" title={rec.due ? `다음 복습: ${relativeKo(rec.due)}` : '졸업'}>
      {INTERVALS.map((d, i) => (
        <i key={d} className={i < rec.stage || rec.stage >= STAGE_GRADUATED ? 'on' : i === rec.stage ? 'next' : ''} />
      ))}
    </span>
  );
}

export function stageLabel(rec: ItemRec): string {
  if (rec.stage < 0) return '한 번에 맞힘';
  if (rec.stage >= STAGE_GRADUATED) return '🎓 졸업';
  return `${INTERVALS[rec.stage]}일 단계 · ${rec.due ? relativeKo(rec.due) : ''} 복습`;
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}
