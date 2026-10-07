// Usage: node scripts/validate-content.mjs <vocab|grammar|phrases|qa> <file.json> [...more files]
import { readFileSync } from 'node:fs';
import { parseJText } from './jtext.mjs';

const SRC = ['drama', 'anime', 'manga', 'novel', 'daily', 'travel'];
const LEVELS = ['N2', 'N1'];

const [, , type, ...files] = process.argv;
if (!['vocab', 'grammar', 'phrases', 'qa'].includes(type) || files.length === 0) {
  console.error('usage: node scripts/validate-content.mjs <vocab|grammar|phrases|qa> <file.json>...');
  process.exit(2);
}

let errorCount = 0;
let itemCount = 0;

function report(where, msg) {
  errorCount++;
  console.log(`  ✗ ${where}: ${msg}`);
}

function str(where, v, name, { min = 1 } = {}) {
  if (typeof v !== 'string' || v.trim().length < min) report(where, `${name} 문자열 필요`);
}

function jtext(where, v, name, { minChunks = 1, maxChunks = 12 } = {}) {
  if (typeof v !== 'string' || !v.trim()) {
    report(where, `${name} 필요`);
    return null;
  }
  const p = parseJText(v);
  for (const e of p.errors) report(where, `${name}: ${e}`);
  if (p.chunks.some((c) => c.length === 0)) report(where, `${name}: 빈 청크(|| 또는 앞뒤 |)`);
  if (p.chunks.length < minChunks || p.chunks.length > maxChunks)
    report(where, `${name}: 청크 수 ${p.chunks.length} (허용 ${minChunks}~${maxChunks})`);
  return p;
}

function example(where, ex) {
  if (!ex || typeof ex !== 'object') return report(where, 'example 객체 필요'), null;
  const p = jtext(where, ex.jp, 'jp', { minChunks: 3, maxChunks: 9 });
  str(where, ex.ko, 'ko');
  str(where, ex.scene, 'scene');
  if (!SRC.includes(ex.src)) report(where, `src는 ${SRC.join('/')} 중 하나`);
  return p;
}

function cloze(where, c, examplesParsed) {
  if (!c || typeof c !== 'object') return report(where, 'cloze 객체 필요');
  const p = examplesParsed[c.ex ?? 0];
  if (!p) return report(where, `cloze.ex=${c.ex} 에 해당하는 예문 없음`);
  str(where, c.target, 'cloze.target');
  if (typeof c.target === 'string') {
    if (/[{}|]/.test(c.target)) report(where, 'cloze.target 에 {}| 표기 금지 (순수 텍스트)');
    else if (!p.plain.includes(c.target)) report(where, `cloze.target 「${c.target}」가 예문 「${p.plain}」에 없음`);
  }
  if (!Array.isArray(c.distractors) || c.distractors.length !== 3) report(where, 'cloze.distractors 3개 필요');
  else {
    if (new Set(c.distractors).size !== 3) report(where, 'cloze.distractors 중복');
    if (c.distractors.includes(c.target)) report(where, 'cloze.distractors 에 정답 포함');
    if (c.distractors.some((d) => typeof d !== 'string' || !d || /[{}|]/.test(d)))
      report(where, 'cloze.distractors 는 순수 텍스트');
  }
}

function checkVocab(w, where) {
  str(where, w.word, 'word');
  str(where, w.reading, 'reading');
  if (typeof w.reading === 'string' && !/^[ぁ-ゟー]+$/.test(w.reading))
    report(where, 'reading 은 히라가나만');
  str(where, w.meaning, 'meaning');
  str(where, w.pos, 'pos');
  str(where, w.theme, 'theme');
  str(where, w.note, 'note');
  if (!LEVELS.includes(w.level)) report(where, 'level 은 N2/N1');
  if (!Array.isArray(w.examples) || w.examples.length < 2) return report(where, 'examples 2개 이상 필요');
  const parsed = w.examples.map((ex, i) => example(`${where} ex${i}`, ex));
  if (new Set(w.examples.map((e) => e.src)).size < 2) report(where, 'examples 의 src 가 서로 달라야 함');
  cloze(where, w.cloze, parsed);
}

function checkGrammar(g, where) {
  for (const k of ['pattern', 'meaning', 'formation', 'explanation', 'theme']) str(where, g[k], k);
  if (!LEVELS.includes(g.level)) report(where, 'level 은 N2/N1');
  if (!Array.isArray(g.examples) || g.examples.length < 3) return report(where, 'examples 3개 이상 필요');
  const parsed = g.examples.map((ex, i) => example(`${where} ex${i}`, ex));
  if (!Array.isArray(g.cloze) || g.cloze.length < 2) return report(where, 'cloze 2개 이상 필요');
  g.cloze.forEach((c, i) => cloze(`${where} cloze${i}`, c, parsed));
}

function checkPhrase(ph, where) {
  const p = jtext(where, ph.jp, 'jp', { minChunks: 3, maxChunks: 9 });
  for (const k of ['ko', 'scene', 'expression', 'note', 'theme']) str(where, ph[k], k);
  if (!LEVELS.includes(ph.level)) report(where, 'level 은 N2/N1');
  if (!SRC.includes(ph.src)) report(where, `src는 ${SRC.join('/')} 중 하나`);
  if (p && typeof ph.expression === 'string' && !p.plain.includes(ph.expression))
    report(where, `expression 「${ph.expression}」가 문장에 없음`);
  if (p) cloze(where, ph.cloze, [p]);
}

function checkQA(qa, file) {
  for (const key of ['situations', 'opinions', 'roleplays'])
    if (!Array.isArray(qa[key])) report(file, `${key} 배열 필요`);
  (qa.situations ?? []).forEach((s, i) => {
    const where = `situations[${i}]`;
    itemCount++;
    for (const k of ['scene', 'partner', 'line_ko', 'task', 'sample', 'theme']) str(where, s[k], k);
    jtext(where, s.line, 'line');
  });
  (qa.opinions ?? []).forEach((o, i) => {
    const where = `opinions[${i}]`;
    itemCount++;
    for (const k of ['question_ko', 'hint', 'sample', 'theme']) str(where, o[k], k);
    jtext(where, o.question, 'question');
  });
  (qa.roleplays ?? []).forEach((r, i) => {
    const where = `roleplays[${i}]`;
    itemCount++;
    for (const k of ['title', 'setting_ko', 'character', 'goal_ko', 'opening_ko', 'theme']) str(where, r[k], k);
    jtext(where, r.opening, 'opening');
  });
}

for (const file of files) {
  console.log(`▶ ${file}`);
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    report(file, `JSON 파싱 실패: ${e.message}`);
    continue;
  }
  if (type === 'qa') {
    checkQA(data, file);
    continue;
  }
  if (!Array.isArray(data)) {
    report(file, '최상위는 배열이어야 함');
    continue;
  }
  const seen = new Set();
  data.forEach((item, i) => {
    itemCount++;
    const label = item?.word ?? item?.pattern ?? item?.expression ?? '';
    const where = `[${i}] ${label}`;
    if (type === 'vocab') {
      const key = `${item.word}|${item.reading}`;
      if (seen.has(key)) report(where, '파일 내 중복 단어');
      seen.add(key);
      checkVocab(item, where);
    } else if (type === 'grammar') {
      if (seen.has(item.pattern)) report(where, '파일 내 중복 문법');
      seen.add(item.pattern);
      checkGrammar(item, where);
    } else {
      checkPhrase(item, where);
    }
  });
}

console.log(`\n${itemCount}개 항목, 오류 ${errorCount}개`);
process.exit(errorCount ? 1 : 0);
