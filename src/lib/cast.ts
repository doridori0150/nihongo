// 放課後アニ研 (After-school Anime Club) — the app's original cast.
// Lines are JText (漢字{かんじ}) so furigana shows; `ko` is the Korean gloss.

export type MemberId = 'minato' | 'shizuku' | 'hiyori' | 'ritsu' | 'saeko' | 'akane' | 'keita' | 'mei' | 'sota';

export interface Line {
  jp: string;
  ko: string;
}

export interface Member {
  id: MemberId;
  name: string;
  reading: string;
  name_ko: string;
  grade: string;
  role: string;
  bio: string;
  color: string;
  /** Story year the member joins the club (default 1). */
  joinYear?: number;
  /** Grade/role as they change in later story years. */
  later?: Record<number, { grade: string; role?: string }>;
}

export const CLUB = { name: '放課後アニ研', reading: 'ほうかごアニけん', ko: '방과후 애니메이션 연구회' };

export const CAST: Record<MemberId, Member> = {
  saeko: {
    id: 'saeko',
    name: '如月 冴子',
    reading: 'きさらぎ さえこ',
    name_ko: '키사라기 사에코',
    grade: '고문 · 국어 교사',
    role: '본격 공부·복습 담당',
    bio: '애니연 고문. 입은 험하지만 끝까지 챙겨 주는 어른. 사탕 막대를 담배처럼 물고 다닌다. 학생 시절 애니연 부장이었다는 소문이 있다.',
    color: '#9b2c4b',
  },
  minato: {
    id: 'minato',
    name: '九条 湊',
    reading: 'くじょう みなと',
    name_ko: '쿠조 미나토',
    grade: '3학년 · 부장',
    role: '문법 담당',
    bio: '안경 쓴 냉정한 부장. 80년대 OVA부터 이번 분기 신작까지 다 본 걸어다니는 애니 연표. 설명이 길어지면 안경을 고쳐 쓴다.',
    color: '#2f5d9e',
    later: { 2: { grade: '졸업 · 대학생 OB' }, 3: { grade: '졸업 · 대학생 OB' } },
  },
  shizuku: {
    id: 'shizuku',
    name: '影山 しずく',
    reading: 'かげやま しずく',
    name_ko: '카게야마 시즈쿠',
    grade: '2학년',
    role: '명대사·오타쿠 용어 담당',
    bio: '말수 적은 음침 오타쿠. 평소엔 작은 목소리지만 좋아하는 작품 얘기가 나오면 갑자기 빨라진다. 원작 출처 해설 담당.',
    color: '#7357b0',
    later: { 2: { grade: '3학년 · 부장' }, 3: { grade: '졸업' } },
  },
  ritsu: {
    id: 'ritsu',
    name: '鳴海 リツ',
    reading: 'なるみ りつ',
    name_ko: '나루미 리츠',
    grade: '2학년',
    role: '회화·롤플레이 담당',
    bio: '경음부와 애니연을 겸하는 보이시한 베이시스트. 말은 짧고 무뚝뚝하지만 연습 상대는 끝까지 해 준다. 애니송 카피가 특기.',
    color: '#3f4a63',
    later: { 2: { grade: '3학년' }, 3: { grade: '졸업' } },
  },
  hiyori: {
    id: 'hiyori',
    name: '桃瀬 ひより',
    reading: 'ももせ ひより',
    name_ko: '모모세 히요리',
    grade: '1학년',
    role: '단어·퀴즈 담당',
    bio: '선배를 깔보고 놀리는 게 낙인 건방진 1학년. 선배가 틀리면 신나서 "ざーこ"를 연발하지만, 맞히면 못 이기는 척 인정한다. 가챠 운이 이상하게 좋다.',
    color: '#e86a9a',
    later: { 2: { grade: '2학년' }, 3: { grade: '3학년' } },
  },
  akane: {
    id: 'akane',
    name: '天城 アカネ',
    reading: 'あまぎ あかね',
    name_ko: '아마기 아카네',
    grade: '1학년',
    role: '젊은이 말투 담당',
    bio: '밝은 갸루인데 정체는 『鋼鉄騎士ガルバード』 원작 OVA를 신봉하는 로봇 애니·프라모델 덕후. 로봇 얘기만 나오면 전문용어로 폭주한다. 반 친구들에겐 비밀.',
    color: '#e0782b',
    joinYear: 2,
    later: { 3: { grade: '2학년' } },
  },
  keita: {
    id: 'keita',
    name: '土屋 ケイタ',
    reading: 'つちや けいた',
    name_ko: '츠치야 케이타',
    grade: '1학년',
    role: '맞장구·짧은 대답 담당',
    bio: '중학생으로 오해받는 작고 귀여운 1학년. 그런데 말은 "…っす"뿐인 무뚝뚝한 코스플레이어. 집이 양복점이라 재봉이 특기. 코스프레로 멋진 캐릭터가 되면 딴사람처럼 당당해진다. "귀엽다"는 말은 금지.',
    color: '#3f7d5c',
    joinYear: 2,
    later: { 3: { grade: '2학년' } },
  },
  mei: {
    id: 'mei',
    name: '林 メイ',
    reading: 'リン メイ',
    name_ko: '린 메이',
    grade: '1학년 · 교환 유학생',
    role: '학습자 실수 담당',
    bio: '대만에서 온 1년 교환 유학생. VTuber를 좋아하고 2개 국어 방송인이 꿈. 일본어는 아직 공부 중이라 뭐든 수첩에 적는다. 히요리 배역의 열성 팬.',
    color: '#d94f6b',
    joinYear: 3,
  },
  sota: {
    id: 'sota',
    name: '高津 ソウタ',
    reading: 'たかつ そうた',
    name_ko: '다카츠 소타',
    grade: '1학년',
    role: '간사이 사투리·츳코미 담당',
    bio: '오사카에서 전학 온 보케 담당. 라이트노벨 작가 지망생이라 뭐든 이야기로 만든다. 시끄럽지만 다정해서 메이의 일본어를 도우려다 사투리로 헷갈리게 한다.',
    color: '#3a6fb5',
    joinYear: 3,
  },
};

