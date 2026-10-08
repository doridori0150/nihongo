// Usage: node scripts/validate-content.mjs <vocab|grammar|phrases|qa> <file.json> [...more files]
import { readFileSync } from 'node:fs';
import { parseJText } from './jtext.mjs';

const SRC = ['drama', 'anime', 'manga', 'novel', 'daily', 'travel'];
const LEVELS = ['N3', 'N2', 'N1'];
const MEDIA = ['anime', 'manga', 'game', 'drama', 'film', 'novel'];
const COURSES = ['otaku'];

const [, , type, ...files] = process.argv;
if (!['vocab', 'grammar', 'phrases', 'qa', 'quotes', 'story'].includes(type) || files.length === 0) {
  console.error('usage: node scripts/validate-content.mjs <vocab|grammar|phrases|qa|quotes> <file.json>...');
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
  if (!LEVELS.includes(w.level)) report(where, 'level 은 N3/N2/N1');
  if (w.course !== undefined && !COURSES.includes(w.course)) report(where, `course 는 ${COURSES.join('/')} 중 하나`);
  if (!Array.isArray(w.examples) || w.examples.length < 2) return report(where, 'examples 2개 이상 필요');
  const parsed = w.examples.map((ex, i) => example(`${where} ex${i}`, ex));
  if (new Set(w.examples.map((e) => e.src)).size < 2) report(where, 'examples 의 src 가 서로 달라야 함');
  cloze(where, w.cloze, parsed);
}

function checkGrammar(g, where) {
  for (const k of ['pattern', 'meaning', 'formation', 'explanation', 'theme']) str(where, g[k], k);
  if (!LEVELS.includes(g.level)) report(where, 'level 은 N3/N2/N1');
  if (!Array.isArray(g.examples) || g.examples.length < 3) return report(where, 'examples 3개 이상 필요');
  const parsed = g.examples.map((ex, i) => example(`${where} ex${i}`, ex));
  if (!Array.isArray(g.cloze) || g.cloze.length < 2) return report(where, 'cloze 2개 이상 필요');
  g.cloze.forEach((c, i) => cloze(`${where} cloze${i}`, c, parsed));
}

function checkPhrase(ph, where) {
  const p = jtext(where, ph.jp, 'jp', { minChunks: 3, maxChunks: 9 });
  for (const k of ['ko', 'scene', 'expression', 'note', 'theme']) str(where, ph[k], k);
  if (!LEVELS.includes(ph.level)) report(where, 'level 은 N3/N2/N1');
  if (!SRC.includes(ph.src)) report(where, `src는 ${SRC.join('/')} 중 하나`);
  if (p && typeof ph.expression === 'string' && !p.plain.includes(ph.expression))
    report(where, `expression 「${ph.expression}」가 문장에 없음`);
  if (p) cloze(where, ph.cloze, [p]);
}

function checkQuote(q, where) {
  const p = jtext(where, q.line, 'line', { minChunks: 1, maxChunks: 12 });
  if (p && p.plain.length > 45) report(where, `line 이 너무 김 (${p.plain.length}자, 45자 이하)`);
  for (const k of ['ko', 'work', 'work_ko', 'speaker', 'speaker_ko', 'note', 'point', 'yt', 'ref']) str(where, q[k], k);
  if (typeof q.ref === 'string' && !q.ref.startsWith('https://')) report(where, 'ref 는 https URL');
  if (!MEDIA.includes(q.medium)) report(where, `medium 은 ${MEDIA.join('/')} 중 하나`);
  if (!LEVELS.includes(q.level)) report(where, 'level 은 N3/N2/N1');
  if (!Array.isArray(q.examples) || q.examples.length < 2) return report(where, 'examples 2개 이상 필요');
  q.examples.forEach((ex, i) => example(`${where} ex${i}`, ex));
}

const BGS = ['clubroom', 'clubroom_evening', 'classroom', 'hallway', 'school_gate', 'rooftop', 'station', 'akihabara', 'shopping_street', 'convenience_store', 'beach_inn', 'festival_night', 'comiket', 'shrine_winter', 'apartment', 'kyoto_street', 'osaka_street', 'ryokan', 'live_house', 'exam_hall', 'campus', 'studio', 'airport'];
const CAST_IDS = ['saeko', 'minato', 'shizuku', 'ritsu', 'hiyori', 'akane', 'keita', 'mei', 'sota'];
const FACES = ['normal', 'happy', 'angry', 'sad', 'surprised', 'smug', 'shy'];

