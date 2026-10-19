/* Arquitetura computacional (v18.14 · §11–13): a otimização do heatSim não muda nenhum número, o protótipo em
   WebAssembly calcula o mesmo, e a bateria de desempenho roda inteira e dentro do orçamento. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { loadEngine } from './harness.mjs';
const require = createRequire(import.meta.url);
const E = loadEngine(); E.CAL.on = false;
const heatSimRef = require('./ref/heatsim-v18_13.cjs')(E.clamp, .015);
const mk = n => { const p = E.PRESETS.find(x => x.name === n); return E.analyzeRaw({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc: { ...E.PROC0 }, brix: {}, costs: {} }); };

test('heatSim otimizado dá exatamente o mesmo resultado da versão anterior (pote, endurecimento, oscilação, parada antecipada)', () => {
  for (const n of ['Fiordilatte', 'Sorbetto di fragola', 'Cocco vegano']) {
    const m = mk(n);
    const cases = [
      { ml: 500, N: 12, T0: -18, Tamb: () => 23, h: 10, tMax: 2400 },
      { ml: 250, N: 10, T0: -4, Tamb: t => t < 7200 ? -24 : -19.5, h: 14, tMax: 43200, step: 60, dtMax: 30 },
      { ml: 1000, N: 8, T0: -18, Tamb: t => -18 + Math.sin(t / 900), h: 14, tMax: 10800, step: 225, dtMax: 4.5 }];
    for (const o of cases) {
      const a = E.heatSim(m, o), b = heatSimRef(m, o);
      assert.equal(JSON.stringify(a), JSON.stringify(b), n + ' ' + o.ml + ' mL');
    }
    /* parada pelo watch: mesmo instante e mesmo estado */
    let ta = null, tb = null; const w = r => s => { if (s.scoop >= -12) { r(s.t); return true; } return false; };
    E.heatSim(m, { ml: 500, N: 12, T0: -18, Tamb: () => 23, h: 10, tMax: 2400, watch: w(t => { ta = t; }) });
    heatSimRef(m, { ml: 500, N: 12, T0: -18, Tamb: () => 23, h: 10, tMax: 2400, watch: w(t => { tb = t; }) });
    assert.equal(ta, tb);
  }
});

test('protótipo WebAssembly (tools/wasm-proto) calcula a mesma curva que o JavaScript (até 1e-12 °C)', async () => {
  const { wasmCompare } = require('../../tools/wasm-proto/compare.js');
  const r = await wasmCompare(E, fs.readFileSync(new URL('../../tools/wasm-proto/heat.wasm', import.meta.url)), 1);
  assert.equal(r.casos.length, 3);
  for (const c of r.casos) { assert.equal(c.pontosJS, c.pontosWasm, c.id); assert.ok(c.difMax < 1e-12 && c.difOtim < 1e-12, c.id + ' ' + c.difMax); }
});

test('bateria de desempenho: as 12 operações rodam, e as diárias ficam abaixo de 50 ms no Node', () => {
  const r = E.benchRun({ scale: .3 });
  assert.equal(r.ops.length, 12);
  for (const o of r.ops) { assert.ok(isFinite(o.med) && o.med >= 0, o.id); if (o.cls === 'diario') assert.ok(o.med < 50, `${o.id}: ${o.med.toFixed(1)} ms`); else assert.ok(o.med < 2000, o.id); }
  assert.equal(E.benchVerdict({ med: 40, budget: 50 }), 'ok'); assert.equal(E.benchVerdict({ med: 90, budget: 50 }), 'warn'); assert.equal(E.benchVerdict({ med: 120, budget: 50 }), 'crit');
});

test('trecho do Web Worker tem tudo de que as tarefas precisam (Monte Carlo e bateria)', () => {
  const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const a = html.indexOf('/* ==== 01-util.js ==== */'), b = html.indexOf('/* ==== 33-golden.js ==== */'); const w = html.slice(a, b);
  for (const f of ['function mulberry32', 'function uncertaintyMC', 'function benchRun', 'function cycleTwin', 'function storeResponse', 'function fitCalibration', 'function registerNeutro', 'var DEX_PREF'])
    assert.ok(w.includes(f), f + ' fora do trecho do worker');
});

test('medição em lote é correta com relógio de 1 ms (Safari) e nunca mede o cache', () => {
  const real = () => performance.now(), coarse = () => Math.floor(performance.now());
  const busy = us => { const t = real(); while (real() - t < us / 1000); };
  for (const us of [5, 60, 400, 3000]) {
    const r = E.benchRun({ now: coarse, ops: [{ id: 'x', n: 'x', cls: 'diario', reps: 9, fn: () => busy(us) }] });
    const med = r.ops[0].med * 1000; assert.ok(Math.abs(med - us) / us < .15, `${us} µs medido como ${med.toFixed(1)} µs (lote ${r.ops[0].inner})`);
  }
  /* cada execução recebe um k diferente: nada se repete dentro de uma medição */
  const ks = []; E.benchRun({ ops: [{ id: 'k', n: 'k', cls: 'diario', reps: 9, fn: k => { ks.push(k); busy(20); } }] });
  assert.equal(new Set(ks).size, ks.length);
});

