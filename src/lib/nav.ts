// Hand-off from the home screen to the AI screen (e.g. "answer today's situation").
export type AiStart = { mode: 'situation' | 'opinion'; id: string } | { mode: 'roleplay' | 'compose' };

let pending: AiStart | null = null;

export function requestAi(start: AiStart) {
  pending = start;
}

export function takeAiRequest(): AiStart | null {
  const p = pending;
  pending = null;
  return p;
}
