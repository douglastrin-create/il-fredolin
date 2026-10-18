#!/usr/bin/env node
/* Il Fredolin · casos de referência (§48–49): previsões condicionais do motor atual para cada caso de
   docs/validacao/casos.json, e medições ao lado quando existirem (com lote, data e instrumento).
   Uso: node tools/validacao.mjs            → imprime e grava docs/validacao/PREVISOES.md
        node tools/validacao.mjs --stdout   → só imprime
   Previsão condicional = o que o motor espera para ESTA receita e ESTE processo, sem calibração pelos lotes. */
import fs from 'node:fs';
import path from 'node:path';
import { loadEngine } from '../tests/node/harness.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export function loadCases() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/validacao/casos.json'), 'utf8')); }

export function predictCases(E = loadEngine()) {
  E.CAL.on = false;
  const doc = loadCases(); const out = [];
  for (const c of doc.casos) {
    if (c.pendente) { out.push({ c, pend: c.pendente }); continue; }
    let recipe = c.recipe;
    if (c.preset) { const p = E.PRESETS.find(x => x.name === c.preset); if (!p) throw new Error('preset inexistente: ' + c.preset); recipe = p.recipe.map(([id, g]) => ({ id, g })); }
    if (c.generate) { const g = E.generate({ tipo: c.tipo, batch: (c.proc && c.proc.load) || 1000, fixed: [], ...E.genDef(c.tipo), ...c.generate, stabId: 'neutro', stabGkg: 3, vit: c.vit, proc: {} }); if (!g.ok) throw new Error(c.id + ': ' + g.msg); recipe = Array.from(g.recipe, x => ({ id: x.id, g: x.g })); }
    for (const r of recipe) if (!E.ING_BY[r.id]) throw new Error(c.id + ': ingrediente inexistente ' + r.id);
    /* escala para a carga do processo (ex.: 1.100 g na Maestro) mantendo as proporções */
    const tot = recipe.reduce((a, r) => a + r.g, 0), load = c.proc && c.proc.load;
    if (load) recipe = recipe.map(r => ({ id: r.id, g: Math.round(r.g * load / tot * 100) / 100 }));
    const proc = Object.assign({}, E.PROC0, c.proc || {});
    const st = { tipo: c.tipo, vit: c.vit, recipe, proc, brix: {}, costs: {} };
    const m = E.analyze(st);
    const H = proc.storeT != null ? E.hardenModel(m, proc, proc.poteMl) : null;
    const P = proc.serveFrom === 'pote' ? E.poteModel(m, proc) : null;
    const q = E.quenelleModel(m);
    out.push({ c, tot: m.tot, p: { serveT: m.serveT, fzVit: m.fzVit, sol: m.sol, fat: m.fat, pod: m.pod, ov: m.ov, melt10: m.melt10, brix: m.brixMix, ph: m.ph,
      hardMin: H && H.tDone != null ? H.tDone : null, poteMl: proc.poteMl, storeT: proc.storeT, scoopAtWait: P ? P.atWait.scoop : null, waitMin: P ? P.wait : null, readyMin: P ? P.tReady : null, quenelleT: q ? q.T : null } });
  }
  return { doc, out };
}

const f = (v, d = 1) => v == null || !isFinite(v) ? '—' : Number(v).toFixed(d).replace('.', ',');
export function report({ doc, out }) {
  const L = ['# Casos de referência — previsões condicionais', '',
    `Gerado por \`node tools/validacao.mjs\` a partir de \`docs/validacao/casos.json\` (${doc.casos.length} casos). Previsão **sem calibração** pelos lotes. Nenhum caso tem medição ainda: a coluna "Medido" fica vazia até existir um lote real com lote, data e instrumento.`, '',
    '| Caso | Categoria | Serviço ideal (°C) | Congelada (%) | Sólidos (%) | POD (%) | Overrun (%) | Derretido 10 min (%) | Endurecer pote (min) | Colher após espera (°C) | No ponto após (min) | Quenelle (°C) | Medido |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const r of out) {
    if (r.pend) { L.push(`| ${r.c.id} | ${r.c.categoria} | pendente: ${r.pend} ||||||||||| — |`); continue; }
    const p = r.p;
    L.push(`| ${r.c.id} | ${r.c.categoria} | ${f(p.serveT)} | ${f(p.fzVit, 0)} | ${f(p.sol)} | ${f(p.pod)} | ${f(p.ov, 0)} | ${f(p.melt10, 0)} | ${p.hardMin != null ? f(p.hardMin, 0) + (p.poteMl ? ` (${p.poteMl} mL a ${p.storeT} °C)` : '') : '—'} | ${p.scoopAtWait != null ? f(p.scoopAtWait) + ` (${p.waitMin} min)` : '—'} | ${p.scoopAtWait != null ? (p.readyMin != null ? f(p.readyMin, 0) : '> 40') : '—'} | ${f(p.quenelleT)} | ${r.c.medicoes ? 'sim' : '—'} |`);
  }
  L.push('', 'Cenários do §49 com previsão: ' + [...new Set(doc.casos.filter(c => !c.pendente).flatMap(c => c.cenario49 || []))].join('; ') + '. Pendentes: ' + (doc.casos.filter(c => c.pendente).map(c => c.categoria).join('; ') || 'nenhum') + '.', '', '"Colher após espera" é a camada de servir depois da espera na cozinha (temperagem); "No ponto após" é quando ela chega à temperatura de serviço ideal da receita.', '');
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const md = report(predictCases());
  console.log(md);
  if (!process.argv.includes('--stdout')) fs.writeFileSync(path.join(ROOT, 'docs/validacao/PREVISOES.md'), md + '\n');
}
