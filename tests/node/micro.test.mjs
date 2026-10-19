/* Microestrutura e reologia (v18.16 · §17–18). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const mk = n => { const p = E.PRESETS.find(x => x.name === n); return E.analyze(E.stTest({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })) }, p.vit)); };

test('fases: volumes somam 1, sem gelo acima do ponto de congelamento, matriz se concentra no frio', () => {
  for (const n of ['Fiordilatte', 'Sorbetto di fragola', 'Cioccolato fondente', 'Cocco vegano']) {
    const m = mk(n); let prev = null;
    for (const p of E.phaseProfile(m, -30, -2, 1)) {
      const s = p.vol.ice + p.vol.air + p.vol.fat + p.vol.mat; assert.ok(Math.abs(s - 1) < 1e-9, n + ' soma ' + s);
      assert.ok(p.cf >= 1 - 1e-9 && p.conc < 100, n + ' crioconcentração');
      if (prev) { assert.ok(p.conc <= prev.conc + 1e-9 && p.vol.ice <= prev.vol.ice + 1e-9, n + ': mais quente, menos gelo e matriz menos concentrada'); assert.ok(p.logEtaMat <= prev.logEtaMat + 1e-9); }
      prev = p;
    }
    const warm = E.phaseAt(m, m.fp + .5); assert.equal(warm.ice, 0); assert.ok(Math.abs(warm.cf - 1) < 1e-9);
    /* ar: a fração de volume é a do overrun (V_ar / V_produto = ov / (100 + ov)) quando não há gelo */
    assert.ok(Math.abs(warm.vol.air - m.ov / (100 + m.ov)) < .02, n + ' ar ' + warm.vol.air);
  }
});

test('WLF: 10¹² Pa·s em Tg′ e queda monotônica acima dela', () => {
  const m = mk('Fiordilatte'); const at = dT => E.phaseAt(m, m.tg + dT).logEtaMat;
  assert.equal(at(0), 12); assert.ok(Math.abs(at(20) - (12 - 17.44 * 20 / 71.6)) < 1e-9);
});

test('distribuição de cristais hipotética: área 1, média certa, fração acima de 50 µm coerente', () => {
  for (const [mu, cv] of [[30, .35], [45, .6], [60, .45]]) {
    const d = E.crystalDist(mu, cv, 400); let area = 0, mean = 0, above = 0; const dx = 400 / 60;
    /* integração fina independente */
    for (let x = .01; x < 400; x += .01) { const k = 1 / (cv * cv), th = mu * cv * cv; const f = Math.exp((k - 1) * Math.log(x) - x / th - E.lgam(k) - k * Math.log(th)); area += f * .01; mean += x * f * .01; if (x > 50) above += f * .01; }
    assert.ok(Math.abs(area - 1) < 1e-3 && Math.abs(mean - mu) < .05, `μ ${mu}`); assert.ok(Math.abs(d.above50 - above * 100) < .1, `acima de 50: ${d.above50} × ${above * 100}`);
  }
  const m = mk('Fiordilatte'); const a = E.crystalAging(m, [0, 7, 30]); assert.equal(a[0].mean, m.crystal); assert.ok(a[2].mean > a[1].mean && a[1].mean > a[0].mean);
});

test('reologia: lei de potência e Herschel–Bulkley recuperam parâmetros plantados', () => {
  const K = 2000, n = .55; const pts = [5, 10, 20, 50, 100, 200].map(g => [g, K * Math.pow(g, n - 1)]);
  const f = E.rheoFit(pts); assert.ok(Math.abs(f.n - n) < 1e-9 && Math.abs(f.K - K) < 1e-6 && f.r2 > .999999); assert.match(f.kind, /pseudoplástico/);
  const t0 = 3, KH = 1.2, nH = .7; const hb = [2, 5, 10, 30, 60, 120].map(g => [g, (t0 + KH * Math.pow(g, nH)) / g * 1000]);
  const h = E.rheoFit(hb).hb; assert.ok(Math.abs(h.tau0 - t0) < .15 && Math.abs(h.n - nH) < .05 && h.r2 > .999, JSON.stringify(h));
  assert.equal(E.parseRheo('10:850; 50,0 = 420 ; lixo; 100 300').map(x => x.join(':')).join(), '10:850,50:420,100:300');
  assert.equal(E.rheoFit([[10, 5]]), null);
});

test('validação: cristal medido e viscosidade da calda entram como grandezas deixa-um-fora', () => {
  const p = E.PRESETS.find(x => x.name === 'Fiordilatte');
  const L = { id: 'm1', code: 'M1', tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })), meas: { iceMean: 42, rheo: '10:900; 50:500; 100:380', rheoT: 4 } };
  const C = E.fitCalibration([L]); const r = C.res[0];
  assert.ok(Array.isArray(r.ice) && r.ice[1] === 42); assert.ok(Array.isArray(r.visc) && Math.abs(r.visc[1] - Math.log10(E.rheoFit(E.parseRheo(L.meas.rheo)).at(50))) < 1e-3);
  const V = E.validateLOO(C.res); assert.equal(V.ice.all.n, 1); assert.equal(V.visc.all.n, 1);
  const L2 = { ...L, id: 'm2', meas: { rheo: '10:900; 50:500', rheoT: 20 } }; assert.ok(!E.fitCalibration([L2]).res[0].visc, 'leitura fora de 2–8 °C não compara com o motor (4 °C)');
});
