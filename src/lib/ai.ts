// AI conversation practice graded by Claude, called directly from the browser with the user's own API key.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { getApiKey, MODEL } from './aiKey';
import { type SampleError, getSample, inClaude } from './runtime';

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
韓国語の総評(feedback)には、軽いユーモアやウィットを一言まぜて楽しく(ただし説明の正確さが最優先。からかう口調はNG)。
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

// ───────── claude.ai account (Artifact `sample` capability) ─────────

export type AiMode = 'claude' | 'apikey' | 'none';

/** Inside claude.ai the viewer's own account answers; elsewhere the user's API key. */
export async function aiMode(): Promise<AiMode> {
  if (inClaude) return (await getSample()) ? 'claude' : 'none';
  return getApiKey() ? 'apikey' : 'none';
}

const SAMPLE_ERRORS: Record<string, string> = {
  not_granted: 'Claude 사용이 허용되지 않았어요. 페이지를 새로 열고 허용을 눌러 주세요.',
  sampling_disabled: '이 계정에서는 Claude를 쓸 수 없어요.',
  rate_limited: 'Claude 사용량 한도에 걸렸어요. 잠시 후 다시 시도해 주세요.',
  session_expired: 'claude.ai에 다시 로그인해 주세요.',
  refused: 'Claude가 이 답변을 거절했어요. 다른 문제로 해 봐요.',
  invalid_json: 'AI 응답 형식이 맞지 않았어요. 다시 시도해 주세요.',
  empty_completion: 'AI가 빈 답을 보냈어요. 다시 시도해 주세요.',
  upstream_error: '일시적인 오류예요. 다시 시도해 주세요.',
};

