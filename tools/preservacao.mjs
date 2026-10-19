#!/usr/bin/env node
/* Il Fredolin · preservação funcional (Fase 10, §5): toda página, ação (data-a), alteração (data-c), campo (data-i) e
   chave guardada no aparelho da versão de referência continua existindo na versão atual.
   Uso: node tools/preservacao.mjs <commit> [--json] */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const OLD = process.argv[2] || '52f99f0';
const oldH = execSync(`git show ${OLD}:index.html`, { maxBuffer: 64 << 20 }).toString(), newH = fs.readFileSync('index.html', 'utf8');
const set = (h, re) => new Set([...h.matchAll(re)].map(m => m[1]));
const views = h => { const m = h.match(/const VIEW=\{([^}]*)\}/); return new Set(m ? [...m[1].matchAll(/([a-zA-Z]+):/g)].map(x => x[1]) : []); };
const kinds = {
  'páginas': [views(oldH), views(newH)],
  'ações (data-a)': [set(oldH, /data-a="([a-zA-Z]+)"/g), set(newH, /data-a="([a-zA-Z]+)"/g)],
  'alterações (data-c)': [set(oldH, /data-c="([a-zA-Z]+)"/g), set(newH, /data-c="([a-zA-Z]+)"/g)],
  'campos (data-i)': [set(oldH, /data-i="([a-zA-Z]+)"/g), set(newH, /data-i="([a-zA-Z]+)"/g)],
  'chaves locais (fredolin_*)': [set(oldH, /'(fredolin_[a-z0-9_]+)'/g), set(newH, /'(fredolin_[a-z0-9_]+)'/g)]};
/* ações chamadas por código (não por data-a) também contam como presentes se o nome da ação existir no novo */
const out = {}; let lost = 0;
for (const [k, [a, b]] of Object.entries(kinds)) { const gone = [...a].filter(x => !b.has(x) && !(k.startsWith('ações') && new RegExp(`\\b${x}:`).test(newH))); lost += gone.length; out[k] = { antes: a.size, agora: b.size, novas: [...b].filter(x => !a.has(x)).length, perdidas: gone }; }
if (process.argv.includes('--json')) console.log(JSON.stringify({ ref: OLD, perdidas: lost, ...out }, null, 1));
else { for (const [k, v] of Object.entries(out)) console.log(`${k.padEnd(28)} antes ${String(v.antes).padStart(3)} · agora ${String(v.agora).padStart(3)} · novas ${String(v.novas).padStart(3)} · perdidas ${v.perdidas.length}${v.perdidas.length ? ': ' + v.perdidas.join(', ') : ''}`); }
process.exit(lost ? 1 : 0);
