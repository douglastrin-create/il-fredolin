#!/usr/bin/env node
/* Il Fredolin · montagem do app.
   O código-fonte vive em src/, em módulos por camada (core, product, data, security, ui, tests).
   Este script concatena os módulos na ordem de src/build.json e gera o index.html publicado no GitHub Pages.
   O app continua um arquivo único em produção (offline, sem etapa de build no servidor, Web Worker igual).

   Uso:
     node tools/build.mjs          gera index.html a partir de src/
     node tools/build.mjs --check  falha se index.html não for exatamente o resultado de src/ (usado no CI)
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');

export function readManifest() {
  const m = JSON.parse(fs.readFileSync(path.join(SRC, 'build.json'), 'utf8'));
  if (m.schema !== 'il-fredolin/build@1' || !Array.isArray(m.files) || !m.files.length) throw new Error('src/build.json inválido');
  const seen = new Set();
  for (const f of m.files) {
    if (seen.has(f)) throw new Error('arquivo repetido no manifesto: ' + f);
    seen.add(f);
    if (!fs.existsSync(path.join(SRC, f))) throw new Error('arquivo do manifesto não existe: src/' + f);
  }
  /* todo arquivo de código em src/ precisa estar no manifesto (nada fica de fora sem querer) */
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const orphan = walk(SRC).map(p => path.relative(SRC, p).split(path.sep).join('/')).filter(p => p !== 'build.json' && p !== (m.sw && m.sw.src) && !seen.has(p) && !p.endsWith('.md'));
  if (orphan.length) throw new Error('arquivos em src/ fora do manifesto: ' + orphan.join(', '));
  return m;
}

export function build() {
  const m = readManifest();
  return m.files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('');
}

/* service worker: leva o SHA-256 do index.html montado (a instalação confere) e a versão do app */
export function buildSW(html = build()) {
  const m = readManifest(); if (!m.sw) return null;
  const tpl = fs.readFileSync(path.join(SRC, m.sw.src), 'utf8');
  const ver = (html.match(/const VERSION='([^']+)'/) || [])[1];
  if (!ver) throw new Error('VERSION não encontrada no index.html montado');
  const full = crypto.createHash('sha256').update(html, 'utf8').digest('hex');
  if (!tpl.includes("'__INDEX_SHA__'") || !tpl.includes("'__APP_VERSION__'")) throw new Error('src/' + m.sw.src + ' sem os marcadores __INDEX_SHA__/__APP_VERSION__');
  return { out: m.sw.output, text: tpl.replace("'__INDEX_SHA__'", `'${full}'`).replace("'__APP_VERSION__'", `'${ver}'`), sha: full, ver };
}

const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const out = build();
  const target = path.join(ROOT, 'index.html');
  if (process.argv.includes('--check')) {
    const cur = fs.readFileSync(target, 'utf8');
    if (cur !== out) {
      const a = cur.split('\n'), b = out.split('\n');
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      console.error(`index.html difere de src/ (linha ${i + 1}). Edite em src/ e rode: node tools/build.mjs`);
      console.error('  index.html: ' + (a[i] || '').slice(0, 120));
      console.error('  src/:       ' + (b[i] || '').slice(0, 120));
      process.exit(1);
    }
    const sw = buildSW(out);
    if (sw && fs.readFileSync(path.join(ROOT, sw.out), 'utf8') !== sw.text) { console.error(`${sw.out} desatualizado em relação a src/. Rode: node tools/build.mjs`); process.exit(1); }
    console.log(`index.html confere com src/ (${readManifest().files.length} módulos, sha ${sha(out)})` + (sw ? ` · ${sw.out} da versão ${sw.ver}` : ''));
  } else {
    fs.writeFileSync(target, out);
    const sw = buildSW(out); if (sw) fs.writeFileSync(path.join(ROOT, sw.out), sw.text);
    console.log(`index.html gerado (${readManifest().files.length} módulos, ${out.length} caracteres, sha ${sha(out)})` + (sw ? ` · ${sw.out} (cache il-fredolin-${sw.sha.slice(0, 12)})` : ''));
  }
}