async function sampleJson<S extends z.ZodType>(
  schema: S,
  input: string | { role: 'user' | 'assistant'; content: string }[],
  modelTier: 'quick' | 'default',
  cache: boolean,
): Promise<z.infer<S>> {
  const sample = await getSample();
  if (!sample) throw new Error('이 화면에서는 Claude를 쓸 수 없어요.');
  let raw: unknown;
  try {
    raw = await sample.json(input, { modelTier, cache });
  } catch (e) {
    const code = (e as SampleError).code;
    throw new Error(SAMPLE_ERRORS[code] ?? `Claude 오류 (${code ?? 'unknown'})`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Error('AI 응답 형식이 맞지 않았어요. 다시 시도해 주세요.');
  return parsed.data;
}

// Lenient copies of the schemas for free-form JSON replies.
const LoosePoint = Point.extend({ kind: Point.shape.kind.catch('naturalness') });
const LooseGrade = GradeSchema.extend({
  score: z.coerce.number(),
  verdict: GradeSchema.shape.verdict.catch('okay'),
  better: z.array(z.string()).catch([]),
  points: z.array(LoosePoint).catch([]),
});
const LooseTurn = TurnSchema.extend({
  reply_ko: z.string().catch(''),
  correction: TurnSchema.shape.correction.catch({ needed: false, fixed: '', explain: '' }),
  goal_done: z.boolean().catch(false),
});
const LooseEval = RoleplayEvalSchema.extend({
  score: z.coerce.number(),
  good: z.array(z.string()).catch([]),
  points: z.array(LoosePoint).catch([]),
  expressions: RoleplayEvalSchema.shape.expressions.catch([]),
});

const GRADE_FORMAT = `次のJSONオブジェクトだけを返す:
{"score": 0〜100の整数, "verdict": "perfect"|"good"|"okay"|"needs_work",
 "corrected": "自然に直した文(ふりがなJText形式)", "better": ["別の自然な言い方(JText)"],
 "points": [{"kind": "grammar"|"vocab"|"politeness"|"naturalness"|"spelling"|"content", "original": "...", "fix": "...", "explain": "韓国語で説明"}],
 "feedback": "韓国語の総評(2〜4文)"}`;

const TURN_FORMAT = `毎回、次のJSONオブジェクトだけを返す:
{"reply": "キャラクターの返事(JText形式、1〜3文)", "reply_ko": "韓国語訳",
 "correction": {"needed": true|false, "fixed": "直した学習者の発言(JText)か空文字", "explain": "韓国語の短い説明か空文字"},
 "goal_done": true|false}`;

const EVAL_FORMAT = `次のJSONオブジェクトだけを返す:
{"score": 0〜100の整数, "summary": "韓国語の総評(3〜5文)", "good": ["良かった点(韓国語)"],
 "points": [{"kind": "grammar"|"vocab"|"politeness"|"naturalness"|"spelling"|"content", "original": "...", "fix": "...", "explain": "韓国語"}],
 "expressions": [{"jp": "便利な表現(JText)", "ko": "韓国語訳"}]}`;

const clampScore = <T extends { score: number }>(x: T): T => ({ ...x, score: Math.round(Math.max(0, Math.min(100, x.score || 0))) });

// ───────── public API ─────────

export async function grade(task: GradeTask, answer: string): Promise<Grade> {
  const user = `${describeTask(task)}

【学習者の答え】${answer}`;
  if (inClaude) return clampScore(await sampleJson(LooseGrade, `${TEACHER}

${user}

${GRADE_FORMAT}`, 'default', true));
  const { data } = await call(GradeSchema, TEACHER, [{ role: 'user', content: user }], 'medium');
  return clampScore(data);
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
  /** the assistant's JSON reply as sent back on claude.ai */
  meta?: string;
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

export async function roleplayTurn(
  setup: RoleplaySetup,
  history: ChatTurn[],
): Promise<{ turn: Turn; raw: Anthropic.Beta.BetaContentBlock[]; meta: string }> {
  // history[0] is the character's opening line; the conversation sent to Claude starts with a user turn.
  if (inClaude) {
    const turns: { role: 'user' | 'assistant'; content: string }[] = [];
    history.forEach((h, i) => {
      if (h.role === 'user') {
        const head = i === 1 ? `${roleplaySystem(setup)}
${TURN_FORMAT}

(あなたの最初のセリフ: ${setup.opening})

学習者: ` : '';
        turns.push({ role: 'user', content: head + h.text });
      } else if (i > 0) {
        turns.push({ role: 'assistant', content: h.meta ?? JSON.stringify({ reply: h.text }) });
      }
    });
    const turn = await sampleJson(LooseTurn, turns, 'quick', false);
    return { turn, raw: [], meta: JSON.stringify(turn) };
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  history.forEach((h, i) => {
    if (h.role === 'user') {
      const prefix = i === 1 ? `(あなたの最初のセリフ: ${setup.opening})

` : '';
      messages.push({ role: 'user', content: prefix + h.text });
    } else if (i > 0) {
      messages.push({ role: 'assistant', content: h.raw ?? h.text });
    }
  });
  const { data, content } = await call(TurnSchema, roleplaySystem(setup), messages, 'low');
  return { turn: data, raw: content, meta: JSON.stringify(data) };
}

export async function evaluateRoleplay(setup: RoleplaySetup, history: ChatTurn[]): Promise<RoleplayEval> {
  const transcript = history
    .map((h) => (h.role === 'user' ? `学習者: ${h.text}` : `相手: ${h.text.replace(/\{[^}]*\}/g, '')}`))
    .join('\n');
  const prompt = `次のロールプレイ会話を評価してください。
【場面】${setup.setting_ko}
【相手】${setup.character}
【学習者の目標】${setup.goal_ko}

${transcript}

学習者の日本語(文法・語彙・敬語の使い分け・自然さ)と目標達成度を評価する。`;
  if (inClaude) return clampScore(await sampleJson(LooseEval, `${TEACHER}

${prompt}

${EVAL_FORMAT}`, 'default', false));
  const { data } = await call(RoleplayEvalSchema, TEACHER, [{ role: 'user', content: prompt }], 'medium');
  return clampScore(data);
}

// ───────── club-room chat (대화 tab) ─────────

const ChatSchema = z.object({
  reply: z.string().describe('キャラクターとしての返事(ふりがなJText形式、1〜3文)'),
  reply_ko: z.string().describe('replyの韓国語訳'),
  face: z.enum(['normal', 'happy', 'angry', 'sad', 'surprised', 'smug', 'shy']).describe('今の表情'),
  correction: TurnSchema.shape.correction,
  choices: z
    .array(z.object({ jp: z.string().describe('学習者が次に言えそうな自然な返事(ふりがなJText形式、短く)'), ko: z.string() }))
    .describe('学習者のための返事の候補を2つ。方向性の違う自然な返事にする'),
});
export type ChatReply = z.infer<typeof ChatSchema>;

const LooseChat = ChatSchema.extend({
  reply_ko: z.string().catch(''),
  face: ChatSchema.shape.face.catch('normal'),
  correction: TurnSchema.shape.correction.catch({ needed: false, fixed: '', explain: '' }),
  choices: ChatSchema.shape.choices.catch([]),
});

const CHAT_FORMAT = `毎回、次のJSONオブジェクトだけを返す:
{"reply": "返事(JText、1〜3文)", "reply_ko": "韓国語訳", "face": "normal"|"happy"|"angry"|"sad"|"surprised"|"smug"|"shy",
 "correction": {"needed": true|false, "fixed": "直した学習者の発言(JText)か空文字", "explain": "韓国語の短い説明か空文字"},
 "choices": [{"jp": "学習者の返事候補(JText)", "ko": "韓国語"}, {"jp": "...", "ko": "..."}]}`;

export interface ChatPersona {
  name: string;
  profile: string;
}

function chatSystem(persona: ChatPersona, player: string) {
  return `あなたは学園ものビジュアルノベル『放課後アニ研』のキャラクター「${persona.name}」です。
${persona.profile}
場面: 放課後のアニメ研究会の部室(305号室)。話し相手は韓国から来た留学生の部員「${player}」(日本語学習中、JLPT N3〜N2)。
ルール:
- キャラクターの口調を必ず守り、自然な話し言葉で1〜3文。難しすぎる言葉は避けるが、子ども扱いはしない。
- 雑談を続けるために、ときどき質問を返す。アニメ・学校生活・日常の話題。
- 学習者の発言に誤りや不自然さがあれば correction に記録する(会話の中では指摘しない)。
- choices には学習者が次に言えそうな自然な返事を2つ(短く、方向性を変えて)。
- 健全な内容のみ。
- ${JTEXT_RULE}`;
}

export async function clubChat(persona: ChatPersona, player: string, history: ChatTurn[], topic: string): Promise<{ reply: ChatReply; raw: Anthropic.Beta.BetaContentBlock[]; meta: string }> {
  const opener = `(放課後、${player}が部室に入ってきた。あなたから話しかけて会話を始めてください。話題のきっかけ: ${topic})`;
  if (inClaude) {
    const turns: { role: 'user' | 'assistant'; content: string }[] = [{ role: 'user', content: `${chatSystem(persona, player)}\n${CHAT_FORMAT}\n\n${opener}` }];
    for (const h of history) turns.push(h.role === 'user' ? { role: 'user', content: h.text } : { role: 'assistant', content: h.meta ?? JSON.stringify({ reply: h.text }) });
    const reply = await sampleJson(LooseChat, turns, 'quick', false);
    return { reply, raw: [], meta: JSON.stringify(reply) };
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: opener }];
  for (const h of history) messages.push(h.role === 'user' ? { role: 'user', content: h.text } : { role: 'assistant', content: h.raw ?? h.text });
  const { data, content } = await call(ChatSchema, chatSystem(persona, player), messages, 'low');
  return { reply: data, raw: content, meta: JSON.stringify(data) };
}