function checkStory(ep, file) {
  const where = ep?.id ?? file;
  for (const k of ['id', 'title_ko', 'summary_ko', 'level']) str(where, ep[k], k);
  for (const k of ['year', 'month', 'no']) if (typeof ep[k] !== 'number') report(where, `${k} 숫자 필요`);
  jtext(where, ep.title, 'title');
  if (!Array.isArray(ep.focus) || !ep.focus.length) report(where, 'focus 배열 필요');
  if (!Array.isArray(ep.terms) || ep.terms.length < 8 || ep.terms.length > 15) report(where, 'terms 8~15개 필요');
  if (!Array.isArray(ep.script)) return report(where, 'script 배열 필요');
  if (ep.script.length < 40 || ep.script.length > 90) report(where, `script 단계 수 ${ep.script.length} (40~90)`);
  const texts = [];
  let choices = 0;
  const walk = (steps, path) => {
    if (!Array.isArray(steps)) return report(where, `${path}: 배열 필요`);
    steps.forEach((s, i) => {
      const at = `${path}[${i}]`;
      const kind = ['bg', 'show', 'hide', 'narr', 'say', 'choice', 'if_aff', 'if_top'].filter((k) => k in s);
      if (kind.length !== 1) return report(where, `${at}: 명령은 하나만 (${kind.join(',') || '없음'})`);
      const k = kind[0];
      if (k === 'bg' && !BGS.includes(s.bg)) report(where, `${at}: 알 수 없는 배경 ${s.bg}`);
      if ((k === 'show' || k === 'hide') && !CAST_IDS.includes(s[k])) report(where, `${at}: 알 수 없는 캐릭터 ${s[k]}`);
      if (s.face !== undefined && !FACES.includes(s.face)) report(where, `${at}: 알 수 없는 표정 ${s.face}`);
      if (k === 'narr' || k === 'say') {
        const p = jtext(where, k === 'narr' ? s.narr : s.jp, `${at} jp`, { minChunks: 1, maxChunks: 20 });
        if (p) texts.push(p.plain);
        str(where, s.ko, `${at} ko`);
        if (k === 'say' && !['me', 'npc', ...CAST_IDS].includes(s.say)) report(where, `${at}: 알 수 없는 화자 ${s.say}`);
        if (k === 'say' && s.say === 'npc') str(where, s.who, `${at} who`);
      }
      if (k === 'choice') {
        choices++;
        str(where, s.choice, `${at} choice`);
        if (!Array.isArray(s.options) || s.options.length !== 2) return report(where, `${at}: options 2개 필요`);
        if (!s.options.some((o) => o.ok === true)) report(where, `${at}: ok:true 옵션 필요`);
        s.options.forEach((o, j) => {
          const p = jtext(where, o.jp, `${at}.options[${j}] jp`, { minChunks: 1, maxChunks: 20 });
          if (p) texts.push(p.plain);
          str(where, o.ko, `${at}.options[${j}] ko`);
          if (typeof o.ok !== 'boolean') report(where, `${at}.options[${j}]: ok boolean 필요`);
          if (o.ok === false) str(where, o.tip, `${at}.options[${j}] tip`);
          for (const m of Object.keys(o.aff ?? {})) if (!CAST_IDS.includes(m)) report(where, `${at}: aff 의 알 수 없는 캐릭터 ${m}`);
          walk(o.then, `${at}.options[${j}].then`);
        });
      }
      if (k === 'if_aff') {
        for (const m of Object.keys(s.if_aff ?? {})) if (!CAST_IDS.includes(m)) report(where, `${at}: if_aff 의 알 수 없는 캐릭터 ${m}`);
        walk(s.then, `${at}.then`);
        if (s.else !== undefined) walk(s.else, `${at}.else`);
      }
      if (k === 'if_top') {
        if (!Array.isArray(s.if_top) || s.if_top.length < 2) report(where, `${at}: if_top 은 캐릭터 2명 이상 배열`);
        if (s.year !== undefined && ![1, 2, 3].includes(s.year)) report(where, `${at}: if_top year 는 1~3`);
        for (const m of s.if_top ?? []) if (!CAST_IDS.includes(m)) report(where, `${at}: if_top 의 알 수 없는 캐릭터 ${m}`);
        for (const [m, steps] of Object.entries(s.branches ?? {})) {
          if (!(s.if_top ?? []).includes(m)) report(where, `${at}: branches.${m} 는 if_top 목록에 없음`);
          walk(steps, `${at}.branches.${m}`);
        }
        const missing = (s.if_top ?? []).filter((m) => !(m in (s.branches ?? {})));
        if (missing.length && s.else === undefined) report(where, `${at}: branches 가 없는 캐릭터(${missing.join(',')})가 있으면 else 필요`);
        if (s.else !== undefined) walk(s.else, `${at}.else`);
      }
    });
  };
  walk(ep.script, 'script');
  if (choices < 2 || choices > 4) report(where, `선택지 ${choices}개 (2~4)`);
  const all = texts.join('\n');
  (ep.terms ?? []).forEach((t, i) => {
    const p = jtext(where, t.jp, `terms[${i}] jp`, { minChunks: 1, maxChunks: 12 });
    str(where, t.ko, `terms[${i}] ko`);
    str(where, t.note, `terms[${i}] note`);
    if (p && !all.includes(p.plain)) report(where, `terms[${i}] 「${p.plain}」가 대본에 등장하지 않음`);
  });
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
  if (type === 'story') {
    itemCount++;
    checkStory(data, file);
    continue;
  }
  if (!Array.isArray(data)) {
    report(file, '최상위는 배열이어야 함');
    continue;
  }
  const seen = new Set();
  data.forEach((item, i) => {
    itemCount++;
    const label = item?.word ?? item?.pattern ?? item?.expression ?? item?.work ?? '';
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
    } else if (type === 'quotes') {
      const key = `${item.work}|${item.line}`;
      if (seen.has(key)) report(where, '파일 내 중복 대사');
      seen.add(key);
      checkQuote(item, where);
    } else {
      checkPhrase(item, where);
    }
  });
}

console.log(`\n${itemCount}개 항목, 오류 ${errorCount}개`);
process.exit(errorCount ? 1 : 0);
