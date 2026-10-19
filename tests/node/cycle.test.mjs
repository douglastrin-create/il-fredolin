/* Gêmeo do ciclo produtivo (v18.13 · §16, §33, §34): resfriamento por Newton, resposta do pote à oscilação do
   freezer (solução exata linearizada × simulação completa) e encadeamento das etapas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const mk = (n, pr = {}) => { const p = E.PRESETS.find(x => x.name === n); const proc = { ...E.PROC0, ...pr }; const m = E.analyze(E.stTest({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc }, p.vit)); return { m, proc }; };

test('resfriamento: Newton exato, banho mais rápido que geladeira, plástico mais lento que inox, volume maior mais lento', () => {
  const S0 = E.coolStage(1, 1.08, { mode: 'geladeira', vessel: 'inox', Tair: 4, Tamb: 4 });
  assert.ok(Math.abs(S0.Teq - 4) < 1e-9);
  const t = E.coolTimeTo(S0, 85, 10); assert.ok(Math.abs(E.coolAt(S0, 85, t) - 10) < 1e-9, 'tempo e temperatura são inversos');
  assert.equal(E.coolTimeTo(S0, 85, 3), null, 'abaixo da geladeira não chega');
  const tau = (mode, vessel, kg = 1) => E.coolStage(kg, 1.08, { mode, vessel, Tair: 4, Tamb: 24 }).tau;
  assert.ok(tau('banho', 'inox') < tau('geladeira', 'inox') / 5);
  assert.ok(tau('geladeira', 'plastico') > tau('geladeira', 'inox'));
  assert.ok(tau('banho', 'plastico') > 1.5 * tau('banho', 'inox'), 'no banho a parede de plástico pesa (quase dobra τ)');
  /* τ ∝ massa/área ∝ V^(1/3) quando a resistência não depende do tamanho */
  assert.ok(Math.abs(tau('geladeira', 'inox', 8) / tau('geladeira', 'inox', 1) - 2) < 1e-9);
  /* banho: topo no ar da cozinha puxa o equilíbrio um pouco acima de 0 °C */
  const B = E.coolStage(1, 1.08, { mode: 'banho', vessel: 'inox', Tair: 24, Tamb: 24 }); assert.ok(B.Teq > 0 && B.Teq < 1);
});

test('potTau da maturação continua o mesmo de antes da mudança de camada', () => {
  const { m } = mk('Fiordilatte'); const kg = m.tot / 1000, V = kg / (m.rhoMix * 1000);
  assert.ok(Math.abs(E.potTau(m) - kg * 3300 / (9 * 6 * Math.pow(V, 2 / 3) * .85) / 3600) < 1e-12);
  assert.ok(Math.abs(E.probeFit({ probe: '6,5@90', entryT: 10 }, 4) - (-1.5 / Math.log(2.5 / 6))) < 1e-12);
});

test('armazenamento: solução exata linearizada concorda com a simulação não linear (heatSim)', () => {
  for (const n of ['Fiordilatte', 'Sorbetto di fragola']) for (const ml of [250, 1000]) for (const P of [.5, 3]) {
    const { m, proc } = mk(n, { poteMl: ml, storeT: -18 });
    const a = E.storeResponse(m, proc, P, 1), b = E.storeResponseSim(m, proc, P, 1);
    assert.ok(Math.abs(a.scoop - b.scoop) < .02 && Math.abs(a.core - b.core) < .02, `${n} ${ml} mL ${P} h: ${a.scoop.toFixed(3)}/${b.scoop.toFixed(3)} · ${a.core.toFixed(3)}/${b.core.toFixed(3)}`);
  }
});

test('armazenamento: amplitude cai da superfície ao centro, cresce com o período e tende ao ar', () => {
  const { m, proc } = mk('Pistacchio'); let prev = 0;
  for (const P of [.25, 1, 3, 24, 240]) { const r = E.storeResponse(m, proc, P, 2);
    assert.ok(r.core <= r.scoop + 1e-9 && r.scoop <= r.surf + 1e-9 && r.surf <= 2 + 1e-9, 'centro ≤ camada ≤ superfície ≤ ar');
    assert.ok(r.scoop > prev, 'período maior chega mais'); prev = r.scoop; }
  assert.ok(prev > 1.95, 'oscilação de 10 dias chega inteira');
  assert.ok(E.storeResponse(m, proc, .25, 2).core < .1, 'ciclo de 15 min quase não chega ao centro');
});

