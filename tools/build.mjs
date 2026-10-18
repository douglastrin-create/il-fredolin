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
  const orphan = walk(SRC).map(p => path.relative(SRC, p).split(path.sep).join('/')).filter(p => p !== 'build.json' && !seen.has(p) && !p.endsWith('.md'));
  if (orphan.length) throw new Error('arquivos em src/ fora do manifesto: ' + orphan.join(', '));
  return m;
}

export function build() {
  const m = readManifest();
  return m.files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('');
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
    console.log(`index.html confere com src/ (${readManifest().files.length} módulos, sha ${sha(out)})`);
  } else {
    fs.writeFileSync(target, out);
    console.log(`index.html gerado (${readManifest().files.length} módulos, ${out.length} caracteres, sha ${sha(out)})`);
  }
}