/** Members in the club during a story year (new members appear from year 2). */
export const membersFor = (year: number): MemberId[] =>
  (Object.keys(CAST) as MemberId[]).filter((id) => (CAST[id].joinYear ?? 1) <= year);

export const gradeOf = (id: MemberId, year: number): string => {
  const m = CAST[id];
  for (let y = year; y > 1; y--) if (m.later?.[y]) return m.later[y].grade;
  return m.grade;
};

/** How each member talks, for Claude to play them in the 대화 tab (Japanese, %name%/%kun% are filled in). */
export const PERSONA: Record<MemberId, string> = {
  saeko:
    'アニ研顧問の国語教師、30歳。社会に疲れた気だるい態度で、ため息まじりの面倒くさそうなタメ口。口は悪いが、なんだかんだ生徒の面倒をよく見る。缶コーヒーと棒付きキャンディーが手放せない。昔アニ研の部長だった。相手を「%name%」と呼び捨てにする。',
  minato:
    'アニ研部長の3年生、男子。冷静で知的、落ち着いたタメ口。アニメ史(特に80年代のロボットアニメ『鋼鉄騎士ガルバード』)に詳しく、説明が長くなるとメガネを上げる。相手を「%name%%kun%」と呼ぶ。',
  shizuku:
    '2年生の女子。内気で陰キャなオタク。言葉に「…」が多く、笑い方は「ふひ」。普段は小声だが、好きな作品(『放課後ロケット』)の話になると急に早口になる。同人誌を描いている。相手を「%name%%kun%」と呼ぶ。',
  ritsu:
    '2年生の女子。ボーイッシュでクールなベーシスト、軽音部と兼部。口数が少なく、男っぽい口調(一人称「あたし」、「〜じゃん」「〜だろ」)。ぶっきらぼうだが面倒見はいい。相手を「%name%」と呼ぶ。',
  hiyori:
    '1年生の女子で、主人公と同じクラス。主人公が1歳年上なのをネタに、わざと「センパイ」と呼んでからかう生意気キャラ。口癖は「ざーこ♪」「ぷぷっ」。ガチャ運が異常にいい。実は声優志望で努力家だが、それは隠している。からかいは軽いノリで、健全な範囲。',
  akane:
    '1年生の女子。見た目は明るいギャルで、ギャル語(「マジ」「ガチ」「ウケる」「〜じゃね？」「〜だし」)、一人称「ウチ」。実はロボットアニメ(特に80年代OVA『鋼鉄騎士ガルバード』)とプラモデルのガチオタクで、ロボの話になると専門用語で早口になる。クラスのギャル友達にはオタクなのを隠している。相手を「%name%パイセン」と呼ぶ。',
  keita:
    '1年生の男子。小柄で童顔、よく中学生に間違えられる(「かわいい」と言われるのが嫌い)。なのに無口でぶっきらぼう、返事はとても短い(「…っす」「うっす」)。一人称「自分」。実家が仕立て屋で裁縫が得意なコスプレイヤー。衣装の話になると少しだけ饒舌になる。相手を「%name%先輩」と呼ぶ。',
  mei:
    '台湾から来た1年生の交換留学生の女子。明るく真面目な努力家で、何でもメモする。VTuberが好きで、日本語と中国語のバイリンガル配信者が夢。日本語はまだ勉強中で、教科書のような丁寧語に学習者らしい小さな間違いが混じる(わざとらしくならない程度に)。一人称「わたし」。相手を「%name%先輩」と呼ぶ。',
  sota:
    '大阪から転校してきた1年生の男子。にぎやかなボケ担当で関西弁(「〜やん」「ほんまに」「あかん」「〜へん」)、一人称「俺」。ライトノベル作家志望で、何でも物語にしたがる。うるさいけれど優しい。相手を「部長」か「%name%先輩」と呼ぶ。',
};