test('ciclo: etapas encadeadas, saída de uma = entrada da outra, e fidelidade declarada', () => {
  const { m, proc } = mk('Fiordilatte'); const T = E.cycleTwin(m, proc, { fridge: 4.5, fridgeSrc: 'teste' });
  assert.equal(T.stages.map(s => s.k).join(), ['past', 'cool', 'mat', 'maq', 'hard', 'store', 'temp', 'serve'].join());
  const g = k => T.stages.find(s => s.k === k);
  assert.equal(g('cool').T0, g('past').T1); assert.equal(g('mat').T0, g('cool').T1); assert.equal(g('maq').T0, g('mat').T1);
  assert.equal(g('past').fid, 'none', 'aquecimento não é simulado');
  assert.ok(!T.stages.some(s => s.fid === 'sync') && T.sync === false, 'nada sincronizado sem medições contínuas');
  assert.ok(g('past').curve == null && g('maq').curve == null, 'sem curva onde não há modelo do tempo');
  /* mantecação: com a calda na temperatura do processo, o tempo é o ciclo informado */
  const T2 = E.cycleTwin(m, { ...proc, matH: 48 }, { fridge: proc.matT });
  assert.ok(Math.abs(T2.stages.find(s => s.k === 'maq').min - proc.drawMin) < .2, 'calda no matT → ciclo informado');
  const T3 = E.cycleTwin(m, { ...proc, coolMode: 'geladeira', coolVessel: 'plastico', matH: 4 }, { fridge: 4.5 });
  assert.ok(T3.Tin > T.Tin && T3.stages.find(s => s.k === 'maq').min > g('maq').min, 'calda mais quente → mantecação mais longa');
  assert.ok(T3.stages.find(s => s.k === 'mat').hEff < g('mat').hEff, 'geladeira direto encurta a maturação efetiva');
  /* calibração: τ medido pela calda marca a maturação como calibrada */
  assert.equal(E.cycleTwin(m, proc, { fridge: 4.5, tauFit: 1.5, tauSrc: 'medido' }).stages.find(s => s.k === 'mat').fid, 'cal');
  assert.equal(E.cycleTwin(m, proc, { fridge: 4.5, tauFit: .25, tauSrc: 'equipamento' }).stages.find(s => s.k === 'mat').fid, 'mec');
});

test('ciclo: modo pote tem temperagem simulada; tempo total soma as etapas; rápido', () => {
  const { m, proc } = mk('Nocciola', { serveFrom: 'pote', poteMl: 250 }); const t0 = performance.now();
  const T = E.cycleTwin(m, proc, { fridge: 4 }); const ms = performance.now() - t0;
  const tp = T.stages.find(s => s.k === 'temp'); assert.equal(tp.fid, 'mec'); assert.ok(tp.tReady > 0);
  const sum = ['cool', 'mat', 'maq', 'hard'].reduce((a, k) => a + T.stages.find(s => s.k === k).min, 0) + tp.tReady;
  assert.ok(Math.abs(T.totMin - sum) < 1e-6);
  assert.equal(E.twinRows(T).length, 11);
  assert.ok(ms < 1500, ms + ' ms');
});

test('câmara térmica: campo completo coerente com o centro e a borda, parede retarda, temperagem esquenta de fora para dentro', () => {
  const { m, proc } = mk('Fiordilatte');
  const A = E.chamberRun(m, { mode: 'hard', ml: 500, proc, min: 180 }), B = E.chamberRun(m, { mode: 'hard', ml: 500, vessel: 'plastico', proc, min: 180 });
  assert.equal(A.field.length, A.times.length); assert.equal(A.field[0].length, 14);
  A.field.forEach((f, j) => { assert.ok(Math.abs(f[0] - A.core[j]) < 1e-12, 'centro = primeira camada'); });
  const last = A.field.length - 1; assert.ok(A.field[last][13] <= A.field[last][0] + 1e-9, 'no endurecimento a borda está mais fria que o centro');
  assert.ok(B.hEff < B.h && B.core[last] > A.core[last], 'parede de plástico: troca efetiva menor e centro mais quente no mesmo tempo');
  const T = E.chamberRun(m, { mode: 'temper', ml: 250, proc, min: 30 }); const tl = T.field.length - 1;
  assert.ok(T.field[tl][13] > T.field[tl][0], 'na temperagem a borda esquenta antes do centro');
  /* mesmo resultado do modelo usado no resto do app (sem parede) */
  const H = E.hardenModel(m, proc, 500); const ix = A.times.findIndex(t => t >= 60); const hx = H.curve.find(c => c.t >= A.times[ix]);
  assert.ok(Math.abs(A.core[ix] - hx.core) < .6, `centro a ~1 h: câmara ${A.core[ix].toFixed(2)} × endurecimento ${hx.core.toFixed(2)} (malhas diferentes)`);
});
