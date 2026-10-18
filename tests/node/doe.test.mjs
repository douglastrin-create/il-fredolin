/* Planejamento de experimentos e plano de medições (v18.1). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine();
const A = (a, f) => (f ? Array.from(a, f) : Array.from(a));

test('t de Student: p bilateral bate com tabelas', () => {
  for (const [t, df, p] of [[2.776, 4, .05], [2.228, 10, .05], [12.706, 1, .05], [1.96, 1e6, .05], [3.169, 10, .01]])
    assert.ok(Math.abs(E.tP2(t, df) - p) < 6e-4, `t=${t} df=${df}: ${E.tP2(t, df)}`);
});

test('fatorial 2^3 com réplica e centros: tamanho, níveis e ordem aleatória reproduzível', () => {
  const F = [{ id: 'a', label: 'A', kind: 'proc', key: 'drawT', lo: -6, hi: -4 }, { id: 'b', label: 'B', kind: 'ing', key: 'dextrose', lo: 20, hi: 40 }, { id: 'c', label: 'C', kind: 'proc', key: 'matH', lo: 4, hi: 12 }];
  const d1 = E.doeDesign({ factors: F, reps: 2, centers: 3, seed: 7 }), d2 = E.doeDesign({ factors: F, reps: 2, centers: 3, seed: 7 });
  assert.equal(d1.runs.length, 19);
  assert.deepEqual(A(d1.runs, r => r.std), A(d2.runs, r => r.std), 'mesma semente, mesma ordem');
  assert.notDeepEqual(A(d1.runs, r => r.std), A(d1.runs, (_, i) => i + 1), 'ordem embaralhada');
  const c = d1.runs.filter(r => r.center); assert.equal(c.length, 3); assert.equal(c[0].values.a, -5); assert.equal(c[0].values.b, 30);
  for (let j = 0; j < 3; j++) assert.equal(d1.runs.filter(r => !r.center).reduce((s, r) => s + r.coded[j], 0), 0, 'colunas balanceadas');
});

test('análise recupera efeitos conhecidos, interação e curvatura; p pequeno só para o que existe', () => {
  const F = [{ id: 'a', label: 'A', lo: 0, hi: 1 }, { id: 'b', label: 'B', lo: 0, hi: 1 }];
  const d = E.doeDesign({ factors: F, reps: 2, centers: 3, seed: 3 });
  let z = 0; const noise = () => [0.05, -0.04, 0.03, -0.06, 0.02, 0.01, -0.02, 0.04, -0.03, 0.0, 0.05][z++ % 11];
  const ys = d.runs.map(r => 10 + 3 * r.coded[0] + 0 * r.coded[1] + 1 * r.coded[0] * r.coded[1] + (r.center ? 0.8 : 0) + noise());
  const R = E.doeAnalyze(d, ys);
  assert.ok(R.ok);
  const e = Object.fromEntries(A(R.effects, x => [x.n, x]));
  assert.ok(Math.abs(e.A.effect - 6) < 0.15, 'efeito de A = 2×3'); assert.ok(e.A.p < 1e-6);
  assert.ok(Math.abs(e['A × B'].effect - 2) < 0.15); assert.ok(e['A × B'].p < 1e-4);
  assert.ok(Math.abs(e.B.effect) < 0.15); assert.ok(e.B.p > 0.05, 'B não tem efeito');
  assert.ok(Math.abs(R.curvature.diff - 0.8) < 0.15); assert.ok(R.curvature.p < 0.001, 'curvatura detectada pelos centros');
  assert.equal(R.dropped, 0, 'nenhum termo descartado com dados completos');
  assert.ok(R.sd < 0.1, 'erro residual = erro puro (curvatura não vai para o resíduo): ' + R.sd); assert.equal(R.df, 11 - 5);
});

test('sem réplicas nem centros: estima efeitos mas não inventa erro-padrão', () => {
  const d = E.doeDesign({ factors: [{ id: 'a', label: 'A', lo: 0, hi: 1 }, { id: 'b', label: 'B', lo: 0, hi: 1 }], reps: 1, centers: 0, seed: 1 });
  const R = E.doeAnalyze(d, d.runs.map(r => 5 + r.coded[0]));
  assert.equal(R.df, 0); assert.equal(R.effects[0].se, null); assert.equal(R.effects[0].p, null);
});

test('corridas faltando: avisa em vez de calcular com dados insuficientes', () => {
  const d = E.doeDesign({ factors: [{ id: 'a', label: 'A', lo: 0, hi: 1 }, { id: 'b', label: 'B', lo: 0, hi: 1 }], seed: 1 });
  const R = E.doeAnalyze(d, [1, null, null, null]); assert.equal(R.ok, false);
});

test('fator de ingrediente mantém o peso do lote; compensação negativa = inviável', () => {
  const st = { recipe: [{ id: 'leite', g: 600 }, { id: 'sacarose', g: 150 }, { id: 'dextrose', g: 30 }], proc: {} };
  const F = [{ id: 'x', kind: 'ing', key: 'dextrose', lo: 20, hi: 60 }];
  const r = E.doeRecipe(st, F, { x: 60 }, 'leite'); const tot = s => A(s.recipe).reduce((a, x) => a + x.g, 0);
  assert.ok(r.ok); assert.equal(tot(r.st), 780); assert.equal(r.st.recipe.find(x => x.id === 'leite').g, 570);
  assert.equal(E.doeRecipe(st, [{ id: 'x', kind: 'ing', key: 'dextrose', lo: 0, hi: 900 }], { x: 900 }, 'leite').ok, false);
  const p = E.doeRecipe(st, [{ id: 'd', kind: 'proc', key: 'drawT', lo: -6, hi: -4 }], { d: -6 }, 'leite');
  assert.equal(p.st.proc.drawT, -6); assert.equal(tot(p.st), 780);
});

test('plano de medições: fruta sem Brix sobe; o que já foi calibrado desce', () => {
  E.CAL.on = false;
  const rec = E.testRecipes(); const fruta = rec.find(r => /fragola/i.test(r.name));
  assert.ok(fruta, 'há a base de morango (fruta com maior incerteza de Brix)');
  const st = E.stTest(fruta, -12), m = E.analyze(st), u = E.uncertainty(st);
  const P0 = E.measurePlan(st, m, { counts: {} }, u);
  assert.ok(P0.length >= 8); assert.ok(P0.every((p, i) => i === 0 || P0[i - 1].score >= p.score), 'ordenado');
  assert.equal(P0[0].id, 'brixFruta', 'Brix da fruta em primeiro: ' + A(P0, p => p.id).join(','));
  const lab = P0.find(p => p.id === 'cristais'), ov0 = P0.find(p => p.id === 'overrun');
  assert.ok(lab.score < ov0.score, 'laboratório fica atrás do que se mede em casa');
  const P1 = E.measurePlan(st, m, { counts: { ov: 5 } }, u);
  assert.ok(P1.find(p => p.id === 'overrun').score < ov0.score, 'calibrado por 5 lotes perde prioridade');
  const st2 = { ...st, brix: Object.fromEntries(fruta.recipe.filter(x => E.ING_BY[x.id] && E.ING_BY[x.id].brix).map(x => [x.id, E.ING_BY[x.id].brix])) };
  assert.ok(!E.measurePlan(st2, E.analyze(st2), { counts: {} }, E.uncertainty(st2)).some(p => p.id === 'brixFruta'), 'Brix medido sai da lista');
});
