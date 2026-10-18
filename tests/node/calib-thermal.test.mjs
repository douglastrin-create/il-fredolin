/* Calibração térmica pelo núcleo medido (v18.2). Dados sintéticos gerados pelo próprio modelo com h conhecido:
   verifica que o ajuste recupera o h, descarta medições sem informação e é aplicado ao endurecimento. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine();
const rec = E.testRecipes().find(r => /Fiordilatte/.test(r.name));
const pr = { drawT: -5, storeT: -22, blastT: -22, turboMin: 0, poteMl: 470 };
const mk = () => E.analyze(E.stTest(rec, -12, pr));

test('recupera o h verdadeiro a partir de uma medição do núcleo', () => {
  const m = mk(), P = Object.assign({}, m.pr, pr);
  for (const hTrue of [8, 14, 25]) {
    const core = E.coreAt(m, P, 470, hTrue, 60);
    const h = E.fitH(m, P, 470, 60, core);
    assert.ok(Math.abs(h - hTrue) / hTrue < 0.03, `h verdadeiro ${hTrue}, ajustado ${h}`);
  }
});
test('medições sem informação são descartadas', () => {
  const m = mk(), P = Object.assign({}, m.pr, pr);
  assert.equal(E.fitH(m, P, 470, 600, -21.5), null, 'núcleo em equilíbrio com o freezer');
  assert.equal(E.fitH(m, P, 470, 3, -6), null, 'menos de 5 min');
  assert.equal(E.fitH(m, P, 470, 60, -40), null, 'mais frio que o freezer: impossível');
  assert.equal(E.fitH(m, P, 470, 60, -4), null, 'mais quente que a saída: impossível');
});
test('calibração combina lotes com encolhimento e muda o tempo de endurecimento', () => {
  E.CAL.on = true; const m = mk(), P = Object.assign({}, m.pr, pr);
  const lots = [45, 60, 90, 120].map((min, i) => ({ id: 'L' + i, tipo: rec.tipo, vit: -12, recipe: rec.recipe, proc: Object.assign({}, m.pr, pr), brix: {},
    meas: { coreT: Math.round(E.coreAt(m, P, 470, 25, min) * 10) / 10, coreMin: min } }));
  E.fitCalibration(lots);
  const R = E.CAL.res.map(r => r.core);
  assert.match(R[0][4], /patamar/, '45 min: núcleo ainda no patamar de congelamento, não informa');
  assert.ok(R[2][4] === '' && R[3][4] === '', '90 e 120 min informam');
  const n = E.CAL.counts.core; assert.ok(n >= 2 && n <= 3);
  const full = Math.log(25 / E.H_FREEZER), expect = Math.exp(full * n / (n + 2));   // n lotes, prior de 2
  assert.ok(Math.abs(E.CAL.hMult - expect) / expect < 0.04, `hMult ${E.CAL.hMult} × esperado ${expect}`);
  assert.ok(E.CAL.res.filter(r => r.core[4] === '').every(r => r.core[2] > 23.5 && r.core[2] < 26.5), 'lotes informativos mostram o h ajustado');
  const m2 = mk(); const fast = E.hardenModel(m2, pr, 470).tDone;
  E.CAL.on = false; const m3 = mk(); const base = E.hardenModel(m3, pr, 470).tDone; E.CAL.on = true;
  assert.ok(fast < base * 0.85, `freezer mais eficiente endurece mais rápido: ${fast.toFixed(0)} × ${base.toFixed(0)} min`);
  E.fitCalibration([]); assert.equal(E.CAL.hMult, 1, 'sem lotes, volta ao valor de literatura');
});
