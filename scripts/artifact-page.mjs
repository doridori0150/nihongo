// Turns a Vite build into a claude.ai Artifact page: writes <dist>/artifact.html (body content only —
// the Artifact publisher adds the document skeleton) and prints the supporting files to publish.
// Usage: node scripts/artifact-page.mjs <distDir>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2];
if (!dist) {
  console.error('usage: node scripts/artifact-page.mjs <distDir>');
  process.exit(2);
}

const index = readFileSync(join(dist, 'index.html'), 'utf8');
const pick = (re) => [...index.matchAll(re)].map((m) => m[0]);
const fonts = pick(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g);
const styles = pick(/<link rel="stylesheet"[^>]+href="\.\/assets\/[^"]+"[^>]*>/g);
const preloads = pick(/<link rel="modulepreload"[^>]+>/g);
const scripts = pick(/<script type="module"[^>]+src="\.\/assets\/[^"]+"[^>]*><\/script>/g);
if (!styles.length || !scripts.length) throw new Error('could not find the built stylesheet/script in index.html');

const page = [
  '<title>にほんご Daily</title>',
  ...fonts,
  ...styles,
  ...preloads,
  '<div id="root"></div>',
  ...scripts,
  '',
].join('\n');
writeFileSync(join(dist, 'artifact.html'), page);

const files = {};
for (const dir of ['assets', 'data']) {
  for (const f of readdirSync(join(dist, dir))) files[`${dir}/${f}`] = join(dist, dir, f).replace(/\\/g, '/');
}
console.log(JSON.stringify({ page: join(dist, 'artifact.html').replace(/\\/g, '/'), files }, null, 2));
