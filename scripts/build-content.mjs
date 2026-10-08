// Bundle content-src/** into public/data/*.json with stable IDs.
// Invalid items are skipped with a warning so one typo never breaks the deploy.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJText } from './jtext.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'content-src');
const OUT = join(ROOT, 'public', 'data');

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function readDir(dir) {
  const full = join(SRC, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
    .map((f) => ({ file: `${dir}/${f}`, data: JSON.parse(readFileSync(join(full, f), 'utf8')) }));
}

let warnings = 0;
function warn(msg) {
  warnings++;
  console.warn(`  ⚠ ${msg}`);
}

function jtextOk(s, where) {
  if (typeof s !== 'string' || !s) return warn(`${where}: 빈 문장`), false;
  const p = parseJText(s);
  if (p.errors.length) return warn(`${where}: ${p.errors[0]}`), false;
  return true;
}
const plainOf = (s) => parseJText(s).plain;

function clozeOk(c, jp, where) {
  if (!c || !Array.isArray(c.distractors) || c.distractors.length < 3) return warn(`${where}: cloze 형식 오류`), false;
  if (!plainOf(jp).includes(c.target)) return warn(`${where}: cloze target 「${c.target}」 없음`), false;
  return true;
}

// ───── vocab ─────
const words = [];
const seenWords = new Set();
for (const { file, data } of readDir('vocab')) {
  for (const w of data) {
    const where = `${file} ${w.word}`;
    const key = `${w.word}|${w.reading}`;
    if (seenWords.has(key)) {
      warn(`${where}: 중복 단어 (건너뜀)`);
      continue;
    }
    if (!w.examples?.length || !w.examples.every((e, i) => jtextOk(e.jp, `${where} ex${i}`))) continue;
    if (!clozeOk(w.cloze, w.examples[w.cloze?.ex ?? 0]?.jp ?? '', where)) continue;
    seenWords.add(key);
    words.push({ id: `w:${w.word}:${w.reading}`, ...w });
  }
}

// ───── grammar ─────
const grammar = [];
const seenGrammar = new Set();
for (const { file, data } of readDir('grammar')) {
  for (const g of data) {
    const where = `${file} ${g.pattern}`;
    if (seenGrammar.has(g.pattern)) {
      warn(`${where}: 중복 문법 (건너뜀)`);
      continue;
    }
    if (!g.examples?.every((e, i) => jtextOk(e.jp, `${where} ex${i}`))) continue;
    const cloze = (g.cloze ?? []).filter((c, i) => clozeOk(c, g.examples[c.ex]?.jp ?? '', `${where} cloze${i}`));
    if (!cloze.length) continue;
    seenGrammar.add(g.pattern);
    grammar.push({ id: `g:${g.pattern}`, ...g, cloze });
  }
}

// ───── phrases ─────
const phrases = [];
const seenPhrases = new Set();
for (const { file, data } of readDir('phrases')) {
  for (const ph of data) {
    const where = `${file} ${ph.expression}`;
    if (!jtextOk(ph.jp, where) || !clozeOk(ph.cloze, ph.jp, where)) continue;
    const plain = plainOf(ph.jp);
    if (seenPhrases.has(plain)) {
      warn(`${where}: 중복 문장 (건너뜀)`);
      continue;
    }
    seenPhrases.add(plain);
    phrases.push({ id: `p:${ph.expression}:${hash(plain)}`, ...ph });
  }
}

// ───── qa ─────
const qa = { situations: [], opinions: [], roleplays: [] };
for (const { file, data } of readDir('qa')) {
  for (const s of data.situations ?? []) if (jtextOk(s.line, `${file} situation`)) qa.situations.push({ id: `s:${hash(s.line)}`, ...s });
  for (const o of data.opinions ?? []) if (jtextOk(o.question, `${file} opinion`)) qa.opinions.push({ id: `o:${hash(o.question)}`, ...o });
  for (const r of data.roleplays ?? []) if (jtextOk(r.opening, `${file} roleplay`)) qa.roleplays.push({ id: `r:${hash(r.title + r.opening)}`, ...r });
}

// ───── quotes ─────
const quotes = [];
const seenQuotes = new Set();
for (const { file, data } of readDir('quotes')) {
  for (const q of data) {
    const where = `${file} ${q.work}`;
    if (!jtextOk(q.line, where) || !q.examples?.every((e, i) => jtextOk(e.jp, `${where} ex${i}`))) continue;
    const key = `${q.work}|${plainOf(q.line)}`;
    if (seenQuotes.has(key)) {
      warn(`${where}: 중복 대사 (건너뜀)`);
      continue;
    }
    seenQuotes.add(key);
    quotes.push({ id: `q:${hash(key)}`, ...q });
  }
}

// ───── character art dropped into public/characters ─────
const charDir = join(ROOT, 'public', 'characters');
const characters = existsSync(charDir) ? readdirSync(charDir).filter((f) => /.(png|webp|jpg)$/i.test(f)).sort() : [];

mkdirSync(OUT, { recursive: true });
const write = (name, value) => writeFileSync(join(OUT, `${name}.json`), JSON.stringify(value));
write('vocab', words);
write('grammar', grammar);
write('phrases', phrases);
write('qa', qa);
write('quotes', quotes);
write('characters', characters);

const lv = (xs) => ['N3', 'N2', 'N1'].map((l) => `${l} ${xs.filter((x) => x.level === l).length}`).join(' / ');
console.log(`content: 단어 ${words.length} (${lv(words)}), 문법 ${grammar.length} (${lv(grammar)}), 문장 ${phrases.length} (${lv(phrases)}), ` +
  `상황 ${qa.situations.length}, 의견 ${qa.opinions.length}, 롤플레이 ${qa.roleplays.length}, 명대사 ${quotes.length}, 캐릭터 그림 ${characters.length}` + (warnings ? ` — 경고 ${warnings}개` : ''));
