/* Análise sensorial (v18.15 · §24–25). Valores de referência calculados de forma independente com scipy 1.18
   (scipy.stats: f.sf, chi2.sf, t.ppf, binom.sf, friedmanchisquare, pearsonr) e conferidos aqui. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} × ${b}`);

test('distribuições: F, qui-quadrado, t crítico e binomial batem com scipy', () => {
  [[4.10, 2, 10, .050078], [4.96, 1, 10, .050088], [3.10, 3, 20, .049925], [7.5, 4, 12, .002875]].forEach(([x, a, b, p]) => near(E.fP(x, a, b), p, 2e-6, `F(${a},${b})`));
  [[5.991, 2, .050012], [7.815, 3, .049994], [11.07, 5, .05001], [2.5, 4, .644636]].forEach(([x, d, p]) => near(E.chiP(x, d), p, 2e-6, `χ²(${d})`));
  [[4, 2.776445], [10, 2.228139], [30, 2.042272]].forEach(([d, t]) => near(E.tCrit(d), t, 1e-5, `t(${d})`));
  near(E.binomUpper(24, 13, 1 / 3), .02844113, 1e-7, 'binomial 24/13');
  /* acertos mínimos no triângulo (alfa 5%): tabela calculada com binom.sf */
  [[6, 5], [12, 8], [18, 10], [24, 13], [30, 15], [36, 18]].forEach(([n, k]) => assert.equal(E.triMin(n), k, 'n=' + n));
});

test('triângulo: decide pela binomial e não conclui igualdade quando não detecta', () => {
  const ev = (n, k) => Array.from({ length: n }, (_, i) => ({ ok: i < k }));
  const a = E.triAnalyze(ev(24, 13)); assert.equal(a.diff, true); near(a.p, .02844113, 1e-7, 'p');
  const b = E.triAnalyze(ev(24, 12)); assert.equal(b.diff, false); assert.match(b.note, /não prova que as versões são iguais/);
  assert.equal(E.triAnalyze([]).n, 0);
});

test('perfil por escala: ANOVA amostra × avaliador igual à de referência; avaliador incompleto fica de fora', () => {
  const Y = { t1: { A: 6, B: 4, C: 7 }, t2: { A: 7, B: 5, C: 9 }, t3: { A: 5, B: 4, C: 6 }, t4: { A: 8, B: 6, C: 9 }, t5: { A: 9 } };
  const r = E.anova2(Y, ['A', 'B', 'C']);
  assert.equal(r.b, 4, 't5 não provou tudo');
  near(r.Fa, 46.714285714, 1e-6, 'F amostras'); near(r.pa, 2.19745582e-4, 1e-9, 'p amostras');
  near(r.Fb, 22.857142857, 1e-6, 'F avaliadores'); near(r.pb, 1.10446982e-3, 1e-9, 'p avaliadores'); near(r.mse, .194444444, 1e-9, 'QME');
  assert.ok(r.pairs.length === 3 && r.pairs.every(p => p.sig), 'com F significativo, os pares são comparados');
  assert.ok(r.tasterShare > 0 && r.tasterShare < 1, 'variação entre avaliadores registrada');
  assert.equal(E.anova2({ t1: { A: 1, B: 2 } }, ['A', 'B']).ok, false, 'um avaliador só: sem ANOVA');
});

test('ordenação: Friedman igual ao scipy', () => {
  const rows = [[1, 2, 3, 4], [1, 3, 2, 4], [2, 1, 3, 4], [1, 2, 4, 3], [1, 2, 3, 4]], S = ['A', 'B', 'C', 'D'];
  const R = Object.fromEntries(rows.map((r, i) => ['t' + i, Object.fromEntries(S.map((s, j) => [s, r[j]]))]));
  const f = E.friedman(R, S); near(f.chi, 11.64, 1e-9, 'χ²'); near(f.p, .008723836, 1e-8, 'p');
});

test('correlação física × percepção: Pearson e intervalo de 95% iguais ao scipy', () => {
  const c = E.pearson([1, 2, 3, 4, 5, 6], [2.1, 3.9, 6.2, 7.8, 10.1, 12.2]);
  near(c.r, .99910493, 1e-7, 'r'); near(c.p, 1.20136e-6, 1e-10, 'p'); near(c.lo, .99142828, 1e-6, 'IC inferior'); near(c.hi, .99990686, 1e-7, 'IC superior');
});

test('penalidade e TDS: grupos, queda de aceitação, curvas e linha de significância', () => {
  const ev = [[0, 8], [0, 7], [0, 8], [-1, 5], [-2, 4], [1, 6], [0, 9], [-1, 5], [0, 8], [0, 7]].map(([j, h]) => ({ jDoce: j, hed: h }));
  const p = E.penalty(ev, 'jDoce'); assert.equal(p.n, 10); near(p.lo.pct, 30, 1e-9, '% pouco'); assert.ok(p.lo.relevant && !p.hi.relevant);
  near(p.lo.drop, 7.833333 - 4.666667, 1e-5, 'queda');
  const seq = [{ seq: [[0, 'doce'], [4, 'aroma'], [10, 'crem']], end: 20 }, { seq: [[1, 'doce'], [6, 'aroma'], [12, 'crem']], end: 21 }, { seq: [[0, 'doce'], [3, 'crem']], end: 15 }];
  const t = E.tdsCurves(seq, ['doce', 'aroma', 'crem'], 20);
  assert.equal(t.n, 3); near(t.P0, 1 / 3, 1e-12, 'chance');
  for (let b = 0; b < 20; b++) near(t.curves.reduce((s, c) => s + c.rate[b], 0), 1, 1e-12, 'cada instante tem um dominante');
  assert.ok(t.curves.find(c => c.a === 'doce').rate[0] === 1 && t.curves.find(c => c.a === 'crem').rate[19] === 1);
  assert.ok(t.Ps > t.P0);
});

test('ponte: precisa de 5 lotes; acha a relação plantada; usa o valor medido quando existe', () => {
  const p = E.PRESETS.find(x => x.name === 'Fiordilatte'); const base = p.recipe.map(([id, g]) => ({ id, g }));
  const mk = (i, score, melt) => ({ id: 'L' + i, code: 'L' + i, tipo: p.tipo, vit: p.vit, recipe: base.map(r => r.id === 'creme35' ? { ...r, g: r.g + i * 40 } : r),
    meas: melt != null ? { melt10: melt } : {}, panel: [{ m: 'qda', a: { crem: score, derr: score / 2 } }, { m: 'qda', a: { crem: score + 1, derr: score / 2 } }] });
  const four = E.sensBridge([0, 1, 2, 3].map(i => mk(i, 3 + i)));
  assert.equal(four.rows.find(r => r.id === 'crem').verdict, 'dados insuficientes');
  const six = E.sensBridge([0, 1, 2, 3, 4, 5].map(i => mk(i, 3 + i, 20 + 5 * i)));
  const cr = six.rows.find(r => r.id === 'crem');
  assert.equal(cr.lots, 6); assert.equal(cr.verdict, 'relação positiva provável'); assert.ok(cr.sdTaster > 0, 'variação entre avaliadores registrada');
  const dr = six.rows.find(r => r.id === 'derr'); assert.equal(dr.measured, 6, 'derretimento medido no lote entra no lugar do previsto');
  assert.ok(!E.SENS_ATTR.some(a => a.id === 'amargo' && a.inst), 'atributo sem grandeza física não inventa uma');
  assert.equal(E.SENS_ATTR.length, 14);
});
