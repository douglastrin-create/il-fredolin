/* Laboratório de estabilização (v18.5): ficha técnica com fonte, sinergias só qualitativas, resultados dos lotes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const facts = K => ['hyd', 'gel', 'leite', 'acido', 'calcio', 'lim', 'ef', 'extra'].map(f => K[f]).filter(Boolean);

test('ficha: todo componente funcional tem entrada, e todo fato cita uma fonte registrada', () => {
  for (const k of Object.keys(E.NCOMP)) if (E.NCOMP[k].dose) assert.ok(E.NKB[k], 'sem ficha: ' + k);
  for (const [k, K] of Object.entries(E.NKB)) {
    assert.ok(E.NCOMP[k], 'ficha de componente inexistente: ' + k);
    assert.ok(K.ori && K.nat, k + ': origem e natureza');
    for (const f of facts(K)) {
      assert.ok(typeof f.t === 'string' && f.t.length > 10, k + ': texto');
      assert.ok(f.src.length >= 1 && f.src.every(r => E.NREF[r]), k + ': fonte ' + f.src);
    }
  }
  for (const x of E.NSYN) {
    assert.ok(E.NCOMP[x.a] && (x.b === 'leite' || E.NCOMP[x.b]), 'sinergia com componente inexistente');
    assert.ok(x.src.length && x.src.every(r => E.NREF[r]), 'sinergia sem fonte');
  }
  for (const t of E.NKB_TOPICS) assert.ok(t.src.every(r => E.NREF[r]), t.n);
  for (const [id, R] of Object.entries(E.NREF)) assert.ok(R.c && R.t && (R.u === null || /^https:\/\//.test(R.u)), id);
});

test('ficha: falta de dado fica explícita (null), não preenchida', () => {
  assert.equal(E.NKB.lec.hyd, null); assert.equal(E.NKB.xan.hyd, null);
  const nulls = Object.values(E.NKB).reduce((a, K) => a + ['hyd', 'gel', 'leite', 'acido', 'calcio', 'lim', 'ef'].filter(f => K[f] === null).length, 0);
  assert.ok(nulls >= 20, 'campos sem fonte continuam vazios: ' + nulls);
});

test('sinergias: só pares presentes, "leite" só em base láctea, sem coeficiente numérico', () => {
  const s = Array.from(E.blendSyn(['lbg', 'xan', 'carr'], true), x => x.a + '+' + x.b).sort();
  assert.deepEqual(s, ['carr+leite', 'lbg+xan']);
  assert.deepEqual(Array.from(E.blendSyn(['lbg', 'xan', 'carr'], false), x => x.a + '+' + x.b), ['lbg+xan']);
  for (const x of E.NSYN) assert.deepEqual(Object.keys(x).sort(), ['a', 'b', 'src', 't']);
});

test('avaliação do blend: sinergia cita a fonte; o que é prática vem marcado; inulina cita o estudo', () => {
  const b = E.analyzeBlend({ dose: 4, parts: { lbg: 50, xan: 20, guar: 30 } }, true);
  const t = Array.from(b.notes, n => n.t + ' ' + n.fix).join(' | ');
  assert.match(t, /Sinergia documentada: Goma jataí \(LBG\) \+ Goma xantana.*Goycoolea/);
  assert.match(t, /Jataí \+ guar.*Prática de formulação/);
  const i = E.analyzeBlend({ dose: 60, parts: { inu: 900, lbg: 100 } }, true);
  assert.match(Array.from(i.notes, n => n.fix).join(' '), /Bonnema/);
});

test('origem: blend Migoya (CMC/mono) acusa componentes não naturais; Dondoli é todo natural', () => {
  const P = id => E.NEUTRO_PRESETS.find(n => n.id === id);
  assert.deepEqual(Array.from(E.blendNonNat(P('nx_dondoli').parts)), []);
  assert.deepEqual(Array.from(E.blendNonNat(P('nx_migoya').parts)).sort(), ['mono']);
  assert.ok(Array.from(E.blendNonNat(P('nx_migoyas').parts)).includes('cmc'));
});

test('resultados observados: só lotes com o blend, médias e desvio contra o previsto', () => {
  const lots = [
    { id: 1, recipe: [{ id: 'nx_x', g: 25 }], meas: { melt10: 40, ov: 30, icyDay: 6 }, pred: { melt10: 50 }, sens: { gelo: 4 } },
    { id: 2, recipe: [{ id: 'nx_x', g: 25 }], meas: { melt10: 30, cupMix: 120, cupGel: 100 }, pred: { melt10: 34 }, sens: { gelo: 2, corpo: 5 } },
    { id: 3, recipe: [{ id: 'nx_x', g: 25 }], meas: {} },
    { id: 4, recipe: [{ id: 'outro', g: 25 }], meas: { melt10: 99 } },
    { id: 5, recipe: [{ id: 'nx_x', g: 25 }], meas: { melt10: 10 }, deleted: true }];
  const o = E.blendObserved('nx_x', lots);
  assert.equal(o.n, 3); assert.equal(o.melt.n, 2); assert.equal(o.melt.v, 35); assert.equal(o.melt.bias, -7);
  assert.equal(o.ov.n, 2); assert.equal(o.ov.v, 25); assert.equal(o.icy.v, 6); assert.equal(o.sens.gelo.v, 3); assert.equal(o.sens.corpo.n, 1);
  assert.equal(E.blendObserved('nada', lots).n, 0);
});

test('diagnóstico: inulina por porção acima do tolerado em estudo vira aviso com a fonte', () => {
  const st = E.stTest({ tipo: 'semacucar', vit: -12, recipe: [{ id: 'leite', g: 537 }, { id: 'creme35', g: 203 }, { id: 'lpd', g: 33 }, { id: 'eritritol', g: 60 }, { id: 'inulina', g: 165 }, { id: 'sucralose', g: .16 }, { id: 'neutro', g: 2 }] }, -12);
  const F = Array.from(E.diagnose(st, E.analyze(st)));
  const f = F.find(x => /fibra fermentável/i.test(x.title));
  assert.ok(f && f.sev === 'warn' && /Bonnema/.test(f.why), f && f.title);
  const st2 = E.stTest({ tipo: 'crema', vit: -12, recipe: [{ id: 'leite', g: 600 }, { id: 'creme35', g: 200 }, { id: 'sacarose', g: 160 }, { id: 'lpd', g: 40 }] }, -12);
  assert.ok(!Array.from(E.diagnose(st2, E.analyze(st2))).some(x => /fibra fermentável/i.test(x.title)));
});
