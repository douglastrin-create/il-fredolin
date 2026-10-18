#!/usr/bin/env node
/* Il Fredolin · regras de dependência entre camadas.
   Todos os módulos compartilham um escopo global (o app é um arquivo só), então nada impede o motor de chamar a
   interface por engano. Este verificador impede: lê as declarações de topo de cada módulo (function, const, let,
   class) e procura, no código de cada camada, nomes declarados por camadas que ela não pode usar.

   Regras (camada → não pode usar nomes de):
     core     → product, data, security, ui    (o núcleo científico roda no Web Worker e no Node, sem tela)
     product  → data, security, ui
     data     → ui                             (exceto a lista de exceções conhecidas abaixo)
     security → ui
   Comentários e textos entre aspas são ignorados na busca.

   Uso: node tools/layers.mjs [--json]
   Exceções conhecidas ficam em tools/layers-known.json: cada uma é dívida registrada; uma exceção nova falha o CI,
   e uma exceção que deixou de existir também (para a lista nunca ficar velha). */
import fs from 'node:fs';
import path from 'node:path';
import { readManifest } from './build.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const FORBID = { core: ['product', 'data', 'security', 'ui'], product: ['data', 'security', 'ui'], data: ['ui'], security: ['ui'] };
const layerOf = f => f.split('/')[0];

/* remove comentários, strings e templates (mantendo ${...} dos templates, que é código) */
export function stripCode(src) {
  let out = '', i = 0; const n = src.length; const stack = [];
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (stack.length && stack[stack.length - 1] === '`') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); out += ' '; i++; continue; }
      if (c === '$' && d === '{') { stack.push('{'); out += ' '; i += 2; continue; }
      i++; continue;
    }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") { const q = c; i++; while (i < n && src[i] !== q && src[i] !== '\n') { if (src[i] === '\\') i++; i++; } i++; out += ' '; continue; }
    if (c === '`') { stack.push('`'); out += ' '; i++; continue; }
    if (c === '{' && stack.length) { stack.push('{'); out += c; i++; continue; }
    if (c === '}' && stack.length && stack[stack.length - 1] === '{') { stack.pop(); if (stack.length && stack[stack.length - 1] === '`') { out += ' '; i++; continue; } out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

/* declarações de topo: linha começando (sem recuo) com function/const/let/var/class, incluindo listas "const a=1,b=2" */
export function topDecls(code) {
  const names = new Set();
  for (const line of code.split('\n')) {
    let m = line.match(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/) || line.match(/^class\s+([A-Za-z_$][\w$]*)/);
    if (m) { names.add(m[1]); continue; }
    m = line.match(/^(?:const|let|var)\s+(.*)$/);
    if (!m) continue;
    /* nomes no nível 0 de parênteses/chaves da lista de declaração */
    let depth = 0, tok = '', expectName = true;
    for (const ch of m[1]) {
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      if (depth === 0 && ch === ',') { expectName = true; tok = ''; continue; }
      if (expectName) {
        if (/[\w$]/.test(ch)) tok += ch;
        else if (tok) { names.add(tok); expectName = false; tok = ''; }
        else if (ch !== ' ') expectName = false;
      }
      if (depth === 0 && ch === ';') break;
    }
    if (expectName && tok) names.add(tok);
  }
  return names;
}

/* nomes declarados localmente em qualquer ponto do módulo (variáveis, parâmetros, catch). Um nome local com o mesmo
   nome de um global de outra camada (ex.: S = soluto na curva de congelamento, S = estado da tela) não é dependência.
   Aproximação conservadora: se o módulo declara o nome localmente em algum lugar, ele não é contado. */
export function localNames(code) {
  const out = new Set(); const add = list => list.split(',').forEach(x => { const m = x.replace(/[{}\[\]]/g, ' ').trim().match(/^(?:\.\.\.)?([A-Za-z_$][\w$]*)/); if (m) out.add(m[1]); });
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s+[{[]([^=]*?)[}\]]\s*=/g)) add(m[1]);
  for (const m of code.matchAll(/[,;]\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/g)) out.add(m[1]);
  for (const m of code.matchAll(/function\s*[\w$]*\s*\(([^()]*)\)/g)) add(m[1]);
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) add(m[1]);
  for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) out.add(m[1]);
  for (const m of code.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  for (const m of code.matchAll(/for\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  return out;
}

export function analyzeLayers() {
  const files = readManifest().files.filter(f => f.endsWith('.js'));
  const info = files.map(f => { const raw = fs.readFileSync(path.join(SRC, f), 'utf8'); const code = stripCode(raw); return { f, layer: layerOf(f), code, decl: topDecls(code), local: localNames(code) }; });
  const owner = new Map();
  for (const x of info) for (const nm of x.decl) if (!owner.has(nm)) owner.set(nm, x);
  const out = [];
  for (const x of info) {
    const bad = FORBID[x.layer]; if (!bad) continue;
    /* chave de objeto ({S:1.2}) não é uso do nome; ternário (a?S:b) é */
    const words = new Set([...x.code.matchAll(/(?<![\w$.])[A-Za-z_$][\w$]*/g)].filter(mm => !(/^\s*:(?!:)/.test(x.code.slice(mm.index + mm[0].length)) && /[{,]\s*$/.test(x.code.slice(Math.max(0, mm.index - 20), mm.index)))).map(mm => mm[0]));
    for (const w of words) {
      const o = owner.get(w);
      if (!o || o === x || !bad.includes(o.layer) || x.decl.has(w) || x.local.has(w)) continue;
      out.push({ file: x.f, uses: w, from: o.f });
    }
  }
  return { files: info.map(x => ({ f: x.f, layer: x.layer, decl: x.decl.size })), violations: out.sort((a, b) => (a.file + a.uses).localeCompare(b.file + b.uses)) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const r = analyzeLayers();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r.violations, null, 1)); process.exit(0); }
  const knownPath = path.join(ROOT, 'tools', 'layers-known.json');
  const known = fs.existsSync(knownPath) ? JSON.parse(fs.readFileSync(knownPath, 'utf8')).known : [];
  const key = v => `${v.file} → ${v.uses} (${v.from})`;
  const K = new Set(known.map(key)), V = new Set(r.violations.map(key));
  const novas = [...V].filter(k => !K.has(k)), sumiram = [...K].filter(k => !V.has(k));
  const byLayer = {}; r.files.forEach(x => { byLayer[x.layer] = (byLayer[x.layer] || 0) + 1; });
  console.log('módulos por camada: ' + Object.entries(byLayer).map(([k, v]) => k + ' ' + v).join(', '));
  console.log(`dependências proibidas: ${V.size} (todas registradas: ${novas.length ? 'não' : 'sim'})`);
  if (novas.length) { console.error('\nDependência nova entre camadas (não permitida):\n  ' + novas.join('\n  ')); }
  if (sumiram.length) { console.error('\nExceção registrada que não existe mais (remova de tools/layers-known.json):\n  ' + sumiram.join('\n  ')); }
  process.exit(novas.length || sumiram.length ? 1 : 0);
}
