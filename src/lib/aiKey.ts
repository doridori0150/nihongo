// Kept separate from ai.ts so screens that only need the key don't pull in the SDK.
import { local } from './store';

export const MODEL = 'claude-sonnet-5-5';
const KEY = 'nd.anthropicKey';

export const getApiKey = () => local.get(KEY);
export function setApiKey(key: string | null) {
  if (key) local.set(KEY, key.trim());
  else local.remove(KEY);
}