const L = (jp: string, ko: string): Line => ({ jp, ko });

export const LINES = {
  greetMorning: [
    L('おはよう。今日{きょう}の分{ぶん}、もう始{はじ}めるか？', '좋은 아침. 오늘 분량, 벌써 시작할 건가?'),
    L('朝{あさ}から部室{ぶしつ}？ センパイ、もしかして暇{ひま}なんですかぁ？', '아침부터 부실? 선배, 혹시 한가해요?'),
  ],
  greet: [
    L('…来{き}たか。ほら、さっさと始{はじ}めな。', '…왔구나. 자, 얼른 시작해.'),
    L('あ、来{き}た…。い、いらっしゃい…ふひ', '아, 왔다…. 어, 어서 와…후히'),
    L('部室{ぶしつ}へようこそ。今日{きょう}のノルマを確認{かくにん}しよう。', '부실에 온 걸 환영해. 오늘 할당량부터 확인하자.'),
    L('センパイ遅{おそ}～い。ざーこ♪ もう始{はじ}めちゃってますよ？', '선배 늦었어요~. 허접♪ 벌써 시작했다고요?'),
    L('…よ。練習{れんしゅう}、付{つ}き合{あ}ってやるよ。', '…어. 연습, 같이 해 줄게.'),
  ],
  allDone: [
    L('今日{きょう}の分{ぶん}は終{お}わりか。…よくやったじゃないか。', '오늘 분량은 끝났나. …잘했잖아.'),
    L('…ふーん、全部{ぜんぶ}やったんだ。まあ、えらいんじゃないですか？ ちょっとだけ。', '…흐응, 다 했네요. 뭐, 기특한 거 아니에요? 아주 조금.'),
  ],
  reviewDue: [
    L('センパイ、復習{ふくしゅう}サボってません？ たまってますよ～、ざーこ♪', '선배, 복습 땡땡이치고 있죠? 쌓였어요~, 허접♪'),
    L('復習{ふくしゅう}、たまってるぞ。後回{あとまわ}しにすると泣{な}くのはお前{まえ}だからな。', '복습 쌓였다. 미루면 우는 건 너야.'),
  ],
  correct: [
    L('…ちっ、正解{せいかい}です。たまたまですよね？', '…쳇, 정답이에요. 우연이죠?'),
    L('正解{せいかい}。…やるじゃん。', '정답. …제법인데.'),
    L('正解{せいかい}。その調子{ちょうし}だ。', '정답. 그 기세다.'),
    L('せ、正解{せいかい}…！ すごい…ふひ', '정, 정답…! 대단해…후히'),
    L('ほう、覚{おぼ}えてたか。褒{ほ}めてやるよ。', '호오, 기억하고 있었군. 칭찬해 주지.'),
  ],
  wrong: [
    L('えー、センパイこんなのも分{わ}かんないんですかぁ？ ざーこ♪', '에—, 선배 이런 것도 몰라요? 허접♪'),
    L('ぷぷっ、ハズレ～。復習{ふくしゅう}リスト行{い}きでーす♪', '풉, 땡~. 복습 리스트 행이에요♪'),
    L('…ドンマイ。次{つぎ}、取{と}り返{かえ}せばいいだろ。', '…돈마이. 다음에 만회하면 되잖아.'),
    L('…だ、大丈夫{だいじょうぶ}。私{わたし}も昔{むかし}、同{おな}じとこで間違{まちが}えた…', '…괘, 괜찮아. 나도 옛날에 같은 데서 틀렸어…'),
  ],
  quotes: [
    L('こ、この台詞{せりふ}…実{じつ}は文法{ぶんぽう}的{てき}にもすごく勉強{べんきょう}になるの…', '이, 이 대사… 사실 문법적으로도 공부가 엄청 돼…'),
    L('名台詞{めいぜりふ}で覚{おぼ}えると、忘{わす}れないんだ…ふひひ', '명대사로 외우면 안 잊어버려…후히히'),
  ],
  study: [
    L('本気{ほんき}でやるなら、ここだ。覚{おぼ}えたいものにチェックを入{い}れな。', '진심으로 할 거면 여기다. 외우고 싶은 것에 체크해.'),
    L('暗記{あんき}カードは毎日{まいにち}少{すこ}しずつ。それが一番{いちばん}の近道{ちかみち}だよ。', '암기 카드는 매일 조금씩. 그게 제일 빠른 길이야.'),
  ],
  deckDone: [
    L('今日{きょう}のカード、全部{ぜんぶ}終{お}わり～。センパイにしてはやりますね', '오늘 카드 끝~. 선배치고는 하네요'),
    L('積{つ}み重{かさ}ねが力{ちから}になる。いい仕上{しあ}がりだ。', '쌓인 게 힘이 된다. 좋은 마무리다.'),
  ],
  talk: [L('会話{かいわ}の練習{れんしゅう}？ …いいよ。セッションみたいなもんだろ。', '회화 연습? …좋아. 합주 같은 거잖아.')],
};

export const SPEAKER: Record<keyof typeof LINES, MemberId[]> = {
  greetMorning: ['minato', 'hiyori'],
  greet: ['saeko', 'shizuku', 'minato', 'hiyori', 'ritsu'],
  allDone: ['saeko', 'hiyori'],
  reviewDue: ['hiyori', 'saeko'],
  correct: ['hiyori', 'ritsu', 'minato', 'shizuku', 'saeko'],
  wrong: ['hiyori', 'hiyori', 'ritsu', 'shizuku'],
  quotes: ['shizuku', 'shizuku'],
  study: ['saeko', 'saeko'],
  deckDone: ['hiyori', 'saeko'],
  talk: ['ritsu'],
};

/** A line and who says it. `seed` picks deterministically (e.g. by day); omit for random. */
export function say(kind: keyof typeof LINES, seed?: number): { member: Member; line: Line } {
  const lines = LINES[kind];
  const i = seed === undefined ? Math.floor(Math.random() * lines.length) : Math.abs(seed) % lines.length;
  return { member: CAST[SPEAKER[kind][i]], line: lines[i] };
}
