/* Contratos de dados (v18.6): formato, tipo e unidade do que entra e sai do motor, e versões dos formatos persistidos.
   A descrição completa está em docs/ARQUITETURA.md (seção Contratos). Mudou um contrato? Mude o documento e este teste juntos. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadEngine, loadBackup, readApp } from './harness.mjs';

const E = loadEngine(); E.CAL.on = false;
const num = (v, lo, hi, what) => { assert.equal(typeof v, 'number', what + ' não é número'); assert.ok(Number.isFinite(v), what + ' não é finito'); assert.ok(v >= lo && v <= hi, `${what} = ${v} fora de [${lo}, ${hi}]`); };

/* Receita: lista de linhas {id: id do banco, g: gramas ≥ 0}. Estado de análise: {tipo, vit °C, recipe, proc, brix, costs}. */
test('entrada do motor: linhas {id, g} em gramas e estado {tipo, vit, recipe, proc}', () => {
  for (const p of E.PRESETS) {
    const st = E.stTest({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })) }, p.vit);
    assert.ok(E.PROF[st.tipo], 'tipo existe em PROF');
    num(st.vit, -30, 0, 'vit (°C)');
    for (const r of st.recipe) { assert.ok(E.ING_BY[r.id], 'ingrediente ' + r.id); num(+r.g, 0, 1e5, 'g'); }
    assert.equal(typeof st.proc, 'object');
  }
});

/* Saída do motor: grandezas e unidades. % = gramas por 100 g de mistura; °C; R$/kg; mPa·s; /kg = PAC por kg. */
test('saída do motor: grandezas principais com unidade e faixa física', () => {
  for (const p of E.PRESETS) for (const vit of [-11, -14]) {
    const st = E.stTest({ tipo: p.tipo, vit, recipe: p.recipe.map(([id, g]) => ({ id, g })) }, vit);
    const m = E.analyze(st);
    num(m.tot, 1, 1e6, 'tot (g)');
    for (const k of ['sol', 'fat', 'msnf', 'wat', 'fzVit', 'fzMid']) num(m[k], 0, 100, k + ' (%)');
    num(m.pod, 0, 60, 'pod (% sacarose equivalente)');
    num(m.serveT, -40, 0, 'serveT (°C)');
    num(m.ov, 0, 200, 'ov (%)');
    num(m.melt10, 3, 95, 'melt10 (% em 10 min)');
    num(m.ci, 0, 100, 'ci (índice 0–100)');
    num(m.costKg, 0, 1e4, 'costKg (R$/kg)');
    num(m.visc, 0, 1e6, 'visc (mPa·s)');
    num(m.nut.kcal, 0, 900, 'kcal por 100 g');
    num(m.nut.sug, 0, 100, 'açúcares g por 100 g');
    const F = E.diagnose(st, m);
    for (const f of F) { assert.ok(['crit', 'warn', 'info', 'ok'].includes(f.sev), f.sev); assert.equal(typeof f.title, 'string'); assert.equal(typeof f.area, 'string'); }
  }
});

test('perfis de tipo: faixas [mín, máx] em % e processo com temperatura de serviço', () => {
  for (const [k, P] of Object.entries(E.PROF)) {
    for (const f of ['sol', 'fat', 'msnf', 'pod', 'fz']) { assert.ok(Array.isArray(P[f]) && P[f].length === 2 && P[f][0] <= P[f][1], `${k}.${f}`); num(P[f][1], 0, 100, `${k}.${f}`); }
    assert.equal(typeof P.n, 'string');
  }
});

test('versões dos formatos persistidos', () => {
  const html = readApp();
  assert.match(html, /const VERSION='v\d+\.\d+(\.\d+)?'/, 'VERSION do app');
  const B = loadBackup();
  const p = B.backupPayload({ lots: [], lib: [] }, {}, {});
  assert.equal(p.app, 'Il Fredolin'); assert.equal(p.schema, 2, 'backup schema 2');
  const reg = JSON.parse(fs.readFileSync(new URL('../../docs/model-registry.json', import.meta.url)));
  assert.equal(reg.schema, 'il-fredolin/model-registry@1');
  const man = JSON.parse(fs.readFileSync(new URL('../../src/build.json', import.meta.url)));
  assert.equal(man.schema, 'il-fredolin/build@1');
});
