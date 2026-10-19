#!/usr/bin/env node
/* Il Fredolin · comparação de comportamento entre duas versões publicadas (Fase 10: "comparar comportamento antigo e
   novo"). Carrega o motor de cada index.html (git show <commit>:index.html) num contexto isolado e calcula as mesmas
   grandezas para as 8 bases, em dois processos (padrão e set Casa). Uso: node tools/comparar-versoes.mjs <commit> [--json] */
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import fs from 'node:fs';
import { baseContext, segment } from '../tests/node/harness.mjs';
const OLD = process.argv[2] || '52f99f0';
const EXPOSE = ['analyze', 'PRESETS', 'PROC0', 'runTests', 'stTest', 'CAL', 'uncertainty', 'generate', 'genDef', 'PROF', 'GEN_DEF'];
function load(html) { const ctx = baseContext({ localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
  vm.runInContext(segment(html, '01-util.js', '38-mode.js') + `\n;globalThis.__E={${EXPOSE.map(n => `${n}:typeof ${n}!=='undefined'?${n}:null`).join(',')}};`, ctx);
  return ctx.__E; }
const oldHtml = execSync(`git show ${OLD}:index.html`, { maxBuffer: 64 << 20 }).toString(), newHtml = fs.readFileSync('index.html', 'utf8');
const A = load(oldHtml), B = load(newHtml); A.CAL.on = false; B.CAL.on = false;
const CASA = { machine: 'maqp1', load: 1100, preChill: 0, drawT: -4, drawMin: 15, matT: 4, matH: 12, coolMin: 45, serveFrom: 'pote', storeT: -19.5, storeFluct: 2, blastT: -24, hardAuto: 1, turboMin: 120, poteMl: 250, ambT: 24, waitMin: 10 };
const F = [['sol', 'Sólidos', '%', 2], ['fat', 'Gordura', '%', 2], ['msnf', 'MSNF', '%', 2], ['pod', 'POD', '%', 2], ['pacKg', 'PAC', 'g/kg', 1], ['fzVit', 'Água congelada', '%', 2], ['serveT', 'Ponto de serviço', '°C', 2], ['ov', 'Overrun', '%', 1], ['melt10', 'Derretido 10 min', '%', 1], ['visc', 'Viscosidade', 'mPa·s', 1], ['crystal', 'Cristal (índice)', 'µm', 0], ['ph', 'pH', '', 2], ['shelfVit', 'Estabilidade da textura', 'dias', 1]];
const rows = [];
for (const [proc, pn] of [[{}, 'padrão'], [CASA, 'Casa']]) for (const p of A.PRESETS) {
  const st = E => ({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc: Object.assign({}, E.PROC0, proc), brix: {}, costs: {} });
  const a = A.analyze(st(A)), b = B.analyze(st(B));
  for (const [k, n, u] of F) { const x = a[k], y = b[k]; if (typeof x !== 'number' || typeof y !== 'number') continue; rows.push({ proc: pn, base: p.name, k, n, u, old: x, new: y, d: y - x }); } }
/* partes do motor com mudança intencional na série v18 (documentadas no relatório) */
const intent = [];
for (const p of A.PRESETS) { const st = E => ({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc: Object.assign({}, E.PROC0), brix: {}, costs: {} });
  const ua = A.uncertainty(st(A)), ub = B.uncertainty(st(B)); if (ua && ub) intent.push({ what: 'Faixa de incerteza (±°C, 90%)', base: p.name, old: 1.65 * ua.sd, new: 1.65 * ub.sd, why: 'v18.11: a perturbação passou a ser na composição, não no peso' }); }
for (const tipo of ['crema', 'sorbetto', 'semacucar']) { const g = E => Object.assign({ tipo, batch: 1000, fixed: [], stabId: E.PROF[tipo] && E.PROF[tipo].base === 'sorbetto' ? 'neutro' : 'nx_fredolin', stabGkg: 25, vit: -12, proc: {} }, B.genDef(tipo));
  try { const ra = A.generate(g(A)), rb = B.generate(g(B)); const ids = r => r && r.recipe ? r.recipe.map(x => x.id + ' ' + Math.round(x.g)).join(', ') : (r && r.msg) || '—';
    intent.push({ what: 'Gerador por alvo (mesmas metas)', base: tipo, old: ids(ra), new: ids(rb), why: ids(ra) === ids(rb) ? 'idêntico' : tipo === 'semacucar' ? 'v18.5: sem açúcar com eritritol fixo, alulose e fibra; sólidos como meta' : 'v18.4: ingredientes e metas por família' }); } catch (e) { intent.push({ what: 'Gerador por alvo', base: tipo, old: 'erro', new: String(e.message), why: '' }); } }
const tA = A.runTests(), tB = B.runTests();
const sum = r => `${r.list.filter(t => t.ok).length}/${r.list.length}`;
const diffs = rows.filter(r => Math.abs(r.d) > 1e-9);
const out = { intent, old: OLD, testsOld: sum(tA), testsNew: sum(tB), compared: rows.length, changed: diffs.length,
  byField: F.map(([k, n, u]) => { const d = diffs.filter(r => r.k === k); return { k, n, u, changed: d.length, maxAbs: d.length ? Math.max(...d.map(r => Math.abs(r.d))) : 0, cases: d.map(r => `${r.base} (${r.proc}): ${r.old.toFixed(2)} → ${r.new.toFixed(2)}`) }; }) };
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
else { console.log(`testes internos: ${out.testsOld} (antigo) · ${out.testsNew} (novo) · ${out.compared} valores comparados · ${out.changed} mudaram`);
  console.log('\nmudanças intencionais:'); for (const x of intent) console.log(`  ${x.what} · ${x.base}: ${typeof x.old === 'number' ? x.old.toFixed(2) + ' → ' + x.new.toFixed(2) : '\n     antes: ' + x.old + '\n     agora: ' + x.new} (${x.why})`);
  for (const f of out.byField) console.log(`${f.n.padEnd(26)} ${String(f.changed).padStart(2)} mudaram, máx ${f.maxAbs.toFixed(3)} ${f.u}${f.changed ? '\n   ' + f.cases.slice(0, 4).join('\n   ') : ''}`); }
