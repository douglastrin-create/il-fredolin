/* Composição com procedência e incerteza (v18.11 · §14, §22): classes de procedência, referências conferidas,
   balanço de massa e incerteza que perturba a composição (não a massa pesada). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
import { loadCases } from '../../tools/validacao.mjs';
const E = loadEngine(); E.CAL.on = false;
const st = (tipo, recipe, vit = -12) => E.stTest({ tipo, vit, recipe }, vit);
const preset = n => { const p = E.PRESETS.find(x => x.name === n); return st(p.tipo, p.recipe.map(([id, g]) => ({ id, g })), p.vit); };

test('procedência: toda entrada classificada, exemplos de cada classe', () => {
  const cls = new Set(['definicao', 'tabela', 'ficha', 'usuario', 'calculado', 'sem']);
  for (const i of E.ING) assert.ok(cls.has(E.ingProv(i)), i.id);
  const P = id => E.ingProv(E.ING_BY[id]);
  assert.equal(P('sacarose'), 'definicao'); assert.equal(P('agua'), 'definicao'); assert.equal(P('dextrosem'), 'definicao');
  assert.equal(P('leite'), 'tabela'); assert.equal(P('abiu'), 'tabela'); assert.equal(P('nx_goff'), 'calculado');
  assert.equal(P('morango'), 'sem', 'sem fonte continua explícito (não inventar)');
  assert.equal(E.ingProv({ id: 'x', c: { w: 50, fat: 50 }, custom: 1 }), 'usuario');
});

test('referências conferidas: o banco concorda com a USDA em ≤ 1 g/100 g (exceto o que o rótulo ajusta)', () => {
  for (const [id, R] of Object.entries(E.ING_REF)) {
    const c = E.ING_BY[id].c;
    for (const [k, v] of Object.entries(R.ref)) { if (R.adj.includes(k)) continue;
      /* diferença registrada (dev): o banco tem que ter exatamente o valor declarado e o texto da fonte tem que dizer */
      if (R.dev && k in R.dev) { assert.equal(c[k], R.dev[k], `${id}.${k}: diferença registrada desatualizada`); assert.match(R.src, /diferença registrada/); continue; }
      assert.ok(Math.abs((c[k] || 0) - v) <= 1.0, `${id}.${k}: banco ${c[k]} × referência ${v}`); }
    assert.match(R.src, /USDA SR Legacy FDC \d+/);
  }
});

test('balanço de massa (§14): composição de cada receita soma a massa (98–100,6%)', () => {
  const recs = E.PRESETS.map(p => p.recipe.map(([id, g]) => ({ id, g })));
  for (const c of loadCases().casos) if (c.recipe) recs.push(c.recipe);
  for (const rec of recs) { let tot = 0, comp = 0;
    for (const r of rec) { const i = E.ING_BY[r.id]; tot += r.g; comp += r.g * Object.values(i.c).reduce((a, b) => a + (+b || 0), 0) / 100; }
    assert.ok(comp / tot >= .98 && comp / tot <= 1.006, `${rec.map(r => r.id).join(',')}: ${(comp / tot * 100).toFixed(2)}%`); }
});

test('incerteza perturba a composição, não a massa; sem fonte alarga; ingredientes temporários são removidos', () => {
  const F = E.uncertainty(preset('Fiordilatte'));
  const lat = F.parts.find(p => p.n === 'Lácteos (gordura)');
  assert.ok(lat && Math.abs(lat.d) < .1, 'gordura ±3% quase não muda o congelamento (antes, massa ±3%: 0,26 °C)');
  assert.ok(!Object.keys(E.ING_BY).some(k => k.startsWith('~u')), 'cópias temporárias removidas');
  const pura = E.uncertainty(st('sorbetto', [{ id: 'agua', g: 700 }, { id: 'sacarose', g: 250 }, { id: 'dextrosem', g: 50 }]));
  assert.equal(pura.parts.length, 0); assert.ok(Math.abs(pura.sd - .4) < 1e-9, 'só definição: só o erro do modelo');
  const semF = E.uncertainty(preset('Cioccolato fondente'));
  assert.ok(semF.parts.some(p => p.n === 'Sem fonte (sólidos)' && Math.abs(p.d) > .1), 'cacau e chocolate sem fonte alargam a faixa');
  assert.ok(semF.sd > F.sd);
});

test('participação de procedência na receita e "O que medir" pede a ficha técnica do que não tem fonte', () => {
  const s = preset('Cioccolato fondente'); const pv = E.recipeProv(s);
  assert.ok(pv.known > 50 && pv.known < 100 && pv.sem.length >= 2);
  assert.ok(Math.abs(Object.values(pv.pct).reduce((a, b) => a + b, 0) - 100) < 1e-6);
  const m = E.analyze(s); const plan = Array.from(E.measurePlan(s, m, { counts: {} }, E.uncertainty(s)));
  const f = plan.find(x => x.id === 'fichaSemFonte'); assert.ok(f && /Ficha técnica de:/.test(f.what) && f.score > 0);
  assert.ok(!Array.from(E.measurePlan(preset('Fiordilatte'), E.analyze(preset('Fiordilatte')), { counts: {} }, E.uncertainty(preset('Fiordilatte')))).some(x => x.id === 'fichaSemFonte'), 'Fior di latte tem 100% com fonte');
});
