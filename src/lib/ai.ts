// AI conversation practice graded by Claude, called directly from the browser with the user's own API key.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { getApiKey, MODEL } from './aiKey';

function client() {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('설정에서 Anthropic API 키를 먼저 입력해 주세요.');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

const JTEXT_RULE =
  '日本語の文には必ずふりがなを「漢字{かんじ}」形式で付ける(漢字の連続の直後に波括弧で読み。送り仮名は括弧の外: 食{た}べる)。';

// ───────── schemas ─────────

const Point = z.object({
  kind: z.enum(['grammar', 'vocab', 'politeness', 'naturalness', 'spelling', 'content']),
  original: z.string().describe('学習者の答えの該当部分'),
  fix: z.string().describe('直した表現'),
  explain: z.string().describe('韓国語での説明(1〜2文)'),
});

const GradeSchema = z.object({
  score: z.number().describe('0〜100の整数'),
  verdict: z.enum(['perfect', 'good', 'okay', 'needs_work']),
  corrected: z.string().describe('学習者の意図を生かして自然に直した日本語(ふりがなJText形式)'),
  better: z.array(z.string()).describe('より自然な別の言い方を1〜2個(ふりがなJText形式)'),
  points: z.array(Point).describe('直すべき点。完璧なら空配列'),
  feedback: z.string().describe('韓国語での総評。良かった点も含めて2〜4文、励ます口調で'),
});
export type Grade = z.infer<typeof GradeSchema>;

const TurnSchema = z.object({
  reply: z.string().describe('キャラクターとしての返事(ふりがなJText形式、1〜3文)'),
  reply_ko: z.string().describe('replyの韓国語訳'),
  correction: z.object({
    needed: z.boolean().describe('学習者の直前の発言に明らかな誤りや不自然さがあるか'),
    fixed: z.string().describe('自然に直した学習者の発言(ふりがなJText形式)。neededがfalseなら空文字'),
    explain: z.string().describe('韓国語で短く説明。neededがfalseなら空文字'),
  }),
  goal_done: z.boolean().describe('学習者が会話の目標を達成したか'),
});
export type Turn = z.infer<typeof TurnSchema>;

const RoleplayEvalSchema = z.object({
  score: z.number().describe('0〜100の整数'),
  summary: z.string().describe('韓国語での総評(3〜5文)'),
  good: z.array(z.string()).describe('良かった点(韓国語、1〜3個)'),
  points: z.array(Point).describe('直すべき点(最大5個)'),
  expressions: z
    .array(z.object({ jp: z.string().describe('ふりがなJText形式'), ko: z.string() }))
    .describe('この場面で使える便利な表現を3個'),
});
export type RoleplayEval = z.infer<typeof RoleplayEvalSchema>;

// ───────── calls ─────────

const TEACHER = `あなたは韓国人学習者(JLPT N2〜N1レベル)を教えるベテランの日本語教師です。
目標は旅行や日常生活で自然に話せること、ドラマやアニメの日本語が聞き取れること。
採点は公正に、ただし励ましながら。意味が通じて自然なら、模範解答と違っても高く評価する。
文法・語彙・敬語レベル(場面に合っているか)・自然さを見る。説明は韓国語で簡潔に。
${JTEXT_RULE}`;

async function call<S extends z.ZodType>(
  schema: S,
  system: string,
  messages: Anthropic.Beta.BetaMessageParam[],
  effort: 'low' | 'medium',
): Promise<{ data: z.infer<S>; content: Anthropic.Beta.BetaContentBlock[] }> {
  try {
    const res = await client().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    if (res.stop_reason === 'refusal') throw new Error('AI가 이 요청에 답하지 않았어요. 다른 문제로 시도해 주세요.');
    if (res.stop_reason === 'max_tokens') throw new Error('응답이 너무 길어 잘렸어요. 다시 시도해 주세요.');
    if (!res.parsed_output) throw new Error('AI 응답을 해석하지 못했어요. 다시 시도해 주세요.');
    return { data: res.parsed_output as z.infer<S>, content: res.content };
  } catch (e) {
    throw new Error(explainError(e));
  }
}

function explainError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'API 키가 올바르지 않아요. 설정에서 확인해 주세요.';
  if (e instanceof Anthropic.PermissionDeniedError) return '이 API 키로는 해당 모델을 쓸 수 없어요.';
  if (e instanceof Anthropic.RateLimitError) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
  if (e instanceof Anthropic.BadRequestError) {
    if (/credit balance/i.test(e.message)) return 'API 크레딧이 부족해요. console.anthropic.com 에서 충전해 주세요.';
    return `요청 오류: ${e.message}`;
  }
  if (e instanceof Anthropic.APIConnectionError) return '네트워크 연결을 확인해 주세요.';
  if (e instanceof Anthropic.APIError) return `API 오류 (${e.status}): ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}

export type GradeTask =
  | { mode: 'situation'; scene: string; partner: string; line: string; task: string; sample: string }
  | { mode: 'compose'; ko: string; reference: string; focus: string }
  | { mode: 'opinion'; question: string; hint: string; sample: string };

function describeTask(t: GradeTask): string {
  switch (t.mode) {
    case 'situation':
      return `【場面】${t.scene}\n【相手(${t.partner})のセリフ】${t.line}\n【課題(韓国語)】${t.task}\n【模範解答の一例】${t.sample}`;
    case 'compose':
      return `【課題】次の韓国語を自然な日本語に訳す: ${t.ko}\n【参考訳】${t.reference}\n【練習ポイント】${t.focus}\n参考訳と違っても、意味が正確で自然なら正解とする。`;
    case 'opinion':
      return `【質問】${t.question}\n【ヒント】${t.hint}\n【回答例】${t.sample}\n内容は自由。質問に答えているか、日本語として正しく自然か、質問の口調(タメ口/です・ます)に合っているかを見る。`;
  }
}

export async function grade(task: GradeTask, answer: string): Promise<Grade> {
  const { data } = await call(
    GradeSchema,
    TEACHER,
    [{ role: 'user', content: `${describeTask(task)}\n\n【学習者の答え】${answer}` }],
    'medium',
  );
  return { ...data, score: Math.round(Math.max(0, Math.min(100, data.score))) };
}

// ───────── roleplay ─────────

export interface RoleplaySetup {
  title: string;
  character: string;
  setting_ko: string;
  goal_ko: string;
  opening: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string; // learner text, or the character reply (JText)
  /** raw assistant content blocks, sent back unchanged to keep the conversation valid */
  raw?: Anthropic.Beta.BetaContentBlock[];
}

function roleplaySystem(s: RoleplaySetup) {
  return `あなたは日本語会話練習のロールプレイ相手です。次のキャラクターになりきって話してください。
【キャラクター】${s.character}
【場面(韓国語)】${s.setting_ko}
【学習者の目標(韓国語)】${s.goal_ko}
ルール:
- 学習者はJLPT N2〜N1レベルの韓国人。キャラクターらしい自然な話し言葉で、1〜3文で短く返す。
- 会話が続くように、ときどき質問を投げかける。学習者が目標を達成できるよう自然に流れを作る。
- 学習者の発言に誤りがあれば correction に短く記録する(会話の中では指摘しない)。
- ${JTEXT_RULE}`;
}

export async function roleplayTurn(setup: RoleplaySetup, history: ChatTurn[]): Promise<{ turn: Turn; raw: Anthropic.Beta.BetaContentBlock[] }> {
  // The opening line is given as context in the first user message; the API needs a user turn first.
  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  history.forEach((h, i) => {
    if (h.role === 'user') {
      const prefix = i === 1 ? `(あなたの最初のセリフ: ${setup.opening})\n\n` : '';
      messages.push({ role: 'user', content: prefix + h.text });
    } else if (i > 0) {
      messages.push({ role: 'assistant', content: h.raw ?? h.text });
    }
  });
  const { data, content } = await call(TurnSchema, roleplaySystem(setup), messages, 'low');
  return { turn: data, raw: content };
}

export async function evaluateRoleplay(setup: RoleplaySetup, history: ChatTurn[]): Promise<RoleplayEval> {
  const transcript = history
    .map((h) => (h.role === 'user' ? `学習者: ${h.text}` : `相手: ${h.text.replace(/\{[^}]*\}/g, '')}`))
    .join('\n');
  const { data } = await call(
    RoleplayEvalSchema,
    TEACHER,
    [
      {
        role: 'user',
        content: `次のロールプレイ会話を評価してください。\n【場面】${setup.setting_ko}\n【相手】${setup.character}\n【学習者の目標】${setup.goal_ko}\n\n${transcript}\n\n学習者の日本語(文法・語彙・敬語の使い分け・自然さ)と目標達成度を評価する。`,
      },
    ],
    'medium',
  );
  return { ...data, score: Math.round(Math.max(0, Math.min(100, data.score))) };
}
