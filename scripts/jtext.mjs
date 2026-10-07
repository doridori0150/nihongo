// JText notation shared by the content scripts and the app.
//   漢字{かんじ}  furigana for the run of kanji right before the braces
//   |             chunk boundary used by the sentence-building exercise
export const KANJI = /[㐀-䶿一-鿿豈-﫿々〆]/;
const KANA_READING = /^[ぁ-ゟ゠-ヿー・]+$/;

/** Parse JText into chunks of tokens. Returns { chunks, plain, errors }. */
export function parseJText(src) {
  const errors = [];
  const chunks = [[]];
  let i = 0;
  let pendingKanji = '';
  const flushPlain = () => {
    if (pendingKanji) {
      errors.push(`furigana 누락: 「${pendingKanji}」`);
      chunks[chunks.length - 1].push({ t: pendingKanji });
      pendingKanji = '';
    }
  };
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const end = src.indexOf('}', i);
      if (end < 0) {
        errors.push(`닫는 } 없음: ${src}`);
        break;
      }
      const reading = src.slice(i + 1, end);
      if (!pendingKanji) errors.push(`{${reading}} 앞에 한자가 없음`);
      else if (!KANA_READING.test(reading)) errors.push(`읽기가 가나가 아님: {${reading}}`);
      chunks[chunks.length - 1].push({ t: pendingKanji, r: reading });
      pendingKanji = '';
      i = end + 1;
      continue;
    }
    if (ch === '}') {
      errors.push(`여는 { 없음: ${src}`);
      i++;
      continue;
    }
    if (KANJI.test(ch)) {
      pendingKanji += ch;
      i++;
      continue;
    }
    flushPlain();
    if (ch === '|') {
      chunks.push([]);
    } else {
      const cur = chunks[chunks.length - 1];
      const last = cur[cur.length - 1];
      if (last && last.r === undefined) last.t += ch;
      else cur.push({ t: ch });
    }
    i++;
  }
  flushPlain();
  const plain = chunks.map((c) => c.map((tok) => tok.t).join('')).join('');
  return { chunks, plain, errors };
}
