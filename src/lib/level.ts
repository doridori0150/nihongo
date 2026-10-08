import type { Content, Level } from './content';
import { diffDays, today } from './date';
import { type DayPlan, type Progress, dueItems, recentAccuracy } from './store';

export type Light = 'green' | 'yellow' | 'red' | 'off';

export interface Signal {
  key: 'today' | 'review' | 'accuracy' | 'talk';
  label: string;
  value: string;
  light: Light;
}

/** An item counts as solid once learned cleanly or after passing the 7-day review. */
const SOLID_STAGE = 3;

export interface LevelProgress {
  level: Level;
  total: number;
  learned: number;
  solid: number;
}

export function levelProgress(p: Progress, c: Content): LevelProgress[] {
  const all = [...c.words, ...c.grammar, ...c.phrases];
  return (['N3', 'N2', 'N1'] as const)
    .map((level) => {
      const pool = all.filter((it) => it.level === level);
      let learned = 0;
      let solid = 0;
      for (const it of pool) {
        const r = p.items[it.id];
        const card = p.deck?.[it.id];
        if (!r && !card?.on) continue;
        learned++;
        // learned cleanly, passed the 7-day review, or reached the 7-day step as a flashcard
        if ((r && (r.stage < 0 || r.stage >= SOLID_STAGE)) || (card?.on && card.stage >= SOLID_STAGE)) solid++;
      }
      return { level, total: pool.length, learned, solid };
    })
    .filter((x) => x.total > 0);
}

/** Rough level label relative to this app's N3–N1 curriculum. */
export function levelLabel(lp: LevelProgress[]): string {
  const ratio = (level: Level) => {
    const x = lp.find((l) => l.level === level);
    return x && x.total ? x.solid / x.total : 0;
  };
  const [n3, n2, n1] = [ratio('N3'), ratio('N2'), ratio('N1')];
  if (n2 < 0.1 && n1 < 0.1 && n3 < 0.6 && lp.some((l) => l.level === 'N3')) return n3 < 0.2 ? 'N3 입문' : 'N3 다지기';
  if (n2 >= 0.9 || n1 >= 0.3) {
    if (n1 < 0.3) return 'N1 도전';
    if (n1 < 0.6) return 'N1 중급';
    if (n1 < 0.9) return 'N1 완성 단계';
    return 'N1 마스터';
  }
  if (n2 < 0.1) return 'N2 입문';
  if (n2 < 0.4) return 'N2 기초';
  if (n2 < 0.7) return 'N2 중급';
  return 'N2 완성 단계';
}

export function signals(p: Progress, c: Content, plan: DayPlan | undefined): Signal[] {
  const d = today();
  const due = dueItems(p, d).filter((id) => c.byId.has(id));

  const tasks = (['words', 'grammar', 'phrases'] as const).filter((t) => (plan?.[t]?.length ?? 0) > 0);
  const reviewCounts = due.length > 0 || !!plan?.done.review;
  const total = tasks.length + (reviewCounts ? 1 : 0);
  const done = tasks.filter((t) => plan?.done[t]).length + (reviewCounts && due.length === 0 ? 1 : 0);

  const oldest = due.length ? Math.max(...due.map((id) => diffDays(d, p.items[id].due!))) : 0;
  const acc = recentAccuracy(p);
  const scores = p.ai.slice(0, 5).map((e) => e.score);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return [
    {
      key: 'today',
      label: '오늘 학습',
      value: total ? `${done}/${total} 완료` : '—',
      light: !total ? 'off' : done === total ? 'green' : done > 0 ? 'yellow' : 'red',
    },
    {
      key: 'review',
      label: '밀린 복습',
      value: due.length ? `${due.length}개` : '없음',
      light: due.length === 0 ? 'green' : due.length <= 15 && oldest <= 2 ? 'yellow' : 'red',
    },
    {
      key: 'accuracy',
      label: '최근 7일 정답률',
      value: acc ? `${acc.pct}%` : '기록 부족',
      light: !acc ? 'off' : acc.pct >= 85 ? 'green' : acc.pct >= 65 ? 'yellow' : 'red',
    },
    {
      key: 'talk',
      label: '회화 점수',
      value: avg === null ? '아직 없음' : `평균 ${avg}점`,
      light: avg === null ? 'off' : avg >= 80 ? 'green' : avg >= 60 ? 'yellow' : 'red',
    },
  ];
}

const MESSAGE: Record<Signal['key'], Record<'red' | 'yellow', string>> = {
  today: {
    red: '오늘 학습 0%… 단어들이 기다리다 지쳐 自宅待機(재택대기) 중이에요 😴',
    yellow: '반쯤 왔어요! ラストスパート(라스트 스퍼트)! 🏃',
  },
  review: {
    red: '복습이 후지산만큼 쌓였어요 🗻 한 봉우리씩 넘어가 봐요',
    yellow: '복습 몇 개가 손 흔들며 기다리는 중 👋',
  },
  accuracy: {
    red: '정답률이 살짝 ピンチ(위기)! 틀린 문제 연습 한 판 어때요?',
    yellow: '정답률 나쁘지 않아요. 조금만 더 하면 ドヤ顔(으쓱한 얼굴) 가능 😏',
  },
  talk: {
    red: '회화 점수가 수줍어하는 중… 롤플레이로 말문을 터 봐요 🎭',
    yellow: '회화 괜찮아요! 다음엔 경어까지 챙기면 완벽 🙇',
  },
};

export function overall(sig: Signal[]): { light: Exclude<Light, 'off'>; message: string } {
  const red = sig.find((s) => s.light === 'red');
  if (red) return { light: 'red', message: MESSAGE[red.key].red };
  const yellow = sig.find((s) => s.light === 'yellow');
  if (yellow) return { light: 'yellow', message: MESSAGE[yellow.key].yellow };
  return { light: 'green', message: '전부 초록불! 이 페이스면 일본 가서 메뉴판 정복 각 🍜' };
}
