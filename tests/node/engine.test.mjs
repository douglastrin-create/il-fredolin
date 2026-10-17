/* Motor científico: bateria interna (runTests) + verificação matemática independente da simulação térmica. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';

const E = loadEngine();

test('bateria interna do app (runTests) passa inteira', () => {
  const r = E.runTests();
  const fails = r.list.filter(t => !t.ok).map(t => `${t.group} · ${t.name}: ${t.detail}`);
  assert.equal(fails.length, 0, fails.join('\n'));
  assert.ok(r.pass >= 24, `esperava ≥ 24 testes, rodaram ${r.pass}`);
});

test('curva de congelamento: monotônica, invertível e contínua na emenda tabela↔Norrish (180 g)', () => {
  let prev = -1;
  for (let se = 0; se <= 400; se += 0.5) { const d = E.fpdSE(se); assert.ok(d >= prev - 1e-12, `não monotônica em ${se}`); prev = d; }
  for (const se of [10, 90, 179, 181, 250, 380]) assert.ok(Math.abs(E.seFromFpd(E.fpdSE(se)) - se) < 1e-6);
  assert.ok(Math.abs(E.fpdSE(180 - 1e-9) - E.fpdSE(180 + 1e-9)) < 1e-6, 'descontinuidade na emenda');
});

test('fração congelada respeita a água não congelável (Cg′) e cresce com o frio', () => {
  const SE = 30, S = 0.5; let prev = 0;
  for (let T = -1; T >= -45; T -= 1) { const f = E.frozenPct(T, SE, S); assert.ok(f >= prev - 1e-9); assert.ok(f <= 100 * (1 - SE / 400) + 1e-9); prev = f; }
});

/* Referência independente: método da entalpia (variável de estado = entalpia, conservativo por construção),
   mesma geometria e mesmas propriedades do app. Mede se o esquema do app (capacidade térmica aparente explícita)
   conserva energia e converge com a malha. */
function enthalpyReference(m, { ml, N, T0, Ta, h, stopCore, tMax }) {
  const V = ml / 1e6, r = Math.cbrt(V / (2 * Math.PI)), rho = Math.min(1150, Math.max(350, m.gPerL)), w = m.wat / 100;
  const eps = Math.min(0.6, Math.max(0, m.ov / (100 + m.ov))), TL = -45, d = 0.01;
  const phi = T => (T >= m.fp ? 0 : m.fz(T) / 100);
  const HT = [0]; for (let T = TL + d, acc = 0; T <= 10 + 1e-9; T += d) { acc += 1000 * (1.75 + 2.4 * w * (1 - phi(T - d / 2))) * d; HT.push(acc + 334000 * w * (phi(TL) - phi(T))); }
  const H = T => { const x = (T - TL) / d, j = Math.min(HT.length - 2, Math.max(0, Math.floor(x))); return HT[j] + (HT[j + 1] - HT[j]) * (x - j); };
  const Tof = hv => { let lo = 0, hi = HT.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (HT[mid] < hv) lo = mid; else hi = mid; } return TL + d * (lo + (hv - HT[lo]) / ((HT[hi] - HT[lo]) || 1)); };
  const k = T => (0.45 + 1.7 * phi(T) * w) * (1 - eps) / (1 + eps / 2);
  const dr = r / N, vol = [], area = []; for (let i = 0; i < N; i++) { vol.push(4 / 3 * Math.PI * (((i + 1) * dr) ** 3 - (i * dr) ** 3)); area.push(4 * Math.PI * ((i + 1) * dr) ** 2); }
  const Tn = new Float64Array(N).fill(T0), Hn = new Float64Array(N).fill(H(T0)); let t = 0, Qin = 0;
  const E0 = Hn.reduce((a, v, i) => a + rho * vol[i] * v, 0);
  while (t < tMax) {
    let dt = 30; for (let i = 0; i < N; i++) { let G = 0; const kc = k(Tn[i]); if (i < N - 1) G += kc * area[i] / dr; if (i > 0) G += kc * area[i - 1] / dr; if (i === N - 1) G += h * area[i]; dt = Math.min(dt, 0.4 * rho * 1750 * vol[i] / G); }
    const q = new Float64Array(N);
    for (let i = 0; i < N; i++) { const kc = k(Tn[i]); if (i < N - 1) q[i] += (kc + k(Tn[i + 1])) / 2 * area[i] / dr * (Tn[i + 1] - Tn[i]); if (i > 0) q[i] += (kc + k(Tn[i - 1])) / 2 * area[i - 1] / dr * (Tn[i - 1] - Tn[i]);
      if (i === N - 1) { const b = (Ta - Tn[i]) / (dr / 2 / (kc * area[i]) + 1 / (h * area[i])); q[i] += b; Qin += b * dt; } }
    for (let i = 0; i < N; i++) { Hn[i] += q[i] * dt / (rho * vol[i]); Tn[i] = Tof(Hn[i]); }
    t += dt; if (stopCore != null && Tn[0] <= stopCore) break;
  }
  const E1 = Hn.reduce((a, v, i) => a + rho * vol[i] * v, 0);
  return { min: t / 60, energyErr: Math.abs(E1 - E0 - Qin) / Math.abs(Qin) };
}

test('endurecimento (heatSim): converge com a malha e concorda com a referência por entalpia (±3%)', () => {
  E.CAL.on = false;
  const rec = E.testRecipes().find(r => /Fiordilatte/.test(r.name));
  const st = E.stTest(rec, -12);
  const m = E.analyze(st);
  const pr = { ...st.proc, drawT: -4, storeT: -24, blastT: -24, turboMin: 0 };
  const times = [10, 20, 40].map(n => { E.setHardN(n); m._hard = null; return E.hardenModel(m, pr, 470).tDone; });
  E.setHardN(10); m._hard = null;
  const ref = enthalpyReference(m, { ml: 470, N: 20, T0: Math.min(-4, m.fp - 0.2), Ta: -24, h: 14, stopCore: -18, tMax: 12 * 3600 });
  assert.ok(ref.energyErr < 1e-6, `referência não conserva energia: ${ref.energyErr}`);
  assert.ok(Math.abs(times[0] - times[2]) / times[2] < 0.02, `malha N=10 vs N=40: ${times}`);
  assert.ok(Math.abs(times[0] - ref.min) / ref.min < 0.03, `app ${times[0].toFixed(1)} min × referência ${ref.min.toFixed(1)} min`);
});
