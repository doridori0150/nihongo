// Jokes, quips and YouTube links. Puns are classic Japanese おやじギャグ / 言葉遊び.

export interface Dajare {
  jp: string; // JText
  ko: string;
  explain: string;
  risk: string;
}

export const DAJARE: Dajare[] = [
  { jp: '布団{ふとん}が吹{ふ}っ飛{と}んだ', ko: '이불이 날아갔다', explain: '「ふとん」과 「ふっとん(だ)」의 소리 놀이. 일본 아재개그의 교과서.', risk: '사용 시 분위기도 같이 날아갈 수 있음 🌬️' },
  { jp: 'アルミ缶{かん}の上{うえ}にあるミカン', ko: '알루미늄 캔 위에 있는 귤', explain: '「アルミカン」과 「あるミカン(있는 귤)」이 같은 소리.', risk: '편의점에서 실제 상황 재현 금지 🍊' },
  { jp: '電話{でんわ}に誰{だれ}も出{で}んわ', ko: '전화를 아무도 안 받네', explain: '「でんわ(電話)」와 간사이풍 「出んわ(안 나오네)」.', risk: '회사 전화 당번이 쓰면 혼남 ☎️' },
  { jp: '内容{ないよう}がないよう', ko: '내용이 없는 것 같아', explain: '「内容(ないよう)」+「ないよう(없는 듯)」. 회의록 리뷰할 때 속으로만.', risk: '상사 보고서에 쓰면 커리어도 ないよう 😇' },
  { jp: '校長{こうちょう}先生{せんせい}、絶好調{ぜっこうちょう}', ko: '교장 선생님 컨디션 최고', explain: '「こうちょう」가 두 번! 조회 시간 단골 개그.', risk: '교장 선생님은 이미 수백 번 들었음 🧑‍🏫' },
  { jp: 'トイレに行{い}っといれ', ko: '화장실 다녀와', explain: '「トイレ」와 「行っといれ(다녀와)」. 엄마 개그 계열.', risk: '여행 중 일행에게 쓰면 의외로 반응 좋음 🚻' },
  { jp: 'イクラはいくら？', ko: '연어알은 얼마야?', explain: '「イクラ(연어알)」와 「いくら(얼마)」. 초밥집 필수 개그.', risk: '카운터 초밥집에서 쓰면 셰프가 웃어 줄지도 🍣' },
  { jp: 'カエルが帰{かえ}る', ko: '개구리가 집에 간다', explain: '「カエル(개구리)」와 「帰る(돌아가다)」. 퇴근할 때 쓰기 좋음.', risk: '정시 퇴근용 명분으로 활용 가능 🐸' },
  { jp: 'スキーが好{す}きー', ko: '스키가 좋아~', explain: '「スキー」와 「好きー」. 겨울 한정 개그.', risk: '여름에 쓰면 더 추워짐 ⛷️' },
  { jp: 'ドイツ人{じん}はどいつだ？', ko: '독일인은 어느 녀석이야?', explain: '「ドイツ」와 「どいつ(어느 녀석)」.', risk: '실제 독일인 앞에서는 자제 🇩🇪' },
  { jp: '怪盗{かいとう}が回答{かいとう}した', ko: '괴도가 대답했다', explain: '「怪盗」와 「回答」 둘 다 かいとう. 추리 만화 팬 전용.', risk: '탐정물 덕후 인증 🎩' },
  { jp: 'コーディネートはこうでねーと', ko: '코디는 이래야지', explain: '「コーディネート」와 「こうでねーと(이래야지)」. 옷가게 단골 개그.', risk: '점원이 쓰면 구매욕 -10 👗' },
  { jp: 'そんなバナナ', ko: '그럴 리가 (바나나)', explain: '「そんなばかな(그럴 리가)」를 바나나로 비튼 고전. 지금도 은근히 씀.', risk: '쇼와 시대 감성 주의 🍌' },
  { jp: '屋根{やね}が飛{と}んで、やーね', ko: '지붕이 날아가다니 싫다~', explain: '「やね(지붕)」와 「やーね(싫다~)」.', risk: '태풍 뉴스 볼 때는 참아요 🏠' },
  { jp: 'ダジャレを言{い}うのは誰{だれ}じゃ', ko: '말장난 하는 게 누구냐', explain: '「ダジャレ」와 「誰じゃ」. 개그를 개그로 받아치는 메타 개그.', risk: '무한 루프 주의 🔁' },
  { jp: 'パンダのパンだ', ko: '판다의 빵이다', explain: '「パンダ」와 「パンだ(빵이다)」. 우에노 동물원 근처 빵집 느낌.', risk: '판다 빵은 실제로 존재함 🐼' },
  { jp: 'レモンの入{い}れもん', ko: '레몬 넣는 그릇', explain: '「レモン」과 「入れもん(入れ物의 구어)」.', risk: '요리 프로에서 들으면 반가움 🍋' },
  { jp: '了解{りょうかい}道中{どうちゅう}膝栗毛{ひざくりげ}', ko: '오케이~ (고전 패러디)', explain: '「了解(알겠어)」에 에도 시대 소설 『東海道中膝栗毛』를 붙인 말장난.', risk: '쓰는 순간 나이가 드러남 📜' },
  { jp: '驚{おどろ}き桃{もも}の木{き}山椒{さんしょ}の木{き}', ko: '놀랐다! (운율 놀이)', explain: '「驚き」의 「き」에 「桃の木」「山椒の木」를 이어 붙인 옛 말놀이.', risk: '할머니 할아버지와 급속 친해짐 🍑' },
  { jp: 'なんてこったパンナコッタ', ko: '이럴 수가 판나코타', explain: '「なんてこった(이럴 수가)」와 디저트 판나코타.', risk: '디저트 가게에서 쓰면 점원이 웃을 확률 50% 🍮' },
  { jp: 'その手{て}は桑名{くわな}の焼{や}き蛤{はまぐり}', ko: '그 수에는 안 넘어가', explain: '「その手は食わない」의 「くわな」를 미에현 桑名의 명물 구운 대합으로 이은 옛 말장난.', risk: '사기 전화 받았을 때 써 보기 🦪' },
  { jp: '猫{ねこ}が寝転{ねころ}んだ', ko: '고양이가 드러누웠다', explain: '「ねこ」와 「ねころ(んだ)」. 고양이 카페에서 쓸 기회 많음.', risk: '고양이는 관심 없음 🐈' },
  { jp: 'ありがとうさぎ', ko: '고마워 토끼', explain: '「ありがとう」+「うさぎ」. 광고로 유명해진 귀여운 인사.', risk: '30대 이상에게만 통할 수 있음 🐰' },
  { jp: 'アイスを愛{あい}す', ko: '아이스크림을 사랑해', explain: '「アイス」와 「愛す(사랑하다)」. 여름 편의점 앞에서.', risk: '다이어트 중엔 금지어 🍦' },
  { jp: 'ニューヨークで入浴{にゅうよく}', ko: '뉴욕에서 목욕', explain: '「ニューヨーク」와 「入浴(にゅうよく)」.', risk: '온천 여행 단톡방용 ♨️' },
  { jp: 'チーターがおっこちーたー', ko: '치타가 떨어졌다', explain: '「チーター」와 「落っこちた(떨어졌다)」를 길게 늘인 것.', risk: '동물원 사육사에겐 웃기지 않음 🐆' },
  { jp: '草{くさ}生{は}える', ko: 'ㅋㅋㅋ (풀 자란다)', explain: '인터넷 웃음 표시 「www」가 풀처럼 보여서 「草」=웃김. 「大草原{だいそうげん}」은 ㅋㅋㅋㅋㅋ급.', risk: '어른에게 쓰면 세대 차이 체감 🌱' },
  { jp: '復習{ふくしゅう}は復讐{ふくしゅう}じゃない', ko: '복습은 복수가 아니다', explain: '「復習(복습)」과 「復讐(복수)」 둘 다 ふくしゅう. 이 앱의 복습함도 복수하러 오는 건 아님.', risk: '시험 기간엔 둘 다 같은 느낌 😈' },
];

