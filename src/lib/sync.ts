// Progress sync through a private (secret) GitHub Gist owned by the user.
import { useSyncExternalStore } from 'react';
import { getProgress, local, mergeProgress, onLocalChange, replaceFromSync, type Progress } from './store';

const FILE = 'nihongo-daily-progress.json';
const DESCRIPTION = 'nihongo-daily 학습 기록 (자동 동기화)';
const TOKEN_KEY = 'nd.githubToken';
const GIST_KEY = 'nd.gistId';
const API = 'https://api.github.com';

export type SyncStatus =
  | { state: 'off' }
  | { state: 'idle'; at: number }
  | { state: 'syncing' }
  | { state: 'error'; message: string };

let status: SyncStatus = local.get(TOKEN_KEY) ? { state: 'idle', at: 0 } : { state: 'off' };
const listeners = new Set<() => void>();
function setStatus(s: SyncStatus) {
  status = s;
  listeners.forEach((l) => l());
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
  );
}

export const getToken = () => local.get(TOKEN_KEY);

async function gh(path: string, init: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 401) throw new Error('GitHub 토큰이 유효하지 않아요. 설정에서 다시 입력해 주세요.');
  if (res.status === 403 || res.status === 404) {
    const body = await res.text();
    throw new Error(
      res.status === 404 && path.startsWith('/gists/')
        ? 'GIST_NOT_FOUND'
        : `GitHub 접근 거부 (${res.status}). 토큰에 Gist 권한이 있는지 확인해 주세요. ${body.slice(0, 120)}`,
    );
  }
  if (!res.ok) throw new Error(`GitHub 오류 ${res.status}`);
  return res.json();
}

interface GistFile {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}

async function findGist(): Promise<string | null> {
  for (let page = 1; page <= 5; page++) {
    const list: { id: string; files: Record<string, unknown> }[] = await gh(`/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => FILE in g.files);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  return null;
}

async function readGist(id: string): Promise<Progress | null> {
  const gist: { files: Record<string, GistFile> } = await gh(`/gists/${id}`);
  const f = gist.files[FILE];
  if (!f) return null;
  let text = f.content ?? '';
  if (f.truncated && f.raw_url) text = await (await fetch(f.raw_url)).text();
  try {
    return JSON.parse(text) as Progress;
  } catch {
    return null;
  }
}

async function createGist(p: Progress): Promise<string> {
  const g: { id: string } = await gh('/gists', {
    method: 'POST',
    body: JSON.stringify({ description: DESCRIPTION, public: false, files: { [FILE]: { content: JSON.stringify(p) } } }),
  });
  return g.id;
}

async function writeGist(id: string, p: Progress) {
  await gh(`/gists/${id}`, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(p) } } }) });
}

let running: Promise<void> | null = null;
let again = false;

/** Pull → merge → push. Safe to call often; concurrent calls coalesce. */
export function syncNow(): Promise<void> {
  if (!getToken()) {
    setStatus({ state: 'off' });
    return Promise.resolve();
  }
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    setStatus({ state: 'syncing' });
    try {
      let id = local.get(GIST_KEY);
      if (!id) {
        id = await findGist();
        if (id) local.set(GIST_KEY, id);
      }
      let remote: Progress | null = null;
      if (id) {
        try {
          remote = await readGist(id);
        } catch (e) {
          if ((e as Error).message !== 'GIST_NOT_FOUND') throw e;
          local.remove(GIST_KEY);
          id = null;
        }
      }
      const merged = remote ? mergeProgress(getProgress(), remote) : getProgress();
      if (remote) replaceFromSync(merged);
      if (id) {
        if (JSON.stringify(merged) !== JSON.stringify(remote)) await writeGist(id, merged);
      } else {
        id = await createGist(merged);
        local.set(GIST_KEY, id);
      }
      setStatus({ state: 'idle', at: Date.now() });
    } catch (e) {
      setStatus({ state: 'error', message: (e as Error).message });
    } finally {
      running = null;
      if (again) {
        again = false;
        void syncNow();
      }
    }
  })();
  return running;
}

let timer: ReturnType<typeof setTimeout> | undefined;
let pending = false;
function schedule(delay = 4000) {
  if (!getToken()) return;
  clearTimeout(timer);
  pending = true;
  timer = setTimeout(() => {
    pending = false;
    void syncNow();
  }, delay);
}

export function setToken(token: string | null) {
  if (token) local.set(TOKEN_KEY, token.trim());
  else {
    local.remove(TOKEN_KEY);
    local.remove(GIST_KEY);
  }
  setStatus(token ? { state: 'idle', at: 0 } : { state: 'off' });
  if (token) void syncNow();
}

/** Wire automatic sync: on start, after local changes, and when the app comes back to the foreground. */
export function startAutoSync() {
  onLocalChange(() => schedule());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') schedule(300);
    else if (pending) {
      // leaving the app: push now rather than waiting for the debounce
      clearTimeout(timer);
      pending = false;
      void syncNow();
    }
  });
  window.addEventListener('online', () => schedule(500));
  schedule(500);
}
