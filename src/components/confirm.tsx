// In-page confirm/notice dialogs (window.confirm/alert are unavailable inside claude.ai Artifacts).
import { useSyncExternalStore } from 'react';

interface Request {
  title: string;
  body?: string;
  ok?: string;
  cancel?: string | null;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

let current: Request | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Resolves true when the viewer confirms. Pass `cancel: null` for a plain notice. */
export function askConfirm(opts: Omit<Request, 'resolve'>): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...opts, resolve };
    emit();
  });
}

export const notify = (title: string, body?: string) => askConfirm({ title, body, ok: '확인', cancel: null });

function close(ok: boolean) {
  const req = current;
  current = null;
  emit();
  req?.resolve(ok);
}

export function ConfirmHost() {
  const req = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  if (!req) return null;
  return (
    <div className="sheet-backdrop" style={{ zIndex: 80 }} onClick={() => close(false)}>
      <div className="sheet confirm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{req.title}</div>
        {req.body && <div className="confirm-body">{req.body}</div>}
        <div className="confirm-actions">
          {req.cancel !== null && (
            <button className="btn ghost" onClick={() => close(false)}>
              {req.cancel ?? '취소'}
            </button>
          )}
          <button className={`btn ${req.danger ? 'red' : ''}`} onClick={() => close(true)} autoFocus>
            {req.ok ?? '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}