export function dajareOf(dayIndex: number): Dajare {
  return DAJARE[((dayIndex % DAJARE.length) + DAJARE.length) % DAJARE.length];
}

// ───────── lesson quips ─────────

export const PRAISE = [
  '정답! 센세가 박수 치는 중 👏',
  'すごい！ 이 정도면 편의점 점원이랑 스몰토크 가능',
  '완벽해요! 오늘 밤 꿈은 일본어로 꿀 듯',
  'その通り！ 혹시 전생에 에도 사람?',
  '정답! 일본 할머니가 사탕 줄 실력 🍬',
  '天才(てんさい)か…？ 천재인가…?',
  'ピンポーン！ 딩동댕~',
  '좋아요! 뇌에 저장 완료 💾',
];

export const OOPS = [
  '아깝다! 復習(ふくしゅう)은 復讐(ふくしゅう)가 아니니 겁먹지 마요',
  'ドンマイ！ (Don’t mind, 신경 쓰지 마)',
  '惜しい(おしい)！ 이 단어도 덤으로 외워요 = 아깝다!',
  '괜찮아요, 일본인도 한자 시험은 망해요',
  '틀린 건 오래 기억나요. 과학이에요 (아마도) 🧪',
  '복습함에 넣어둘게요. 내일 또 만나요 👋',
];

export const pickOne = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

export function completeQuip(acc: number): { emoji: string; quip: string } {
  if (acc === 100) return { emoji: '🏆', quip: '완벽! 혹시 전생에 일본인이었어요?' };
  if (acc >= 85) return { emoji: '🎉', quip: '훌륭해요! 오늘의 당신, 꽤 ペラペラ(술술)' };
  if (acc >= 60) return { emoji: '👍', quip: '좋아요! 틀린 건 복습함에 고이 모셔 뒀어요' };
  return { emoji: '🙈', quip: '오늘은 워밍업이었던 걸로 합시다. 내일의 나, 화이팅!' };
}

export function comboText(n: number): string {
  if (n >= 10) return `🔥 ${n}연속! 무적 모드`;
  if (n >= 5) return `🔥 ${n}연속! 손이 뜨거워`;
  return `🔥 ${n}`;
}

// ───────── YouTube ─────────

const LANGCHAN = `https://www.youtube.com/@${encodeURIComponent('알려줘랭짱')}`;

export const ytSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const langChanSearch = (q: string) => `${LANGCHAN}/search?query=${encodeURIComponent(q)}`;

export const CHANNELS: { name: string; desc: string; url: string }[] = [
  { name: '알려줘 랭짱', desc: '지금 일본인이 쓰는 회화를 애니처럼 재밌게', url: LANGCHAN },
  { name: 'Japanese Ammo with Misa', desc: '문법 뉘앙스를 꼼꼼하게 (영어 설명)', url: ytSearch('Japanese Ammo with Misa') },
  { name: 'さんぼん塾 Sambon Juku', desc: 'N3~N1 문법을 쉬운 일본어로', url: ytSearch('さんぼん塾 文法') },
  { name: 'Easy Japanese', desc: '길거리 인터뷰로 진짜 말투 듣기', url: ytSearch('Easy Japanese street interview') },
  { name: 'NHK やさしい日本語', desc: '쉬운 일본어 뉴스·생활 표현', url: ytSearch('NHK やさしい日本語') },
];
