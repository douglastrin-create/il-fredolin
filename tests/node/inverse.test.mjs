/* Design inverso (v18.4): gerador por família e fronteira de Pareto das alternativas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const base = (tipo, extra = {}) => {
  const P = E.PROF[tipo], sb = P.like === 'sorbetto';
  return { tipo, batch: 1000, fixed: [], ...E.genDef(tipo), stabId: sb ? 'neutro' : 'nx_fredolin', stabGkg: sb ? 4 : 25,
    vit: P.proc && P.proc !== 'batch' ? P.serveT : -12, proc: {}, ...extra };
};
const ids = r => Array.from(r.recipe, x => x.id);

test('gerador usa os ingredientes da família, não os do gelato de leite', () => {
  assert.deepEqual(Array.from(E.genVars('granita')), ['agua', 'sacarose', 'dextrose']);
  for (const t of Object.keys(E.PROF)) {
    const r = E.generate(base(t)); assert.ok(r.ok, t + ': ' + r.msg);
    assert.ok(Math.abs(r.m.fzVit - r.m.fzMid) <= 3.2, `${t}: congelada ${r.m.fzVit}`);
  }
  assert.ok(!ids(E.generate(base('granita'))).some(id => /leite|creme|lpd/.test(id)), 'granita sem lácteos');
});

test('custard leva gema mínima; frozen yogurt leva iogurte mínimo', () => {
  const c = E.generate(base('custard')); const gema = c.recipe.find(x => x.id === 'gema');
  assert.ok(gema && gema.g / c.m.tot * 100 * 0.475 >= E.PROF.custard.yolkSolMin, 'sólidos de gema ≥ mínimo');
  const f = E.generate(base('froyo')); const io = f.recipe.find(x => x.id === 'iogurte');
  assert.ok(io && io.g / f.m.tot * 100 >= 14.5, 'iogurte ≥ 15% do lote');
});

test('sem açúcar chega à doçura com sucralose em centésimos de grama', () => {
  for (const pod of [14, 16.5, 19]) {
    const r = E.generate(base('semacucar', { pod }));
    assert.ok(r.ok && !r.dropped.includes('pod'), `POD ${pod}: ${r.m && r.m.pod}`);
    const s = r.recipe.find(x => x.id === 'sucralose');
    assert.ok(s && s.g > 0 && s.g < 1, 'sucralose ' + (s && s.g));
    assert.ok(!r.recipe.some(x => x.id === 'sacarose'), 'sem sacarose');
  }
});

test('sem açúcar: sólidos como meta, eritritol ≤ 5% e sem inulina; laudo sem aviso de fibra nem de eritritol', () => {
  for (const sol of [32, 35, 38]) for (const vit of [-11, -13]) {
    const r = E.generate(base('semacucar', { sol, vit, stabId: 'neutro', stabGkg: 3 }));
    assert.ok(r.ok && !r.dropped.length, `sol ${sol} a ${vit}: ${r.dropped}`);
    assert.ok(Math.abs(r.m.sol - sol) <= 1.2, 'sólidos ' + r.m.sol);
    const ery = r.recipe.find(x => x.id === 'eritritol');
    assert.ok(ery && ery.g / r.m.tot <= .05, 'eritritol ' + (ery && ery.g));
    assert.ok(!r.recipe.some(x => x.id === 'inulina'), 'sem inulina');
    const st = E.stTest({ tipo: 'semacucar', vit, recipe: r.recipe }, vit);
    const W = Array.from(E.diagnose(st, E.analyze(st))).filter(f => f.sev === 'warn' || f.sev === 'crit').map(f => f.title).join(' / ');
    assert.ok(!/fibra|Eritritol|Sólidos totais/i.test(W), W);
  }
  const f = E.genFrontier(base('semacucar'), ['sug', 'sol', 'kcal']);
  assert.ok(f.ok && f.front.length >= 2, 'fronteira do sem açúcar varia os sólidos: ' + (f.front && f.front.length));
});

test('base láctea: sólidos fora da faixa da família viram aviso', () => {
  const r = E.generate(base('semifreddo', { fixed: [{ id: 'pistache', g: 100 }] }));
  assert.ok(r.ok);
  if (r.m.sol > E.PROF.semifreddo.sol[1] + 1.2) assert.ok(r.dropped.includes('sol'), 'avisa sólidos ' + r.m.sol);
  const ok = E.generate(base('crema'));
  assert.ok(!ok.dropped.includes('sol'), 'crema padrão sem aviso de sólidos');
});

test('paretoFront: dominadas saem, empates dentro da tolerância viram uma opção', () => {
  const o = (sug, sol) => ({ v: { sug, sol } });
  const A = o(20, 40), B = o(22, 42), C = o(23, 41), D = o(20.05, 40.05);
  const f = Array.from(E.paretoFront([A, B, C, D], ['sug', 'sol']));
  assert.ok(f.includes(A) && f.includes(B), 'A e B ficam');
  assert.ok(!f.includes(C), 'C é dominada por B (mais açúcar e menos corpo)');
  assert.ok(!f.includes(D), 'D empata com A dentro da tolerância');
});

test('fronteira: cada opção é viável, nenhuma domina outra, e o melhor de cada critério está marcado', () => {
  for (const t of ['crema', 'custard', 'granita', 'semacucar', 'dondurma']) {
    const crits = ['sug', 'sol', 'melt'];
    const r = E.genFrontier(base(t), crits); assert.ok(r.ok, t + ': ' + r.msg);
    assert.ok(r.front.length >= 1 && r.front.length <= r.feasible && r.feasible <= r.tried, t);
    const P = E.PROF[t];
    for (const o of r.front) {
      assert.ok(Math.abs(o.m.fzVit - o.m.fzMid) <= 3.2, `${t}: congelada`);
      assert.ok(o.m.sol >= P.sol[0] - .8 && o.m.sol <= P.sol[1] + .8, `${t}: sólidos ${o.m.sol}`);
      assert.ok(o.m.pod >= P.pod[0] - .5 && o.m.pod <= P.pod[1] + .5, `${t}: POD ${o.m.pod}`);
      /* recalcular a mesma receita dá os mesmos números */
      const m2 = E.analyze({ tipo: t, vit: base(t).vit, recipe: o.recipe, proc: {}, brix: {} });
      assert.ok(Math.abs(m2.nut.sug - o.v.sug) < 1e-9 && Math.abs(m2.melt10 - o.v.melt) < 1e-9, t + ': reprodutível');
    }
    for (const a of r.front) for (const b of r.front) if (a !== b) {
      const dom = crits.every(k => (b.v[k] - a.v[k]) * E.FRONT_CRIT[k].dir >= -E.FRONT_CRIT[k].eps) &&
        crits.some(k => (b.v[k] - a.v[k]) * E.FRONT_CRIT[k].dir > E.FRONT_CRIT[k].eps);
      assert.ok(!dom, t + ': opção dominada na fronteira');
    }
    for (const k of crits) assert.equal(r.front.filter(o => Array.from(o.best).includes(k)).length, 1, `${t}: um ★ em ${k}`);
  }
});

test('fronteira: custo usa os preços informados e menos de dois critérios é recusado', () => {
  assert.equal(E.genFrontier(base('crema'), ['sug']).ok, false);
  const a = E.genFrontier(base('crema'), ['cost', 'sug']), b = E.genFrontier(base('crema', { costs: { creme35: '64' } }), ['cost', 'sug']);
  assert.ok(a.ok && b.ok);
  const mx = r => Math.max(...r.front.map(o => o.v.cost));
  assert.ok(mx(b) > mx(a), 'creme mais caro encarece as opções');
});

test('fronteira roda rápido o bastante para o celular (crema, 60 combinações)', () => {
  const t0 = performance.now(); const r = E.genFrontier(base('crema'), ['sug', 'sol', 'melt']); const dt = performance.now() - t0;
  assert.ok(r.ok && r.tried === 60, 'tentou ' + r.tried); assert.ok(dt < 1500, dt + ' ms');
});
