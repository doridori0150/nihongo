import { getProgress } from './store';

let voice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined) return voice;
  if (typeof speechSynthesis === 'undefined') return (voice = null);
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  if (!voices.length) return null; // voices may load later; try again next time
  const score = (v: SpeechSynthesisVoice) =>
    (/google|natural|neural|online|kyoko|o-ren|nanami|haruka/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  voice = [...voices].sort((a, b) => score(b) - score(a))[0];
  return voice;
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    voice = undefined;
  });
}

export const canSpeak = () => typeof speechSynthesis !== 'undefined';

/** Speak Japanese text (pass kana for reliable readings). */
export function speak(text: string, rate?: number) {
  if (!canSpeak() || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = rate ?? getProgress().settings.ttsRate;
  const v = pickVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// ───────── short UI sounds (WebAudio, no files) ─────────

let ctx: AudioContext | null = null;

function tone(freqs: number[], step: number, type: OscillatorType, gain = 0.12) {
  if (!getProgress().settings.sound) return;
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = f;
      const start = t0 + i * step;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + step * 1.8);
      osc.connect(g).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + step * 2);
    });
  } catch {
    /* audio not available */
  }
}

export const sfx = {
  correct: () => tone([880, 1318.5], 0.09, 'sine'),
  wrong: () => tone([233, 196], 0.12, 'triangle', 0.15),
  done: () => tone([523.25, 659.25, 783.99, 1046.5], 0.11, 'sine'),
  tap: () => tone([660], 0.03, 'sine', 0.05),
};
