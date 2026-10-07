// Detects whether the app runs inside a claude.ai Artifact viewer and exposes the
// capabilities it uses there: `sample` (Claude on the viewer's own account),
// `db` (per-viewer storage) and `user` (the viewer's id).

export interface SampleFn {
  (input: string | { role: 'user' | 'assistant'; content: string }[], options?: SampleOptions): Promise<{
    text: string;
    truncated: boolean;
  }>;
  json<T = unknown>(input: string | { role: 'user' | 'assistant'; content: string }[], options?: SampleOptions): Promise<T>;
}
export interface SampleOptions {
  modelTier?: 'quick' | 'default' | 'complex';
  cache?: boolean;
  signal?: AbortSignal;
}
export interface SampleError {
  code: string;
  message: string;
  text?: string;
}

interface DocSnapshot {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
export interface DocRef {
  get(): Promise<DocSnapshot>;
  set(data: Record<string, unknown>): Promise<void>;
}
export interface Db {
  doc(path: string): DocRef;
}
export interface UserCap {
  id(): Promise<string | null>;
}

declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

/** True when served inside a claude.ai Artifact (the viewer injects `window.claude`). */
export const inClaude: boolean = typeof window !== 'undefined' && typeof window.claude?.use === 'function';

const memo = new Map<string, Promise<unknown>>();

function cap<T>(name: string): Promise<T | null> {
  if (!inClaude) return Promise.resolve(null);
  let p = memo.get(name);
  if (!p) {
    p = window.claude!.use(name).catch(() => null);
    memo.set(name, p);
  }
  return p as Promise<T | null>;
}

export const getSample = () => cap<SampleFn>('sample');
export const getDb = () => cap<Db>('db');
export const getUser = () => cap<UserCap>('user');
