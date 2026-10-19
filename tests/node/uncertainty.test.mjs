/* Incerteza (v18.12 · §10, §12): Monte Carlo concorda com o linear, é reproduzível, percentis ordenados,
   contribuições coerentes e cobertura da faixa conferida contra lotes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const preset = n => { const p = E.PRESETS.find(x => x.name === n); return E.stTest({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })) }, p.vit); };

test('Monte Carlo concorda com o linear nas bases (curva quase linear na faixa de interesse)', () => {
  for (const p of E.PRESETS) { const st = preset(p.name); const u = E.uncertainty(st), m = E.uncertaintyMC(st, { n: 300 });
    assert.ok(m.p05 <= m.p50 && m.p50 <= m.p95, p.name + ': percentis ordenados');
    assert.ok(Math.abs(m.p50 - E.analyze(st).serveT) < .15, p.name + ': mediana perto do valor central');
    /* largura 5–95% do MC dentro de ±35% da banda linear (MC independente tende a ser um pouco mais estreito) */
    const wl = 2 * 1.65 * u.sd, wm = m.p95 - m.p05;
    assert.ok(wm > .65 * wl && wm < 1.35 * wl, `${p.name}: MC ${wm.toFixed(2)} × linear ${wl.toFixed(2)}`); }
});

test('Monte Carlo: reproduzível pela semente, não deixa ingrediente temporário e acha a fonte dominante', () => {
  const st = preset('Sorbetto di fragola');
  const a = E.uncertaintyMC(st, { n: 120, seed: 3 }), b = E.uncertaintyMC(JSON.parse(JSON.stringify(st)), { n: 120, seed: 3 });
  assert.equal(a.p05, b.p05); assert.equal(a.p95, b.p95);
  assert.ok(!Object.keys(E.ING_BY).some(k => k.startsWith('~')), 'sem cópias temporárias');
  assert.equal(a.contrib[0].id, 'morango', 'morango sem Brix medido domina a incerteza do sorbetto de morango');
  const med = E.uncertaintyMC(Object.assign({}, st, { brix: { morango: 8 } }), { n: 120, seed: 3 });
  assert.ok(med.sd < a.sd, 'medir o Brix estreita a faixa');
});

test('cobertura: conta só lotes com textura ideal e temperatura medida; status por quantidade', () => {
  const p = E.PRESETS.find(x => x.name === 'Fiordilatte'); const rec = p.recipe.map(([id, g]) => ({ id, g }));
  const u = E.uncertainty(preset('Fiordilatte'));
  const mk = (T, tex = 0) => ({ id: 'L' + T + tex, tipo: 'crema', vit: -13, recipe: rec, proc: {}, meas: { tex, texTemp: T } });
  const dentro = (u.lo + u.hi) / 2;
  let C = E.uncCoverage([mk(dentro), mk(dentro + 5), mk(dentro, 1), { id: 'x', meas: {} }]);
  assert.equal(C.n, 2); assert.equal(C.k, 1); assert.equal(C.status, 'evidência inicial');
  C = E.uncCoverage(Array.from({ length: 10 }, (_, i) => mk(dentro + i * .01)));
  assert.equal(C.status, 'coerente com 90%');
  C = E.uncCoverage(Array.from({ length: 10 }, (_, i) => mk(dentro + 3 + i * .01)));
  assert.equal(C.status, 'faixa estreita demais');
  assert.equal(E.uncCoverage([]).status, 'sem dados');
});
