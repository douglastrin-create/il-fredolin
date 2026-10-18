/* Ciência verificável (v18.8 · §46–49): registro completo, validação deixa-um-fora e casos de referência. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadEngine, readApp } from './harness.mjs';
import { predictCases, loadCases } from '../../tools/validacao.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const E = loadEngine(); E.CAL.on = false;
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/model-registry.json'), 'utf8'));
const FIELDS = ['name', 'version', 'equation', 'parameters', 'outputs', 'hypotheses', 'validity', 'dataOrigin', 'method', 'tolerance', 'uncertainty', 'calibration', 'validation', 'verification'];

test('registro @2: todo modelo tem todos os campos do §46 (null = não estabelecido, nunca ausente)', () => {
  assert.equal(reg.schema, 'il-fredolin/model-registry@2');
  for (const m of reg.models) {
    for (const f of FIELDS) assert.ok(f in m, `${m.id}: falta ${f}`);
    assert.ok(m.equation && m.name, m.id);
    for (const p of m.parameters || []) assert.ok('src' in p && 'unit' in p, `${m.id}: parâmetro sem unidade/fonte declarada`);
    assert.ok(Array.isArray(m.verification.software) && Array.isArray(m.verification.math), m.id);
    assert.ok(!m.class.includes('V'), m.id + ' não pode se declarar validado');
  }
});

test('registro: cada verificação citada existe de fato (arquivo de teste e título, ou runTests)', () => {
  const auto = fs.readFileSync(path.join(ROOT, 'src/tests/autoteste.js'), 'utf8');
  for (const m of reg.models) for (const ref of [...m.verification.software, ...m.verification.math]) {
    const [file, trecho] = ref.split(' › ');
    assert.ok(trecho, ref);
    const txt = file === 'runTests' ? auto : fs.readFileSync(path.join(ROOT, 'tests/node', file), 'utf8');
    assert.ok(txt.includes(trecho), `${m.id}: "${ref}" não encontrado`);
  }
});

test('registro embutido no app é o mesmo de docs/', () => {
  const html = readApp(); const m = html.match(/const MODEL_REGISTRY=(\{.*?\});\n/s);
  assert.ok(m, 'MODEL_REGISTRY embutido');
  assert.deepEqual(JSON.parse(m[1]), reg);
});

test('validação deixa-um-fora: o lote nunca entra na própria calibração', () => {
  const res = [
    { id: 1, tipo: 'crema', ov: [30, 40], ovKey: 'maqp1' }, { id: 2, tipo: 'crema', ov: [30, 40], ovKey: 'maqp1' },
    { id: 3, tipo: 'crema', ov: [30, 40], ovKey: 'maqp1' }, { id: 4, tipo: 'sorbetto', ov: [20, 20], ovKey: 'horiz' }];
  const V = E.validateLOO(res).ov;
  /* lote 1: outros dois da mesma máquina com resíduo 10 → viés = 20/(2+3) = 4 → erro fora-da-amostra = 10 − 4 = 6 */
  const r1 = V.rows.find(x => x.id === 1); assert.equal(r1.raw, 10); assert.ok(Math.abs(r1.loo - 6) < 1e-9);
  /* lote 4: único da máquina → nenhuma calibração disponível → fora-da-amostra = sem calibração */
  const r4 = V.rows.find(x => x.id === 4); assert.equal(r4.loo, r4.raw);
  assert.equal(V.all.n, 4); assert.equal(V.fam.crema.n, 3); assert.equal(V.fam.sorbetto.n, 1);
  assert.equal(V.all.status, 'evidência inicial');
});

test('validação: status por quantidade de lotes e tolerância; grandeza sem calibração usa o erro direto', () => {
  const mk = (n, err) => Array.from({ length: n }, (_, i) => ({ id: i, tipo: 'crema', brix: [30, 30 + err * (i % 2 ? 1 : -1)] }));
  assert.equal(E.validateLOO(mk(6, .5)).brix.all.status, 'dentro da tolerância');
  assert.equal(E.validateLOO(mk(6, 3)).brix.all.status, 'avaliado');
  assert.equal(E.validateLOO([]).brix.all.status, 'sem dados');
  const v = E.validateLOO(mk(6, 3)).brix; assert.ok(v.rows.every(x => x.loo === x.raw));
});

test('validação de ponta a ponta: lotes medidos → calibração → validação por tipo', () => {
  const p = E.PRESETS.find(x => x.name === 'Fiordilatte');
  const lots = [1, 2, 3, 4, 5, 6].map(i => ({ id: 'L' + i, code: 'L' + i, tipo: 'crema', vit: -13, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc: { machine: 'maqp1' }, meas: { ov: 25 + i, melt10: 40 + i, brix: 33 } }));
  const C = E.fitCalibration(lots);
  const V = E.validateLOO(C.res);
  assert.equal(V.ov.all.n, 6); assert.equal(V.melt.fam.crema.n, 6); assert.equal(V.brix.all.n, 6);
  assert.ok(C.res.every(r => r.tipo === 'crema' && r.ovKey === 'maqp1'));
  for (const q of ['ov', 'melt']) assert.ok(V[q].all.loo.rmse <= V[q].all.raw.rmse + 1e-9 || V[q].all.n < 2, q + ': calibração fora-da-amostra não piora um viés sistemático');
});

test('casos de referência (§48–49): todas as famílias pedidas, medições só com origem, previsões finitas', () => {
  const doc = loadCases();
  const cats = doc.casos.map(c => c.categoria.toLowerCase()).join(' | ');
  for (const k of ['leite', 'gemas', 'chocolate', 'oleaginosas', 'sorbet', 'vegetal', 'aerado', 'baixo teor de açúcar', 'família nova']) assert.ok(cats.includes(k), 'falta categoria: ' + k);
  for (const c of doc.casos) {
    if (c.medicoes) for (const me of [].concat(c.medicoes)) assert.ok(me.lote && me.data && me.instrumento, c.id + ': medição sem lote, data ou instrumento');
    if (c.pendente) assert.ok(c.pendente.length > 20, c.id + ': pendência sem motivo');
  }
  const { out } = predictCases(E);
  for (const r of out) { if (r.pend) continue;
    for (const k of ['serveT', 'fzVit', 'sol', 'pod', 'ov', 'melt10']) assert.ok(Number.isFinite(r.p[k]), `${r.c.id}.${k}`);
    if (r.c.proc && r.c.proc.load) assert.ok(Math.abs(r.tot - r.c.proc.load) < 1, r.c.id + ': lote escalado para a carga do processo'); }
  const pote = out.filter(r => !r.pend && r.c.proc && r.c.proc.poteMl === 470);
  assert.ok(pote.length >= 8 && pote.every(r => r.p.hardMin > 0), 'endurecimento previsto nos potes de 470 mL');
});
